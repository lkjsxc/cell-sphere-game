/** Exact, visible Environment Level frontier and attempt-selection rules. */
import {
  compareProgressionIntegers,
  incrementProgressionInteger,
  maxProgressionInteger,
  normalizeProgressionInteger,
  parseProgressionInteger,subtractProgressionIntegers,
} from '../core/progression-integer.js';

export const ENVIRONMENT_LEVEL_VERSION = 1;
export const PROTECTED_WORLD_COUNT = '2';
/** Leaves room for the public ×1,000 rating inside the shared malformed-document bound. */
export const ENVIRONMENT_LEVEL_DOCUMENT_DIGIT_LIMIT = 4092;

/** JSON-safe canonical Environment Level. Invalid input degrades field-locally. */
export function normalizeEnvironmentLevel(value, fallback = '0') {
  const safeFallback = normalizeProgressionInteger(fallback, '0');
  const boundedFallback = safeFallback.length <= ENVIRONMENT_LEVEL_DOCUMENT_DIGIT_LIMIT ? safeFallback : '0';
  const canonical = normalizeProgressionInteger(value, boundedFallback);
  return canonical.length <= ENVIRONMENT_LEVEL_DOCUMENT_DIGIT_LIMIT ? canonical : boundedFallback;
}

/**
 * Conservative schema-10 migration: retain the old five-era challenge meaning
 * instead of turning a long finite-era save into an unexpectedly lethal level.
 */
export function legacyEnvironmentFrontierForRuns(runs) {
  const value = normalizeProgressionInteger(runs, '0');
  if (compareProgressionIntegers(value, '1') <= 0) return '0';
  if (compareProgressionIntegers(value, '2') <= 0) return '1';
  if (compareProgressionIntegers(value, '5') <= 0) return '2';
  if (compareProgressionIntegers(value, '10') <= 0) return '3';
  return '4';
}

/** Worlds one and two always remain protected, even if imported metadata is ahead. */
export function isProtectedWorld(meta) {
  return compareProgressionIntegers(normalizeProgressionInteger(meta?.runs, '0'), PROTECTED_WORLD_COUNT) < 0;
}

export function highestEnvironmentLevel(meta) {
  const stored = normalizeEnvironmentLevel(meta?.highestEnvironmentLevel, '0');
  return isProtectedWorld(meta) ? stored : maxProgressionInteger('1', stored);
}

/** Low-friction default: protected Level 0, then the current unlocked frontier. */
export function recommendedEnvironmentLevel(meta) {
  if (isProtectedWorld(meta)) return '0';
  return maxProgressionInteger('1', highestEnvironmentLevel(meta));
}

/**
 * Resolve a player-visible attempt without mutating metadata.
 * Modes: advance/recommended, retry, or select (an explicitly unlocked level).
 */
export function resolveEnvironmentAttempt(meta, options = {}) {
  const recommended = recommendedEnvironmentLevel(meta);
  if (isProtectedWorld(meta)) {
    return Object.freeze({ ok: true, reason: 'protected-onboarding', mode: 'protected',
      environmentLevel: '0', highestEnvironmentLevel: highestEnvironmentLevel(meta) });
  }
  const mode = options.mode ?? 'recommended';
  let requested = recommended;
  if (mode === 'retry') requested = normalizeEnvironmentLevel(
    options.environmentLevel ?? options.lastResult?.environmentLevel, recommended,
  );
  else if (mode === 'select') requested = normalizeEnvironmentLevel(options.environmentLevel, recommended);
  else if (!['recommended', 'advance'].includes(mode)) {
    return Object.freeze({ ok: false, reason: 'invalid-environment-mode', mode,
      environmentLevel: recommended, highestEnvironmentLevel: highestEnvironmentLevel(meta) });
  }
  const frontier = highestEnvironmentLevel(meta);
  if (compareProgressionIntegers(requested, frontier) > 0) {
    return Object.freeze({ ok: false, reason: 'environment-level-locked', mode,
      environmentLevel: requested, highestEnvironmentLevel: frontier });
  }
  return Object.freeze({ ok: true, reason: mode === 'retry' ? 'environment-retry' : mode === 'select' ? 'environment-selected' : 'environment-advance',
    mode, environmentLevel: requested, highestEnvironmentLevel: frontier });
}

/**
 * Extinction is normal authoritative completion. Completing the current
 * frontier unlocks exactly one next level; lower retries never skip levels.
 */
export function frontierAfterEnvironmentCompletion(meta,environmentLevel){
  const attempted=normalizeEnvironmentLevel(environmentLevel,'0'),current=highestEnvironmentLevel(meta);
  if(compareProgressionIntegers(attempted,current)!==0)return current;
  const next=incrementProgressionInteger(current);return next.length<=ENVIRONMENT_LEVEL_DOCUMENT_DIGIT_LIMIT?next:current;
}

/** Maximum frontier evidence possible after the recorded completed-world count. */
export function attainableEnvironmentFrontierForRuns(runs){const value=normalizeProgressionInteger(runs,'0');
 if(value==='0')return'0';if(compareProgressionIntegers(value,'2')<=0)return'1';return subtractProgressionIntegers(value,'1');
}

/** Canonical public Environment Level comparison. */
export function compareEnvironmentLevels(left, right) {
  return compareProgressionIntegers(parseProgressionInteger(left), parseProgressionInteger(right));
}
