/** Canonical IndexedDB visual History with nonblocking verified legacy adoption. */
import { decodeVisualHistory } from '../history/codec.js';
import { LEGACY_RECENT_RUNS_DB, RECENT_RUNS_DB, RECENT_RUNS_RECEIPT } from '../core/identity.js';
const STORE = 'runs';
const RECEIPTS = 'migration';
const VERSION = 2;
const RETAIN = 10;

export function createRecentRuns(factory = browserIndexedDb()) {
  let failed = !factory; let dbPromise = null; let migrationPromise = null;
  function database() {
    if (failed) return Promise.resolve(null);
    if (!dbPromise) dbPromise = openDatabase(factory, RECENT_RUNS_DB, VERSION, true).then((db) => {
      queueMicrotask(() => { migrationPromise ??= migrateLegacyDatabase(factory, db); }); return db;
    }).catch(() => { failed = true; return null; });
    return dbPromise;
  }
  async function ready() { return Boolean(await database()); }
  async function migration() {
    const db = await database(); if (!db) return unavailableMigration();
    migrationPromise ??= migrateLegacyDatabase(factory, db); return migrationPromise;
  }
  async function put(record) {
    const clean = validateRecord(record); if (!clean) return false;
    const db = await database(); if (!db) return false;
    try { await putRecord(db, clean); await prune(db); return sameRecord(validateRecord(await getRecord(db, clean.id)), clean); }
    catch { failed = true; return false; }
  }
  async function get(id) {
    if (typeof id !== 'string' || !id) return null; const db = await database(); if (!db) return null;
    try { return validateRecord(await getRecord(db, id)); } catch { return null; }
  }
  async function list() {
    const db = await database(); if (!db) return [];
    try { return (await allRecords(db)).map(validateRecord).filter(Boolean).sort(newestFirst)
      .map(({ buffer, ...record }) => record); } catch { return []; }
  }
  async function clear() {
    const db = await database(); if (!db) return false;
    try { await transact(db, STORE, 'readwrite', (store) => store.clear()); return true; } catch { return false; }
  }
  database();
  return { ready, migration, put, get, list, clear, get available() { return !failed; } };
}

export function validateRecentRun(raw) { return validateRecord(raw); }

/** Pure asynchronous migration transaction used by production IndexedDB and focused tests. */
export async function migrateRecentRunRecords(legacyRecords, target) {
  try {
    const legacy = legacyRecords.map(validateRecord).filter(Boolean).sort(newestFirst).slice(0, RETAIN);
    const canonical = (await target.list()).map(validateRecord).filter(Boolean);
    const merged = new Map(canonical.map((record) => [record.id, record]));
    for (const record of legacy) if (!merged.has(record.id)) merged.set(record.id, record);
    const retained = [...merged.values()].sort(newestFirst).slice(0, RETAIN); const retainedIds = new Set(retained.map((record) => record.id));
    let copied = 0; let duplicates = 0;
    for (const record of retained) {
      const current = validateRecord(await target.get(record.id));
      if (current) { if (legacy.some((item) => item.id === record.id)) duplicates++; continue; }
      if (!await target.put(record)) return migrationReport('partial', copied, duplicates, legacy.length);
      const verified = validateRecord(await target.get(record.id));
      if (!sameRecord(verified, record)) return migrationReport('partial', copied, duplicates, legacy.length);
      copied++;
    }
    for (const record of canonical) if (!retainedIds.has(record.id) && target.remove) await target.remove(record.id);
    for (const record of retained) if (!validateRecord(await target.get(record.id))) {
      return migrationReport('partial', copied, duplicates, legacy.length);
    }
    const result = migrationReport('complete', copied, duplicates, legacy.length);
    if (!await target.markReceipt(result)) return migrationReport('partial', copied, duplicates, legacy.length);
    return result;
  } catch { return unavailableMigration(); }
}

