/**
 * Growth phase: frontier expansion. Alive nodes evaluate inactive neighbor
 * edges by local suitability, nutrient gradient, and crowding,
 * then expand probabilistically using the simulation RNG (fixed iteration
 * order keeps draws deterministic).
 */
import { BALANCE as B } from '../../game/balance.js';
import { clamp01, tolerance } from '../../core/math.js';
import { birthCell } from './cell-lifecycle.js';
import { REACH_CAUSE } from './reach-ledger.js';
import { BIOME_EFFECTS } from '../../world/fields.js';
import { ecologicalAccess } from './ecological-access.js';

const MOIST_CENTER = 0.55;
const TEMP_CENTER = 0.6;

/** @param {object} state */
export function runGrowth(state) {
  const { topo, fields } = state; const traits = state.activeTraits ?? state.traits;
  const { nodeStart, nodeEdges, nodeNeighbors } = topo;
  const { alive, biomass, energy, nutrient, moisture, temperature, toxicity,
    conductance, edgePeak, edgeActive, edgeAge, expansions, simRng } = state;

  expansions.fill(0);
  const cap = B.GROW_PER_NODE_CAP + traits.growthCap;
  const baseCost = B.GROW_COST * traits.growCost;
  const startCond = B.START_CONDUCTANCE;
  const moistW = MOIST_CENTER * 0.92 * traits.droughtTol;
  const tempW = 0.42 * traits.heatTol;

  for (let i = 0; i < topo.nodeCount; i++) {
    if (alive[i] !== 1 || energy[i] < baseCost) continue;

    const begin = nodeStart[i];
    const end = nodeStart[i + 1];

    // Crowding: alive neighbor count (degree <= 6, cheap).
    let crowd = 0;
    for (let o = begin; o < end; o++) crowd += alive[nodeNeighbors[o]];

    for (let o = begin; o < end; o++) {
      if (expansions[i] >= cap) break;
      const e = nodeEdges[o];
      if (edgeActive[e] === 1) continue;
      const nb = nodeNeighbors[o];
      if (alive[nb] === 1) continue;
      const access = ecologicalAccess(state, i, nb);
      if (!access.accessible) {
        const target = access.reason === 'habitat-capability-missing' ? state.habitatBlocked : state.resourceBlocked;
        target[nb] = Math.min(0xffff, target[nb] + 1);
        continue;
      }

      const suitNb = tolerance(moisture[nb], MOIST_CENTER, moistW)
        * tolerance(temperature[nb], TEMP_CENTER, tempW)
        * clamp01(1 - (toxicity[nb] / traits.toxinTol - 0.35) * 1.1);
      const grad = clamp01(nutrient[nb] * 1.6);
      const effectiveBiome = state.effectiveBiome[nb]; const transformed = effectiveBiome !== fields.biomeId[nb];
      const route = transformed ? BIOME_EFFECTS[effectiveBiome].routeCost : (fields.routeCost?.[nb] ?? 1);
      const growth = transformed ? BIOME_EFFECTS[effectiveBiome].growth : (fields.growthSuitability?.[nb] ?? 1);
      const ecology = state.ecology ?? EMPTY;
      const freshwater = access.modifiers.freshwater ?? 0;
      let ecologicalGrowth = 1 + Math.min(.14, freshwater * ecology.freshwaterSupport * .12);
      if (effectiveBiome === 0 || effectiveBiome === 1) ecologicalGrowth *= 1 + Math.min(.18, ecology.marineSupport * .12);
      if (access.reason === 'reachable-through-recycling') ecologicalGrowth *= .72;
      const cost = baseCost * route * (access.reason === 'reachable-through-recycling' ? 1.12 : 1);
      let p = B.GROW_P_BASE * traits.reach
        * growth * ecologicalGrowth
        * (0.25 + 0.75 * suitNb)
        * (0.18 + 0.82 * grad)
        * (1 - B.CROWDING_PENALTY * Math.max(0, crowd - 2));
      if (p <= 0) continue;

      if (simRng.chance(Math.min(p, 0.65)) && energy[i] >= cost) {
        energy[i] = Math.fround(energy[i] - cost);
        edgeActive[e] = 1;
        conductance[e] = Math.fround(startCond);
        if (conductance[e] > edgePeak[e]) edgePeak[e] = conductance[e];
        edgeAge[e] = 0;
        const reachCause = biomass[nb] > .01 ? REACH_CAUSE.REGROWTH : REACH_CAUSE.EXPANSION;
        birthCell(state, nb, reachCause); biomass[nb] = Math.fround(B.NEW_BIOMASS);
        energy[nb] = Math.fround(0.1);
        state.stress[nb] = 0;
        expansions[i]++;
      }
    }
  }
}
const EMPTY = Object.freeze({});
