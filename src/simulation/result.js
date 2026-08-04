/** Pure terminal/plain result projection. */
import { BALANCE as B } from '../game/balance.js';
import { finalStateHash, serializeHistory, serializeReplay } from './replay.js';
import { deriveImprint } from './imprint.js';
import { liveScore, SCORE_MODEL_VERSION } from '../game/scoring.js';
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
    worldOrdinal: s.worldOrdinal, worldEra: s.worldEra,
    scoreModelVersion: SCORE_MODEL_VERSION, worldPotential: s.worldPotential, potentialVersion: s.potentialVersion,
    history: serializeHistory(s),
    coverage: s.coverage,
    peakCoverage: s.peakCoverage,
    sustainedCoverage: s.sustainedSamples ? s.sustainedSum / s.sustainedSamples : 0,
    connectedShare: s.connectedShare,
    peakConnectedShare: s.peakConnectedShare,
    minConnectedWhileMajority: s.minConnectedWhileMajority,
    totalUptake: s.totalUptake,
    totalMaintenance: s.totalMaintenance,
    stressBurden: s.stressBurdenSamples ? s.stressBurdenSum / s.stressBurdenSamples : 0,
    challengeMult: s.challenge?.scoreMult ?? 1,
    crisesTotal: s.crisesTotal,
    crisesEndured: s.crisesEndured,
    resourceInitial: s.initialResourceReserve,
    resourceFinal: sumArray(s.resourceReserve), resourceTransferred: s.resourceTransferred,
    resourceDepletedCells: countDepleted(s.resourceReserve),
    habitatOccupancy: Array.from(s.habitatOccupancy), habitatCapabilities: s.habitatCapabilities.slice(),
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
    inoculationCell: s.inoculationCell, worldOrdinal: s.worldOrdinal, worldEra: s.worldEra,
    scoreModelVersion: SCORE_MODEL_VERSION, worldPotential: s.worldPotential,
    history: serializeHistory(s), reach: buildReachResult(s), cause: 'abandoned' };
}

export function dominantCause(s) {
  let best = 'resource-exhaustion';
  let bestValue = -1;
  for (const [key, value] of Object.entries(s.causes)) {
    if (value > bestValue) { bestValue = value; best = key; }
  }
  return best;
}
function sumArray(values) { let total = 0; for (const value of values) total += value; return total; }
function countDepleted(values){let count=0;for(const value of values)if(value<=.0001)count++;return count;}
