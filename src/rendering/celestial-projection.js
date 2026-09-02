/** Defensive cross-backend reader for presentation-owned celestial state. */
import { validCloudField } from './cloud-field.js';
import { validDeepSpaceField } from './deep-space-field.js';
import { MAX_SKY_STARS, SKY_STAR_STRIDE, STAR_STRATA, validStarCatalog } from './star-field.js';

const EMPTY_STARS = new Float32Array(MAX_SKY_STARS * SKY_STAR_STRIDE);
const EMPTY_STAR_COUNTS = Object.freeze([0, 0, 0]);
export const EMPTY_CELESTIAL_PROJECTION = Object.freeze({ cloud: null, cloudEnabled: false, cloudPhase: 0,
  deepSpace: null, deepSpaceEnabled: false, stars: EMPTY_STARS, starCounts: EMPTY_STAR_COUNTS, starCount: 0,
  skySeed: 0, shootingStar: null, quality: 'eco', eligibleTimeMs: 0 });

export function normalizeCelestialProjection(value) {
  if (!value || typeof value !== 'object') return EMPTY_CELESTIAL_PROJECTION;
  const deepSpace = validDeepSpaceField(value.deepSpace) ? value.deepSpace : null;
  const stars = validStarCatalog(value.stars) ? value.stars : EMPTY_STARS;
  const starCounts = stars === EMPTY_STARS ? EMPTY_STAR_COUNTS : normalizeStarCounts(value.starCounts);
  const starCount = starCounts[0] + starCounts[1] + starCounts[2];
  const cloud = validCloudField(value.cloud) ? value.cloud : null;
  const phase = Number.isFinite(value.cloudPhase) ? wrap01(value.cloudPhase) : 0;
  return Object.freeze({ cloud, cloudEnabled: value.cloudEnabled === true && cloud !== null, cloudPhase: phase,
    deepSpace, deepSpaceEnabled: deepSpace !== null && value.deepSpaceEnabled !== false,
    stars, starCounts, starCount, skySeed: finiteSeed(value.skySeed), shootingStar: normalizeShootingStar(value.shootingStar),
    quality: ['eco', 'balanced', 'high'].includes(value.quality) ? value.quality : 'eco',
    eligibleTimeMs: Number.isFinite(value.eligibleTimeMs) ? Math.max(0, value.eligibleTimeMs) : 0 });
}

function normalizeStarCounts(value) {
  if (!Array.isArray(value) || value.length !== STAR_STRATA.length) return EMPTY_STAR_COUNTS;
  return Object.freeze(STAR_STRATA.map((stratum, index) => clampInteger(value[index], 0, stratum.maximum)));
}

function normalizeShootingStar(value) {
  if (!value || typeof value !== 'object') return null;
  const numeric = ['slotIndex', 'startX', 'startY', 'endX', 'endY', 'progress', 'width', 'intensity', 'tailLength', 'visibility'];
  if (numeric.some((key) => !Number.isFinite(value[key]))) return null;
  if (value.progress < 0 || value.progress > 1 || value.width <= 0 || value.intensity <= 0
    || value.tailLength <= 0 || value.tailLength >= 1 || value.visibility <= 0) return null;
  return value;
}
function clampInteger(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number.isInteger(value) ? value : minimum)); }
function finiteSeed(value) { return Number.isFinite(value) ? Math.trunc(value) >>> 0 : 0; }
function wrap01(value) { return value - Math.floor(value); }
