/** The only production writes that change a cell's authoritative alive state. */
import { recordReachTransition } from './reach-ledger.js';
import { recordTrophyReach } from '../trophy-proof.js';
import { recordScoreExploration } from '../../game/scoring.js';
import { BIOME } from '../../world/fields.js';
export function birthCell(state, cell, cause) {
  if (state.alive[cell] === 1) return false;
  state.alive[cell] = 1; state.aliveCount++;
  const biome = state.effectiveBiome?.[cell] ?? state.fields?.biomeId?.[cell];
  const difficulty = biome === BIOME.DEEP_OCEAN ? 2 : biome === BIOME.SNOW_ICE ? 1.7
    : biome === BIOME.SHALLOW_OCEAN ? 1.5 : biome === BIOME.TUNDRA || biome === BIOME.LAKE ? 1.25 : 1;
  recordScoreExploration(state, cell, difficulty + (state.resourceQuintile?.[cell] === 0 ? .2 : 0));
  if (state.resourceBirthsByQuintile && state.resourceQuintile) {
    state.resourceBirthsByQuintile[state.resourceQuintile[cell]]++;
    state.resourceBirthRichnessSum += state.resourceRichness?.[cell] ?? state.initialResourceRichness?.[cell] ?? 0;
    state.resourceBirthCount++;
  }
  if (state.habitatOccupancy && state.habitatVisited && state.fields?.biomeId && !state.habitatVisited[cell]) {
    state.habitatVisited[cell] = 1; state.habitatOccupancy[state.fields.biomeId[cell]]++;
  }
  recordReachTransition(state, cell, cause); recordTrophyReach(state, cell); return true;
}
export function killCell(state, cell, cause) {
  if (state.alive[cell] !== 1) return false;
  state.alive[cell] = 0; state.aliveCount--; recordReachTransition(state, cell, cause);
  if (state.biomass[cell] < .02) state.biomass[cell] = Math.fround(.02);
  for (let offset = state.topo.nodeStart[cell]; offset < state.topo.nodeStart[cell + 1]; offset++) {
    const edge = state.topo.nodeEdges[offset]; state.edgeActive[edge] = 0; state.flux[edge] = 0;
  }
  return true;
}
