import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EVOLUTION_ARCHETYPES, EVOLUTION_COMPILER_VERSIONS, EVOLUTION_COST_VERSION, EVOLUTION_LAYOUT,
  EVOLUTION_ROOT_CELL, EVOLUTION_TOPOLOGY, availableEvolutionCells, buildEvolutionProjection,
  compileEvolution, evolutionArchetypeForCell, evolutionCellState, evolutionCostForTargetLevel,
  evolutionLevel, getEvolutionAdjacentCells, normalizeEvolutionLevels, purchaseEvolutionLevel,
  validateEvolutionAuthority,
} from '../../src/game/skills/index.js';
import { compareProgressionIntegers } from '../../src/core/progression-integer.js';
import { defaultMeta } from '../../src/platform/storage.js';

test('Evolution uses one validated level-4 cell authority and deterministic connected regions', () => {
  const authority = validateEvolutionAuthority(); const layout = EVOLUTION_LAYOUT.diagnostics;
  assert.equal(authority.valid, true); assert.deepEqual([EVOLUTION_TOPOLOGY.nodeCount, EVOLUTION_TOPOLOGY.edgeCount], [2562, 7680]);
  assert.equal(EVOLUTION_ARCHETYPES.length, 42); assert.equal(layout.rootCount, 1); assert.equal(EVOLUTION_ROOT_CELL, 2265);
  assert.equal(evolutionArchetypeForCell(EVOLUTION_ROOT_CELL).id, 'first-division');
  assert.deepEqual([layout.minNonRootCount, layout.maxNonRootCount], [62, 63]);
  assert.ok([...layout.componentCount].every((count) => count === 1));
  assert.ok([...layout.domainComponentCount].every((count) => count === 1));
  assert.equal(layout.digest, '09da2261');
  assert.equal(layout.root.land, true); assert.equal(layout.root.greenBiome, true);
  assert.equal(layout.root.greenNeighbors, layout.root.degree);
  for (let tier = 2; tier <= 5; tier++) {
    assert.ok(layout.tierMedianRootDistance[tier] > layout.tierMedianRootDistance[tier - 1]);
  }
  assert.ok(EVOLUTION_ARCHETYPES.every((archetype) => archetype.nameEn && archetype.summary
    && archetype.description && archetype.effects.length));
  const ring = getEvolutionAdjacentCells(EVOLUTION_ROOT_CELL).map(evolutionArchetypeForCell);
  assert.ok(ring.every((archetype) => archetype.domain === 'Foundation' && archetype.tier === 1));
  assert.equal(new Set(ring.map((archetype) => archetype.id)).size, ring.length);
});

test('fresh progression exposes only First Division and direct fine adjacency owns the frontier', () => {
  const fresh = { ...defaultMeta(), echoBalance: '1000' }; const projection = buildEvolutionProjection(fresh);
  assert.deepEqual(availableEvolutionCells(projection), [EVOLUTION_ROOT_CELL]);
  const root = purchase(fresh, EVOLUTION_ROOT_CELL, 'root'); assert.equal(root.ok, true);
  assert.deepEqual(availableEvolutionCells(root.meta).filter((cell) => evolutionLevel(root.meta, cell) === '0').sort((a, b) => a - b),
    [...getEvolutionAdjacentCells(EVOLUTION_ROOT_CELL)].sort((a, b) => a - b));
  const distant = EVOLUTION_LAYOUT.rootDistance.findIndex((distance) => distance > 1);
  assert.equal(evolutionCellState(root.meta, distant).reason, 'adjacency-required');
});

