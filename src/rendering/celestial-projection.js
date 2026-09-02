/** Defensive cross-backend reader for presentation-owned celestial state. */
import { validCloudField } from './cloud-field.js';
import { MAX_SKY_STARS, SKY_STAR_STRIDE } from './celestial-constants.js';

const EMPTY_STARS = new Float32Array(MAX_SKY_STARS * SKY_STAR_STRIDE);
export const EMPTY_CELESTIAL_PROJECTION = Object.freeze({ cloud: null, cloudEnabled: false, cloudPhase: 0,
  stars: EMPTY_STARS, starCount: 0, skySeed: 0, shootingStar: null, quality: 'eco', eligibleTimeMs: 0 });

export function normalizeCelestialProjection(value) {
  if (!value || typeof value !== 'object') return EMPTY_CELESTIAL_PROJECTION;
  const stars = value.stars instanceof Float32Array && value.stars.length === EMPTY_STARS.length ? value.stars : EMPTY_STARS;
  const starCount = stars === EMPTY_STARS ? 0 : clampInteger(value.starCount, 0, MAX_SKY_STARS);
  const cloud = validCloudField(value.cloud) ? value.cloud : null;
  const phase = Number.isFinite(value.cloudPhase) ? wrap01(value.cloudPhase) : 0;
  return Object.freeze({ cloud, cloudEnabled: value.cloudEnabled === true && cloud !== null, cloudPhase: phase,
    stars, starCount, skySeed: finiteSeed(value.skySeed), shootingStar: normalizeShootingStar(value.shootingStar),
    quality: ['eco', 'balanced', 'high'].includes(value.quality) ? value.quality : 'eco',
    eligibleTimeMs: Number.isFinite(value.eligibleTimeMs) ? Math.max(0, value.eligibleTimeMs) : 0 });
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
