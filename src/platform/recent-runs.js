/** Native IndexedDB adapter for device-local visual History bundles. */
import { decodeVisualHistory } from '../history/codec.js';
const DB_NAME = 'incremental-network-game:recent-runs';
const STORE = 'runs';
const VERSION = 1;
const RETAIN = 10;

export function createRecentRuns(factory = globalThis.indexedDB) {
  let failed = !factory; let dbPromise = null;
  function database() {
    if (failed) return Promise.resolve(null);
    if (!dbPromise) dbPromise = openDatabase(factory).catch(() => { failed = true; return null; });
    return dbPromise;
  }
  async function ready() { return Boolean(await database()); }
  async function put(record) {
    const clean = validateRecord(record); if (!clean) return false;
    const db = await database(); if (!db) return false;
    try {
      await transact(db, 'readwrite', (store) => store.put(clean));
      const records = await request(db.transaction(STORE).objectStore(STORE).getAll());
      records.sort((a, b) => a.completedAt - b.completedAt || a.id.localeCompare(b.id));
      for (const old of records.slice(0, Math.max(0, records.length - RETAIN))) {
        await transact(db, 'readwrite', (store) => store.delete(old.id));
      }
      return true;
    } catch { failed = true; return false; }
  }
  async function get(id) {
    if (typeof id !== 'string' || !id) return null; const db = await database(); if (!db) return null;
    try { return validateRecord(await request(db.transaction(STORE).objectStore(STORE).get(id))); }
    catch { return null; }
  }
  async function list() {
    const db = await database(); if (!db) return [];
    try { return (await request(db.transaction(STORE).objectStore(STORE).getAll())).map(validateRecord).filter(Boolean)
      .sort((a, b) => b.completedAt - a.completedAt).map(({ buffer, ...record }) => record); }
    catch { return []; }
  }
  async function clear() {
    const db = await database(); if (!db) return false;
    try { await transact(db, 'readwrite', (store) => store.clear()); return true; } catch { return false; }
  }
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
function openDatabase(factory) {
  return new Promise((resolve, reject) => {
    let req; try { req = factory.open(DB_NAME, VERSION); } catch (error) { reject(error); return; }
    req.onupgradeneeded = () => { const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' }); };
    req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error ?? new Error('IndexedDB unavailable'));
    req.onblocked = () => reject(new Error('IndexedDB blocked'));
  });
}
function request(req) { return new Promise((resolve, reject) => {
  req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'));
}); }
function transact(db, mode, action) { return new Promise((resolve, reject) => {
  const tx = db.transaction(STORE, mode); action(tx.objectStore(STORE));
  tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'));
  tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
}); }
