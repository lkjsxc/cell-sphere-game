/** Versioned, validated durable player preferences. */
import { loadNamespacedDocument, saveNamespacedDocument } from './namespace-store.js';

export const SETTINGS_SCHEMA_VERSION = 6;

export function defaultSettings() {
  const reduced = typeof matchMedia === 'function'
    && matchMedia('(prefers-reduced-motion: reduce)').matches;
  return {
    schema: SETTINGS_SCHEMA_VERSION,
    motion: reduced ? 'reduced' : 'full',
    contrast: 'normal',
    quality: 'auto',
    autoContinue: true,
    speed: 1,
  };
}

const ENUMS = Object.freeze({
  motion: new Set(['full', 'reduced']),
  contrast: new Set(['normal', 'high']),
  quality: new Set(['auto', 'eco', 'balanced', 'high']),
  speed: new Set([1, 2, 4, 8]),
});
const BOOLEANS = Object.freeze(['autoContinue']);

export function validateSettings(raw) {
  const out = defaultSettings();
  if (!raw || typeof raw !== 'object' || raw.schema !== SETTINGS_SCHEMA_VERSION) return out;
  for (const [field, allowed] of Object.entries(ENUMS)) if (allowed.has(raw[field])) out[field] = raw[field];
  if (Number.isFinite(raw.speed) && raw.speed > 8) out.speed = 8;
  for (const field of BOOLEANS) if (typeof raw[field] === 'boolean') out[field] = raw[field];
  return out;
}

export function loadSettings() { return loadNamespacedDocument('settings', validateSettings, defaultSettings); }

export function saveSettings(settings) { return saveNamespacedDocument('settings', settings, validateSettings); }

export function applySettingsToDocument(settings) {
  const root = document.documentElement;
  root.dataset.motion = settings.motion; root.dataset.contrast = settings.contrast; root.dataset.quality = settings.quality;
}
