/** Pure, idempotent cross-run transaction; browser persistence happens outside. */
import { scoreResult } from '../../game/scoring.js';
import { appendTrophyEvents, appendWorld } from '../../platform/history.js';
import { convertImprintToAtlas } from '../../platform/storage.js';
import { reconcileTrophies } from '../../game/trophies/evaluator.js';

export function applyRunResult(meta, archive, result, retention, lastKey = null) {
  const key = result.resultTransactionKey ?? `${result.runId ?? 0}:${result.seed}:${result.hash}:${result.tick}`;
  const alreadyApplied = meta.resultKeys?.includes(key) || (lastKey instanceof Set ? lastKey.has(key) : key === lastKey);
  if (alreadyApplied) return Object.freeze({ applied: false, key, meta, archive, score: null, trophyIds: [] });
  const score = scoreResult(result); const converted = result.imprint?.edges?.length
    ? convertImprintToAtlas(result.imprint) : null;
  const nextMeta = {
    ...meta,
    runs: meta.runs + 1,
    totalEchoes: meta.totalEchoes + score.echoes,
    echoBalance: meta.echoBalance + score.echoes,
    bestScore: Math.max(meta.bestScore, score.total),
    resultKeys: [...(meta.resultKeys ?? []).filter((entry) => entry !== key), key].slice(-16),
    imprints: converted ? [...meta.imprints, converted].slice(-8) : meta.imprints,
  };
  const appended = appendWorld(archive, result, score, nextMeta.runs, retention); const record = appended.worlds.at(-1);
  const trophies = reconcileTrophies(nextMeta, appended, record?.trophyFacts);
  const nextArchive = appendTrophyEvents(appended, trophies.awardedIds, record?.id);
  return Object.freeze({ applied: true, key, meta: trophies.meta, archive: nextArchive, score,
    trophyIds: trophies.awardedIds, trophiesBackfilled: trophies.backfilled });
}
