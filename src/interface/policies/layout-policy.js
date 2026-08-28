/** Stable scene composition; transient surfaces never participate. */
import { FOV_Y } from '../../rendering/camera.js';

export const WIDE_GLOBE_CENTER_RATIO = 2 / 3;

export function safeLayout(width, height, state, insets = {}) {
  const w = Math.max(1, width); const h = Math.max(1, height);
  const left = inset(insets.left, w); const rightInset = inset(insets.right, w - left);
  const top = inset(insets.top, h); const bottomInset = inset(insets.bottom, h - top);
  const right = w - rightInset; const bottom = h - bottomInset;
  const usableWidth = Math.max(1, right - left); const usableHeight = Math.max(1, bottom - top);
  const aspect = usableWidth / usableHeight; const slack = smoothstep(.92, 1.72, aspect);
  const centerRatio = .5 + (WIDE_GLOBE_CENTER_RATIO - .5) * slack;
  const centerX = left + usableWidth * centerRatio;
  const portrait = 1 - smoothstep(.72, 1.05, aspect);
  const centerYRatio = state === 'evolution' || state === 'trophies' ? .48 - .1 * portrait
    : state === 'home' ? .5 - .08 * portrait : .48 - .03 * portrait;
  const centerY = top + usableHeight * centerYRatio;
  const open = smoothstep(.72, 1.5, aspect); const largeSphere = ['evolution', 'trophies'].includes(state);
  const targetDiameterRatio = largeSphere ? null : targetGlobeDiameterRatio(aspect);
  const targetDiameter = targetDiameterRatio == null ? null : targetDiameterRatio * Math.min(usableWidth, usableHeight);
  const distance = largeSphere ? mix(5.5, 3.75, open)
    : cameraDistanceForProjectedDiameter(h, targetDiameter, FOV_Y);
  return Object.freeze({
    rect: Object.freeze({ left, top, right, bottom, width: usableWidth, height: usableHeight }),
    offsetX: (centerX / w - .5) * 2, offsetY: (.5 - centerY / h) * 2, distance, targetDiameterRatio,
  });
}

export function applySafeLayout(camera, layout, preserveZoom = false) {
  camera.offsetX = layout.offsetX; camera.offsetY = layout.offsetY;
  if (!preserveZoom) camera.dist = layout.distance;
}

/** Smooth phone portrait → tablet/square → landscape projected-size policy. */
export function targetGlobeDiameterRatio(aspect) {
  const value = Math.max(0.1, Number(aspect) || 1);
  if (value <= .62) return 1.08;
  if (value < .78) return mix(1.08, .98, smoothstep(.62, .78, value));
  if (value <= 1.1) return .98;
  if (value < 1.5) return mix(.98, .90, smoothstep(1.1, 1.5, value));
  return .90;
}

export function projectedSphereDiameter(distance, viewportHeight, fovY = FOV_Y, sphereRadius = 1) {
  const d = Math.max(sphereRadius + Number.EPSILON, Number(distance) || 0);
  const height = Math.max(1, Number(viewportHeight) || 1);
  return height * sphereRadius / (Math.tan(fovY / 2) * Math.sqrt(d * d - sphereRadius * sphereRadius));
}

export function cameraDistanceForProjectedDiameter(viewportHeight, projectedDiameter, fovY = FOV_Y, sphereRadius = 1) {
  const height = Math.max(1, Number(viewportHeight) || 1);
  const diameter = Math.max(1, Number(projectedDiameter) || 1);
  const scale = height / (diameter * Math.tan(fovY / 2));
  return sphereRadius * Math.sqrt(1 + scale * scale);
}
function inset(value, maximum) { return Math.min(maximum, Math.max(0, Number(value) || 0)); }
function smoothstep(a, b, value) { const x = Math.max(0, Math.min(1, (value - a) / (b - a))); return x * x * (3 - 2 * x); }
function mix(a, b, amount) { return a + (b - a) * amount; }
