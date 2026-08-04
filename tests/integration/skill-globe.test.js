/** Frequency-5 Evolution Globe topology, authority, rendering, and economy. */
import { test } from 'node:test'; import assert from 'node:assert/strict';
import { createGeodesicTopology } from '../../src/world/icosphere.js';
import { MEMORY_ATLAS_HASH, MEMORY_ATLAS_REVERSE, MEMORY_BRANCH_SIZE, generateMemoryAtlas, validateAtlasMapping } from '../../src/game/skills/atlas.js';
import { AFFINITY_METADATA_HASH, BASE_WORLD_POTENTIAL, EVOLUTION_AFFINITIES, EVOLUTION_CONTENT_HASH,
  FULL_EVOLUTION_POWER, MEMORY_NODES, MEMORY_NODE_IDS, MEMORY_PHYSICAL_ADJACENCY, WORLD_POTENTIAL_VERSION,
  availableMemoryNodes, buildMemorySnapshot, campaignResolved, compileMemory, getMemoryAdjacentIds, getMemoryNode,
  memoryNodeState, memoryPurchasePreview, newlyAvailableAdjacentIds, purchaseMemory, validateMemoryGraph } from '../../src/game/skills/index.js';
import { createMemoryFields } from '../../src/game/skills/scene.js';
import { defaultMeta } from '../../src/platform/storage.js';
import { createCamera } from '../../src/rendering/camera.js'; import { pickNode } from '../../src/rendering/picking.js';

test('first cycle resolves in the retained 18–24 minute five-world window', () => {
  assert.equal(campaignResolved({ runs:4 }), false); assert.equal(campaignResolved({ runs:5 }), true);
});

test('all 252 frequency-5 addresses and physical neighbors are deterministic', () => {
  const topology = createGeodesicTopology(5); const regenerated = generateMemoryAtlas(topology); const report = validateAtlasMapping();
  assert.equal(regenerated.report.valid, true); assert.equal(report.valid, true); assert.equal(report.cells, 252);
  assert.equal(report.layoutRelations, 246); assert.equal(report.hash, MEMORY_ATLAS_HASH); assert.equal(MEMORY_BRANCH_SIZE, 42);
  assert.deepEqual([topology.nodeCount, topology.edgeCount, topology.triCount], [252, 750, 500]);
  assert.equal([...topology.degree].filter((degree) => degree === 5).length, 12);
  assert.equal([...topology.degree].filter((degree) => degree === 6).length, 240);
});

test('graph has exact territories, composition, economy, effects, and potential', () => {
  const report = validateMemoryGraph(); assert.equal(report.valid, true, report.errors.join('\n'));
  assert.equal(report.topologyFrequency, 5); assert.equal(report.reachable, 252); assert.equal(report.physicalRelations, 750);
  assert.equal(report.totalCost, 17820); assert.equal(report.totalPower, FULL_EVOLUTION_POWER); assert.equal(report.worldPotential, 1200000);
  assert.deepEqual(report.branchCounts, { Marine:42, Freshwater:42, Scarcity:42, Fertility:42, Cryogenic:42, Luminous:42 });
  assert.equal(report.affinityHash, AFFINITY_METADATA_HASH); assert.equal(report.contentHash, EVOLUTION_CONTENT_HASH);
  assert.equal(AFFINITY_METADATA_HASH, '9e0063bd'); assert.equal(EVOLUTION_CONTENT_HASH, '938f6e87');
  assert.deepEqual(report.composition, { root:6, resonance:180, major:30, conditional:12, unlock:12, keystone:6, capstone:6 });
  assert.equal(new Set(MEMORY_NODE_IDS).size, 252); assert.equal(new Set(MEMORY_NODES.map((node) => node.cell)).size, 252);
});

test('validator rejects incomplete and duplicate current graphs', () => {
  assert.equal(validateMemoryGraph(MEMORY_NODES.slice(0, -1)).valid, false);
  const duplicate = MEMORY_NODES.map((node) => ({ ...node })); duplicate[1].cell = duplicate[0].cell;
  const report = validateMemoryGraph(duplicate); assert.equal(report.valid, false); assert.ok(report.errors.some((error) => error.includes('cell')));
});

test('every frontier edge is actual symmetric geodesic adjacency', () => {
  const topology = createGeodesicTopology(5); let directed = 0;
  for (const node of MEMORY_NODES) for (const adjacentId of getMemoryAdjacentIds(node.id)) {
    const adjacent = getMemoryNode(adjacentId); directed++;
    assert.ok(getMemoryAdjacentIds(adjacentId).includes(node.id));
    const neighbors = topology.nodeNeighbors.slice(topology.nodeStart[node.cell], topology.nodeStart[node.cell + 1]);
    assert.ok(neighbors.includes(adjacent.cell));
  }
  assert.equal(directed, 1500); assert.equal(Object.keys(MEMORY_PHYSICAL_ADJACENCY).length, 252);
});

