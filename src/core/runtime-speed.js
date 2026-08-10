/** Session runtime-speed policy. Durable player preferences remain standard-speed only. */
export const STANDARD_SPEEDS = Object.freeze([1, 2, 4, 8]);
export const DEVELOPER_SPEEDS = Object.freeze([1, 2, 4, 8, 16, 32, 64, 128, 256]);
export const MAX_TICKS_PER_SLICE = 64;

export function developerModeFromSearch(search = '') {
  try { return new URLSearchParams(String(search)).get('dev') === '1'; }
  catch { return false; }
}

export function runtimeSpeedOptions(developerMode = false) {
  return developerMode ? DEVELOPER_SPEEDS : STANDARD_SPEEDS;
}

export function isStandardSpeed(value) { return STANDARD_SPEEDS.includes(Number(value)); }

/** Exact options are accepted. Normal-mode high values clamp to 8; other invalid values use a safe fallback. */
export function validateRuntimeSpeed(value, options = {}) {
  const developerMode = options.developerMode === true; const allowed = runtimeSpeedOptions(developerMode);
  const numeric = Number(value); if (allowed.includes(numeric)) return numeric;
  if (!developerMode && Number.isFinite(numeric) && numeric > STANDARD_SPEEDS.at(-1)) return STANDARD_SPEEDS.at(-1);
  const fallback = Number(options.fallback); return allowed.includes(fallback) ? fallback : STANDARD_SPEEDS[0];
}

/** Presentation is intentionally decimated at developer speeds; authority ticks are not. */
export function snapshotIntervalForSpeed(value) {
  const speed = Number(value) || 1;
  if (speed >= 256) return 220; if (speed >= 128) return 180; if (speed >= 64) return 150;
  if (speed >= 16) return 120; return 90;
}

export function renderIntervalForSpeed(value) {
  const speed = Number(value) || 1;
  if (speed >= 256) return 120; if (speed >= 128) return 100; if (speed >= 64) return 84;
  if (speed >= 16) return 66; return 0;
}
