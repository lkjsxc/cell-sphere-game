/**
 * Environment Level v1 compiler. Exact public ratings are reduced once at the
 * run boundary to finite, bounded coefficients consumed by simulation ticks.
 */
import {
  addProgressionIntegers,
  compareProgressionIntegers,
  multiplyProgressionIntegers,
  normalizeProgressionInteger,
  projectProgressionInteger,
  subtractProgressionIntegers,
} from '../core/progression-integer.js';
import { hashStringU32, hexU32 } from '../core/hash.js';
import { normalizeEnvironmentLevel } from '../game/environment-level.js';

export const CHALLENGE_PROFILE_VERSION = 1;
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

export function challengeProfileHash(profile) {
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

function profileFromDimensions(environmentLevel, publicRating, dimensions) {
  const qScarcity = dimensions.scarcity.pressure; const qRenewal = dimensions.renewal.pressure;
  const qClimate = dimensions.climate.pressure; const qToxicity = dimensions.toxicity.pressure;
  const qMaintenance = dimensions.maintenance.pressure; const qEvents = dimensions.events.pressure;
  const eventRamp = clamp01((qEvents - 0.35) / 0.65);
  const eventCount = environmentLevel === '0' ? 0 : Math.min(MAX_EVENTS_PER_WORLD, 1 + Math.floor(eventRamp * 5 + 1e-9));
  const profile = {
    version: CHALLENGE_PROFILE_VERSION, environmentLevel, publicRating, dimensions,
    coefficients: Object.freeze({
      initialResourceScale: finite(1 - 0.28 * qScarcity, 0.72, 1),
      renewalScale: finite(1 - 0.55 * qRenewal, 0.45, 1),
      seasonScale: finite(0.25 + 0.75 * qClimate, 0.25, 1),
      dryingScale: finite(0.22 * qClimate, 0, 0.22),
      heatDriftScale: finite(0.08 * qClimate, 0, 0.08),
      toxinScale: finite(qToxicity, 0, 1),
      maintenanceScale: finite(1 + 0.30 * qMaintenance, 1, 1.30),
      transportStressScale: finite(1 + 0.25 * qMaintenance, 1, 1.25),
    }),
    events: Object.freeze({ count: eventCount,
      earliestStartTick: environmentLevel === '0' ? 2400 : Math.max(1100, Math.round(2400 - 1300 * eventRamp)),
      intensityMin: finite(0.50 + 0.22 * eventRamp, 0.50, 0.72),
      intensityMax: finite(0.70 + 0.45 * eventRamp, 0.70, 1.15),
      footprintScale: finite(1 + 0.35 * eventRamp, 1, 1.35), overlap: finite(eventRamp, 0, 1),
      telegraphTicks: MIN_TELEGRAPH_TICKS }),
    score: Object.freeze({ pressure: finite(averagePressure(dimensions), 0, 1),
      minimumExposureTicks: 900, fullExposureTicks: 2400 }),
  };
  return Object.freeze({ ...profile, hash: challengeProfileHash(profile) });
}
function averagePressure(dimensions) {
  const values = Object.values(dimensions); return values.length
    ? values.reduce((sum, value) => sum + value.pressure, 0) / values.length : 0;
}
function finite(value, min, max) {
  const bounded = Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : min;
  return Math.round(bounded * 1_000_000) / 1_000_000;
}
function clamp01(value) { return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)); }
