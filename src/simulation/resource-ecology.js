/** Deterministic local resource authority, presentation, and conservation proof. */
import { BALANCE as B } from '../game/balance.js';
import { clamp01 } from '../core/math.js';

export const RESOURCE_STATE = Object.freeze({
  UNKNOWN: 0, ABUNDANT: 1, FERTILE: 2, STRAINED: 3, POOR: 4,
  DEPLETED: 5, EXHAUSTED: 6, RECOVERING: 7,
});
export const RESOURCE_STATE_LABELS = Object.freeze([
  'Unknown', 'Abundant', 'Fertile', 'Strained', 'Poor', 'Depleted', 'Exhausted', 'Recovering',
]);
export const RESOURCE_THRESHOLDS = Object.freeze({ abundant: .72, fertile: .56, strained: .42, poor: .28, depleted: .12 });
const HYSTERESIS = .018;

export function createResourceAuthority(fields) {
  const initialAvailableNutrient = fields.baseNutrient.slice();
  const initialResourceReserve = new Float32Array(initialAvailableNutrient.length);
  for (let cell = 0; cell < initialResourceReserve.length; cell++) {
    const renewal = Math.max(.25, fields.resourceRenewal?.[cell] ?? 1);
    const freshwater = freshwaterSupportForFields(fields, cell);
    initialResourceReserve[cell] = Math.fround(initialAvailableNutrient[cell]
      * B.RESOURCE_RESERVE_SCALE * renewal * (1 + freshwater * B.FRESHWATER_RESERVE_BONUS));
  }
  const resourceReserve = initialResourceReserve.slice();
  const recyclableResource = new Float32Array(initialAvailableNutrient.length);
  const initialResourceRichness = new Float32Array(initialAvailableNutrient.length);
  for (let cell = 0; cell < initialResourceRichness.length; cell++) {
    initialResourceRichness[cell] = Math.fround(richnessFrom(fields, cell,
      initialAvailableNutrient[cell], initialAvailableNutrient[cell], initialResourceReserve[cell], initialResourceReserve[cell]));
  }
  const resourceQuintile = assignQuintiles(initialResourceRichness);
  const initialFreshwaterCatchmentReserve = Float32Array.from(fields.lakes ?? [], (lake) => {
    const quality = lake.salinity === 'fresh' ? 1 : lake.salinity === 'brackish' ? .48 : .08;
    return Math.fround((lake.area * 1.4 + Math.min(120, lake.catchment) * .42 + lake.meanDepth * 24) * quality);
  });
  const freshwaterCatchmentReserve = initialFreshwaterCatchmentReserve.slice();
  return {
    initialAvailableNutrient, initialResourceReserve, resourceReserve, recyclableResource,
    initialFreshwaterCatchmentReserve, freshwaterCatchmentReserve,
    initialResourceRichness, resourceQuintile,
    initialStock: sum(initialAvailableNutrient) + sum(initialResourceReserve) + sum(initialFreshwaterCatchmentReserve),
  };
}

export function installResourceState(state, authority) {
  const count = authority.resourceReserve.length;
  Object.assign(state, authority, {
    nutrient: authority.initialAvailableNutrient.slice(),
    resourceRichness: authority.initialResourceRichness.slice(),
    resourceState: new Uint8Array(count),
    resourceWasDepleted: new Uint8Array(count),
    resourceRecoveredMask: new Uint8Array(count),
    resourceRecoveredCells: 0, firstResourceExhaustionTick: 0,
    resourceExternalAdditions: 0,
    resourceReclaimed: 0,
    resourceConsumed: 0,
    resourceLost: 0,
    resourceTransferred: 0,
    resourceDepletedCells: 0,
    freshwaterSupportedCellTicks: 0,
    resourceLivingTicksByQuintile: new Float64Array(5),
    resourceBirthsByQuintile: new Uint32Array(5), resourceBirthRichnessSum: 0, resourceBirthCount: 0,
  });
  updateResourceEcology(state, true);
}

