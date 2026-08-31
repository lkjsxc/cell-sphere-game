/** Pure fixed-field scores, graph diagnostics, and compact layout projections. */
import { BIOME, FEATURE, WATER } from '../../world/constants.js';
import { EVOLUTION_DOMAINS } from './catalog.js';
import { EVOLUTION_TOPOLOGY_LEVEL } from './topology.js';

const GREEN_BIOMES = new Set([BIOME.FOREST, BIOME.WET_FOREST, BIOME.GRASS, BIOME.WETLAND]);
const DOMAIN_INDEX = new Map(EVOLUTION_DOMAINS.map((domain, index) => [domain, index]));

export const EVOLUTION_REGION_EDGE = Object.freeze({ INTERNAL: 0, ARCHETYPE: 1, DOMAIN: 2 });

export function buildDomainSuitability(topology, fields) {
  const result = EVOLUTION_DOMAINS.map(() => new Float32Array(topology.nodeCount));
  for (let cell = 0; cell < topology.nodeCount; cell++) {
    let greenNeighbors = 0;
    for (let offset = topology.nodeStart[cell]; offset < topology.nodeStart[cell + 1]; offset++) {
      if (isGreenLand(fields, topology.nodeNeighbors[offset])) greenNeighbors++;
    }
    const land = fields.landMask[cell] ? 1 : 0; const green = isGreenLand(fields, cell) ? 1 : 0;
    const growth = clamp01(fields.growthSuitability[cell]); const nutrient = clamp01(fields.baseNutrient[cell]);
    const moisture = clamp01(fields.baseMoisture[cell]); const cold = 1 - clamp01(fields.baseTemp[cell]);
    const forest = clamp01(fields.forestDensity[cell]); const freshwater = clamp01(fields.freshwaterInfluence[cell]);
    const ridge = clamp01(fields.ridgeStrength[cell]); const altitude = clamp01(fields.altitude[cell]);
    const nearCoast = 1 - clamp01(fields.coastDistance[cell]); const lake = fields.waterClass[cell] === WATER.LAKE ? 1 : 0;
    const ocean = fields.waterClass[cell] === WATER.DEEP_OCEAN || fields.waterClass[cell] === WATER.SHALLOW_OCEAN ? 1 : 0;
    const shallow = fields.waterClass[cell] === WATER.SHALLOW_OCEAN ? 1 : 0;
    const wetland = fields.biomeId[cell] === BIOME.WETLAND ? 1 : 0;
    const dry = fields.biomeId[cell] === BIOME.DRY_GRASS || fields.biomeId[cell] === BIOME.DESERT ? 1 : 0;
    const frozen = [BIOME.TUNDRA, BIOME.SNOW_ICE, BIOME.HIGHLAND, BIOME.MOUNTAIN].includes(fields.biomeId[cell]) ? 1 : 0;
    const coast = fields.biomeId[cell] === BIOME.COAST || (fields.featureFlags[cell] & FEATURE.COAST) ? 1 : 0;
    const lakeShore = fields.lakeShore[cell] ? 1 : 0; const greenRing = greenNeighbors / topology.degree[cell];
    result[DOMAIN_INDEX.get('Foundation')][cell] = clamp01(.18 * land + .24 * green + .20 * growth
      + .13 * nutrient + .10 * moisture + .15 * greenRing);
    result[DOMAIN_INDEX.get('Fertility')][cell] = clamp01(.15 * land + .40 * green + .20 * growth
      + .08 * nutrient + .05 * moisture + .07 * forest + .05 * wetland);
    result[DOMAIN_INDEX.get('Freshwater')][cell] = clamp01(.55 * freshwater + .15 * lake + .10 * lakeShore
      + .08 * wetland + .05 * moisture + .04 * coast + .03 * nearCoast);
    result[DOMAIN_INDEX.get('Scarcity')][cell] = clamp01(.45 * (1 - moisture) + .20 * dry + .10 * land
      + .18 * (1 - growth) + .07 * (1 - nutrient));
    result[DOMAIN_INDEX.get('Cryogenic')][cell] = clamp01(.28 * cold + .23 * frozen + .15 * altitude
      + .12 * ridge + .10 * land + .07 * lake + .05 * lakeShore);
    result[DOMAIN_INDEX.get('Marine')][cell] = clamp01(.52 * ocean + .18 * fields.oceanDepth[cell]
      + .12 * shallow + .08 * coast + .06 * nearCoast + .04 * moisture);
    result[DOMAIN_INDEX.get('Luminous')][cell] = clamp01(.28 * ridge + .16 * nearCoast + .14 * altitude
      + .10 * freshwater + .08 * coast + .06 * Math.abs(moisture - .62) * 2 + .18 * land);
  }
  return result;
}

