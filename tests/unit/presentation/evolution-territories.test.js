import test from 'node:test';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { createTopology } from '../../../src/world/icosphere.js';
import { EVOLUTION_TERRITORY_EDGE, MEMORY_NODES, createEvolutionTerritories,
  getMemoryAdjacentIds, writeEvolutionTerritoryEdges } from '../../../src/game/skills/index.js';

test('level-4 Evolution territories cover every cell once and remain connected', () => {
  const topology = createTopology(4); const projection = createEvolutionTerritories(topology);
  assert.deepEqual([topology.nodeCount, topology.edgeCount], [2562, 7680]);
  assert.equal(projection.skillCount, 42); assert.equal(projection.ownerByCell.length, topology.nodeCount);
  assert.equal(projection.cells.length, topology.nodeCount); assert.equal(projection.cellStart[42], topology.nodeCount);
  assert.equal(projection.territorySize.reduce((sum, size) => sum + size, 0), topology.nodeCount);
  assert.ok(projection.territorySize.every((size) => size >= 56 && size <= 65));
  assert.ok(projection.componentCount.every((components) => components === 1));
  for (let skill = 0; skill < projection.skillCount; skill++) {
    assert.equal(projection.ownerByCell[projection.anchorCell[skill]], skill);
    for (let offset = projection.cellStart[skill]; offset < projection.cellStart[skill + 1]; offset++) {
      assert.equal(projection.ownerByCell[projection.cells[offset]], skill);
    }
    assert.ok(Math.abs(Math.hypot(...projection.centroid.subarray(skill * 3, skill * 3 + 3)) - 1) < 1e-6);
  }
});

test('visible territory contacts equal authoritative authored adjacency exactly', () => {
  const projection = createEvolutionTerritories(createTopology(4));
  const byId = new Map(MEMORY_NODES.map((node, index) => [node.id, index]));
  let actualContacts = 0;
  for (let skill = 0; skill < MEMORY_NODES.length; skill++) for (let other = skill + 1; other < MEMORY_NODES.length; other++) {
    const actual = projection.contactCountByPair[skill * projection.skillCount + other];
    const expected = getMemoryAdjacentIds(MEMORY_NODES[skill].id).includes(MEMORY_NODES[other].id);
    assert.equal(actual > 0, expected, `${MEMORY_NODES[skill].id}:${MEMORY_NODES[other].id}`);
    assert.equal(actual, projection.contactCountByPair[other * projection.skillCount + skill]);
    if (actual) { actualContacts++; assert.ok(actual >= 9 && actual <= 13); }
  }
  assert.equal(byId.size, 42); assert.equal(actualContacts, 120);
  assert.deepEqual(projection.diagnostics, {
    presentationCells: 2562, presentationEdges: 7680, skillCount: 42, coveredCells: 2562,
    minSize: 56, maxSize: 65, tieCellCount: 36, actualContacts: 120, expectedContacts: 120,
    minContactEdges: 9, maxContactEdges: 13, digest: '3fb3be93',
  });
});

test('construction is deterministic and edge emphasis preserves static ownership', () => {
  const topology = createTopology(4); const started = performance.now();
  const first = createEvolutionTerritories(topology); const elapsed = performance.now() - started;
  const second = createEvolutionTerritories(topology);
  assert.deepEqual(first.ownerByCell, second.ownerByCell); assert.deepEqual(first.cellStart, second.cellStart);
  assert.deepEqual(first.cells, second.cells); assert.deepEqual(first.anchorCell, second.anchorCell);
  assert.deepEqual(first.edgeType, second.edgeType); assert.deepEqual(first.diagnostics, second.diagnostics);
  assert.ok(elapsed < 100, `territory construction took ${elapsed} ms`);

  const emphasized = new Uint8Array(first.skillCount); emphasized[1] = 1;
  const edges = writeEvolutionTerritoryEdges(first, 0, emphasized);
  for (let edge = 0; edge < topology.edgeCount; edge++) {
    const ownerA = first.ownerByCell[topology.edgeA[edge]]; const ownerB = first.ownerByCell[topology.edgeB[edge]];
    const expected = ownerA === ownerB ? EVOLUTION_TERRITORY_EDGE.INTERNAL
      : ownerA === 0 || ownerB === 0 ? EVOLUTION_TERRITORY_EDGE.SELECTED
        : ownerA === 1 || ownerB === 1 ? EVOLUTION_TERRITORY_EDGE.EMPHASIZED : EVOLUTION_TERRITORY_EDGE.BOUNDARY;
    assert.equal(edges[edge], expected);
  }
  assert.throws(() => writeEvolutionTerritoryEdges(first, 42), /selected Evolution territory/);
});
