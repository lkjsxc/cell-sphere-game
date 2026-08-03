/** Deferred Trophy migration, bounded lake proof, queue, and idempotent result awards. */
import { test } from 'node:test'; import assert from 'node:assert/strict';
import { validateMeta, defaultMeta } from '../../src/platform/storage.js';
import { validateHistory, appendAbandonedWorld, appendTrophyEvents, defaultHistory } from '../../src/platform/history.js';
import { MEMORY_ROOT_IDS } from '../../src/game/skills/index.js';
import { TROPHY_IDS } from '../../src/game/trophies/index.js';
import { reconcileTrophies } from '../../src/game/trophies/evaluator.js';
import { buildTrophyFacts, deriveLegacyTrophyFacts, validateTrophyFacts } from '../../src/game/trophies/facts.js';
import { applyRunResult } from '../../src/interface/policies/run-result.js';

test('schema-5 migration preserves progression and grants no trophies on load', () => {
  const loaded = validateMeta({ schema: 5, runs: 12, bestScore: 90000, totalEchoes: 70, echoBalance: 17,
    worldSeedIndex: 12, memoryNodes: ['reach-horizon-instinct'], imprints: [] });
  assert.equal(loaded.schema, 8); assert.equal(loaded.runs, 12); assert.equal(loaded.bestScore, 90000);
  assert.deepEqual(loaded.trophyIds, []); assert.deepEqual(loaded.trophyQueue, []); assert.equal(loaded.trophyBackfillVersion, 0);
});

test('schema-8 Trophy state is canonical, bounded, corruption-safe, and idempotent', () => {
  const raw = { ...defaultMeta(), trophyIds: [TROPHY_IDS[5], 'unknown-trophy', TROPHY_IDS[0], TROPHY_IDS[5]],
    trophyQueue: [TROPHY_IDS[5], TROPHY_IDS[5], 'unknown-trophy'], trophyBackfillVersion: 2,
    trophyProgress: { adaptationIds: ['long-filaments', 'fake-card'], geographyMask: 999, geographyVersion: 3,
      crisisMask: -1, adaptationCategoryMask: 63, lakeTypeMask: 999, lakeSalinityMask: 999,
      aggregate: { totalCrisesEndured: 12, unknown: 999 } } };
  const clean = validateMeta(raw); assert.deepEqual(clean.trophyIds, [TROPHY_IDS[0], TROPHY_IDS[5]]);
  assert.deepEqual(clean.trophyQueue, [TROPHY_IDS[5]]); assert.equal(clean.trophyProgress.geographyMask, 63);
  assert.equal(clean.trophyProgress.lakeTypeMask, 31); assert.equal(clean.trophyProgress.lakeSalinityMask, 7);
  assert.deepEqual(clean.trophyProgress.aggregate, { totalCrisesEndured: 12 }); assert.deepEqual(validateMeta(clean), clean);
});

test('schema-7 ownership is grandfathered except retired river ID, which becomes explicit Legacy ownership', () => {
  const former = TROPHY_IDS.map((id) => id === 'reach-lake-network' ? 'reach-river-touch' : id);
  const migrated = validateMeta({ ...defaultMeta(), schema: 7, trophyIds: former, trophyBackfillVersion: 1,
    trophyProgress: { adaptationIds: [], geographyMask: 2, crisisMask: 0, adaptationCategoryMask: 0 } });
  assert.deepEqual(migrated.legacyTrophyIds, ['reach-river-touch']); assert.equal(migrated.trophyIds.includes('reach-lake-network'), false);
  assert.equal(migrated.trophyIds.length, 95); assert.equal(migrated.trophyProgress.geographyMask & 2, 0);
  assert.deepEqual(validateMeta(migrated), migrated);
});

test('legacy History backfills only in an explicit transaction and cannot satisfy harder contact criteria', () => {
  const meta = validateMeta({ schema: 5, runs: 3, bestScore: 100, totalEchoes: 10, echoBalance: 10 });
  const archive = validateHistory({ schema: 2, worlds: [{ seed: 7, tick: 1800, score: 100, events: [
    { seq: 0, tick: 100, kind: 'world', key: 'geo.coast.reached', primaryCells: [2] },
  ] }] });
  assert.deepEqual(meta.trophyIds, []); const result = reconcileTrophies(meta, archive);
  assert.equal(result.backfilled, true); assert.ok(result.awardedIds.includes('evolution-first-world'));
  assert.equal(result.awardedIds.includes('reach-coast-touch'), false); assert.equal(result.meta.trophyBackfillVersion, 2);
});

