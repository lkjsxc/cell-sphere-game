/** Exact Trophy catalog, proof boundaries, evaluation, and cellular projection. */
import { test } from 'node:test'; import assert from 'node:assert/strict';
import { TROPHIES, TROPHY_IDS, groupedTrophies, validateTrophyCatalog } from '../../src/game/trophies/index.js';
import { TROPHY_ATLAS_HASH, TROPHY_ATLAS_REVERSE, validateTrophyAtlas } from '../../src/game/trophies/atlas.js';
import { reconcileTrophies, trophyConditionMet } from '../../src/game/trophies/evaluator.js';
import { buildTrophySnapshot } from '../../src/game/trophies/scene.js';
import { validateTrophyFacts } from '../../src/game/trophies/facts.js';
import { MEMORY_NODE_IDS } from '../../src/game/skills/index.js';
import { defaultMeta } from '../../src/platform/storage.js'; import { createTopology } from '../../src/world/icosphere.js';

test('catalog contains exactly 96 meaningful frozen achievements', () => {
  const report = validateTrophyCatalog(); assert.equal(report.valid, true, report.errors.join('\n'));
  assert.equal(TROPHIES.length, 96); assert.equal(TROPHY_IDS.length, 96); assert.equal(new Set(TROPHY_IDS).size, 96);
  assert.deepEqual(groupedTrophies().map((group) => group.trophies.length), [16, 16, 16, 16, 16, 16]);
  assert.equal(new Set(TROPHIES.map((trophy) => trophy.criteriaEn)).size, 96);
  assert.equal(TROPHIES.every((trophy) => Object.isFrozen(trophy) && trophy.description === trophy.criteriaEn), true);
});

test('level-2 Trophy Sphere maps six connected constellations and 66 neutral cells', () => {
  const report = validateTrophyAtlas(); assert.equal(report.valid, true, report.errors.join('\n'));
  assert.deepEqual({ cells: report.cells, unique: report.unique, neutral: report.neutral }, { cells: 96, unique: 96, neutral: 66 });
  assert.equal(report.hash, '93870583'); assert.equal(TROPHY_ATLAS_HASH, '93870583');
  assert.equal(TROPHY_ATLAS_REVERSE.filter((index) => index >= 0).length, 96);
});

test('every condition has a passing value and a failing boundary', () => {
  for (const trophy of TROPHIES) { const condition = trophy.condition;
    if (condition.rule === 'at-least') { assert.equal(trophyConditionMet(condition, { [condition.key]: condition.value }), true, trophy.id);
      assert.equal(trophyConditionMet(condition, { [condition.key]: condition.value - 1 }), false, trophy.id); }
    else { assert.equal(trophyConditionMet(condition, { [condition.key]: condition.mask }), true, trophy.id);
      assert.equal(trophyConditionMet(condition, { [condition.key]: condition.mask & (condition.mask - 1) }), false, trophy.id); }
  }
});

test('maximal explicit proof recognizes all 96 while empty load data recognizes none', () => {
  const empty = reconcileTrophies(defaultMeta(), { worlds: [] }); assert.deepEqual(empty.awardedIds, []);
  const facts = validateTrophyFacts({ survivalSeconds: 360, peakCoverageBp: 10000, sustainedCoverageBp: 10000,
    geographyMask: 63, crisisMask: 127, crisesEndured: 7, crisesTotal: 7,
    reach: [1500, 500, 100, 50, 1, 1], morph: [1, 2, 2], offers: [5, 3, 5, 0],
    adaptationIds: allAdaptations(), adaptationCategoryMask: 63, scoreAxesBp: [10000, 10000, 10000, 10000, 10000, 10000], flags: 31 });
  const meta = { ...defaultMeta(), runs: 164, bestScore: 750000, totalEchoes: 1000,
    memoryNodes: MEMORY_NODE_IDS, imprints: Array.from({ length: 8 }, () => ({ kind: 'strongest-corridor' })), trophyBackfillVersion: 1 };
  const result = reconcileTrophies(meta, { worlds: [{ score: 750000, trophyFacts: facts }] });
  assert.equal(result.awardedIds.length, 96); assert.deepEqual(result.meta.trophyIds, TROPHY_IDS);
});

test('Trophy projection is read-only, exact, and leaves neutral cells inert', () => {
  const topo = createTopology(2); const earned = TROPHY_IDS.slice(0, 3);
  const snapshot = buildTrophySnapshot(topo, { trophyIds: earned }, TROPHY_IDS[3], earned);
  assert.equal(snapshot.status, 'trophies'); assert.equal(snapshot.nodeStates.length, 96);
  assert.equal(snapshot.memoryStatus.length, 162); assert.equal(snapshot.memoryNodeIndex.filter((index) => index < 0).length, 66);
  assert.equal(snapshot.nodeStates.filter((node) => node.earned).length, 3);
  assert.equal('alive' in snapshot, false); assert.equal('effects' in snapshot.trophyScene, false);
});
function allAdaptations() { return ['long-filaments','frugal-cytoplasm','anastomosis','thermal-proteins','dormant-cysts','salt-vesicles',
  'exploratory-fans','pulsed-transport','cannibal-reclamation','symbiotic-film','adaptive-membrane','hollow-veins','dense-cords','migratory-core',
  'spore-memory','distributed-sensing','local-sacrifice','redundant-loops','opportunistic-uptake','quiet-metabolism','fever-growth','cold-reserve','toxin-catalysis','fractal-frontier']; }
