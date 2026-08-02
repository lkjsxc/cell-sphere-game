/**
 * Run result projection: a plain, serializable summary of a finished run.
 * Pure function of run state — shared by the result screen, archive, share
 * card, and (later) scoring.
 */
import { BALANCE as B } from '../game/balance.js';
import { finalStateHash, serializeReplay } from './replay.js';
import { deriveImprint } from './imprint.js';

/** @param {object} state @returns {object} result summary */
export function buildRunResult(state) {
  const s = state;
  return {
    seed: s.seed,
    tick: s.tick,
    survivalSeconds: s.tick / B.TICKS_PER_SECOND,
    cause: s.extinction?.cause ?? 'unknown',
    coverage: s.coverage,
    peakCoverage: s.peakCoverage,
    sustainedCoverage: s.sustainedSamples ? s.sustainedSum / s.sustainedSamples : 0,
    connectedShare: s.connectedShare,
    peakConnectedShare: s.peakConnectedShare,
    minConnectedWhileMajority: s.minConnectedWhileMajority,
    totalUptake: s.totalUptake,
    totalMaintenance: s.totalMaintenance,
    crisesTotal: s.crisesTotal,
    crisesEndured: s.crisesEndured,
    signalsPlaced: s.signalsPlaced,
    ownedCards: s.ownedCards.slice(),
    phenotypes: s.phenotypes.slice(),
    imprint: deriveImprint(s),
    causes: { ...s.causes },
    hash: finalStateHash(s),
    replay: serializeReplay(s),
  };
}

/** Dominant extinction cause from accumulated biomass-loss attribution. */
export function dominantCause(s) {
  let best = 'starvation';
  let bestV = -1;
  for (const [key, v] of Object.entries(s.causes)) {
    if (v > bestV) { bestV = v; best = key; }
  }
  return best;
}
