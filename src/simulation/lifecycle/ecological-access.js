/** Pure habitat + bounded local-resource access decision used before growth RNG. */
import { clamp01, tolerance } from '../../core/math.js';
import { RESOURCE_STATE, freshwaterSupportAt, resourceRichnessAt } from '../resource-ecology.js';
import { habitatAccess } from '../habitats.js';
import { BIOME } from '../../world/constants.js';

/** Fresh life begins in a genuinely rich niche; Evolution can broaden it causally. */
export const FRESH_RESOURCE_FLOOR = .70;
const MOIST_CENTER = .55; const TEMP_CENTER = .6;

export function ecologicalAccess(state, from, target) {
  const habitat = habitatAccess(state, from, target); const richness = resourceRichnessAt(state, target);
  const ecology = state.ecology ?? EMPTY; const worldmaking = state.worldmakingCapabilities ?? EMPTY;
  if (!habitat.accessible) return decision(false, 'habitat-capability-missing', richness, FRESH_RESOURCE_FLOOR,
    { capability: habitat.capability, skill: habitat.skill });
  const freshwater = freshwaterSupportAt(state, target); const freshwaterRoute = freshwater > .2 && ecology.freshwaterSupport > 0;
  const marineRoute = ecology.marineSupport > 0 && habitat.capability?.includes('OCEAN');
  const scarcityReduction = Math.min(.45, number(ecology.resourceFloorReduction));
  let minimum = clamp01(FRESH_RESOURCE_FLOOR - scarcityReduction
    - (freshwaterRoute ? Math.min(.12, freshwater * ecology.freshwaterSupport * .14) : 0)
    - (marineRoute ? Math.min(.16, ecology.marineSupport * .16) : 0));
  if (habitat.capability) {
    const biome = state.effectiveBiome?.[target] ?? state.fields.biomeId[target];
    const habitatFloor = biome === BIOME.DEEP_OCEAN ? .17 : biome === BIOME.SHALLOW_OCEAN ? .34
      : biome === BIOME.SNOW_ICE ? .30 : biome === BIOME.TUNDRA ? .40 : biome === BIOME.LAKE ? .46 : 1;
    minimum = Math.min(minimum, habitatFloor);
  }
  const recycling = worldmaking.reclamation === true && number(ecology.recycling) > 0;
  const stateCode = state.resourceState?.[target] ?? RESOURCE_STATE.UNKNOWN;
  if (stateCode === RESOURCE_STATE.EXHAUSTED && !recycling) return decision(false, 'cell-exhausted', richness, minimum, modifiers());
  const reclamationFloor = Math.max(.08, minimum - (.12 + number(ecology.recycling) * .18));
  if (richness < minimum && !(recycling && richness >= reclamationFloor))
    return decision(false, 'resource-richness-below-niche-floor', richness, minimum, modifiers());
  const traits = state.activeTraits ?? state.traits;
  const moistW = MOIST_CENTER * .92 * traits.droughtTol; const tempW = .42 * traits.heatTol;
  const climate = tolerance(state.moisture[target], MOIST_CENTER, moistW)
    * tolerance(state.temperature[target], TEMP_CENTER, tempW)
    * clamp01(1 - (state.toxicity[target] / traits.toxinTol - .35) * 1.1);
  const coldRoute = state.habitatCapabilitySet?.has('TUNDRA_ACCESS') || state.habitatCapabilitySet?.has('SNOW_ICE_ACCESS');
  if (climate < (coldRoute ? .04 : .12) && state.tick >= 90)
    return decision(false, 'climate-outside-current-tolerance', richness, minimum, { ...modifiers(), climate });
  if (Number.isInteger(from) && from >= 0 && state.energy[from] <= 0)
    return decision(false, 'source-lacks-energy', richness, minimum, modifiers());
  return decision(true, recycling && richness < minimum ? 'reachable-through-recycling'
    : freshwaterRoute && richness < FRESH_RESOURCE_FLOOR ? 'reachable-through-freshwater-support'
      : habitat.capability ? 'transformed-habitat-access' : 'rich-niche-access', richness, minimum, modifiers());

  function modifiers() { return { freshwater, scarcityReduction, recycling, freshwaterRoute, marineRoute }; }
}

export function ecologicalAccessForInspection(state, target) {
  let fallback = ecologicalAccess(state, -1, target);
  for (let offset = state.topo.nodeStart[target]; offset < state.topo.nodeStart[target + 1]; offset++) {
    const from = state.topo.nodeNeighbors[offset]; if (!state.alive[from]) continue;
    const candidate = ecologicalAccess(state, from, target);
    if (candidate.accessible) return candidate;
    if (fallback.reason === 'source-lacks-energy') fallback = candidate;
  }
  return fallback;
}
export function hasEcologicalGrowthCandidate(state, from) {
  if (state.alive[from] !== 1) return false;
  for (let offset = state.topo.nodeStart[from]; offset < state.topo.nodeStart[from + 1]; offset++) {
    const target = state.topo.nodeNeighbors[offset];
    if (!state.alive[target] && ecologicalAccess(state, from, target).accessible) return true;
  }
  return false;
}
function decision(accessible, reason, resourceRichness, minimumRequired, modifiers) { return { accessible, reason, resourceRichness, minimumRequired, modifiers }; }
function number(value) { return Number.isFinite(value) ? Math.max(0, value) : 0; }
const EMPTY = Object.freeze({});
