/** Small browser-bound data/quality helpers kept out of the game controller. */
import { validateMeta } from '../platform/storage.js';
import { validateHistory } from '../platform/history.js';
import { validateSettings } from '../platform/settings.js';
import { EXPORT_FILENAME, PRODUCT } from '../core/identity.js';
import { normalizeProgressionInteger, parseProgressionIntegerRuntime } from '../core/progression-integer.js';

export function seedForRun(runCount, search = location.search) {
  const params = new URLSearchParams(search); const raw = params.get('seed'); const given = raw === null ? NaN : Number(raw);
  if (Number.isInteger(given) && given >= 0 && given < 0x40000000) return given;
  const run = parseProgressionIntegerRuntime(normalizeProgressionInteger(runCount, '0'));
  return Number((20260731n + run * 104729n) & 0x3fffffffn);
}

export function qualityDpr(settings, caps) {
  if (settings.quality === 'eco') return Math.min(caps.dpr, 1.1);
  if (settings.quality === 'balanced') return Math.min(caps.dpr, 1.5);
  if (settings.quality === 'luminous') return Math.min(caps.dpr, 2);
  const constrained = caps.saveData || caps.memoryHint <= 4;
  return Math.min(caps.dpr, constrained ? 1.15 : 1.5);
}

export function createExportData(meta, history, settings) {
  return { schema: 2, product: PRODUCT, meta: validateMeta(meta),
    history: validateHistory(history, 32), settings: validateSettings(settings) };
}
export function serializeExportData(meta, history, settings) {
  return JSON.stringify(createExportData(meta, history, settings), null, 2);
}
export function downloadData(meta, history, settings) {
  const blob = new Blob([serializeExportData(meta, history, settings)], { type: 'application/json' });
  const url = URL.createObjectURL(blob); const link = document.createElement('a');
  link.href = url; link.download = EXPORT_FILENAME; link.click(); URL.revokeObjectURL(url);
}

export const IMPORT_DOCUMENT_BYTE_LIMIT=2*1024*1024;
export function parseImportedData(text){
  if(typeof text!=='string'||text.length>IMPORT_DOCUMENT_BYTE_LIMIT||new TextEncoder().encode(text).byteLength>IMPORT_DOCUMENT_BYTE_LIMIT)
    throw new Error('game export exceeds the document security boundary');
  const raw=JSON.parse(text);
  if (!raw || raw.schema !== 2 || raw.product !== PRODUCT) throw new Error('not a current game export');
  const meta = validateMeta(raw.meta); const history = validateHistory(raw.history, 32); const settings = validateSettings(raw.settings);
  if (raw.meta?.schema !== meta.schema || raw.history?.schema !== history.schema || raw.settings?.schema !== settings.schema) {
    throw new Error('export does not use the current schema');
  }
  return { meta, history, settings };
}
