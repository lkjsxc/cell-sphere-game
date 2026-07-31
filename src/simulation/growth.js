/**
 * Growth phase: frontier expansion. Alive nodes evaluate inactive neighbor
 * edges by local suitability, nutrient gradient, signal bias, and crowding,
 * then expand probabilistically using the simulation RNG (fixed iteration
 * order keeps draws deterministic).
 */
import { BALANCE as B } from '../game/balance.js';
import { clamp01, tolerance } from '../core/math.js';

const MOIST_CENTER = 0.55;
const TEMP_CENTER = 0.6;

/** @param {object} state */
export function runGrowth(state) {
  const { topo, traits } = state;
  const { nodeStart, nodeEdges, nodeNeighbors } = topo;
  const { alive, biomass, energy, nutrient, moisture, temperature, toxicity,
    signal, conductance, edgeActive, edgeAge, expansions, simRng } = state;

  expansions.fill(0);
  const cap = B.GROW_PER_NODE_CAP + traits.growthCap + (traits.fractalFrontier ? 1 : 0);
  const cost = B.GROW_COST * traits.growCost;
  const startCond = B.START_CONDUCTANCE * (traits.fractalFrontier ? 0.75 : 1);
  const moistW = MOIST_CENTER * 0.92 * traits.droughtTol;
  const tempW = 0.42 * traits.heatTol;

  for (let i = 0; i < topo.nodeCount; i++) {
    if (alive[i] !== 1 || energy[i] < cost) continue;

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

      const suitNb = tolerance(moisture[nb], MOIST_CENTER, moistW)
        * tolerance(temperature[nb], TEMP_CENTER, tempW)
        * clamp01(1 - (toxicity[nb] / traits.toxinTol - 0.35) * 1.1);
      const grad = clamp01(nutrient[nb] * 1.6);
      const sig = signal[nb] * B.SIGNAL_BIAS;
      let p = B.GROW_P_BASE * traits.reach
        * (0.25 + 0.75 * suitNb)
        * (0.3 + 0.7 * grad)
        * (1 + sig)
        * (1 - B.CROWDING_PENALTY * Math.max(0, crowd - 2));
      // Migratory core favors reclaiming dead-but-rich ground.
      if (traits.migratoryCore && biomass[nb] > 0.01) p *= 1.5;
      if (p <= 0) continue;

      if (simRng.chance(Math.min(p, 0.65)) && energy[i] >= cost) {
        energy[i] = Math.fround(energy[i] - cost);
        edgeActive[e] = 1;
        conductance[e] = Math.fround(startCond);
        edgeAge[e] = 0;
        alive[nb] = 1;
        biomass[nb] = Math.fround(B.NEW_BIOMASS);
        energy[nb] = Math.fround(0.1);
        state.stress[nb] = 0;
        state.aliveCount++;
        expansions[i]++;
      }
    }
  }
}
