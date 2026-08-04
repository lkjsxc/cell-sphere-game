/** Current settings, 252-Skill economy, and graph-v4 migration contract. */
import { test } from 'node:test'; import assert from 'node:assert/strict';
import { defaultSettings, validateSettings } from '../../src/platform/settings.js';
import { defaultMeta, validateMeta } from '../../src/platform/storage.js';
import { MEMORY_GRAPH_VERSION, MEMORY_NODES, MEMORY_NODE_IDS, availableMemoryNodes, compileMemory,
  purchaseMemory, validateMemoryGraph } from '../../src/game/skills/index.js';
import { LEGACY_MEMORY_MANIFEST, LEGACY_MEMORY_MAPPING_HASH, LEGACY_MEMORY_SOURCE_HASH } from '../../src/game/skills/legacy-v4-manifest.js';
import { validateAtlasMapping } from '../../src/game/skills/atlas.js';
import { createGeodesicTopology } from '../../src/world/icosphere.js';

test('settings omit retired choice state and ignore old imported values', () => {
  const settings = defaultSettings(); assert.equal(settings.schema, 4); assert.equal('adaptationMode' in settings, false);
  const migrated = validateSettings({ ...settings, adaptationMode: 'manual', speed: 32 });
  assert.equal('adaptationMode' in migrated, false); assert.equal(migrated.speed, 32); assert.equal(migrated.idleRotation, 'off');
});

test('settings reject garbage and preserve independent accessibility preferences', () => {
  const value = validateSettings({ motion: 'bad', contrast: 'high', quality: 'eco', speed: 7,
    cameraInertia: false, autoContinue: false, pauseOnPanels: true, historyRetention: 32 });
  assert.equal(value.motion, defaultSettings().motion); assert.equal(value.contrast, 'high'); assert.equal(value.quality, 'eco');
  assert.equal(value.speed, 1); assert.equal(value.cameraInertia, false); assert.equal(value.autoContinue, false);
  assert.equal(value.pauseOnPanels, true); assert.equal(value.historyRetention, 32);
});

test('Evolution is exactly 252 meaningful cells on a valid six-territory frequency-5 sphere', () => {
  const topo = createGeodesicTopology(5); const graph = validateMemoryGraph(); const atlas = validateAtlasMapping();
  assert.deepEqual([topo.nodeCount, topo.edgeCount, topo.triCount], [252, 750, 500]);
  assert.equal([...topo.degree].filter((degree) => degree === 5).length, 12);
  assert.equal(graph.valid, true, graph.errors.join('\n')); assert.equal(atlas.valid, true, atlas.errors.join('\n'));
  assert.equal(graph.totalCost, 17820); assert.equal(graph.totalPower, 384); assert.equal(graph.worldPotential, 1200000);
  assert.deepEqual(graph.composition, { root: 6, resonance: 180, major: 30, conditional: 12, unlock: 12, keystone: 6, capstone: 6 });
  assert.deepEqual(Object.values(graph.branchCounts), [42, 42, 42, 42, 42, 42]);
  assert.ok(MEMORY_NODES.every((node) => node.evolutionPower > 0 && !('potentialGain' in node) && node.cost >= 8));
});

test('graph-v4 manifest covers all 642 recognized IDs and all 252 targets', () => {
  assert.equal(LEGACY_MEMORY_MANIFEST.length, 642); assert.equal(new Set(LEGACY_MEMORY_MANIFEST.map((row) => row.oldId)).size, 642);
  assert.equal(new Set(LEGACY_MEMORY_MANIFEST.map((row) => row.targetId)).size, 252);
  assert.equal(LEGACY_MEMORY_SOURCE_HASH, '34b4e4a9'); assert.equal(LEGACY_MEMORY_MAPPING_HASH, '85f93318');
  assert.equal(LEGACY_MEMORY_MANIFEST.reduce((sum, row) => sum + row.oldCost, 0), 2462);
});

test('full graph-v4 ownership migrates to all current cells without charge and exactly once', () => {
  const raw = { schema: 8, memoryGraphVersion: 4, memoryNodes: LEGACY_MEMORY_MANIFEST.map((row) => row.oldId),
    echoBalance: 37, totalEchoes: 50, bestScore: 612345 };
  const once = validateMeta(raw); const twice = validateMeta(once);
  assert.equal(once.memoryGraphVersion, MEMORY_GRAPH_VERSION); assert.equal(once.memoryNodes.length, 252);
  assert.equal(once.legacyMemoryNodes.length, 642); assert.equal(once.echoBalance, 37); assert.equal(twice.echoBalance, 37);
  assert.equal(once.bestScore, 0); assert.equal(once.legacyBestScore, 612345);
});

test('scattered and unknown graph-v4 IDs preserve mapped islands and quarantine corruption', () => {
  const rows = [LEGACY_MEMORY_MANIFEST[0], LEGACY_MEMORY_MANIFEST[107], LEGACY_MEMORY_MANIFEST[321]];
  const meta = validateMeta({ schema: 8, memoryGraphVersion: 4, memoryNodes: [...rows.map((row) => row.oldId), 'foreign-skill'], echoBalance: 4 });
  for (const row of rows) assert.ok(meta.memoryNodes.includes(row.targetId));
  assert.deepEqual(meta.quarantinedMemoryNodes, ['foreign-skill']); assert.equal(meta.echoBalance >= 4, true);
});

test('compiled full progression is bounded and exposes every habitat capability', () => {
  const compiled = compileMemory({ memoryNodes: MEMORY_NODE_IDS });
  assert.equal(compiled.evolutionPower, 384); assert.equal(compiled.worldPotential, 1200000); assert.equal(compiled.habitatCapabilities.length, 6);
  assert.equal(compiled.activeBuilds.length, 16); assert.ok(compiled.buildCapabilities.length >= 12);
  for (const value of Object.values(compiled.effects)) assert.ok(Number.isFinite(value) && value > 0 && value < 10);
  for (const curve of compiled.resonanceCurves) assert.ok(curve.value > .69 && curve.value < 1.41);
});

test('complete current graph can be purchased legally and conserves exact Echoes', () => {
  let meta = { ...defaultMeta(), echoBalance: 100000 }; let spent = 0; let guard = 0;
  while (meta.memoryNodes.length < MEMORY_NODES.length && guard++ < 1000) {
    const node = availableMemoryNodes(meta)[0]; assert.ok(node, `frontier stopped at ${meta.memoryNodes.length}`);
    const tx = purchaseMemory(meta, node.id); assert.equal(tx.ok, true); spent += tx.spent; meta = tx.meta;
  }
  assert.equal(meta.memoryNodes.length, 252); assert.equal(spent, 17820); assert.equal(meta.echoBalance, 100000 - 17820);
  assert.equal(purchaseMemory(meta, meta.memoryNodes[0]).ok, false);
});