test('one transaction changes one local level and rejects duplicate, stale, malformed, and active-World commands without spend', () => {
  const meta = { ...defaultMeta(), echoBalance: '1000' }; const first = purchase(meta, EVOLUTION_ROOT_CELL, 'once');
  assert.equal(first.ok, true); assert.equal(first.newLocalLevel, '1'); assert.equal(first.newAggregateRank, '1');
  assert.deepEqual(first.meta.evolutionLevels, [{ cell: EVOLUTION_ROOT_CELL, level: '1' }]);
  const state = evolutionCellState(first.meta, EVOLUTION_ROOT_CELL);
  const base = { expectedLocalLevel: state.localLevel, expectedAggregateRank: state.aggregateRank,
    expectedRevision: first.meta.revision };
  const cases = [
    ['duplicate-transaction', { ...base, transactionKey: 'once' }],
    ['stale-local-level', { ...base, expectedLocalLevel: '0', transactionKey: 'stale-local' }],
    ['stale-aggregate-rank', { ...base, expectedAggregateRank: '0', transactionKey: 'stale-rank' }],
    ['stale-revision', { ...base, expectedRevision: '0', transactionKey: 'stale-revision' }],
    ['world-active', { ...base, transactionKey: 'active', activeWorld: true }],
    ['invalid-precondition', { ...base, expectedLocalLevel: '-1', transactionKey: 'malformed' }],
  ];
  for (const [reason, command] of cases) {
    const result = purchaseEvolutionLevel(first.meta, EVOLUTION_ROOT_CELL, command);
    assert.equal(result.ok, false); assert.equal(result.reason, reason); assert.equal(result.spent, '0');
    assert.equal(result.balanceAfter, first.meta.echoBalance); assert.equal(result.meta, first.meta);
  }
  assert.equal(purchaseEvolutionLevel(first.meta, -1, { ...base, transactionKey: 'invalid-cell' }).reason, 'unknown-cell');
});

test('repeated cells share one exact aggregate-rank cost sequence and one compiler', () => {
  const archetypeIndex = EVOLUTION_LAYOUT.archetypeByCell.find((index) => index !== EVOLUTION_LAYOUT.rootArchetype);
  const cells = Array.from(EVOLUTION_LAYOUT.archetypeByCell).flatMap((index, cell) => index === archetypeIndex ? [cell] : []);
  assert.ok(cells.length >= 2); const archetype = EVOLUTION_ARCHETYPES[archetypeIndex]; const [left, right] = cells;
  const firstRank = { ...defaultMeta(), echoBalance: '999999', evolutionLevels: [{ cell: left, level: '1' }] };
  const rightState = evolutionCellState(firstRank, right);
  assert.equal(rightState.localLevel, '0'); assert.equal(rightState.aggregateRank, '1');
  assert.equal(rightState.nextCost, evolutionCostForTargetLevel(archetype, '2'));
  assert.ok(compareProgressionIntegers(rightState.nextCost, evolutionCostForTargetLevel(archetype, '1')) > 0);
  const concentrated = compileEvolution({ evolutionLevels: [{ cell: left, level: '2' }] });
  const distributed = compileEvolution({ evolutionLevels: [{ cell: left, level: '1' }, { cell: right, level: '1' }] });
  assert.deepEqual(distributed, concentrated);
});

test('costs remain exact and monotone at huge aggregate ranks', () => {
  const archetype = EVOLUTION_ARCHETYPES[0]; const levels = ['1', '2', '3', '10', `1${'0'.repeat(256)}`];
  const costs = levels.map((level) => evolutionCostForTargetLevel(archetype, level));
  assert.ok(costs.every((cost, index) => index === 0 || compareProgressionIntegers(cost, costs[index - 1]) > 0));
  assert.equal(EVOLUTION_COST_VERSION, 2); assert.equal(EVOLUTION_COMPILER_VERSIONS.cost, 2);
  const huge = compileEvolution({ evolutionLevels: [{ cell: EVOLUTION_ROOT_CELL, level: levels.at(-1) }] });
  assert.ok(Object.values(huge.effects).every(Number.isFinite)); assert.ok(Object.values(huge.ecology).every(Number.isFinite));
});

test('sparse cell vectors are canonical and invalid documents reset as one untrusted unit', () => {
  assert.deepEqual(normalizeEvolutionLevels({ evolutionLevels: [{ cell: 9, level: '2' }, { cell: 1, level: '3' }] }),
    [{ cell: 1, level: '3' }, { cell: 9, level: '2' }]);
  for (const evolutionLevels of [
    [{ cell: 1, level: '0' }], [{ cell: 1, level: '1' }, { cell: 1, level: '2' }],
    [{ cell: -1, level: '1' }], [{ cell: 2562, level: '1' }], [{ cell: 1, level: '01' }],
    [{ cell: 1, level: '1', id: 'old' }],
  ]) assert.deepEqual(normalizeEvolutionLevels({ evolutionLevels }), []);
});

function purchase(meta, cell, key) {
  const state = evolutionCellState(meta, cell, cell);
  return purchaseEvolutionLevel(meta, cell, { transactionKey: key, expectedLocalLevel: state.localLevel,
    expectedAggregateRank: state.aggregateRank, expectedRevision: meta.revision });
}
