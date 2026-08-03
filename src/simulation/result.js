/** Pure terminal/plain result projection. */
import { BALANCE as B } from '../game/balance.js';
import { finalStateHash, serializeHistory, serializeReplay } from './replay.js';
import { deriveImprint } from './imprint.js';
import { liveScore } from '../game/scoring.js';
import { buildReachResult } from './lifecycle/reach-ledger.js';
import { buildLakeProof } from './trophy-proof.js';

export function buildRunResult(s) {
  return {
    runId: s.runId,
    seed: s.seed,
    archetype: s.fields.archetypeName,
    tick: s.tick,
    survivalSeconds: s.tick / B.TICKS_PER_SECOND,
    cause: s.extinction?.cause ?? 'unknown',
    terminalCause: s.extinction?.terminalCause ?? s.terminalCause ?? 'unknown',
    finalLivingCount: s.aliveCount,
    diagnostics: { ...s.diagnostics },
    inoculationCell: s.inoculationCell,
    adaptationMode: s.adaptationMode,
    offers: s.adaptationOffers.map((offer) => ({ ...offer, options: offer.options.slice() })),
    history: serializeHistory(s),
    coverage: s.coverage,
    peakCoverage: s.peakCoverage,
    sustainedCoverage: s.sustainedSamples ? s.sustainedSum / s.sustainedSamples : 0,
    connectedShare: s.connectedShare,
    peakConnectedShare: s.peakConnectedShare,
    minConnectedWhileMajority: s.minConnectedWhileMajority,
    totalUptake: s.totalUptake,
    totalMaintenance: s.totalMaintenance,
    scoreRate: s.traits.scoreRate,
    challengeMult: s.challenge?.scoreMult ?? 1,
    crisesTotal: s.crisesTotal,
    crisesEndured: s.crisesEndured,
    ownedCards: s.ownedCards.slice(),
    phenotypes: s.phenotypes.slice(),
    imprint: deriveImprint(s),
    causes: { ...s.causes },
    reach: buildReachResult(s),
    lakeProof: buildLakeProof(s),
    hash: finalStateHash(s),
    replayVersion: s.replayVersion,
    replay: serializeReplay(s),
  };
}

export function buildAbandonedRun(s) {
  return { runId: s.runId, seed: s.seed, tick: s.tick,
    elapsedSeconds: s.tick / B.TICKS_PER_SECOND, livingCount: s.aliveCount,
    coverage: s.coverage, score: liveScore(s), archetype: s.fields.archetypeName,
    inoculationCell: s.inoculationCell, adaptationMode: s.adaptationMode,
    offers: s.adaptationOffers.map((offer) => ({ ...offer, options: offer.options.slice() })),
    history: serializeHistory(s), reach: buildReachResult(s), cause: 'abandoned' };
}

export function dominantCause(s) {
  let best = 'starvation';
  let bestValue = -1;
  for (const [key, value] of Object.entries(s.causes)) {
    if (value > bestValue) { bestValue = value; best = key; }
  }
  return best;
}
