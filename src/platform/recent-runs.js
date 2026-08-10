/** Current IndexedDB visual History cache. */
import { decodeVisualHistory } from '../history/codec.js';
import { RECENT_RUNS_DB } from '../core/identity.js';
const STORE = 'runs';
const VERSION = 1;
const RETAIN = 10;

export function createRecentRuns(factory = browserIndexedDb()) {
  let failed = !factory; let dbPromise = null;
  function database() {
    if (failed) return Promise.resolve(null);
    if (!dbPromise) dbPromise = openDatabase(factory, RECENT_RUNS_DB, VERSION).catch(() => { failed = true; return null; });
    return dbPromise;
  }
  async function ready() { return Boolean(await database()); }
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
  return { ready, put, get, list, clear, get available() { return !failed; } };
}

export function validateRecentRun(raw) { return validateRecord(raw); }

function validateRecord(raw) {
  if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string' || !/^[a-zA-Z0-9-]{1,48}$/.test(raw.id)
    || !Number.isInteger(raw.seed) || raw.seed < 0 || raw.seed >= 0x40000000
    || !Number.isFinite(raw.completedAt) || raw.completedAt < 0 || !(raw.buffer instanceof ArrayBuffer)) return null;
  try {
    const decoded = decodeVisualHistory(raw.buffer); if (decoded.seed !== raw.seed) return null;
    return { id: raw.id, seed: raw.seed, completedAt: Math.floor(raw.completedAt), buffer: raw.buffer.slice(0) };
  } catch { return null; }
}
function openDatabase(factory, name, version) {
  return new Promise((resolve, reject) => {
    let req; try { req = factory.open(name, version); } catch (error) { reject(error); return; }
    req.onupgradeneeded = () => { const db = req.result; if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' }); };
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
  const x = new Uint8Array(a.buffer); const y = new Uint8Array(b.buffer); return x.every((value, index) => value === y[index]);
}
function browserIndexedDb() { try { return globalThis.indexedDB; } catch { return null; } }
