/** Canonical identity and transactional namespace migration coverage. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EXPORT_FILENAME, LEGACY_PRODUCT, LEGACY_STORAGE_KEYS, PAGES_URL, PRODUCT, REPOSITORY,
  STORAGE_KEYS, TAGLINE } from '../../src/core/identity.js';
import { MEMORY_NODE_IDS } from '../../src/game/skills/index.js';
import { LEGACY_TROPHY_IDS, TROPHY_IDS } from '../../src/game/trophies/index.js';
import { createExportData, parseImportedData, serializeExportData } from '../../src/interface/app-data.js';
import { defaultHistory, loadHistory, validateHistory } from '../../src/platform/history.js';
import { migrateStorageNamespace, saveImportedNamespace } from '../../src/platform/namespace-migration.js';
import { defaultSettings, loadSettings, validateSettings } from '../../src/platform/settings.js';
import { defaultMeta, loadMeta, validateMeta } from '../../src/platform/storage.js';

const legacyHistory = { schema: 4, worlds: [{ id: '7-91-proof', seed: 91, tick: 2700, score: 812345,
  rank: 'Canopy', cause: 'starvation', archetype: 'Lake Weaver', echo: 42, hash: 'ab12cd34', inoculationCell: 17,
  adaptations: ['long-filaments'], events: [{ seq: 0, tick: 8, kind: 'life', importance: 2,
    key: 'run.germination', primaryCells: [17], cellId: 17 }] }],
  memory: [{ seq: 0, nodeId: MEMORY_NODE_IDS[0], cost: 1, balance: 444, run: 7 }],
  trophies: [{ seq: 0, tick: 2700, kind: 'trophy', importance: 3, key: 'trophy.earned',
    subjectId: TROPHY_IDS[0], primaryCells: [], worldId: '7-91-proof', run: 7 }] };
const legacySettings = { schema: 3, motion: 'reduced', contrast: 'high', quality: 'eco', cameraInertia: false,
  idleRotation: 'gentle', adaptationMode: 'manual', autoContinue: false, pauseOnPanels: true, speed: 16, historyRetention: 32 };
const legacyMeta = { schema: 8, bestScore: 812345, totalEchoes: 987, echoBalance: 444, runs: 37,
  worldSeedIndex: 52, resultKeys: ['result-a', 'result-b'], memoryNodes: MEMORY_NODE_IDS,
  quarantinedMemoryNodes: ['foreign-memory'], imprints: [{ kind: 'strongest-corridor', seed: 91,
    cells: Array.from({ length: 64 }, (_, index) => index) }], trophyIds: TROPHY_IDS.slice(0, 11),
  legacyTrophyIds: LEGACY_TROPHY_IDS, trophyQueue: TROPHY_IDS.slice(4, 8), trophyBackfillVersion: 2,
  trophyProgress: { version: 3, adaptationIds: ['long-filaments'], geographyMask: 61, geographyVersion: 3,
    crisisMask: 65, adaptationCategoryMask: 33, lakeTypeMask: 17, lakeSalinityMask: 5,
    aggregate: { totalCrisesEndured: 123, bestScore: 812345 } }, migrationNotice: null };

test('canonical identity is centralized and fresh storage initializes verified canonical documents', () => {
  assert.equal(PRODUCT, 'cell-sphere-game'); assert.equal(TAGLINE, 'Every extinction becomes memory.');
  assert.equal(REPOSITORY, 'lkjsxc/cell-sphere-game'); assert.equal(PAGES_URL, 'https://lkjsxc.github.io/cell-sphere-game/');
  assert.equal(EXPORT_FILENAME, 'cell-sphere-game-save.json');
  const storage = memoryStorage(); const report = migrateStorageNamespace(storage);
  assert.equal(report.complete, true); assert.equal(report.available, true);
  assert.deepEqual(JSON.parse(storage.getItem(STORAGE_KEYS.meta)), defaultMeta());
  assert.deepEqual(JSON.parse(storage.getItem(STORAGE_KEYS.history)), defaultHistory());
  assert.deepEqual(JSON.parse(storage.getItem(STORAGE_KEYS.settings)), defaultSettings());
});

test('full legacy namespace migration preserves every schema-8 progression and semantic document exactly', () => {
  const initial = legacyNamespace(); const storage = memoryStorage(initial); const report = migrateStorageNamespace(storage);
  assert.equal(report.complete, true); assert.deepEqual(Object.values(report.documents).map((item) => item.status), ['migrated', 'migrated', 'migrated']);
  const meta = JSON.parse(storage.getItem(STORAGE_KEYS.meta)); const expectedMeta = validateMeta(legacyMeta);
  assert.equal(meta.bestScore, 812345); assert.equal(meta.totalEchoes, 987); assert.equal(meta.echoBalance, 444);
  assert.equal(meta.runs, 37); assert.equal(meta.worldSeedIndex, 52); assert.deepEqual(meta.resultKeys, ['result-a', 'result-b']);
  assert.equal(meta.memoryNodes.length, 642); assert.deepEqual(meta.memoryNodes, expectedMeta.memoryNodes);
  assert.deepEqual(meta.imprints, expectedMeta.imprints); assert.deepEqual(meta.trophyIds, expectedMeta.trophyIds);
  assert.deepEqual(meta.legacyTrophyIds, expectedMeta.legacyTrophyIds); assert.deepEqual(meta.trophyQueue, expectedMeta.trophyQueue);
  assert.deepEqual(meta.trophyProgress, expectedMeta.trophyProgress);
  assert.deepEqual(JSON.parse(storage.getItem(STORAGE_KEYS.history)), validateHistory(legacyHistory, 32));
  assert.deepEqual(JSON.parse(storage.getItem(STORAGE_KEYS.settings)), validateSettings(legacySettings));
  for (const [key, value] of Object.entries(initial)) assert.equal(storage.getItem(key), value, `legacy source changed: ${key}`);
  const canonicalBefore = [STORAGE_KEYS.meta, STORAGE_KEYS.settings, STORAGE_KEYS.history].map((key) => storage.getItem(key));
  const repeated = migrateStorageNamespace(storage); assert.equal(repeated.complete, true);
  assert.deepEqual([STORAGE_KEYS.meta, STORAGE_KEYS.settings, STORAGE_KEYS.history].map((key) => storage.getItem(key)), canonicalBefore);
});

test('valid canonical wins coexistence and corrupt canonical degrades field-by-field without legacy rollback', () => {
  const canonical = { ...legacyMeta, bestScore: 900001, totalEchoes: 700, echoBalance: 'broken', runs: 9,
    worldSeedIndex: 15, memoryNodes: [MEMORY_NODE_IDS[1]], resultKeys: ['new-result'] };
  const storage = memoryStorage({ ...legacyNamespace(), [STORAGE_KEYS.meta]: JSON.stringify(canonical) });
  migrateStorageNamespace(storage); const meta = validateMeta(JSON.parse(storage.getItem(STORAGE_KEYS.meta)));
  assert.equal(meta.bestScore, 900001); assert.equal(meta.totalEchoes, 700); assert.equal(meta.echoBalance, 0);
  assert.equal(meta.runs, 9); assert.equal(meta.worldSeedIndex, 15); assert.deepEqual(meta.memoryNodes, [MEMORY_NODE_IDS[1]]);
  assert.deepEqual(meta.resultKeys, ['new-result']);

  const blocked = memoryStorage({ ...legacyNamespace(), [STORAGE_KEYS.meta]: '{truncated' });
  const blockedReport = migrateStorageNamespace(blocked);
  assert.equal(blockedReport.documents.meta.status, 'canonical-unverified-preserved');
  assert.equal(blocked.getItem(STORAGE_KEYS.meta), '{truncated');
});

test('a verified legacy receipt permits safe malformed-canonical recovery, while failures stay repeatable', () => {
  const storage = memoryStorage(legacyNamespace()); migrateStorageNamespace(storage);
  storage.setItem(STORAGE_KEYS.meta, '{truncated'); const recovered = migrateStorageNamespace(storage);
  assert.equal(recovered.documents.meta.status, 'migrated'); assert.equal(JSON.parse(storage.getItem(STORAGE_KEYS.meta)).totalEchoes, 987);

  const partial = memoryStorage(legacyNamespace()); partial.failKey = STORAGE_KEYS.history;
  const first = migrateStorageNamespace(partial); assert.equal(first.complete, false);
  assert.ok(partial.getItem(STORAGE_KEYS.meta)); assert.ok(partial.getItem(STORAGE_KEYS.settings));
  assert.equal(partial.getItem(STORAGE_KEYS.history), null); assert.ok(partial.getItem(LEGACY_STORAGE_KEYS.history[0]));
  partial.failKey = null; const second = migrateStorageNamespace(partial); assert.equal(second.complete, true);
  assert.deepEqual(JSON.parse(partial.getItem(STORAGE_KEYS.history)), validateHistory(legacyHistory, 32));

  const throwing = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
  const unavailable = migrateStorageNamespace(throwing); assert.equal(unavailable.available, false); assert.equal(unavailable.complete, false);
});

test('legacy exports import all documents and subsequent exports use canonical product and filename', () => {
  const oldExport = JSON.stringify({ schema: 1, product: LEGACY_PRODUCT,
    meta: legacyMeta, history: legacyHistory, settings: legacySettings });
  const parsed = parseImportedData(oldExport); assert.deepEqual(parsed.meta, validateMeta(legacyMeta));
  assert.deepEqual(parsed.history, validateHistory(legacyHistory, 32)); assert.deepEqual(parsed.settings, validateSettings(legacySettings));
  const canonical = JSON.parse(serializeExportData(parsed.meta, parsed.history, parsed.settings));
  assert.equal(canonical.product, PRODUCT); assert.deepEqual(canonical, createExportData(parsed.meta, parsed.history, parsed.settings));
  const storage = memoryStorage(); assert.deepEqual(saveImportedNamespace(parsed, storage), { ok: true, status: 'committed' });
  assert.deepEqual(loadFrom(storage, loadMeta), parsed.meta); assert.deepEqual(loadFrom(storage, loadHistory), parsed.history);
  assert.deepEqual(loadFrom(storage, loadSettings), parsed.settings);
});

test('three-document import rolls partial writes back without changing the current canonical save', () => {
  const storage = memoryStorage(); migrateStorageNamespace(storage);
  const before = new Map([STORAGE_KEYS.meta, STORAGE_KEYS.settings, STORAGE_KEYS.history, STORAGE_KEYS.migration]
    .map((key) => [key, storage.getItem(key)])); storage.failKey = STORAGE_KEYS.settings;
  const result = saveImportedNamespace(parseImportedData(JSON.stringify({ schema: 1, product: PRODUCT,
    meta: legacyMeta, history: legacyHistory, settings: legacySettings })), storage);
  assert.equal(result.ok, false); assert.ok(['rolled-back', 'rollback-incomplete'].includes(result.status));
  storage.failKey = null;
  if (result.status === 'rolled-back') for (const [key, value] of before) assert.equal(storage.getItem(key), value);
});

function legacyNamespace() {
  return { [LEGACY_STORAGE_KEYS.meta[0]]: JSON.stringify(legacyMeta),
    [LEGACY_STORAGE_KEYS.settings[0]]: JSON.stringify(legacySettings),
    [LEGACY_STORAGE_KEYS.history[0]]: JSON.stringify(legacyHistory) };
}
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
