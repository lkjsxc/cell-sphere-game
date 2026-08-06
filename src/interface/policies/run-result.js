/** Pure, idempotent cross-run transaction; browser persistence happens outside. */
import {scoreResult,scoreResultMatchesAuthority} from '../../game/scoring.js';
import {compileEvolution} from '../../game/skills/index.js';
import { appendTrophyEvents, appendWorld } from '../../platform/history.js';
import { convertImprintToAtlas } from '../../platform/storage.js';
import { reconcileTrophies } from '../../game/trophies/evaluator.js';
import { frontierAfterEnvironmentCompletion } from '../../game/environment-level.js';
import {addProgressionIntegers,compareProgressionIntegers,incrementProgressionInteger,
  maxProgressionInteger,normalizeProgressionInteger} from '../../core/progression-integer.js';
import {boundedTransactionKey} from '../../core/hash.js';

export function applyRunResult(meta,archive,result,retention,lastKey=null){
  const key=result.resultTransactionKey??boundedTransactionKey('run-result',[result.runId??0,result.seed,result.hash,result.tick,result.worldOrdinal,result.challengeProfileHash]);
  if(typeof key!=='string'||!key||key.length>128)return rejected('invalid-result-key',key,meta,archive);
  const resultOrdinal=normalizeProgressionInteger(result.worldOrdinal,'0'),runs=normalizeProgressionInteger(meta.runs,'0');
  const duplicate=meta.resultKeys?.includes(key)||(lastKey instanceof Set?lastKey.has(key):key===lastKey)
    ||(resultOrdinal!=='0'&&compareProgressionIntegers(resultOrdinal,runs)<=0);
  if(duplicate)return rejected('duplicate-result',key,meta,archive);
  const expectedOrdinal=maxProgressionInteger(normalizeProgressionInteger(meta.worldSeedIndex,'0'),incrementProgressionInteger(runs));
  if(resultOrdinal!==expectedOrdinal)return rejected('unexpected-world-ordinal',key,meta,archive);
  let expectedPotential;try{expectedPotential=compileEvolution(meta).worldPotential}catch{return rejected('invalid-evolution-state',key,meta,archive)}
  if(normalizeProgressionInteger(result.worldPotential,'0')!==expectedPotential)return rejected('invalid-world-potential',key,meta,archive);
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
    highestEnvironmentLevel: frontierAfterEnvironmentCompletion(meta, result.environmentLevel),
    resultKeys: [...(meta.resultKeys ?? []).filter((entry) => entry !== key), key].slice(-16),
    imprints:converted?[...(meta.imprints??[]),converted].slice(-8):(meta.imprints??[]),
  };
  const appended = appendWorld(archive, result, score, nextRuns, retention); const record = appended.worlds.at(-1);
  const trophies = reconcileTrophies(nextMeta, appended, record?.trophyFacts);
  const nextArchive = appendTrophyEvents(appended, trophies.awardedIds, record?.id);
  return Object.freeze({ applied: true, key, meta: trophies.meta, archive: nextArchive, score,
    trophyIds:trophies.awardedIds,trophiesBackfilled:trophies.backfilled});
}
function rejected(reason,key,meta,archive){return Object.freeze({applied:false,reason,key,meta,archive,score:null,trophyIds:[]})}
