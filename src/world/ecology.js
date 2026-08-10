import { BIOME, BIOME_EFFECTS, FEATURE, WATER } from './constants.js';
import { smoothField, sphericalField } from './noise.js';

/** Correlate climate, lake influence, soils, forests, and biomes. */
export function createEcology(rng, topo, terrain, hydro) {
  const n = topo.nodeCount;
  const soil = smoothField(sphericalField(rng, topo.positions, n,
    { lobes: 10, sharpness: 3, signed: true }), topo, 1);
  const climate = smoothField(sphericalField(rng, topo.positions, n,
    { lobes: 7, sharpness: 2, signed: true }), topo, 2);
  const baseMoisture = new Float32Array(n); const baseTemp = new Float32Array(n);
  const baseNutrient = new Float32Array(n); const forestDensity = new Float32Array(n);
  const biomeId = new Uint8Array(n);
  const toxVuln = new Float32Array(n);
  const growthSuitability = new Float32Array(n); const maintenanceMultiplier = new Float32Array(n);
  const uptakeMultiplier = new Float32Array(n); const resourceRenewal = new Float32Array(n);
  const routeCost = new Float32Array(n);
  for (let cell = 0; cell < n; cell++) {
    const land = terrain.landMask[cell]; const lake = hydro.lakeId[cell] >= 0;
    const height = land ? Math.max(0, (terrain.baseElevation[cell] - terrain.seaLevel)
      / Math.max(.05, 1 - terrain.seaLevel)) : 0;
    const latitude = Math.abs(topo.positions[cell * 3 + 1]);
    const fresh = hydro.freshwaterInfluence[cell];
    const oceanInfluence = 1 - terrain.coastDistance[cell];
    let moisture = clamp(.18 + climate[cell] * .58 + oceanInfluence * .16
      + fresh * .24 - height * .11);
    if (lake) moisture = Math.max(moisture, .78 + fresh * .16);
    const temp = clamp(.86 - latitude * .58 - height * .42 + (soil[cell] - .5) * .08);
    const nutrient = clamp(.2 + soil[cell] * .36 + moisture * .24 + fresh * .14
      + (terrain.coastDistance[cell] < .05 ? .05 : 0));
    const warmth = Math.max(0, 1 - Math.abs(temp - .62) * 2.1);
    const wetland = Boolean(hydro.featureFlags[cell] & FEATURE.WETLAND);
    const forest = land && !lake && !wetland ? clamp((moisture - .4) * 2.15 * warmth
      * (1 - Math.max(0, height - .55) * 1.7)) : 0;
    baseMoisture[cell] = Math.fround(land ? moisture : Math.max(.65, moisture));
    baseTemp[cell] = Math.fround(temp);
    baseNutrient[cell] = Math.fround(land ? nutrient : clamp(nutrient * .72));
    forestDensity[cell] = Math.fround(forest);
    biomeId[cell] = classifyBiome(cell, height, terrain, hydro, moisture, temp, forest);
    const factor = BIOME_EFFECTS[biomeId[cell]];
    growthSuitability[cell] = factor.growth; maintenanceMultiplier[cell] = factor.maintenance;
    uptakeMultiplier[cell] = factor.uptake; resourceRenewal[cell] = factor.renewal; routeCost[cell] = factor.routeCost;
    const toxicityExposure = clamp(.12 + terrain.ridgeStrength[cell] * .28
      + (1 - moisture) * .25 + climate[cell] * .12 + soil[cell] * .18);
    toxVuln[cell] = Math.fround(clamp(.18 + toxicityExposure * .62 + (1 - nutrient) * .16));
    addFeatures(cell, height, terrain, hydro.featureFlags, forest);
  }
  const regionId = regionsFor(biomeId, topo);
  return {
    baseMoisture, baseTemp, baseNutrient, forestDensity, biomeId,
    toxVuln, regionId, growthSuitability,
    maintenanceMultiplier, uptakeMultiplier, resourceRenewal, routeCost,
  };
}

function classifyBiome(cell, height, terrain, hydro, moisture, temp, forest) {
  if (!terrain.landMask[cell]) return terrain.waterClass[cell] === WATER.DEEP_OCEAN
    ? BIOME.DEEP_OCEAN : BIOME.SHALLOW_OCEAN;
  if (hydro.lakeId[cell] >= 0) return BIOME.LAKE;
  if (hydro.featureFlags[cell] & FEATURE.WETLAND) return BIOME.WETLAND;
  if (temp < .15 || height > .76 && temp < .25) return BIOME.SNOW_ICE;
  if (temp < .29) return BIOME.TUNDRA;
  if (height > .72) return BIOME.MOUNTAIN;
  if (height > .55 || terrain.ridgeStrength[cell] > .72) return BIOME.HIGHLAND;
  if (terrain.coastDistance[cell] === 0) return BIOME.COAST;
  if (forest > .58) return moisture > .65 ? BIOME.WET_FOREST : BIOME.FOREST;
  if (forest > .34) return BIOME.FOREST;
  if (moisture < .29) return BIOME.DESERT;
  if (moisture < .45) return BIOME.DRY_GRASS;
  return BIOME.GRASS;
}

function addFeatures(cell, height, terrain, flags, forest) {
  if (terrain.landMask[cell] && terrain.coastDistance[cell] === 0) flags[cell] |= FEATURE.COAST;
  if (forest > .34) flags[cell] |= FEATURE.FOREST;
  if (terrain.ridgeStrength[cell] > .62) flags[cell] |= FEATURE.RIDGE;
  if (height > .57) flags[cell] |= FEATURE.HIGHLAND;
}

function regionsFor(biome, topo) {
  const ids = new Int16Array(biome.length); ids.fill(-1);
  const queue = new Int32Array(biome.length); let id = 0;
  for (let root = 0; root < biome.length; root++) {
    if (ids[root] >= 0) continue;
    let head = 0; let tail = 1; queue[0] = root; ids[root] = id;
    while (head < tail) { const cell = queue[head++];
      for (let offset = topo.nodeStart[cell]; offset < topo.nodeStart[cell + 1]; offset++) {
        const next = topo.nodeNeighbors[offset];
        if (ids[next] < 0 && biome[next] === biome[root]) { ids[next] = id; queue[tail++] = next; }
      }
    }
    id++;
  }
  return ids;
}
function clamp(value) { return Math.max(0, Math.min(1, value)); }
