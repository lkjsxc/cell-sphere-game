/** Current Trophy proof, persistence, and exact award transactions. */
import { test } from 'node:test'; import assert from 'node:assert/strict';
import { validateMeta, defaultMeta } from '../../src/platform/storage.js';
import { validateHistory, appendAbandonedWorld, appendTrophyEvents, defaultHistory } from '../../src/platform/history.js';
import { MEMORY_ROOT_IDS } from '../../src/game/skills/index.js';
import { TROPHY_IDS } from '../../src/game/trophies/index.js';
import { reconcileTrophies } from '../../src/game/trophies/evaluator.js';
import { buildTrophyFacts, validateTrophyFacts } from '../../src/game/trophies/facts.js';
import { applyRunResult } from '../../src/interface/policies/run-result.js';
import { RunController } from '../../src/simulation/simulator.js';

test('mismatched Trophy persistence schemas reset without migration', () => {
  assert.deepEqual(validateMeta({ schema: 13, trophyIds: TROPHY_IDS.slice(0, 2), crisisMask: 7 }), defaultMeta());
  assert.deepEqual(validateHistory({ schema: 8, worlds: [] }), defaultHistory());
});

test('current Trophy state is canonical, bounded, corruption-safe, and idempotent', () => {
  const raw = { ...defaultMeta(), trophyIds: [TROPHY_IDS[5], 'unknown-trophy', TROPHY_IDS[0], TROPHY_IDS[5]],
    trophyQueue: [TROPHY_IDS[5], TROPHY_IDS[5], 'unknown-trophy'],
    trophyProgress: { geographyMask: 999, geographyVersion: 3, lakeTypeMask: 999, lakeSalinityMask: 999,
      aggregate: { survivalSeconds: 12, unknown: 999 } } };
  const clean = validateMeta(raw); assert.deepEqual(clean.trophyIds, [TROPHY_IDS[0], TROPHY_IDS[5]]);
  assert.deepEqual(clean.trophyQueue, [TROPHY_IDS[5]]); assert.equal(clean.trophyProgress.geographyMask, 63);
  assert.equal(clean.trophyProgress.lakeTypeMask, 31); assert.equal(clean.trophyProgress.lakeSalinityMask, 7);
  assert.deepEqual(clean.trophyProgress.aggregate, { survivalSeconds: 12 }); assert.deepEqual(validateMeta(clean), clean);
});

test('Trophy reconciliation consumes only current facts supplied by authoritative changes', () => {
  const archive = { ...defaultHistory(), worlds: [{ id: 'old', seed: 7, tick: 5000, trophyFacts: { flags: 255 } }] };
  const none = reconcileTrophies(defaultMeta(), archive);
  assert.equal(none.backfilled, false); assert.equal(none.evaluatedWorlds, 0); assert.equal(none.aggregate.environmentExposureWorld, 0);
  const facts = validateTrophyFacts({ version: 7, autonomous: 1, survivalSeconds: 90, geographyMask: 3,
    reach: [12], morph: [1, 1, 1], scoreAxesBp: [], lake: [], habitat: [], resourceDepletedCells: 20 });
  const applied = reconcileTrophies(none.meta, archive, facts);
  assert.equal(applied.evaluatedWorlds, 1); assert.equal(applied.aggregate.survivalSeconds, 90);
  assert.equal(applied.aggregate.geographyMask, 3); assert.equal(applied.aggregate.resourceDepletedCells, 20);
});

test('current facts derive whole-cell lake proof without retired river evidence', () => {
  const facts = buildTrophyFacts({ history: [{ type: 'geo-lake' }], offers: [], reach: {}, lakeProof: {
    lakeCellsReached: 1, shoreCellsReached: 1, distinctLakesReached: 1 } }, { breakdown: [] });
  assert.equal(facts.geographyMask & 2, 2); assert.equal(facts.version, 7);
  assert.equal('legacy' in facts, false);
});

test('accepted terminal result stores facts, semantic awards, and persistent queue exactly once', () => {
  const result = completedResult(); const keys = new Set(); const first = applyRunResult(defaultMeta(), defaultHistory(), result, 24, keys);
  assert.equal(first.applied, true); assert.ok(first.trophyIds.length > 0); assert.deepEqual(first.meta.trophyQueue, first.trophyIds);
  assert.ok(first.archive.worlds[0].trophyFacts); assert.equal(first.archive.worlds[0].events.filter((event) => event.key === 'trophy.earned').length, first.trophyIds.length);
  assert.equal(first.archive.trophies.length, first.trophyIds.length); assert.deepEqual(first.meta.resultKeys, [first.key]);
  keys.add(first.key); const duplicate = applyRunResult(first.meta, first.archive, result, 24, keys);
  assert.equal(duplicate.applied, false); assert.deepEqual(duplicate.trophyIds, []); assert.equal(duplicate.archive.worlds.length, 1);
  const afterReload = applyRunResult(validateMeta(JSON.parse(JSON.stringify(first.meta))), first.archive, result, 24, new Set());
  assert.equal(afterReload.applied, false); assert.equal(afterReload.meta.totalEchoes, first.meta.totalEchoes);
});

test('non-world Evolution recognition appends one bounded semantic Trophy event', () => {
  const recognition = reconcileTrophies({ ...defaultMeta(), evolutionLevels: [{ id: MEMORY_ROOT_IDS[0], level: '1' }] }, defaultHistory());
  assert.ok(recognition.awardedIds.includes('evolution-first-skill'));
  const archive = appendTrophyEvents(defaultHistory(), recognition.awardedIds);
  assert.equal(archive.trophies.length, recognition.awardedIds.length);
  assert.deepEqual(appendTrophyEvents(archive, recognition.awardedIds).trophies, archive.trophies);
});

test('abandoned worlds carry no Trophy proof and do not advance awards', () => {
  const result = completedResult(); const archive = appendAbandonedWorld(defaultHistory(), { ...result, runId: 4, cause: 'abandoned' });
  assert.equal(archive.worlds.length, 1); assert.equal('trophyFacts' in archive.worlds[0], false);
  const outcome = reconcileTrophies(defaultMeta(), archive); assert.deepEqual(outcome.awardedIds, []);
});
function completedResult() { const run = new RunController({ runId: 1, seed: 9, worldOrdinal: '1' });
  run.start(); while (run.state.status !== 'extinct') run.advance(128); return run.buildResult(); }
