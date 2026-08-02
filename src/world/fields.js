/** Deterministic graph-native world model composed from isolated RNG streams. */
import { deriveWorldStreams } from './noise.js';
import { createTerrain } from './terrain.js';
import { createHydrology } from './hydrology.js';
import { createEcology } from './ecology.js';
import { createFeatures } from './features.js';

export { ARCHETYPE, BIOME, FEATURE, LANDMARK, WATER } from './constants.js';

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
    seaLevel: terrain.seaLevel,
    landMask: terrain.landMask,
    waterClass: terrain.waterClass,
    altitude: terrain.altitude,
    baseElevation: terrain.baseElevation,
    filledElevation: hydro.filledElevation,
    oceanDepth: terrain.oceanDepth,
    coastDistance: terrain.coastDistance,
    drainTo: hydro.drainTo,
    flowAccumulation: hydro.flowAccumulation,
    riverOrder: hydro.riverOrder,
    riverStrength: hydro.riverStrength,
    lakeId: hydro.lakeId,
    rainfall: hydro.rainfall,
    baseMoisture: ecology.baseMoisture,
    baseTemp: ecology.baseTemp,
    baseNutrient: ecology.baseNutrient,
    forestDensity: ecology.forestDensity,
    biomeId: ecology.biomeId,
    ridgeStrength: terrain.ridgeStrength,
    hazardSusceptibility: ecology.hazardSusceptibility,
    featureFlags: hydro.featureFlags,
    regionId: ecology.regionId,
    toxVuln: ecology.toxVuln,
    eventVuln: ecology.eventVuln,
    landmarks: features.landmarks,
    sources: features.sources,
  });
}

/** @typedef {ReturnType<typeof createFields>} Fields */
