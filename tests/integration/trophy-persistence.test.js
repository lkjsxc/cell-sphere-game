/** Deferred Trophy migration, bounded proof, and idempotent result awards. */
import { test } from 'node:test'; import assert from 'node:assert/strict';
import { validateMeta, defaultMeta } from '../../src/platform/storage.js';
import { validateHistory, appendAbandonedWorld } from '../../src/platform/history.js';
import { TROPHY_IDS } from '../../src/game/trophies/index.js';
import { reconcileTrophies } from '../../src/game/trophies/evaluator.js';
import { buildTrophyFacts, deriveLegacyTrophyFacts, validateTrophyFacts } from '../../src/game/trophies/facts.js';
import { applyRunResult } from '../../src/interface/policies/run-result.js';

test('schema-5 migration preserves progression and grants no trophies on load', () => {
  const loaded = validateMeta({ schema: 5, runs: 12, bestScore: 90000, totalEchoes: 70, echoBalance: 17,
    worldSeedIndex: 12, memoryNodes: ['reach-horizon-instinct'], imprints: [] });
  assert.equal(loaded.schema, 6); assert.equal(loaded.runs, 12); assert.equal(loaded.bestScore, 90000);
  assert.deepEqual(loaded.trophyIds, []); assert.equal(loaded.trophyBackfillVersion, 0);
  assert.equal(loaded.migrationNotice, null);
});

test('schema-6 Trophy state is canonical, bounded, and corruption-safe', () => {
  const raw = { ...defaultMeta(), trophyIds: [TROPHY_IDS[5], 'unknown-trophy', TROPHY_IDS[0], TROPHY_IDS[5]],
    trophyBackfillVersion: 1, trophyProgress: { adaptationIds: ['long-filaments', 'fake-card'],
      geographyMask: 999, geographyVersion: 2, crisisMask: -1, adaptationCategoryMask: 63 } };
  const clean = validateMeta(raw); assert.deepEqual(clean.trophyIds, [TROPHY_IDS[0], TROPHY_IDS[5]]);
  assert.deepEqual(clean.trophyProgress, { adaptationIds: ['long-filaments'], geographyMask: 63,
    geographyVersion: 2, crisisMask: 0, adaptationCategoryMask: 63 });
  assert.deepEqual(validateMeta(clean), clean);
});

test('schema-6 legacy geography progress preserves ownership but clears old lake bit', () => {
  const owned = 'reach-river-touch';
  const migrated = validateMeta({ ...defaultMeta(), trophyIds: [owned],
    trophyProgress: { adaptationIds: [], geographyMask: 2, crisisMask: 0, adaptationCategoryMask: 0 } });
  assert.ok(migrated.trophyIds.includes(owned)); assert.equal(migrated.trophyProgress.geographyMask & 2, 0);
  assert.equal(migrated.trophyProgress.geographyVersion, 2);
  const outcome = reconcileTrophies(validateMeta({ ...defaultMeta(), trophyProgress: {
    adaptationIds: [], geographyMask: 2, crisisMask: 0, adaptationCategoryMask: 0 } }), { worlds: [] });
  assert.equal(outcome.awardedIds.includes(owned), false);
});

test('legacy History backfills only at an explicit reconciliation transaction', () => {
  const meta = validateMeta({ schema: 5, runs: 3, bestScore: 100, totalEchoes: 10, echoBalance: 10 });
  const archive = validateHistory({ schema: 2, worlds: [{ seed: 7, tick: 1800, score: 100, events: [
    { seq: 0, tick: 100, kind: 'world', key: 'geo.coast.reached', primaryCells: [2] },
  ] }] });
  assert.deepEqual(meta.trophyIds, []); const result = reconcileTrophies(meta, archive);
  assert.equal(result.backfilled, true); assert.ok(result.awardedIds.includes('reach-coast-touch'));
  assert.ok(result.awardedIds.includes('evolution-first-world')); assert.equal(result.meta.trophyBackfillVersion, 1);
});

test('legacy waterway evidence is retained but never converted into lake proof', () => {
  const migrated = validateTrophyFacts({ version: 1, geographyMask: 2 });
  assert.equal(migrated.version, 2); assert.equal(migrated.geographyMask & 2, 0);
  const legacy = deriveLegacyTrophyFacts({ tick: 20, events: [{ key: 'geo.river.reached' }] });
  assert.equal(legacy.geographyMask & 2, 0);
  const current = buildTrophyFacts({ history: [{ type: 'geo-lake' }], offers: [], reach: {} }, { breakdown: [] });
  assert.equal(current.geographyMask & 2, 2);
  const outcome = reconcileTrophies(defaultMeta(), { worlds: [{ score: 0, trophyFacts: legacy }] });
  assert.equal(outcome.awardedIds.includes('reach-river-touch'), false);
});

test('accepted terminal result stores facts and recognizes trophies exactly once', () => {
  const result = completedResult(); const keys = new Set();
  const first = applyRunResult(defaultMeta(), { schema: 3, worlds: [], memory: [] }, result, 24, keys);
  assert.equal(first.applied, true); assert.ok(first.trophyIds.includes('evolution-first-world'));
  assert.ok(first.trophyIds.includes('endurance-two-minutes')); assert.ok(first.archive.worlds[0].trophyFacts);
  keys.add(first.key); const duplicate = applyRunResult(first.meta, first.archive, result, 24, keys);
  assert.equal(duplicate.applied, false); assert.deepEqual(duplicate.trophyIds, []);
});

test('abandoned worlds carry no Trophy proof and do not advance run awards', () => {
  const archive = appendAbandonedWorld({ schema: 3, worlds: [], memory: [] }, {
    runId: 4, seed: 8, tick: 900, score: 20, cause: 'abandoned', history: [], offers: [] });
  assert.equal('trophyFacts' in archive.worlds[0], false);
  const outcome = reconcileTrophies(defaultMeta(), archive); assert.deepEqual(outcome.awardedIds, []);
});
function completedResult() { return { runId: 1, seed: 9, hash: 'abcd', tick: 1200, survivalSeconds: 120,
  cause: 'starvation', archetype: 'Test World', peakCoverage: .1, sustainedCoverage: .03,
  peakConnectedShare: 1, minConnectedWhileMajority: 1, totalUptake: 100, totalMaintenance: 100,
  scoreRate: 1, challengeMult: 1, crisesTotal: 0, crisesEndured: 0, offers: [], history: [],
  reach: { gained: 20, positive: [{ id: 'frontier-expansion', count: 19 }] }, imprint: null }; }
