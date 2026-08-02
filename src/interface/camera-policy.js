/** Idle globe motion policy. It never reads or writes simulation state. */
import { rotate } from '../rendering/camera.js';
import { autoRotationEnabled } from '../platform/settings.js';

export function createCameraPolicy(now = 0) {
  return { idleUntil: now + 3000 };
}

export function interruptCameraPolicy(policy, now, delay = 3000) {
  policy.idleUntil = now + delay;
}

/** Apply one calm frame of optional rotation. Returns whether motion occurred. */
export function applyAutoRotation(camera, settings, policy, context, now, dt) {
  if (!autoRotationEnabled(settings) || context.active || context.selected
    || context.overlay || context.hidden || now < policy.idleUntil) return false;
  const revolutionMs = settings.autoRotateSpeed === 'very-slow' ? 180_000 : 130_000;
  rotate(camera, -(Math.PI * 2 * dt) / revolutionMs, 0, false);
  return true;
}
