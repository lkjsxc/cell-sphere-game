/** Bounded animation-time authority for stars, clouds, and shooting stars. */
import { createCloudField, validCloudField } from '../../rendering/cloud-field.js';
import { createDeepSpaceField, validDeepSpaceField } from '../../rendering/deep-space-field.js';
import { createStarCatalog, MAX_SKY_STARS, SKY_STAR_STRIDE, STAR_BUDGETS, starCountsForQuality,
  validStarCatalog } from '../../rendering/star-field.js';

export const CELESTIAL_SKY_SEED = 0x6e5a91c3;
export const SHOOTING_STAR_SLOT_MS = 300_000;
export const CLOUD_PRIMARY_PERIOD_MS = 3_120_000;
export const CLOUD_SECONDARY_PERIOD_MS = 6_540_000;
export const CLOUD_PRIMARY_INITIAL_ANGLE = Math.PI * 15 / 8;
export const CLOUD_SECONDARY_INITIAL_ANGLE = Math.PI * 3 / 8;
export const MAX_CELESTIAL_FRAME_MS = 100;
export const MAX_STARS = MAX_SKY_STARS;
export { STAR_BUDGETS };

export function createCelestialPresentation(options = {}) {
  const now = finiteTime(options.now);
  const state = { lastNow: now, elapsedMs: 0, cloudPrimaryMs: 0, cloudSecondaryMs: 0,
    droppedMs: 0, scene: validScene(options.scene),
    hidden: options.hidden === true, reduced: options.reduced === true,
    quality: resolveCelestialQuality(options.quality, options.caps), skySeed: CELESTIAL_SKY_SEED,
    deepSpaceFactory: typeof options.deepSpaceFactory === 'function' ? options.deepSpaceFactory : createDeepSpaceField,
    starFactory: typeof options.starFactory === 'function' ? options.starFactory : createStarCatalog,
    cloudFactory: typeof options.cloudFactory === 'function' ? options.cloudFactory : createCloudField,
    deepSpace: null, deepSpaceError: null, deepSpaceGenerations: 0,
    stars: new Float32Array(MAX_SKY_STARS * SKY_STAR_STRIDE), starError: null, starGenerations: 0,
    visualSeed: null, cloudSeed: null, cloud: null, cloudsEnabled: false,
    cloudError: null, cloudGenerations: 0, scheduledSlot: -1, scheduledEvent: null, frames: 0 };
  initializeStableSky(state);
  setCelestialVisualSeed(state, options.visualSeed, options.cloudsEnabled !== false);
  return state;
}

export function advanceCelestialPresentation(state, now) {
  accrue(state, now); state.frames++; return celestialProjection(state);
}

export function celestialProjection(state) {
  const eligible = isCelestialEligible(state); const event = eligible ? activeShootingStar(state) : null;
  return Object.freeze({ version: 3, eligible, eligibleTimeMs: state.elapsedMs,
    cloudPrimaryAngle: radians(state.cloudPrimaryMs, CLOUD_PRIMARY_PERIOD_MS, CLOUD_PRIMARY_INITIAL_ANGLE),
    cloudSecondaryAngle: radians(state.cloudSecondaryMs, CLOUD_SECONDARY_PERIOD_MS, CLOUD_SECONDARY_INITIAL_ANGLE), cloudEnabled: state.cloudsEnabled,
    cloudSeed: state.cloudSeed, cloud: state.cloud, skySeed: state.skySeed, deepSpace: state.deepSpace,
    deepSpaceEnabled: state.deepSpace !== null,
    stars: state.stars, starCounts: starCountsForQuality(state.quality),
    starCount: STAR_BUDGETS[state.quality], quality: state.quality, shootingStar: event });
}