export function substrateFitDiagnostics({ topology, substrate, domainByCell, domainCapacity, suitability }) {
  const global = aggregateFieldMetrics(topology, substrate, null);
  const byDomain = {}; let marineWater = 0; let nonMarineWater = 0; let nonMarineCount = 0;
  for (let index = 0; index < EVOLUTION_DOMAINS.length; index++) {
    const domain = EVOLUTION_DOMAINS[index]; const metrics = aggregateFieldMetrics(topology, substrate, domainByCell, index);
    let selectedSuitability = 0; let globalSuitability = 0;
    for (let cell = 0; cell < topology.nodeCount; cell++) {
      globalSuitability += suitability[index][cell];
      if (domainByCell[cell] === index) selectedSuitability += suitability[index][cell];
    }
    metrics.meanSuitability = selectedSuitability / domainCapacity[index];
    metrics.globalSuitability = globalSuitability / topology.nodeCount;
    metrics.suitabilityMargin = metrics.meanSuitability - metrics.globalSuitability;
    byDomain[domain] = Object.freeze(metrics);
    if (domain === 'Marine') marineWater = metrics.waterFraction;
    else { nonMarineWater += metrics.waterCells; nonMarineCount += metrics.cells; }
  }
  return Object.freeze({ global: Object.freeze(global), byDomain: Object.freeze(byDomain),
    marineWaterFraction: marineWater, nonMarineWaterFraction: nonMarineWater / nonMarineCount });
}

function aggregateFieldMetrics(topology, fields, domainByCell = null, domainIndex = -1) {
  let cells = 0; let waterCells = 0; let greenCells = 0; let growth = 0;
  let freshwater = 0; let temperature = 0; let moisture = 0; let nutrient = 0; let ridge = 0;
  for (let cell = 0; cell < topology.nodeCount; cell++) {
    if (domainByCell && domainByCell[cell] !== domainIndex) continue;
    cells++; if (fields.waterClass[cell] !== WATER.LAND) waterCells++;
    if (isGreenLand(fields, cell)) greenCells++;
    growth += fields.growthSuitability[cell]; freshwater += fields.freshwaterInfluence[cell];
    temperature += fields.baseTemp[cell]; moisture += fields.baseMoisture[cell];
    nutrient += fields.baseNutrient[cell]; ridge += fields.ridgeStrength[cell];
  }
  return { cells, waterCells, waterFraction: waterCells / cells, greenFraction: greenCells / cells,
    growthSuitability: growth / cells, freshwaterInfluence: freshwater / cells,
    temperature: temperature / cells, moisture: moisture / cells, nutrient: nutrient / cells,
    ridgeStrength: ridge / cells };
}

export function rootDetails(topology, substrate, rootCell) {
  let greenNeighbors = 0;
  for (let offset = topology.nodeStart[rootCell]; offset < topology.nodeStart[rootCell + 1]; offset++) {
    if (isGreenLand(substrate, topology.nodeNeighbors[offset])) greenNeighbors++;
  }
  return Object.freeze({ cell: rootCell, biome: substrate.biomeId[rootCell], waterClass: substrate.waterClass[rootCell],
    land: substrate.landMask[rootCell] === 1, greenBiome: GREEN_BIOMES.has(substrate.biomeId[rootCell]),
    greenNeighbors, degree: topology.degree[rootCell], growthSuitability: substrate.growthSuitability[rootCell],
    baseNutrient: substrate.baseNutrient[rootCell], baseMoisture: substrate.baseMoisture[rootCell],
    baseTemp: substrate.baseTemp[rootCell] });
}

