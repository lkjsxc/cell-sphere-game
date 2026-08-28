/**
 * Free-orbit camera around the unit sphere.
 *
 * The camera stores an orthonormal frame instead of yaw/pitch, so a grabbed
 * globe can turn through either pole repeatedly without clamps or axis flips.
 */
import { perspective, lookAt, multiply, norm3, cross3, dot3 } from './mat4.js';

export const FOV_Y = (44 * Math.PI) / 180;
const MIN_DIST = 1.7;
const MAX_DIST = 7.2;
const INITIAL_YAW = 2.4;
const INITIAL_PITCH = 0.6;

/** @returns {Camera} */
export function createCamera() {
  const cp = Math.cos(INITIAL_PITCH);
  const direction = norm3([
    cp * Math.sin(INITIAL_YAW),
    Math.sin(INITIAL_PITCH),
    cp * Math.cos(INITIAL_YAW),
  ]);
  const right = norm3(cross3([0, 1, 0], direction));
  const up = norm3(cross3(direction, right));
  return {
    direction, right, up,
    dist: 4.1,
    offsetX: 0,
    offsetY: 0,
  };
}

/** Stable camera frame for renderers and fallbacks. */
export function cameraBasis(cam) {
  return { dir: cam.direction, right: cam.right, up: cam.up };
}

/** Frame a world-space direction without introducing a pole singularity. */
export function focusCamera(cam, direction) {
  const target = norm3(direction);
  let right = cross3(cam.up, target);
  if (Math.hypot(...right) < 0.01) {
    const reference = Math.abs(target[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    right = cross3(reference, target);
  }
  cam.direction = target;
  cam.right = norm3(right);
  cam.up = norm3(cross3(target, cam.right));
}

/** Camera eye position on the orbit shell. @param {Camera} cam @returns {number[]} */
export function cameraEye(cam) {
  return [
    cam.dist * cam.direction[0],
    cam.dist * cam.direction[1],
    cam.dist * cam.direction[2],
  ];
}

/** Combined projection*view matrix. @returns {Float32Array} */
export function viewProjection(cam, aspect) {
  const eye = cameraEye(cam);
  const view = lookAt(eye, [0, 0, 0], cam.up);
  const proj = perspective(FOV_Y, aspect, 0.1, 50);
  proj[8] = -cam.offsetX;
  proj[9] = -cam.offsetY;
  return multiply(proj, view);
}

/**
 * Rotate as if the player were dragging the globe itself. A point under a
 * rightward/downward pointer therefore follows the pointer in screen space.
 * @param {Camera} cam
 * @param {number} dragX angular horizontal pointer travel
 * @param {number} dragY angular vertical pointer travel
 */
export function rotate(cam, dragX, dragY) {
  applyDrag(cam, dragX, dragY);
}

/** Apply one simultaneous body-frame angular delta without hot-path allocation. */
export function rotateByAngularDelta(cam, dragX, dragY) {
  const angle = Math.hypot(dragX, dragY);
  if (!(angle > 0) || !Number.isFinite(angle)) return;
  const dx = cam.direction[0]; const dy = cam.direction[1]; const dz = cam.direction[2];
  const rx = cam.right[0]; const ry = cam.right[1]; const rz = cam.right[2];
  const ux = cam.up[0]; const uy = cam.up[1]; const uz = cam.up[2];
  const inverse = 1 / angle;
  const ax = (-dragY * rx - dragX * ux) * inverse;
  const ay = (-dragY * ry - dragX * uy) * inverse;
  const az = (-dragY * rz - dragX * uz) * inverse;
  const cosine = Math.cos(angle); const sine = Math.sin(angle); const complement = 1 - cosine;
  rotateInto(cam.direction, dx, dy, dz, ax, ay, az, cosine, sine, complement);
  rotateInto(cam.right, rx, ry, rz, ax, ay, az, cosine, sine, complement);
  rotateInto(cam.up, ux, uy, uz, ax, ay, az, cosine, sine, complement);
  normalizeInPlace(cam.direction);
  crossInto(cam.right, cam.up, cam.direction); normalizeInPlace(cam.right);
  crossInto(cam.up, cam.direction, cam.right); normalizeInPlace(cam.up);
}

/** Zoom by wheel/pinch factor. */
export function zoom(cam, factor) {
  cam.dist = Math.max(MIN_DIST, Math.min(MAX_DIST, cam.dist * factor));
}

function applyDrag(cam, dragX, dragY) {
  if (dragX) {
    cam.direction = rotateAround(cam.direction, cam.up, -dragX);
    cam.right = rotateAround(cam.right, cam.up, -dragX);
  }
  if (dragY) {
    cam.direction = rotateAround(cam.direction, cam.right, -dragY);
    cam.up = rotateAround(cam.up, cam.right, -dragY);
  }
  cam.direction = norm3(cam.direction);
  cam.right = norm3(cross3(cam.up, cam.direction));
  cam.up = norm3(cross3(cam.direction, cam.right));
}

function rotateAround(vector, axis, angle) {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  const cross = cross3(axis, vector);
  const along = dot3(axis, vector) * (1 - cosine);
  return [
    vector[0] * cosine + cross[0] * sine + axis[0] * along,
    vector[1] * cosine + cross[1] * sine + axis[1] * along,
    vector[2] * cosine + cross[2] * sine + axis[2] * along,
  ];
}

function rotateInto(target, vx, vy, vz, ax, ay, az, cosine, sine, complement) {
  const crossX = ay * vz - az * vy; const crossY = az * vx - ax * vz; const crossZ = ax * vy - ay * vx;
  const along = (ax * vx + ay * vy + az * vz) * complement;
  target[0] = vx * cosine + crossX * sine + ax * along;
  target[1] = vy * cosine + crossY * sine + ay * along;
  target[2] = vz * cosine + crossZ * sine + az * along;
}

function crossInto(target, a, b) {
  const x = a[1] * b[2] - a[2] * b[1]; const y = a[2] * b[0] - a[0] * b[2];
  const z = a[0] * b[1] - a[1] * b[0]; target[0] = x; target[1] = y; target[2] = z;
}

function normalizeInPlace(vector) {
  const inverse = 1 / Math.hypot(vector[0], vector[1], vector[2]);
  vector[0] *= inverse; vector[1] *= inverse; vector[2] *= inverse;
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
  const forward = [-cam.direction[0], -cam.direction[1], -cam.direction[2]];
  const tanHalf = Math.tan(FOV_Y / 2);
  const shiftedX = ndcX - cam.offsetX;
  const shiftedY = ndcY - cam.offsetY;
  const dir = norm3([
    forward[0] + cam.right[0] * shiftedX * tanHalf * aspect + cam.up[0] * shiftedY * tanHalf,
    forward[1] + cam.right[1] * shiftedX * tanHalf * aspect + cam.up[1] * shiftedY * tanHalf,
    forward[2] + cam.right[2] * shiftedX * tanHalf * aspect + cam.up[2] * shiftedY * tanHalf,
  ]);
  return { origin: eye, dir };
}

/** Intersect a ray with the unit sphere. Returns distance t or null. */
export function intersectUnitSphere(ray) {
  const b = dot3(ray.origin, ray.dir);
  const c = dot3(ray.origin, ray.origin) - 1;
  const disc = b * b - c;
  if (disc < 0) return null;
  const t = -b - Math.sqrt(disc);
  return t > 0 ? t : null;
}

/** @typedef {ReturnType<typeof createCamera>} Camera */
