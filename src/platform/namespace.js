/** Current-only browser namespace initialization and all-or-rollback imports. */
import { STORAGE_KEYS } from '../core/identity.js';
import { defaultHistory, validateHistory } from './history.js';
import { defaultSettings, validateSettings } from './settings.js';
import { defaultMeta, validateMeta } from './storage.js';
import { initializeNamespacedDocuments, saveNamespacedDocument } from './namespace-store.js';

export function initializeStorageNamespace(storage = browserStorage()) {
  return initializeNamespacedDocuments([
    { kind: 'settings', validate: validateSettings, fallback: defaultSettings },
    { kind: 'meta', validate: validateMeta, fallback: defaultMeta },
    { kind: 'history', validate: validateHistory, fallback: defaultHistory },
  ], storage);
}

/** All-or-rollback import persistence. The validated session remains playable if this fails. */
export function saveImportedNamespace(data, storage = browserStorage()) {
  if (!storage?.getItem || !storage?.setItem || !storage?.removeItem) return Object.freeze({ ok: false, status: 'unavailable' });
  const keys = [STORAGE_KEYS.meta, STORAGE_KEYS.settings, STORAGE_KEYS.history]; const previous = new Map();
  try { for (const key of keys) previous.set(key, storage.getItem(key)); }
  catch { return Object.freeze({ ok: false, status: 'unavailable' }); }
  const writes = [
    () => saveNamespacedDocument('meta', data.meta, validateMeta, storage),
    () => saveNamespacedDocument('settings', data.settings, validateSettings, storage),
    () => saveNamespacedDocument('history', data.history, validateHistory, storage),
  ];
  if (writes.every((write) => write())) return Object.freeze({ ok: true, status: 'committed' });
  return Object.freeze({ ok: false, status: restore(previous, storage) ? 'rolled-back' : 'rollback-incomplete' });
}

function restore(previous, storage) {
  for (const [key, value] of previous) {
    try { if (storage.getItem(key) !== value) value === null ? storage.removeItem(key) : storage.setItem(key, value); }
    catch { /* verify complete rollback below */ }
  }
  try { return [...previous].every(([key, value]) => storage.getItem(key) === value); } catch { return false; }
}
function browserStorage() { try { return globalThis.localStorage; } catch { return null; } }
