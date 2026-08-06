import { compileBuilds, BUILD_MASTERY_VERSION } from './builds.js';
import { EVOLUTION_LEVEL_VECTOR_VERSION, boundedEvolutionLevelRefinement, levelMapFromVector } from './levels.js';
import { WORLD_POTENTIAL_VERSION, worldPotentialForBreadthAndDepth } from './potential.js';
import { addProgressionIntegers, multiplyProgressionIntegers,
  sumProgressionIntegers } from '../../core/progression-integer.js';

export const EVOLUTION_EFFECT_VERSION = 2;
export const EVOLUTION_COMPILE_CACHE_LIMIT = 512;
export const EVOLUTION_COMPILE_CACHE_BYTE_LIMIT = 8 * 1024 * 1024;

const ADDITIVE = new Set(['growthCap', 'anastomosis', 'redundantLoops',
  'coldReserve', 'symbioticFilm', 'distributedSensing']);
const EFFECT_CAPS = Object.freeze({ reach:.9, uptake:.9, maintenance:.5, conductance:1, reinforce:.8,
  stressResist:.9, heatTol:.5, droughtTol:.5, toxinTol:.5, energyCap:.9, regrow:.9, growCost:.35 });
const CACHE=new Map();const CACHE_WEIGHTS=new Map();let cacheBytes=0;let oversizeSkips=0;
const BUILD_PRESSURE_CHANNELS = Object.freeze({
  'rich-rush':['scarcity'], 'lake-garden':['scarcity','renewal'],
  'circular-biosphere':['scarcity','renewal','maintenance'], 'wasteland-reclaimer':['scarcity','toxicity'],
  'cold-dormancy':['climate','maintenance','events'], 'cryolake-engineer':['climate','events'],
  'brine-harvester':['maintenance'], 'pelagic-colony':['maintenance','events'],
  'littoral-succession':['renewal','maintenance'], 'bioelectric-wetland':['renewal','toxicity','maintenance'],
  'hydrothermal-grid':['maintenance','events'], 'illuminated-biosphere':['toxicity','maintenance','events'],
  'polar-current':['climate','events'], 'depletion-bloom':['scarcity','toxicity'],
  'world-gardener':['scarcity','renewal','climate','toxicity','maintenance','events'],
  'lake-to-light-network':['renewal','maintenance','events'],
});
let hits = 0; let misses = 0; let evictions = 0;

/** Compile all 252 catalog entries once, independent of level magnitude. */
export function compileEvolutionVector({ vector, canonicalKey, nodes, summary, contentVersion,
  habitatCapabilities }) {
  const key = `evolution-compile:effects${EVOLUTION_EFFECT_VERSION}:potential${WORLD_POTENTIAL_VERSION}`
    + `:mastery${BUILD_MASTERY_VERSION}:content${contentVersion}|${canonicalKey}`;
  if (CACHE.has(key)) { hits++; return CACHE.get(key); }
  misses++;
  const levels = levelMapFromVector(vector);
  const effects = {}; const conditionals = []; const unlocks = []; const resonance = new Map(); const ownedNodes = [];
  for (const node of nodes) {
    const level = levels.get(node.id); if (!level) continue;
    const refinement = boundedEvolutionLevelRefinement(level); const effect = node.effect;
    ownedNodes.push(Object.freeze({ ...node, evolutionLevel: level }));
    if (effect.type === 'scalar') mergeRefinedEffect(effects, effect, refinement);
    else if (effect.type === 'conditional') conditionals.push(Object.freeze({ nodeId: node.id,
      ...refinedConditional(effect, refinement) }));
    else if (effect.type === 'resonance') {
      const resonanceKey = `${effect.branch}:${effect.key}:${effect.direction}:${effect.cap}:${effect.scale}`;
      const prior = resonance.get(resonanceKey);
      resonance.set(resonanceKey, { ...effect, points: (prior?.points ?? 0) + 1 + 0.5 * refinement });
    } else unlocks.push(Object.freeze({ nodeId: node.id, key: effect.key, mode: effect.mode }));
    if (effect.bonus) mergeRefinedEffect(effects, effect.bonus, refinement);
  }
  const resonanceCurves = [];
  for (const curve of resonance.values()) {
    const benefit = curve.cap * (1 - Math.exp(-curve.points / curve.scale));
    const value = curve.direction === 'down' ? 1 - benefit : 1 + benefit;
    mergeEffect(effects, { key: curve.key, value, operation: 'multiply' });
    resonanceCurves.push(Object.freeze({ ...curve, value }));
  }
  boundCompiledEffects(effects);
  const capabilitySet = new Set(unlocks.filter((entry) => entry.mode === 'habitat').map((entry) => entry.key));
  const builds = compileBuilds(ownedNodes);
  const affinityDefense = Object.freeze(Object.fromEntries(summary.affinities.map((entry) => [entry.affinity,
    multiplyProgressionIntegers(entry.defenseRating, '16')])));
  const pressureDefense = compilePressureDefense(builds.activeBuilds);
  const electricityMastery = compileElectricityMastery(builds.activeBuilds);
  const worldPotential = worldPotentialForBreadthAndDepth(summary.breadthPower, summary.depth);
  const compiled = Object.freeze({ effects: Object.freeze(effects),
    conditionals: Object.freeze(conditionals), unlocks: Object.freeze(unlocks),
    resonanceCurves: Object.freeze(resonanceCurves), evolutionPower: summary.breadthPower,
    breadthPower: summary.breadthPower, evolutionDepth: summary.depth,
    evolutionDefenseRating: summary.evolutionDefenseRating,
    totalEvolutionLevels: summary.totalLevels, excessEvolutionDepth: summary.excessDepth,
    minimumOwnedLevel: summary.minimumOwnedLevel, affinitySummaries: summary.affinities,
    affinityDefense, pressureDefense, electricityMastery,
    affinityBreadth: Object.freeze(Object.fromEntries(summary.affinities.map((entry) => [entry.affinity, entry.breadth]))),
    affinityDepth: Object.freeze(Object.fromEntries(summary.affinities.map((entry) => [entry.affinity, entry.depth]))),
    worldPotential, potentialVersion: WORLD_POTENTIAL_VERSION,
    levelVectorVersion: EVOLUTION_LEVEL_VECTOR_VERSION, effectVersion: EVOLUTION_EFFECT_VERSION,
    buildMasteryVersion: BUILD_MASTERY_VERSION, contentVersion,
    habitatCapabilities: Object.freeze(habitatCapabilities.filter((keyName) => capabilitySet.has(keyName))),
    activeBuilds: builds.activeBuilds, nearBuilds: builds.nearBuilds, buildEffects: builds.buildEffects,
    buildMasteryRating: builds.masteryRating, masteryRating: builds.masteryRating,
    buildCapabilities: builds.capabilities,
    transformations: builds.transformations });
  const weight=(key.length+JSON.stringify(compiled).length)*2;
  if(weight<=EVOLUTION_COMPILE_CACHE_BYTE_LIMIT){CACHE.set(key,compiled);CACHE_WEIGHTS.set(key,weight);cacheBytes+=weight;
    while(CACHE.size>EVOLUTION_COMPILE_CACHE_LIMIT||cacheBytes>EVOLUTION_COMPILE_CACHE_BYTE_LIMIT){
      const oldest=CACHE.keys().next().value;CACHE.delete(oldest);cacheBytes-=CACHE_WEIGHTS.get(oldest)??0;CACHE_WEIGHTS.delete(oldest);evictions++;
    }
  }else oversizeSkips++;
  return compiled;
}

