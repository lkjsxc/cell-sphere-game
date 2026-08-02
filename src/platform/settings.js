/** Versioned, validated player preferences. */
const KEY = 'incremental-network-game:settings:v2';
const OLD_KEY = 'incremental-network-game:settings:v1';

export function defaultSettings() {
  const reduced = typeof matchMedia === 'function'
    && matchMedia('(prefers-reduced-motion: reduce)').matches;
  return {
    schema: 2,
    motion: reduced ? 'reduced' : 'full',
    contrast: 'normal',
    quality: 'auto',
    cameraInertia: !reduced,
    autoRotate: false,
    autoRotateSpeed: 'slow',
    adaptationMode: 'random',
    pauseOnPanels: false,
    notificationDensity: 'normal',
    speed: 1,
    historyRetention: 24,
  };
}

const ENUMS = Object.freeze({
  motion: new Set(['full', 'reduced']),
  contrast: new Set(['normal', 'high']),
  quality: new Set(['auto', 'eco', 'balanced', 'luminous']),
  autoRotateSpeed: new Set(['slow', 'very-slow']),
  adaptationMode: new Set(['random', 'manual']),
  notificationDensity: new Set(['normal', 'quiet']),
  speed: new Set([1, 2, 4, 8, 16, 32]),
  historyRetention: new Set([24, 32]),
});
const BOOLEANS = Object.freeze(['cameraInertia', 'autoRotate', 'pauseOnPanels']);

export function validateSettings(raw) {
  const out = defaultSettings();
  if (!raw || typeof raw !== 'object') return out;
  for (const [field, allowed] of Object.entries(ENUMS)) {
    if (allowed.has(raw[field])) out[field] = raw[field];
  }
  for (const field of BOOLEANS) {
    if (typeof raw[field] === 'boolean') out[field] = raw[field];
  }
  // Old installs used draftPause=true. It deliberately does not migrate:
  // panels continue time by default in the passive-world interaction model.
  out.schema = 2;
  return out;
}

export function loadSettings() {
  try {
    const current = globalThis.localStorage?.getItem(KEY);
    if (current) return validateSettings(JSON.parse(current));
    const previous = globalThis.localStorage?.getItem(OLD_KEY);
    const migrated = validateSettings(previous ? JSON.parse(previous) : null);
    if (previous) saveSettings(migrated);
    return migrated;
  } catch {
    return defaultSettings();
  }
}

/** Persist an already validated settings object. Returns truthful success. */
export function saveSettings(settings) {
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(validateSettings(settings)));
    return true;
  } catch {
    return false;
  }
}

export function applySettingsToDocument(settings) {
  const root = document.documentElement;
  root.dataset.motion = settings.motion;
  root.dataset.contrast = settings.contrast;
  root.dataset.quality = settings.quality;
}

/** Effective ambient motion respects reduced motion without changing storage. */
export function autoRotationEnabled(settings) {
  return settings.autoRotate && settings.motion !== 'reduced';
}
