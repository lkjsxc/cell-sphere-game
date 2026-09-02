/** Bounded animation-time authority for stars, clouds, and shooting stars. */
import { createCloudField, validCloudField } from '../../rendering/cloud-field.js';
import { MAX_SKY_STARS, SKY_STAR_STRIDE } from '../../rendering/celestial-constants.js';

export const CELESTIAL_SKY_SEED = 0x6e5a91c3;
export const SHOOTING_STAR_SLOT_MS = 300_000;
export const CLOUD_WRAP_MS = 3_000_000;
export const MAX_CELESTIAL_FRAME_MS = 100;
export const MAX_STARS = MAX_SKY_STARS;
export const STAR_BUDGETS = Object.freeze({ eco: 48, balanced: 72, high: 96 });

const STAR_CATALOG = createStarCatalog(CELESTIAL_SKY_SEED);

export function createCelestialPresentation(options = {}) {
  const now = finiteTime(options.now);
  const state = { lastNow: now, elapsedMs: 0, droppedMs: 0, scene: validScene(options.scene),
    hidden: options.hidden === true, reduced: options.reduced === true,
    quality: resolveCelestialQuality(options.quality, options.caps), skySeed: CELESTIAL_SKY_SEED,
    cloudFactory: typeof options.cloudFactory === 'function' ? options.cloudFactory : createCloudField,
    stars: STAR_CATALOG, visualSeed: null, cloudSeed: null, cloud: null, cloudsEnabled: false,
    cloudError: null, cloudGenerations: 0, scheduledSlot: -1, scheduledEvent: null, frames: 0 };
  setCelestialVisualSeed(state, options.visualSeed, options.cloudsEnabled !== false);
  return state;
}

export function advanceCelestialPresentation(state, now) {
  accrue(state, now); state.frames++; return celestialProjection(state);
}

export function celestialProjection(state) {
  const eligible = isCelestialEligible(state); const event = eligible ? activeShootingStar(state) : null;
  return Object.freeze({ version: 1, eligible, eligibleTimeMs: state.elapsedMs,
    cloudPhase: wrap01(state.elapsedMs / CLOUD_WRAP_MS), cloudEnabled: state.cloudsEnabled,
    cloudSeed: state.cloudSeed, cloud: state.cloud, skySeed: state.skySeed, stars: state.stars,
    starCount: STAR_BUDGETS[state.quality], quality: state.quality, shootingStar: event });
}

export function celestialPresentationSnapshot(state) {
  return Object.freeze({ scene: state.scene, hidden: state.hidden, reduced: state.reduced,
    eligible: isCelestialEligible(state), eligibleTimeMs: state.elapsedMs, droppedMs: state.droppedMs,
    quality: state.quality, starCount: STAR_BUDGETS[state.quality], skySeed: state.skySeed,
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
  state.elapsedMs += Math.min(elapsed, MAX_CELESTIAL_FRAME_MS);
  state.droppedMs += Math.max(0, elapsed - MAX_CELESTIAL_FRAME_MS);
}
function isCelestialEligible(state) { return !state.hidden && !state.reduced && (state.scene === 'home' || state.scene === 'world'); }
function createStarCatalog(seed) {
  const values = new Float32Array(MAX_STARS * SKY_STAR_STRIDE);
  for (let star = 0; star < MAX_STARS; star++) {
    values[star * SKY_STAR_STRIDE] = 0.018 + unit(seed, star, 20) * 0.964;
    values[star * SKY_STAR_STRIDE + 1] = 0.018 + unit(seed, star, 21) * 0.964;
    values[star * SKY_STAR_STRIDE + 2] = 0.55 + unit(seed, star, 22) * 1.05;
    values[star * SKY_STAR_STRIDE + 3] = Math.min(1, 0.34 + unit(seed, star, 23) * 0.54 + (star % 13 === 0 ? 0.12 : 0));
  }
  return values;
}
function unit(seed, index, stream) { return mix32((seed >>> 0) ^ Math.imul(index + 1, 0x9e3779b1) ^ Math.imul(stream + 17, 0x85ebca77)) / 4294967296; }
function mix32(input) { let value = input >>> 0; value ^= value >>> 16; value = Math.imul(value, 0x7feb352d) >>> 0;
  value ^= value >>> 15; value = Math.imul(value, 0x846ca68b) >>> 0; return (value ^ (value >>> 16)) >>> 0; }
function finiteSeed(value) { return Number.isFinite(value) ? Math.trunc(value) >>> 0 : 0; }
function finiteTime(value, fallback = 0) { return Number.isFinite(value) ? Math.max(0, value) : fallback; }
function validScene(value) { return ['home', 'world', 'evolution', 'trophies'].includes(value) ? value : 'home'; }
function wrap01(value) { return value - Math.floor(value); }
function smoothstep(low, high, value) { const amount = Math.max(0, Math.min(1, (value - low) / (high - low))); return amount * amount * (3 - 2 * amount); }
