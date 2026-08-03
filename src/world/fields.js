/** Deterministic graph-native world model composed from isolated RNG streams. */
import { deriveWorldStreams } from './noise.js';
import { createTerrain } from './terrain.js';
import { createHydrology } from './hydrology.js';
import { createEcology } from './ecology.js';
import { createFeatures } from './features.js';
import { ARCHETYPE_NAME } from './constants.js';

export { ARCHETYPE, ARCHETYPE_NAME, BIOME, BIOME_EFFECTS, FEATURE, LANDMARK, WATER } from './constants.js';

/**
 * Preserve the original entry point while returning explicit living geography.
 * @param {import('../core/prng.js').Rng} rng
 * @param {import('./icosphere.js').Topology} topo
 */
export function createFields(rng, topo) {
  const [terrainRng, waterRng, ecologyRng, featureRng] = deriveWorldStreams(rng);
  const terrain = createTerrain(terrainRng, topo);
  const hydro = createHydrology(waterRng, topo, terrain);
  const ecology = createEcology(ecologyRng, topo, terrain, hydro);
  const features = createFeatures(featureRng, topo, terrain, hydro, ecology);
  return Object.freeze({
    archetype: terrain.archetype,
    archetypeName: ARCHETYPE_NAME[terrain.archetype],
    seaLevel: terrain.seaLevel,
    landMask: terrain.landMask,
    waterClass: terrain.waterClass,
    altitude: terrain.altitude,
    baseElevation: terrain.baseElevation,
    oceanDepth: terrain.oceanDepth,
    coastDistance: terrain.coastDistance,
    lakeId: hydro.lakeId,
    lakeDepth: hydro.lakeDepth,
    lakeShore: hydro.lakeShore,
    freshwaterInfluence: hydro.freshwaterInfluence,
    lakes: hydro.lakes,
    baseMoisture: ecology.baseMoisture,
    baseTemp: ecology.baseTemp,
    baseNutrient: ecology.baseNutrient,
    forestDensity: ecology.forestDensity,
    biomeId: ecology.biomeId,
    ridgeStrength: terrain.ridgeStrength,
    hazardSusceptibility: ecology.hazardSusceptibility,
    growthSuitability: ecology.growthSuitability,
    maintenanceMultiplier: ecology.maintenanceMultiplier,
    uptakeMultiplier: ecology.uptakeMultiplier,
    resourceRenewal: ecology.resourceRenewal,
    routeCost: ecology.routeCost,
    featureFlags: hydro.featureFlags,
    regionId: ecology.regionId,
    toxVuln: ecology.toxVuln,
    eventVuln: ecology.eventVuln,
    landmarks: features.landmarks,
    sources: features.sources,
  });
}

/** @typedef {ReturnType<typeof createFields>} Fields */
