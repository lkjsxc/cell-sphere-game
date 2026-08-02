/**
 * Death phase: biomass shrink under stress/starvation, node death, edge
 * deactivation, detritus decay and reclamation, local sacrifice, dormant
 * cysts, and the terminal collapse cascade.
 */
import { BALANCE as B } from '../game/balance.js';

/** @param {object} state */
export function runDeath(state) {
  const { topo } = state; const traits = state.activeTraits ?? state.traits;
  const { alive, biomass, energy, stress } = state;

  for (let i = 0; i < topo.nodeCount; i++) {
    if (alive[i] !== 1) continue;

    let dying = false;
    if (stress[i] >= B.DEATH_STRESS) dying = true;
    else if (energy[i] < -0.5) dying = true;

    // Local sacrifice: shed the weakest vein to relieve stress.
    if (dying && traits.localSacrifice && biomass[i] > 0.3 && stress[i] < 1.6) {
      if (pruneWeakestEdge(state, i)) {
        stress[i] = Math.fround(Math.max(0, stress[i] - 0.25));
        energy[i] = Math.fround(energy[i] + 0.1);
        dying = false;
      }
    }

    if (dying) {
      const shrink = biomass[i]
        * (B.STARVE_SHRINK + 0.05 * Math.max(0, stress[i] - 0.8) * 5);
      biomass[i] = Math.fround(Math.max(0, biomass[i] - shrink));
      state.causes[dominantCause(state, i)] += shrink;
    }

    // Dormant cysts: low-stress tissue clings on during terminal pressure.
    let eps = B.BIOMASS_EPS;
    if (traits.dormantCysts && state.entropy > 0.8 && stress[i] < 0.5) eps *= 0.3;

    if (biomass[i] <= eps) killNode(state, i);
  }

  reclaimDetritus(state);
  terminalCascade(state);
}

/** Deactivate the lowest-conductance active edge of node i. */
function pruneWeakestEdge(state, i) {
  const { nodeStart, nodeEdges } = state.topo;
  const { edgeActive, conductance, flux } = state;
  const begin = nodeStart[i];
  const end = nodeStart[i + 1];
  let weakest = -1;
  let weakestCond = Infinity;
  for (let o = begin; o < end; o++) {
    const e = nodeEdges[o];
    if (edgeActive[e] === 1 && conductance[e] < weakestCond) {
      weakestCond = conductance[e];
      weakest = e;
    }
  }
  if (weakest < 0) return false;
  edgeActive[weakest] = 0;
  flux[weakest] = 0;
  return true;
}

/** Environmental cause attribution for result explanations and trophies. */
function dominantCause(state, i) {
  if (state.temperature[i] > 0.82) return 'heat';
  if (state.temperature[i] < 0.22) return 'cold';
  if (state.moisture[i] < 0.2) return 'drought';
  if (state.toxicity[i] > 0.5) return 'toxin';
  return 'starvation';
}

function killNode(state, i) {
  state.alive[i] = 0;
  state.aliveCount--;
  // Leave a thin detritus trace for reclamation visuals.
  if (state.biomass[i] < 0.02) state.biomass[i] = Math.fround(0.02);
  const { nodeStart, nodeEdges } = state.topo;
  const { edgeActive, flux } = state;
  for (let o = nodeStart[i]; o < nodeStart[i + 1]; o++) {
    const e = nodeEdges[o];
    edgeActive[e] = 0;
    flux[e] = 0;
  }
}

/** Dead biomass decays; cannibal strains feed nearby living tissue. */
function reclaimDetritus(state) {
  const { topo } = state; const traits = state.activeTraits ?? state.traits;
  const { alive, biomass, energy } = state;
  const { nodeStart, nodeNeighbors } = topo;
  const rate = 0.01 + (traits.cannibal ? 0.05 : 0);
  for (let i = 0; i < topo.nodeCount; i++) {
    if (alive[i] === 1 || biomass[i] <= 0.02) continue;
    const decay = (biomass[i] - 0.02) * rate;
    if (decay <= 0) continue;
    biomass[i] = Math.fround(biomass[i] - decay);
    if (traits.cannibal) {
      for (let o = nodeStart[i]; o < nodeStart[i + 1]; o++) {
        const nb = nodeNeighbors[o];
        if (alive[nb] === 1) {
          energy[nb] = Math.fround(energy[nb] + decay * 0.6);
          break;
        }
      }
    }
  }
}

/** Hard ceiling: after the run ceiling, collapse converts power to score. */
function terminalCascade(state) {
  if (state.tick <= B.RUN_CEILING_TICKS) return;
  const over = (state.tick - B.RUN_CEILING_TICKS) / 400;
  const k = B.COLLAPSE_KILL_RATE * (1 + over);
  const { alive, biomass } = state;
  for (let i = 0; i < state.topo.nodeCount; i++) {
    if (alive[i] !== 1) continue;
    const loss = biomass[i] * k;
    biomass[i] = Math.fround(Math.max(0, biomass[i] - loss));
    state.causes.collapse += loss;
    if (biomass[i] <= B.BIOMASS_EPS) killNode(state, i);
  }
}