export function celestialPresentationSnapshot(state) {
  return Object.freeze({ scene: state.scene, hidden: state.hidden, reduced: state.reduced,
    eligible: isCelestialEligible(state), eligibleTimeMs: state.elapsedMs,
    cloudPrimaryAngle: radians(state.cloudPrimaryMs, CLOUD_PRIMARY_PERIOD_MS, CLOUD_PRIMARY_INITIAL_ANGLE),
    cloudSecondaryAngle: radians(state.cloudSecondaryMs, CLOUD_SECONDARY_PERIOD_MS, CLOUD_SECONDARY_INITIAL_ANGLE), droppedMs: state.droppedMs,
    quality: state.quality, starCount: STAR_BUDGETS[state.quality], skySeed: state.skySeed,
    deepSpaceSignature: state.deepSpace?.signature ?? null, deepSpaceBytes: state.deepSpace?.byteLength ?? 0,
    deepSpaceError: state.deepSpaceError, deepSpaceGenerations: state.deepSpaceGenerations,
    starBytes: state.stars.byteLength, starError: state.starError, starGenerations: state.starGenerations,
    visualSeed: state.visualSeed, cloudSeed: state.cloudSeed, cloudSignature: state.cloud?.signature ?? null,
    cloudBytes: state.cloud?.byteLength ?? 0, cloudError: state.cloudError, cloudGenerations: state.cloudGenerations,
    scheduledSlot: state.scheduledSlot, scheduledEventId: state.scheduledEvent?.id ?? null, frames: state.frames });
}

export function setCelestialScene(state, scene, now) { accrue(state, now); state.scene = validScene(scene); }
export function setCelestialHidden(state, hidden, now) { accrue(state, now); state.hidden = hidden === true; }
export function setCelestialReduced(state, reduced, now) { accrue(state, now); state.reduced = reduced === true; }
export function setCelestialQuality(state, quality, caps) { state.quality = resolveCelestialQuality(quality, caps); }

export function setCelestialVisualSeed(state, visualSeed, cloudsEnabled = true) {
  const enabled = cloudsEnabled === true; const seed = finiteSeed(visualSeed);
  if (!enabled) { state.cloudsEnabled = false; state.visualSeed = null; state.cloudSeed = null;
    state.cloud = null; state.cloudError = null; return false; }
  const cloudSeed = mix32(seed ^ 0xa17f39d5);
  state.visualSeed = seed;
  if (state.cloud && state.cloudSeed === cloudSeed) { state.cloudsEnabled = true; state.cloudError = null; return false; }
  state.cloudSeed = cloudSeed;
  try { const field = state.cloudFactory(cloudSeed); if (!validCloudField(field)) throw new Error('invalid cloud field');
    state.cloud = field; state.cloudsEnabled = true; state.cloudError = null; state.cloudGenerations++; return true; }
  catch (error) { state.cloud = null; state.cloudsEnabled = false;
    state.cloudError = error instanceof Error ? error.message : 'cloud field unavailable'; return false; }
}

function initializeStableSky(state) {
  try {
    const field = state.deepSpaceFactory(mix32(state.skySeed ^ 0x473bc91d));
    if (!validDeepSpaceField(field)) throw new Error('invalid deep-space field');
    state.deepSpace = field; state.deepSpaceGenerations++; state.deepSpaceError = null;
  } catch (error) {
    state.deepSpace = null; state.deepSpaceError = error instanceof Error ? error.message : 'deep-space field unavailable';
  }
  try {
    const stars = state.starFactory(state.skySeed, state.deepSpace);
    if (!validStarCatalog(stars)) throw new Error('invalid star catalog');
    state.stars = stars; state.starGenerations++; state.starError = null;
  } catch (error) {
    state.stars = new Float32Array(MAX_SKY_STARS * SKY_STAR_STRIDE);
    state.starError = error instanceof Error ? error.message : 'star catalog unavailable';
  }
}

