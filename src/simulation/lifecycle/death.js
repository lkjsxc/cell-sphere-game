/**
 * Death phase: biomass shrink under stress/starvation, node death, edge
 * deactivation, detritus decay, and the terminal collapse cascade.
 */
import { BALANCE as B } from '../../game/balance.js';
import { killCell } from './cell-lifecycle.js';
import { REACH_CAUSE } from './reach-ledger.js';

/** @param {object} state */
export function runDeath(state) {
  const { topo } = state;
  const { alive, biomass, energy, stress } = state;

  for (let i = 0; i < topo.nodeCount; i++) {
    if (alive[i] !== 1) continue;

    let dying = false;
    if (stress[i] >= B.DEATH_STRESS) dying = true;
    else if (energy[i] < -0.5) dying = true;

    if (dying) {
      const shrink = biomass[i]
        * (B.STARVE_SHRINK + 0.05 * Math.max(0, stress[i] - 0.8) * 5);
      biomass[i] = Math.fround(Math.max(0, biomass[i] - shrink));
      state.causes[dominantCause(state, i)] += shrink;
    }

    // Cysts slow damage but never own sub-epsilon living authority.
    if (biomass[i] <= B.BIOMASS_EPS) { const cause = state.reachDamageCause[i] || reachCause(state, i); killCell(state, i, cause); state.reachDamageCause[i] = 0; }
  }

  reclaimDetritus(state);
  terminalCascade(state);
}

/** Environmental cause attribution for result explanations and trophies. */
function dominantCause(state, i) {
  if (state.temperature[i] > 0.82) return 'heat';
  if (state.temperature[i] < 0.22) return 'cold';
  if (state.moisture[i] < 0.2) return 'drought';
  if (state.toxicity[i] > 0.5) return 'toxin';
  if (state.nutrient[i] < 0.015 && state.resourceReserve[i] < 0.005) return 'resource-exhaustion';
  return 'maintenance-starvation';
}

function reachCause(state, cell) { const cause = dominantCause(state, cell);
  return cause === 'heat' ? REACH_CAUSE.HEAT : cause === 'cold' ? REACH_CAUSE.COLD
    : cause === 'drought' ? REACH_CAUSE.DROUGHT : cause === 'toxin' ? REACH_CAUSE.TOXIN
      : cause === 'resource-exhaustion' ? REACH_CAUSE.RESOURCE_EXHAUSTION : REACH_CAUSE.MAINTENANCE; }

/** Dead biomass decays without creating a second hidden resource economy. */
function reclaimDetritus(state) {
  const { alive, biomass } = state;
  for (let i = 0; i < state.topo.nodeCount; i++) {
    if (alive[i] === 1 || biomass[i] <= 0.02) continue;
    const decay = (biomass[i] - 0.02) * 0.01;
    if (decay > 0) biomass[i] = Math.fround(biomass[i] - decay);
  }
}

/** Deterministic terminal fade reaches zero by its authoritative deadline. */
function terminalCascade(state) {
  if (state.status !== 'terminal-collapse') return;
  const remaining = Math.max(1, state.terminalDeadline - state.tick + 1);
  const { alive, biomass } = state;
  for (let i = 0; i < state.topo.nodeCount; i++) {
    if (alive[i] !== 1) continue;
    const loss = biomass[i] / remaining;
    biomass[i] = Math.fround(Math.max(0, biomass[i] - loss));
    state.causes.collapse += loss;
    if (state.tick >= state.terminalDeadline || biomass[i] <= B.BIOMASS_EPS) killCell(state, i, REACH_CAUSE.COLLAPSE);
  }
}
