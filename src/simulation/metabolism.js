/**
 * Metabolism phase: uptake, conversion, maintenance, stress.
 * Runs every tick over alive nodes only.
 */
import { BALANCE as B } from '../game/balance.js';
import { clamp01, tolerance } from '../core/math.js';
import { BIOME, BIOME_EFFECTS } from '../world/fields.js';
import { consumeFounderFreshwater, consumeFreshwaterCatchment, consumeNutrient, freshwaterSupportAt } from './resource-ecology.js';

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

    const active = state.activeBuildIdSet;
    const biome = state.effectiveBiome[i]; const transformed = biome !== fields.biomeId[i];
    const biomeUptake = transformed ? BIOME_EFFECTS[biome].uptake : (fields.uptakeMultiplier?.[i] ?? 1);
    let domainUptake = 1;
    if (active.has('rich-rush') && state.resourceRichness[i] >= .72) domainUptake *= 1.18;
    if (active.has('lake-garden') && freshwaterSupportAt(state, i) > .2) domainUptake *= 1.12;
    if (active.has('brine-harvester') && (biome === BIOME.SHALLOW_OCEAN || biome === BIOME.LAKE)) domainUptake *= 1.15;
    if (active.has('pelagic-colony') && biome === BIOME.DEEP_OCEAN) domainUptake *= 1.22;
    // Uptake remains finite: all domain bonuses draw from the same local stock.
    const rate = B.UPTAKE_RATE * state.biomass[i] * (0.15 + 0.85 * suit) * traits.uptake * biomeUptake * domainUptake;
    const uptake = consumeNutrient(state, i, rate);

    const gain = uptake * B.CONVERSION;
    state.energy[i] = Math.fround(Math.min(energyCap, state.energy[i] + gain));

    const biomeMaintenance = transformed ? BIOME_EFFECTS[biome].maintenance : (fields.maintenanceMultiplier?.[i] ?? 1);
    const freshwater = freshwaterSupportAt(state, i);
    let domainMaintenance = 1 - freshwater * .60;
    if (active.has('circular-biosphere')) domainMaintenance *= .94;
    if (active.has('wasteland-reclaimer')) domainMaintenance *= .96;
    if (active.has('cold-dormancy') && state.temperature[i] < .32) domainMaintenance *= .68;
    if (active.has('polar-current') && state.temperature[i] < .36 && biome <= BIOME.SHALLOW_OCEAN) domainMaintenance *= .72;
    if (state.electricityQ[i] > 32) domainMaintenance *= 1 - Math.min(.12, state.electricityQ[i] / 255 * .12);
    if (active.has('rich-rush')) domainMaintenance *= 1.07;
    const maintDemand = B.MAINTENANCE_RATE * state.biomass[i]
      * (1 + e * B.MAINTENANCE_ENTROPY) * traits.maintenance * biomeMaintenance * domainMaintenance;
    const catchmentEnergy = consumeFreshwaterCatchment(state, i, maintDemand * freshwater * .62);
    const remainingDemand = Math.max(0, maintDemand - catchmentEnergy);
    const founderEnergy = consumeFounderFreshwater(state,
      remainingDemand * Math.min(.82, state.inoculationFreshwaterSupport * 1.32));
    const maint = Math.max(0, remainingDemand - founderEnergy);
    state.energy[i] = Math.fround(state.energy[i] - maint);

    state.totalUptake += uptake;
    state.totalMaintenance += maint;

    const resist = traits.stressResist;
    const gainRate = germinating ? B.STRESS_GAIN * 0.3 : B.STRESS_GAIN;
    const founderWater = state.initialFounderFreshwaterReserve > 0
      ? state.inoculationFreshwaterSupport * Math.min(1, state.founderFreshwaterReserve / state.initialFounderFreshwaterReserve) : 0;
    const next = state.stress[i]
      + (gainRate * (1 - suit) * (1 - freshwater * .65) * (1 - founderWater * .72)) / resist
      - B.STRESS_RECOVER * suit * (1 + freshwater * .25 + founderWater * .12);
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
