/**
 * Metabolism phase: uptake, conversion, maintenance, stress.
 * Runs every tick over alive nodes only.
 */
import { BALANCE as B } from '../game/balance.js';
import { clamp01, tolerance } from '../core/math.js';

const MOIST_CENTER = 0.55;
const TEMP_CENTER = 0.6;

/** @param {object} state */
export function runMetabolism(state) {
  const { topo, fields } = state; const traits = state.activeTraits ?? state.traits;
  const N = topo.nodeCount;
  const e = state.entropy;
  const moistW = MOIST_CENTER * 0.92 * traits.droughtTol;
  const tempW = 0.42 * traits.heatTol;
  const reserveBonus = traits.coldReserve && state.tick < 1650 ? 1.5 : 1;
  const energyCap = B.ENERGY_CAP * traits.energyCap * reserveBonus;

  for (let i = 0; i < N; i++) {
    if (state.alive[i] !== 1) continue;

    const suitM = tolerance(state.moisture[i], MOIST_CENTER, moistW);
    const suitT = tolerance(state.temperature[i], TEMP_CENTER, tempW);
    const toxLoad = state.toxicity[i] / traits.toxinTol;
    const toxF = clamp01(1 - (toxLoad - 0.35) * 1.1);
    let suit = suitM * suitT * toxF;

    // Germination grace: the first 15 game seconds are forgiving so a new
    // player always sees the organism bloom.
    const germinating = state.tick < 150;
    if (germinating && suit < 0.35) suit = 0.35;

    // Adaptive membrane: accumulated exposure raises effective suitability.
    if (traits.adaptiveMembrane) {
      const m = state.membrane[i];
      state.membrane[i] = Math.fround(Math.min(0.35, m + (1 - suit) * 0.0008));
      suit = clamp01(suit + state.membrane[i]);
    }

    // Uptake: opportunistic strains exploit temporary blooms.
    let rate = B.UPTAKE_RATE * state.biomass[i] * (0.15 + 0.85 * suit) * traits.uptake
      * (fields.uptakeMultiplier?.[i] ?? 1);
    if (traits.opportunisticUptake
      && state.nutrient[i] > fields.baseNutrient[i] + 0.05) {
      rate *= 1.5;
    }
    const uptake = Math.min(state.nutrient[i], rate);
    state.nutrient[i] = Math.fround(state.nutrient[i] - uptake);

    let gain = uptake * B.CONVERSION;
    if (traits.toxinCatalysis && state.toxicity[i] > 0.05) {
      gain += state.toxicity[i] * 0.012 * state.biomass[i];
      state.toxicity[i] = Math.fround(Math.max(0, state.toxicity[i] - 0.006));
    }
    state.energy[i] = Math.fround(Math.min(energyCap, state.energy[i] + gain));

    const maint = B.MAINTENANCE_RATE * state.biomass[i]
      * (1 + e * B.MAINTENANCE_ENTROPY) * traits.maintenance
      * (fields.maintenanceMultiplier?.[i] ?? 1);
    state.energy[i] = Math.fround(state.energy[i] - maint);

    state.totalUptake += uptake;
    state.totalMaintenance += maint;

    const resist = traits.stressResist * (1 + (traits.adaptiveMembrane ? state.membrane[i] : 0));
    const gainRate = germinating ? B.STRESS_GAIN * 0.3 : B.STRESS_GAIN;
    const next = state.stress[i]
      + (gainRate * (1 - suit)) / resist
      - B.STRESS_RECOVER * suit;
    state.stress[i] = Math.fround(clamp01(next));

    // Maturity: surplus energy thickens living tissue (capped), which in
    // turn raises uptake — the visible "reinforced cord" feedback.
    if (state.energy[i] > 1.5 && state.biomass[i] < B.BIOMASS_MAX) {
      const grow = Math.min(state.energy[i] - 1.5, 0.5) * 0.045;
      state.biomass[i] = Math.fround(Math.min(B.BIOMASS_MAX, state.biomass[i] + grow));
      state.energy[i] = Math.fround(state.energy[i] - grow);
    }
  }
}
