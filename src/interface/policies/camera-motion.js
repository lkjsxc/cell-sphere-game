/** Presentation-only release inertia and idle orbit around the existing free-orbit camera. */
import { rotate, rotateByAngularDelta } from '../../rendering/camera.js';

export const CAMERA_MOTION_DEFAULTS = Object.freeze({
  sampleCapacity: 6,
  sampleWindowMs: 120,
  releaseThreshold: 0.08,
  dampingHalfLifeMs: 600,
  stopSpeed: 0.025,
  idleDelayMs: 4500,
  idleOrbitSpeed: 0.022,
  maximumFrameMs: 100,
});

export function createCameraMotion(options = {}) {
  const config = Object.freeze({ ...CAMERA_MOTION_DEFAULTS, ...(options.config ?? {}) });
  const now = finiteNow(options.now);
  return {
    config,
    scene: options.scene ?? 'home',
    reduced: options.reduced === true,
    hidden: options.hidden === true,
    surfaceOpen: options.surfaceOpen === true,
    mode: options.hidden ? 'suspended' : options.surfaceOpen ? 'held' : options.reduced ? 'reduced' : 'idle-wait',
    idleUntil: now + config.idleDelayMs,
    velocityX: 0,
    velocityY: 0,
    releaseSpeed: 0,
    lastReleaseKind: null,
    releaseSampleCount: 0,
    inertiaElapsedMs: 0,
    inertiaDebtMs: 0,
    direct: false,
    cumulativeX: 0,
    cumulativeY: 0,
    samples: new Float64Array(config.sampleCapacity * 3),
    sampleCount: 0,
    sampleHighWater: 0,
    sampleTraceValid: true,
    lastActivityAt: now,
    orbitStartedAt: null,
  };
}

export function cameraMotionActivity(state, now) {
  stopAutomaticMotion(state);
  state.direct = false;
  state.lastActivityAt = finiteNow(now);
  state.idleUntil = state.lastActivityAt + state.config.idleDelayMs;
  state.mode = restingMode(state);
}

export function resetCameraMotion(state, now, scene = state.scene) {
  state.scene = scene;
  cameraMotionActivity(state, now);
}

export function setCameraMotionScene(state, scene, now) { resetCameraMotion(state, now, scene); }

export function setCameraMotionSurface(state, open, now) {
  state.surfaceOpen = open === true;
  cameraMotionActivity(state, now);
}

export function setCameraMotionHidden(state, hidden, now) {
  state.hidden = hidden === true;
  cameraMotionActivity(state, now);
}

export function setCameraMotionReduced(state, reduced, now) {
  state.reduced = reduced === true;
  cameraMotionActivity(state, now);
}

export function beginCameraDrag(state, now) {
  stopAutomaticMotion(state);
  state.direct = true;
  state.mode = 'direct';
  state.cumulativeX = 0;
  state.cumulativeY = 0;
  state.lastReleaseKind = null;
  state.releaseSampleCount = 0;
  const time = validTime(now); state.sampleTraceValid = time != null;
  if (state.sampleTraceValid) pushSample(state, time, 0, 0);
}

export function recordCameraDrag(state, dragX, dragY, now) {
  if (!state.direct) return false;
  if (!Number.isFinite(dragX) || !Number.isFinite(dragY)) {
    state.sampleTraceValid = false; state.sampleCount = 0; return false;
  }
  const time = validTime(now); const latestAt = sampleValue(state, state.sampleCount - 1, 0);
  const nextX = state.cumulativeX + dragX; const nextY = state.cumulativeY + dragY;
  if (!state.sampleTraceValid || time == null || (state.sampleCount > 0 && time < latestAt)
    || !Number.isFinite(nextX) || !Number.isFinite(nextY)) {
    state.sampleTraceValid = false; state.sampleCount = 0; return false;
  }
  state.cumulativeX = nextX;
  state.cumulativeY = nextY;
  discardOldSamples(state, time - state.config.sampleWindowMs);
  pushSample(state, time, state.cumulativeX, state.cumulativeY);
  return true;
}

export function endCameraDrag(state, now, kind = 'drag', observedNow = now) {
  const time = validTime(now); const observedTime = validTime(observedNow);
  const activityTime = observedTime ?? time ?? 0;
  state.direct = false;
  state.lastActivityAt = activityTime;
  state.idleUntil = activityTime + state.config.idleDelayMs;
  state.lastReleaseKind = kind;
  state.releaseSampleCount = state.sampleCount;
  if (kind !== 'drag' || time == null || !state.sampleTraceValid
    || state.reduced || state.hidden) {
    stopAutomaticMotion(state); state.mode = restingMode(state); return false;
  }
  discardOldSamples(state, time - state.config.sampleWindowMs);
  const latestAt = sampleValue(state, state.sampleCount - 1, 0);
  if (state.sampleCount < 2 || time < latestAt || time - latestAt > state.config.sampleWindowMs) {
    stopAutomaticMotion(state); state.mode = restingMode(state); return false;
  }
  const firstAt = sampleValue(state, 0, 0); const elapsedSeconds = (latestAt - firstAt) / 1000;
  if (!(elapsedSeconds > 0)) { stopAutomaticMotion(state); state.mode = restingMode(state); return false; }
  const velocityX = (sampleValue(state, state.sampleCount - 1, 1) - sampleValue(state, 0, 1)) / elapsedSeconds;
  const velocityY = (sampleValue(state, state.sampleCount - 1, 2) - sampleValue(state, 0, 2)) / elapsedSeconds;
  const releaseSpeed = Math.hypot(velocityX, velocityY);
  if (!Number.isFinite(velocityX) || !Number.isFinite(velocityY) || !Number.isFinite(releaseSpeed)
    || releaseSpeed < state.config.releaseThreshold) {
    stopAutomaticMotion(state); state.releaseSpeed = Number.isFinite(releaseSpeed) ? releaseSpeed : 0;
    state.mode = restingMode(state); return false;
  }
  state.velocityX = velocityX; state.velocityY = velocityY; state.releaseSpeed = releaseSpeed;
  state.inertiaElapsedMs = 0; state.inertiaDebtMs = 0; state.sampleCount = 0; state.sampleTraceValid = false;
  state.mode = 'inertia'; return true;
}

