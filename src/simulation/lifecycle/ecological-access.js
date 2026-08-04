/** Pure habitat + local-resource access decision used before growth RNG. */
import { clamp01, tolerance } from '../../core/math.js';
import { RESOURCE_STATE, freshwaterSupportAt, resourceRichnessAt } from '../resource-ecology.js';
import { habitatAccess } from '../habitats.js';

export const FRESH_RESOURCE_FLOOR = .565;
const MOIST_CENTER = .55; const TEMP_CENTER = .6;

export function ecologicalAccess(state, from, target) {
  const habitat = habitatAccess(state, from, target);
  const richness = resourceRichnessAt(state, target);
  const effects = state.buildEffects ?? {};
  const active = state.activeBuildIdSet ?? EMPTY;
  if (!habitat.accessible) return decision(false, 'habitat-capability-missing', richness,
    FRESH_RESOURCE_FLOOR, { capability: habitat.capability, skill: habitat.skill });

  const freshwater = freshwaterSupportAt(state, target);
  const scarcity = effect(effects, 'resourceFloorReduction', 'scarcityFloorReduction', 'poorCellAccess');
  const reclamation = effect(effects, 'reclamationAccess', 'depletedCellAccess', 'wastelandReclamation')
    || active.has('wasteland-reclaimer') || active.has('depletion-bloom') || active.has('circular-biosphere');
  const gardener = active.has('world-gardener') || effect(effects, 'worldGardener', 'reachAccess');
  const richRush = active.has('rich-rush') || effect(effects, 'richRush');
  const freshwaterRoute = freshwater > .2 && (active.has('lake-garden') || active.has('lake-to-light-network')
    || effect(effects, 'freshwaterAccess', 'freshwaterRenewal'));
  const marineRoute = active.has('pelagic-colony') || active.has('brine-harvester') || active.has('polar-current');
  const minimum = clamp01(FRESH_RESOURCE_FLOOR + (richRush ? .035 : 0)
    - Math.min(.28, numeric(scarcity)) - Math.min(.04, freshwater * .05)
    - (freshwaterRoute ? Math.min(.08, freshwater * .1) : 0)
    - (gardener ? .18 : 0) - (marineRoute && habitat.capability ? .08 : 0));

  const stateCode = state.resourceState?.[target] ?? RESOURCE_STATE.UNKNOWN;
  if (stateCode === RESOURCE_STATE.EXHAUSTED && !reclamation && !gardener) {
    return decision(false, 'cell-exhausted', richness, minimum, modifiers());
  }
  const reclamationFloor = gardener ? .04 : Math.max(.10, minimum - .20);
  if (richness < minimum && !(reclamation && richness >= reclamationFloor)) {
    return decision(false, 'resource-richness-below-niche-floor', richness, minimum, modifiers());
  }

  const traits = state.activeTraits ?? state.traits;
  const moistW = MOIST_CENTER * .92 * traits.droughtTol;
  const tempW = .42 * traits.heatTol;
  const climate = tolerance(state.moisture[target], MOIST_CENTER, moistW)
    * tolerance(state.temperature[target], TEMP_CENTER, tempW)
    * clamp01(1 - (state.toxicity[target] / traits.toxinTol - .35) * 1.1);
  const coldRoute = active.has('cold-dormancy') || active.has('polar-current') || effect(effects, 'coldAccess', 'coldDormancy');
  if (climate < (gardener ? 0 : coldRoute ? .035 : .10) && state.tick >= 150) {
    return decision(false, 'climate-outside-current-tolerance', richness, minimum, { ...modifiers(), climate });
  }
  if (Number.isInteger(from) && from >= 0 && state.energy[from] <= 0) {
    return decision(false, 'source-lacks-energy', richness, minimum, modifiers());
  }
  return decision(true, reclamation && richness < minimum ? 'reachable-through-reclamation'
    : freshwaterRoute && richness < FRESH_RESOURCE_FLOOR ? 'reachable-through-freshwater-support'
      : habitat.capability ? 'transformed-habitat-access' : 'rich-niche-access', richness, minimum, modifiers());

  function modifiers() { return Object.freeze({ freshwater, scarcityReduction: Math.min(.28, numeric(scarcity)),
    reclamation: Boolean(reclamation), gardener: Boolean(gardener), richRush: Boolean(richRush) }); }
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

function decision(accessible, reason, resourceRichness, minimumRequired, modifiers) {
  return Object.freeze({ accessible, reason, resourceRichness, minimumRequired, modifiers: Object.freeze(modifiers) });
}
function effect(effects, ...keys) { for (const key of keys) if (effects[key]) return effects[key]; return 0; }
function numeric(value) { return value === true ? .12 : Number.isFinite(value) ? Math.max(0, value) : 0; }
const EMPTY = new Set();
