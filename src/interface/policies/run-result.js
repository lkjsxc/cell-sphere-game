/** Pure, idempotent cross-run transaction; browser persistence happens outside. */
import {scoreResult,scoreResultMatchesAuthority} from '../../game/scoring.js';
import {compileEvolution} from '../../game/skills/index.js';
import { appendTrophyEvents, appendWorld } from '../../platform/history.js';
import { convertImprintToAtlas } from '../../platform/storage.js';
import { reconcileTrophies } from '../../game/trophies/evaluator.js';
import { ENVIRONMENT_MODEL_VERSION, ENVIRONMENT_SCHEDULE_HASH, ENVIRONMENT_SCHEDULE_VERSION,
  environmentScheduleAtTick, normalizeEnvironmentLevel } from '../../game/environment-level.js';
import { ENVIRONMENT_EXPOSURE_VERSION } from '../../game/environment-exposure.js';
import { LEGACY_CHALLENGE_PROFILE_VERSION,
  compileChallengeProfile, compileLegacyChallengeProfileV2 } from '../../simulation/challenge-profile.js';
import { EVENT_DIRECTOR_VERSION } from '../../simulation/events.js';
import { RUN_RESULT_SCHEMA_VERSION } from '../../simulation/result.js';
import {addProgressionIntegers,compareProgressionIntegers,incrementProgressionInteger,
  maxProgressionInteger,multiplyProgressionIntegers,normalizeProgressionInteger} from '../../core/progression-integer.js';
import {boundedTransactionKey} from '../../core/hash.js';

