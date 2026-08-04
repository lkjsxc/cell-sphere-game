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

    // Uptake remains an innate ecology rule plus permanent Evolution effects.
    const rate = B.UPTAKE_RATE * state.biomass[i] * (0.15 + 0.85 * suit) * traits.uptake
      * (fields.uptakeMultiplier?.[i] ?? 1);
    const uptake = Math.min(state.nutrient[i], rate);
    state.nutrient[i] = Math.fround(state.nutrient[i] - uptake);

    const gain = uptake * B.CONVERSION;
    state.energy[i] = Math.fround(Math.min(energyCap, state.energy[i] + gain));

    const maint = B.MAINTENANCE_RATE * state.biomass[i]
      * (1 + e * B.MAINTENANCE_ENTROPY) * traits.maintenance
      * (fields.maintenanceMultiplier?.[i] ?? 1);
    state.energy[i] = Math.fround(state.energy[i] - maint);

    state.totalUptake += uptake;
    state.totalMaintenance += maint;

    const resist = traits.stressResist;
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
