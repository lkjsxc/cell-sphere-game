/** Versioned, order-independent Evolution Power to World Potential curve. */
export const WORLD_POTENTIAL_VERSION = 2;
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

export const WORLD_POTENTIAL_ANCHORS = Object.freeze([
  [0, 16000], [1, 19000], [2, 22000], [3, 48000], [4, 80000], [6, 105000],
  [8, 135000], [10, 165000], [12, 195000], [16, 240000], [24, 315000],
  [48, 440000], [96, 600000], [160, 780000], [240, 950000],
  [320, 1090000], [384, 1200000],
].map(([power, potential]) => Object.freeze({ power, potential })));

export function evolutionPowerForKind(kind) {
  return EVOLUTION_POWER_BY_KIND[kind] ?? 0;
}

/** Linear interpolation over frozen monotone anchors; malformed inputs degrade to fresh power. */
export function worldPotentialForPower(value) {
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

/** Deliberately labeled projection, not an authoritative SCORE promise. */
export function modeledScoreRange(potential) {
  const bounded = Number.isFinite(potential)
    ? Math.max(BASE_WORLD_POTENTIAL, Math.min(WORLD_POTENTIAL_ANCHORS.at(-1).potential, potential))
    : BASE_WORLD_POTENTIAL;
  return Object.freeze({ low: Math.round(bounded * 0.60), high: Math.round(bounded * 0.82), modeled: true });
}