export function applyRunResult(meta,archive,result,retention,lastKey=null){
  const key=result.resultTransactionKey??boundedTransactionKey('run-result',[result.runId??0,result.seed,result.hash,result.tick,result.worldOrdinal,result.environmentScheduleHash,result.currentEnvironmentProfileHash]);
  if(typeof key!=='string'||!key||key.length>128)return rejected('invalid-result-key',key,meta,archive);
  const resultOrdinal=normalizeProgressionInteger(result.worldOrdinal,'0'),runs=normalizeProgressionInteger(meta.runs,'0');
  const duplicate=meta.resultKeys?.includes(key)||(lastKey instanceof Set?lastKey.has(key):key===lastKey)
    ||(resultOrdinal!=='0'&&compareProgressionIntegers(resultOrdinal,runs)<=0);
  if(duplicate)return rejected('duplicate-result',key,meta,archive);
  const expectedOrdinal=maxProgressionInteger(normalizeProgressionInteger(meta.worldSeedIndex,'0'),incrementProgressionInteger(runs));
  if(resultOrdinal!==expectedOrdinal)return rejected('unexpected-world-ordinal',key,meta,archive);
  let evolution;try{evolution=compileEvolution(meta)}catch{return rejected('invalid-evolution-state',key,meta,archive)}
  if(normalizeProgressionInteger(result.worldPotential,'0')!==evolution.worldPotential)return rejected('invalid-world-potential',key,meta,archive);
  if(!validDynamicEnvironmentResult(result, evolution))return rejected('invalid-environment-result',key,meta,archive);
  if(!scoreResultMatchesAuthority(result))return rejected('invalid-score-projection',key,meta,archive);
  const score=scoreResult(result);const converted=result.imprint?.edges?.length
    ? convertImprintToAtlas(result.imprint) : null;
  const nextRuns=incrementProgressionInteger(runs);
  const nextMeta = {
    ...meta,
    revision: incrementProgressionInteger(normalizeProgressionInteger(meta.revision, '0')),
    runs: nextRuns,
    totalEchoes: addProgressionIntegers(normalizeProgressionInteger(meta.totalEchoes, '0'), score.echoes),
    echoBalance: addProgressionIntegers(normalizeProgressionInteger(meta.echoBalance, '0'), score.echoes),
    scoreModelVersion: score.modelVersion,
    bestScore: maxProgressionInteger(normalizeProgressionInteger(meta.bestScore, '0'), score.total),
    environmentRecordVersion: ENVIRONMENT_MODEL_VERSION,
    bestEnvironmentLevelReached: maxProgressionInteger(
      normalizeEnvironmentLevel(meta.bestEnvironmentLevelReached, '0'), result.peakEnvironmentLevel,
    ),
    bestEnvironmentExposure: betterExposure(meta.bestEnvironmentExposure, result.environmentExposure),
    longestWorldTicks: maxProgressionInteger(normalizeProgressionInteger(meta.longestWorldTicks, '0'), String(result.tick)),
    resultKeys: [...(meta.resultKeys ?? []).filter((entry) => entry !== key), key].slice(-16),
    imprints:converted?[...(meta.imprints??[]),converted].slice(-8):(meta.imprints??[]),
  };
  const appended = appendWorld(archive, result, score, nextRuns, retention); const record = appended.worlds.at(-1);
  const trophies = reconcileTrophies(nextMeta, appended, record?.trophyFacts);
  const nextArchive = appendTrophyEvents(appended, trophies.awardedIds, record?.id);
  return Object.freeze({ applied: true, key, meta: trophies.meta, archive: nextArchive, score,
    trophyIds:trophies.awardedIds,trophiesBackfilled:trophies.backfilled});
}
function validDynamicEnvironmentResult(result, evolution) {
  const legacyProfile = result?.environmentProfileVersion === LEGACY_CHALLENGE_PROFILE_VERSION
    && !Object.hasOwn(result, 'resultSchemaVersion');
  if (!result || (!legacyProfile && result.resultSchemaVersion !== RUN_RESULT_SCHEMA_VERSION)
    || result.environmentModelVersion !== ENVIRONMENT_MODEL_VERSION
    || result.environmentScheduleVersion !== ENVIRONMENT_SCHEDULE_VERSION
    || result.environmentScheduleHash !== ENVIRONMENT_SCHEDULE_HASH
    || result.startEnvironmentLevel !== '0') return false;
  if (!Number.isSafeInteger(result.tick) || result.tick < 0) return false;
  const final = normalizeEnvironmentLevel(result.finalEnvironmentLevel, '0');
  const peak = normalizeEnvironmentLevel(result.peakEnvironmentLevel, '0');
  if (final !== result.finalEnvironmentLevel || peak !== result.peakEnvironmentLevel
    || compareProgressionIntegers(peak, final) < 0) return false;
  const schedule = environmentScheduleAtTick(String(result.tick));
  if (final !== schedule.currentEnvironmentLevel || peak !== final) return false;
  const transitions = normalizeProgressionInteger(result.environmentTransitionCount, '0');
  const exposure = result.environmentExposure;
  if (transitions !== result.environmentTransitionCount || transitions !== final
    || result.environmentLevelStartTick !== schedule.environmentLevelStartTick
    || result.nextEnvironmentLevelTick !== schedule.nextEnvironmentLevelTick
    || !exposure || exposure.version !== ENVIRONMENT_EXPOSURE_VERSION) return false;
  const compile = legacyProfile ? compileLegacyChallengeProfileV2 : compileChallengeProfile;
  const profile = compile({ environmentLevel: final, evolution: {
    affinityDefense: evolution?.affinityDefense, pressureDefense: evolution?.pressureDefense,
  } });
  if (result.environmentProfileVersion !== profile.version || result.currentEnvironmentProfileHash !== profile.hash
    || (!legacyProfile && result.eventDirectorVersion !== EVENT_DIRECTOR_VERSION)) return false;
  for (const key of ['totalTicks', 'pressureTicksQ', 'qualityPressureTicksQ', 'timeAtPeakTicks']) {
    if (normalizeProgressionInteger(exposure[key], '0') !== exposure[key]) return false;
  }
  if (exposure.totalTicks !== String(result.tick) || exposure.timeAtPeakTicks !== result.timeAtPeakTicks
    || exposure.currentLevel !== final
    || compareProgressionIntegers(exposure.timeAtPeakTicks, exposure.totalTicks) > 0
    || compareProgressionIntegers(exposure.qualityPressureTicksQ, exposure.pressureTicksQ) > 0
    || compareProgressionIntegers(exposure.pressureTicksQ, multiplyProgressionIntegers(exposure.totalTicks, '1000000')) > 0) return false;
  if (!Number.isInteger(exposure.peakPressureQ) || exposure.peakPressureQ < 0 || exposure.peakPressureQ > 1_000_000) return false;
  if (!Array.isArray(result.recentEnvironmentTransitions) || result.recentEnvironmentTransitions.length > 8) return false;
  let previousLevel = '0'; let previousTick = '0';
  return result.recentEnvironmentTransitions.every((transition) => {
    if (!validTransition(transition, final, evolution, compile)) return false;
    const level = transition.level; const tick = transition.tick;
    if (compareProgressionIntegers(level, previousLevel) <= 0 || compareProgressionIntegers(tick, previousTick) <= 0) return false;
    previousLevel = level; previousTick = tick; return true;
  });
}
function validTransition(transition, finalLevel, evolution, compile = compileChallengeProfile) {
  if (!transition || typeof transition !== 'object') return false;
  const level = normalizeEnvironmentLevel(transition.level, '0');
  if (level === '0' || level !== transition.level || compareProgressionIntegers(level, finalLevel) > 0) return false;
  const tick = normalizeProgressionInteger(transition.tick, '0');
  const schedule = environmentScheduleAtTick(tick);
  if (schedule.currentEnvironmentLevel !== level || tick !== transition.tick || tick !== schedule.environmentLevelStartTick) return false;
  const profile = compile({ environmentLevel: level, evolution: {
    affinityDefense: evolution?.affinityDefense, pressureDefense: evolution?.pressureDefense,
  } });
  return transition.profileHash === profile.hash && transition.pressure === profile.score.pressure;
}
function betterExposure(previous, candidate) {
  const safe = candidate && candidate.version === ENVIRONMENT_EXPOSURE_VERSION ? candidate : null;
  if (!safe) return previous;
  const prior = previous && previous.version === ENVIRONMENT_EXPOSURE_VERSION ? previous : null;
  if (!prior || compareProgressionIntegers(safe.pressureTicksQ, prior.pressureTicksQ) > 0
    || (safe.pressureTicksQ === prior.pressureTicksQ
      && compareProgressionIntegers(safe.qualityPressureTicksQ, prior.qualityPressureTicksQ) > 0)) {
    return Object.freeze({ version: ENVIRONMENT_EXPOSURE_VERSION, totalTicks: safe.totalTicks,
      pressureTicksQ: safe.pressureTicksQ, qualityPressureTicksQ: safe.qualityPressureTicksQ,
      timeAtPeakTicks: safe.timeAtPeakTicks, peakPressureQ: safe.peakPressureQ,
      currentLevel: safe.currentLevel });
  }
  return prior;
}
function rejected(reason,key,meta,archive){return Object.freeze({applied:false,reason,key,meta,archive,score:null,trophyIds:[]})}
