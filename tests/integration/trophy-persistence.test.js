/** Deferred Trophy migration, bounded lake proof, queue, and idempotent result awards. */
import { test } from 'node:test'; import assert from 'node:assert/strict';
import { validateMeta, defaultMeta } from '../../src/platform/storage.js';
import { validateHistory, appendAbandonedWorld, appendTrophyEvents, defaultHistory } from '../../src/platform/history.js';
import { MEMORY_ROOT_IDS } from '../../src/game/skills/index.js';
import { TROPHY_IDS } from '../../src/game/trophies/index.js';
import { reconcileTrophies } from '../../src/game/trophies/evaluator.js';
import { buildTrophyFacts, deriveLegacyTrophyFacts, validateTrophyFacts } from '../../src/game/trophies/facts.js';
import { applyRunResult } from '../../src/interface/policies/run-result.js';
import { RunController } from '../../src/simulation/simulator.js';

test('schema-5 migration preserves progression and grants no trophies on load', () => {
  const loaded = validateMeta({ schema: 5, runs: 12, bestScore: 90000, totalEchoes: 70, echoBalance: 17,
    worldSeedIndex: 12, memoryNodes: ['reach-horizon-instinct'], imprints: [] });
  assert.equal(loaded.schema, 12); assert.equal(loaded.runs, '12'); assert.equal(loaded.bestScore, '0'); assert.equal(loaded.legacyBestScore, '90000');
  assert.deepEqual(loaded.trophyIds, []); assert.deepEqual(loaded.trophyQueue, []); assert.equal(loaded.trophyBackfillVersion, 0);
});

