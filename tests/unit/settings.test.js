/** Current settings and Evolution persistence contracts. */
import { test } from 'node:test'; import assert from 'node:assert/strict';
import { defaultSettings, SETTINGS_SCHEMA_VERSION, validateSettings } from '../../src/platform/settings.js';
import { DEVELOPER_SPEEDS, STANDARD_SPEEDS, developerModeFromSearch, runtimeSpeedOptions,
  validateRuntimeSpeed } from '../../src/core/runtime-speed.js';
import { defaultMeta, validateMeta } from '../../src/platform/storage.js';
import { MEMORY_NODES, MEMORY_NODE_IDS, availableMemoryNodes, compileEvolution,
  normalizeEvolutionLevels, purchaseEvolutionLevel, validateMemoryGraph } from '../../src/game/skills/index.js';
import { validateAtlasMapping } from '../../src/game/skills/atlas.js';
import { createGeodesicTopology } from '../../src/world/icosphere.js';

test('settings omit retired choice state and reject mismatched schemas', () => {
  const settings = defaultSettings(); assert.equal(settings.schema, SETTINGS_SCHEMA_VERSION); assert.equal('adaptationMode' in settings, false);
  const current = validateSettings({ ...settings, adaptationMode: 'manual', developerMode: true, speed: 32 });
  assert.equal('adaptationMode' in current, false); assert.equal('developerMode' in current, false);
  assert.equal(current.speed, 8); assert.equal(current.idleRotation, 'off');
  assert.deepEqual(validateSettings({ ...settings, schema: SETTINGS_SCHEMA_VERSION - 1, motion: 'reduced', autoContinue: false }), defaultSettings());
});

test('runtime speed policy is standard by default and developer-only by explicit URL flag', () => {
  assert.deepEqual(runtimeSpeedOptions(false), STANDARD_SPEEDS); assert.deepEqual(runtimeSpeedOptions(true), DEVELOPER_SPEEDS);
  assert.equal(developerModeFromSearch('?dev=1'), true); assert.equal(developerModeFromSearch('?dev=true'), false);
  assert.equal(developerModeFromSearch('?developerMode=1'), false); assert.equal(developerModeFromSearch(''), false);
  assert.equal(validateRuntimeSpeed(256, { developerMode: true }), 256); assert.equal(validateRuntimeSpeed(256, { developerMode: false }), 8);
  assert.equal(validateRuntimeSpeed(32, { developerMode: false }), 8); assert.equal(validateRuntimeSpeed(7, { developerMode: false, fallback: 4 }), 4);
});

test('settings reject garbage and preserve independent accessibility preferences', () => {
  const value = validateSettings({ ...defaultSettings(), motion: 'bad', contrast: 'high', quality: 'eco', speed: 7,
    cameraInertia: false, autoContinue: false, pauseOnPanels: true, historyRetention: 32 });
  assert.equal(value.motion, defaultSettings().motion); assert.equal(value.contrast, 'high'); assert.equal(value.quality, 'eco');
  assert.equal(value.speed, 1); assert.equal(value.cameraInertia, false); assert.equal(value.autoContinue, false);
  assert.equal(value.pauseOnPanels, true); assert.equal(value.historyRetention, 32);
});

test('the current Evolution atlas has a valid stable geodesic mapping', () => {
  const topo = createGeodesicTopology(5); const graph = validateMemoryGraph(); const atlas = validateAtlasMapping();
  assert.equal(topo.nodeCount, 252); assert.equal([...topo.degree].filter((degree) => degree === 5).length, 12);
  assert.equal(graph.valid, true, graph.errors.join('\n')); assert.equal(atlas.valid, true, atlas.errors.join('\n'));
  assert.equal(new Set(MEMORY_NODES.map((node) => node.id)).size, MEMORY_NODES.length);
  assert.ok(MEMORY_NODES.every((node) => node.evolutionPower > 0 && node.cost >= 8));
});

test('mismatched historical meta is reset rather than mapped into current Evolution', () => {
  const old = { schema: 8, memoryGraphVersion: 4, echoBalance: 37, totalEchoes: 50 };
  assert.deepEqual(validateMeta(old), defaultMeta());
});

test('compiled current progression derives from exact level authority', () => {
  const compiled = compileEvolution({ evolutionLevels: MEMORY_NODE_IDS.map((id) => ({ id, level: '1' })) });
  assert.equal(compiled.evolutionPower, 384); assert.equal(compiled.worldPotential, '1200000'); assert.equal(compiled.habitatCapabilities.length, 6);
  assert.equal(compiled.activeBuilds.length, 16); assert.ok(compiled.buildCapabilities.length >= 12);
  for (const value of Object.values(compiled.effects)) assert.ok(Number.isFinite(value) && value > 0 && value < 10);
  for (const curve of compiled.resonanceCurves) assert.ok(curve.value > .69 && curve.value < 1.41);
});

test('complete level-one breadth can be purchased legally before unlimited upgrades', () => {
  let meta = { ...defaultMeta(), echoBalance: '100000', revision: '0' }; let spent = 0n; let guard = 0;
  while (normalizeEvolutionLevels(meta).length < MEMORY_NODES.length && guard++ < 1000) {
    const node = availableMemoryNodes(meta).find((candidate) => candidate.currentLevel === '0');
    assert.ok(node, `frontier stopped at ${normalizeEvolutionLevels(meta).length}`);
    const tx = purchaseEvolutionLevel(meta, node.id, { expectedLevel: '0', expectedRevision: meta.revision, transactionKey: `breadth-${guard}` });
    assert.equal(tx.ok, true); spent += BigInt(tx.spent); meta = tx.meta;
  }
  assert.equal(normalizeEvolutionLevels(meta).length, 252); assert.equal(spent, 17820n); assert.equal(meta.echoBalance, '82180');
  const upgrade = purchaseEvolutionLevel(meta, MEMORY_NODE_IDS[0], { expectedLevel: '1', expectedRevision: meta.revision, transactionKey: 'breadth-upgrade' });
  assert.equal(upgrade.ok, true); assert.equal(upgrade.newLevel, '2');
});
