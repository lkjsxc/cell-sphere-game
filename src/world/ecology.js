import { BIOME, FEATURE, WATER } from './constants.js';
import { smoothField, sphericalField } from './noise.js';

/** Correlate climate, soils, forests, biomes, and hazard exposure. */
export function createEcology(rng, topo, terrain, hydro) {
  const n = topo.nodeCount;
  const soil = smoothField(sphericalField(rng, topo.positions, n,
    { lobes: 10, sharpness: 3, signed: true }), topo, 1);
  const baseMoisture = new Float32Array(n); const baseTemp = new Float32Array(n);
  const baseNutrient = new Float32Array(n); const forestDensity = new Float32Array(n);
  const biomeId = new Uint8Array(n); const hazardSusceptibility = new Float32Array(n);
  const toxVuln = new Float32Array(n); const eventVuln = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const land = terrain.landMask[i];
    const height = land ? Math.max(0, (terrain.baseElevation[i] - terrain.seaLevel)
      / Math.max(0.05, 1 - terrain.seaLevel)) : 0;
    const latitude = Math.abs(topo.positions[i * 3 + 1]);
    const river = hydro.riverStrength[i]; const lake = hydro.lakeId[i] >= 0;
    const moisture = clamp(0.13 + hydro.rainfall[i] * 0.69
      + river * 0.14 + (lake ? 0.18 : 0) - height * 0.13);
    const temp = clamp(0.86 - latitude * 0.58 - height * 0.42
      + (soil[i] - 0.5) * 0.08);
    const nutrient = clamp(0.2 + soil[i] * 0.36 + moisture * 0.24
      + river * 0.14 + (terrain.coastDistance[i] < 0.05 ? 0.05 : 0));
    const warmth = Math.max(0, 1 - Math.abs(temp - 0.62) * 2.1);
    const forest = land && !lake ? clamp((moisture - 0.4) * 2.15 * warmth
      * (1 - Math.max(0, height - 0.55) * 1.7)) : 0;
    baseMoisture[i] = Math.fround(land ? moisture : Math.max(0.65, moisture));
    baseTemp[i] = Math.fround(temp);
    baseNutrient[i] = Math.fround(land ? nutrient : clamp(nutrient * 0.72));
    forestDensity[i] = Math.fround(forest);
    biomeId[i] = classifyBiome(i, height, terrain, hydro, moisture, temp, forest);
    const hazard = clamp(0.12 + terrain.ridgeStrength[i] * 0.28
      + (1 - moisture) * 0.25 + hydro.rainfall[i] * 0.12 + soil[i] * 0.18);
    hazardSusceptibility[i] = Math.fround(hazard);
    toxVuln[i] = Math.fround(clamp(0.18 + hazard * 0.62 + (1 - nutrient) * 0.16));
    eventVuln[i] = Math.fround(clamp(0.14 + hazard * 0.68 + latitude * 0.1));
    addFeatures(i, height, terrain, hydro.featureFlags, forest);
  }
  const regionId = regionsFor(biomeId, topo);
  return {
    baseMoisture, baseTemp, baseNutrient, forestDensity, biomeId,
    hazardSusceptibility, toxVuln, eventVuln, regionId,
  };
}

function classifyBiome(i, height, terrain, hydro, moisture, temp, forest) {
  if (!terrain.landMask[i]) return terrain.waterClass[i] === WATER.DEEP_OCEAN
    ? BIOME.DEEP_OCEAN : BIOME.SHALLOW_OCEAN;
  if (hydro.lakeId[i] >= 0 || (hydro.riverStrength[i] > 0.3 && moisture > 0.63)) return BIOME.WETLAND;
  if (temp < 0.15 || (height > 0.76 && temp < 0.25)) return BIOME.SNOW_ICE;
  if (temp < 0.29) return BIOME.TUNDRA;
  if (height > 0.72) return BIOME.MOUNTAIN;
  if (height > 0.55 || terrain.ridgeStrength[i] > 0.72) return BIOME.HIGHLAND;
  if (terrain.coastDistance[i] === 0) return BIOME.COAST;
  if (forest > 0.58) return moisture > 0.65 ? BIOME.WET_FOREST : BIOME.FOREST;
  if (forest > 0.34) return BIOME.FOREST;
  if (moisture < 0.29) return BIOME.DESERT;
  if (moisture < 0.45) return BIOME.DRY_GRASS;
  return BIOME.GRASS;
}

function addFeatures(i, height, terrain, flags, forest) {
  if (terrain.landMask[i] && terrain.coastDistance[i] === 0) flags[i] |= FEATURE.COAST;
  if (forest > 0.34) flags[i] |= FEATURE.FOREST;
  if (terrain.ridgeStrength[i] > 0.62) flags[i] |= FEATURE.RIDGE;
  if (height > 0.57) flags[i] |= FEATURE.HIGHLAND;
}

function regionsFor(biome, topo) {
  const ids = new Int16Array(biome.length); ids.fill(-1);
  const queue = new Int32Array(biome.length); let id = 0;
  for (let root = 0; root < biome.length; root++) {
    if (ids[root] >= 0) continue;
    let head = 0; let tail = 1; queue[0] = root; ids[root] = id;
    while (head < tail) {
      const cell = queue[head++];
      for (let p = topo.nodeStart[cell]; p < topo.nodeStart[cell + 1]; p++) {
        const next = topo.nodeNeighbors[p];
        if (ids[next] < 0 && biome[next] === biome[root]) {
          ids[next] = id; queue[tail++] = next;
        }
      }
    }
    id++;
  }
  return ids;
}

function clamp(value) { return Math.max(0, Math.min(1, value)); }
