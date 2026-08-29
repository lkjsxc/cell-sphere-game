/** Presentation motion is faithful, naturally damped, constant-space, and outside authority. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCamera, rotate } from '../../../src/rendering/camera.js';
import {
  advanceCameraMotion,
  beginCameraDrag,
  CAMERA_MOTION_DEFAULTS,
  cameraMotionActivity,
  cameraMotionSnapshot,
  createCameraMotion,
  endCameraDrag,
  recordCameraDrag,
  resetCameraMotion,
  setCameraMotionHidden,
  setCameraMotionReduced,
  setCameraMotionScene,
  setCameraMotionSurface,
} from '../../../src/interface/policies/camera-motion.js';
import {
  createTrustedInteractionGuard,
  normalizeTrustedInteraction,
  TRUSTED_INTERACTION_EVENTS,
} from '../../../src/interface/policies/trusted-interaction.js';

const TRACE = Object.freeze({
  strong: Object.freeze({ steps: 5, intervalMs: 16, dragX: 0.66 / 5, dragY: 0.26 / 5 }),
  medium: Object.freeze({ steps: 5, intervalMs: 20, dragX: 0.13 / 5, dragY: 0.055 / 5 }),
  slow: Object.freeze({ steps: 12, intervalMs: 20, dragX: 0.005, dragY: 0.002 }),
});
const REFERENCE_STRONG_SPEED = 8.86707;

test('valid measured release vectors transfer directly without amplification or saturation', () => {
  assert.deepEqual(CAMERA_MOTION_DEFAULTS, {
    sampleCapacity: 6, sampleWindowMs: 120, releaseThreshold: 0.3,
    dampingHalfLifeMs: 600, stopSpeed: 0.025, idleDelayMs: 4500,
    idleOrbitSpeed: 0.022, maximumFrameMs: 100,
  });
  for (const speed of [0.4, 1, 2, 4, 8, 16, 32]) {
    const outcome = releaseAtSpeed(speed);
    assert.equal(outcome.entered, true);
    assert.ok(Math.abs(outcome.release.velocityX - speed * 0.8) <= 1e-12, `${speed} x transfer`);
    assert.ok(Math.abs(outcome.release.velocityY + speed * 0.6) <= 1e-12, `${speed} y transfer`);
    assert.ok(Math.abs(outcome.release.measuredReleaseSpeed - speed) <= 1e-12, `${speed} magnitude`);
    assert.ok(Math.abs(outcome.release.speed - speed) <= 1e-12, `${speed} initial speed`);
  }
  const lower = releaseAtSpeed(8).release; const higher = releaseAtSpeed(16).release;
  assert.ok(Math.abs(higher.speed - lower.speed * 2) <= 1e-12);
  assert.ok(Math.abs(higher.velocityX - lower.velocityX * 2) <= 1e-12);
  assert.ok(Math.abs(higher.velocityY - lower.velocityY * 2) <= 1e-12);
});

test('release sampling stays recent, finite, and fixed-capacity', () => {
  const state = createCameraMotion({ now: 0, scene: 'world' }); beginCameraDrag(state, 0);
  for (let index = 1; index <= 20; index++) recordCameraDrag(state, 0.08, -0.04, index * 10);
  const sampled = cameraMotionSnapshot(state);
  assert.equal(sampled.sampleCount, 6); assert.equal(sampled.sampleHighWater, 6);
  assert.equal(endCameraDrag(state, 200, 'drag'), true);
  const release = cameraMotionSnapshot(state);
  assert.equal(release.mode, 'inertia'); assert.equal(release.speed, release.measuredReleaseSpeed);
  assert.ok(Number.isFinite(release.velocityX) && Number.isFinite(release.velocityY));

  const stale = createCameraMotion({ now: 0, scene: 'world' }); beginCameraDrag(stale, 0);
  recordCameraDrag(stale, 1, 0, 500); assert.equal(endCameraDrag(stale, 500, 'drag'), false,
    'one movement after a long hold must not use the gesture start as a velocity sample');
  assert.equal(cameraMotionSnapshot(stale).measuredReleaseSpeed, 0);

  const malformed = createCameraMotion({ now: 0, scene: 'world' }); beginCameraDrag(malformed, 0);
  assert.equal(recordCameraDrag(malformed, .2, 0, 10), true);
  assert.equal(recordCameraDrag(malformed, NaN, 1, 20), false);
  assert.equal(recordCameraDrag(malformed, .2, 0, 30), false);
  assert.equal(endCameraDrag(malformed, 40, 'drag'), false);
  const malformedTime = createCameraMotion({ now: 0, scene: 'world' }); beginCameraDrag(malformedTime, 0);
  assert.equal(recordCameraDrag(malformedTime, 1, 0, Infinity), false);
  assert.equal(recordCameraDrag(malformedTime, 1, 0, 50), false);
  assert.equal(endCameraDrag(malformedTime, 50, 'drag'), false);
  const reversedTime = createCameraMotion({ now: 0, scene: 'world' }); beginCameraDrag(reversedTime, 0);
  assert.equal(recordCameraDrag(reversedTime, .2, 0, 50), true);
  assert.equal(recordCameraDrag(reversedTime, .2, 0, 40), false);
  assert.equal(endCameraDrag(reversedTime, 60, 'drag'), false);
  const reversedRelease = createCameraMotion({ now: 0, scene: 'world' }); beginCameraDrag(reversedRelease, 0);
  assert.equal(recordCameraDrag(reversedRelease, .2, 0, 50), true);
  assert.equal(endCameraDrag(reversedRelease, 40, 'drag'), false);
  const overflow = createCameraMotion({ now: 0, scene: 'world' }); beginCameraDrag(overflow, 0);
  recordCameraDrag(overflow, Number.MAX_VALUE, Number.MAX_VALUE, 1);
  assert.equal(endCameraDrag(overflow, 1, 'drag'), false); assert.equal(cameraMotionSnapshot(overflow).speed, 0);
  assert.doesNotThrow(() => advanceCameraMotion(malformed, createCamera(), Infinity, NaN));
});

test('thresholded slow inspection stops while stronger releases carry proportionally', () => {
  for (const speed of [0, 0.3, NaN, Infinity, -Infinity]) {
    const state = createCameraMotion({ now: 0, scene: 'world' }); beginCameraDrag(state, 0);
    if (Number.isFinite(speed)) recordCameraDrag(state, speed * 0.1, 0, 100);
    assert.equal(endCameraDrag(state, 100, 'drag'), false, String(speed));
  }

  const strong = integrateTrace(TRACE.strong, 60);
  assert.equal(strong.entered, true); assert.ok(strong.release.measuredReleaseSpeed > 8.8);
  assert.ok(strong.turns >= 1.20 && strong.turns <= 1.23, `strong travel ${strong.turns} turns`);
  const medium = integrateTrace(TRACE.medium, 60);
  assert.equal(medium.entered, true);
  assert.ok(medium.release.measuredReleaseSpeed >= 1.1 && medium.release.measuredReleaseSpeed <= 1.5);
  assert.ok(medium.turns >= 0.18 && medium.turns <= 0.21, `medium travel ${medium.turns} turns`);
  assert.ok(medium.turns < strong.turns);

  const slow = integrateTrace(TRACE.slow, 60);
  assert.equal(slow.entered, false); assert.ok(slow.directTravel > 0);
  assert.ok(slow.release.measuredReleaseSpeed < CAMERA_MOTION_DEFAULTS.releaseThreshold);
  assert.equal(slow.travelRadians, 0); assert.equal(slow.durationMs, 0);
  assert.equal(slow.final.mode, 'idle-wait'); assert.ok(slow.final.idleUntil > slow.releaseAt);
});

test('high finite releases outlive five seconds and stop only at the natural threshold', () => {
  const high = integrateSpeed(32, 30);
  assert.equal(high.entered, true); assert.ok(high.afterFiveSeconds.speed > CAMERA_MOTION_DEFAULTS.stopSpeed);
  assert.equal(high.afterFiveSeconds.mode, 'inertia');
  assert.ok(Math.abs(high.durationMs - 6193.16) <= 1000 / 30 + 25, `duration ${high.durationMs}`);
  assert.ok(Math.abs(high.turns - 4.40511) / 4.40511 <= 0.005, `travel ${high.turns}`);
  assert.ok(high.basisError < 1e-12);
  for (const vector of [high.camera.direction, high.camera.right, high.camera.up]) assert.ok(vector.every(Number.isFinite));

  const reference = integrateSpeed(REFERENCE_STRONG_SPEED, 60);
  assert.ok(Math.abs(reference.durationMs - 5082.23) <= 1000 / 30 + 25, `duration ${reference.durationMs}`);
  assert.ok(Math.abs(reference.turns - 1.21815) / 1.21815 <= 0.005, `travel ${reference.turns}`);
});

test('natural damping agrees across 30, 60, 120, and 144 Hz', () => {
  for (const speed of [REFERENCE_STRONG_SPEED, 32]) {
    const outcomes = [30, 60, 120, 144].map((hz) => integrateSpeed(speed, hz)); const reference = outcomes[1];
    for (const outcome of outcomes) {
      assert.ok(Math.abs(outcome.turns - reference.turns) / reference.turns <= 0.005,
        `travel drift at ${speed} rad/s and ${outcome.hz} Hz`);
      assert.ok(Math.abs(outcome.durationMs - reference.durationMs) <= 1000 / 30 + 25,
        `duration drift at ${speed} rad/s and ${outcome.hz} Hz`);
      for (const name of ['direction', 'right', 'up']) {
        const degrees = vectorAngle(outcome.camera[name], reference.camera[name]) * 180 / Math.PI;
        assert.ok(degrees <= 1, `${name} drift at ${outcome.hz} Hz: ${degrees} degrees`);
      }
    }
  }
});

test('visible foreground elapsed debt drains through bounded integration slices', () => {
  const outcome = releaseAtSpeed(4); const camera = createCamera();
  assert.equal(advanceCameraMotion(outcome.state, camera, 250, 350), true);
  let snapshot = cameraMotionSnapshot(outcome.state);
  assert.equal(snapshot.inertiaElapsedMs, 100); assert.equal(snapshot.inertiaDebtMs, 150);
  assert.equal(advanceCameraMotion(outcome.state, camera, 0, 350), true);
  snapshot = cameraMotionSnapshot(outcome.state);
  assert.equal(snapshot.inertiaElapsedMs, 200); assert.equal(snapshot.inertiaDebtMs, 50);
  assert.equal(advanceCameraMotion(outcome.state, camera, 0, 350), true);
  snapshot = cameraMotionSnapshot(outcome.state);
  assert.equal(snapshot.inertiaElapsedMs, 250); assert.equal(snapshot.inertiaDebtMs, 0);
  setCameraMotionHidden(outcome.state, true, 400);
  assert.equal(cameraMotionSnapshot(outcome.state).inertiaDebtMs, 0);
});

test('queued handler observation preserves release velocity, path, and fresh idle deadline', () => {
  const outcomes = [0, 150, 350].map((delay) => integrateTrace(TRACE.medium, 60, delay)); const reference = outcomes[0];
  for (const [index, outcome] of outcomes.entries()) {
    const delay = [0, 150, 350][index];
    assert.ok(Math.abs(outcome.release.measuredReleaseSpeed - reference.release.measuredReleaseSpeed) <= 1e-12);
    assert.ok(Math.abs(outcome.turns - reference.turns) / reference.turns <= 0.005);
    assert.equal(outcome.release.idleUntil, outcome.releaseAt + delay + 4500);
  }
});

test('tap, pinch, cancellation, reduced motion, and lifecycle holds clear release motion', () => {
  for (const kind of ['tap', 'pinch', 'cancel']) {
    const state = preparedState(TRACE.strong); assert.equal(endCameraDrag(state, releaseAt(TRACE.strong), kind), false);
    assert.notEqual(cameraMotionSnapshot(state).mode, 'inertia'); assert.equal(cameraMotionSnapshot(state).speed, 0);
  }
  const reduced = preparedState(TRACE.strong); setCameraMotionReduced(reduced, true, 50);
  assert.equal(endCameraDrag(reduced, releaseAt(TRACE.strong), 'drag'), false);
  assert.equal(cameraMotionSnapshot(reduced).mode, 'reduced');
  const held = preparedState(TRACE.strong); setCameraMotionSurface(held, true, 50);
  assert.equal(endCameraDrag(held, releaseAt(TRACE.strong), 'drag'), false);
  assert.equal(cameraMotionSnapshot(held).mode, 'held');

  for (const source of ['pointerdown', 'wheel', 'keyboard', 'focus', 'focus-framing']) {
    const outcome = integrateTrace(TRACE.strong, 60, 0, 2);
    const before = outcome.camera.direction.slice(); cameraMotionActivity(outcome.state, 200);
    assert.equal(cameraMotionSnapshot(outcome.state).speed, 0, `${source} retained speed`);
    advanceCameraMotion(outcome.state, outcome.camera, 100, 300);
    assert.ok(vectorAngle(before, outcome.camera.direction) < 1e-12, `${source} retained motion`);
  }

  const hidden = integrateTrace(TRACE.strong, 60, 0, 2); setCameraMotionHidden(hidden.state, true, 200);
  assert.equal(cameraMotionSnapshot(hidden.state).mode, 'suspended'); assert.equal(cameraMotionSnapshot(hidden.state).speed, 0);
  const hiddenDirection = hidden.camera.direction.slice(); advanceCameraMotion(hidden.state, hidden.camera, 100, 300);
  assert.ok(vectorAngle(hiddenDirection, hidden.camera.direction) < 1e-12);
  setCameraMotionHidden(hidden.state, false, 500); assert.equal(cameraMotionSnapshot(hidden.state).idleUntil, 5000);
  const scene = integrateTrace(TRACE.strong, 60, 0, 2); setCameraMotionScene(scene.state, 'evolution', 200);
  const sceneDirection = scene.camera.direction.slice(); advanceCameraMotion(scene.state, scene.camera, 100, 300);
  assert.equal(cameraMotionSnapshot(scene.state).speed, 0); assert.ok(vectorAngle(sceneDirection, scene.camera.direction) < 1e-12);
  const replaced = integrateTrace(TRACE.strong, 60, 0, 2); resetCameraMotion(replaced.state, 200, 'world');
  const replacedDirection = replaced.camera.direction.slice(); advanceCameraMotion(replaced.state, replaced.camera, 100, 300);
  assert.equal(cameraMotionSnapshot(replaced.state).speed, 0); assert.ok(vectorAngle(replacedDirection, replaced.camera.direction) < 1e-12);
});

test('idle orbit keeps its calm delay and obeys scene, surface, hidden, and reduced holds', () => {
  const camera = createCamera(); const state = createCameraMotion({ now: 100, scene: 'home' }); const before = camera.direction.slice();
  assert.equal(advanceCameraMotion(state, camera, 100, 4599), false);
  assert.equal(advanceCameraMotion(state, camera, 16, 4600), true); assert.equal(cameraMotionSnapshot(state).mode, 'orbit');
  assert.ok(vectorAngle(before, camera.direction) > 0);
  cameraMotionActivity(state, 4700); assert.equal(cameraMotionSnapshot(state).mode, 'idle-wait');
  assert.equal(advanceCameraMotion(state, camera, 100, 9199), false);
  setCameraMotionSurface(state, true, 9200); assert.equal(cameraMotionSnapshot(state).mode, 'held');
  assert.equal(advanceCameraMotion(state, camera, 100, 20_000), false);
  setCameraMotionSurface(state, false, 20_000); assert.equal(cameraMotionSnapshot(state).idleUntil, 24_500);
  setCameraMotionHidden(state, true, 20_100); assert.equal(cameraMotionSnapshot(state).mode, 'suspended');
  setCameraMotionHidden(state, false, 30_000); assert.equal(cameraMotionSnapshot(state).idleUntil, 34_500);
  setCameraMotionReduced(state, true, 31_000); assert.equal(cameraMotionSnapshot(state).mode, 'reduced');
  assert.equal(advanceCameraMotion(state, camera, 100, 40_000), false);
  setCameraMotionReduced(state, false, 40_000); setCameraMotionScene(state, 'evolution', 40_000);
  assert.equal(advanceCameraMotion(state, camera, 100, 50_000), false);
  setCameraMotionScene(state, 'trophies', 50_000); assert.equal(advanceCameraMotion(state, camera, 100, 60_000), false);
});

test('repeated high releases retain fixed storage and an orthonormal allocation-stable frame', () => {
  const camera = createCamera(); const state = createCameraMotion({ now: 0, scene: 'world' }); let now = 0;
  for (let cycle = 0; cycle < 100; cycle++) {
    beginCameraDrag(state, now);
    for (let step = 1; step <= TRACE.strong.steps; step++) {
      now += TRACE.strong.intervalMs; rotate(camera, TRACE.strong.dragX, TRACE.strong.dragY);
      recordCameraDrag(state, TRACE.strong.dragX, TRACE.strong.dragY, now);
    }
    assert.equal(endCameraDrag(state, now, 'drag', now), true);
    const basisVectors = [camera.direction, camera.right, camera.up];
    for (let step = 0; step < 10; step++) { now += 16; advanceCameraMotion(state, camera, 16, now); }
    assert.equal(camera.direction, basisVectors[0]); assert.equal(camera.right, basisVectors[1]); assert.equal(camera.up, basisVectors[2]);
    cameraMotionActivity(state, now); assert.ok(cameraMotionSnapshot(state).sampleHighWater <= CAMERA_MOTION_DEFAULTS.sampleCapacity);
  }
  for (let step = 0; step < 9000; step++) { now += 16; advanceCameraMotion(state, camera, 16, now); }
  assert.ok(basisError(camera) < 1e-12);
});

test('one trusted-interaction guard normalizes events and ignores scoped focus', () => {
  assert.deepEqual(TRUSTED_INTERACTION_EVENTS,
    ['pointerdown', 'touchstart', 'wheel', 'keydown', 'click', 'focusin', 'input', 'change']);
  assert.equal(normalizeTrustedInteraction({ isTrusted: false, type: 'click' }), null);
  assert.equal(normalizeTrustedInteraction({ isTrusted: true, type: 'pointerdown', pointerType: 'touch' }), 'touch');
  assert.equal(normalizeTrustedInteraction({ isTrusted: true, type: 'pointerdown', pointerType: 'mouse' }), 'pointer');
  assert.equal(normalizeTrustedInteraction({ isTrusted: true, type: 'keydown', key: 'Enter' }), 'keyboard');
  assert.equal(normalizeTrustedInteraction({ isTrusted: true, type: 'focusin' }), 'focus');
  const listeners = new Map(); const target = {
    addEventListener(type, listener) { listeners.set(type, listener); }, removeEventListener(type) { listeners.delete(type); },
  };
  const received = []; const guard = createTrustedInteractionGuard(target, (type) => received.push(type));
  guard.runProgrammaticFocus(() => listeners.get('focusin')({ isTrusted: true, type: 'focusin' }));
  const touchTarget = {};
  listeners.get('pointerdown')({ isTrusted: true, type: 'pointerdown', pointerType: 'touch', target: touchTarget, timeStamp: 10 });
  listeners.get('touchstart')({ isTrusted: true, type: 'touchstart', target: touchTarget, timeStamp: 11 });
  listeners.get('wheel')({ isTrusted: true, type: 'wheel' });
  assert.deepEqual(received, ['touch', 'wheel']); assert.equal(guard.listenerCount, 8);
  guard.dispose(); assert.equal(guard.listenerCount, 0); assert.equal(listeners.size, 0);
});

function preparedState(trace) {
  const state = createCameraMotion({ now: 0, scene: 'world' }); beginCameraDrag(state, 0);
  for (let step = 1; step <= trace.steps; step++) recordCameraDrag(state, trace.dragX, trace.dragY, step * trace.intervalMs);
  return state;
}
function releaseAtSpeed(speed) {
  const state = createCameraMotion({ now: 0, scene: 'world' }); beginCameraDrag(state, 0);
  recordCameraDrag(state, speed * 0.08, -speed * 0.06, 100);
  const entered = endCameraDrag(state, 100, 'drag', 100);
  return { state, entered, release: cameraMotionSnapshot(state) };
}
function integrateSpeed(speed, hz) {
  const trace = { steps: 1, intervalMs: 100, dragX: speed * 0.1, dragY: 0 };
  return integrateTrace(trace, hz);
}
function integrateTrace(trace, hz, observedDelay = 0, maximumSteps = 4000) {
  const state = createCameraMotion({ now: 0, scene: 'world' }); const camera = createCamera();
  const initialDirection = camera.direction.slice(); beginCameraDrag(state, 0);
  for (let step = 1; step <= trace.steps; step++) {
    rotate(camera, trace.dragX, trace.dragY); recordCameraDrag(state, trace.dragX, trace.dragY, step * trace.intervalMs);
  }
  const directTravel = vectorAngle(initialDirection, camera.direction); const at = releaseAt(trace);
  const entered = endCameraDrag(state, at, 'drag', at + observedDelay); const release = cameraMotionSnapshot(state);
  let travelRadians = 0; let durationMs = 0; let now = at + observedDelay; let steps = 0; let afterFiveSeconds = null;
  const frameMs = 1000 / hz; let previous = camera.direction.slice();
  while (cameraMotionSnapshot(state).mode === 'inertia' && steps++ < maximumSteps) {
    now += frameMs; durationMs += frameMs; advanceCameraMotion(state, camera, frameMs, now);
    travelRadians += vectorAngle(previous, camera.direction); previous = camera.direction.slice();
    if (!afterFiveSeconds && durationMs >= 5000) afterFiveSeconds = cameraMotionSnapshot(state);
  }
  return { hz, state, camera, entered, releaseAt: at, release, final: cameraMotionSnapshot(state), directTravel,
    travelRadians, turns: travelRadians / (2 * Math.PI), durationMs, afterFiveSeconds, basisError: basisError(camera) };
}
function releaseAt(trace) { return trace.steps * trace.intervalMs; }
function basisError(camera) {
  return Math.max(...[camera.direction, camera.right, camera.up].map((value) => Math.abs(Math.hypot(...value) - 1)),
    Math.abs(dot(camera.direction, camera.right)), Math.abs(dot(camera.direction, camera.up)), Math.abs(dot(camera.right, camera.up)));
}
function dot(a, b) { return a.reduce((sum, value, index) => sum + value * b[index], 0); }
function vectorAngle(a, b) { return Math.acos(Math.max(-1, Math.min(1, dot(a, b)))); }
