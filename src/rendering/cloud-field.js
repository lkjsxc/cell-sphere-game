/** Deterministic directional cloud opacity shared by WebGL2 and Canvas 2D. */
import { fnv1aBytes, hashStringU32, hexU32 } from '../core/hash.js';

export const CLOUD_FACE_SIZE = 64;
export const CLOUD_FACE_COUNT = 6;
export const CLOUD_FIELD_VERSION = 'directional-cloud-field-v2';
export const CLOUD_PRIMARY_AXIS = Object.freeze(normalizeAxis([.43, .79, .44]));
export const CLOUD_SECONDARY_AXIS = Object.freeze(normalizeAxis([-.71, .28, .65]));

const OCTAVES = Object.freeze([
  Object.freeze([1.20, .12]),
  Object.freeze([2.45, .30]),
  Object.freeze([4.90, .38]),
  Object.freeze([8.90, .20]),
]);

export function createCloudField(seed, options = {}) {
  const faceSize = options.faceSize ?? CLOUD_FACE_SIZE;
  if (!validFaceSize(faceSize)) throw new RangeError('invalid cloud face dimensions');
  const normalizedSeed = finiteSeed(seed); const faceArea = faceSize * faceSize;
  const raw = new Float32Array(faceArea * CLOUD_FACE_COUNT);
  for (let face = 0; face < CLOUD_FACE_COUNT; face++) {
    for (let row = 0; row < faceSize; row++) {
      const tc = row / (faceSize - 1) * 2 - 1;
      for (let column = 0; column < faceSize; column++) {
        const sc = column / (faceSize - 1) * 2 - 1;
        const [x, y, z] = faceDirection(face, sc, tc);
        let value = 0;
        for (let octave = 0; octave < OCTAVES.length; octave++) {
          const [scale, weight] = OCTAVES[octave];
          value += noise3(normalizedSeed, x * scale + 11.7, y * scale - 7.9, z * scale + 19.3, octave) * weight;
        }
        // Broad directional structures keep coverage planetary instead of
        // resolving into six unrelated face-local patches.
        value += Math.max(0, x * .48 + y * .26 - z * .84) * .09;
        value -= Math.max(0, -x * .68 + y * .70 + z * .18) * .055;
        raw[face * faceArea + row * faceSize + column] = value;
      }
    }
  }
  const ordered = raw.slice().sort(); const low = ordered[Math.floor(ordered.length * .57)];
  const high = Math.max(low + 1e-6, ordered[Math.floor(ordered.length * .88)]);
  const bytes = new Uint8Array(raw.length); let visible = 0;
  for (let index = 0; index < raw.length; index++) {
    const opacity = smoothstep(low, high, raw[index]);
    const byte = Math.max(0, Math.min(255, Math.round(opacity * 255)));
    bytes[index] = byte; if (byte >= 24) visible++;
  }
  const signatureSeed = hashStringU32(`${CLOUD_FIELD_VERSION}:${normalizedSeed}:${faceSize}`);
  return Object.freeze({ version: CLOUD_FIELD_VERSION, seed: normalizedSeed, faceSize,
    faceCount: CLOUD_FACE_COUNT, bytes, byteLength: bytes.byteLength,
    signature: hexU32(fnv1aBytes(bytes, signatureSeed)), coverage: visible / bytes.length });
}

/** Sample the cube field using a normalized or finite nonzero direction. */
export function sampleCloudField(field, x, y, z) {
  if (!validCloudField(field) || ![x, y, z].every(Number.isFinite)) return 0;
  const length = Math.hypot(x, y, z); if (length <= 1e-12) return 0;
  return sampleValidCloudField(field, x / length, y / length, z / length);
}

