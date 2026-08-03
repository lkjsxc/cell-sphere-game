/** Full 642-cell Evolution Globe topology, authority, content, and picking. */
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MEMORY_ATLAS_CELLS, MEMORY_ATLAS_HASH, MEMORY_ATLAS_REVERSE,
  generateMemoryAtlas, validateAtlasMapping,
} from '../../src/game/memory-atlas.js';
import {
  MEMORY_BRANCHES, MEMORY_NODES, availableMemoryNodes, buildMemorySnapshot,
  canPurchaseMemory, compileMemory, validateMemoryGraph,
} from '../../src/game/memory.js';
import { MEMORY_STATUS } from '../../src/game/memory-scene.js';
import { defaultMeta } from '../../src/platform/storage.js';
import { createTopology } from '../../src/world/icosphere.js';
import { createCamera, focusCamera } from '../../src/rendering/camera.js';
import { pickNode } from '../../src/rendering/picking.js';

const topo = createTopology(3);
const clone = () => MEMORY_NODES.map((node) => ({ ...node, requires: [...node.requires] }));

test('all 642 frozen addresses are deterministic, adjacent, and reproducible', () => {
  const report = validateAtlasMapping(); const generated = generateMemoryAtlas(topo);
  assert.equal(report.valid, true, report.errors.join('\n')); assert.equal(report.cells, 642);
  assert.equal(report.unique, 642); assert.equal(report.relations, 636);
  assert.equal(report.hash, 'd6bdc218'); assert.equal(MEMORY_ATLAS_HASH, 'd6bdc218');
  assert.deepEqual(generated.mapping, MEMORY_ATLAS_CELLS);
  assert.equal(generated.solved, true); assert.equal(generated.report.valid, true);
  assert.equal(MEMORY_ATLAS_REVERSE.every((index) => index >= 0), true);
});

test('graph 3 has six 107-cell territories, roots, and full reachability', () => {
  const report = validateMemoryGraph();
  assert.equal(report.valid, true, report.errors.join('\n')); assert.equal(report.topologyLevel, 3);
  assert.equal(report.relations, 636); assert.ok(report.maxDegree <= 6);
  assert.equal(report.roots.length, 6); assert.equal(report.reachable, 642);
  assert.deepEqual(report.branchCounts, Object.fromEntries(MEMORY_BRANCHES.map((branch) => [branch, 107])));
  assert.equal(report.totalCost, 2462);
  const opening = availableMemoryNodes({ ...defaultMeta(), echoBalance: 3 });
  assert.equal(opening.length, 6); assert.equal(new Set(opening.map((node) => node.branch)).size, 6);
});

test('validator reports duplicates, cycles, nonadjacency, and missing prerequisites', () => {
  const duplicate = clone(); duplicate[1].cell = duplicate[0].cell;
  assert.match(validateMemoryGraph(duplicate).errors.join('\n'), /invalid cell/);
  const cycle = clone(); cycle[0].requires = [cycle[1].id];
  assert.match(validateMemoryGraph(cycle).errors.join('\n'), /cycle/);
  const nonadjacent = clone(); [nonadjacent[1].cell, nonadjacent[320].cell] = [nonadjacent[320].cell, nonadjacent[1].cell];
  assert.match(validateMemoryGraph(nonadjacent).errors.join('\n'), /nonadjacent prerequisite/);
  const missing = clone(); missing[1].requires = ['reach-absent-cell'];
  assert.match(validateMemoryGraph(missing).errors.join('\n'), /missing prerequisite/);
});

test('validator reports count, branch, reachability, effects, and economy failures', () => {
  assert.match(validateMemoryGraph(clone().slice(1)).errors.join('\n'), /node count|root count|branch count|unreachable/);
  const branch = clone(); branch[0].branch = 'Unknown';
  assert.match(validateMemoryGraph(branch).errors.join('\n'), /branch count|disconnected branch/);
  const effect = clone(); effect[0].effect = { ...effect[0].effect, key: 'infinitePower' };
  assert.match(validateMemoryGraph(effect).errors.join('\n'), /unknown effect/);
  const economy = clone(); economy[0].cost = 0;
  assert.match(validateMemoryGraph(economy).errors.join('\n'), /invalid cost/);
  const gate = clone(); gate[1].requiredRuns = -1;
  assert.match(validateMemoryGraph(gate).errors.join('\n'), /invalid run gate/);
});