export function shootingStarForSlot(seed, slotIndex) {
  if (!Number.isSafeInteger(slotIndex) || slotIndex < 0) throw new RangeError('invalid shooting-star slot');
  const durationMs = 700 + unit(seed, slotIndex, 1) * 500;
  const latestStart = SHOOTING_STAR_SLOT_MS - durationMs - 8_000;
  const startOffsetMs = 8_000 + unit(seed, slotIndex, 2) * (latestStart - 8_000);
  const right = unit(seed, slotIndex, 3) >= 0.5; const horizontal = 0.42 + unit(seed, slotIndex, 4) * 0.22;
  const startX = right ? 0.06 + unit(seed, slotIndex, 5) * 0.16 : 0.78 + unit(seed, slotIndex, 5) * 0.16;
  const startY = 0.08 + unit(seed, slotIndex, 6) * 0.48;
  const endX = startX + (right ? horizontal : -horizontal);
  const endY = Math.min(0.92, startY + 0.16 + unit(seed, slotIndex, 7) * 0.20);
  return Object.freeze({ id: `sky-${slotIndex}-${mix32((seed >>> 0) ^ Math.imul(slotIndex + 1, 0x9e3779b1)).toString(16).padStart(8, '0')}`,
    slotIndex, startOffsetMs, durationMs, startX, startY, endX, endY,
    width: 0.9 + unit(seed, slotIndex, 8) * 0.9, intensity: 0.66 + unit(seed, slotIndex, 9) * 0.30,
    tailLength: 0.16 + unit(seed, slotIndex, 10) * 0.12 });
}

export function resolveCelestialQuality(value, caps = {}) {
  if (value === 'eco' || value === 'balanced' || value === 'high') return value;
  if (caps.saveData || Number(caps.memoryHint) <= 2 || Number(caps.cpuHint) <= 4) return 'eco';
  if (Number(caps.dpr) >= 2 && Number(caps.memoryHint) >= 8 && Number(caps.cpuHint) >= 8) return 'high';
  return 'balanced';
}

function activeShootingStar(state) {
  const slotIndex = Math.floor(state.elapsedMs / SHOOTING_STAR_SLOT_MS);
  if (slotIndex !== state.scheduledSlot) {
    state.scheduledSlot = slotIndex; state.scheduledEvent = shootingStarForSlot(state.skySeed, slotIndex);
  }
  const event = state.scheduledEvent; const local = state.elapsedMs - slotIndex * SHOOTING_STAR_SLOT_MS;
  if (local < event.startOffsetMs || local >= event.startOffsetMs + event.durationMs) return null;
  const progress = Math.max(0, Math.min(1, (local - event.startOffsetMs) / event.durationMs));
  const visibility = smoothstep(0, 0.12, progress) * (1 - smoothstep(0.82, 1, progress));
  return Object.freeze({ ...event, progress, visibility });
}
function accrue(state, value) {
  const now = finiteTime(value, state.lastNow); const elapsed = Math.max(0, now - state.lastNow); state.lastNow = now;
  if (!isCelestialEligible(state) || elapsed <= 0) return;
  const applied = Math.min(elapsed, MAX_CELESTIAL_FRAME_MS);
  state.elapsedMs += applied;
  state.cloudPrimaryMs = (state.cloudPrimaryMs + applied) % CLOUD_PRIMARY_PERIOD_MS;
  state.cloudSecondaryMs = (state.cloudSecondaryMs + applied) % CLOUD_SECONDARY_PERIOD_MS;
  state.droppedMs += Math.max(0, elapsed - MAX_CELESTIAL_FRAME_MS);
}
function isCelestialEligible(state) { return !state.hidden && !state.reduced && (state.scene === 'home' || state.scene === 'world'); }
function unit(seed, index, stream) { return mix32((seed >>> 0) ^ Math.imul(index + 1, 0x9e3779b1) ^ Math.imul(stream + 17, 0x85ebca77)) / 4294967296; }
function mix32(input) { let value = input >>> 0; value ^= value >>> 16; value = Math.imul(value, 0x7feb352d) >>> 0;
  value ^= value >>> 15; value = Math.imul(value, 0x846ca68b) >>> 0; return (value ^ (value >>> 16)) >>> 0; }
function finiteSeed(value) { return Number.isFinite(value) ? Math.trunc(value) >>> 0 : 0; }
function finiteTime(value, fallback = 0) { return Number.isFinite(value) ? Math.max(0, value) : fallback; }
function validScene(value) { return ['home', 'world', 'evolution', 'trophies'].includes(value) ? value : 'home'; }
function radians(value, period, offset) { return (offset + value / period * Math.PI * 2) % (Math.PI * 2); }
function smoothstep(low, high, value) { const amount = Math.max(0, Math.min(1, (value - low) / (high - low))); return amount * amount * (3 - 2 * amount); }
