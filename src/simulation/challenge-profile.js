/**
 * Environment Profile v3 compiler. Exact public ratings compile directly at
 * Level transitions into finite bounded coefficients consumed by simulation.
 */
import {
  addProgressionIntegers,
  compareProgressionIntegers,
  multiplyProgressionIntegers,
  normalizeProgressionInteger,
  progressionIntegerMagnitude,
  projectProgressionInteger,
  subtractProgressionIntegers,
} from '../core/progression-integer.js';
import { hashStringU32, hexU32 } from '../core/hash.js';
import { normalizeEnvironmentLevel } from '../game/environment-level.js';

export const LEGACY_CHALLENGE_PROFILE_VERSION = 2;
// v3: effective zero event pressure defers rolling harmful events.
export const CHALLENGE_PROFILE_VERSION = 3;
export const ENVIRONMENT_PROFILE_VERSION = CHALLENGE_PROFILE_VERSION;
export const ENVIRONMENT_RATING_PER_LEVEL = '1000';
export const MAX_EVENTS_PER_WORLD = 6;
export const MIN_TELEGRAPH_TICKS = 100;

const DIMENSIONS = Object.freeze({
  scarcity: Object.freeze(['Fertility', 'Freshwater', 'Scarcity']),
  renewal: Object.freeze(['Fertility', 'Freshwater', 'Scarcity']),
  climate: Object.freeze(['Freshwater', 'Cryogenic']),
  toxicity: Object.freeze(['Scarcity', 'Luminous']),
  maintenance: Object.freeze(['Scarcity', 'Marine', 'Luminous']),
  events: Object.freeze(['Cryogenic', 'Marine', 'Luminous']),
});

/** Direct O(1)-by-level-magnitude compiler; work is bounded by six dimensions. */
export function compileChallengeProfile(input = {}) { return compileProfileVersion(input, CHALLENGE_PROFILE_VERSION); }

/** Narrow migration reader for an in-flight v2 result transaction only. */
export function compileLegacyChallengeProfileV2(input = {}) {
  return compileProfileVersion(input, LEGACY_CHALLENGE_PROFILE_VERSION);
}

function compileProfileVersion(input, version) {
  const environmentLevel = normalizeEnvironmentLevel(input.environmentLevel, '0');
  const publicRating = multiplyProgressionIntegers(environmentLevel, ENVIRONMENT_RATING_PER_LEVEL);
  const evolution = input.evolution && typeof input.evolution === 'object' ? input.evolution : {};
  const dimensions = {};
  for (const [name, affinities] of Object.entries(DIMENSIONS)) {
    const affinityDefense = minimumAffinityDefense(evolution, affinities);
    const buildDefense = normalizeProgressionInteger(evolution.pressureDefense?.[name], '0');
    const defenseRating = addProgressionIntegers(affinityDefense, buildDefense);
    const netRating = compareProgressionIntegers(publicRating, defenseRating) > 0
      ? subtractProgressionIntegers(publicRating, defenseRating) : '0';
    dimensions[name] = Object.freeze({ environmentRating: publicRating, defenseRating,
      netRating, pressure: pressureForNetRating(netRating) });
  }
  return profileFromDimensions(environmentLevel, publicRating, Object.freeze(dimensions), version);
}

export function validateChallengeProfile(raw) {
  if (!raw || raw.version !== CHALLENGE_PROFILE_VERSION || typeof raw !== 'object') return compileChallengeProfile();
  try {
    const environmentLevel = normalizeEnvironmentLevel(raw.environmentLevel, '0');
    const publicRating = multiplyProgressionIntegers(environmentLevel, ENVIRONMENT_RATING_PER_LEVEL);
    const dimensions = {};
    for (const name of Object.keys(DIMENSIONS)) {
      const value = raw.dimensions?.[name];
      const environmentRating = normalizeProgressionInteger(value?.environmentRating, publicRating);
      if (environmentRating !== publicRating) return compileChallengeProfile();
      const defenseRating = normalizeProgressionInteger(value?.defenseRating, '0');
      const expectedNet = compareProgressionIntegers(publicRating, defenseRating) > 0
        ? subtractProgressionIntegers(publicRating, defenseRating) : '0';
      if (normalizeProgressionInteger(value?.netRating, expectedNet) !== expectedNet) return compileChallengeProfile();
      dimensions[name] = Object.freeze({ environmentRating, defenseRating, netRating: expectedNet,
        pressure: pressureForNetRating(expectedNet) });
    }
    const rebuilt = profileFromDimensions(environmentLevel, publicRating, Object.freeze(dimensions));
    return raw.hash === rebuilt.hash ? rebuilt : compileChallengeProfile();
  } catch { return compileChallengeProfile(); }
}

