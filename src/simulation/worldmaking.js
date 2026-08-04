/** Bounded whole-cell transformations and bioelectric infrastructure. */
import { BIOME } from '../world/fields.js';
import { clamp01 } from '../core/math.js';
import { recordHistory } from './replay.js';
import { consumeNutrient, freshwaterSupportAt, transferRecyclable } from './resource-ecology.js';

export const TRANSFORMATION = Object.freeze({
  NONE: 0, RECOVERING: 1, RECLAIMED_SOIL: 2, GLACIAL_LAKE: 3,
  WETLAND_SUCCESSION: 4, MARITIME_FOREST: 5,
});

export function createWorldmakingState(fields) {
  return {
    effectiveBiome: fields.biomeId.slice(),
    transformationState: new Uint8Array(fields.biomeId.length),
    transformationProgress: new Uint16Array(fields.biomeId.length),
    dynamicFreshwaterSupport: new Float32Array(fields.biomeId.length),
    electricCharge: new Float32Array(fields.biomeId.length),
    electricityQ: new Uint8Array(fields.biomeId.length),
    everPowered: new Uint8Array(fields.biomeId.length),
    transformedCells: 0, electrifiedCells: 0, poweredCellTicks: 0,
    glacialLakeCells: 0, maritimeForestCells: 0, reclaimedCells: 0,
  };
}

export function runWorldmaking(state) {
  const active = state.activeBuildIdSet;
  if (!active?.size) return;
  let electrified = 0;
  for (let cell = 0; cell < state.topo.nodeCount; cell++) {
    if (!state.alive[cell]) { decayCharge(state, cell); continue; }
    runReclamation(state, cell, active);
    runCryolake(state, cell, active);
    runLittoral(state, cell, active);
    runElectricity(state, cell, active);
    if (state.electricityQ[cell]) { electrified++; state.poweredCellTicks++; }
  }
  state.electrifiedCells = electrified;
}

function runReclamation(state, cell, active) {
  if (!(active.has('wasteland-reclaimer') || active.has('circular-biosphere') || active.has('depletion-bloom'))) return;
  const poor = state.resourceState[cell] >= 5 || state.transformationState[cell] === TRANSFORMATION.RECOVERING;
  if (!poor) return;
  const powered = state.electricityQ[cell] / 255;
  const rate = .00055 * (1 + powered * (active.has('depletion-bloom') ? 2 : .5))
    * (1 + freshwaterSupportAt(state, cell) * .5);
  const restored = transferRecyclable(state, cell, rate);
  if (!(restored > 0)) return;
  if (state.transformationState[cell] === TRANSFORMATION.NONE) state.transformationState[cell] = TRANSFORMATION.RECOVERING;
  state.transformationProgress[cell] = Math.min(0xffff, state.transformationProgress[cell] + 1);
  if (state.transformationProgress[cell] >= 180 && state.resourceRichness[cell] >= .42
      && state.transformationState[cell] !== TRANSFORMATION.RECLAIMED_SOIL) {
    state.transformationState[cell] = TRANSFORMATION.RECLAIMED_SOIL;
    state.reclaimedCells++; state.transformedCells++;
    recordHistory(state, 'resource-recovered', { cell, valueA: state.resourceRichness[cell] });
  }
}

function runCryolake(state, cell, active) {
  if (!active.has('cryolake-engineer') || state.transformationState[cell] === TRANSFORMATION.GLACIAL_LAKE) return;
  const base = state.fields.biomeId[cell];
  if (base !== BIOME.SNOW_ICE && base !== BIOME.TUNDRA) return;
  if (!hasLowerNeighbor(state, cell) || state.energy[cell] < .16 || state.nutrient[cell] < .015) return;
  consumeNutrient(state, cell, .00018); state.energy[cell] = Math.fround(state.energy[cell] - .00025);
  const power = state.electricityQ[cell] / 255;
  state.transformationProgress[cell] = Math.min(0xffff, state.transformationProgress[cell] + 1 + (power > .3 ? 1 : 0));
  if (state.transformationProgress[cell] < 320) return;
  state.transformationState[cell] = TRANSFORMATION.GLACIAL_LAKE; state.effectiveBiome[cell] = BIOME.LAKE;
  state.dynamicFreshwaterSupport[cell] = .9; state.glacialLakeCells++; state.transformedCells++;
  for (let offset = state.topo.nodeStart[cell]; offset < state.topo.nodeStart[cell + 1]; offset++) {
    const neighbor = state.topo.nodeNeighbors[offset]; state.dynamicFreshwaterSupport[neighbor] = Math.max(state.dynamicFreshwaterSupport[neighbor], .42);
  }
  recordHistory(state, 'glacial-lake', { cell });
}

