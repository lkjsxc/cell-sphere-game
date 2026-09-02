/** Canvas-specific drawing and fixed caches for the shared celestial projection. */
import { sampleValidCloudField } from './cloud-field.js';
import { validDeepSpaceField } from './deep-space-field.js';
import { SKY_STAR_STRIDE, STAR_STRATA } from './star-field.js';

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

export function createCanvasDeepSpaceRaster(field) {
  if (!validDeepSpaceField(field) || typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas'); canvas.width = field.width; canvas.height = field.height;
  const ctx = canvas.getContext('2d'); if (!ctx) return null;
  const image = ctx.createImageData(field.width, field.height);
  for (let pixel = 0, source = 0, target = 0; pixel < field.width * field.height; pixel++, source += 3, target += 4) {
    image.data[target] = field.bytes[source]; image.data[target + 1] = field.bytes[source + 1];
    image.data[target + 2] = field.bytes[source + 2]; image.data[target + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  return Object.freeze({ field, canvas, width: field.width, height: field.height, rgbaBytes: image.data.byteLength });
}

export function drawCanvasCelestialBackground(ctx, canvas, celestial, deepSpaceRaster = null) {
  const width = canvas.width; const height = canvas.height;
  const dpr = Math.max(1, width / Math.max(1, canvas.clientWidth || width));
  ctx.save();
  if (celestial.deepSpaceEnabled && deepSpaceRaster?.field === celestial.deepSpace) drawDeepSpace(ctx, width, height, deepSpaceRaster);
  for (let stratum = 0; stratum < STAR_STRATA.length; stratum++) {
    const definition = STAR_STRATA[stratum]; const count = celestial.starCounts[stratum] ?? 0;
    for (let local = 0; local < count; local++) {
      const at = (definition.offset + local) * SKY_STAR_STRIDE;
      const size = Math.max(.55 * dpr, celestial.stars[at + 2] * dpr);
      const x = celestial.stars[at] * width; const y = celestial.stars[at + 1] * height;
      const temperature = celestial.stars[at + 4]; const color = temperature < -.28 ? 0 : temperature > .28 ? 2 : 1;
      ctx.globalAlpha = celestial.stars[at + 3] * (stratum === 0 ? .72 : stratum === 1 ? .84 : .92);
      ctx.fillStyle = STAR_COLORS[stratum][color];
      if (stratum === 0) ctx.fillRect(x - size * .5, y - size * .5, size, size);
      else {
        if (stratum === 2) { ctx.globalAlpha *= .22; ctx.beginPath(); ctx.arc(x, y, size * 1.75, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = celestial.stars[at + 3] * .96; }
        ctx.beginPath(); ctx.arc(x, y, size * .5, 0, Math.PI * 2); ctx.fill();
      }
    }
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

const STAR_COLORS = Object.freeze([
  Object.freeze(['rgb(204,187,169)', 'rgb(181,203,218)', 'rgb(160,194,224)']),
  Object.freeze(['rgb(236,203,169)', 'rgb(213,226,231)', 'rgb(178,212,239)']),
  Object.freeze(['rgb(248,207,164)', 'rgb(234,239,236)', 'rgb(188,222,247)']),
]);

function drawDeepSpace(ctx, width, height, raster) {
  const sourceAspect = raster.width / raster.height; const targetAspect = width / Math.max(1, height);
  let sx = 0; let sy = 0; let sw = raster.width; let sh = raster.height;
  if (targetAspect > sourceAspect) { sh = raster.height * sourceAspect / targetAspect; sy = (raster.height - sh) * .5; }
  else { sw = raster.width * targetAspect / sourceAspect; sx = (raster.width - sw) * .5; }
  ctx.globalAlpha = 1; ctx.drawImage(raster.canvas, sx, sy, sw, sh, 0, 0, width, height);
}

function mix(a, b, amount) { return a + (b - a) * amount; }
