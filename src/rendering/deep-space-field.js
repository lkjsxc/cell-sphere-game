/** Deterministic low-frequency RGB deep-space composition shared by both backends. */
import { fnv1aBytes, hashStringU32, hexU32 } from '../core/hash.js';

export const DEEP_SPACE_FIELD_WIDTH = 256;
export const DEEP_SPACE_FIELD_HEIGHT = 128;
export const DEEP_SPACE_FIELD_COMPONENTS = 3;
export const DEEP_SPACE_FIELD_VERSION = 'deep-space-field-v2';

export function createDeepSpaceField(seed, options = {}) {
  const width = options.width ?? DEEP_SPACE_FIELD_WIDTH;
  const height = options.height ?? DEEP_SPACE_FIELD_HEIGHT;
  if (!validDimensions(width, height)) throw new RangeError('invalid deep-space field dimensions');
  const normalizedSeed = finiteSeed(seed); const bytes = new Uint8Array(width * height * DEEP_SPACE_FIELD_COMPONENTS);
  const phaseA = unit(normalizedSeed, 31) * Math.PI * 2; const phaseB = unit(normalizedSeed, 47) * Math.PI * 2;
  let minimumLuminance = 255; let maximumLuminance = 0; let luminanceSum = 0;
  for (let y = 0; y < height; y++) {
    const v = (y + .5) / height; const py = v - .5;
    for (let x = 0; x < width; x++) {
      const u = (x + .5) / width; const px = (u - .5) * 2;
      const along = px * .921061 - py * .389418;
      const across = px * .389418 + py * .921061;
      const curve = .055 * Math.sin(along * 3.6 + phaseA) + .022 * Math.sin(along * 8.9 + phaseB);
      const distance = across - curve;
      const broadNoise = .58 * valueNoise(normalizedSeed, u, v, 4, 3, 0)
        + .28 * valueNoise(normalizedSeed, u, v, 9, 5, 1)
        + .14 * valueNoise(normalizedSeed, u, v, 17, 9, 2);
      const detailNoise = .65 * valueNoise(normalizedSeed, u, v, 13, 7, 3)
        + .35 * valueNoise(normalizedSeed, u, v, 29, 15, 4);
      const band = Math.exp(-square(distance / (.205 + broadNoise * .035)));
      const endFade = Math.exp(-square(Math.max(0, Math.abs(along) - .74) / .46));
      const concentration = Math.exp(-(square((px + .43) / .42) + square((py - .09) / .24)));
      const warmConcentration = Math.exp(-(square((px - .56) / .34) + square((py + .17) / .20)));
      const riftPath = curve + .018 + .026 * Math.sin(along * 6.4 + phaseB * .73);
      const rift = Math.exp(-square((across - riftPath) / (.028 + .018 * broadNoise)))
        * (.45 + .55 * detailNoise) * endFade;
      const gas = Math.max(0, band * endFade * (.22 + broadNoise * .78) + concentration * .36 - rift * .92);
      const violet = gas * smoothstep(.15, .86, along * .5 + detailNoise * .7);
      const warm = warmConcentration * band * (.32 + .68 * detailNoise);
      const depth = valueNoise(normalizedSeed, u, v, 6, 4, 5);
      const edgeVignette = 1 - .18 * smoothstep(.68, 1.12, Math.hypot(px, py * 1.5));
      const red = (2.5 + depth * 2.4 + gas * 22.0 + violet * 10.0 + warm * 28.0 - rift * 7.0) * edgeVignette;
      const green = (4.5 + depth * 3.0 + gas * 30.0 + violet * 7.0 + warm * 12.0 - rift * 10.0) * edgeVignette;
      const blue = (9.0 + depth * 4.5 + gas * 48.0 + violet * 20.0 + warm * 5.0 - rift * 16.0) * edgeVignette;
      const at = (y * width + x) * DEEP_SPACE_FIELD_COMPONENTS;
      bytes[at] = byte(red); bytes[at + 1] = byte(green); bytes[at + 2] = byte(blue);
      const luminance = Math.round(bytes[at] * .2126 + bytes[at + 1] * .7152 + bytes[at + 2] * .0722);
      minimumLuminance = Math.min(minimumLuminance, luminance); maximumLuminance = Math.max(maximumLuminance, luminance);
      luminanceSum += luminance;
    }
  }
  const signatureSeed = hashStringU32(`${DEEP_SPACE_FIELD_VERSION}:${normalizedSeed}:${width}x${height}x${DEEP_SPACE_FIELD_COMPONENTS}`);
  return Object.freeze({ version: DEEP_SPACE_FIELD_VERSION, seed: normalizedSeed, width, height,
    components: DEEP_SPACE_FIELD_COMPONENTS, bytes, byteLength: bytes.byteLength,
    signature: hexU32(fnv1aBytes(bytes, signatureSeed)), minimumLuminance, maximumLuminance,
    meanLuminance: luminanceSum / (width * height) });
}