export function advanceCameraMotion(state, camera, dtMs, now) {
  const time = finiteNow(now); const suppliedElapsed = finiteElapsed(dtMs);
  if (state.hidden || state.reduced) { state.mode = restingMode(state); return false; }
  if (state.direct) return false;
  if (state.mode === 'inertia') {
    const nextDebt = state.inertiaDebtMs + suppliedElapsed;
    if (!Number.isFinite(nextDebt)) { stopInertia(state, time); return false; }
    state.inertiaDebtMs = nextDebt;
    const elapsed = Math.min(state.inertiaDebtMs, state.config.maximumFrameMs);
    if (!(elapsed > 0)) return false;
    state.inertiaDebtMs -= elapsed;
    const damping = Math.log(2) / state.config.dampingHalfLifeMs;
    const decay = Math.exp(-damping * elapsed);
    const integratedSeconds = (1 - decay) / damping / 1000;
    rotateByAngularDelta(camera, state.velocityX * integratedSeconds, state.velocityY * integratedSeconds);
    state.velocityX *= decay; state.velocityY *= decay; state.inertiaElapsedMs += elapsed;
    if (Math.hypot(state.velocityX, state.velocityY) < state.config.stopSpeed) stopInertia(state, time);
    return true;
  }
  if (state.surfaceOpen) { state.mode = 'held'; return false; }
  const elapsed = Math.min(suppliedElapsed, state.config.maximumFrameMs);
  if (!(elapsed > 0)) return false;
  if (state.mode !== 'orbit' && automaticOrbitAllowed(state) && time >= state.idleUntil) {
    state.mode = 'orbit'; state.orbitStartedAt = time;
  }
  if (state.mode !== 'orbit') return false;
  rotate(camera, state.config.idleOrbitSpeed * elapsed / 1000, 0);
  return true;
}

export function cameraMotionSnapshot(state) {
  return Object.freeze({ mode: state.mode, scene: state.scene, reduced: state.reduced, hidden: state.hidden,
    surfaceOpen: state.surfaceOpen, direct: state.direct, sampleCount: state.sampleCount,
    sampleHighWater: state.sampleHighWater, sampleTraceValid: state.sampleTraceValid,
    speed: Math.hypot(state.velocityX, state.velocityY),
    releaseSpeed: state.releaseSpeed,
    lastReleaseKind: state.lastReleaseKind, releaseSampleCount: state.releaseSampleCount,
    velocityX: state.velocityX, velocityY: state.velocityY,
    inertiaElapsedMs: state.inertiaElapsedMs, inertiaDebtMs: state.inertiaDebtMs,
    idleUntil: state.idleUntil, orbitStartedAt: state.orbitStartedAt });
}

function automaticOrbitAllowed(state) { return state.scene === 'home' || state.scene === 'world'; }
function restingMode(state) { return state.hidden ? 'suspended' : state.surfaceOpen ? 'held' : state.reduced ? 'reduced' : 'idle-wait'; }
function stopAutomaticMotion(state) {
  state.velocityX = 0; state.velocityY = 0; state.inertiaElapsedMs = 0; state.inertiaDebtMs = 0;
  state.sampleCount = 0; state.sampleTraceValid = false;
  state.releaseSpeed = 0;
  state.orbitStartedAt = null;
}
function stopInertia(state, now) {
  state.velocityX = 0; state.velocityY = 0;
  state.inertiaElapsedMs = 0; state.inertiaDebtMs = 0;
  state.idleUntil = finiteNow(now) + state.config.idleDelayMs; state.mode = restingMode(state);
}
function discardOldSamples(state, cutoff) {
  while (state.sampleCount > 0 && sampleValue(state, 0, 0) < cutoff) shiftSamples(state);
}
function pushSample(state, time, x, y) {
  if (state.sampleCount >= state.config.sampleCapacity) shiftSamples(state);
  const offset = state.sampleCount * 3; state.samples[offset] = time; state.samples[offset + 1] = x; state.samples[offset + 2] = y;
  state.sampleCount++; state.sampleHighWater = Math.max(state.sampleHighWater, state.sampleCount);
}
function shiftSamples(state) {
  for (let index = 1; index < state.sampleCount; index++) {
    const from = index * 3; const to = from - 3;
    state.samples[to] = state.samples[from]; state.samples[to + 1] = state.samples[from + 1]; state.samples[to + 2] = state.samples[from + 2];
  }
  state.sampleCount = Math.max(0, state.sampleCount - 1);
}
function sampleValue(state, sample, field) { return sample >= 0 ? state.samples[sample * 3 + field] : NaN; }
function validTime(value) { return Number.isFinite(value) && value >= 0 ? value : null; }
function finiteNow(value) { return Number.isFinite(value) ? Math.max(0, value) : 0; }
function finiteElapsed(value) { return Number.isFinite(value) ? Math.max(0, value) : 0; }
