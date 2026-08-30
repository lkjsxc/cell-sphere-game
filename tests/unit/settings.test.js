/** Current settings and Evolution persistence contracts. */
import { test } from 'node:test'; import assert from 'node:assert/strict';
import { defaultSettings, SETTINGS_SCHEMA_VERSION, validateSettings } from '../../src/platform/settings.js';
import { DEFAULT_RUNTIME_SPEED, DEVELOPER_SPEEDS, STANDARD_SPEEDS, developerModeFromSearch, runtimeSpeedOptions,
  effectiveGameRateForSpeed, renderIntervalForSpeed, snapshotIntervalForSpeed,
  validateRuntimeSpeed } from '../../src/core/runtime-speed.js';
import { defaultMeta, validateMeta } from '../../src/platform/storage.js';
import { qualityDpr } from '../../src/interface/app-data.js';
import { EVOLUTION_ARCHETYPES, EVOLUTION_LAYOUT, EVOLUTION_TOPOLOGY, availableEvolutionCells,
  buildEvolutionProjection, compileEvolution, evolutionCellState, normalizeEvolutionLevels,
  purchaseEvolutionLevel, validateEvolutionAuthority } from '../../src/game/skills/index.js';

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
  assert.deepEqual(STANDARD_SPEEDS, [0.25, 0.5, 0.75, 1, 1.25, 1.5]);
  assert.deepEqual(DEVELOPER_SPEEDS, [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 4, 8, 16, 32, 64]);
  assert.equal(DEFAULT_RUNTIME_SPEED, 1);
  assert.equal(developerModeFromSearch('?dev=1'), true); assert.equal(developerModeFromSearch('?dev=true'), false);
  assert.equal(developerModeFromSearch('?developerMode=1'), false); assert.equal(developerModeFromSearch(''), false);
  assert.equal(validateRuntimeSpeed(64, { developerMode: true }), 64); assert.equal(validateRuntimeSpeed(256, { developerMode: false }), 1.5);
  assert.equal(validateRuntimeSpeed(32, { developerMode: false }), 1.5); assert.equal(validateRuntimeSpeed(7, { developerMode: false, fallback: 1 }), 1.5);
  assert.deepEqual(STANDARD_SPEEDS.map(effectiveGameRateForSpeed), [1, 2, 3, 4, 5, 6]);
  assert.equal(effectiveGameRateForSpeed(0.25), 1); assert.equal(effectiveGameRateForSpeed(1.5), 6);
  assert.equal(effectiveGameRateForSpeed(64), 256); assert.equal(effectiveGameRateForSpeed('bad'), 4);
  assert.deepEqual(STANDARD_SPEEDS.map(snapshotIntervalForSpeed), [90, 90, 90, 90, 90, 90]);
  assert.deepEqual([4, 16, 32, 64].map(snapshotIntervalForSpeed), [120, 150, 180, 220]);
  assert.deepEqual(STANDARD_SPEEDS.map(renderIntervalForSpeed), [0, 0, 0, 0, 0, 0]);
  assert.deepEqual([4, 16, 32, 64].map(renderIntervalForSpeed), [66, 84, 100, 120]);
});

test('settings reject garbage and preserve independent accessibility preferences', () => {
  const value = validateSettings({ ...defaultSettings(), motion: 'bad', contrast: 'high', quality: 'high', speed: 7,
    autoContinue: false });
  assert.equal(value.motion, defaultSettings().motion); assert.equal(value.contrast, 'high'); assert.equal(value.quality, 'high');
  assert.equal(value.speed, 1); assert.equal(value.autoContinue, false);
  assert.equal(validateSettings({ ...defaultSettings(), speed: 2 }).speed, 1, 'developer-only speed persisted');
  assert.equal(validateSettings({ ...defaultSettings(), quality: 'luminous' }).quality, 'auto');
  const caps = { dpr: 3, saveData: false, memoryHint: 8 };
  assert.equal(qualityDpr({ quality: 'high' }, caps), 2); assert.equal(qualityDpr({ quality: 'luminous' }, caps), 1.5);
});

test('the current Evolution sphere has one valid fine-cell authority and authored archetype catalog', () => {
  const authority = validateEvolutionAuthority();
  assert.deepEqual([EVOLUTION_TOPOLOGY.nodeCount, EVOLUTION_TOPOLOGY.edgeCount], [2562, 7680]);
  assert.equal(authority.valid, true, authority.errors.join('\n'));
  assert.equal(new Set(EVOLUTION_ARCHETYPES.map((archetype) => archetype.id)).size, EVOLUTION_ARCHETYPES.length);
  assert.ok(EVOLUTION_ARCHETYPES.every((archetype) => archetype.effects.length > 0 && archetype.cost >= 8 && archetype.summary));
});

test('mismatched historical meta is reset rather than mapped into current Evolution', () => {
  const old = { schema: 8, memoryGraphVersion: 4, echoBalance: 37, totalEchoes: 50 };
  assert.deepEqual(validateMeta(old), defaultMeta());
});

test('compiled current progression derives direct finite ecology from exact level authority', () => {
  const firstCellByArchetype = new Map();
  for (let cell = 0; cell < EVOLUTION_TOPOLOGY.nodeCount; cell++) if (!firstCellByArchetype.has(EVOLUTION_LAYOUT.archetypeByCell[cell])) {
    firstCellByArchetype.set(EVOLUTION_LAYOUT.archetypeByCell[cell], cell);
  }
  const compiled = compileEvolution({ evolutionLevels: [...firstCellByArchetype.values()].map((cell) => ({ cell, level: '1' })) });
  assert.equal(compiled.ownedArchetypes.length, 42); assert.equal(compiled.habitatCapabilities.length, 6);
  assert.equal(compiled.worldmaking.reclamation, true); assert.equal(compiled.luminous.enabled, true);
  assert.equal('predictiveMultiplier' in compiled, false); assert.ok(Object.isFrozen(compiled.worldmaking));
  for (const value of Object.values(compiled.effects)) assert.ok(Number.isFinite(value) && value > 0 && value < 10);
});

test('fine-cell breadth remains legally extensible before unbounded refinements', () => {
  let meta = { ...defaultMeta(), echoBalance: `1${'0'.repeat(100)}`, revision: '0' }; let guard = 0;
  while (normalizeEvolutionLevels(meta).length < 128 && guard++ < 160) {
    const projection = buildEvolutionProjection(meta); const cell = availableEvolutionCells(projection)
      .find((candidate) => projection.owned[candidate] === 0);
    assert.ok(Number.isInteger(cell), `frontier stopped at ${normalizeEvolutionLevels(meta).length}`);
    const state = evolutionCellState(projection, cell);
    const tx = purchaseEvolutionLevel(meta, cell, { expectedLocalLevel: state.localLevel,
      expectedAggregateRank: state.aggregateRank, expectedRevision: meta.revision, transactionKey: `breadth-${guard}` });
    assert.equal(tx.ok, true); meta = tx.meta;
  }
  assert.equal(normalizeEvolutionLevels(meta).length, 128);
  const root = evolutionCellState(meta, 0); const upgrade = purchaseEvolutionLevel(meta, 0,
    { expectedLocalLevel: root.localLevel, expectedAggregateRank: root.aggregateRank,
      expectedRevision: meta.revision, transactionKey: 'breadth-upgrade' });
  assert.equal(upgrade.ok, true); assert.equal(upgrade.newLocalLevel, '2');
});