/** Renderer hot paths call this with a valid field and normalized direction. */
export function sampleValidCloudField(field, x, y, z) {
  const ax = Math.abs(x); const ay = Math.abs(y); const az = Math.abs(z); let face; let sc; let tc;
  if (ax >= ay && ax >= az) {
    if (x >= 0) { face = 0; sc = -z / ax; tc = -y / ax; }
    else { face = 1; sc = z / ax; tc = -y / ax; }
  } else if (ay >= az) {
    if (y >= 0) { face = 2; sc = x / ay; tc = z / ay; }
    else { face = 3; sc = x / ay; tc = -z / ay; }
  } else if (z >= 0) { face = 4; sc = x / az; tc = -y / az; }
  else { face = 5; sc = -x / az; tc = -y / az; }
  const limit = field.faceSize - 1;
  const px = Math.max(0, Math.min(limit, (sc * .5 + .5) * limit));
  const py = Math.max(0, Math.min(limit, (tc * .5 + .5) * limit));
  const x0 = Math.floor(px); const y0 = Math.floor(py); const x1 = Math.min(limit, x0 + 1); const y1 = Math.min(limit, y0 + 1);
  const tx = px - x0; const ty = py - y0; const start = face * field.faceSize * field.faceSize;
  const a = mix(field.bytes[start + y0 * field.faceSize + x0], field.bytes[start + y0 * field.faceSize + x1], tx);
  const b = mix(field.bytes[start + y1 * field.faceSize + x0], field.bytes[start + y1 * field.faceSize + x1], tx);
  return mix(a, b, ty) / 255;
}

/** Apply both authored rotations directly; no incremental matrix can drift. */
export function sampleAdvectedCloudField(field, x, y, z, primaryAngle, secondaryAngle) {
  const primary = finiteAngle(primaryAngle); const pc = Math.cos(primary); const ps = Math.sin(primary);
  const pd = CLOUD_PRIMARY_AXIS[0] * x + CLOUD_PRIMARY_AXIS[1] * y + CLOUD_PRIMARY_AXIS[2] * z;
  const px = x * pc + (CLOUD_PRIMARY_AXIS[1] * z - CLOUD_PRIMARY_AXIS[2] * y) * ps + CLOUD_PRIMARY_AXIS[0] * pd * (1 - pc);
  const py = y * pc + (CLOUD_PRIMARY_AXIS[2] * x - CLOUD_PRIMARY_AXIS[0] * z) * ps + CLOUD_PRIMARY_AXIS[1] * pd * (1 - pc);
  const pz = z * pc + (CLOUD_PRIMARY_AXIS[0] * y - CLOUD_PRIMARY_AXIS[1] * x) * ps + CLOUD_PRIMARY_AXIS[2] * pd * (1 - pc);
  const secondary = finiteAngle(secondaryAngle); const sc = Math.cos(secondary); const ss = Math.sin(secondary);
  const sd = CLOUD_SECONDARY_AXIS[0] * px + CLOUD_SECONDARY_AXIS[1] * py + CLOUD_SECONDARY_AXIS[2] * pz;
  const sx = px * sc + (CLOUD_SECONDARY_AXIS[1] * pz - CLOUD_SECONDARY_AXIS[2] * py) * ss + CLOUD_SECONDARY_AXIS[0] * sd * (1 - sc);
  const sy = py * sc + (CLOUD_SECONDARY_AXIS[2] * px - CLOUD_SECONDARY_AXIS[0] * pz) * ss + CLOUD_SECONDARY_AXIS[1] * sd * (1 - sc);
  const sz = pz * sc + (CLOUD_SECONDARY_AXIS[0] * py - CLOUD_SECONDARY_AXIS[1] * px) * ss + CLOUD_SECONDARY_AXIS[2] * sd * (1 - sc);
  return sampleValidCloudField(field, sx, sy, sz);
}

export function transformCloudDirection(x, y, z, primaryAngle, secondaryAngle) {
  const length = Math.hypot(x, y, z); if (!Number.isFinite(length) || length <= 1e-12) return Object.freeze([0, 0, 1]);
  const first = rotate(x / length, y / length, z / length, CLOUD_PRIMARY_AXIS, finiteAngle(primaryAngle));
  return Object.freeze(rotate(first[0], first[1], first[2], CLOUD_SECONDARY_AXIS, finiteAngle(secondaryAngle)));
}

export function validCloudField(field) {
  return Boolean(field && validFaceSize(field.faceSize) && field.faceCount === CLOUD_FACE_COUNT
    && field.bytes instanceof Uint8Array
    && field.bytes.length === field.faceSize * field.faceSize * CLOUD_FACE_COUNT);
}

