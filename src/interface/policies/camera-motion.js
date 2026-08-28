/** Presentation-only release inertia and idle orbit around the existing free-orbit camera. */
import { rotate } from '../../rendering/camera.js';

export const CAMERA_MOTION_DEFAULTS = Object.freeze({
  sampleCapacity: 6,
  sampleWindowMs: 120,
  maximumAngularSpeed: 2.4,
  minimumReleaseSpeed: 0.08,
  dampingHalfLifeMs: 360,
  stopSpeed: 0.015,
  maximumInertiaMs: 2500,
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
    inertiaElapsedMs: 0,
    direct: false,
    cumulativeX: 0,
    cumulativeY: 0,
    samples: new Float64Array(config.sampleCapacity * 3),
    sampleCount: 0,
    sampleHighWater: 0,
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
  pushSample(state, finiteNow(now), 0, 0);
}

export function recordCameraDrag(state, dragX, dragY, now) {
  if (!state.direct || !Number.isFinite(dragX) || !Number.isFinite(dragY)) return false;
  state.cumulativeX += dragX;
  state.cumulativeY += dragY;
  const time = finiteNow(now);
  discardOldSamples(state, time - state.config.sampleWindowMs);
  pushSample(state, time, state.cumulativeX, state.cumulativeY);
  return true;
}

export function endCameraDrag(state, now, kind = 'drag', observedNow = now) {
  const time = finiteNow(now); const activityTime = finiteNow(observedNow);
  state.direct = false;
  state.lastActivityAt = activityTime;
  state.idleUntil = activityTime + state.config.idleDelayMs;
  if (kind !== 'drag' || state.reduced || state.hidden || state.surfaceOpen) {
    stopAutomaticMotion(state); state.mode = restingMode(state); return false;
  }
  discardOldSamples(state, time - state.config.sampleWindowMs);
  const latestAt = sampleValue(state, state.sampleCount - 1, 0);
  if (state.sampleCount < 2 || time - latestAt > state.config.sampleWindowMs) {
    stopAutomaticMotion(state); state.mode = restingMode(state); return false;
  }
  const firstAt = sampleValue(state, 0, 0); const elapsedSeconds = (latestAt - firstAt) / 1000;
  if (!(elapsedSeconds > 0)) { stopAutomaticMotion(state); state.mode = restingMode(state); return false; }
  let velocityX = (sampleValue(state, state.sampleCount - 1, 1) - sampleValue(state, 0, 1)) / elapsedSeconds;
  let velocityY = (sampleValue(state, state.sampleCount - 1, 2) - sampleValue(state, 0, 2)) / elapsedSeconds;
  const magnitude = Math.hypot(velocityX, velocityY);
  if (!Number.isFinite(magnitude) || magnitude < state.config.minimumReleaseSpeed) {
    stopAutomaticMotion(state); state.mode = restingMode(state); return false;
  }
  if (magnitude > state.config.maximumAngularSpeed) {
    const scale = state.config.maximumAngularSpeed / magnitude; velocityX *= scale; velocityY *= scale;
    // A normalized pair can round a few ulps back outside the public cap. Nudge
    // only that exceptional result inward so both integration and diagnostics
    // preserve the strict maximum-speed invariant.
    const roundedMagnitude = Math.hypot(velocityX, velocityY);
    if (roundedMagnitude > state.config.maximumAngularSpeed) {
      const inwardMaximum = Math.max(0, state.config.maximumAngularSpeed
        - Number.EPSILON * Math.max(1, state.config.maximumAngularSpeed) * 8);
      const correction = inwardMaximum / roundedMagnitude; velocityX *= correction; velocityY *= correction;
    }
  }
  state.velocityX = velocityX; state.velocityY = velocityY; state.inertiaElapsedMs = 0; state.sampleCount = 0;
  state.mode = 'inertia'; return true;
}

export function advanceCameraMotion(state, camera, dtMs, now) {
  const time = finiteNow(now); const elapsed = finiteDelta(dtMs, state.config.maximumFrameMs);
  if (state.hidden || state.surfaceOpen || state.reduced) { state.mode = restingMode(state); return false; }
  if (state.direct || elapsed <= 0) return false;
  if (state.mode === 'inertia') {
    const remaining = Math.max(0, state.config.maximumInertiaMs - state.inertiaElapsedMs);
    const stepMs = Math.min(elapsed, remaining);
    if (stepMs <= 0) { stopInertia(state); return false; }
    const damping = Math.log(2) / state.config.dampingHalfLifeMs;
    const decay = Math.exp(-damping * stepMs);
    const integratedSeconds = (1 - decay) / damping / 1000;
    rotate(camera, state.velocityX * integratedSeconds, state.velocityY * integratedSeconds);
    state.velocityX *= decay; state.velocityY *= decay; state.inertiaElapsedMs += stepMs;
    if (Math.hypot(state.velocityX, state.velocityY) < state.config.stopSpeed
      || state.inertiaElapsedMs >= state.config.maximumInertiaMs) stopInertia(state);
    return true;
  }
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
    sampleHighWater: state.sampleHighWater, speed: Math.hypot(state.velocityX, state.velocityY),
    velocityX: state.velocityX, velocityY: state.velocityY, inertiaElapsedMs: state.inertiaElapsedMs,
    idleUntil: state.idleUntil, orbitStartedAt: state.orbitStartedAt });
}

function automaticOrbitAllowed(state) { return state.scene === 'home' || state.scene === 'world'; }
function restingMode(state) { return state.hidden ? 'suspended' : state.surfaceOpen ? 'held' : state.reduced ? 'reduced' : 'idle-wait'; }
function stopAutomaticMotion(state) {
  state.velocityX = 0; state.velocityY = 0; state.inertiaElapsedMs = 0; state.sampleCount = 0;
  state.orbitStartedAt = null;
}
function stopInertia(state) {
  state.velocityX = 0; state.velocityY = 0; state.inertiaElapsedMs = 0; state.mode = 'idle-wait';
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
function finiteNow(value) { return Number.isFinite(value) ? Math.max(0, value) : 0; }
function finiteDelta(value, maximum) { return Number.isFinite(value) ? Math.max(0, Math.min(maximum, value)) : 0; }
