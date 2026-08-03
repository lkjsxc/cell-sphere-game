/** Compact replay, semantic history, and terminal authority hash. */
import { hashF32, hashU8, hexU32 } from '../core/hash.js';
import { ADAPTATIONS } from '../game/adaptations.js';

export const REPLAY_VERSION = 2;
export const REPLAY = Object.freeze({
  STRAIN: 0,
  INOCULATE: 1,
  ADAPTATION_OFFER: 2,
  ADAPTATION_SELECT: 3,
  ADAPTATION_MODE: 4,
  SPEED: 5,
});

/** @param {object} state @param {number} type @param {...number} args */
export function logReplay(state, type, ...args) {
  state.replay.push([state.tick, type, ...args]);
}

/** @returns {Array<number[]>} plain replay copy */
export function serializeReplay(state) {
  return state.replay.map((entry) => entry.slice());
}

/**
 * Append a compact semantic event. Slots 0..78 hold events/coalescing and the
 * final slot is reserved for extinction, so the cap is deterministic.
 */
export function recordHistory(state, type, data = {}) {
  const sourceCells = Array.isArray(data.primaryCells) ? data.primaryCells : [data.cellId ?? data.cell];
  const primaryCells = [];
  for (const cell of sourceCells) {
    if (Number.isInteger(cell) && cell >= 0 && cell < state.topo.nodeCount && !primaryCells.includes(cell)) primaryCells.push(cell);
    if (primaryCells.length === 8) break;
  }
  const event = { seq: state.history.length, tick: state.tick, type, ...data, primaryCells };
  if (type === 'run-extinct') {
    if (state.history.length < 80) state.history.push(event);
    else state.history[79] = event;
    return;
  }
  if (state.history.length < 79) {
    state.history.push(event);
    return;
  }
  const existing = state.history.find((item) => item.type === type && item.id === data.id);
  if (existing) {
    existing.count = (existing.count ?? 1) + 1;
    existing.lastTick = state.tick;
    return;
  }
  const last = state.history[78];
  if (last.type !== 'history-coalesced') {
    state.history[78] = { tick: last.tick, type: 'history-coalesced', count: 2, lastTick: state.tick };
  } else {
    last.count++;
    last.lastTick = state.tick;
  }
}

/** Plain deep-enough copy for observational result queries. */
export function serializeHistory(state) {
  return state.history.map((event) => ({ ...event }));
}

/**
 * Final deterministic hash over dynamic arrays, replay decisions, and owned
 * cards. Quantization hides irrelevant float noise, not semantic divergence.
 */
export function finalStateHash(state) {
  let h = 0x811c9dc5;
  h = hashF32(h, state.biomass, 1000);
  h = hashF32(h, state.energy, 1000);
  h = hashF32(h, state.nutrient, 1000);
  h = hashF32(h, state.stress, 1000);
  h = hashF32(h, state.toxicity, 1000);
  h = hashF32(h, state.conductance, 1000);
  h = hashF32(h, state.edgePeak, 1000);
  h = hashU8(h, state.alive);
  h = hashU8(h, state.edgeActive);
  const proof = state.trophyProof;
  h = hashF32(h, new Float32Array([
    state.tick, state.totalUptake, state.totalMaintenance,
    state.peakCoverage, state.peakConnectedShare, state.inoculationCell,
    state.adaptationMode === 'random' ? 1 : 0, state.replayVersion,
    proof.lakeCellsReached, proof.shoreCellsReached, proof.distinctLakesReached, proof.completeShores,
    proof.ecologyMask, proof.lakeTypeMask, proof.lakeSalinityMask, proof.lakeLivingSamples,
    proof.largeLakeLivingSamples, proof.lakeRegionPeak, proof.droughtLakeSurvivals,
    proof.freezeLakeSurvivals, proof.loopSurplusPeak, proof.loopLivingSamples,
  ]), 1000);
  const replayValues = [];
  for (const entry of state.replay) replayValues.push(entry.length, ...entry);
  h = hashF32(h, Float32Array.from(replayValues), 1);
  const cards = state.ownedCards.map((id) => ADAPTATIONS.findIndex((card) => card.id === id));
  h = hashF32(h, Float32Array.from(cards), 1);
  return hexU32(h);
}
