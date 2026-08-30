import test from 'node:test';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import {
  EVOLUTION_CELL_EDGE, EVOLUTION_LAYOUT, EVOLUTION_ROOT_CELL, EVOLUTION_TOPOLOGY,
  buildEvolutionProjection, createEvolutionCellLayout, validateEvolutionCellLayout,
  writeEvolutionCellEdges,
} from '../../../src/game/skills/index.js';
import { defaultMeta } from '../../../src/platform/storage.js';

test('the immutable weave satisfies every product-shape gate and repeats deterministically', () => {
  const diagnostics = validateEvolutionCellLayout(EVOLUTION_LAYOUT); const started = performance.now();
  const repeated = createEvolutionCellLayout(EVOLUTION_TOPOLOGY); const elapsed = performance.now() - started;
  assert.equal(diagnostics.rootCount, 1); assert.deepEqual([diagnostics.cells, diagnostics.edges], [2562, 7680]);
  assert.ok(diagnostics.minNonRootCount >= Math.ceil(2562 * .01)); assert.ok(diagnostics.maxNonRootCount <= Math.floor(2562 * .04));
  assert.ok(diagnostics.largestComponent <= 8); assert.ok(diagnostics.neighborhoodDiversity >= .95);
  assert.deepEqual(repeated.archetypeByCell, EVOLUTION_LAYOUT.archetypeByCell);
  assert.equal(repeated.diagnostics.digest, diagnostics.digest);
  assert.ok(elapsed < 100, `layout construction took ${elapsed} ms`);
});

test('fine edges classify quiet, owned, frontier, recent, and selected from exact cells', () => {
  const fresh = buildEvolutionProjection({ ...defaultMeta(), echoBalance: '1000' }, EVOLUTION_ROOT_CELL);
  const edges = writeEvolutionCellEdges(EVOLUTION_LAYOUT, fresh);
  const incident = new Set();
  for (let edge = 0; edge < EVOLUTION_TOPOLOGY.edgeCount; edge++) {
    if (EVOLUTION_TOPOLOGY.edgeA[edge] === EVOLUTION_ROOT_CELL || EVOLUTION_TOPOLOGY.edgeB[edge] === EVOLUTION_ROOT_CELL) incident.add(edge);
  }
  assert.equal(edges.filter((value) => value === EVOLUTION_CELL_EDGE.SELECTED).length, incident.size);
  for (const edge of incident) assert.equal(edges[edge], EVOLUTION_CELL_EDGE.SELECTED);
  const ownedCell = EVOLUTION_LAYOUT.rootRing[0];
  const ownedMeta = { ...defaultMeta(), echoBalance: '1000',
    evolutionLevels: [{ cell: EVOLUTION_ROOT_CELL, level: '1' }, { cell: ownedCell, level: '1' }] };
  const projection = buildEvolutionProjection(ownedMeta);
  const classified = writeEvolutionCellEdges(EVOLUTION_LAYOUT, projection);
  assert.ok(classified.includes(EVOLUTION_CELL_EDGE.QUIET)); assert.ok(classified.includes(EVOLUTION_CELL_EDGE.OWNED));
  assert.ok(classified.includes(EVOLUTION_CELL_EDGE.FRONTIER));
  const recent = writeEvolutionCellEdges(EVOLUTION_LAYOUT, buildEvolutionProjection(ownedMeta, null, [ownedCell]));
  assert.ok(recent.includes(EVOLUTION_CELL_EDGE.RECENT));
  assert.throws(() => writeEvolutionCellEdges(EVOLUTION_LAYOUT, projection, new Uint8Array(1)), /invalid Evolution edge output/);
});

test('selection changes only the selected cell and its incident edge class', () => {
  const base = buildEvolutionProjection({ ...defaultMeta(), echoBalance: '1000' });
  const selected = buildEvolutionProjection({ ...defaultMeta(), echoBalance: '1000' }, EVOLUTION_ROOT_CELL);
  const baseEdges = writeEvolutionCellEdges(EVOLUTION_LAYOUT, base); const selectedEdges = writeEvolutionCellEdges(EVOLUTION_LAYOUT, selected);
  const changed = [];
  for (let edge = 0; edge < EVOLUTION_TOPOLOGY.edgeCount; edge++) if (baseEdges[edge] !== selectedEdges[edge]) changed.push(edge);
  assert.equal(changed.length, EVOLUTION_TOPOLOGY.degree[EVOLUTION_ROOT_CELL]);
  assert.ok(changed.every((edge) => EVOLUTION_TOPOLOGY.edgeA[edge] === EVOLUTION_ROOT_CELL
    || EVOLUTION_TOPOLOGY.edgeB[edge] === EVOLUTION_ROOT_CELL));
});
