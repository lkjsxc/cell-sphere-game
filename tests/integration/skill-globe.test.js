/** Full 642-cell Evolution Globe topology, authority, content, and picking. */
import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MEMORY_ATLAS_CELLS, MEMORY_ATLAS_HASH, MEMORY_ATLAS_REVERSE,
  generateMemoryAtlas, validateAtlasMapping,
} from '../../src/game/skills/atlas.js';
import {
  MEMORY_BRANCHES, MEMORY_CELL_BY_ID, MEMORY_NODES, MEMORY_NODE_IDS,
  MEMORY_PHYSICAL_ADJACENCY, MEMORY_ROOT_IDS, availableMemoryNodes, buildMemorySnapshot,
  canPurchaseMemory, compileMemory, hasOwnedAdjacentCell, purchaseMemory, validateMemoryGraph,
} from '../../src/game/skills/index.js';
import { MEMORY_STATUS } from '../../src/game/skills/scene.js';
import { defaultMeta } from '../../src/platform/storage.js';
import { createTopology } from '../../src/world/icosphere.js';
import { createCamera, focusCamera } from '../../src/rendering/camera.js';
import { pickNode } from '../../src/rendering/picking.js';

const topo = createTopology(3);
const clone = () => MEMORY_NODES.map((node) => ({ ...node }));

test('all 642 frozen addresses and physical neighbors are deterministic and reproducible', () => {
  const report = validateAtlasMapping(); const generated = generateMemoryAtlas(topo);
  assert.equal(report.valid, true, report.errors.join('\n')); assert.equal(report.cells, 642);
  assert.equal(report.unique, 642); assert.equal(report.layoutRelations, 636);
  assert.equal(report.hash, 'd6bdc218'); assert.equal(MEMORY_ATLAS_HASH, 'd6bdc218');
  assert.deepEqual(generated.mapping, MEMORY_ATLAS_CELLS); assert.equal(generated.report.valid, true);
  assert.equal(MEMORY_ATLAS_REVERSE.every((index) => index >= 0), true);
  const degrees = MEMORY_NODE_IDS.map((id) => MEMORY_PHYSICAL_ADJACENCY[id].length);
  assert.equal(degrees.reduce((sum, degree) => sum + degree, 0), 3840);
  assert.equal(degrees.filter((degree) => degree === 5).length, 12);
  assert.equal(degrees.filter((degree) => degree === 6).length, 630);
  for (const node of MEMORY_NODES) {
    assert.equal(MEMORY_CELL_BY_ID[node.id], node.cell);
    assert.equal(MEMORY_ATLAS_CELLS[MEMORY_ATLAS_REVERSE[node.cell]], node.cell);
    for (const adjacentId of MEMORY_PHYSICAL_ADJACENCY[node.id])
      assert.ok(MEMORY_PHYSICAL_ADJACENCY[adjacentId].includes(node.id));
  }
});

test('graph 4 has exact territories, roots, topology, economy, and effects', () => {
  const report = validateMemoryGraph();
  assert.equal(report.valid, true, report.errors.join('\n')); assert.equal(report.topologyLevel, 3);
  assert.equal(report.physicalRelations, 1920); assert.equal(report.frontierStates, 3840);
  assert.equal(report.minDegree, 5); assert.equal(report.maxDegree, 6);
  assert.deepEqual(report.roots, MEMORY_ROOT_IDS); assert.equal(report.roots.length, 6); assert.equal(report.reachable, 642);
  assert.deepEqual(report.branchCounts, Object.fromEntries(MEMORY_BRANCHES.map((branch) => [branch, 107])));
  assert.equal(report.totalCost, 2462); assert.equal(report.economyHash, '34b4e4a9'); assert.equal(report.effectHash, '8444edfd');
  assert.deepEqual(Object.fromEntries([...new Set(MEMORY_NODES.map((node) => node.cost))].sort((a, b) => a - b)
    .map((cost) => [cost, MEMORY_NODES.filter((node) => node.cost === cost).length])),
  { 1: 102, 2: 112, 3: 116, 4: 120, 5: 126, 6: 24, 7: 12, 8: 6, 9: 6, 14: 6, 18: 6, 26: 6 });
  assert.equal(MEMORY_NODES.every((node) => !Object.hasOwn(node, 'requires')), true);
  assert.equal(MEMORY_NODES.every((node) => Object.keys(node).every((key) => !/run|experience/i.test(key))), true);
});

