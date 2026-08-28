/** Current settings and Evolution persistence contracts. */
import { test } from 'node:test'; import assert from 'node:assert/strict';
import { defaultSettings, SETTINGS_SCHEMA_VERSION, validateSettings } from '../../src/platform/settings.js';
import { DEVELOPER_SPEEDS, STANDARD_SPEEDS, developerModeFromSearch, runtimeSpeedOptions,
  effectiveGameRateForSpeed, renderIntervalForSpeed, snapshotIntervalForSpeed,
  validateRuntimeSpeed } from '../../src/core/runtime-speed.js';
import { defaultMeta, validateMeta } from '../../src/platform/storage.js';
import { qualityDpr } from '../../src/interface/app-data.js';
import { MEMORY_NODES, MEMORY_NODE_IDS, availableMemoryNodes, compileEvolution,
  normalizeEvolutionLevels, purchaseEvolutionLevel, validateMemoryGraph } from '../../src/game/skills/index.js';
import { createGeodesicTopology } from '../../src/world/icosphere.js';

test('settings omit retired menu choices and reject mismatched schemas', () => {
  const settings = defaultSettings(); assert.equal(settings.schema, SETTINGS_SCHEMA_VERSION); assert.equal('adaptationMode' in settings, false);
  const current = validateSettings({ ...settings, adaptationMode: 'manual', developerMode: true, speed: 32,
    cameraInertia: true, idleRotation: 'calm', pauseOnPanels: true, historyRetention: 32 });
  for (const field of ['adaptationMode', 'developerMode', 'cameraInertia', 'idleRotation', 'pauseOnPanels', 'historyRetention'])
    assert.equal(field in current, false, field);
  assert.equal(current.speed, 1);
  assert.deepEqual(validateSettings({ ...settings, schema: SETTINGS_SCHEMA_VERSION - 1, motion: 'reduced', autoContinue: false }), defaultSettings());
});

test('runtime speed policy is standard by default and developer-only by explicit URL flag', () => {
  assert.deepEqual(runtimeSpeedOptions(false), STANDARD_SPEEDS); assert.deepEqual(runtimeSpeedOptions(true), DEVELOPER_SPEEDS);
  assert.deepEqual(STANDARD_SPEEDS, [0.5, 1, 2]);
  assert.deepEqual(DEVELOPER_SPEEDS, [0.25, 0.5, 1, 2, 4, 8, 16, 32, 64]);
  assert.equal(developerModeFromSearch('?dev=1'), true); assert.equal(developerModeFromSearch('?dev=true'), false);
  assert.equal(developerModeFromSearch('?developerMode=1'), false); assert.equal(developerModeFromSearch(''), false);
  assert.equal(validateRuntimeSpeed(64, { developerMode: true }), 64); assert.equal(validateRuntimeSpeed(256, { developerMode: false }), 2);
  assert.equal(validateRuntimeSpeed(32, { developerMode: false }), 2); assert.equal(validateRuntimeSpeed(7, { developerMode: false, fallback: 1 }), 2);
  assert.equal(effectiveGameRateForSpeed(0.25), 1); assert.equal(effectiveGameRateForSpeed(0.5), 2);
  assert.equal(effectiveGameRateForSpeed(1), 4); assert.equal(effectiveGameRateForSpeed(2), 8);
  assert.equal(effectiveGameRateForSpeed(64), 256); assert.equal(effectiveGameRateForSpeed('bad'), 4);
  assert.deepEqual([0.5, 1, 2].map(snapshotIntervalForSpeed), [90, 90, 90]);
  assert.deepEqual([4, 16, 32, 64].map(snapshotIntervalForSpeed), [120, 150, 180, 220]);
  assert.deepEqual([0.5, 1, 2].map(renderIntervalForSpeed), [0, 0, 0]);
  assert.deepEqual([4, 16, 32, 64].map(renderIntervalForSpeed), [66, 84, 100, 120]);
});

test('settings reject garbage and preserve independent accessibility preferences', () => {
  const value = validateSettings({ ...defaultSettings(), motion: 'bad', contrast: 'high', quality: 'high', speed: 7,
    autoContinue: false });
  assert.equal(value.motion, defaultSettings().motion); assert.equal(value.contrast, 'high'); assert.equal(value.quality, 'high');
  assert.equal(value.speed, 1); assert.equal(value.autoContinue, false);
  assert.equal(validateSettings({ ...defaultSettings(), quality: 'luminous' }).quality, 'auto');
  const caps = { dpr: 3, saveData: false, memoryHint: 8 };
  assert.equal(qualityDpr({ quality: 'high' }, caps), 2); assert.equal(qualityDpr({ quality: 'luminous' }, caps), 1.5);
});

test('the current Evolution sphere has a valid authored frequency-2 mapping', () => {
  const topo = createGeodesicTopology(2); const graph = validateMemoryGraph();
  assert.equal(topo.nodeCount, 42); assert.equal([...topo.degree].filter((degree) => degree === 5).length, 12);
  assert.equal(graph.valid, true, graph.errors.join('\n'));
  assert.equal(new Set(MEMORY_NODES.map((node) => node.id)).size, MEMORY_NODES.length);
  assert.ok(MEMORY_NODES.every((node) => node.effects.length > 0 && node.cost >= 8 && node.summary));
});

test('mismatched historical meta is reset rather than mapped into current Evolution', () => {
  const old = { schema: 8, memoryGraphVersion: 4, echoBalance: 37, totalEchoes: 50 };
  assert.deepEqual(validateMeta(old), defaultMeta());
});

test('compiled current progression derives direct finite ecology from exact level authority', () => {
  const compiled = compileEvolution({ evolutionLevels: MEMORY_NODE_IDS.map((id) => ({ id, level: '1' })) });
  assert.equal(compiled.totalOwnedCells, 42); assert.equal(compiled.habitatCapabilities.length, 6);
  assert.equal(compiled.worldmaking.reclamation, true); assert.equal(compiled.luminous.enabled, true);
  assert.equal('predictiveMultiplier' in compiled, false); assert.ok(Object.isFrozen(compiled.worldmaking));
  for (const value of Object.values(compiled.effects)) assert.ok(Number.isFinite(value) && value > 0 && value < 10);
});

test('complete level-one breadth can be purchased legally before bounded refinements', () => {
  let meta = { ...defaultMeta(), echoBalance: '100000', revision: '0' }; let guard = 0;
  while (normalizeEvolutionLevels(meta).length < MEMORY_NODES.length && guard++ < 100) {
    const node = availableMemoryNodes(meta).find((candidate) => candidate.currentLevel === '0');
    assert.ok(node, `frontier stopped at ${normalizeEvolutionLevels(meta).length}`);
    const tx = purchaseEvolutionLevel(meta, node.id, { expectedLevel: '0', expectedRevision: meta.revision, transactionKey: `breadth-${guard}` });
    assert.equal(tx.ok, true); meta = tx.meta;
  }
  assert.equal(normalizeEvolutionLevels(meta).length, 42);
  const upgrade = purchaseEvolutionLevel(meta, MEMORY_NODE_IDS[0], { expectedLevel: '1', expectedRevision: meta.revision, transactionKey: 'breadth-upgrade' });
  assert.equal(upgrade.ok, true); assert.equal(upgrade.newLevel, '2');
});
