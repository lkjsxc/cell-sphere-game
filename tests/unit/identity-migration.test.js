/** Current namespace and schema persistence coverage. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EXPORT_FILENAME, PAGES_URL, PRODUCT, REPOSITORY, STORAGE_KEYS, TAGLINE } from '../../src/core/identity.js';
import {
  EVOLUTION_CONTENT_HASH, EVOLUTION_LAYOUT_VERSION, EVOLUTION_LEVEL_VECTOR_VERSION, EVOLUTION_ROOT_CELL,
} from '../../src/game/skills/index.js';
import { createExportData, IMPORT_DOCUMENT_BYTE_LIMIT, parseImportedData, serializeExportData } from '../../src/interface/app-data.js';
import { defaultHistory, loadHistory } from '../../src/platform/history.js';
import { initializeStorageNamespace, saveImportedNamespace } from '../../src/platform/namespace.js';
import { defaultSettings, loadSettings } from '../../src/platform/settings.js';
import { defaultMeta, loadMeta, validateMeta } from '../../src/platform/storage.js';

test('canonical identity is centralized and fresh storage initializes current documents', () => {
  assert.equal(PRODUCT, 'cell-sphere-game'); assert.equal(TAGLINE, 'Every extinction becomes memory.');
  assert.equal(REPOSITORY, 'lkjsxc/cell-sphere-game'); assert.equal(PAGES_URL, 'https://lkjsxc.github.io/cell-sphere-game/');
  assert.equal(EXPORT_FILENAME, 'cell-sphere-game-save.json');
  const storage = memoryStorage(); const report = initializeStorageNamespace(storage);
  assert.equal(report.complete, true); assert.equal(report.available, true);
  assert.deepEqual(JSON.parse(storage.getItem(STORAGE_KEYS.meta)), defaultMeta());
  assert.deepEqual(JSON.parse(storage.getItem(STORAGE_KEYS.history)), defaultHistory());
  assert.deepEqual(JSON.parse(storage.getItem(STORAGE_KEYS.settings)), defaultSettings());
});

test('mismatched meta schemas start fresh without a compatibility migration', () => {
  const old = { ...defaultMeta(), schema: 13, runs: '999', retiredField: true };
  assert.deepEqual(validateMeta(old), defaultMeta());
  const current = validateMeta({ ...defaultMeta(), revision: '7', runs: '4', worldSeedIndex: '5',
    totalEchoes: '400', echoBalance: '100', bestScore: '999', evolutionLevels: [{ cell: EVOLUTION_ROOT_CELL, level: '2' }] });
  assert.equal(current.schema, 15); assert.equal(current.runs, '4'); assert.equal(current.worldSeedIndex, '5');
  assert.deepEqual(current.evolutionLevels, [{ cell: EVOLUTION_ROOT_CELL, level: '2' }]);
});

test('incompatible Evolution channels reset selectively while independent meta survives', () => {
  const legacy = validateMeta({ ...defaultMeta(), revision: '12', runs: '9', echoBalance: '321', totalEchoes: '654',
    evolutionLevelVectorVersion: 2, evolutionLayoutVersion: 0, evolutionContentHash: '00000000',
    evolutionLevels: [{ id: 'first-division', level: '7' }], evolutionTransactionKeys: ['legacy-receipt'],
    evolutionImprintVersion: 1, imprints: [{ kind: 'strongest-corridor', seed: 1, cells: [0, 1, 2] }] });
  assert.equal(legacy.runs, '9'); assert.equal(legacy.echoBalance, '321'); assert.equal(legacy.totalEchoes, '654');
  assert.deepEqual(legacy.evolutionLevels, []); assert.deepEqual(legacy.evolutionTransactionKeys, []); assert.deepEqual(legacy.imprints, []);
  assert.equal(legacy.evolutionLevelVectorVersion, EVOLUTION_LEVEL_VECTOR_VERSION);
  assert.equal(legacy.evolutionLayoutVersion, EVOLUTION_LAYOUT_VERSION); assert.equal(legacy.evolutionContentHash, EVOLUTION_CONTENT_HASH);
});

test('mismatched settings schemas start fresh without preserving old values', () => {
  const retired = { ...defaultSettings(), schema: defaultSettings().schema - 1, motion: 'reduced', autoContinue: false, speed: 8 };
  const storage = memoryStorage({ [STORAGE_KEYS.settings]: JSON.stringify(retired) });
  const report = initializeStorageNamespace(storage);
  assert.deepEqual(report.documents.settings, { status: 'reset', verified: true });
  assert.deepEqual(JSON.parse(storage.getItem(STORAGE_KEYS.settings)), defaultSettings());
});

test('current exports round-trip exactly while old product documents are rejected', () => {
  const huge = `9${'8'.repeat(999)}`;
  const meta = validateMeta({ ...defaultMeta(), revision: '9007199254740992', runs: '9007199254740993',
    worldSeedIndex: '9007199254740994', bestScore: huge, totalEchoes: huge, echoBalance: huge,
    evolutionLevels: [{ cell: EVOLUTION_ROOT_CELL, level: huge }] });
  const text = serializeExportData(meta, defaultHistory(), defaultSettings()); const imported = parseImportedData(text);
  assert.deepEqual(imported.meta, meta); assert.equal(imported.meta.runs, '9007199254740993');
  assert.throws(() => parseImportedData(JSON.stringify({ schema: 1, product: PRODUCT, meta: { schema: 13 } })), /current game export/);
  assert.throws(() => parseImportedData(JSON.stringify({ ...createExportData(meta, defaultHistory(), defaultSettings()),
    settings: { ...defaultSettings(), schema: defaultSettings().schema - 1 } })), /current schema/);
});

test('browser import rejects oversized JSON and rolls partial writes back', () => {
  assert.throws(() => parseImportedData(' '.repeat(IMPORT_DOCUMENT_BYTE_LIMIT + 1)), /security boundary/);
  const storage = memoryStorage(); initializeStorageNamespace(storage);
  const before = new Map([STORAGE_KEYS.meta, STORAGE_KEYS.settings, STORAGE_KEYS.history]
    .map((key) => [key, storage.getItem(key)])); storage.failKey = STORAGE_KEYS.settings;
  const data = createExportData(defaultMeta(), defaultHistory(), defaultSettings());
  const result = saveImportedNamespace(parseImportedData(JSON.stringify(data)), storage);
  assert.equal(result.ok, false); assert.ok(['rolled-back', 'rollback-incomplete'].includes(result.status));
  storage.failKey = null;
  if (result.status === 'rolled-back') for (const [key, value] of before) assert.equal(storage.getItem(key), value);
});

test('loaders return current documents after a committed import', () => {
  const storage = memoryStorage(); const data = { meta: defaultMeta(), history: defaultHistory(), settings: defaultSettings() };
  assert.deepEqual(saveImportedNamespace(data, storage), { ok: true, status: 'committed' });
  assert.deepEqual(loadFrom(storage, loadMeta), data.meta); assert.deepEqual(loadFrom(storage, loadHistory), data.history);
  assert.deepEqual(loadFrom(storage, loadSettings), data.settings);
});

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial)); return {
    failKey: null,
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { if (key === this.failKey) throw new Error('quota'); values.set(key, String(value)); },
    removeItem(key) { if (key === this.failKey) throw new Error('quota'); values.delete(key); },
  };
}
function loadFrom(storage, loader) {
  const previous = globalThis.localStorage; globalThis.localStorage = storage;
  try { return loader(32); } finally { if (previous === undefined) delete globalThis.localStorage; else globalThis.localStorage = previous; }
}