function validateRecord(raw) {
  if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string' || !/^[a-zA-Z0-9-]{1,48}$/.test(raw.id)
    || !Number.isInteger(raw.seed) || raw.seed < 0 || raw.seed >= 0x40000000
    || !Number.isFinite(raw.completedAt) || raw.completedAt < 0 || !(raw.buffer instanceof ArrayBuffer)) return null;
  try {
    const decoded = decodeVisualHistory(raw.buffer); if (decoded.seed !== raw.seed) return null;
    return { id: raw.id, seed: raw.seed, completedAt: Math.floor(raw.completedAt), buffer: raw.buffer.slice(0) };
  } catch { return null; }
}
async function migrateLegacyDatabase(factory, db) {
  try {
    const receipt = await request(db.transaction(RECEIPTS).objectStore(RECEIPTS).get(RECENT_RUNS_RECEIPT));
    if (receipt?.complete === true) return migrationReport('already-complete', receipt.copied ?? 0, receipt.duplicates ?? 0, receipt.validated ?? 0);
    const legacyDb = await openDatabase(factory, LEGACY_RECENT_RUNS_DB, undefined, false);
    const legacy = legacyDb.objectStoreNames.contains(STORE) ? await allRecords(legacyDb) : []; legacyDb.close?.();
    return migrateRecentRunRecords(legacy, {
      list: () => allRecords(db), get: (id) => getRecord(db, id), put: (record) => putRecord(db, record).then(() => true),
      remove: (id) => transact(db, STORE, 'readwrite', (store) => store.delete(id)).then(() => true),
      markReceipt: (result) => transact(db, RECEIPTS, 'readwrite', (store) => store.put({
        id: RECENT_RUNS_RECEIPT, complete: true, copied: result.copied, duplicates: result.duplicates, validated: result.validated,
      })).then(() => true),
    });
  } catch { return unavailableMigration(); }
}
function openDatabase(factory, name, version, canonical) {
  return new Promise((resolve, reject) => {
    let req; try { req = version === undefined ? factory.open(name) : factory.open(name, version); } catch (error) { reject(error); return; }
    req.onupgradeneeded = () => { const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
      if (canonical && !db.objectStoreNames.contains(RECEIPTS)) db.createObjectStore(RECEIPTS, { keyPath: 'id' }); };
    req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error ?? new Error('IndexedDB unavailable'));
    req.onblocked = () => reject(new Error('IndexedDB blocked'));
  });
}
function allRecords(db) { return request(db.transaction(STORE).objectStore(STORE).getAll()); }
function getRecord(db, id) { return request(db.transaction(STORE).objectStore(STORE).get(id)); }
function putRecord(db, record) { return transact(db, STORE, 'readwrite', (store) => store.put(record)); }
async function prune(db) {
  const records = (await allRecords(db)).map(validateRecord).filter(Boolean).sort(newestFirst);
  for (const old of records.slice(RETAIN)) await transact(db, STORE, 'readwrite', (store) => store.delete(old.id));
}
function request(req) { return new Promise((resolve, reject) => {
  req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'));
}); }
function transact(db, storeName, mode, action) { return new Promise((resolve, reject) => {
  const tx = db.transaction(storeName, mode); action(tx.objectStore(storeName));
  tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'));
  tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
}); }
function newestFirst(a, b) { return b.completedAt - a.completedAt || a.id.localeCompare(b.id); }
function sameRecord(a, b) {
  if (!a || !b || a.id !== b.id || a.seed !== b.seed || a.completedAt !== b.completedAt || a.buffer.byteLength !== b.buffer.byteLength) return false;
  const x = new Uint8Array(a.buffer); const y = new Uint8Array(b.buffer);
  return x.every((value, index) => value === y[index]);
}
function browserIndexedDb() { try { return globalThis.indexedDB; } catch { return null; } }
function migrationReport(status, copied, duplicates, validated) { return Object.freeze({ status, copied, duplicates, validated }); }
function unavailableMigration() { return migrationReport('unavailable', 0, 0, 0); }
