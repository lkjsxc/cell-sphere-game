/** Authored Evolution graph and fine territorial presentation integration. */
import { test } from 'node:test'; import assert from 'node:assert/strict';
import { createGeodesicTopology, createTopology } from '../../src/world/icosphere.js';
import { MEMORY_NODES, MEMORY_PHYSICAL_ADJACENCY, availableMemoryNodes, buildMemorySnapshot,
  compileEvolution, createEvolutionTerritories, evolutionCellState, getMemoryAdjacentIds, getMemoryNode,
  normalizeEvolutionLevels, purchaseEvolutionLevel, validateMemoryGraph } from '../../src/game/skills/index.js';
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
test('Evolution scene projects 42 authored states over every level-4 presentation cell', () => {
  const topology = createTopology(4); const territories = createEvolutionTerritories(topology);
  const snapshot = buildMemorySnapshot(territories, { ...defaultMeta(), echoBalance: '8' });
  assert.equal(snapshot.memoryStatus.length, 2562); assert.equal(snapshot.memoryNodeIndex.filter((index) => index >= 0).length, 2562);
  assert.equal(snapshot.nodeStates.length, 42); assert.equal(createMemoryFields(topology).biomeId.length, 2562);
  assert.equal(new Set(snapshot.memoryOwner).size, 42); assert.equal(snapshot.memoryTerritoryEdge.length, 7680);
  for (let skill = 0; skill < 42; skill++) {
    const values = snapshot.memoryStatus.filter((_, cell) => snapshot.memoryOwner[cell] === skill);
    assert.equal(new Set(values).size, 1, `skill ${skill} had mixed territory state`);
  }
  const canvas = { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 1000 }) };
  const hit = pickNode(canvas, 500, 500, createCamera(), topology); assert.ok(hit);
  assert.ok(territories.ownerByCell[hit.node] >= 0 && territories.ownerByCell[hit.node] < 42);
  const boundary = topology.edgeA.findIndex((cell, edge) => territories.ownerByCell[cell] !== territories.ownerByCell[topology.edgeB[edge]]);
  assert.ok(boundary >= 0); assert.notEqual(territories.ownerByCell[topology.edgeA[boundary]], territories.ownerByCell[topology.edgeB[boundary]]);
});
test('coarse Evolution Imprints project over owned fine territories without durable expansion', () => {
  const topology = createTopology(4); const territories = createEvolutionTerritories(topology);
  const imprintCells = Array.from({ length: 12 }, (_, cell) => cell);
  const meta = { ...defaultMeta(), imprints: [{ kind: 'strongest-corridor', seed: 7, cells: imprintCells,
    topology: { kind: 'geodesic', frequency: 2, nodeCount: 42, edgeCount: 120 } }] };
  const snapshot = buildMemorySnapshot(territories, meta); const imprintedSkills = new Set(imprintCells.map((cell) => territories.skillBySiteCell[cell]));
  for (let cell = 0; cell < topology.nodeCount; cell++) {
    assert.equal(snapshot.memoryImprintWeight[cell] > 0, imprintedSkills.has(territories.ownerByCell[cell]));
  }
  assert.deepEqual(meta.imprints[0].cells, imprintCells); assert.equal(meta.imprints[0].topology.frequency, 2);
});
test('a selected ready territory uses the same exact state for pointer and keyboard purchase paths', () => {
  const meta = { ...defaultMeta(), echoBalance: '100' }; const state = evolutionCellState(meta, 'first-division', 'first-division');
  assert.equal(state.selectedReady, true); const purchased = purchaseEvolutionLevel(meta, 'first-division', { expectedLevel: state.currentLevel,
    expectedRevision: meta.revision, transactionKey: 'one-purchase' });
  assert.equal(purchased.ok, true); assert.equal(purchased.spent, '8');
  const stale = purchaseEvolutionLevel(purchased.meta, 'first-division', { expectedLevel: state.currentLevel, expectedRevision: meta.revision, transactionKey: 'keyboard-stale' });
  assert.equal(stale.ok, false); assert.equal(stale.balanceAfter, purchased.meta.echoBalance);
});
