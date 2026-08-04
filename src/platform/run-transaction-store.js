/** Crash-recoverable two-document commit for completed-world rewards and History. */
import { STORAGE_KEYS } from '../core/identity.js';
import { validateHistory } from './history.js';
import { validateMeta } from './storage.js';

export function saveRunTransaction(meta, history, retention = 24, storage = browserStorage()) {
  if (!storage?.getItem || !storage?.setItem) return false;
  const bundle = normalize({ schema:1, key:meta?.resultKeys?.at(-1), meta, history }, retention);
  if (!bundle) return false; const text=JSON.stringify(bundle);
  try {
    storage.setItem(STORAGE_KEYS.resultTransaction,text);
    if (JSON.stringify(normalize(parse(storage.getItem(STORAGE_KEYS.resultTransaction)),retention))!==text) return false;
    const metaText=JSON.stringify(bundle.meta),historyText=JSON.stringify(bundle.history);
    storage.setItem(STORAGE_KEYS.meta,metaText);const metaOk=JSON.stringify(validateMeta(parse(storage.getItem(STORAGE_KEYS.meta))))===metaText;
    storage.setItem(STORAGE_KEYS.history,historyText);const historyOk=JSON.stringify(validateHistory(parse(storage.getItem(STORAGE_KEYS.history)),retention))===historyText;
    if (metaOk&&historyOk) storage.removeItem?.(STORAGE_KEYS.resultTransaction);
    return metaOk&&historyOk;
  } catch { return false; }
}

/** A surviving bundle is the committed truth; mirror it before normal document loads. */
export function recoverRunTransaction(retention = 24, storage = browserStorage()) {
  if (!storage?.getItem) return null;
  try {
    const bundle=normalize(parse(storage.getItem(STORAGE_KEYS.resultTransaction)),retention);if(!bundle)return null;
    let persisted=false;
    try {
      const metaText=JSON.stringify(bundle.meta),historyText=JSON.stringify(bundle.history);
      storage.setItem(STORAGE_KEYS.meta,metaText);storage.setItem(STORAGE_KEYS.history,historyText);
      persisted=storage.getItem(STORAGE_KEYS.meta)===metaText&&storage.getItem(STORAGE_KEYS.history)===historyText;
      if(persisted)storage.removeItem?.(STORAGE_KEYS.resultTransaction);
    } catch { /* recovered state remains authoritative for this playable session */ }
    return Object.freeze({meta:bundle.meta,history:bundle.history,key:bundle.key,persisted});
  } catch { return null; }
}
function normalize(raw,retention){if(!raw||raw.schema!==1||typeof raw.key!=='string'||!raw.key)return null;
 const meta=validateMeta(raw.meta),history=validateHistory(raw.history,retention);
 if(!meta.resultKeys.includes(raw.key))return null;return{schema:1,key:raw.key,meta,history};}
function parse(text){if(typeof text!=='string')return null;try{const value=JSON.parse(text);return value&&typeof value==='object'?value:null;}catch{return null;}}
function browserStorage(){try{return globalThis.localStorage??null;}catch{return null;}}
