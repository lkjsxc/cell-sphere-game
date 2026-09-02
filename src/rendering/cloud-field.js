/** Deterministic seamless cloud opacity shared by WebGL2 and Canvas 2D. */
import { fnv1aBytes, hashStringU32, hexU32 } from '../core/hash.js';

export const CLOUD_FIELD_WIDTH = 128;
export const CLOUD_FIELD_HEIGHT = 64;
export const CLOUD_FIELD_VERSION = 'cloud-field-v1';

const OCTAVES = Object.freeze([
  Object.freeze([10, 7, 0.44]),
  Object.freeze([20, 13, 0.29]),
  Object.freeze([40, 25, 0.18]),
  Object.freeze([64, 41, 0.09]),
]);

export function createCloudField(seed, options = {}) {
  const width = options.width ?? CLOUD_FIELD_WIDTH;
  const height = options.height ?? CLOUD_FIELD_HEIGHT;
  if (!validDimensions(width, height)) throw new RangeError('invalid cloud field dimensions');
  const normalizedSeed = finiteSeed(seed); const raw = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    const v = (y + 0.5) / height;
    for (let x = 0; x < width; x++) {
      const u = (x + 0.5) / width; let value = 0;
      for (let octave = 0; octave < OCTAVES.length; octave++) {
        const [columns, rows, weight] = OCTAVES[octave];
        value += periodicNoise(normalizedSeed, u, v, columns, rows, octave) * weight;
      }
      raw[y * width + x] = value;
    }
  }
  // Seed-normalized quantiles keep coverage restrained across Worlds while the
  // connected shape remains entirely determined by the low-frequency field.
  const ordered = raw.slice().sort(); const low = ordered[Math.floor(ordered.length * 0.66)];
  const high = Math.max(low + 1e-6, ordered[Math.floor(ordered.length * 0.90)]);
  const bytes = new Uint8Array(width * height); let visible = 0;
  for (let index = 0; index < raw.length; index++) {
      const opacity = smoothstep(low, high, raw[index]);
      const byte = Math.max(0, Math.min(255, Math.round(opacity * 255)));
      bytes[index] = byte; if (byte >= 24) visible++;
  }
  const signatureSeed = hashStringU32(`${CLOUD_FIELD_VERSION}:${normalizedSeed}:${width}x${height}`);
  return Object.freeze({ version: CLOUD_FIELD_VERSION, seed: normalizedSeed, width, height, bytes,
    byteLength: bytes.byteLength, signature: hexU32(fnv1aBytes(bytes, signatureSeed)),
    coverage: visible / bytes.length });
}

/** Match normalized WebGL linear sampling, including horizontal wrap. */
export function sampleCloudField(field, u, v, phase = 0) {
  if (!validCloudField(field)) return 0;
  return sampleValidCloudField(field, u, v, phase);
}

/** Renderer hot paths call this only after their projection boundary validates the field. */
export function sampleValidCloudField(field, u, v, phase = 0) {
  const safeU = Number.isFinite(u) ? u : 0; const safeV = Number.isFinite(v) ? v : 0;
  const safePhase = Number.isFinite(phase) ? phase : 0;
  const x = wrap01(safeU + safePhase) * field.width - 0.5;
  const y = Math.max(0, Math.min(1, safeV)) * field.height - 0.5;
  const x0 = Math.floor(x); const y0 = Math.floor(y); const tx = x - x0; const ty = y - y0;
  const row0 = Math.max(0, Math.min(field.height - 1, y0));
  const row1 = Math.max(0, Math.min(field.height - 1, y0 + 1));
  const col0 = modulo(x0, field.width); const col1 = modulo(x0 + 1, field.width);
  const a = mix(field.bytes[row0 * field.width + col0], field.bytes[row0 * field.width + col1], tx);
  const b = mix(field.bytes[row1 * field.width + col0], field.bytes[row1 * field.width + col1], tx);
  return mix(a, b, ty) / 255;
}

export function validCloudField(field) {
  return Boolean(field && validDimensions(field.width, field.height)
    && field.bytes instanceof Uint8Array && field.bytes.length === field.width * field.height);
}

function periodicNoise(seed, u, v, columns, rows, octave) {
  const sx = u * columns; const sy = v * (rows - 1);
  const x0 = Math.floor(sx); const y0 = Math.floor(sy);
  const tx = fade(sx - x0); const ty = fade(sy - y0);
  const a = lattice(seed, modulo(x0, columns), y0, octave);
  const b = lattice(seed, modulo(x0 + 1, columns), y0, octave);
  const c = lattice(seed, modulo(x0, columns), Math.min(rows - 1, y0 + 1), octave);
  const d = lattice(seed, modulo(x0 + 1, columns), Math.min(rows - 1, y0 + 1), octave);
  return mix(mix(a, b, tx), mix(c, d, tx), ty);
}
function lattice(seed, x, y, octave) {
  let value = (seed ^ Math.imul(x + 1, 0x9e3779b1) ^ Math.imul(y + 7, 0x85ebca77)
    ^ Math.imul(octave + 11, 0xc2b2ae3d)) >>> 0;
  value ^= value >>> 16; value = Math.imul(value, 0x7feb352d) >>> 0;
  value ^= value >>> 15; value = Math.imul(value, 0x846ca68b) >>> 0;
  value = (value ^ (value >>> 16)) >>> 0; return value / 4294967295;
}
function validDimensions(width, height) {
  return Number.isInteger(width) && Number.isInteger(height) && width >= 128 && width <= 256
    && height >= 64 && height <= 128 && width === height * 2;
}
function finiteSeed(value) { return Number.isFinite(value) ? Math.trunc(value) >>> 0 : 0; }
function fade(value) { return value * value * (3 - 2 * value); }
function smoothstep(low, high, value) { const t = Math.max(0, Math.min(1, (value - low) / (high - low))); return t * t * (3 - 2 * t); }
function mix(a, b, amount) { return a + (b - a) * amount; }
function modulo(value, divisor) { return ((value % divisor) + divisor) % divisor; }
function wrap01(value) { return value - Math.floor(value); }
