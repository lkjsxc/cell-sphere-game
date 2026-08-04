/** Deterministic Evolution capability gates for whole-cell habitats. */
import { BIOME, FEATURE } from '../world/fields.js';

export const HABITAT_SKILLS = Object.freeze({
  LAKE_ACCESS: 'Lacustrine Film',
  TUNDRA_ACCESS: 'Tundra Proteins',
  SNOW_ICE_ACCESS: 'Cryogenic Matrix',
  SHALLOW_OCEAN_EDGE_ACCESS: 'Brackish Membrane',
  SHALLOW_OCEAN_ACCESS: 'Pelagic Lattice',
  DEEP_OCEAN_ACCESS: 'Abyssal Vesicles',
});

const LABELS = Object.freeze({
  [BIOME.DEEP_OCEAN]: 'Deep ocean', [BIOME.SHALLOW_OCEAN]: 'Shallow ocean',
  [BIOME.COAST]: 'Coast', [BIOME.FOREST]: 'Forest', [BIOME.WET_FOREST]: 'Wet forest',
  [BIOME.GRASS]: 'Grassland', [BIOME.DRY_GRASS]: 'Dry grassland', [BIOME.DESERT]: 'Desert',
  [BIOME.WETLAND]: 'Wetland', [BIOME.HIGHLAND]: 'Highland', [BIOME.MOUNTAIN]: 'Mountain',
  [BIOME.TUNDRA]: 'Tundra', [BIOME.SNOW_ICE]: 'Snow / ice', [BIOME.LAKE]: 'Lake',
});

export function habitatLabel(fields, cell) { return LABELS[fields.biomeId[cell]] ?? 'Unknown habitat'; }

export function requiredHabitatCapability(fields, cell) {
  switch (fields.biomeId[cell]) {
    case BIOME.LAKE: return 'LAKE_ACCESS';
    case BIOME.TUNDRA: return 'TUNDRA_ACCESS';
    case BIOME.SNOW_ICE: return 'SNOW_ICE_ACCESS';
    case BIOME.SHALLOW_OCEAN: return 'SHALLOW_OCEAN_ACCESS';
    case BIOME.DEEP_OCEAN: return 'DEEP_OCEAN_ACCESS';
    default: return null;
  }
}

export function habitatAccess(state, from, target) {
  const capability = requiredHabitatCapability(state.fields, target);
  if (!capability) return Object.freeze({ accessible: true, capability: null, skill: null });
  const owned = state.habitatCapabilitySet;
  if (capability === 'SHALLOW_OCEAN_ACCESS') {
    if (owned.has(capability)) return Object.freeze({ accessible: true, capability, skill: HABITAT_SKILLS[capability] });
    const edge = owned.has('SHALLOW_OCEAN_EDGE_ACCESS') && Number.isInteger(from) && shallowEdgeSource(state.fields, from);
    return Object.freeze({ accessible: edge, capability: edge ? 'SHALLOW_OCEAN_EDGE_ACCESS' : capability,
      skill: HABITAT_SKILLS[edge ? 'SHALLOW_OCEAN_EDGE_ACCESS' : capability] });
  }
  return Object.freeze({ accessible: owned.has(capability), capability, skill: HABITAT_SKILLS[capability] });
}

export function habitatAccessForInspection(state, target) {
  const direct = habitatAccess(state, -1, target);
  if (direct.accessible || direct.capability !== 'SHALLOW_OCEAN_ACCESS') return direct;
  if (!state.habitatCapabilitySet.has('SHALLOW_OCEAN_EDGE_ACCESS')) return direct;
  for (let offset = state.topo.nodeStart[target]; offset < state.topo.nodeStart[target + 1]; offset++) {
    const from = state.topo.nodeNeighbors[offset];
    if (state.alive[from] && shallowEdgeSource(state.fields, from)) return habitatAccess(state, from, target);
  }
  return direct;
}

function shallowEdgeSource(fields, cell) {
  return fields.biomeId[cell] === BIOME.COAST || fields.biomeId[cell] === BIOME.LAKE
    || Boolean(fields.featureFlags[cell] & FEATURE.LAKE_OUTLET);
}
