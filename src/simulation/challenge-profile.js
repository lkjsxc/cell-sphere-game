/**
 * Environment Profile v4 compiler. Exact public ratings compile directly at
 * Level transitions into finite chronic coefficients consumed by simulation.
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

export const CHALLENGE_PROFILE_VERSION = 4;
export const ENVIRONMENT_PROFILE_VERSION = CHALLENGE_PROFILE_VERSION;
export const ENVIRONMENT_RATING_PER_LEVEL = '1000';

const DIMENSIONS = Object.freeze({
  scarcity: Object.freeze(['Fertility', 'Freshwater', 'Scarcity']),
  renewal: Object.freeze(['Fertility', 'Freshwater', 'Scarcity']),
  climate: Object.freeze(['Freshwater', 'Cryogenic']),
  toxicity: Object.freeze(['Scarcity', 'Luminous']),
  maintenance: Object.freeze(['Scarcity', 'Marine', 'Luminous']),
});

/** Direct O(1)-by-level-magnitude compiler; work is bounded by five dimensions. */
export function compileChallengeProfile(input = {}) {
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
  return profileFromDimensions(environmentLevel, publicRating, Object.freeze(dimensions));
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

/** Compact player-visible finite projection of authoritative chronic pressure. */
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
    const raw = evolution.affinityDefense?.[affinity] ?? '0';
    const value = normalizeProgressionInteger(raw, '0');
    minimum = minimum === null || compareProgressionIntegers(value, minimum) < 0 ? value : minimum;
  }
  return minimum ?? '0';
}

function profileFromDimensions(environmentLevel, publicRating, dimensions) {
  const qScarcity = dimensions.scarcity.pressure; const qRenewal = dimensions.renewal.pressure;
  const qClimate = dimensions.climate.pressure; const qToxicity = dimensions.toxicity.pressure;
  const qMaintenance = dimensions.maintenance.pressure;
  const scarcityRamp = difficultyRamp(qScarcity);
  const renewalRamp = difficultyRamp(qRenewal);
  const maintenanceRamp = difficultyRamp(qMaintenance);
  const maxNetMagnitude = Math.max(...Object.values(dimensions).map((dimension) => pressureMagnitude(dimension.netRating)));
  const profile = {
    version: CHALLENGE_PROFILE_VERSION, environmentLevel, publicRating, dimensions,
    coefficients: Object.freeze({
      renewalScale: finite(1 - 0.55 * renewalRamp, 0.45, 1),
      seasonScale: finite(0.25 + 0.75 * qClimate, 0.25, 1),
      dryingScale: finite(0.22 * qClimate, 0, 0.22),
      heatDriftScale: finite(0.08 * qClimate, 0, 0.08),
      toxinScale: finite(qToxicity, 0, 1),
      maintenanceScale: finite(1 + 0.30 * maintenanceRamp, 1, 1.30),
      transportStressScale: finite(1 + 0.25 * maintenanceRamp, 1, 1.25),
      recoveryScale: finite(1 - 0.50 * maintenanceRamp, 0.50, 1),
      attritionScale: finite(1 + 0.45 * (maxNetMagnitude / (maxNetMagnitude + 64)), 1, 1.45),
    }),
    score: Object.freeze({ pressure: finite(averagePressure(dimensions), 0, 1),
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
