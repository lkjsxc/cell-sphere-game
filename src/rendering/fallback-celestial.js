/** Canvas-specific drawing and fixed caches for the shared celestial projection. */
import { sampleValidCloudField } from './cloud-field.js';
import { SKY_STAR_STRIDE } from './celestial-constants.js';

const CANVAS_CLOUD_COLOR = Object.freeze([174, 184, 179]);
export const CANVAS_CLOUD_PHASE_BUCKETS = 1024;

export function createCanvasCloudMap(topo, light) {
  const u = new Float32Array(topo.nodeCount); const v = new Float32Array(topo.nodeCount);
  const daylight = new Float32Array(topo.nodeCount);
  for (let cell = 0; cell < topo.nodeCount; cell++) {
    const at = cell * 3; const x = topo.positions[at]; const y = topo.positions[at + 1]; const z = topo.positions[at + 2];
    u[cell] = Math.atan2(z, x) / (Math.PI * 2) + 0.5;
    v[cell] = Math.acos(Math.max(-1, Math.min(1, y))) / Math.PI;
    const localLight = x * light[0] + y * light[1] + z * light[2];
    daylight[cell] = Math.max(0, Math.min(1, (localLight + .16) / .30));
  }
  return Object.freeze({ u, v, daylight });
}

export function canvasCloudAmount(field, u, v, phaseBucket, daylight) {
  const phase = phaseBucket / CANVAS_CLOUD_PHASE_BUCKETS;
  const opacity = sampleValidCloudField(field, u, v, phase);
  return Math.round(Math.max(0, Math.min(.18, opacity * (.05 + daylight * .13))) * 255);
}

export function canvasCloudMaterial(base, amountByte) {
  const amount = amountByte / 255;
  for (let index = 0; index < 3; index++) base[index] = Math.round(mix(base[index], CANVAS_CLOUD_COLOR[index], amount));
  return base;
}

export function drawCanvasCelestialBackground(ctx, canvas, celestial) {
  const width = canvas.width; const height = canvas.height;
  const dpr = Math.max(1, width / Math.max(1, canvas.clientWidth || width));
  ctx.save(); ctx.fillStyle = 'rgb(180,205,218)';
  for (let star = 0; star < celestial.starCount; star++) {
    const at = star * SKY_STAR_STRIDE; const size = Math.max(1, celestial.stars[at + 2] * dpr);
    ctx.globalAlpha = celestial.stars[at + 3] * .72;
    ctx.fillRect(celestial.stars[at] * width - size * .5, celestial.stars[at + 1] * height - size * .5, size, size);
  }
  const event = celestial.shootingStar;
  if (event) {
    const headX = mix(event.startX, event.endX, event.progress) * width;
    const headY = mix(event.startY, event.endY, event.progress) * height;
    const tailProgress = Math.max(0, event.progress - event.tailLength);
    const tailX = mix(event.startX, event.endX, tailProgress) * width;
    const tailY = mix(event.startY, event.endY, tailProgress) * height;
    ctx.globalAlpha = event.intensity * event.visibility; ctx.strokeStyle = 'rgb(190,222,232)';
    ctx.lineWidth = event.width * dpr; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(tailX, tailY); ctx.lineTo(headX, headY); ctx.stroke();
    ctx.fillStyle = 'rgb(220,239,242)'; const head = Math.max(1, event.width * 1.25 * dpr);
    ctx.fillRect(headX - head * .5, headY - head * .5, head, head);
  }
  ctx.restore();
}

function mix(a, b, amount) { return a + (b - a) * amount; }
