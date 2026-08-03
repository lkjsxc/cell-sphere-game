/** Coordinates the three-document canonical namespace transaction. */
import { STORAGE_KEYS } from '../core/identity.js';
import { defaultHistory, validateHistory } from './history.js';
import { defaultSettings, validateSettings } from './settings.js';
import { defaultMeta, validateMeta } from './storage.js';
import { migrateNamespacedDocument, saveNamespacedDocument, writeMigrationComplete } from './namespace-store.js';

export function migrateStorageNamespace(storage = browserStorage()) {
  const settings = migrateNamespacedDocument('settings', validateSettings, defaultSettings, storage);
  const meta = migrateNamespacedDocument('meta', validateMeta, defaultMeta, storage);
  const history = migrateNamespacedDocument('history', (value) => validateHistory(value, 32), defaultHistory, storage);
  const documents = [meta, settings, history];
  const complete = writeMigrationComplete(documents, storage);
  return Object.freeze({ available: documents.every((item) => item.status !== 'unavailable'), complete,
    documents: Object.freeze(Object.fromEntries(documents.map(({ kind, status, verified, sourceKey }) =>
      [kind, Object.freeze({ status, verified, sourceKey })]))) });
}

/** All-or-rollback import persistence. The validated session still remains playable if this fails. */
export function saveImportedNamespace(data, storage = browserStorage()) {
  if (!storage?.getItem || !storage?.setItem || !storage?.removeItem) return Object.freeze({ ok: false, status: 'unavailable' });
  const keys = [STORAGE_KEYS.meta, STORAGE_KEYS.settings, STORAGE_KEYS.history, STORAGE_KEYS.migration];
  const previous = new Map();
  try { for (const key of keys) previous.set(key, storage.getItem(key)); }
  catch { return Object.freeze({ ok: false, status: 'unavailable' }); }
  const writes = [
    () => saveNamespacedDocument('meta', data.meta, validateMeta, storage),
    () => saveNamespacedDocument('settings', data.settings, validateSettings, storage),
    () => saveNamespacedDocument('history', data.history, (value) => validateHistory(value, 32), storage),
  ];
  if (writes.every((write) => write())) {
    const report = migrateStorageNamespace(storage);
    return Object.freeze({ ok: report.complete, status: report.complete ? 'committed' : 'verification-failed' });
  }
  const rolledBack = restore(previous, storage);
  return Object.freeze({ ok: false, status: rolledBack ? 'rolled-back' : 'rollback-incomplete' });
}

function browserStorage() { try { return globalThis.localStorage; } catch { return null; } }
function restore(previous, storage) {
  for (const [key, value] of previous) {
    try {
      if (storage.getItem(key) === value) continue;
      value === null ? storage.removeItem(key) : storage.setItem(key, value);
    } catch { /* verify the complete rollback below */ }
  }
  try { return [...previous].every(([key, value]) => storage.getItem(key) === value); }
  catch { return false; }
}
