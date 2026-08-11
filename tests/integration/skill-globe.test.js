/** Compact authored Evolution sphere integration: topology, renderer projection, and exact transactions. */
import { test } from 'node:test'; import assert from 'node:assert/strict';
import { createGeodesicTopology } from '../../src/world/icosphere.js';
import { MEMORY_CELL_REVERSE, MEMORY_NODES, MEMORY_PHYSICAL_ADJACENCY, availableMemoryNodes, buildMemorySnapshot,
  compileEvolution, evolutionCellState, getMemoryAdjacentIds, getMemoryNode, normalizeEvolutionLevels, purchaseEvolutionLevel,
  validateMemoryGraph } from '../../src/game/skills/index.js';
import { createMemoryFields } from '../../src/game/skills/scene.js'; import { defaultMeta } from '../../src/platform/storage.js';
import { createCamera } from '../../src/rendering/camera.js'; import { pickNode } from '../../src/rendering/picking.js';

test('frequency-2 Evolution topology has one root, real symmetric adjacency, and authored cells', () => {
  const topology = createGeodesicTopology(2); const graph = validateMemoryGraph();
  assert.equal(graph.valid, true); assert.deepEqual([topology.nodeCount, topology.edgeCount], [42, 120]); assert.equal(MEMORY_NODES.length, 42);
  assert.equal(MEMORY_NODES.filter((node) => node.kind === 'root').map((node) => node.id).join(), 'first-division');
  for (const node of MEMORY_NODES) for (const adjacentId of getMemoryAdjacentIds(node.id)) {
    const adjacent = getMemoryNode(adjacentId); assert.ok(getMemoryAdjacentIds(adjacentId).includes(node.id));
    assert.ok(topology.nodeNeighbors.slice(topology.nodeStart[node.cell], topology.nodeStart[node.cell + 1]).includes(adjacent.cell));
  }
  assert.equal(Object.keys(MEMORY_PHYSICAL_ADJACENCY).length, 42);
});
test('legal adjacency purchases traverse every authored cell and direct compilation remains bounded', () => {
  let meta = { ...defaultMeta(), echoBalance: '100000', revision: '0' }; let guard = 0;
  while (normalizeEvolutionLevels(meta).length < MEMORY_NODES.length && guard++ < 64) {
    const node = availableMemoryNodes(meta).find((entry) => entry.currentLevel === '0'); assert.ok(node);
    const transaction = purchaseEvolutionLevel(meta, node.id, { expectedLevel: '0', expectedRevision: meta.revision, transactionKey: `breadth-${guard}` });
    assert.equal(transaction.ok, true); meta = transaction.meta;
  }
  assert.equal(normalizeEvolutionLevels(meta).length, 42); const full = compileEvolution(meta);
  assert.equal(full.totalOwnedCells, 42); assert.equal(full.luminous.enabled, true); assert.equal(full.habitatCapabilities.length, 6);
  assert.ok(Object.values(full.effects).every((value) => Number.isFinite(value) && value > 0 && value < 10));
});
test('Evolution scene projects exactly one whole-cell semantic state and CPU picking reaches it', () => {
  const topology = createGeodesicTopology(2); const snapshot = buildMemorySnapshot(topology, { ...defaultMeta(), echoBalance: '8' });
  assert.equal(snapshot.memoryStatus.length, 42); assert.equal(snapshot.memoryNodeIndex.filter((index) => index >= 0).length, 42);
  assert.equal(snapshot.nodeStates.length, 42); assert.equal(createMemoryFields(topology).biomeId.length, 42);
  const canvas = { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 1000 }) };
  const hit = pickNode(canvas, 500, 500, createCamera(), topology); assert.ok(hit); assert.ok(MEMORY_CELL_REVERSE[hit.node] >= 0);
});
test('a selected ready cell uses the same exact state for pointer and keyboard purchase paths', () => {
  const meta = { ...defaultMeta(), echoBalance: '100' }; const state = evolutionCellState(meta, 'first-division', 'first-division');
  assert.equal(state.selectedReady, true); const purchased = purchaseEvolutionLevel(meta, 'first-division', { expectedLevel: state.currentLevel,
    expectedRevision: meta.revision, transactionKey: 'one-purchase' });
  assert.equal(purchased.ok, true); assert.equal(purchased.spent, '8');
  const stale = purchaseEvolutionLevel(purchased.meta, 'first-division', { expectedLevel: state.currentLevel, expectedRevision: meta.revision, transactionKey: 'keyboard-stale' });
  assert.equal(stale.ok, false); assert.equal(stale.balanceAfter, purchased.meta.echoBalance);
});
