/**
 * Versioned, exact Environment Level schedule boundary.
 *
 * Environment Level is a live within-world clock. The single legacy frontier
 * reader at the end exists only for schema migration; production authority
 * uses the schedule functions below.
 */
import {
  addProgressionIntegers,
  compareProgressionIntegers,
  divideProgressionIntegers,
  incrementProgressionInteger,
  multiplyProgressionIntegers,
  normalizeProgressionInteger,
  parseProgressionInteger,
  projectProgressionInteger,
  subtractProgressionIntegers,
} from '../core/progression-integer.js';
import { hashStringU32, hexU32 } from '../core/hash.js';

/** Environment model 2 replaces the cross-world static frontier. */
export const ENVIRONMENT_LEVEL_VERSION = 2;
export const ENVIRONMENT_MODEL_VERSION = 2;
export const ENVIRONMENT_SCHEDULE_VERSION = 2;
export const ENVIRONMENT_LEVEL_DOCUMENT_DIGIT_LIMIT = 4092;
/** A threshold may add three decimal digits to the largest accepted level. */
export const ENVIRONMENT_TICK_DOCUMENT_DIGIT_LIMIT = 4096;
export const ENVIRONMENT_LEVEL_OPENING_TICKS = '1200';
export const ENVIRONMENT_LEVEL_INTERVAL_TICKS = '600';
export const ENVIRONMENT_LEVEL_PROGRESS_SCALE = 1_000_000;
export const ENVIRONMENT_ONBOARDING_MODIFIER_VERSION = 2;
export const ENVIRONMENT_SCHEDULE_HASH = hexU32(hashStringU32([
  'environment-schedule', ENVIRONMENT_MODEL_VERSION, ENVIRONMENT_SCHEDULE_VERSION,
  ENVIRONMENT_LEVEL_OPENING_TICKS, ENVIRONMENT_LEVEL_INTERVAL_TICKS,
  ENVIRONMENT_LEVEL_PROGRESS_SCALE,
].join('|')));

/** JSON-safe canonical Environment Level. Invalid input degrades field-locally. */
export function normalizeEnvironmentLevel(value, fallback = '0') {
  const safeFallback = normalizeProgressionInteger(fallback, '0');
  const boundedFallback = safeFallback.length <= ENVIRONMENT_LEVEL_DOCUMENT_DIGIT_LIMIT ? safeFallback : '0';
  const canonical = normalizeProgressionInteger(value, boundedFallback);
  return canonical.length <= ENVIRONMENT_LEVEL_DOCUMENT_DIGIT_LIMIT ? canonical : boundedFallback;
}

/** JSON-safe canonical tick; threshold arithmetic permits its extra digits. */
export function normalizeEnvironmentTick(value, fallback = '0') {
  const safeFallback = normalizeProgressionInteger(fallback, '0');
  const boundedFallback = safeFallback.length <= ENVIRONMENT_TICK_DOCUMENT_DIGIT_LIMIT ? safeFallback : '0';
  const canonical = normalizeProgressionInteger(value, boundedFallback);
  return canonical.length <= ENVIRONMENT_TICK_DOCUMENT_DIGIT_LIMIT ? canonical : boundedFallback;
}

/** Direct exact threshold. Level 0 begins at tick 0; no threshold table exists. */
export function environmentTickForLevel(level) {
  const canonical = normalizeEnvironmentLevel(level, '0');
  if (canonical === '0') return '0';
  return addProgressionIntegers(
    ENVIRONMENT_LEVEL_OPENING_TICKS,
    multiplyProgressionIntegers(
      subtractProgressionIntegers(canonical, '1'),
      ENVIRONMENT_LEVEL_INTERVAL_TICKS,
    ),
  );
}

/** Direct exact inverse of {@link environmentTickForLevel}. */
export function environmentLevelAtTick(tick) {
  const canonicalTick = normalizeEnvironmentTick(tick, '0');
  if (compareProgressionIntegers(canonicalTick, ENVIRONMENT_LEVEL_OPENING_TICKS) < 0) return '0';
  return incrementProgressionInteger(divideProgressionIntegers(
    subtractProgressionIntegers(canonicalTick, ENVIRONMENT_LEVEL_OPENING_TICKS),
    ENVIRONMENT_LEVEL_INTERVAL_TICKS,
  ));
}

