/**
 * Replay log: compact record of every player decision and speed change,
 * plus the final run-state hash used by diagnostics, trophies, and the
 * "Exact Echo" reproducibility check.
 */
import { hashF32, hashU8, hexU32 } from '../core/hash.js';

// Entry type codes keep the log compact.
export const REPLAY = Object.freeze({
  STRAIN: 0,
  INOCULATE: 1,
  DECIDE: 2,
  REROLL: 3,
  SIGNAL: 4,
  SPEED: 5,
});

/** @param {object} state @param {number} type @param {...number} args */
export function logReplay(state, type, ...args) {
  state.replay.push([state.tick, type, ...args]);
}

/** @param {object} state @returns {Array<number[]>} plain copy */
export function serializeReplay(state) {
  return state.replay.map((e) => e.slice());
}

/**
 * Final deterministic hash over the canonical run state.
 * Quantized to 0.001 precision so irrelevant float noise cannot diverge it.
 * @param {object} state
 * @returns {string} 8-hex-char digest
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
  // Fold scalar summary.
  const scalars = new Float32Array([
    state.tick, state.totalUptake, state.totalMaintenance,
    state.peakCoverage, state.peakConnectedShare,
  ]);
  h = hashF32(h, scalars, 1000);
  return hexU32(h);
}