/** Rank-one output is byte-for-byte authored; continuation is a bounded extra half-delta. */
function mergeRefinedEffect(target, effect, refinement) {
  mergeEffect(target, effect);
  if (!refinement) return;
  const extra = effect.operation === 'add' || ADDITIVE.has(effect.key)
    ? { ...effect, value: effect.value * 0.5 * refinement, operation: 'add' }
    : { ...effect, value: 1 + (effect.value - 1) * 0.5 * refinement, operation: 'multiply' };
  mergeEffect(target, extra);
}

function refinedConditional(effect, refinement) {
  if (!refinement) return effect;
  if (effect.operation === 'add' || ADDITIVE.has(effect.key))
    return { ...effect, value: effect.value * (1 + 0.5 * refinement) };
  return { ...effect, value: 1 + (effect.value - 1) * (1 + 0.5 * refinement) };
}

function mergeEffect(target, effect) {
  if (effect.operation === 'add' || ADDITIVE.has(effect.key)) target[effect.key] = (target[effect.key] ?? 0) + effect.value;
  else target[effect.key] = (target[effect.key] ?? 1) * effect.value;
}
function boundCompiledEffects(effects) {
  for (const [key, cap] of Object.entries(EFFECT_CAPS)) if (key in effects) {
    const raw = effects[key]; const delta = Math.abs(raw - 1);
    effects[key] = raw < 1 ? 1 - cap * (1 - Math.exp(-delta / cap)) : 1 + cap * (1 - Math.exp(-delta / cap));
  }
}

function compileElectricityMastery(activeBuilds) {
  const ids = new Set(['bioelectric-wetland','hydrothermal-grid','illuminated-biosphere','depletion-bloom','lake-to-light-network']);
  const builds = activeBuilds.filter((build) => ids.has(build.id));
  const development = builds.reduce((best, build) => Math.max(best, build.masteryRefinement ?? 0), 0);
  return Object.freeze({ rating:sumProgressionIntegers(builds.map((build) => build.masteryRank)),
    development, generationScale:1 + .75 * development, retention:.992 + .004 * development,
    upkeepScale:1 - .25 * development, domainScale:1 + .25 * development,
    visualDevelopment:development });
}
function compilePressureDefense(activeBuilds) {
  const result = { scarcity:'0', renewal:'0', climate:'0', toxicity:'0', maintenance:'0', events:'0' };
  for (const build of activeBuilds) for (const channel of BUILD_PRESSURE_CHANNELS[build.id] ?? []) {
    result[channel] = addProgressionIntegers(result[channel], multiplyProgressionIntegers(build.masteryRank, '50'));
  }
  return Object.freeze(result);
}

export function evolutionCompileCacheDiagnostics(){return Object.freeze({size:CACHE.size,limit:EVOLUTION_COMPILE_CACHE_LIMIT,
  bytes:cacheBytes,byteLimit:EVOLUTION_COMPILE_CACHE_BYTE_LIMIT,hits,misses,evictions,oversizeSkips});}
export function resetEvolutionCompileCache(){CACHE.clear();CACHE_WEIGHTS.clear();cacheBytes=0;oversizeSkips=0;hits=0;misses=0;evictions=0;}
export const getEvolutionCompileCacheDiagnostics = evolutionCompileCacheDiagnostics;
export const clearEvolutionCompileCache = resetEvolutionCompileCache;
