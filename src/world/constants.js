/** Stable numeric vocabulary for generated geography. */
export const ARCHETYPE = Object.freeze({
  CONTINENTAL: 1,
  ARCHIPELAGO: 2,
  RIFTED: 3,
});

export const ARCHETYPE_NAME = Object.freeze({
  [ARCHETYPE.CONTINENTAL]: 'Verdant Riverworld',
  [ARCHETYPE.ARCHIPELAGO]: 'Archipelago',
  [ARCHETYPE.RIFTED]: 'Fractured Basins',
});

export const WATER = Object.freeze({
  LAND: 0,
  DEEP_OCEAN: 1,
  SHALLOW_OCEAN: 2,
  LAKE: 3,
  RIVER: 4,
});

export const BIOME = Object.freeze({
  DEEP_OCEAN: 0,
  SHALLOW_OCEAN: 1,
  COAST: 2,
  FOREST: 3,
  WET_FOREST: 4,
  GRASS: 5,
  DRY_GRASS: 6,
  DESERT: 7,
  WETLAND: 8,
  HIGHLAND: 9,
  MOUNTAIN: 10,
  TUNDRA: 11,
  SNOW_ICE: 12,
});

/** Bounded static factors consumed by simulation hot loops. */
export const BIOME_EFFECTS = Object.freeze([
  effect(0.04, 1.80, 0.18, 0.35, 1.80), // deep ocean
  effect(0.24, 1.32, 0.48, 0.62, 1.35), // shallow ocean
  effect(0.90, 1.04, 0.94, 1.02, 1.05), // coast
  effect(0.84, 0.96, 1.08, 1.12, 1.10), // forest
  effect(0.76, 0.98, 1.12, 1.18, 1.14), // wet forest
  effect(1.06, 0.98, 1.00, 1.00, 0.92), // grass
  effect(0.78, 1.08, 0.78, 0.70, 1.03), // dry grass
  effect(0.34, 1.30, 0.46, 0.38, 1.24), // desert
  effect(0.82, 1.02, 1.14, 1.20, 1.16), // wetland
  effect(0.56, 1.18, 0.70, 0.66, 1.30), // highland
  effect(0.30, 1.38, 0.48, 0.45, 1.55), // mountain
  effect(0.46, 1.22, 0.62, 0.52, 1.30), // tundra
  effect(0.14, 1.55, 0.28, 0.34, 1.62), // snow / ice
]);

function effect(growth, maintenance, uptake, renewal, routeCost) {
  return Object.freeze({ growth, maintenance, uptake, renewal, routeCost });
}

export const LANDMARK = Object.freeze({
  SUMMIT: 1,
  GREAT_RIVER: 2,
  FOREST_HEART: 3,
  WILD_COAST: 4,
  DRYLAND: 5,
  LAKE: 6,
});

export const FEATURE = Object.freeze({
  COAST: 1 << 0,
  RIVER: 1 << 1,
  TRIBUTARY: 1 << 2,
  RIVER_MOUTH: 1 << 3,
  LAKE: 1 << 4,
  FOREST: 1 << 5,
  RIDGE: 1 << 6,
  HIGHLAND: 1 << 7,
  SOURCE: 1 << 8,
  LANDMARK: 1 << 9,
  RIVER_HEADWATER: 1 << 10,
  RIVER_CONFLUENCE: 1 << 11,
  RIVER_TRUNK: 1 << 12,
  RIVER_DELTA: 1 << 13,
});