/** Current bounded richness; pure and safe for pre-RNG access checks. */
export function resourceRichnessAt(state, cell) {
  return richnessFrom(state.fields, cell, state.nutrient[cell], state.initialAvailableNutrient[cell],
    state.resourceReserve[cell], state.initialResourceReserve[cell], state.moisture?.[cell], state.temperature?.[cell],
    state.dynamicFreshwaterSupport?.[cell]);
}

export function reserveFractionAt(state, cell) {
  const initial = state.initialResourceReserve[cell];
  return initial > 0 ? clamp01(state.resourceReserve[cell] / initial) : 0;
}

export function freshwaterSupportAt(state, cell) {
  let generated = freshwaterSupportForFields(state.fields, cell);
  const lake = state.fields.freshwaterLakeId?.[cell] ?? -1;
  if (lake >= 0 && state.freshwaterCatchmentReserve && state.initialFreshwaterCatchmentReserve) {
    const initial = state.initialFreshwaterCatchmentReserve[lake]; const remaining = initial > 0 ? clamp01(state.freshwaterCatchmentReserve[lake] / initial) : 0;
    generated *= .35 + remaining * .65;
  }
  return clamp01(Math.max(generated, state.dynamicFreshwaterSupport?.[cell] ?? 0));
}

export function updateResourceEcology(state, initialize = false) {
  let depleted = 0;
  for (let cell = 0; cell < state.topo.nodeCount; cell++) {
    const richness = resourceRichnessAt(state, cell);
    state.resourceRichness[cell] = Math.fround(richness);
    let next = classifiedState(state, cell, richness);
    const previous = state.resourceState[cell];
    if (!initialize && stableNearBoundary(previous, next, richness)) next = previous;
    state.resourceState[cell] = next;
    if (next === RESOURCE_STATE.DEPLETED || next === RESOURCE_STATE.EXHAUSTED) {
      state.resourceWasDepleted[cell] = 1; depleted++;
      if (next === RESOURCE_STATE.EXHAUSTED && !state.firstResourceExhaustionTick && state.tick > 0)
        state.firstResourceExhaustionTick = state.tick;
    }
    if (next === RESOURCE_STATE.RECOVERING && !state.resourceRecoveredMask[cell]) {
      state.resourceRecoveredMask[cell] = 1; state.resourceRecoveredCells++;
    }
    if (state.alive[cell]) {
      state.resourceLivingTicksByQuintile[state.resourceQuintile[cell]]++;
      if (freshwaterSupportAt(state, cell) > .08) state.freshwaterSupportedCellTicks++;
    }
  }
  state.resourceDepletedCells = depleted;
}

export function consumeFounderFreshwater(state, requestedEnergy) {
  if (!(requestedEnergy > 0) || !(state.founderFreshwaterReserve > 0)) return 0;
  const before = state.founderFreshwaterReserve; const requestedStock = requestedEnergy / B.CONVERSION;
  const after = Math.max(0, before - Math.min(before, requestedStock)); state.founderFreshwaterReserve = after;
  const consumed = before - after; state.resourceConsumed += consumed; return consumed * B.CONVERSION;
}

export function consumeFreshwaterCatchment(state, cell, requestedEnergy) {
  if (!(requestedEnergy > 0)) return 0;
  const lake = state.fields.freshwaterLakeId?.[cell] ?? -1; if (lake < 0) return 0;
  const before = state.freshwaterCatchmentReserve[lake]; const requestedStock = requestedEnergy / B.CONVERSION;
  const after = Math.fround(Math.max(0, before - Math.min(before, requestedStock)));
  state.freshwaterCatchmentReserve[lake] = after; const consumed = Math.max(0, before - after);
  state.resourceConsumed += consumed; return consumed * B.CONVERSION;
}

