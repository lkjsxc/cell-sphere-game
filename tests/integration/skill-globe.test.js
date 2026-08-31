/** Fine Evolution authority, scene projection, picking, and Imprint integration. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  EVOLUTION_ARCHETYPES, EVOLUTION_CELL_EDGE, EVOLUTION_LAYOUT, EVOLUTION_ROOT_CELL, EVOLUTION_TOPOLOGY,
  buildEvolutionProjection, buildEvolutionSnapshot, compileEvolution, createEvolutionFields,
  evolutionCellEdgeStatus, evolutionCellState, getEvolutionAdjacentCells, newlyReachableEvolutionCells,
  purchaseEvolutionLevel,
} from '../../src/game/skills/index.js';
import { EVOLUTION_IMPRINT_VERSION, defaultMeta, validateMeta } from '../../src/platform/storage.js';
import { createCamera } from '../../src/rendering/camera.js';
import { pickNode } from '../../src/rendering/picking.js';

test('the maintained level-4 sphere is the sole symmetric Evolution topology', () => {
  assert.deepEqual([EVOLUTION_TOPOLOGY.nodeCount, EVOLUTION_TOPOLOGY.edgeCount], [2562, 7680]);
  for (let cell = 0; cell < EVOLUTION_TOPOLOGY.nodeCount; cell++) for (const neighbor of getEvolutionAdjacentCells(cell)) {
    assert.ok(getEvolutionAdjacentCells(neighbor).includes(cell), `${cell}:${neighbor}`);
  }
  assert.equal(EVOLUTION_LAYOUT.archetypeByCell.length, EVOLUTION_TOPOLOGY.nodeCount);
  assert.equal(new Set(EVOLUTION_LAYOUT.archetypeByCell).size, EVOLUTION_ARCHETYPES.length);
});

test('one exact-cell purchase changes local state and only truthful neighboring frontier semantics', () => {
  const meta = { ...defaultMeta(), echoBalance: '10000' };
  const beforeProjection = buildEvolutionProjection(meta, EVOLUTION_ROOT_CELL);
  const before = buildEvolutionSnapshot(meta, EVOLUTION_ROOT_CELL);
  const state = evolutionCellState(beforeProjection, EVOLUTION_ROOT_CELL, EVOLUTION_ROOT_CELL);
  const purchase = purchaseEvolutionLevel(meta, EVOLUTION_ROOT_CELL, { transactionKey: 'exact-cell',
    expectedLocalLevel: state.localLevel, expectedAggregateRank: state.aggregateRank, expectedRevision: meta.revision });
  assert.equal(purchase.ok, true); assert.deepEqual(purchase.meta.evolutionLevels, [{ cell: EVOLUTION_ROOT_CELL, level: '1' }]);
  const afterProjection = buildEvolutionProjection(purchase.meta, EVOLUTION_ROOT_CELL, [EVOLUTION_ROOT_CELL]);
  const after = buildEvolutionSnapshot(purchase.meta, EVOLUTION_ROOT_CELL, [EVOLUTION_ROOT_CELL]);
  const newly = newlyReachableEvolutionCells(beforeProjection, afterProjection);
  assert.deepEqual(newly, getEvolutionAdjacentCells(EVOLUTION_ROOT_CELL));
  const allowedCells = new Set([EVOLUTION_ROOT_CELL, ...newly]);
  const changedCells = Array.from({ length: EVOLUTION_TOPOLOGY.nodeCount }, (_, cell) => cell)
    .filter((cell) => before.evolutionStatus[cell] !== after.evolutionStatus[cell]);
  assert.deepEqual(new Set(changedCells), allowedCells);
  for (let edge = 0; edge < EVOLUTION_TOPOLOGY.edgeCount; edge++) if (before.evolutionEdge[edge] !== after.evolutionEdge[edge]) {
    assert.ok(allowedCells.has(EVOLUTION_TOPOLOGY.edgeA[edge]) || allowedCells.has(EVOLUTION_TOPOLOGY.edgeB[edge]), `edge ${edge}`);
  }
  assert.equal(after.evolutionRecent.reduce((sum, value) => sum + value, 0), 1);
  assert.equal(after.evolutionEdge.filter((value) => evolutionCellEdgeStatus(value) === EVOLUTION_CELL_EDGE.SELECTED).length,
    getEvolutionAdjacentCells(EVOLUTION_ROOT_CELL).length);
});

test('scene data covers every exact cell with varied immutable material and bounded edge arrays', () => {
  const fields = createEvolutionFields(EVOLUTION_TOPOLOGY); const snapshot = buildEvolutionSnapshot({ ...defaultMeta(), echoBalance: '8' });
  assert.equal(snapshot.status, 'evolution'); assert.equal(snapshot.evolutionStatus.length, 2562);
  assert.equal(snapshot.evolutionArchetypeIndex.length, 2562); assert.equal(snapshot.evolutionEdge.length, 7680);
  assert.equal(new Set(snapshot.evolutionArchetypeIndex).size, 42);
  assert.ok(new Set(Array.from(fields.baseNutrient, (value) => value.toFixed(5))).size > 100);
  assert.ok(new Set(Array.from(fields.baseMoisture, (value) => value.toFixed(5))).size > 100);
  assert.equal(snapshot.evolutionProjection.readyCells.length, 1);
});

test('picking identifies the actual fine Evolution cell without an owner alias', () => {
  const canvas = { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 1000 }) };
  const hit = pickNode(canvas, 500, 500, createCamera(), EVOLUTION_TOPOLOGY); assert.ok(hit);
  assert.ok(Number.isInteger(hit.node) && hit.node >= 0 && hit.node < 2562);
  assert.equal(EVOLUTION_LAYOUT.archetypeByCell[hit.node], buildEvolutionSnapshot(defaultMeta()).evolutionArchetypeIndex[hit.node]);
});

test('current Imprints remain bounded marks on the fine topology and coarse predecessors reset', () => {
  const cells = Array.from({ length: 16 }, (_, cell) => cell);
  const current = validateMeta({ ...defaultMeta(), imprints: [{ kind: 'strongest-corridor', seed: 7, cells,
    topology: { kind: 'icosphere', level: 4, nodeCount: 2562, edgeCount: 7680 } }] });
  assert.equal(current.evolutionImprintVersion, EVOLUTION_IMPRINT_VERSION); assert.deepEqual(current.imprints[0].cells, cells);
  const snapshot = buildEvolutionSnapshot(current);
  assert.deepEqual(Array.from(snapshot.evolutionImprintWeight, (weight, cell) => weight > 0 ? cell : -1).filter((cell) => cell >= 0), cells);
  const coarse = validateMeta({ ...defaultMeta(), evolutionImprintVersion: 1,
    imprints: [{ kind: 'strongest-corridor', seed: 7, cells, topology: { kind: 'geodesic', frequency: 2, nodeCount: 42, edgeCount: 120 } }] });
  assert.deepEqual(coarse.imprints, []);
});

test('equal aggregate ranks compile identically across different cell distributions', () => {
  const archetype = 7; const cells = Array.from(EVOLUTION_LAYOUT.archetypeByCell)
    .flatMap((value, cell) => value === archetype ? [cell] : []).slice(0, 2);
  assert.equal(cells.length, 2);
  assert.deepEqual(compileEvolution({ evolutionLevels: [{ cell: cells[0], level: '9' }] }),
    compileEvolution({ evolutionLevels: [{ cell: cells[0], level: '4' }, { cell: cells[1], level: '5' }] }));
});
