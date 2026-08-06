/** Pure visible Build recipe compiler. Recipes use only owned Skill metadata. */
import {
  compareProgressionIntegers,
  incrementProgressionInteger,
  minProgressionInteger,
  normalizeProgressionInteger,
  sumProgressionIntegers,
} from '../../core/progression-integer.js';
import { boundedEvolutionLevelRefinement } from './levels.js';

export const BUILD_MASTERY_VERSION = 1;
const recipe = (id, name, affinities, tags, effects, tradeoffs, habitats, capabilities = [], transformations = []) => Object.freeze({
  id, name,
  requiredAffinities: freezeRequirements(affinities),
  requiredTags: freezeRequirements(tags),
  mechanicalEffects: Object.freeze({ ...effects }),
  tradeoffs: Object.freeze([...tradeoffs]),
  habitats: Object.freeze([...habitats]),
  capabilities: Object.freeze([...capabilities]),
  transformations: Object.freeze([...transformations]),
});

export const BUILD_RECIPES = Object.freeze([
  recipe('rich-rush', 'Rich Rush', { Fertility: 2 }, { 'rich-terrain': 1, 'rapid-uptake': 1 },
    { richCellUptake: 1.14, richGrowthRate: 1.10, richResourceUse: 1.12 }, ['Consumes rich local stock faster.'], ['abundant land', 'fertile land']),
  recipe('lake-garden', 'Lake Garden', { Fertility: 1, Freshwater: 1 }, { lake: 1, 'soil-building': 1 },
    { shoreRenewal: 1.12, wetForestAnchor: 1.10 }, ['Catchment renewal is finite.'], ['lakes', 'shores', 'wetlands', 'forests']),
  recipe('circular-biosphere', 'Circular Biosphere', { Fertility: 1, Freshwater: 1, Scarcity: 1 }, { reclamation: 1, renewal: 1 },
    { recyclableBiomass: 1.16, netWaste: 0.88, burstGrowth: 0.94 }, ['Slower burst expansion.'], ['strained land', 'recovering land'], ['DETRITUS_RECLAMATION']),
  recipe('wasteland-reclaimer', 'Wasteland Reclaimer', { Scarcity: 2 }, { depleted: 1, reclamation: 1 },
    { depletedAccessFloor: 0.86, reclamationRate: 1.14, openingGrowth: 0.90 }, ['Slow initial growth.'], ['poor land', 'depleted land'], ['DEPLETED_CELL_ACCESS'], ['reclaimed-soil']),
  recipe('cold-dormancy', 'Cold Dormancy', { Cryogenic: 1, Scarcity: 1 }, { dormancy: 1, 'low-upkeep': 1 },
    { coldMaintenance: 0.82, dormantStorage: 1.18, warmGrowth: 0.94 }, ['Reduced warm-region growth.'], ['tundra', 'snow', 'ice'], ['COLD_DORMANCY']),
  recipe('cryolake-engineer', 'Cryolake Engineer', { Cryogenic: 1, Freshwater: 1 }, { glacial: 1, lake: 1 },
    { cryolakeProgress: 1.14, cryolakeEnergyCost: 1.12 }, ['Transformation consumes stored energy.'], ['snow basins', 'ice basins'], ['CRYOLAKE_ENGINEERING'], ['glacial-lake']),
  recipe('brine-harvester', 'Brine Harvester', { Marine: 1, Scarcity: 1 }, { salinity: 1, 'low-upkeep': 1 },
    { salinityHarvest: 1.15, marineMaintenance: 1.08 }, ['Higher marine maintenance.'], ['brackish water', 'shallow ocean'], ['BRINE_HARVEST']),
  recipe('pelagic-colony', 'Pelagic Colony', { Marine: 2 }, { 'deep-ocean': 1, pressure: 1 },
    { deepOceanPersistence: 1.18, pelagicGrowth: 0.88 }, ['Slow growth in sparse deep water.'], ['deep ocean'], ['PELAGIC_STORAGE']),
  recipe('littoral-succession', 'Littoral Succession', { Marine: 1, Fertility: 1, Freshwater: 1 }, { 'shallow-ocean': 1, 'soil-building': 1 },
    { littoralEstablishment: 1.12, successionResourceCost: 1.14 }, ['Requires sustained occupation and resource investment.'], ['coasts', 'shallow ocean'], ['LITTORAL_SUCCESSION'], ['wetland-succession', 'maritime-forest']),
  recipe('bioelectric-wetland', 'Bioelectric Wetland', { Freshwater: 1, Luminous: 1 }, { wetland: 1, bioelectric: 1 },
    { wetTransportPower: 1.14, poweredWetlandRenewal: 1.10 }, ['Powered wet cells require upkeep.'], ['wetlands', 'lake shores'], ['WETLAND_POWER'], ['electrified']),
  recipe('hydrothermal-grid', 'Hydrothermal Grid', { Marine: 1, Luminous: 1 }, { 'deep-ocean': 1, 'power-generation': 1 },
    { hydrothermalPower: 1.16, gridSetupCost: 1.15 }, ['High setup cost.'], ['deep ocean', 'shallow ocean'], ['HYDROTHERMAL_POWER'], ['electrified']),
  recipe('illuminated-biosphere', 'Illuminated Biosphere', { Luminous: 3 }, { bioelectric: 1, infrastructure: 1, illumination: 1 },
    { planetaryConductance: 1.15, illuminationUpkeep: 1.10 }, ['Planetary illumination has continuing upkeep.'], ['mature connected habitats'], ['CELLULAR_GRID', 'BIOSPHERE_ILLUMINATION'], ['electrified']),
  recipe('polar-current', 'Polar Current', { Cryogenic: 1, Marine: 1 }, { cold: 1, salinity: 1 },
    { coldOceanMetabolism: 0.80, pressureReserve: 1.12, warmLandGrowth: 0.92 }, ['Weak in warm rich land.'], ['cold ocean', 'polar coast'], ['POLAR_CURRENT']),
  recipe('depletion-bloom', 'Depletion Bloom', { Scarcity: 1, Luminous: 1 }, { reclamation: 1, 'powered-transformation': 1 },
    { poweredReclamation: 1.16, bloomEnergyCost: 1.14 }, ['Recovery is costly and slow.'], ['exhausted land', 'depleted land'], ['POWERED_RECLAMATION'], ['recovering', 'reclaimed-soil']),
  recipe('world-gardener', 'World Gardener', { Fertility: 1, Freshwater: 1, Scarcity: 1, Cryogenic: 1, Marine: 1, Luminous: 1 }, { 'broad-habitat': 3 },
    { habitatInteroperability: 1.12, specialistPeak: 0.94 }, ['Lower peak strength than a specialist.'], ['land', 'freshwater', 'cold', 'marine'], ['WORLD_GARDENING']),
  recipe('lake-to-light-network', 'Lake-to-Light Network', { Freshwater: 1, Luminous: 1 }, { lake: 1, conductance: 1 },
    { lakeAnchorPower: 1.15, catchmentGridRange: 1.10 }, ['Limited by catchment and infrastructure upkeep.'], ['lakes', 'shores', 'wetlands'], ['LAKE_LIGHT_NETWORK'], ['electrified']),
]);

