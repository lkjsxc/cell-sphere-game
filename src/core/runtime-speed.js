/** Session speed policy. Settings store public multipliers; clocks consume effective game rate. */
export const NORMAL_GAME_RATE_BASELINE = 4;
export const DEFAULT_RUNTIME_SPEED = 1;
export const STANDARD_SPEEDS = Object.freeze([0.5, 1, 2]);
export const DEVELOPER_SPEEDS = Object.freeze([0.25, 0.5, 1, 2, 4, 8, 16, 32, 64]);
export const MAX_TICKS_PER_SLICE = 64;

export function developerModeFromSearch(search = '') {
  try { return new URLSearchParams(String(search)).get('dev') === '1'; }
  catch { return false; }
}

export function runtimeSpeedOptions(developerMode = false) {
  return developerMode ? DEVELOPER_SPEEDS : STANDARD_SPEEDS;
}

export function isStandardSpeed(value) { return STANDARD_SPEEDS.includes(Number(value)); }

/** Exact options are accepted. Normal-mode high values clamp to 2; other invalid values use a safe fallback. */
export function validateRuntimeSpeed(value, options = {}) {
  const developerMode = options.developerMode === true; const allowed = runtimeSpeedOptions(developerMode);
  const numeric = Number(value); if (allowed.includes(numeric)) return numeric;
  if (!developerMode && Number.isFinite(numeric) && numeric > STANDARD_SPEEDS.at(-1)) return STANDARD_SPEEDS.at(-1);
  const fallback = Number(options.fallback); return allowed.includes(fallback) ? fallback : DEFAULT_RUNTIME_SPEED;
}

/** Convert one validated public multiplier into authoritative game seconds per wall second. */
export function effectiveGameRateForSpeed(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0
    ? numeric * NORMAL_GAME_RATE_BASELINE
    : NORMAL_GAME_RATE_BASELINE;
}

/** Presentation is intentionally decimated at developer speeds; authority ticks are not. */
export function snapshotIntervalForSpeed(value) {
  const gameRate = effectiveGameRateForSpeed(value);
  if (gameRate >= 256) return 220; if (gameRate >= 128) return 180; if (gameRate >= 64) return 150;
  if (gameRate >= 16) return 120; return 90;
}

export function renderIntervalForSpeed(value) {
  const gameRate = effectiveGameRateForSpeed(value);
  if (gameRate >= 256) return 120; if (gameRate >= 128) return 100; if (gameRate >= 64) return 84;
  if (gameRate >= 16) return 66; return 0;
}