test('schema-8 Trophy state is canonical, bounded, corruption-safe, and idempotent', () => {
  const raw = { ...defaultMeta(), trophyIds: [TROPHY_IDS[5], 'unknown-trophy', TROPHY_IDS[0], TROPHY_IDS[5]],
    trophyQueue: [TROPHY_IDS[5], TROPHY_IDS[5], 'unknown-trophy'], trophyBackfillVersion: 3,
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
  assert.equal(result.awardedIds.includes('reach-coast-touch'), false); assert.equal(result.meta.trophyBackfillVersion, 3);
});

test('legacy choice-era worlds cannot satisfy current autonomous or quiet-world criteria', () => {
  const worlds=Array.from({length:12},(_,index)=>({id:`legacy-${index}`,seed:index+1,tick:2000,score:0,rank:'Legacy',cause:'starvation',echo:0,hash:'old',archetype:'Legacy',events:[]}));
  const result=reconcileTrophies(defaultMeta(),{...defaultHistory(),worlds});
  assert.equal(result.aggregate.autonomousWorlds,0);assert.equal(result.aggregate.zeroEventWorlds,0);
  assert.ok(!result.meta.trophyIds.includes('habitat-autonomous-patience'));assert.ok(!result.meta.trophyIds.includes('habitat-quiet-onboarding'));
});

test('habitat classes union, depleted cells sum, and reclamation uses one-world proof', () => {
  let meta={...defaultMeta(),trophyBackfillVersion:3};const facts=(mask,depleted,recovered=0)=>validateTrophyFacts({version:6,autonomous:1,habitatMask:mask,habitatClassCount:1,habitat:Array(5).fill(0),resourceDepletedCells:depleted,resourceRecoveredCells:recovered,reach:[],morph:[],scoreAxesBp:[],lake:[]});
  meta=reconcileTrophies(meta,defaultHistory(),facts(1,800,20)).meta;const second=reconcileTrophies(meta,defaultHistory(),facts(2,800,30));
  assert.equal(second.aggregate.habitatClassCount,2);assert.equal(second.aggregate.resourceDepletedCells,1600);
  assert.ok(!second.meta.trophyIds.includes('habitat-spent-landscape'));assert.ok(!second.meta.trophyIds.includes('habitat-three-habitats'));
  const third=reconcileTrophies(second.meta,defaultHistory(),facts(4,2562,49));assert.equal(third.aggregate.habitatClassCount,3);
  assert.ok(third.meta.trophyIds.includes('habitat-three-habitats'));assert.ok(!third.meta.trophyIds.includes('habitat-spent-landscape'));
  const fourth=reconcileTrophies(third.meta,defaultHistory(),facts(4,838,50));assert.ok(fourth.meta.trophyIds.includes('habitat-spent-landscape'));
});

test('exact REACH 100 and whole-cell worldmaking award current mastery criteria', () => {
  const meta={...defaultMeta(),trophyBackfillVersion:3};
  const facts=validateTrophyFacts({version:6,autonomous:1,reach100:1,transformedCells:50,electrifiedCells:50,
    reach:[],morph:[],scoreAxesBp:[],lake:[],habitat:[]});
  const result=reconcileTrophies(meta,defaultHistory(),facts);
  assert.ok(result.meta.trophyIds.includes('mastery-reach-form-vector'));
  assert.ok(result.meta.trophyIds.includes('mastery-efficient-resolve'));
});

test('SCORE mastery requires its score and quality evidence in the same world', () => {
  const meta={...defaultMeta(),bestScore:'100000',trophyBackfillVersion:3};const facts=validateTrophyFacts({version:4,autonomous:1,masteryFlags:0,reach:[],morph:[],scoreAxesBp:[10000,9000,9000,10000,9000,9000],lake:[],habitat:[]});
  const separated=reconcileTrophies(meta,defaultHistory(),facts);assert.ok(!separated.meta.trophyIds.includes('mastery-score-ninety'));
  const same=reconcileTrophies(separated.meta,defaultHistory(),{...facts,masteryFlags:1});assert.ok(same.meta.trophyIds.includes('mastery-score-ninety'));
});

test('v1 river bit and ownership never create current lake proof or award', () => {
  const migrated = validateTrophyFacts({ version: 1, geographyMask: 2 });
  assert.equal(migrated.version, 6); assert.equal(migrated.geographyMask & 2, 0); assert.deepEqual(migrated.lake, Array(11).fill(0));
  const legacy = deriveLegacyTrophyFacts({ tick: 20, events: [{ key: 'geo.river.reached' }] }); assert.equal(legacy.geographyMask & 2, 0);
  const current = buildTrophyFacts({ history: [{ type: 'geo-lake' }], offers: [], reach: {}, lakeProof: {
    lakeCellsReached: 1, shoreCellsReached: 1, distinctLakesReached: 1 } }, { breakdown: [] });
  assert.equal(current.geographyMask & 2, 2); assert.equal(current.version, 6);
  const outcome = reconcileTrophies(defaultMeta(), { worlds: [{ seed: 1, tick: 20, score: 0, trophyFacts: legacy }] });
  assert.equal(outcome.awardedIds.includes('reach-lake-network'), false);
});

test('accepted terminal result stores facts, semantic award, and persistent queue exactly once', () => {
  const result = completedResult(); const keys = new Set();
  const first = applyRunResult(defaultMeta(), defaultHistory(), result, 24, keys);
  assert.equal(first.applied, true); assert.deepEqual(first.trophyIds, ['evolution-first-world']);
  assert.deepEqual(first.meta.trophyQueue, ['evolution-first-world']); assert.ok(first.archive.worlds[0].trophyFacts);
  assert.equal(first.archive.worlds[0].events.filter((event) => event.key === 'trophy.earned').length, 1);
  assert.equal(first.archive.trophies.filter((event) => event.subjectId === 'evolution-first-world').length, 1);
  assert.deepEqual(first.meta.resultKeys, [first.key]);
  keys.add(first.key); const duplicate = applyRunResult(first.meta, first.archive, result, 24, keys);
  assert.equal(duplicate.applied, false); assert.deepEqual(duplicate.trophyIds, []); assert.equal(duplicate.archive.worlds.length, 1);
  const afterReload = applyRunResult(validateMeta(JSON.parse(JSON.stringify(first.meta))), first.archive, result, 24, new Set());
  assert.equal(afterReload.applied, false); assert.equal(afterReload.meta.totalEchoes, first.meta.totalEchoes);
  assert.equal(afterReload.archive.worlds.length, 1);
});

test('non-world progression recognition still appends one bounded semantic Trophy event', () => {
  const recognition = reconcileTrophies({ ...defaultMeta(), trophyBackfillVersion:3,
    evolutionLevels:[{id:MEMORY_ROOT_IDS[0],level:'1'}] }, defaultHistory());
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
function completedResult() { const run = new RunController({ runId: 1, seed: 9, worldOrdinal: '1' });
  run.start(); while (run.state.status !== 'extinct') run.advance(128); return run.buildResult(); }
