/** Presentation motion remains bounded, frame-rate independent, and outside authority. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCamera } from '../../../src/rendering/camera.js';
import {
  advanceCameraMotion,
  beginCameraDrag,
  cameraMotionActivity,
  cameraMotionSnapshot,
  createCameraMotion,
  endCameraDrag,
  recordCameraDrag,
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

test('release sampling is fixed-capacity, recent, finite, and clamped', () => {
  const state = createCameraMotion({ now: 0, scene: 'world' });
  beginCameraDrag(state, 0);
  for (let index = 1; index <= 20; index++) recordCameraDrag(state, 0.08, -0.04, index * 10);
  const sampled = cameraMotionSnapshot(state);
  assert.equal(sampled.sampleCount, 6); assert.equal(sampled.sampleHighWater, 6);
  assert.equal(endCameraDrag(state, 200, 'drag'), true);
  const release = cameraMotionSnapshot(state);
  assert.equal(release.mode, 'inertia'); assert.ok(release.speed <= 2.4);
  assert.ok(Math.hypot(release.velocityX, release.velocityY) <= 2.4);
  assert.ok(Number.isFinite(release.velocityX) && Number.isFinite(release.velocityY));

  const stale = createCameraMotion({ now: 0, scene: 'world' }); beginCameraDrag(stale, 0);
  recordCameraDrag(stale, 1, 0, 500); assert.equal(endCameraDrag(stale, 500, 'drag'), false,
    'one movement after a long hold must not use the gesture start as a velocity sample');

  const queued = createCameraMotion({ now: 0, scene: 'world' }); beginCameraDrag(queued, 20);
  recordCameraDrag(queued, .2, 0, 60); recordCameraDrag(queued, .2, 0, 100);
  assert.equal(endCameraDrag(queued, 105, 'drag', 400), true,
    'handler delay must not make recent input samples stale');
  assert.equal(cameraMotionSnapshot(queued).idleUntil, 4900,
    'idle delay remains anchored to observed animation time');
});

test('tap, pinch, cancellation, reduced motion, and held surfaces never release inertia', () => {
  for (const kind of ['tap', 'pinch', 'cancel']) {
    const state = releaseFixture(); assert.equal(endCameraDrag(state, 60, kind), false);
    assert.notEqual(cameraMotionSnapshot(state).mode, 'inertia');
  }
  const reduced = releaseFixture(); setCameraMotionReduced(reduced, true, 50);
  assert.equal(endCameraDrag(reduced, 60, 'drag'), false); assert.equal(cameraMotionSnapshot(reduced).mode, 'reduced');
  const held = releaseFixture(); setCameraMotionSurface(held, true, 50);
  assert.equal(endCameraDrag(held, 60, 'drag'), false); assert.equal(cameraMotionSnapshot(held).mode, 'held');
});

test('exponential inertia agrees across 30, 60, and 120 Hz', () => {
  const outcomes = [30, 60, 120].map(integrateAtCadence);
  for (let index = 1; index < outcomes.length; index++) {
    const angle = vectorAngle(outcomes[0].camera.direction, outcomes[index].camera.direction) * 180 / Math.PI;
    const speedDelta = Math.abs(outcomes[0].motion.speed - outcomes[index].motion.speed) / outcomes[0].motion.speed;
    assert.ok(angle < 0.5, `orientation drift ${angle} degrees`);
    assert.ok(speedDelta < 0.02, `speed drift ${speedDelta}`);
  }
});

test('inertia converges, respects hard lifetime, and activity cancels immediately', () => {
  const state = releaseFixture(); const camera = createCamera(); assert.equal(endCameraDrag(state, 60, 'drag'), true);
  let now = 60;
  while (now < 4000 && cameraMotionSnapshot(state).mode === 'inertia') {
    now += 50; advanceCameraMotion(state, camera, 50, now);
  }
  assert.notEqual(cameraMotionSnapshot(state).mode, 'inertia'); assert.ok(now <= 2560);

  const active = releaseFixture(); endCameraDrag(active, 60, 'drag'); cameraMotionActivity(active, 80);
  const stopped = cameraMotionSnapshot(active);
  assert.equal(stopped.mode, 'idle-wait'); assert.equal(stopped.speed, 0); assert.equal(stopped.idleUntil, 4580);
});

test('idle orbit has one fresh wall-clock delay and obeys scene, surface, hidden, and reduced holds', () => {
  const camera = createCamera(); const state = createCameraMotion({ now: 100, scene: 'home' });
  const before = camera.direction.slice();
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
  setCameraMotionScene(state, 'trophies', 50_000);
  assert.equal(advanceCameraMotion(state, camera, 100, 60_000), false);
});

test('ten thousand motion steps preserve the free-orbit orthonormal frame', () => {
  const camera = createCamera(); const state = createCameraMotion({ now: 0, scene: 'world' });
  for (let step = 0; step < 10_000; step++) advanceCameraMotion(state, camera, 16, 5000 + step * 16);
  for (const vector of [camera.direction, camera.right, camera.up]) {
    assert.ok(Math.abs(Math.hypot(...vector) - 1) < 1e-12);
  }
  assert.ok(Math.abs(dot(camera.direction, camera.right)) < 1e-12);
  assert.ok(Math.abs(dot(camera.direction, camera.up)) < 1e-12);
  assert.ok(Math.abs(dot(camera.right, camera.up)) < 1e-12);
  assert.doesNotThrow(() => advanceCameraMotion(state, camera, Infinity, NaN));
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
    addEventListener(type, listener) { listeners.set(type, listener); },
    removeEventListener(type) { listeners.delete(type); },
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

function releaseFixture() {
  const state = createCameraMotion({ now: 0, scene: 'world' }); beginCameraDrag(state, 0);
  recordCameraDrag(state, 0.025, -0.01, 20); recordCameraDrag(state, 0.025, -0.01, 40);
  recordCameraDrag(state, 0.025, -0.01, 60); return state;
}

function integrateAtCadence(hz) {
  const state = releaseFixture(); const camera = createCamera(); endCameraDrag(state, 60, 'drag');
  const duration = 1000; const frame = 1000 / hz; let elapsed = 0; let now = 60;
  while (elapsed < duration - 1e-9) {
    const step = Math.min(frame, duration - elapsed); elapsed += step; now += step;
    advanceCameraMotion(state, camera, step, now);
  }
  return { camera, motion: cameraMotionSnapshot(state) };
}

function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function vectorAngle(a, b) { return Math.acos(Math.max(-1, Math.min(1, dot(a, b)))); }
