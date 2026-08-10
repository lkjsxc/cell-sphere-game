/** Verified reads and writes for the current localStorage namespace only. */
import { STORAGE_KEYS } from '../core/identity.js';

export function loadNamespacedDocument(kind, validate, fallback, storage = browserStorage()) {
  const key = storageKey(kind);
  if (!storage?.getItem) return fallback();
  try {
    const raw = parseObject(storage.getItem(key));
    return raw ? validate(raw) : fallback();
  } catch { return fallback(); }
}

export function saveNamespacedDocument(kind, value, validate, storage = browserStorage()) {
  const key = storageKey(kind);
  if (!storage?.getItem || !storage?.setItem) return false;
  const normalized = JSON.stringify(validate(value));
  try {
    storage.setItem(key, normalized);
    const readback = parseObject(storage.getItem(key));
    return Boolean(readback && JSON.stringify(validate(readback)) === normalized);
  } catch { return false; }
}

/** Initialize the supplied current documents without consulting historic keys. */
export function initializeNamespacedDocuments(documents, storage = browserStorage()) {
  if (!storage?.getItem || !storage?.setItem) return unavailable(documents);
  const reports = [];
  for (const { kind, validate, fallback } of documents) {
    const key = storageKey(kind); let raw;
    try { raw = parseObject(storage.getItem(key)); } catch { reports.push(report(kind, false, 'unavailable')); continue; }
    const value = raw ? validate(raw) : fallback(); const normalized = JSON.stringify(value);
    try {
      if (raw && JSON.stringify(value) === JSON.stringify(raw)) reports.push(report(kind, true, 'current'));
      else {
        storage.setItem(key, normalized); const readback = parseObject(storage.getItem(key));
        reports.push(report(kind, Boolean(readback && JSON.stringify(validate(readback)) === normalized), raw ? 'reset' : 'initialized'));
      }
    } catch { reports.push(report(kind, false, 'unavailable')); }
  }
  return Object.freeze({ available: reports.every((item) => item.status !== 'unavailable'),
    complete: reports.every((item) => item.verified), documents: Object.freeze(Object.fromEntries(reports.map((item) =>
      [item.kind, Object.freeze({ status: item.status, verified: item.verified })]))) });
}

function storageKey(kind) {
  const key = STORAGE_KEYS[kind]; if (!key) throw new Error(`unknown storage document ${kind}`); return key;
}
function parseObject(text) {
  if (typeof text !== 'string') return null;
  try { const value = JSON.parse(text); return value && typeof value === 'object' && !Array.isArray(value) ? value : null; }
  catch { return null; }
}
function report(kind, verified, status) { return Object.freeze({ kind, verified, status }); }
function unavailable(documents) { return Object.freeze({ available: false, complete: false,
  documents: Object.freeze(Object.fromEntries(documents.map(({ kind }) => [kind, Object.freeze({ status: 'unavailable', verified: false })]))) }); }
function browserStorage() { try { return globalThis.localStorage; } catch { return null; } }