test('validator reports unstable addresses, count, branch, effect, and economy failures', () => {
  const duplicate = clone(); duplicate[1].cell = duplicate[0].cell;
  assert.match(validateMemoryGraph(duplicate).errors.join('\n'), /invalid cell|unstable cell/);
  const swapped = clone(); [swapped[1].cell, swapped[320].cell] = [swapped[320].cell, swapped[1].cell];
  assert.match(validateMemoryGraph(swapped).errors.join('\n'), /unstable cell/);
  assert.match(validateMemoryGraph(clone().slice(1)).errors.join('\n'), /node count|root count|branch count|unreachable/);
  const branch = clone(); branch[0].branch = 'Unknown';
  assert.match(validateMemoryGraph(branch).errors.join('\n'), /branch count|disconnected branch/);
  const effect = clone(); effect[0].effect = { ...effect[0].effect, key: 'infinitePower' };
  assert.match(validateMemoryGraph(effect).errors.join('\n'), /unknown effect/);
  const economy = clone(); economy[0].cost = 0;
  assert.match(validateMemoryGraph(economy).errors.join('\n'), /invalid cost/);
});

test('the six canonical roots bootstrap only an empty save; all later cells require adjacency', () => {
  const fresh = { ...defaultMeta(), runs: 0, echoBalance: 100, requiredRuns: 999,
    runsRemaining: 999, experienceMet: false };
  assert.deepEqual(availableMemoryNodes(fresh).map((node) => node.id), MEMORY_ROOT_IDS);
  for (const id of MEMORY_ROOT_IDS) assert.equal(canPurchaseMemory(fresh, id), true, id);
  for (const id of MEMORY_NODE_IDS.filter((id) => !MEMORY_ROOT_IDS.includes(id)))
    assert.equal(canPurchaseMemory(fresh, id), false, id);
  const ownedRoot = MEMORY_ROOT_IDS[0]; const after = { ...fresh, memoryNodes: [ownedRoot] };
  const expected = new Set(MEMORY_PHYSICAL_ADJACENCY[ownedRoot]);
  assert.deepEqual(new Set(availableMemoryNodes(after).map((node) => node.id)), expected);
  for (const id of MEMORY_ROOT_IDS.filter((id) => id !== ownedRoot))
    if (!expected.has(id)) assert.equal(canPurchaseMemory(after, id), false, id);
});

test('every affordable physical frontier works at runs zero with any one neighbor', () => {
  for (const node of MEMORY_NODES) {
    for (const ownerId of MEMORY_PHYSICAL_ADJACENCY[node.id]) {
      const meta = { ...defaultMeta(), runs: 0, echoBalance: node.cost, memoryNodes: [ownerId],
        requiredRuns: 999, runsRemaining: 999, experienceMet: false };
      assert.equal(hasOwnedAdjacentCell(meta, node.id), true, `${ownerId}->${node.id}`);
      assert.equal(canPurchaseMemory(meta, node.id), true, `${ownerId}->${node.id}`);
    }
    const nonneighbor = MEMORY_NODE_IDS.find((id) => id !== node.id && !MEMORY_PHYSICAL_ADJACENCY[node.id].includes(id));
    const blocked = { ...defaultMeta(), runs: 0, echoBalance: node.cost, memoryNodes: [nonneighbor] };
    assert.equal(hasOwnedAdjacentCell(blocked, node.id), false, `${nonneighbor}!->${node.id}`);
    assert.equal(canPurchaseMemory(blocked, node.id), false, `${nonneighbor}!->${node.id}`);
  }
});

test('purchase spends once, rejects insufficient funds, and never makes a negative balance', () => {
  const node = MEMORY_NODES.find((candidate) => candidate.id === MEMORY_ROOT_IDS[0]);
  const poor = { ...defaultMeta(), echoBalance: node.cost - 1 };
  assert.equal(canPurchaseMemory(poor, node.id), false); assert.equal(purchaseMemory(poor, node.id).meta, poor);
  const exact = { ...poor, echoBalance: node.cost }; const first = purchaseMemory(exact, node.id);
  assert.equal(first.ok, true); assert.equal(first.spent, node.cost); assert.equal(first.meta.echoBalance, 0);
  const repeat = purchaseMemory(first.meta, node.id);
  assert.equal(repeat.ok, false); assert.equal(repeat.meta, first.meta); assert.equal(repeat.meta.echoBalance, 0);
});