export function compileBuilds(ownedNodes = []) {
  const nodes = ownedNodes.map((node) => ({ node,
    level: normalizeProgressionInteger(node.evolutionLevel, '1') }));
  const affinities = counts(nodes.map(({ node }) => node.affinity));
  const tags = counts(nodes.flatMap(({ node }) => node.secondaryTags ?? []));
  const builds = BUILD_RECIPES.map((entry) => compileRecipe(entry, nodes, affinities, tags));
  const activeBuilds = Object.freeze(builds.filter((entry) => entry.active));
  const nearBuilds = Object.freeze(builds.filter((entry) => !entry.active && entry.progress >= 0.5)
    .sort((a, b) => b.progress - a.progress || a.id.localeCompare(b.id)).slice(0, 8));
  const buildEffects = {}; const capabilities = new Set(); const transformations = new Set();
  for (const build of activeBuilds) {
    for (const [key, value] of Object.entries(build.mechanicalEffects)) {
      const combined = (buildEffects[key] ?? 1) * value;
      buildEffects[key] = Math.max(0.5, Math.min(2, combined));
    }
    build.capabilities.forEach((value) => capabilities.add(value));
    build.transformations.forEach((value) => transformations.add(value));
  }
  return Object.freeze({ version: BUILD_MASTERY_VERSION, builds: Object.freeze(builds), activeBuilds, nearBuilds,
    masteryRating: sumProgressionIntegers(activeBuilds.map((build) => build.masteryRank)),
    buildEffects: Object.freeze(buildEffects), capabilities: Object.freeze([...capabilities].sort()),
    transformations: Object.freeze([...transformations].sort()) });
}

