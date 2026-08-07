/**
 * Transport phase: one relaxation pass of energy flow along active edges,
 * then conductance reinforcement, decay, pruning, and reconnection.
 *
 * This is a stylized local transport model, not a biological claim: useful
 * flux thickens veins, idle veins decay, and evolved severed routes can
 * regrow between living tissue.
 */
import { BALANCE as B } from '../game/balance.js';
import { clamp } from '../core/math.js';

/** @param {object} state */
export function runTransport(state) {
  const { topo, fields } = state; const traits = state.activeTraits ?? state.traits;
  const { edgeA, edgeB, edgeCount, nodeCount } = topo;
  const { pressure, nextEnergy, energy, alive, conductance, edgePeak, flux, edgeActive, edgeAge } = state;

  // Pressure field from stored energy.
  for (let i = 0; i < nodeCount; i++) {
    pressure[i] = alive[i] === 1 ? energy[i] * B.PRESSURE_SCALE : 0;
  }
  nextEnergy.set(energy);

  const k = B.TRANSPORT_K * traits.conductance;
  const regrow = traits.anastomosis + Math.max(0, traits.regrow - 1) * 10;

  for (let e = 0; e < edgeCount; e++) {
    if (edgeActive[e] !== 1) {
      // Reconnection: living tissue on both sides slowly regrows a vein.
      if (regrow > 0 && alive[edgeA[e]] === 1 && alive[edgeB[e]] === 1) {
        conductance[e] = Math.fround(conductance[e] + 0.004 * regrow);
        if (conductance[e] > edgePeak[e]) edgePeak[e] = conductance[e];
        if (conductance[e] > B.COND_PRUNE_MIN * 1.5) {
          edgeActive[e] = 1;
          edgeAge[e] = 0;
        }
      } else {
        conductance[e] = 0;
        flux[e] = 0;
      }
      continue;
    }
    const a = edgeA[e];
    const b = edgeB[e];
    const terrainFlow = 2 / ((fields.routeCost?.[a] ?? 1) + (fields.routeCost?.[b] ?? 1));
    const f = conductance[e] * (pressure[a] - pressure[b]) * k * terrainFlow;
    flux[e] = Math.fround(f);
    nextEnergy[a] -= f;
    nextEnergy[b] += f;
  }

  for (let i = 0; i < nodeCount; i++) {
    energy[i] = Math.fround(nextEnergy[i] < -1 ? -1 : nextEnergy[i]);
  }

  // Reinforcement, decay, pruning.
  const reinforce = B.REINFORCE_K * traits.reinforce * (traits.redundantLoops ? 1.3 : 1);
  const environmentCoefficients = state.environmentCoefficients ?? state.currentEnvironmentProfile?.coefficients ?? {};
  const transportStress = environmentCoefficients.transportStressScale ?? 1;
  const decay = B.CONDUCTANCE_DECAY * (traits.redundantLoops ? 0.6 : 1) * transportStress;
  for (let e = 0; e < edgeCount; e++) {
    if (edgeActive[e] !== 1) continue;
    const bothAlive = alive[edgeA[e]] === 1 && alive[edgeB[e]] === 1;
    const useful = Math.abs(flux[e]) * (bothAlive ? 1 : 0.2);
    conductance[e] = Math.fround(clamp(conductance[e] + reinforce * useful - decay, 0, B.COND_MAX));
    if (conductance[e] > edgePeak[e]) edgePeak[e] = conductance[e];
    edgeAge[e] = edgeAge[e] === 65535 ? 65535 : edgeAge[e] + 1;
    if (conductance[e] < B.COND_PRUNE_MIN && edgeAge[e] > B.PRUNE_AGE_TICKS) {
      edgeActive[e] = 0;
      flux[e] = 0;
    }
  }
}
