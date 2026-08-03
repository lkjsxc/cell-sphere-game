/** Exact harder Trophy catalog, proof boundaries, evaluation, and cellular projection. */
import { test } from 'node:test'; import assert from 'node:assert/strict';
import { TROPHIES, TROPHY_IDS, groupedTrophies, validateTrophyCatalog } from '../../src/game/trophies/index.js';
import { TROPHY_ATLAS_HASH, TROPHY_ATLAS_REVERSE, validateTrophyAtlas } from '../../src/game/trophies/atlas.js';
import { reconcileTrophies, trophyConditionMet } from '../../src/game/trophies/evaluator.js';
import { TROPHY_MAX_KEYS, TROPHY_SUM_KEYS } from '../../src/game/trophies/keys.js';
import { buildTrophySnapshot } from '../../src/game/trophies/scene.js';
import { MEMORY_NODE_IDS } from '../../src/game/skills/index.js';
import { defaultMeta } from '../../src/platform/storage.js'; import { createTopology } from '../../src/world/icosphere.js';

test('catalog contains exactly 96 unique difficult frozen achievements in six families', () => {
  const report = validateTrophyCatalog(); assert.equal(report.valid, true, report.errors.join('\n'));
  assert.equal(TROPHIES.length, 96); assert.equal(TROPHY_IDS.length, 96); assert.equal(new Set(TROPHY_IDS).size, 96);
  assert.deepEqual(groupedTrophies().map((group) => group.trophies.length), [16, 16, 16, 16, 16, 16]);
  assert.equal(new Set(TROPHIES.map((trophy) => trophy.criteriaEn)).size, 96);
  assert.equal(new Set(TROPHIES.map((trophy) => JSON.stringify(trophy.condition))).size, 96);
  assert.equal(TROPHIES.some((trophy) => trophy.id === 'reach-river-touch'), false);
  assert.equal(TROPHIES.every((trophy) => Object.isFrozen(trophy) && trophy.description === trophy.criteriaEn), true);
});

test('level-2 Trophy Sphere maps six connected constellations and 66 neutral cells', () => {
  const report = validateTrophyAtlas(); assert.equal(report.valid, true, report.errors.join('\n'));
  assert.deepEqual({ cells: report.cells, unique: report.unique, neutral: report.neutral }, { cells: 96, unique: 96, neutral: 66 });
  assert.equal(report.hash, '93870583'); assert.equal(TROPHY_ATLAS_HASH, '93870583');
  assert.equal(TROPHY_ATLAS_REVERSE.filter((index) => index >= 0).length, 96);
});

test('every rich condition has passing evidence and a failing leaf boundary', () => {
  for (const trophy of TROPHIES) { const aggregate = {}; for (const leaf of leaves(trophy.condition))
      aggregate[leaf.key] = Math.max(aggregate[leaf.key] ?? 0, leaf.rule === 'includes' ? leaf.mask : leaf.value);
    assert.equal(trophyConditionMet(trophy.condition, aggregate), true, trophy.id);
    const leaf = leaves(trophy.condition)[0]; const low = { ...aggregate, [leaf.key]: leaf.rule === 'includes' ? leaf.mask & (leaf.mask - 1) : leaf.value - 1 };
    assert.equal(trophyConditionMet(trophy.condition, low), false, trophy.id);
  }
});

test('maximal persisted proof recognizes all 96 while empty load data recognizes none', () => {
  const empty = reconcileTrophies({ ...defaultMeta(), trophyBackfillVersion: 2 }, { worlds: [] }); assert.deepEqual(empty.awardedIds, []);
  const aggregate = Object.fromEntries([...TROPHY_MAX_KEYS, ...TROPHY_SUM_KEYS].map((key) => [key, 10_000_000]));
  const meta = { ...defaultMeta(), runs: 240, bestScore: 2_000_000, totalEchoes: 4000, memoryNodes: MEMORY_NODE_IDS,
    imprints: Array.from({ length: 8 }, () => ({ kind: 'strongest-corridor' })), trophyBackfillVersion: 2,
    trophyProgress: { ...defaultMeta().trophyProgress, geographyMask: 63, crisisMask: 127, adaptationCategoryMask: 63,
      lakeTypeMask: 31, lakeSalinityMask: 7, adaptationIds: allAdaptations(), aggregate } };
  const result = reconcileTrophies(meta, { worlds: [] }); assert.equal(result.awardedIds.length, 96); assert.deepEqual(result.meta.trophyIds, TROPHY_IDS);
  assert.deepEqual(result.meta.trophyQueue, TROPHY_IDS);
});

test('Trophy projection is read-only, exact, and leaves neutral cells inert', () => {
  const topo = createTopology(2); const earned = TROPHY_IDS.slice(0, 3);
  const snapshot = buildTrophySnapshot(topo, { trophyIds: earned }, TROPHY_IDS[3], earned);
  assert.equal(snapshot.status, 'trophies'); assert.equal(snapshot.nodeStates.length, 96);
  assert.equal(snapshot.memoryStatus.length, 162); assert.equal(snapshot.memoryNodeIndex.filter((index) => index < 0).length, 66);
  assert.equal(snapshot.nodeStates.filter((node) => node.earned).length, 3);
  assert.equal('alive' in snapshot, false); assert.equal('effects' in snapshot.trophyScene, false);
});
function leaves(condition) { return ['all','any'].includes(condition.rule) ? condition.conditions.flatMap(leaves) : [condition]; }
function allAdaptations() { return ['long-filaments','frugal-cytoplasm','anastomosis','thermal-proteins','dormant-cysts','salt-vesicles',
  'exploratory-fans','pulsed-transport','cannibal-reclamation','symbiotic-film','adaptive-membrane','hollow-veins','dense-cords','migratory-core',
  'spore-memory','distributed-sensing','local-sacrifice','redundant-loops','opportunistic-uptake','quiet-metabolism','fever-growth','cold-reserve','toxin-catalysis','fractal-frontier']; }
