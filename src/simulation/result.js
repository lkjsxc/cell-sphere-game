/** Pure terminal/plain result projection. */
import { BALANCE as B } from '../game/balance.js';
import { finalStateHash, serializeHistory, serializeReplay } from './replay.js';
import { deriveImprint } from './imprint.js';
import { evaluate, liveScore, metricsFromState, SCORE_MODEL_VERSION } from '../game/scoring.js';
import { buildReachResult } from './lifecycle/reach-ledger.js';
import { buildLakeProof } from './trophy-proof.js';
import { resourceConservation } from './resource-ecology.js';
import { reachGoalSummary } from './lifecycle/reach-goal.js';
import { environmentExposureSummary } from '../game/environment-exposure.js';
import { environmentPressureSummary } from './challenge-profile.js';

export function buildRunResult(s) {
  const scoreProjection = evaluate(metricsFromState(s), { environmentBonusQ: s.scoreMerit.environmentBonusQ }); const conservation = resourceConservation(s);
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
    worldOrdinal: s.worldOrdinal,
    environmentModelVersion: s.environmentModelVersion,
    environmentScheduleVersion: s.environmentScheduleVersion,
    environmentScheduleHash: s.environmentScheduleHash,
    environmentProfileVersion: s.currentEnvironmentProfileVersion,
    currentEnvironmentProfileHash: s.currentEnvironmentProfileHash,
    startEnvironmentLevel: '0',
    finalEnvironmentLevel: s.currentEnvironmentLevel,
    peakEnvironmentLevel: s.peakEnvironmentLevel,
    environmentLevelStartTick: s.environmentLevelStartTick,
    nextEnvironmentLevelTick: s.nextEnvironmentLevelTick,
    environmentTransitionCount: s.environmentTransitionCount,
    timeAtPeakTicks: environmentExposureSummary(s.environmentExposure).timeAtPeakTicks,
    environmentExposure: environmentExposureSummary(s.environmentExposure),
    recentEnvironmentTransitions: s.recentEnvironmentTransitions.map((transition) => ({ ...transition })),
    environmentPressureSummary: environmentPressureSummary(s.currentEnvironmentProfile),
    onboardingEnvironmentModifier: { ...s.onboardingEnvironmentModifier },
    scoreModelVersion: SCORE_MODEL_VERSION, score: s.scoreMerit.total,
    scoreProjection: { ...scoreProjection, total: s.scoreMerit.total }, scoreMerit: copyMerit(s.scoreMerit),
    worldPotential: s.worldPotential, evolutionPower: s.evolutionPower,
    evolutionDepth: s.evolutionDepth, potentialVersion: s.potentialVersion,
    history: serializeHistory(s),
    coverage: s.coverage,
    peakCoverage: s.peakCoverage, peakLandOccupancy: s.peakLandOccupancy,
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
    resourceInitial: s.initialResourceStock,
    resourceFinal: conservation.actual, resourceAvailableFinal: sumArray(s.nutrient),
    resourceReserveFinal: sumArray(s.resourceReserve), resourceRecyclableFinal: sumArray(s.recyclableResource),
    freshwaterCatchmentFinal: sumArray(s.freshwaterCatchmentReserve),
    founderFreshwaterInitial: s.initialFounderFreshwaterReserve, founderFreshwaterFinal: s.founderFreshwaterReserve,
    resourceTransferred: s.resourceTransferred, resourceExternalAdditions: s.resourceExternalAdditions,
    resourceReclaimed: s.resourceReclaimed, resourceConsumed: s.resourceConsumed, resourceLost: s.resourceLost,
    resourceConservationError: conservation.error,
    resourceDepletedCells: s.resourceDepletedCells, resourceRecoveredCells: s.resourceRecoveredCells,
    firstResourceExhaustionSeconds: s.firstResourceExhaustionTick / B.TICKS_PER_SECOND,
    resourceStateCounts: countStates(s.resourceState), resourceLivingTicksByQuintile: Array.from(s.resourceLivingTicksByQuintile),
    resourceBirthsByQuintile: Array.from(s.resourceBirthsByQuintile),
    averageResourceRichnessAtBirth: s.resourceBirthCount ? s.resourceBirthRichnessSum / s.resourceBirthCount : 0,
    freshwaterSupportedCellSeconds: s.freshwaterSupportedCellTicks / B.TICKS_PER_SECOND,
    habitatOccupancy: Array.from(s.habitatOccupancy), habitatCapabilities: s.habitatCapabilities.slice(),
    activeBuilds: s.activeBuilds.slice(), transformedCells: s.transformedCells,
    glacialLakeCells: s.glacialLakeCells, maritimeForestCells: s.maritimeForestCells,
    reclaimedCells: s.reclaimedCells, electrifiedCells: s.peakElectrifiedCells,
    finalElectrifiedCells: s.electrifiedCells, everPoweredCells: countMask(s.everPowered),
    poweredCellSeconds: s.poweredCellTicks / B.TICKS_PER_SECOND,
    electricityMasteryRating: s.electricityMastery?.rating ?? '0',
    electricityDevelopment: s.electricityMastery?.visualDevelopment ?? 0, reach100: reachGoalSummary(s),
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
    inoculationCell: s.inoculationCell, worldOrdinal: s.worldOrdinal,
    environmentModelVersion: s.environmentModelVersion, environmentScheduleVersion: s.environmentScheduleVersion,
    environmentScheduleHash: s.environmentScheduleHash, environmentProfileVersion: s.currentEnvironmentProfileVersion,
    currentEnvironmentProfileHash: s.currentEnvironmentProfileHash,
    startEnvironmentLevel: '0', finalEnvironmentLevel: s.currentEnvironmentLevel,
    peakEnvironmentLevel: s.peakEnvironmentLevel, environmentTransitionCount: s.environmentTransitionCount,
    environmentExposure: environmentExposureSummary(s.environmentExposure),
    onboardingEnvironmentModifier: { ...s.onboardingEnvironmentModifier },
    scoreModelVersion: SCORE_MODEL_VERSION, worldPotential: s.worldPotential, evolutionPower: s.evolutionPower,
    evolutionDepth: s.evolutionDepth,
    potentialVersion: s.potentialVersion, scoreMerit: copyMerit(s.scoreMerit),
    history: serializeHistory(s), reach: { ...buildReachResult(s), goal: reachGoalSummary(s) }, cause: 'abandoned' };
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
function countStates(values) { const counts = Array(8).fill(0); for (const value of values) counts[value]++; return counts; }
function countMask(values) { let count = 0; for (const value of values) if (value) count++; return count; }
function copyMerit(value) { return { modelVersion: value.modelVersion, raw: { ...value.raw }, normalized: { ...value.normalized },
  total: value.total, quality: value.quality, environmentBonusQ: value.environmentBonusQ ?? 0,
  lastUpdateTick: value.lastUpdateTick }; }
