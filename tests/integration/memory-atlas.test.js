/** Gate 7 adjacency atlas, validator diagnostics, source shape, and exact picking. */
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MEMORY_ATLAS_CELLS, MEMORY_ATLAS_HASH, MEMORY_ATLAS_REVERSE,
  generateMemoryAtlas, validateAtlasMapping,
} from '../../src/game/memory-atlas.js';
import {
  MEMORY_BRANCHES, MEMORY_NODES, availableMemoryNodes, buildMemorySnapshot, validateMemoryGraph,
} from '../../src/game/memory.js';
import { MEMORY_STATUS } from '../../src/game/memory-scene.js';
import { defaultMeta } from '../../src/platform/storage.js';
import { createTopology } from '../../src/world/icosphere.js';
import { createCamera, focusCamera } from '../../src/rendering/camera.js';
import { pickNode } from '../../src/rendering/picking.js';

const topo = createTopology(3);
const clone = () => MEMORY_NODES.map((node) => ({ ...node, requires: [...node.requires] }));

test('frozen mapping is deterministic, directly adjacent, and solver-reproducible', () => {
  const report = validateAtlasMapping(); const generated = generateMemoryAtlas(topo);
  assert.equal(report.valid, true, report.errors.join('\n')); assert.equal(report.cells, 108);
  assert.equal(report.unique, 108); assert.equal(report.relations, 108);
  assert.equal(report.hash, '5a08107c'); assert.equal(MEMORY_ATLAS_HASH, '5a08107c');
  assert.deepEqual(generated.mapping, MEMORY_ATLAS_CELLS);
  assert.equal(generated.solved, true); assert.equal(generated.report.valid, true);
});

test('graph 2 has six connected branches, six roots, full reachability, and feasible degree', () => {
  const report = validateMemoryGraph();
  assert.equal(report.valid, true, report.errors.join('\n')); assert.equal(report.topologyLevel, 3);
  assert.equal(report.relations, 108); assert.equal(report.maxDegree, 3);
  assert.equal(report.roots.length, 6); assert.equal(report.reachable, 108);
  assert.deepEqual(report.branchCounts, Object.fromEntries(MEMORY_BRANCHES.map((branch) => [branch, 18])));
  assert.equal(report.totalCost, 818);
  const opening = availableMemoryNodes({ ...defaultMeta(), echoBalance: 3 });
  assert.equal(opening.length, 6); assert.equal(new Set(opening.map((node) => node.branch)).size, 6);
});

test('validator reports duplicates, cycles, nonadjacency, and connector parent failures', () => {
  const duplicate = clone(); duplicate[1].cell = duplicate[0].cell;
  assert.match(validateMemoryGraph(duplicate).errors.join('\n'), /invalid cell/);
  const cycle = clone(); cycle[0].requires = [cycle[1].id];
  assert.match(validateMemoryGraph(cycle).errors.join('\n'), /cycle/);
  const nonadjacent = clone(); nonadjacent[1].cell = 12;
  assert.match(validateMemoryGraph(nonadjacent).errors.join('\n'), /nonadjacent prerequisite/);
  const connector = clone(); connector[16].requires = [connector[15].id, connector[0].id];
  assert.match(validateMemoryGraph(connector).errors.join('\n'), /connector parents/);
});

test('validator reports count, branch, reachability, disconnected territory, effects, and economy failures', () => {
  assert.match(validateMemoryGraph(clone().slice(1)).errors.join('\n'), /node count|root count|branch count|unreachable/);
  const branch = clone(); branch[0].branch = 'Unknown';
  assert.match(validateMemoryGraph(branch).errors.join('\n'), /branch count|disconnected branch/);
  const disconnected = clone(); disconnected[4].cell = 12;
  assert.match(validateMemoryGraph(disconnected).errors.join('\n'), /disconnected branch/);
  const effect = clone(); effect[0].effect = { ...effect[0].effect, key: 'infinitePower' };
  assert.match(validateMemoryGraph(effect).errors.join('\n'), /unknown effect/);
  const economy = clone(); economy[0].cost = 0;
  assert.match(validateMemoryGraph(economy).errors.join('\n'), /invalid cost/);
});

test('all Memory cell status and semantic arrays are explicit', () => {
  const root = MEMORY_NODES[0]; const child = MEMORY_NODES[1];
  const ready = buildMemorySnapshot(topo, { ...defaultMeta(), echoBalance: 3 }, root.id);
  assert.equal(ready.memoryStatus[root.cell], MEMORY_STATUS.SELECTED_AFFORDABLE);
  assert.equal(ready.memoryStatus[child.cell], MEMORY_STATUS.LOCKED);
  assert.ok(ready.memoryBranch[root.cell] > 0 && ready.memoryTier[root.cell] > 0 && ready.memoryKind[root.cell] > 0);
  const poor = buildMemorySnapshot(topo, defaultMeta(), root.id);
  assert.equal(poor.memoryStatus[root.cell], MEMORY_STATUS.SELECTED_UNAFFORDABLE);
  const owned = buildMemorySnapshot(topo, { ...defaultMeta(), memoryNodes: [root.id] }, root.id);
  assert.equal(owned.memoryStatus[root.cell], MEMORY_STATUS.SELECTED_OWNED);
  assert.ok([MEMORY_STATUS.UNAFFORDABLE, MEMORY_STATUS.AFFORDABLE].includes(owned.memoryStatus[child.cell]));
});

test('Memory scene source has no edge-path construction or edge state arrays', () => {
  const source = readFileSync(new URL('../../src/game/memory-scene.js', import.meta.url), 'utf8');
  for (const stale of ['tracePath', 'paintEdge', 'edgeActive', 'conductance', 'flux']) assert.equal(source.includes(stale), false, stale);
  assert.equal(source.includes('.edges'), false); assert.equal(source.includes('memoryStatus'), true);
});

test('level-3 picking resolves exact front cells while rear and empty cells are rejected by the reverse map', () => {
  const canvas = { getBoundingClientRect: () => ({ left: 0, top: 0, width: 200, height: 200 }) };
  const camera = createCamera(); const occupied = MEMORY_ATLAS_CELLS[0];
  focusCamera(camera, topo.positions.subarray(occupied * 3, occupied * 3 + 3));
  const front = pickNode(canvas, 100, 100, camera, topo); assert.equal(front.node, occupied);
  let rear = occupied; let rearDot = 2;
  for (const cell of MEMORY_ATLAS_CELLS) { const at = cell * 3; const dot = front.hit[0] * topo.positions[at]
    + front.hit[1] * topo.positions[at + 1] + front.hit[2] * topo.positions[at + 2];
    if (dot < rearDot) { rearDot = dot; rear = cell; } }
  assert.ok(rearDot < 0); assert.notEqual(front.node, rear); assert.ok(MEMORY_ATLAS_REVERSE[front.node] >= 0);
  const empty = MEMORY_ATLAS_REVERSE.findIndex((index) => index < 0); const emptyCamera = createCamera();
  focusCamera(emptyCamera, topo.positions.subarray(empty * 3, empty * 3 + 3));
  const emptyHit = pickNode(canvas, 100, 100, emptyCamera, topo); assert.equal(emptyHit.node, empty);
  assert.equal(MEMORY_ATLAS_REVERSE[emptyHit.node], -1);
});
