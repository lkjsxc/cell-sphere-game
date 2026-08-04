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
  [0, 16000], [1, 19000], [2, 22000], [4, 30000], [6, 42000], [8, 58000],
  [10, 78000], [12, 100000], [16, 140000], [24, 210000], [48, 350000],
  [96, 550000], [160, 760000], [240, 930000], [320, 1080000], [384, 1200000],
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
