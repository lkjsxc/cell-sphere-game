/** Small browser-bound data/quality helpers kept out of the game controller. */
import { validateMeta } from '../platform/storage.js';
import { validateHistory } from '../platform/history.js';
import { validateSettings } from '../platform/settings.js';
import { EXPORT_FILENAME, EXPORT_PRODUCTS, PRODUCT } from '../core/identity.js';

export function seedForRun(runCount, search = location.search) {
  const params = new URLSearchParams(search); const raw = params.get('seed'); const given = raw === null ? NaN : Number(raw);
  if (Number.isInteger(given) && given >= 0 && given < 0x40000000) return given;
  return (20260731 + runCount * 104729) & 0x3fffffff;
}

export function qualityDpr(settings, caps) {
  if (settings.quality === 'eco') return Math.min(caps.dpr, 1.1);
  if (settings.quality === 'balanced') return Math.min(caps.dpr, 1.5);
  if (settings.quality === 'luminous') return Math.min(caps.dpr, 2);
  const constrained = caps.saveData || caps.memoryHint <= 4;
  return Math.min(caps.dpr, constrained ? 1.15 : 1.5);
}

export function createExportData(meta, history, settings) {
  return { schema: 1, product: PRODUCT, meta: validateMeta(meta),
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

export function parseImportedData(text) {
  const raw = JSON.parse(text);
  if (!raw || !EXPORT_PRODUCTS.includes(raw.product)) throw new Error('not a game export');
  return { meta: validateMeta(raw.meta), history: validateHistory(raw.history, 32), settings: validateSettings(raw.settings) };
}
