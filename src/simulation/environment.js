/**
 * Environmental phase: global entropy curve, seasonal fields, nutrient
 * regeneration, toxin accumulation, and active-event application.
 *
 * Curves are precomputed LUTs (built once per run) so the per-tick path uses
 * only array lookups and arithmetic. LUT construction may use Math.sin/pow —
 * that happens once per engine and never inside the tick.
 */
import { BALANCE as B } from '../game/balance.js';
import { clamp01, smootherstep } from '../core/math.js';
import { eventEnvelopeAt } from './events.js';
import { REACH_CAUSE } from './lifecycle/reach-ledger.js';
import { addExternalNutrient, freshwaterSupportAt, loseNutrient, transferReserve } from './resource-ecology.js';

/** Global deterioration curve, indexed by tick. 0 until rise start, 1 at end. */
export function buildEntropyLut(worldEra = 1) {
  const len = B.RUN_CEILING_TICKS + 600; const pressure = environmentPressureForEra(worldEra);
  const start = B.ENTROPY_RISE_START - Math.round(pressure * 250);
  const lut = new Float32Array(len);
  for (let t = 0; t < len; t++) {
    const x = (t - start) / (B.ENTROPY_RISE_END - start);
    const e = smootherstep(x);
    lut[t] = Math.fround(Math.pow(e, B.ENTROPY_POWER));
  }
  return lut;
}

export function environmentPressureForEra(era) { return era <= 1 ? 0 : era === 2 ? .35 : era === 3 ? .55 : era === 4 ? .8 : 1; }

/** Seasonal oscillation in [-1, 1], indexed by (tick + nodeOffset) % period. */
export function buildSeasonLut() {
  const period = B.SEASON_PERIOD_TICKS;
  const lut = new Float32Array(period);
  for (let t = 0; t < period; t++) {
    lut[t] = Math.fround(Math.sin((t / period) * Math.PI * 2));
  }
  return lut;
}

/** Deterministic per-node season phase offsets from quantized positions. */
export function buildNodeSeasonOffsets(topo) {
  const offsets = new Uint16Array(topo.nodeCount);
  const period = B.SEASON_PERIOD_TICKS;
  for (let i = 0; i < topo.nodeCount; i++) {
    // Integer hash of position bits — no transcendentals.
    const x = Math.round(topo.positions[i * 3] * 1000) | 0;
    const y = Math.round(topo.positions[i * 3 + 1] * 1000) | 0;
    const z = Math.round(topo.positions[i * 3 + 2] * 1000) | 0;
    let h = (x * 73856093) ^ (y * 19349663) ^ (z * 83492791);
    h = ((h >>> 16) ^ h) >>> 0;
    offsets[i] = h % period;
  }
  return offsets;
}

/**
 * One environment update. Called every ENV_EVERY ticks.
 * @param {object} state run state
 * @param {Array} eventEffects accumulated event deltas for this step
 *   ({nodes: Uint16Array, falloff: Float32Array, kind, amount})
 */
export function updateEnvironment(state) {
  const { topo, fields } = state; const traits = state.activeTraits ?? state.traits;
  const N = topo.nodeCount;
  const t = state.tick;
  const e = state.entropyLut[Math.min(t, state.entropyLut.length - 1)];
  state.entropy = e;

  const period = B.SEASON_PERIOD_TICKS;
  const pressure = state.environmentPressure;
  const seasonAmp = B.SEASON_AMPLITUDE * (0.25 + 0.75 * pressure) * (0.6 + 0.8 * e);
  const symbiotic = traits.symbioticFilm > 0;
  const challengeNutrient = state.challenge?.nutrientRenewal ?? 1;

  for (let i = 0; i < N; i++) {
    const phase = (t + state.nodeSeasonOffset[i]) % period;
    const season = state.seasonLut[phase];
    const season2 = state.seasonLut[(phase + (period / 3 | 0)) % period];

    // Moisture: freshwater locally buffers, but does not cancel, global drying.
    const freshwater = freshwaterSupportAt(state, i);
    state.moisture[i] = Math.fround(clamp01(
      fields.baseMoisture[i] + state.dynamicFreshwaterSupport[i] * .12
        + seasonAmp * season - e * 0.22 * pressure * (1 - freshwater * .50)));

    // Temperature: seasonal + slow entropy heat drift.
    state.temperature[i] = Math.fround(clamp01(
      fields.baseTemp[i] + seasonAmp * 0.7 * season2 + e * 0.08 * pressure));

    // Toxins accumulate with entropy, decay slowly.
    const tox = state.toxicity[i]
      + B.TOXIN_ACCUMULATION * e * pressure * fields.toxVuln[i]
      - B.TOXIN_DECAY * state.toxicity[i];
    state.toxicity[i] = Math.fround(clamp01(tox));

    // Nutrient regeneration fails as entropy rises; occupied cells with
    // symbiotic film renew better.
    const occupied = symbiotic && state.alive[i] === 1 ? 1.5 : 1;
    const regen = B.NUTRIENT_REGEN * (1 - e * 0.92) * occupied * challengeNutrient
      * (fields.resourceRenewal?.[i] ?? 1) * (1 + freshwater * .35);
    const localTarget = Math.min(1, fields.baseNutrient[i] * (1 + freshwater * .08));
    const requested = Math.max(0, regen * (localTarget - state.nutrient[i]));
    transferReserve(state, i, requested);
  }

  applyEventEffects(state);
}

/** Apply active event footprints for the current tick. */
function applyEventEffects(state) {
  const t = state.tick;
  for (const ev of state.events) {
    if (t < ev.startTick || t > ev.endTick) continue;
    const nodes = ev.nodes; const falloff = ev.falloff;
    for (let k = 0; k < nodes.length; k++) {
      const env = eventEnvelopeAt(t, ev, ev.arrivalTicks[k]); if (env <= 0) continue;
      const i = nodes[k]; const w = ev.amount * ev.intensity * env * falloff[k];
      switch (ev.kind) {
        case 'moisture': state.moisture[i] = Math.fround(clamp01(state.moisture[i] - w)); break;
        case 'heat': state.temperature[i] = Math.fround(clamp01(state.temperature[i] + w)); break;
        case 'cold': state.temperature[i] = Math.fround(clamp01(state.temperature[i] - w)); break;
        case 'toxin': state.toxicity[i] = Math.fround(clamp01(state.toxicity[i] + w)); break;
        case 'stress':
          if (state.alive[i] === 1) {
            state.stress[i] = Math.fround(clamp01(state.stress[i] + w));
          }
          break;
        case 'ash':
          loseNutrient(state, i, w);
          state.temperature[i] = Math.fround(clamp01(state.temperature[i] - w * 0.4));
          break;
        case 'bloom': addExternalNutrient(state, i, w); break;
        case 'blight':
          if (state.alive[i] === 1) {
            const loss = Math.min(state.biomass[i], w * 0.25); state.causes.event += loss;
            state.reachDamageCause[i] = REACH_CAUSE.BLIGHT; state.biomass[i] = Math.fround(Math.max(0, state.biomass[i] - loss));
            state.stress[i] = Math.fround(clamp01(state.stress[i] + w * 0.5));
          }
          break;
        default: break;
      }
    }
  }
}