/** Fixed-point public progress from current threshold toward the next one. */
export function environmentProgressAtTick(tick) {
  const canonicalTick = normalizeEnvironmentTick(tick, '0');
  const currentEnvironmentLevel = environmentLevelAtTick(canonicalTick);
  const environmentLevelStartTick = environmentTickForLevel(currentEnvironmentLevel);
  const nextEnvironmentLevelTick = environmentTickForLevel(incrementProgressionInteger(currentEnvironmentLevel));
  const ticksIntoLevel = subtractProgressionIntegers(canonicalTick, environmentLevelStartTick);
  const ticksUntilNextLevel = subtractProgressionIntegers(nextEnvironmentLevelTick, canonicalTick);
  const levelDurationTicks = subtractProgressionIntegers(nextEnvironmentLevelTick, environmentLevelStartTick);
  // The direct schedule guarantees this projection is at most the opening or
  // interval duration (1,200/600 ticks), so arbitrary precision stays outside
  // runtime state.
  const duration = projectProgressionInteger(levelDurationTicks, Number(ENVIRONMENT_LEVEL_OPENING_TICKS));
  const withinLevel = projectProgressionInteger(ticksIntoLevel, duration);
  const environmentLevelProgressQ = Math.min(ENVIRONMENT_LEVEL_PROGRESS_SCALE - 1,
    Math.floor(withinLevel * ENVIRONMENT_LEVEL_PROGRESS_SCALE / duration));
  return Object.freeze({
    currentEnvironmentLevel,
    environmentLevelStartTick,
    nextEnvironmentLevelTick,
    ticksIntoLevel,
    ticksUntilNextLevel,
    levelDurationTicks,
    environmentLevelProgressQ,
  });
}

/** Explicit first-two-world event protection; never changes the public clock. */
export function environmentOnboardingModifierForWorld(worldOrdinal) {
  const canonicalWorldOrdinal = normalizeProgressionInteger(worldOrdinal, '1') === '0'
    ? '1' : normalizeProgressionInteger(worldOrdinal, '1');
  const harmfulEventsDisabled = compareProgressionIntegers(canonicalWorldOrdinal, '3') < 0;
  return Object.freeze({ version: ENVIRONMENT_ONBOARDING_MODIFIER_VERSION, worldOrdinal: canonicalWorldOrdinal,
    harmfulEventsDisabled, label: harmfulEventsDisabled ? 'establishment-protection' : 'standard-events' });
}

/**
 * Canonical immutable schedule state for one authoritative tick.  External
 * callers receive exact strings; simulation hot loops keep only the bounded
 * fixed-point progress projection.
 */
export function environmentScheduleAtTick(tick) {
  const canonicalTick = normalizeEnvironmentTick(tick, '0');
  const progress = environmentProgressAtTick(canonicalTick);
  return Object.freeze({
    environmentModelVersion: ENVIRONMENT_MODEL_VERSION,
    environmentScheduleVersion: ENVIRONMENT_SCHEDULE_VERSION,
    environmentScheduleHash: ENVIRONMENT_SCHEDULE_HASH,
    tick: canonicalTick,
    ...progress,
  });
}

/**
 * Validate a serialized schedule projection without trusting any redundant
 * level/progress field. The returned state is always recomputed from tick.
 */
export function validateEnvironmentScheduleState(raw) {
  const hasTick = Boolean(raw && Object.prototype.hasOwnProperty.call(raw, 'tick'));
  const state = environmentScheduleAtTick(hasTick ? raw.tick : '0');
  const version = raw?.environmentScheduleVersion ?? raw?.scheduleVersion;
  const modelVersion = raw?.environmentModelVersion ?? raw?.modelVersion;
  const hash = raw?.environmentScheduleHash ?? raw?.scheduleHash;
  const level = raw?.currentEnvironmentLevel ?? raw?.environmentLevel;
  const start = raw?.environmentLevelStartTick ?? raw?.levelStartTick;
  const next = raw?.nextEnvironmentLevelTick ?? raw?.nextLevelTick;
  const progress = raw?.environmentLevelProgressQ ?? raw?.progressQ;
  const valid = hasTick
    && modelVersion === ENVIRONMENT_MODEL_VERSION
    && version === ENVIRONMENT_SCHEDULE_VERSION
    && hash === ENVIRONMENT_SCHEDULE_HASH
    && level === state.currentEnvironmentLevel
    && start === state.environmentLevelStartTick
    && next === state.nextEnvironmentLevelTick
    && progress === state.environmentLevelProgressQ;
  return Object.freeze({ ...state, valid, ok: valid, reason: valid ? 'valid' : 'derived-schedule-state' });
}

/** Canonical public Environment Level comparison. */
export function compareEnvironmentLevels(left, right) {
  return compareProgressionIntegers(parseProgressionInteger(left), parseProgressionInteger(right));
}

// Narrow explicit legacy reader for schema ≤11 documents only. It cannot
// participate in a new world's authority, reward, record, or start state.
export function legacyEnvironmentFrontierForRuns(runs) {
  const value = normalizeProgressionInteger(runs, '0');
  if (compareProgressionIntegers(value, '1') <= 0) return '0';
  if (compareProgressionIntegers(value, '2') <= 0) return '1';
  if (compareProgressionIntegers(value, '5') <= 0) return '2';
  if (compareProgressionIntegers(value, '10') <= 0) return '3';
  return '4';
}
