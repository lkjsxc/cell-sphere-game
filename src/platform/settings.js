/** Versioned, validated durable player preferences. */
const KEY = 'incremental-network-game:settings:v3';
const LEGACY_KEYS = Object.freeze([
  'incremental-network-game:settings:v2',
  'incremental-network-game:settings:v1',
]);

export function defaultSettings() {
  const reduced = typeof matchMedia === 'function'
    && matchMedia('(prefers-reduced-motion: reduce)').matches;
  return {
    schema: 3,
    motion: reduced ? 'reduced' : 'full',
    contrast: 'normal',
    quality: 'auto',
    cameraInertia: !reduced,
    idleRotation: 'off',
    adaptationMode: 'random',
    autoContinue: true,
    pauseOnPanels: false,
    speed: 1,
    historyRetention: 24,
  };
}

const ENUMS = Object.freeze({
  motion: new Set(['full', 'reduced']),
  contrast: new Set(['normal', 'high']),
  quality: new Set(['auto', 'eco', 'balanced', 'luminous']),
  idleRotation: new Set(['off', 'gentle', 'calm']),
  adaptationMode: new Set(['random', 'manual']),
  speed: new Set([1, 2, 4, 8, 16, 32]),
  historyRetention: new Set([24, 32]),
});
const BOOLEANS = Object.freeze(['cameraInertia', 'autoContinue', 'pauseOnPanels']);

export function validateSettings(raw) {
  const out = defaultSettings();
  if (!raw || typeof raw !== 'object') return out;
  for (const [field, allowed] of Object.entries(ENUMS)) if (allowed.has(raw[field])) out[field] = raw[field];
  for (const field of BOOLEANS) if (typeof raw[field] === 'boolean') out[field] = raw[field];
  if (!ENUMS.idleRotation.has(raw.idleRotation) && typeof raw.autoRotate === 'boolean') {
    out.idleRotation = raw.autoRotate ? 'calm' : 'off';
  }
  out.schema = 3; return out;
}

export function loadSettings() {
  try {
    const current = globalThis.localStorage?.getItem(KEY);
    if (current) return validateSettings(JSON.parse(current));
    for (const key of LEGACY_KEYS) {
      const previous = globalThis.localStorage?.getItem(key);
      if (!previous) continue;
      const migrated = validateSettings(JSON.parse(previous)); saveSettings(migrated); return migrated;
    }
    return defaultSettings();
  } catch { return defaultSettings(); }
}

export function saveSettings(settings) {
  try { globalThis.localStorage?.setItem(KEY, JSON.stringify(validateSettings(settings))); return true; }
  catch { return false; }
}

export function applySettingsToDocument(settings) {
  const root = document.documentElement;
  root.dataset.motion = settings.motion; root.dataset.contrast = settings.contrast; root.dataset.quality = settings.quality;
}

export function autoRotationEnabled(settings) {
  return settings.idleRotation !== 'off' && settings.motion !== 'reduced';
}
