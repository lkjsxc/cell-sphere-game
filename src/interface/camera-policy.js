/** Idle globe motion policy. It never reads or writes simulation state. */
import { rotate } from '../rendering/camera.js';
import { autoRotationEnabled } from '../platform/settings.js';

export function createCameraPolicy(now = 0) {
  return { idleUntil: now + 4000, blend: 0 };
}

export function interruptCameraPolicy(policy, now, delay = 4000) {
  policy.idleUntil = now + delay; policy.blend = 0;
}

/** Apply one optional ambient frame. Returns whether motion occurred. */
export function applyAutoRotation(camera, settings, policy, context, now, dt) {
  const blocked = !autoRotationEnabled(settings) || context.active || context.selected
    || context.overlay || context.hidden || now < policy.idleUntil;
  if (blocked) { policy.blend = 0; return false; }
  policy.blend = Math.min(1, policy.blend + dt / 1000);
  const revolutionMs = settings.idleRotation === 'gentle' ? 55_000 : 90_000;
  rotate(camera, -(Math.PI * 2 * dt * policy.blend) / revolutionMs, 0, false);
  return true;
}
