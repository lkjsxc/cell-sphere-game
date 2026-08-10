/** Crash-recoverable two-document WAL for results and Evolution purchases. */
import { STORAGE_KEYS } from '../core/identity.js';
import { validateHistory } from './history.js';
import { validateMeta } from './storage.js';

export const PROGRESSION_TRANSACTION_SCHEMA = 4;

export function saveProgressionTransaction(meta, history, options = {}, storage = browserStorage()) {
  if (!storage?.getItem || !storage?.setItem) return false;
  const retention = options.retention ?? 24;
  const bundle = normalize({ schema:PROGRESSION_TRANSACTION_SCHEMA, kind:options.kind ?? 'run',
    key:options.key ?? transactionKey(meta, options.kind), meta, history }, retention);
  if (!bundle) return false; const text = JSON.stringify(bundle);
  try {
    storage.setItem(STORAGE_KEYS.resultTransaction, text);
    if (JSON.stringify(normalize(parse(storage.getItem(STORAGE_KEYS.resultTransaction)), retention)) !== text) return false;
    const metaText = JSON.stringify(bundle.meta), historyText = JSON.stringify(bundle.history);
    storage.setItem(STORAGE_KEYS.meta, metaText);
    const metaOk = JSON.stringify(validateMeta(parse(storage.getItem(STORAGE_KEYS.meta)))) === metaText;
    storage.setItem(STORAGE_KEYS.history, historyText);
    const historyOk = JSON.stringify(validateHistory(parse(storage.getItem(STORAGE_KEYS.history)), retention)) === historyText;
    if (metaOk && historyOk) storage.removeItem?.(STORAGE_KEYS.resultTransaction);
    return metaOk && historyOk;
  } catch { return false; }
}

export function saveRunTransaction(meta, history, retention = 24, storage = browserStorage()) {
  return saveProgressionTransaction(meta, history, { kind:'run', retention }, storage);
}

/** A surviving bundle is committed truth; mirror it before normal document loads. */
export function recoverRunTransaction(retention = 24, storage = browserStorage()) {
  if (!storage?.getItem) return null;
  try {
    const bundle = normalize(parse(storage.getItem(STORAGE_KEYS.resultTransaction)), retention); if (!bundle) return null;
    let persisted = false;
    try {
      const metaText = JSON.stringify(bundle.meta), historyText = JSON.stringify(bundle.history);
      storage.setItem(STORAGE_KEYS.meta, metaText); storage.setItem(STORAGE_KEYS.history, historyText);
      persisted = storage.getItem(STORAGE_KEYS.meta) === metaText && storage.getItem(STORAGE_KEYS.history) === historyText;
      if (persisted) storage.removeItem?.(STORAGE_KEYS.resultTransaction);
    } catch { /* recovered state remains authoritative for this playable session */ }
    return Object.freeze({ meta:bundle.meta, history:bundle.history, key:bundle.key, kind:bundle.kind, persisted });
  } catch { return null; }
}

function normalize(raw, retention) {
  if (!raw || raw.schema !== PROGRESSION_TRANSACTION_SCHEMA || typeof raw.key !== 'string' || !raw.key) return null;
  const kind = raw.kind;
  if (!['run', 'evolution'].includes(kind)) return null;
  const meta = validateMeta(raw.meta), history = validateHistory(raw.history, retention);
  const receipts = kind === 'run' ? meta.resultKeys : meta.evolutionTransactionKeys;
  if (!receipts.includes(raw.key)) return null;
  return { schema:PROGRESSION_TRANSACTION_SCHEMA, kind, key:raw.key, meta, history };
}
function transactionKey(meta, kind = 'run') {
  return kind === 'evolution' ? meta?.evolutionTransactionKeys?.at(-1) : meta?.resultKeys?.at(-1);
}
function parse(text) { if (typeof text !== 'string') return null; try { const value=JSON.parse(text); return value && typeof value==='object' ? value:null; } catch { return null; } }
function browserStorage() { try { return globalThis.localStorage ?? null; } catch { return null; } }
