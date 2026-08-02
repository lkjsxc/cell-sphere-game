/** Pure, idempotent cross-run transaction; browser persistence happens outside. */
import { scoreResult } from '../../game/scoring.js';
import { appendWorld } from '../../platform/history.js';
import { convertImprintToAtlas } from '../../platform/storage.js';

export function applyRunResult(meta, archive, result, retention, lastKey = null) {
  const key = `${result.seed}:${result.hash}:${result.tick}`;
  if (key === lastKey) return Object.freeze({ applied: false, key, meta, archive, score: null });
  const score = scoreResult(result); const converted = result.imprint?.edges?.length
    ? convertImprintToAtlas(result.imprint) : null;
  const nextMeta = {
    ...meta,
    runs: meta.runs + 1,
    totalEchoes: meta.totalEchoes + score.echoes,
    echoBalance: meta.echoBalance + score.echoes,
    bestScore: Math.max(meta.bestScore, score.total),
    imprints: converted ? [...meta.imprints, converted].slice(-8) : meta.imprints,
  };
  const nextArchive = appendWorld(archive, result, score, nextMeta.runs, retention);
  return Object.freeze({ applied: true, key, meta: nextMeta, archive: nextArchive, score });
}