test('v1 river bit and ownership never create current lake proof or award', () => {
  const migrated = validateTrophyFacts({ version: 1, geographyMask: 2 });
  assert.equal(migrated.version, 3); assert.equal(migrated.geographyMask & 2, 0); assert.deepEqual(migrated.lake, Array(11).fill(0));
  const legacy = deriveLegacyTrophyFacts({ tick: 20, events: [{ key: 'geo.river.reached' }] }); assert.equal(legacy.geographyMask & 2, 0);
  const current = buildTrophyFacts({ history: [{ type: 'geo-lake' }], offers: [], reach: {}, lakeProof: {
    lakeCellsReached: 1, shoreCellsReached: 1, distinctLakesReached: 1 } }, { breakdown: [] });
  assert.equal(current.geographyMask & 2, 2); assert.equal(current.version, 3);
  const outcome = reconcileTrophies(defaultMeta(), { worlds: [{ seed: 1, tick: 20, score: 0, trophyFacts: legacy }] });
  assert.equal(outcome.awardedIds.includes('reach-lake-network'), false);
});

test('accepted terminal result stores facts, semantic award, and persistent queue exactly once', () => {
  const result = completedResult(); const keys = new Set();
  const first = applyRunResult(defaultMeta(), { schema: 4, worlds: [], memory: [] }, result, 24, keys);
  assert.equal(first.applied, true); assert.deepEqual(first.trophyIds, ['evolution-first-world']);
  assert.deepEqual(first.meta.trophyQueue, ['evolution-first-world']); assert.ok(first.archive.worlds[0].trophyFacts);
  assert.equal(first.archive.worlds[0].events.filter((event) => event.key === 'trophy.earned').length, 1);
  assert.equal(first.archive.trophies.filter((event) => event.subjectId === 'evolution-first-world').length, 1);
  keys.add(first.key); const duplicate = applyRunResult(first.meta, first.archive, result, 24, keys);
  assert.equal(duplicate.applied, false); assert.deepEqual(duplicate.trophyIds, []); assert.equal(duplicate.archive.worlds.length, 1);
});

test('non-world progression recognition still appends one bounded semantic Trophy event', () => {
  const recognition = reconcileTrophies({ ...defaultMeta(), trophyBackfillVersion: 2, memoryNodes: [MEMORY_ROOT_IDS[0]] }, defaultHistory());
  assert.deepEqual(recognition.awardedIds, ['evolution-first-skill']); const archive = appendTrophyEvents(defaultHistory(), recognition.awardedIds);
  assert.equal(archive.trophies.length, 1); assert.equal(archive.trophies[0].subjectId, 'evolution-first-skill');
  assert.deepEqual(appendTrophyEvents(archive, recognition.awardedIds).trophies, archive.trophies);
});

test('abandoned worlds carry no Trophy proof and do not advance run awards', () => {
  const archive = appendAbandonedWorld({ schema: 4, worlds: [], memory: [] }, {
    runId: 4, seed: 8, tick: 900, score: 20, cause: 'abandoned', history: [], offers: [] });
  assert.equal('trophyFacts' in archive.worlds[0], false);
  const outcome = reconcileTrophies(defaultMeta(), archive); assert.deepEqual(outcome.awardedIds, []);
});
function completedResult() { return { runId: 1, seed: 9, hash: 'abcd', tick: 1200, survivalSeconds: 120,
  cause: 'starvation', archetype: 'Test World', peakCoverage: .1, sustainedCoverage: .03,
  peakConnectedShare: 1, minConnectedWhileMajority: 1, totalUptake: 100, totalMaintenance: 100,
  scoreRate: 1, challengeMult: 1, crisesTotal: 0, crisesEndured: 0, offers: [], history: [], lakeProof: {},
  reach: { gained: 20, positive: [{ id: 'frontier-expansion', count: 19 }] }, imprint: null }; }
