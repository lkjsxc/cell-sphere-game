/**
 * Settings: load, validate, persist, and reflect user preferences.
 * Storage is localStorage under a versioned key; invalid data falls back
 * to safe defaults without throwing.
 */

const KEY = 'incremental-network-game:settings:v1';

/** @returns {Settings} validated settings with defaults applied */
export function defaultSettings() {
  const prefersReduced = typeof matchMedia === 'function'
    && matchMedia('(prefers-reduced-motion: reduce)').matches;
  return {
    motion: prefersReduced ? 'reduced' : 'full',
    contrast: 'normal',
    colorMode: 'default',
    quality: 'auto',
    muted: true,
    cameraInertia: !prefersReduced,
    draftPause: true,
    haptics: false,
  };
}

const FIELDS = {
  motion: new Set(['full', 'reduced']),
  contrast: new Set(['normal', 'high']),
  colorMode: new Set(['default', 'deutan', 'protan', 'tritan']),
  quality: new Set(['auto', 'eco', 'balanced', 'luminous']),
  muted: null,
  cameraInertia: null,
  draftPause: null,
  haptics: null,
};

/** @param {unknown} raw @returns {Settings} */
export function validateSettings(raw) {
  const base = defaultSettings();
  if (raw === null || typeof raw !== 'object') return base;
  const out = { ...base };
  for (const [field, allowed] of Object.entries(FIELDS)) {
    const value = raw[field];
    if (allowed instanceof Set) {
      if (allowed.has(value)) out[field] = value;
    } else if (typeof value === 'boolean') {
      out[field] = value;
    }
  }
  return out;
}

/** @returns {Settings} */
export function loadSettings() {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    return validateSettings(raw ? JSON.parse(raw) : null);
  } catch {
    return defaultSettings();
  }
}

/** @param {Settings} settings */
export function saveSettings(settings) {
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(settings));
  } catch {
    // Storage may be unavailable (private mode); settings stay in-memory.
  }
}

/** @param {Settings} settings */
export function applySettingsToDocument(settings) {
  const root = document.documentElement;
  root.dataset.motion = settings.motion;
  root.dataset.contrast = settings.contrast;
  root.dataset.colormode = settings.colorMode;
}