function runLittoral(state, cell, active) {
  if (!active.has('littoral-succession') || state.fields.biomeId[cell] !== BIOME.SHALLOW_OCEAN) return;
  if (!hasCoastalNeighbor(state, cell) || state.energy[cell] < .18 || state.nutrient[cell] < .012) return;
  consumeNutrient(state, cell, .00022); state.energy[cell] = Math.fround(state.energy[cell] - .00028);
  const step = state.electricityQ[cell] > 90 ? 2 : 1;
  state.transformationProgress[cell] = Math.min(0xffff, state.transformationProgress[cell] + step);
  if (state.transformationProgress[cell] >= 220 && state.transformationState[cell] < TRANSFORMATION.WETLAND_SUCCESSION) {
    state.transformationState[cell] = TRANSFORMATION.WETLAND_SUCCESSION; state.effectiveBiome[cell] = BIOME.WETLAND;
    state.transformedCells++; recordHistory(state, 'wetland-succession', { cell });
  }
  if (state.transformationProgress[cell] >= 520 && state.transformationState[cell] < TRANSFORMATION.MARITIME_FOREST) {
    state.transformationState[cell] = TRANSFORMATION.MARITIME_FOREST; state.effectiveBiome[cell] = BIOME.WET_FOREST;
    state.maritimeForestCells++; recordHistory(state, 'maritime-forest', { cell });
  }
}

function runElectricity(state, cell, active) {
  const enabled = active.has('bioelectric-wetland') || active.has('hydrothermal-grid')
    || active.has('illuminated-biosphere') || active.has('depletion-bloom') || active.has('lake-to-light-network');
  if (!enabled) return decayCharge(state, cell);
  let flux = 0;
  for (let offset = state.topo.nodeStart[cell]; offset < state.topo.nodeStart[cell + 1]; offset++) {
    const edge = state.topo.nodeEdges[offset]; if (state.edgeActive[edge]) flux += Math.abs(state.flux[edge]);
  }
  const biome = state.effectiveBiome[cell];
  const wet = biome === BIOME.LAKE || biome === BIOME.WETLAND || freshwaterSupportAt(state, cell) > .35;
  const marine = biome === BIOME.DEEP_OCEAN || biome === BIOME.SHALLOW_OCEAN;
  const domain = active.has('illuminated-biosphere') ? 1 : active.has('bioelectric-wetland') && wet ? 1
    : active.has('hydrothermal-grid') && marine ? 1 : active.has('depletion-bloom') ? .6 : 0;
  if (!(domain > 0) || !(flux > .00001) || state.energy[cell] < .02) return decayCharge(state, cell);
  const generated = Math.min(.016, flux * .055 * domain);
  const upkeep = Math.min(state.energy[cell], .00018 + generated * .04);
  state.energy[cell] = Math.fround(state.energy[cell] - upkeep);
  state.electricCharge[cell] = Math.fround(clamp01(state.electricCharge[cell] * .992 + generated));
  state.electricityQ[cell] = Math.round(state.electricCharge[cell] * 255);
  if (state.electricityQ[cell] >= 20 && !state.everPowered[cell]) {
    state.everPowered[cell] = 1; recordHistory(state, 'powered-cell', { cell });
  }
}

function decayCharge(state, cell) {
  if (state.electricCharge[cell] <= 0) { state.electricityQ[cell] = 0; return; }
  state.electricCharge[cell] = Math.fround(state.electricCharge[cell] * .985);
  state.electricityQ[cell] = state.electricCharge[cell] < .004 ? 0 : Math.round(state.electricCharge[cell] * 255);
}
function hasLowerNeighbor(state, cell) { const altitude = state.fields.altitude[cell];
  for (let offset = state.topo.nodeStart[cell]; offset < state.topo.nodeStart[cell + 1]; offset++)
    if (state.fields.altitude[state.topo.nodeNeighbors[offset]] >= altitude) return true; return false; }
function hasCoastalNeighbor(state, cell) {
  for (let offset = state.topo.nodeStart[cell]; offset < state.topo.nodeStart[cell + 1]; offset++) {
    const biome = state.effectiveBiome[state.topo.nodeNeighbors[offset]];
    if (biome === BIOME.COAST || biome === BIOME.WETLAND || biome === BIOME.WET_FOREST) return true;
  }
  return false;
}
