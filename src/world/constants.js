/** Stable numeric vocabulary for generated geography. */
export const ARCHETYPE = Object.freeze({
  CONTINENTAL: 1,
  ARCHIPELAGO: 2,
  RIFTED: 3,
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
});