export function consumeNutrient(state, cell, requested) {
  if (!(requested > 0)) return 0;
  const before = state.nutrient[cell];
  const after = Math.fround(Math.max(0, before - Math.min(before, requested)));
  state.nutrient[cell] = after;
  const actual = Math.max(0, before - after);
  state.resourceConsumed += actual;
  return actual;
}

export function transferReserve(state, cell, requested) {
  if (!(requested > 0)) return 0;
  const beforeAvailable = state.nutrient[cell]; const beforeReserve = state.resourceReserve[cell];
  const target = Math.min(beforeReserve, requested, Math.max(0, 1 - beforeAvailable));
  const afterAvailable = Math.fround(clamp01(beforeAvailable + target));
  const added = Math.max(0, afterAvailable - beforeAvailable);
  const afterReserve = Math.fround(Math.max(0, beforeReserve - added));
  state.nutrient[cell] = afterAvailable; state.resourceReserve[cell] = afterReserve;
  const removed = Math.max(0, beforeReserve - afterReserve);
  reconcileRounding(state, added - removed);
  state.resourceTransferred += Math.min(added, removed);
  return added;
}

export function addExternalNutrient(state, cell, requested) {
  if (!(requested > 0)) return 0;
  const before = state.nutrient[cell]; const after = Math.fround(clamp01(before + requested));
  state.nutrient[cell] = after; const actual = Math.max(0, after - before);
  state.resourceExternalAdditions += actual; return actual;
}

export function loseNutrient(state, cell, requested) {
  if (!(requested > 0)) return 0;
  const before = state.nutrient[cell]; const after = Math.fround(Math.max(0, before - requested));
  state.nutrient[cell] = after; const actual = Math.max(0, before - after);
  state.resourceLost += actual; return actual;
}

/** Explicit detritus conversion adds accounted recyclable stock. */
export function reclaimDetritusResource(state, cell, requested) {
  if (!(requested > 0)) return 0;
  const before = state.recyclableResource[cell];
  const after = Math.fround(Math.min(2, before + requested));
  state.recyclableResource[cell] = after; const actual = Math.max(0, after - before);
  state.resourceReclaimed += actual; return actual;
}

export function transferRecyclable(state, cell, requested) {
  if (!(requested > 0)) return 0;
  const beforeStored = state.recyclableResource[cell]; const beforeAvailable = state.nutrient[cell];
  const target = Math.min(beforeStored, requested, Math.max(0, 1 - beforeAvailable));
  const afterAvailable = Math.fround(clamp01(beforeAvailable + target)); const added = Math.max(0, afterAvailable - beforeAvailable);
  const afterStored = Math.fround(Math.max(0, beforeStored - added));
  state.nutrient[cell] = afterAvailable; state.recyclableResource[cell] = afterStored;
  const removed = Math.max(0, beforeStored - afterStored); reconcileRounding(state, added - removed);
  state.resourceTransferred += Math.min(added, removed); return added;
}

export function resourceConservation(state) {
  const expected = state.initialResourceStock + state.resourceExternalAdditions + state.resourceReclaimed
    - state.resourceConsumed - state.resourceLost;
  const actual = sum(state.nutrient) + sum(state.resourceReserve) + sum(state.recyclableResource)
    + sum(state.freshwaterCatchmentReserve) + (state.founderFreshwaterReserve ?? 0);
  return Object.freeze({ initial: state.initialResourceStock, external: state.resourceExternalAdditions,
    reclaimed: state.resourceReclaimed, consumed: state.resourceConsumed, lost: state.resourceLost,
    actual, expected, error: actual - expected });
}

export function packResourcePresentation(state) {
  const count = state.topo.nodeCount; const resourceRichnessQ = new Uint8Array(count);
  const reserveFractionQ = new Uint8Array(count); const resourceState = state.resourceState.slice();
  for (let cell = 0; cell < count; cell++) {
    resourceRichnessQ[cell] = Math.round(clamp01(state.resourceRichness[cell]) * 255);
    reserveFractionQ[cell] = Math.round(reserveFractionAt(state, cell) * 255);
  }
  return { resourceRichnessQ, reserveFractionQ, resourceState };
}

