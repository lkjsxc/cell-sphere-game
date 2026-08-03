/** Verified localStorage namespace adoption; legacy sources are never removed. */
import { LEGACY_STORAGE_KEYS, STORAGE_KEYS } from '../core/identity.js';

export function loadNamespacedDocument(kind, validate, fallback, storage = browserStorage()) {
  const result = migrateNamespacedDocument(kind, validate, fallback, storage);
  return result.value;
}

export function migrateNamespacedDocument(kind, validate, fallback, storage = browserStorage()) {
  const canonicalKey = STORAGE_KEYS[kind];
  if (!canonicalKey || !Array.isArray(LEGACY_STORAGE_KEYS[kind])) throw new Error(`unknown storage document ${kind}`);
  if (!storage?.getItem || !storage?.setItem) return report(kind, fallback(), 'unavailable', false);
  let canonicalText;
  try { canonicalText = storage.getItem(canonicalKey); }
  catch { return report(kind, fallback(), 'unavailable', false); }

  const canonicalRaw = parseObject(canonicalText);
  if (canonicalRaw) {
    const value = validate(canonicalRaw); const normalized = JSON.stringify(value);
    if (normalized === canonicalText) return report(kind, value, 'canonical', true);
    const verified = writeVerified(storage, canonicalKey, value, validate, kind);
    return report(kind, value, verified ? 'canonical-normalized' : 'canonical-volatile', verified);
  }

  const legacy = readLegacy(storage, LEGACY_STORAGE_KEYS[kind]);
  if (canonicalText !== null && !safeLegacyRecovery(storage, kind, legacy, validate)) {
    return report(kind, fallback(), 'canonical-unverified-preserved', false);
  }
  const value = legacy ? validate(legacy.raw) : fallback();
  const verified = writeVerified(storage, canonicalKey, value, validate, kind, legacy);
  const status = legacy ? (verified ? 'migrated' : 'legacy-volatile') : (verified ? 'initialized' : 'unavailable');
  return report(kind, value, status, verified, legacy?.key ?? null);
}

export function saveNamespacedDocument(kind, value, validate, storage = browserStorage()) {
  if (!storage?.getItem || !storage?.setItem) return false;
  return writeVerified(storage, STORAGE_KEYS[kind], validate(value), validate, kind);
}

export function readMigrationReceipt(storage = browserStorage()) {
  try { return normalizeReceipt(parseObject(storage?.getItem?.(STORAGE_KEYS.migration))); }
  catch { return normalizeReceipt(null); }
}

export function writeMigrationComplete(documents, storage = browserStorage()) {
  try {
    const receipt = readMigrationReceipt(storage); receipt.complete = documents.every((item) => item.verified);
    receipt.documents = { ...receipt.documents, ...Object.fromEntries(documents.map((item) => [item.kind, {
      ...(receipt.documents[item.kind] ?? {}), status: item.status, verified: item.verified,
    }])) };
    storage.setItem(STORAGE_KEYS.migration, JSON.stringify(receipt));
    return receipt.complete;
  } catch { return false; }
}

function writeVerified(storage, key, value, validate, kind, legacy = null) {
  const normalized = JSON.stringify(validate(value));
  try {
    storage.setItem(key, normalized);
    const readback = storage.getItem(key); const parsed = parseObject(readback);
    if (!parsed || JSON.stringify(validate(parsed)) !== normalized) return false;
    checkpoint(storage, kind, normalized, legacy); return true;
  } catch { return false; }
}

function checkpoint(storage, kind, normalized, legacy) {
  try {
    const receipt = readMigrationReceipt(storage); const previous = receipt.documents[kind] ?? {};
    receipt.documents[kind] = {
      ...previous,
      targetHash: hashText(normalized),
      ...(legacy ? { sourceKey: legacy.key, sourceHash: hashText(legacy.text) } : {}),
      verified: true,
    };
    storage.setItem(STORAGE_KEYS.migration, JSON.stringify(receipt));
  } catch { /* canonical document is already verified; recovery receipt is best-effort */ }
}

function safeLegacyRecovery(storage, kind, legacy, validate) {
  if (!legacy) return false;
  const saved = readMigrationReceipt(storage).documents[kind];
  if (!saved || saved.sourceKey !== legacy.key || saved.sourceHash !== hashText(legacy.text)) return false;
  return saved.targetHash === hashText(JSON.stringify(validate(legacy.raw)));
}

function readLegacy(storage, keys) {
  for (const key of keys) {
    try { const text = storage.getItem(key); const raw = parseObject(text); if (raw) return { key, text, raw }; }
    catch { return null; }
  }
  return null;
}
function parseObject(text) {
  if (typeof text !== 'string') return null;
  try { const value = JSON.parse(text); return value && typeof value === 'object' && !Array.isArray(value) ? value : null; }
  catch { return null; }
}
function normalizeReceipt(raw) {
  return { schema: 1, complete: raw?.complete === true,
    documents: raw?.documents && typeof raw.documents === 'object' ? { ...raw.documents } : {} };
}
function report(kind, value, status, verified, sourceKey = null) {
  return Object.freeze({ kind, value, status, verified, sourceKey });
}
function browserStorage() { try { return globalThis.localStorage; } catch { return null; } }
function hashText(text) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index++) { hash ^= text.charCodeAt(index); hash = Math.imul(hash, 0x01000193); }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