test('all 642 cells can be legally acquired by adjacency and exact cost only', () => {
  const total = validateMemoryGraph().totalCost;
  let meta = { ...defaultMeta(), runs: 0, echoBalance: total, totalEchoes: total,
    requiredRuns: Number.MAX_SAFE_INTEGER, experienceMet: false };
  while (meta.memoryNodes.length < MEMORY_NODES.length) {
    const next = MEMORY_NODES.find((node) => canPurchaseMemory(meta, node.id));
    assert.ok(next, `stalled after ${meta.memoryNodes.length} cells`);
    const result = purchaseMemory(meta, next.id); assert.equal(result.ok, true);
    assert.equal(result.meta.echoBalance, meta.echoBalance - next.cost); meta = result.meta;
  }
  assert.equal(meta.memoryNodes.length, 642); assert.equal(meta.echoBalance, 0);
});

test('every cell carries physical-frontier purchase and semantic status', () => {
  const root = MEMORY_NODES.find((node) => node.id === MEMORY_ROOT_IDS[0]);
  const neighbor = MEMORY_NODES.find((node) => node.id === MEMORY_PHYSICAL_ADJACENCY[root.id][0]);
  const ready = buildMemorySnapshot(topo, { ...defaultMeta(), echoBalance: 100 }, root.id);
  assert.equal(ready.memoryStatus[root.cell], MEMORY_STATUS.SELECTED_AFFORDABLE);
  const blocked = MEMORY_NODES.find((node) => node.id !== root.id && !MEMORY_ROOT_IDS.includes(node.id));
  assert.equal(ready.memoryStatus[blocked.cell], MEMORY_STATUS.LOCKED);
  const owned = buildMemorySnapshot(topo, { ...defaultMeta(), echoBalance: 100, memoryNodes: [root.id] }, neighbor.id);
  assert.equal(owned.memoryStatus[root.cell], MEMORY_STATUS.OWNED);
  assert.equal(owned.memoryStatus[neighbor.cell], MEMORY_STATUS.SELECTED_AFFORDABLE);
  assert.equal(owned.nodeStates.find((state) => state.id === neighbor.id).adjacentOwnedId, root.id);
  assert.equal(ready.memoryNodeIndex.every((index) => index >= 0), true);
});

test('all advanced Skill Cells ship a concrete downstream trait effect', () => {
  const advanced = MEMORY_NODES.filter((node) => node.effect.type === 'unlock');
  assert.equal(advanced.length, 36); assert.equal(advanced.every((node) => node.effect.bonus?.type === 'scalar'), true);
  const compiled = compileMemory({ memoryNodes: MEMORY_NODE_IDS });
  for (const key of ['reach', 'conductance', 'energyCap', 'reinforce', 'uptake', 'stressResist']) assert.ok(compiled.effects[key] > 1, key);
});

test('current Evolution production and copy contain no obsolete gate vocabulary', () => {
  const skillDir = new URL('../../src/game/skills/', import.meta.url);
  const files = readdirSync(skillDir).filter((name) => name.endsWith('.js')).map((name) => new URL(name, skillDir));
  files.push(new URL('../../src/interface/panel-surfaces.js', import.meta.url), new URL('../../index.html', import.meta.url));
  const source = files.map((file) => readFileSync(file, 'utf8')).join('\n');
  for (const stale of ['requiredRuns', 'runsRemaining', 'experienceMet', 'Worlds observed', 'Prerequisite skills'])
    assert.equal(source.includes(stale), false, stale);
  assert.equal(source.includes('.requires.every'), false);
});

test('purchase coordinator persists the candidate before committing currency in memory', () => {
  const source = readFileSync(new URL('../../src/interface/policies/progression-spheres.js', import.meta.url), 'utf8');
  const persist = source.indexOf('if (!saveMeta(trophies.meta))');
  const commit = source.indexOf('app.meta = trophies.meta');
  assert.ok(persist >= 0 && commit > persist);
});

test('level-3 picking resolves exact cells and every hit has a skill address', () => {
  const canvas = { getBoundingClientRect: () => ({ left: 0, top: 0, width: 200, height: 200 }) };
  for (const occupied of [MEMORY_ATLAS_CELLS[0], MEMORY_ATLAS_CELLS[320], MEMORY_ATLAS_CELLS[641]]) {
    const camera = createCamera(); focusCamera(camera, topo.positions.subarray(occupied * 3, occupied * 3 + 3));
    const front = pickNode(canvas, 100, 100, camera, topo);
    assert.equal(front.node, occupied); assert.ok(MEMORY_ATLAS_REVERSE[front.node] >= 0);
  }
});