export function buildContributionsFor(affinity, tags = []) {
  const tagSet = new Set(tags);
  return Object.freeze(BUILD_RECIPES.filter((entry) => entry.requiredAffinities.some((part) => part.id === affinity)
    || entry.requiredTags.some((part) => tagSet.has(part.id))).map((entry) => entry.id));
}

function compileRecipe(entry, nodes, affinities, tags) {
  const ingredients = [...entry.requiredAffinities.map((part) => ingredient(part, 'affinity', nodes, affinities)),
    ...entry.requiredTags.map((part) => ingredient(part, 'tag', nodes, tags))];
  const required = ingredients.reduce((sum, part) => sum + part.count, 0);
  const satisfied = ingredients.reduce((sum, part) => sum + Math.min(part.count, part.owned), 0);
  const missing = Object.freeze(ingredients.filter((part) => part.owned < part.count).map((part) => Object.freeze({
    type: part.type, id: part.id, required: part.count, owned: part.owned, remaining: part.count - part.owned,
  })));
  const masteryRank = ingredients.length
    ? ingredients.reduce((rank, part) => minProgressionInteger(rank, part.support), ingredients[0].support) : '1';
  const masteryRefinement = boundedEvolutionLevelRefinement(masteryRank);
  const mechanicalEffects = Object.freeze(Object.fromEntries(Object.entries(entry.mechanicalEffects)
    .map(([key, value]) => [key, refineMechanicalEffect(value, masteryRefinement)])));
  return Object.freeze({ ...entry, authoredMechanicalEffects: entry.mechanicalEffects, mechanicalEffects,
    progress: required ? satisfied / required : 1, active: masteryRank !== '0', missing,
    masteryVersion: BUILD_MASTERY_VERSION, masteryRank, nextMasteryRank: incrementProgressionInteger(masteryRank),
    masteryRefinement, ingredientSupport: Object.freeze(ingredients.map((part) => Object.freeze({
      type: part.type, id: part.id, required: part.count, support: part.support,
    }))) });
}

function ingredient(part, type, nodes, breadthCounts) {
  const matching = nodes.filter(({ node }) => type === 'affinity' ? node.affinity === part.id
    : node.secondaryTags?.includes(part.id));
  const levels = matching.map(({ level }) => level)
    .sort((left, right) => compareProgressionIntegers(right, left));
  return { ...part, type, owned: breadthCounts[part.id] ?? 0, support: levels[part.count - 1] ?? '0' };
}

/** Rank one is exact authored behavior; later ranks add at most 35% of its delta from one. */
function refineMechanicalEffect(value, refinement) {
  if (!refinement || value === 1) return value;
  return 1 + (value - 1) * (1 + 0.35 * refinement);
}

function counts(values) { const result = {}; for (const value of values) if (value) result[value] = (result[value] ?? 0) + 1; return result; }
function freezeRequirements(requirements) {
  return Object.freeze(Object.entries(requirements).map(([id, count]) => Object.freeze({ id, count })));
}