test('purchase authority is exact-once, adjacent, and previews visible deltas', () => {
  let meta = { ...defaultMeta(), echoBalance: 100 }; const root = MEMORY_NODES.find((node) => node.kind === 'root');
  const before = memoryNodeState(meta, root, root.id); assert.equal(before.bootstrap, true); assert.equal(before.selectedReady, true);
  const opened = newlyAvailableAdjacentIds(meta, root.id); assert.ok(opened.length > 0);
  const tx = purchaseMemory(meta, root.id); assert.equal(tx.ok, true); assert.equal(tx.meta.echoBalance, 92);
  assert.deepEqual(newlyAvailableAdjacentIds(tx.meta, root.id), opened);
  assert.equal(tx.preview.powerBefore, 0); assert.equal(tx.preview.powerAfter, 1);
  assert.equal(tx.preview.potentialBefore, BASE_WORLD_POTENTIAL); assert.equal(tx.preview.potentialAfter, 19000);
  assert.ok(tx.preview.potentialAfter / tx.preview.potentialBefore <= 1.25);
  assert.equal(memoryPurchasePreview(tx.meta, root.id).potentialAfter, 19000);
  assert.equal(purchaseMemory(tx.meta, root.id).ok, false);
  const nonadjacent = MEMORY_NODES.find((node) => !getMemoryAdjacentIds(root.id).includes(node.id) && node.id !== root.id);
  assert.equal(purchaseMemory(tx.meta, nonadjacent.id).ok, false);
});

test('all 252 cells can be acquired through one legal traversal at exact total cost', () => {
  let meta = { ...defaultMeta(), echoBalance: 50000 }; let spent = 0; let guard = 0;
  while (meta.memoryNodes.length < 252 && guard++ < 1000) { const node = availableMemoryNodes(meta)[0]; assert.ok(node);
    const tx = purchaseMemory(meta, node.id); assert.equal(tx.ok, true); spent += tx.spent; meta = tx.meta; }
  assert.equal(meta.memoryNodes.length, 252); assert.equal(spent, 17820);
});

test('compiled Resonance, affinity content, builds, and every habitat unlock are bounded', () => {
  const empty = compileMemory({ memoryNodes: [] }); const full = compileMemory({ memoryNodes: MEMORY_NODE_IDS });
  assert.deepEqual({ power:empty.evolutionPower, potential:empty.worldPotential, version:empty.potentialVersion },
    { power:0, potential:16000, version:WORLD_POTENTIAL_VERSION });
  assert.equal(full.evolutionPower, 384); assert.equal(full.worldPotential, 1200000); assert.equal(full.resonanceCurves.length, 18);
  assert.deepEqual(full.habitatCapabilities, ['LAKE_ACCESS','TUNDRA_ACCESS','SNOW_ICE_ACCESS','SHALLOW_OCEAN_EDGE_ACCESS','SHALLOW_OCEAN_ACCESS','DEEP_OCEAN_ACCESS']);
  assert.equal(full.activeBuilds.length, 16); assert.ok(full.buildCapabilities.length >= 12); assert.ok(full.transformations.length >= 5);
  assert.equal(EVOLUTION_AFFINITIES.length, 6);
  assert.ok(MEMORY_NODES.every((node) => node.effect && node.evolutionPower > 0 && node.affinity && node.secondaryTags.length
    && node.tradeoff && node.habitatContributions.length && node.buildContributions.length));
});

test('frequency-5 scene projects one semantic state per whole Skill Cell', () => {
  const topology = createGeodesicTopology(5); const snapshot = buildMemorySnapshot(topology, { ...defaultMeta(), echoBalance: 8 });
  assert.equal(snapshot.memoryStatus.length, 252); assert.equal(snapshot.memoryNodeIndex.filter((index) => index >= 0).length, 252);
  assert.equal(snapshot.nodeStates.length, 252); assert.equal(createMemoryFields(topology).biomeId.length, 252);
});

test('shared CPU picking resolves a selectable frequency-5 cell for both render backends', () => {
  const topology = createGeodesicTopology(5); const canvas = { getBoundingClientRect: () => ({ left:0, top:0, width:1000, height:1000 }) };
  const hit = pickNode(canvas, 500, 500, createCamera(), topology); assert.ok(hit); assert.ok(hit.node >= 0 && hit.node < 252);
  assert.ok(MEMORY_ATLAS_REVERSE[hit.node] >= 0);
});
