/**
 * Orbit camera around the unit sphere: yaw/pitch/distance with bounded
 * zoom, optional inertia, and analytic ray construction for picking.
 */
import { perspective, lookAt, multiply, norm3, cross3, dot3 } from './mat4.js';

export const FOV_Y = (44 * Math.PI) / 180;
const MIN_DIST = 1.7;
const MAX_DIST = 7.2;
const MAX_PITCH = 1.45;

/** @returns {Camera} */
export function createCamera() {
  return {
    yaw: 2.4,
    pitch: 0.6,
    dist: 4.1,
    offsetX: 0,
    offsetY: 0,
    velYaw: 0,
    velPitch: 0,
  };
}

/** Camera eye position on the orbit shell. @param {Camera} cam @returns {number[]} */
export function cameraEye(cam) {
  const cp = Math.cos(cam.pitch);
  return [
    cam.dist * cp * Math.sin(cam.yaw),
    cam.dist * Math.sin(cam.pitch),
    cam.dist * cp * Math.cos(cam.yaw),
  ];
}

/** Combined projection*view matrix. @returns {Float32Array} */
export function viewProjection(cam, aspect) {
  const eye = cameraEye(cam);
  const view = lookAt(eye, [0, 0, 0], [0, 1, 0]);
  const proj = perspective(FOV_Y, aspect, 0.1, 50);
  proj[8] = -cam.offsetX;
  proj[9] = -cam.offsetY;
  return multiply(proj, view);
}

/** Drag rotation. @param {Camera} cam */
export function rotate(cam, dYaw, dPitch) {
  cam.yaw += dYaw;
  cam.pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, cam.pitch + dPitch));
  cam.velYaw = dYaw;
  cam.velPitch = dPitch;
}

/** Zoom by wheel/pinch factor. */
export function zoom(cam, factor) {
  cam.dist = Math.max(MIN_DIST, Math.min(MAX_DIST, cam.dist * factor));
}

/** Inertia step; call per frame when enabled. Returns true if moving. */
export function applyInertia(cam) {
  if (Math.abs(cam.velYaw) < 1e-4 && Math.abs(cam.velPitch) < 1e-4) return false;
  cam.yaw += cam.velYaw;
  cam.pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, cam.pitch + cam.velPitch));
  cam.velYaw *= 0.92;
  cam.velPitch *= 0.92;
  return true;
}

/**
 * World-space ray through a normalized device coordinate.
 * @param {Camera} cam
 * @param {number} ndcX in [-1, 1]
 * @param {number} ndcY in [-1, 1]
 * @param {number} aspect width/height
 * @returns {{origin: number[], dir: number[]}}
 */
export function cameraRay(cam, ndcX, ndcY, aspect) {
  const eye = cameraEye(cam);
  const forward = norm3([-eye[0], -eye[1], -eye[2]]);
  const right = norm3(cross3(forward, [0, 1, 0]));
  const up = cross3(right, forward);
  const tanHalf = Math.tan(FOV_Y / 2);
  const shiftedX = ndcX - cam.offsetX;
  const shiftedY = ndcY - cam.offsetY;
  const dir = norm3([
    forward[0] + right[0] * shiftedX * tanHalf * aspect + up[0] * shiftedY * tanHalf,
    forward[1] + right[1] * shiftedX * tanHalf * aspect + up[1] * shiftedY * tanHalf,
    forward[2] + right[2] * shiftedX * tanHalf * aspect + up[2] * shiftedY * tanHalf,
  ]);
  return { origin: eye, dir };
}

/**
 * Intersect a ray with the unit sphere. Returns distance t or null.
 * @param {{origin: number[], dir: number[]}} ray
 */
export function intersectUnitSphere(ray) {
  const b = dot3(ray.origin, ray.dir);
  const c = dot3(ray.origin, ray.origin) - 1;
  const disc = b * b - c;
  if (disc < 0) return null;
  const t = -b - Math.sqrt(disc);
  return t > 0 ? t : null;
}

/** @typedef {ReturnType<typeof createCamera>} Camera */
