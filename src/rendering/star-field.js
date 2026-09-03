/** Fixed bounded star strata shared semantically by WebGL2 and Canvas 2D. */
import { deepSpaceInfluence } from './deep-space-field.js';

export const SKY_STAR_STRIDE = 6;
export const STAR_STRATUM = Object.freeze({ FAINT: 0, BRIGHT: 1, ANCHOR: 2 });
export const STAR_STRATA = Object.freeze([
  Object.freeze({ id: 'faint', offset: 0, maximum: 384, grid: Object.freeze([36, 20]),
    size: Object.freeze([.55, 1.18]), intensity: Object.freeze([.28, .62]), opacity: .82, halo: 0 }),
  Object.freeze({ id: 'bright', offset: 384, maximum: 96, grid: Object.freeze([24, 14]),
    size: Object.freeze([1.08, 2.12]), intensity: Object.freeze([.56, .92]), opacity: .92, halo: .045 }),
  Object.freeze({ id: 'anchor', offset: 480, maximum: 20, grid: Object.freeze([15, 9]),
    size: Object.freeze([2.15, 3.60]), intensity: Object.freeze([.80, 1.0]), opacity: .98, halo: .18 }),
]);
export const MAX_SKY_STARS = 500;
export const STAR_STRATA_COUNTS = Object.freeze({
  eco: Object.freeze([176, 40, 8]),
  balanced: Object.freeze([280, 64, 12]),
  high: Object.freeze([384, 96, 20]),
});
export const STAR_BUDGETS = Object.freeze(Object.fromEntries(Object.entries(STAR_STRATA_COUNTS)
  .map(([quality, counts]) => [quality, counts.reduce((sum, value) => sum + value, 0)])));

export function createStarCatalog(seed, deepSpace) {
  const normalizedSeed = finiteSeed(seed); const values = new Float32Array(MAX_SKY_STARS * SKY_STAR_STRIDE);
  for (let stratum = 0; stratum < STAR_STRATA.length; stratum++) {
    const definition = STAR_STRATA[stratum];
    for (let local = 0; local < definition.maximum; local++) {
      let x = .5; let y = .5;
      for (let attempt = 0; attempt < 16; attempt++) {
        const candidate = local * 19 + attempt + stratum * 8191;
        x = .012 + unit(normalizedSeed, candidate, 1) * .976;
        y = .012 + unit(normalizedSeed, candidate, 2) * .976;
        const influence = deepSpaceInfluence(deepSpace, x, y);
        if (attempt === 15 || unit(normalizedSeed, candidate, 3) < .78 + influence * .12) break;
      }
      const at = (definition.offset + local) * SKY_STAR_STRIDE;
      values[at] = x; values[at + 1] = y;
      values[at + 2] = mix(definition.size[0], definition.size[1], unit(normalizedSeed, local, 10 + stratum));
      values[at + 3] = mix(definition.intensity[0], definition.intensity[1], unit(normalizedSeed, local, 20 + stratum));
      values[at + 4] = unit(normalizedSeed, local, 30 + stratum) * 2 - 1;
      values[at + 5] = stratum;
    }
  }
  return values;
}

export function validStarCatalog(values) {
  return values instanceof Float32Array && values.length === MAX_SKY_STARS * SKY_STAR_STRIDE;
}

export function starCountsForQuality(quality) { return STAR_STRATA_COUNTS[quality] ?? STAR_STRATA_COUNTS.eco; }

function unit(seed, index, stream) { return mix32((seed >>> 0) ^ Math.imul(index + 1, 0x9e3779b1)
  ^ Math.imul(stream + 17, 0x85ebca77)) / 4294967296; }
function mix32(input) { let value = input >>> 0; value ^= value >>> 16; value = Math.imul(value, 0x7feb352d) >>> 0;
  value ^= value >>> 15; value = Math.imul(value, 0x846ca68b) >>> 0; return (value ^ (value >>> 16)) >>> 0; }
function finiteSeed(value) { return Number.isFinite(value) ? Math.trunc(value) >>> 0 : 0; }
function mix(a, b, amount) { return a + (b - a) * amount; }
