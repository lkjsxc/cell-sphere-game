import { compileBuilds, BUILD_MASTERY_VERSION } from './builds.js';
import { EVOLUTION_LEVEL_VECTOR_VERSION, boundedEvolutionLevelRefinement, levelMapFromVector } from './levels.js';
import { WORLD_POTENTIAL_VERSION, worldPotentialForBreadthAndDepth } from './potential.js';

export const EVOLUTION_EFFECT_VERSION = 2;
export const EVOLUTION_COMPILE_CACHE_LIMIT = 512;

const ADDITIVE = new Set(['growthCap', 'anastomosis', 'redundantLoops',
  'coldReserve', 'symbioticFilm', 'distributedSensing']);
const EFFECT_CAPS = Object.freeze({ reach:.9, uptake:.9, maintenance:.5, conductance:1, reinforce:.8,
  stressResist:.9, heatTol:.5, droughtTol:.5, toxinTol:.5, energyCap:.9, regrow:.9, growCost:.35 });
const CACHE = new Map();
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
  const worldPotential = worldPotentialForBreadthAndDepth(summary.breadthPower, summary.depth);
  const compiled = Object.freeze({ effects: Object.freeze(effects),
    conditionals: Object.freeze(conditionals), unlocks: Object.freeze(unlocks),
    resonanceCurves: Object.freeze(resonanceCurves), evolutionPower: summary.breadthPower,
    breadthPower: summary.breadthPower, evolutionDepth: summary.depth,
    evolutionDefenseRating: summary.evolutionDefenseRating,
    totalEvolutionLevels: summary.totalLevels, excessEvolutionDepth: summary.excessDepth,
    minimumOwnedLevel: summary.minimumOwnedLevel, affinitySummaries: summary.affinities,
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
  CACHE.set(key, compiled);
  if (CACHE.size > EVOLUTION_COMPILE_CACHE_LIMIT) {
    CACHE.delete(CACHE.keys().next().value); evictions++;
  }
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

export function evolutionCompileCacheDiagnostics() {
  return Object.freeze({ size: CACHE.size, limit: EVOLUTION_COMPILE_CACHE_LIMIT, hits, misses, evictions });
}
export function resetEvolutionCompileCache() {
  CACHE.clear(); hits = 0; misses = 0; evictions = 0;
}
export const getEvolutionCompileCacheDiagnostics = evolutionCompileCacheDiagnostics;
export const clearEvolutionCompileCache = resetEvolutionCompileCache;