export function environmentProfileHash(profile) {
  const canonical = JSON.stringify({
    version: profile.version,
    environmentLevel: profile.environmentLevel,
    publicRating: profile.publicRating,
    dimensions: Object.fromEntries(Object.entries(profile.dimensions).map(([key, value]) => [key,
      [value.environmentRating, value.defenseRating, value.netRating, value.pressure]])),
    coefficients: profile.coefficients,
    events: profile.events,
    score: profile.score,
  });
  return hexU32(hashStringU32(canonical));
}

/** 1 rating rung produces exactly pressure .35; higher net ratings saturate smoothly. */
export function pressureForNetRating(netRating) {
  const net = normalizeProgressionInteger(netRating, '0');
  if (net === '0') return 0;
  const maxNet = multiplyProgressionIntegers(ENVIRONMENT_RATING_PER_LEVEL, '64');
  const bounded = compareProgressionIntegers(net, maxNet) > 0 ? maxNet : net;
  const whole = projectProgressionInteger(bounded, 64_000);
  return finite(1 - Math.exp(Math.log(0.65) * (whole / 1000)), 0, 1);
}

export function challengeDimensions() { return DIMENSIONS; }

/** Deterministically interpolate prospective runtime coefficients only. */
export function interpolateEnvironmentCoefficients(current, next, progressQ = 0) {
  const q = Math.max(0, Math.min(1_000_000, Number.isInteger(progressQ) ? progressQ : 0)) / 1_000_000;
  const from = current?.coefficients ?? {};
  const to = next?.coefficients ?? from;
  const result = {};
  for (const key of new Set([...Object.keys(from), ...Object.keys(to)])) {
    const a = Number.isFinite(from[key]) ? from[key] : 0;
    const b = Number.isFinite(to[key]) ? to[key] : a;
    result[key] = finite(a + (b - a) * q, Math.min(a, b), Math.max(a, b));
  }
  return Object.freeze(result);
}

/**
 * Compact player-visible finite projection. Runtime interpolation is authority,
 * so its Q, profile endpoints, and exact finite coefficients travel with the
 * same summary rather than presenting the current rung as a static profile.
 */
export function environmentPressureSummary(profile, options = {}) {
  const source = profile && typeof profile === 'object' ? profile : compileChallengeProfile();
  const next = options.nextProfile && typeof options.nextProfile === 'object' ? options.nextProfile : source;
  const interpolationQ = Math.max(0, Math.min(1_000_000,
    Number.isInteger(options.progressQ) ? options.progressQ : 0));
  const coefficients = options.coefficients && typeof options.coefficients === 'object'
    ? options.coefficients : interpolateEnvironmentCoefficients(source, next, interpolationQ);
  return Object.freeze({ level: source.environmentLevel, publicRating: source.publicRating,
    profileHash: source.hash, nextLevel: next.environmentLevel, nextProfileHash: next.hash,
    interpolationQ,
    effectiveCoefficients: Object.freeze(Object.fromEntries(Object.entries(coefficients).map(([key, value]) => [key,
      finite(value, -1_000_000, 1_000_000)]))),
    pressure: finite(source.score?.pressure ?? 0, 0, 1),
    severityQ: Math.max(0, Math.min(1_000_000, Math.round((source.score?.severity ?? 0) * 1_000_000))),
    dimensions: Object.freeze(Object.fromEntries(Object.entries(source.dimensions ?? {}).map(([name, dimension]) => [name,
      Object.freeze({ netRating: dimension.netRating, pressure: dimension.pressure })]))),
  });
}

function minimumAffinityDefense(evolution, affinities) {
  let minimum = null;
  for (const affinity of affinities) {
    const raw = evolution.affinityDefense?.[affinity]
      ?? evolution.affinities?.[affinity]?.defenseRating
      ?? evolution.affinities?.[affinity]?.rating
      ?? '0';
    const value = normalizeProgressionInteger(raw, '0');
    minimum = minimum === null || compareProgressionIntegers(value, minimum) < 0 ? value : minimum;
  }
  return minimum ?? '0';
}