test('visible gates spread each branch across about 160 completed worlds', () => {
  assert.equal(MEMORY_NODES.filter((node) => node.requiredRuns <= 82).length, 324);
  assert.equal(MEMORY_NODES.filter((node) => node.kind === 'keystone').every((node) => node.requiredRuns === 143), true);
  assert.equal(MEMORY_NODES.filter((node) => node.kind === 'connector').every((node) => node.requiredRuns === 153), true);
  assert.equal(MEMORY_NODES.filter((node) => node.kind === 'capstone').every((node) => node.requiredRuns === 164), true);
  const target = MEMORY_NODES.find((node) => node.requiredRuns === 82);
  const byId = new Map(MEMORY_NODES.map((node) => [node.id, node])); const owned = new Set();
  const ownParents = (node) => { for (const id of node.requires) { owned.add(id); ownParents(byId.get(id)); } }; ownParents(target);
  const meta = { ...defaultMeta(), echoBalance: 10_000, memoryNodes: [...owned], runs: 81 };
  assert.equal(canPurchaseMemory(meta, target.id), false);
  assert.equal(canPurchaseMemory({ ...meta, runs: 82 }, target.id), true);
});

test('every cell carries explicit purchase and semantic status', () => {
  const root = MEMORY_NODES[0]; const child = MEMORY_NODES.find((node) => node.requires.includes(root.id));
  const ready = buildMemorySnapshot(topo, { ...defaultMeta(), echoBalance: 3 }, root.id);
  assert.equal(ready.memoryStatus[root.cell], MEMORY_STATUS.SELECTED_AFFORDABLE);
  assert.equal(ready.memoryStatus[child.cell], MEMORY_STATUS.LOCKED);
  assert.ok(ready.memoryBranch[root.cell] > 0 && ready.memoryTier[root.cell] > 0 && ready.memoryKind[root.cell] > 0);
  const poor = buildMemorySnapshot(topo, defaultMeta(), root.id);
  assert.equal(poor.memoryStatus[root.cell], MEMORY_STATUS.SELECTED_UNAFFORDABLE);
  const owned = buildMemorySnapshot(topo, { ...defaultMeta(), runs: 164, memoryNodes: [root.id] }, root.id);
  assert.equal(owned.memoryStatus[root.cell], MEMORY_STATUS.SELECTED_OWNED);
  assert.ok([MEMORY_STATUS.UNAFFORDABLE, MEMORY_STATUS.AFFORDABLE].includes(owned.memoryStatus[child.cell]));
  assert.equal(ready.memoryNodeIndex.every((index) => index >= 0), true);
});

test('all advanced Skill Cells ship a concrete downstream trait effect', () => {
  const advanced = MEMORY_NODES.filter((node) => node.effect.type === 'unlock');
  assert.equal(advanced.length, 36); assert.equal(advanced.every((node) => node.effect.bonus?.type === 'scalar'), true);
  assert.equal(advanced.every((node) => node.effect.bonus.value > 1
    || (node.effect.bonus.operation === 'add' && node.effect.bonus.value > 0)
    || (node.effect.bonus.key === 'maintenance' && node.effect.bonus.value > 0 && node.effect.bonus.value < 1)), true);
  assert.equal(advanced.some((node) => /unlock|reveal|automatic|select a starting/i.test(`${node.effectEn} ${node.description}`)), false);
  const compiled = compileMemory({ ...defaultMeta(), memoryNodes: MEMORY_NODES.map((node) => node.id) });
  for (const key of ['reach', 'conductance', 'energyCap', 'reinforce', 'uptake', 'stressResist']) assert.ok(compiled.effects[key] > 1, key);
});

test('Evolution scene source has no edge-path construction or edge state arrays', () => {
  const source = readFileSync(new URL('../../src/game/memory-scene.js', import.meta.url), 'utf8');
  for (const stale of ['tracePath', 'paintEdge', 'edgeActive', 'conductance', 'flux']) assert.equal(source.includes(stale), false, stale);
  assert.equal(source.includes('.edges'), false); assert.equal(source.includes('memoryStatus'), true);
});

test('level-3 picking resolves exact cells and every hit has a skill address', () => {
  const canvas = { getBoundingClientRect: () => ({ left: 0, top: 0, width: 200, height: 200 }) };
  for (const occupied of [MEMORY_ATLAS_CELLS[0], MEMORY_ATLAS_CELLS[320], MEMORY_ATLAS_CELLS[641]]) {
    const camera = createCamera(); focusCamera(camera, topo.positions.subarray(occupied * 3, occupied * 3 + 3));
    const front = pickNode(canvas, 100, 100, camera, topo);
    assert.equal(front.node, occupied); assert.ok(MEMORY_ATLAS_REVERSE[front.node] >= 0);
  }
});