function richnessFrom(fields, cell, currentAvailable, initialAvailable, currentReserve, initialReserve,
  moisture = fields.baseMoisture[cell], temperature = fields.baseTemp[cell], dynamicFreshwater = 0) {
  const available = clamp01(currentAvailable / .82);
  const reserveFraction = initialReserve > 0 ? clamp01(currentReserve / initialReserve) : 0;
  const capacity = clamp01((initialAvailable + initialReserve) / 1.55);
  const reserve = reserveFraction * capacity;
  const renewal = clamp01(((fields.resourceRenewal?.[cell] ?? .3) - .25) / 1.0);
  const fresh = clamp01(Math.max(freshwaterSupportForFields(fields, cell), dynamicFreshwater ?? 0));
  const climate = climateSuitability(moisture, temperature);
  return clamp01(.40 * available + .32 * reserve + .12 * renewal + .10 * fresh + .06 * climate);
}

function freshwaterSupportForFields(fields, cell) {
  const influence = fields.freshwaterInfluence?.[cell] ?? 0;
  const tier = fields.freshwaterTier?.[cell] ?? (influence > .78 ? 4 : influence > .5 ? 3 : influence > .28 ? 2 : influence > .08 ? 1 : 0);
  return clamp01(influence * (.72 + tier * .07));
}

function climateSuitability(moisture, temperature) {
  const moist = clamp01(1 - Math.abs((moisture ?? .5) - .55) / .55);
  const temp = clamp01(1 - Math.abs((temperature ?? .6) - .6) / .6);
  return Math.sqrt(moist * temp);
}

function classifiedState(state, cell, richness) {
  const initial = state.initialResourceRichness[cell];
  if (initial >= RESOURCE_THRESHOLDS.strained && state.nutrient[cell] <= .01 && reserveFractionAt(state, cell) <= .01)
    return RESOURCE_STATE.EXHAUSTED;
  if (state.resourceWasDepleted[cell] && richness >= RESOURCE_THRESHOLDS.poor && richness < RESOURCE_THRESHOLDS.fertile) return RESOURCE_STATE.RECOVERING;
  if (richness >= RESOURCE_THRESHOLDS.abundant) return RESOURCE_STATE.ABUNDANT;
  if (richness >= RESOURCE_THRESHOLDS.fertile) return RESOURCE_STATE.FERTILE;
  if (richness >= RESOURCE_THRESHOLDS.strained) return RESOURCE_STATE.STRAINED;
  if (richness >= RESOURCE_THRESHOLDS.poor || initial < RESOURCE_THRESHOLDS.strained) return RESOURCE_STATE.POOR;
  if (richness >= RESOURCE_THRESHOLDS.depleted) return RESOURCE_STATE.DEPLETED;
  return RESOURCE_STATE.EXHAUSTED;
}

function stableNearBoundary(previous, next, value) {
  if (!previous || previous === next || previous === RESOURCE_STATE.RECOVERING || next === RESOURCE_STATE.RECOVERING) return false;
  const boundaries = [.72, .56, .42, .28, .12];
  return Math.abs(previous - next) === 1 && boundaries.some((boundary) => Math.abs(value - boundary) <= HYSTERESIS);
}
function reconcileRounding(state, stockDelta) {
  if (stockDelta > 0) state.resourceExternalAdditions += stockDelta;
  else if (stockDelta < 0) state.resourceLost += -stockDelta;
}
function assignQuintiles(values) {
  const order = Array.from(values, (_, cell) => cell).sort((a, b) => values[a] - values[b] || a - b);
  const result = new Uint8Array(values.length);
  for (let rank = 0; rank < order.length; rank++) result[order[rank]] = Math.min(4, Math.floor(rank * 5 / order.length));
  return result;
}
function sum(values) { let total = 0; for (const value of values) total += value; return total; }