export function compareRootFields(fields, left, right) {
  for (const key of ['growthSuitability', 'baseNutrient', 'baseMoisture']) {
    if (fields[key][left] !== fields[key][right]) return fields[key][left] > fields[key][right] ? -1 : 1;
  }
  return left - right;
}

export function capacitiesByDomain(archetypes, archetypeQuota) {
  const result = new Uint16Array(EVOLUTION_DOMAINS.length);
  for (let index = 0; index < archetypes.length; index++) result[DOMAIN_INDEX.get(archetypes[index].domain)] += archetypeQuota[index];
  return result;
}

export function buildMemberships(valueByCell, valueCount) {
  const count = new Uint16Array(valueCount);
  for (const value of valueByCell) count[value]++;
  const start = new Uint32Array(valueCount + 1);
  for (let index = 0; index < valueCount; index++) start[index + 1] = start[index] + count[index];
  const cells = new Uint16Array(valueByCell.length); const cursor = start.slice(0, valueCount);
  for (let cell = 0; cell < valueByCell.length; cell++) cells[cursor[valueByCell[cell]]++] = cell;
  return { count, start, cells };
}

export function classifyRegionEdges(topology, archetypes, archetypeByCell) {
  const result = new Uint8Array(topology.edgeCount);
  for (let edge = 0; edge < topology.edgeCount; edge++) {
    const left = archetypeByCell[topology.edgeA[edge]]; const right = archetypeByCell[topology.edgeB[edge]];
    if (left === right) result[edge] = EVOLUTION_REGION_EDGE.INTERNAL;
    else if (archetypes[left].domain === archetypes[right].domain) result[edge] = EVOLUTION_REGION_EDGE.ARCHETYPE;
    else result[edge] = EVOLUTION_REGION_EDGE.DOMAIN;
  }
  return result;
}

export function componentCounts(topology, valueByCell, valueCount) {
  const count = new Uint16Array(valueCount); const seen = new Uint8Array(topology.nodeCount);
  const queue = new Uint16Array(topology.nodeCount);
  for (let start = 0; start < topology.nodeCount; start++) {
    if (seen[start]) continue; const value = valueByCell[start]; count[value]++;
    let head = 0; let tail = 0; queue[tail++] = start; seen[start] = 1;
    while (head < tail) {
      const cell = queue[head++];
      for (let offset = topology.nodeStart[cell]; offset < topology.nodeStart[cell + 1]; offset++) {
        const next = topology.nodeNeighbors[offset];
        if (!seen[next] && valueByCell[next] === value) { seen[next] = 1; queue[tail++] = next; }
      }
    }
  }
  return count;
}

export function tierMedians(archetypes, archetypeByCell, rootDistance) {
  const values = Array.from({ length: 7 }, () => []);
  for (let cell = 0; cell < archetypeByCell.length; cell++) {
    const tier = archetypes[archetypeByCell[cell]].tier;
    if (tier >= 1 && tier <= 6) values[tier].push(rootDistance[cell]);
  }
  return Object.freeze(values.map((entries) => median(entries)));
}

export function domainMeanTier(archetypes, domain) {
  let total = 0; let count = 0;
  for (const archetype of archetypes) if (archetype.domain === domain && archetype.kind !== 'root') {
    total += archetype.tier; count++;
  }
  return count ? total / count : 1;
}

export function quotas(cellCount, archetypeCount, rootArchetype) {
  const result = new Uint16Array(archetypeCount); const nonRoot = archetypeCount - 1;
  const base = Math.floor(cellCount / nonRoot); let extra = cellCount % nonRoot;
  for (let index = 0; index < archetypeCount; index++) if (index !== rootArchetype) {
    result[index] = base + (extra-- > 0 ? 1 : 0);
  }
  return result;
}

