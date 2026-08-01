/**
 * Pointer picking: screen coordinate -> nearest simulation node.
 * Analytic ray-sphere intersection, then a linear nearest-node scan over
 * 2,562 positions (measured negligible per tap; no spatial index needed).
 */
import { cameraRay, intersectUnitSphere } from './camera.js';

/**
 * @param {HTMLCanvasElement} canvas
 * @param {number} clientX
 * @param {number} clientY
 * @param {import('./camera.js').Camera} camera
 * @param {import('../world/icosphere.js').Topology} topo
 * @returns {{node: number, hit: number[]}|null} null when the globe was missed
 */
export function pickNode(canvas, clientX, clientY, camera, topo) {
  const rect = canvas.getBoundingClientRect();
  const px = (clientX - rect.left) / rect.width;
  const py = (clientY - rect.top) / rect.height;
  if (px < 0 || px > 1 || py < 0 || py > 1) return null;
  const ndcX = px * 2 - 1;
  const ndcY = 1 - py * 2;
  const aspect = rect.width / Math.max(1, rect.height);

  const ray = cameraRay(camera, ndcX, ndcY, aspect);
  const t = intersectUnitSphere(ray);
  if (t === null) return null;
  const hit = [
    ray.origin[0] + ray.dir[0] * t,
    ray.origin[1] + ray.dir[1] * t,
    ray.origin[2] + ray.dir[2] * t,
  ];

  // Nearest node = maximum dot product with the hit direction.
  let best = 0;
  let bestDot = -2;
  const pos = topo.positions;
  for (let i = 0; i < topo.nodeCount; i++) {
    const d = hit[0] * pos[i * 3] + hit[1] * pos[i * 3 + 1] + hit[2] * pos[i * 3 + 2];
    if (d > bestDot) { bestDot = d; best = i; }
  }
  return { node: best, hit };
}