export function cloudFaceBytes(field, face) {
  if (!validCloudField(field) || !Number.isInteger(face) || face < 0 || face >= CLOUD_FACE_COUNT) return null;
  const area = field.faceSize * field.faceSize; return field.bytes.subarray(face * area, (face + 1) * area);
}

export function cloudFaceDirection(face, column, row, faceSize = CLOUD_FACE_SIZE) {
  if (!Number.isInteger(face) || face < 0 || face >= CLOUD_FACE_COUNT || !validFaceSize(faceSize)) return null;
  const sc = Math.max(0, Math.min(faceSize - 1, column)) / (faceSize - 1) * 2 - 1;
  const tc = Math.max(0, Math.min(faceSize - 1, row)) / (faceSize - 1) * 2 - 1;
  return Object.freeze(faceDirection(face, sc, tc));
}

function faceDirection(face, sc, tc) {
  const vector = face === 0 ? [1, -tc, -sc] : face === 1 ? [-1, -tc, sc]
    : face === 2 ? [sc, 1, tc] : face === 3 ? [sc, -1, -tc]
      : face === 4 ? [sc, -tc, 1] : [-sc, -tc, -1];
  const length = Math.hypot(...vector); return vector.map((value) => value / length);
}

function noise3(seed, x, y, z, octave) {
  const x0 = Math.floor(x); const y0 = Math.floor(y); const z0 = Math.floor(z);
  const tx = fade(x - x0); const ty = fade(y - y0); const tz = fade(z - z0);
  const n000 = lattice(seed, x0, y0, z0, octave); const n100 = lattice(seed, x0 + 1, y0, z0, octave);
  const n010 = lattice(seed, x0, y0 + 1, z0, octave); const n110 = lattice(seed, x0 + 1, y0 + 1, z0, octave);
  const n001 = lattice(seed, x0, y0, z0 + 1, octave); const n101 = lattice(seed, x0 + 1, y0, z0 + 1, octave);
  const n011 = lattice(seed, x0, y0 + 1, z0 + 1, octave); const n111 = lattice(seed, x0 + 1, y0 + 1, z0 + 1, octave);
  return mix(mix(mix(n000, n100, tx), mix(n010, n110, tx), ty),
    mix(mix(n001, n101, tx), mix(n011, n111, tx), ty), tz);
}
function lattice(seed, x, y, z, octave) {
  let value = (seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca77)
    ^ Math.imul(z, 0xc2b2ae3d) ^ Math.imul(octave + 17, 0x27d4eb2f)) >>> 0;
  value ^= value >>> 16; value = Math.imul(value, 0x7feb352d) >>> 0;
  value ^= value >>> 15; value = Math.imul(value, 0x846ca68b) >>> 0;
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}
function rotate(x, y, z, axis, angle) {
  const cosine = Math.cos(angle); const sine = Math.sin(angle); const dot = axis[0] * x + axis[1] * y + axis[2] * z;
  return [x * cosine + (axis[1] * z - axis[2] * y) * sine + axis[0] * dot * (1 - cosine),
    y * cosine + (axis[2] * x - axis[0] * z) * sine + axis[1] * dot * (1 - cosine),
    z * cosine + (axis[0] * y - axis[1] * x) * sine + axis[2] * dot * (1 - cosine)];
}
function validFaceSize(value) { return Number.isInteger(value) && [64, 96, 128].includes(value); }
function normalizeAxis(values) { const length = Math.hypot(...values); return values.map((value) => value / length); }
function finiteSeed(value) { return Number.isFinite(value) ? Math.trunc(value) >>> 0 : 0; }
function finiteAngle(value) { return Number.isFinite(value) ? modulo(value, Math.PI * 2) : 0; }
function fade(value) { return value * value * (3 - 2 * value); }
function smoothstep(low, high, value) { const t = Math.max(0, Math.min(1, (value - low) / (high - low))); return t * t * (3 - 2 * t); }
function mix(a, b, amount) { return a + (b - a) * amount; }
function modulo(value, divisor) { return ((value % divisor) + divisor) % divisor; }