export function graphDistances(topology, root, work = null) {
  const distance = new Uint16Array(topology.nodeCount).fill(0xffff);
  const queue = new Uint16Array(topology.nodeCount); let head = 0; let tail = 0;
  queue[tail++] = root; distance[root] = 0;
  while (head < tail) {
    const cell = queue[head++]; if (work) work.connectivityVisits++;
    for (let offset = topology.nodeStart[cell]; offset < topology.nodeStart[cell + 1]; offset++) {
      const next = topology.nodeNeighbors[offset];
      if (distance[next] === 0xffff) { distance[next] = distance[cell] + 1; queue[tail++] = next; }
    }
  }
  return distance;
}

export function sphericalDistanceFields(topology, seeds) {
  return Array.from(seeds, (seed) => {
    const result = new Float32Array(topology.nodeCount); const seedAt = seed * 3;
    for (let cell = 0; cell < topology.nodeCount; cell++) {
      const at = cell * 3;
      result[cell] = 1 - (topology.positions[at] * topology.positions[seedAt]
        + topology.positions[at + 1] * topology.positions[seedAt + 1]
        + topology.positions[at + 2] * topology.positions[seedAt + 2]);
    }
    return result;
  });
}

export function graphDistancesInMask(topology, root, mask, work = null) {
  const distance = new Uint16Array(topology.nodeCount).fill(0xffff);
  const queue = new Uint16Array(topology.nodeCount); let head = 0; let tail = 0;
  if (!mask[root]) return distance;
  queue[tail++] = root; distance[root] = 0;
  while (head < tail) {
    const cell = queue[head++]; if (work) work.connectivityVisits++;
    for (let offset = topology.nodeStart[cell]; offset < topology.nodeStart[cell + 1]; offset++) {
      const next = topology.nodeNeighbors[offset];
      if (mask[next] && distance[next] === 0xffff) { distance[next] = distance[cell] + 1; queue[tail++] = next; }
    }
  }
  return distance;
}

export function neighborsOf(topology, cell) {
  return Array.from(topology.nodeNeighbors.slice(topology.nodeStart[cell], topology.nodeStart[cell + 1]));
}

export function outsideNeighbors(topology, mask, cell) {
  let count = 0;
  for (let offset = topology.nodeStart[cell]; offset < topology.nodeStart[cell + 1]; offset++) {
    if (!mask[topology.nodeNeighbors[offset]]) count++;
  }
  return count;
}

export function validateInputs(topology, archetypes, substrate) {
  if (!topology || topology.levels !== EVOLUTION_TOPOLOGY_LEVEL || topology.nodeCount > 0xffff
    || topology.positions?.length !== topology.nodeCount * 3 || !Array.isArray(archetypes)
    || archetypes.length < 2 || archetypes.length > 255) throw new Error('invalid Evolution cell-layout inputs');
  const roots = archetypes.filter((archetype) => archetype.kind === 'root');
  if (roots.length !== 1 || roots[0].id !== 'first-division') throw new Error('First Division must be the sole Evolution root archetype');
  validateSubstrate(topology, substrate);
}

export function validateSubstrate(topology, substrate) {
  const required = ['landMask', 'waterClass', 'biomeId', 'growthSuitability', 'baseNutrient', 'baseMoisture',
    'baseTemp', 'forestDensity', 'freshwaterInfluence', 'ridgeStrength', 'altitude', 'coastDistance',
    'oceanDepth', 'lakeShore', 'featureFlags'];
  if (!substrate || required.some((key) => substrate[key]?.length !== topology.nodeCount)) {
    throw new Error('invalid Evolution substrate fields');
  }
}

export function isGreenLand(fields, cell) {
  return fields.landMask[cell] === 1 && GREEN_BIOMES.has(fields.biomeId[cell]);
}
export function normalize3(value) { const length = Math.hypot(...value); return value.map((axis) => axis / length); }
export function maximum(values) { let result = 0; for (const value of values) result = Math.max(result, value); return result; }
export function median(values) { if (!values.length) return null; values.sort((left, right) => left - right);
  const middle = values.length >> 1; return values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2; }

function clamp01(value) { return Math.max(0, Math.min(1, Number(value) || 0)); }