export function validDeepSpaceField(field) {
  return Boolean(field && validDimensions(field.width, field.height)
    && field.components === DEEP_SPACE_FIELD_COMPONENTS && field.bytes instanceof Uint8Array
    && field.bytes.length === field.width * field.height * DEEP_SPACE_FIELD_COMPONENTS);
}

/** Normalized luminance used only while constructing the fixed star catalog. */
export function deepSpaceInfluence(field, u, v) {
  if (!validDeepSpaceField(field)) return .5;
  const x = Math.max(0, Math.min(field.width - 1, Math.floor(clamp01(u) * field.width)));
  const y = Math.max(0, Math.min(field.height - 1, Math.floor(clamp01(v) * field.height)));
  const at = (y * field.width + x) * DEEP_SPACE_FIELD_COMPONENTS;
  const luminance = field.bytes[at] * .2126 + field.bytes[at + 1] * .7152 + field.bytes[at + 2] * .0722;
  const span = Math.max(1, field.maximumLuminance - field.minimumLuminance);
  return clamp01((luminance - field.minimumLuminance) / span);
}

function valueNoise(seed, u, v, columns, rows, stream) {
  const sx = clamp01(u) * (columns - 1); const sy = clamp01(v) * (rows - 1);
  const x0 = Math.floor(sx); const y0 = Math.floor(sy); const tx = fade(sx - x0); const ty = fade(sy - y0);
  const x1 = Math.min(columns - 1, x0 + 1); const y1 = Math.min(rows - 1, y0 + 1);
  const a = lattice(seed, x0, y0, stream); const b = lattice(seed, x1, y0, stream);
  const c = lattice(seed, x0, y1, stream); const d = lattice(seed, x1, y1, stream);
  return mix(mix(a, b, tx), mix(c, d, tx), ty);
}
function lattice(seed, x, y, stream) {
  let value = (seed ^ Math.imul(x + 3, 0x9e3779b1) ^ Math.imul(y + 11, 0x85ebca77)
    ^ Math.imul(stream + 19, 0xc2b2ae3d)) >>> 0;
  value ^= value >>> 16; value = Math.imul(value, 0x7feb352d) >>> 0;
  value ^= value >>> 15; value = Math.imul(value, 0x846ca68b) >>> 0;
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}
function validDimensions(width, height) { return Number.isInteger(width) && Number.isInteger(height)
  && ((width === 256 && height === 128) || (width === 512 && height === 256)); }
function finiteSeed(value) { return Number.isFinite(value) ? Math.trunc(value) >>> 0 : 0; }
function unit(seed, stream) { return lattice(seed, stream, stream ^ 17, stream ^ 41); }
function byte(value) { return Math.max(0, Math.min(255, Math.round(value))); }
function clamp01(value) { return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)); }
function square(value) { return value * value; }
function fade(value) { return value * value * (3 - 2 * value); }
function smoothstep(low, high, value) { const amount = clamp01((value - low) / (high - low)); return fade(amount); }
function mix(a, b, amount) { return a + (b - a) * amount; }
