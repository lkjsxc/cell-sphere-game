/** Settings, schema migration, and the permanent Memory transaction boundary. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateSettings, defaultSettings } from '../../src/platform/settings.js';
import { defaultMeta, LEGACY_MEMORY_MAP, saveMeta, validateMeta } from '../../src/platform/storage.js';
import {
  MEMORY_BRANCHES, MEMORY_NODE_IDS, MEMORY_NODES, availableMemoryNodes,
  buildMemorySnapshot, campaignResolved, canPurchaseMemory, compileMemory,
  groupAccessibleMemory, purchaseMemory, validateMemoryGraph,
} from '../../src/game/memory.js';
import { createTopology } from '../../src/world/icosphere.js';

const LEGACY_IDS = Object.keys(LEGACY_MEMORY_MAP);

test('settings defaults and valid values are safe', () => {
  const d = defaultSettings();
  assert.equal(d.muted, true); assert.equal(d.haptics, false);
  assert.ok(['full', 'reduced'].includes(d.motion));
  const s = validateSettings({ motion: 'reduced', muted: false, quality: 'eco', lang: 'ja', speed: 32 });
  assert.deepEqual({ motion: s.motion, muted: s.muted, quality: s.quality, lang: s.lang, speed: s.speed },
    { motion: 'reduced', muted: false, quality: 'eco', lang: 'ja', speed: 32 });
});

test('settings reject garbage, invalid enums, and prototype pollution', () => {
  assert.deepEqual(validateSettings(null), defaultSettings());
  assert.deepEqual(validateSettings('junk'), defaultSettings());
  const s = validateSettings({ motion: 'sideways', quality: 'ultra', muted: 'yes', lang: 'xx', speed: 3 });
  assert.equal(s.motion, defaultSettings().motion); assert.equal(s.quality, 'auto');
  assert.equal(s.muted, true); assert.equal(s.lang, null); assert.equal(s.speed, 1);
  const polluted = validateSettings(JSON.parse('{"__proto__":{"polluted":true},"muted":false}'));
  assert.equal(polluted.muted, false); assert.equal({}.polluted, undefined);
});

test('Memory atlas has the exact validated composition and economy', () => {
  const report = validateMemoryGraph();
  assert.equal(MEMORY_NODES.length, 108); assert.equal(report.valid, true, report.errors.join('\n'));
  assert.deepEqual(report.composition,
    { micro: 48, conditional: 24, unlock: 18, keystone: 6, connector: 6, capstone: 6 });
  assert.deepEqual(report.branchCounts, Object.fromEntries(MEMORY_BRANCHES.map((branch) => [branch, 18])));
  assert.equal(report.roots.length, 6); assert.equal(report.reachable, 108);
  assert.equal(report.totalCost, 818);
  assert.equal(new Set(MEMORY_NODE_IDS).size, 108); assert.equal(new Set(MEMORY_NODES.map((n) => n.cell)).size, 108);
  assert.equal(MEMORY_NODES.filter((node) => node.effect.type === 'scalar').length, 48);
  for (const node of MEMORY_NODES) {
    assert.match(node.id, /^[a-z][a-z-]+$/); assert.ok(node.nameEn.length >= 5);
    assert.ok(node.effectEn.length >= 12); assert.ok(node.description.length >= 35);
    assert.ok(node.cost > 0); assert.ok(node.tier >= 1 && node.tier <= 8);
  }
  const opening = availableMemoryNodes({ ...defaultMeta(), echoBalance: 3 });
  assert.equal(opening.length, 6); assert.equal(new Set(opening.map((node) => node.branch)).size, 6);
});

test('every legacy ownership subset migrates one-for-one without currency refunds', () => {
  for (let mask = 0; mask < 2 ** LEGACY_IDS.length; mask++) {
    const owned = LEGACY_IDS.filter((_, index) => mask & (1 << index));
    const migrated = validateMeta({ schema: 3, bestScore: 99, totalEchoes: 70,
      echoBalance: 17, runs: 4, signalHintShown: true, memoryNodes: owned });
    assert.equal(migrated.schema, 4); assert.equal(migrated.memoryNodes.length, owned.length);
    assert.deepEqual(migrated.memoryNodes, owned.map((id) => LEGACY_MEMORY_MAP[id]));
    assert.equal(migrated.totalEchoes, 70); assert.equal(migrated.echoBalance, 17);
    assert.equal('signalHintShown' in migrated, false);
    assert.deepEqual(migrated.migrationNotice, { kind: 'memory-atlas-v4', pending: true });
  }
});

test('all six proof nodes preserve paid effects while First Trace no longer grants Signal', () => {
  const migrated = validateMeta({ schema: 3, totalEchoes: 40, echoBalance: 0,
    runs: 6, memoryNodes: LEGACY_IDS });
  const compiled = compileMemory(migrated);
  assert.deepEqual(compiled.effects, { reach: 1.06, conductance: 1.08, energyCap: 1.08,
    stressResist: 1.08, signalRadius: 1.08, maintenance: 0.96 });
  assert.equal(compiled.effects.signalCharges, undefined);
  assert.equal(compiled.unlocks.some((item) => item.key === 'unbrokenLesson'), true);
  assert.equal(campaignResolved(migrated), true);
});

test('schema 4 preserves all 108 IDs and quarantines unknown IDs', () => {
  const meta = validateMeta({ schema: 4, memoryGraphVersion: 1, bestScore: 500,
    totalEchoes: 900, echoBalance: 79, runs: 12,
    memoryNodes: [...MEMORY_NODE_IDS, 'foreign-memory'], quarantinedMemoryNodes: ['earlier-unknown'] });
  assert.deepEqual(meta.memoryNodes, MEMORY_NODE_IDS); assert.equal(meta.memoryNodes.length, 108);
  assert.deepEqual(meta.quarantinedMemoryNodes, ['foreign-memory', 'earlier-unknown']);
  assert.equal(meta.echoBalance, 79); assert.equal(meta.migrationNotice, null);
});

test('old Imprints gain canonical topology metadata and invalid edges are removed', () => {
  const meta = validateMeta({ schema: 3, imprints: [
    { kind: 'strongest-corridor', seed: 42, edges: [3, 4, 4, -1, 7680] },
    { kind: 'unknown', seed: 2, edges: [1] },
  ] });
  assert.deepEqual(meta.imprints, [{ kind: 'strongest-corridor', seed: 42, edges: [3, 4],
    topology: { kind: 'icosphere', levels: 4, nodeCount: 2562, edgeCount: 7680 } }]);
});

test('Memory purchases are immutable, repeat-safe, and conserve Echoes', () => {
  const original = Object.freeze({ ...defaultMeta(), echoBalance: 6, totalEchoes: 11,
    memoryNodes: Object.freeze([]) });
  const id = 'reach-horizon-instinct';
  assert.equal(canPurchaseMemory(original, id), true);
  const purchase = purchaseMemory(original, id);
  assert.equal(purchase.ok, true); assert.equal(purchase.spent, purchase.node.cost);
  assert.equal(purchase.meta.echoBalance + purchase.spent, original.echoBalance);
  assert.equal(purchase.meta.totalEchoes, original.totalEchoes); assert.deepEqual(original.memoryNodes, []);
  const repeat = purchaseMemory(purchase.meta, id);
  assert.equal(repeat.ok, false); assert.equal(repeat.meta, purchase.meta);
});

test('the complete graph can be purchased transactionally for its exact total cost', () => {
  const total = validateMemoryGraph().totalCost; let meta = { ...defaultMeta(), totalEchoes: total, echoBalance: total };
  while (meta.memoryNodes.length < MEMORY_NODES.length) {
    const next = MEMORY_NODES.find((node) => canPurchaseMemory(meta, node.id));
    assert.ok(next, `stalled after ${meta.memoryNodes.length} nodes`);
    const before = meta; const result = purchaseMemory(meta, next.id);
    assert.equal(result.meta.echoBalance, before.echoBalance - next.cost);
    assert.equal(result.meta.totalEchoes, before.totalEchoes); meta = result.meta;
  }
  assert.equal(meta.echoBalance, 0); assert.equal(meta.memoryNodes.length, 108);
});

test('stable spherical cells and prerequisite paths drive the Memory snapshot', () => {
  const topo = createTopology(4); const owned = MEMORY_NODE_IDS.slice();
  const meta = { ...defaultMeta(), memoryNodes: owned,
    imprints: [{ kind: 'strongest-corridor', seed: 7, edges: [0] }] };
  const snapshot = buildMemorySnapshot(topo, meta, 'reach-world-seeder');
  const shuffled = buildMemorySnapshot(topo, { ...meta, memoryNodes: [...owned].reverse() }, 'reach-world-seeder');
  assert.deepEqual(snapshot.edgeActive, shuffled.edgeActive);
  assert.equal(snapshot.edgeActive[0], 1); assert.equal(snapshot.nodeStates.length, 108);
  assert.equal(snapshot.nodeStates.find((node) => node.id === 'reach-world-seeder').selectedReady, false);
  for (const node of snapshot.nodeStates) {
    assert.ok(node.cell < topo.nodeCount); const p = node.cell * 3;
    assert.ok(Math.abs(Math.hypot(topo.positions[p], topo.positions[p + 1], topo.positions[p + 2]) - 1) < 1e-5);
  }
  for (let edge = 0; edge < topo.edgeCount; edge++) if (snapshot.edgeActive[edge]) {
    assert.equal(snapshot.alive[topo.edgeA[edge]], 1); assert.equal(snapshot.alive[topo.edgeB[edge]], 1);
  }
  const groups = groupAccessibleMemory({ ...defaultMeta(), echoBalance: 3 }, 'reach-horizon-instinct');
  assert.equal(groups.length, 6); assert.equal(groups[0].nodes[0].selectedReady, true);
});

test('saveMeta reports persistence honestly and writes a validated copy', () => {
  assert.equal(saveMeta(defaultMeta()), false);
  let written = null; globalThis.localStorage = { setItem: (_key, value) => { written = value; } };
  try {
    const meta = { ...defaultMeta(), memoryNodes: ['reach-horizon-instinct', 'unknown-node'] };
    assert.equal(saveMeta(meta), true); assert.deepEqual(meta.memoryNodes, ['reach-horizon-instinct', 'unknown-node']);
    assert.deepEqual(JSON.parse(written).memoryNodes, ['reach-horizon-instinct']);
  } finally { delete globalThis.localStorage; }
});
