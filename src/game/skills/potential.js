/** Versioned Evolution breadth/depth World Potential curves. */
import {
  addProgressionIntegers,
  divideProgressionIntegers,
  multiplyProgressionIntegers,
  normalizeProgressionInteger,
  projectProgressionInteger,
} from '../../core/progression-integer.js';

export const WORLD_POTENTIAL_VERSION = 3;
export const BASE_WORLD_POTENTIAL = 16000;
export const FULL_EVOLUTION_POWER = 384;

export const EVOLUTION_POWER_BY_KIND = Object.freeze({
  root: 1,
  resonance: 1,
  major: 2,
  conditional: 2,
  unlock: 3,
  capability: 3,
  keystone: 5,
  capstone: 8,
});

/** Retained level-one breadth anchors from World Potential v2. */
export const WORLD_POTENTIAL_ANCHORS = Object.freeze([
  [0, 16000], [1, 19000], [2, 22000], [3, 48000], [4, 80000], [6, 105000],
  [8, 135000], [10, 165000], [12, 195000], [16, 240000], [24, 315000],
  [48, 440000], [96, 600000], [160, 780000], [240, 950000],
  [320, 1090000], [384, 1200000],
].map(([power, potential]) => Object.freeze({ power, potential })));

export function evolutionPowerForKind(kind) {
  return EVOLUTION_POWER_BY_KIND[kind] ?? 0;
}

/** Narrow compatibility projection for legacy v2 Number records only. */
export function legacyWorldPotentialV2Number(value) {
  const power = Number.isFinite(value) ? Math.max(0, Math.min(FULL_EVOLUTION_POWER, value)) : 0;
  for (let index = 1; index < WORLD_POTENTIAL_ANCHORS.length; index++) {
    const upper = WORLD_POTENTIAL_ANCHORS[index];
    if (power > upper.power) continue;
    const lower = WORLD_POTENTIAL_ANCHORS[index - 1];
    const t = (power - lower.power) / (upper.power - lower.power);
    return Math.round(lower.potential + (upper.potential - lower.potential) * t);
  }
  return WORLD_POTENTIAL_ANCHORS.at(-1).potential;
}

/**
 * World Potential v3, exact and directly computable:
 * breadthAnchor + 1000D + 8D² + floor(D⁴ / 1,000,000).
 */
export function worldPotentialForBreadthAndDepth(breadthPower, depth = '0') {
  const canonicalDepth = normalizeProgressionInteger(depth, '0');
  const square = multiplyProgressionIntegers(canonicalDepth, canonicalDepth);
  const fourth = multiplyProgressionIntegers(square, square);
  const linear = multiplyProgressionIntegers(canonicalDepth, '1000');
  const quadratic = multiplyProgressionIntegers(square, '8');
  const quartic = divideProgressionIntegers(fourth, '1000000');
  return addProgressionIntegers(String(legacyWorldPotentialV2Number(breadthPower)),
    addProgressionIntegers(linear, addProgressionIntegers(quadratic, quartic)));
}

/** Authoritative v3 convenience for level-one breadth (zero excess depth). */
export function worldPotentialForPower(power) {
  return worldPotentialForBreadthAndDepth(power, '0');
}

/** Deliberately bounded Number projection, not authoritative progression arithmetic. */
export function modeledScoreRange(potential) {
  const canonical = normalizeProgressionInteger(potential, String(BASE_WORLD_POTENTIAL));
  const bounded = Math.max(BASE_WORLD_POTENTIAL,
    projectProgressionInteger(canonical, WORLD_POTENTIAL_ANCHORS.at(-1).potential));
  return Object.freeze({ low: Math.round(bounded * 0.60), high: Math.round(bounded * 0.82), modeled: true });
}
