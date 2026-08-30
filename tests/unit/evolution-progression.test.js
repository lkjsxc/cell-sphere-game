import test from 'node:test';
import assert from 'node:assert/strict';
import { EVOLUTION_COMPILER_VERSIONS, EVOLUTION_COST_VERSION, MEMORY_CELL_BY_ID, MEMORY_NODES, MEMORY_ROOT_IDS,
  availableMemoryNodes, compileEvolution, evolutionCellState, evolutionCostForTargetLevel, evolutionLevel, getMemoryAdjacentIds,
  normalizeEvolutionLevels, purchaseEvolutionLevel, validateMemoryGraph } from '../../src/game/skills/index.js';
import { compareProgressionIntegers } from '../../src/core/progression-integer.js';
import { defaultMeta } from '../../src/platform/storage.js';

test('authored Evolution graph has 42 skills and one general-survival root', () => {
  const graph = validateMemoryGraph();
  assert.equal(graph.valid, true); assert.equal(graph.topologyFrequency, 2); assert.equal(graph.topologyCells, 42);
  assert.deepEqual(MEMORY_ROOT_IDS, ['first-division']); assert.equal(MEMORY_NODES.length, 42);
  assert.equal(new Set(Object.values(MEMORY_CELL_BY_ID)).size, 42);
  assert.ok(MEMORY_NODES.every((node) => node.nameEn && node.summary && node.description && node.effects.length));
  assert.ok(getMemoryAdjacentIds('first-division').every((id) => MEMORY_NODES.find((node) => node.id === id)?.domain === 'Foundation'));
});

test('fresh progression exposes only First Division and physical adjacency controls the frontier', () => {
  const fresh = { ...defaultMeta(), echoBalance: '1000' }; const available = availableMemoryNodes(fresh);
  assert.deepEqual(available.map((node) => node.id), ['first-division']);
  const root = purchase(fresh, 'first-division', 'root'); assert.equal(root.ok, true);
  const next = availableMemoryNodes(root.meta).filter((node) => !node.owned).map((node) => node.id).sort();
  assert.deepEqual(next, [...getMemoryAdjacentIds('first-division')].sort());
  const distant = MEMORY_NODES.find((node) => node.id === 'living-biosphere');
  assert.equal(evolutionCellState(root.meta, distant).reason, 'adjacency-required');
});

test('second activation transaction spends exactly once and stale or duplicate commands never spend', () => {
  const meta = { ...defaultMeta(), echoBalance: '1000' }; const first = purchase(meta, 'first-division', 'once');
  assert.equal(first.ok, true); assert.equal(first.newLevel, '1'); assert.equal(evolutionLevel(first.meta, 'first-division'), '1');
  const duplicate = purchaseEvolutionLevel(first.meta, 'first-division', { transactionKey: 'once', expectedLevel: '1', expectedRevision: first.meta.revision });
  assert.equal(duplicate.ok, false); assert.equal(duplicate.reason, 'duplicate-transaction'); assert.equal(duplicate.balanceAfter, first.meta.echoBalance);
  const stale = purchaseEvolutionLevel(first.meta, 'reliable-budding', { transactionKey: 'stale', expectedLevel: '0', expectedRevision: '0' });
  assert.equal(stale.ok, false); assert.equal(stale.reason, 'stale-revision'); assert.equal(stale.balanceAfter, first.meta.echoBalance);
});

test('costs remain exact and monotone at repeated and huge levels', () => {
  const root = MEMORY_NODES.find((node) => node.id === 'first-division'); const levels = ['1', '2', '3', '10', `1${'0'.repeat(256)}`];
  const costs = levels.map((level) => evolutionCostForTargetLevel(root, level));
  assert.ok(costs.every((cost, index) => index === 0 || compareProgressionIntegers(cost, costs[index - 1]) > 0));
  assert.equal(EVOLUTION_COST_VERSION, 2); assert.equal(EVOLUTION_COMPILER_VERSIONS.cost, 2);
});

test('direct compilation produces causal ecology and first Luminous ownership enables charge immediately', () => {
  const levels = [{ id: 'first-division', level: '1' }, { id: 'reliable-budding', level: '1' }, { id: 'bioelectric-spark', level: '1' }];
  const compiled = compileEvolution({ ...defaultMeta(), evolutionLevels: levels });
  assert.equal(compiled.luminous.enabled, true); assert.ok(compiled.luminous.generationScale > 0); assert.ok(compiled.luminous.visualDevelopment > 0);
  assert.ok(compiled.luminous.upkeepScale > 1); const mature = compileEvolution({ evolutionLevels: [...levels,
    { id: 'powered-transport', level: '1' }, { id: 'deep-current', level: '1' }, { id: 'luminous-crown', level: '1' }] });
  assert.ok(mature.luminous.upkeepScale < compiled.luminous.upkeepScale);
  assert.ok(compiled.effects.reach > 1); assert.equal(compiled.habitatCapabilities.length, 0); assert.deepEqual(compiled.worldmaking, { reclamation: false, cryolake: false, littoral: false });
  const normalized = normalizeEvolutionLevels({ evolutionLevels: [...levels, { id: 'removed-id', level: '9' }] });
  assert.equal(normalized.length, 3);
});
function purchase(meta, id, key) { const state = evolutionCellState(meta, id, id); return purchaseEvolutionLevel(meta, id,
  { transactionKey: key, expectedLevel: state.currentLevel, expectedRevision: meta.revision }); }