function profileFromDimensions(environmentLevel, publicRating, dimensions, version = CHALLENGE_PROFILE_VERSION) {
  const qScarcity = dimensions.scarcity.pressure; const qRenewal = dimensions.renewal.pressure;
  const qClimate = dimensions.climate.pressure; const qToxicity = dimensions.toxicity.pressure;
  const qMaintenance = dimensions.maintenance.pressure; const qEvents = dimensions.events.pressure;
  const eventRamp = clamp01((qEvents - 0.35) / 0.65);
  const scarcityRamp = difficultyRamp(qScarcity);
  const renewalRamp = difficultyRamp(qRenewal);
  const maintenanceRamp = difficultyRamp(qMaintenance);
  // Events are an effective-pressure dimension: complete relevant finite
  // defense can defer them, while any positive net event pressure retains a
  // mild telegraphed candidate and later levels eventually exceed that defense.
  const eventCount = environmentLevel === '0' || (version !== LEGACY_CHALLENGE_PROFILE_VERSION && qEvents <= 0)
    ? 0 : Math.min(MAX_EVENTS_PER_WORLD, 1 + Math.floor(eventRamp * 5 + 1e-9));
  const maxNetMagnitude = Math.max(...Object.values(dimensions).map((dimension) => pressureMagnitude(dimension.netRating)));
  const profile = {
    version, environmentLevel, publicRating, dimensions,
    coefficients: Object.freeze({
      // World generation is intentionally outside this live pressure object.
      renewalScale: finite(1 - 0.55 * renewalRamp, 0.45, 1),
      seasonScale: finite(0.25 + 0.75 * qClimate, 0.25, 1),
      dryingScale: finite(0.22 * qClimate, 0, 0.22),
      heatDriftScale: finite(0.08 * qClimate, 0, 0.08),
      toxinScale: finite(qToxicity, 0, 1),
      maintenanceScale: finite(1 + 0.30 * maintenanceRamp, 1, 1.30),
      transportStressScale: finite(1 + 0.25 * maintenanceRamp, 1, 1.25),
      recoveryScale: finite(1 - 0.50 * maintenanceRamp, 0.50, 1),
      // Exact rating magnitude remains an asymptotically worsening bounded
      // dimension after ordinary pressure ramps have saturated.
      attritionScale: finite(1 + 0.45 * (maxNetMagnitude / (maxNetMagnitude + 64)), 1, 1.45),
    }),
    events: Object.freeze({ count: eventCount, maxConcurrent: Math.max(0, Math.min(MAX_EVENTS_PER_WORLD, eventCount)),
      cadenceTicks: environmentLevel === '0' ? 900 : Math.max(180, Math.round(840 - 580 * eventRamp)),
      intensityMin: finite(0.50 + 0.22 * eventRamp, 0.50, 0.72),
      intensityMax: finite(0.70 + 0.45 * eventRamp, 0.70, 1.15),
      footprintScale: finite(1 + 0.35 * eventRamp, 1, 1.35), overlap: finite(eventRamp, 0, 1),
      telegraphTicks: MIN_TELEGRAPH_TICKS }),
    score: Object.freeze({ pressure: finite(averagePressure(dimensions), 0, 1),
      // A bounded severity projection is used by hot loops. Exact net ratings
      // remain in dimensions for diagnostics and finite-defense comparisons.
      severity: finite(maxNetMagnitude / (maxNetMagnitude + 64), 0, 0.999999),
      minimumExposureTicks: 900, fullExposureTicks: 2400 }),
  };
  return Object.freeze({ ...profile, hash: environmentProfileHash(profile) });
}
function pressureMagnitude(netRating) {
  const magnitude = progressionIntegerMagnitude(netRating, 6);
  if (magnitude.mantissa === 0) return 0;
  return Math.max(0, magnitude.exponent10 + magnitude.mantissa / magnitude.mantissaScale / 10);
}
function averagePressure(dimensions) {
  const values = Object.values(dimensions); return values.length
    ? values.reduce((sum, value) => sum + value.pressure, 0) / values.length : 0;
}
function finite(value, min, max) {
  const bounded = Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : min;
  return Math.round(bounded * 1_000_000) / 1_000_000;
}
function difficultyRamp(pressure) {
  if (!(pressure > 0)) return 0;
  return 0.04 + 0.96 * clamp01((pressure - 0.35) / 0.65);
}
function clamp01(value) { return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)); }
