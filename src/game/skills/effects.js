/** Direct bounded compilation from authored Evolution skills to ecology rules. */
import { addProgressionIntegers, normalizeProgressionInteger } from '../../core/progression-integer.js';
import { boundedEvolutionLevelRefinement, levelMapFromVector } from './levels.js';

export const EVOLUTION_EFFECT_VERSION = 3;
export const EVOLUTION_COMPILE_CACHE_LIMIT = 128;
export const EVOLUTION_COMPILE_CACHE_BYTE_LIMIT = 2 * 1024 * 1024;

const TRAIT_CAPS = Object.freeze({
  reach: .65, uptake: .65, maintenance: .45, conductance: .75, reinforce: .65,
  stressResist: .65, heatTol: .50, droughtTol: .50, toxinTol: .50,
  energyCap: .70, regrow: .65, growCost: .35,
});
const ADDITIVE_TRAITS = new Set(['growthCap', 'anastomosis', 'symbioticFilm', 'coldReserve', 'redundantLoops']);
const PRESSURE_DOMAINS = Object.freeze(['Fertility', 'Freshwater', 'Scarcity', 'Cryogenic', 'Marine', 'Luminous']);
const CACHE = new Map(); const WEIGHTS = new Map();
let cacheBytes = 0; let hits = 0; let misses = 0; let evictions = 0; let oversizeSkips = 0;

export function compileEvolutionVector({ vector, canonicalKey, nodes, contentVersion }) {
  const key = `evolution-compile:v${EVOLUTION_EFFECT_VERSION}:content${contentVersion}|${canonicalKey}`;
  if (CACHE.has(key)) { hits++; return CACHE.get(key); }
  misses++;
  const levels = levelMapFromVector(vector); const traits = {}; const ecology = defaultEcology();
  const worldmaking = { reclamation: false, cryolake: false, littoral: false };
  const luminous = { enabled: false, generation: 0, retention: 0, upkeep: 0, domain: 0, transport: 0, recovery: 0, visual: 0 };
  const habitats = new Set(); const affinityDefense = Object.fromEntries(PRESSURE_DOMAINS.map((domain) => [domain, '0']));
  const owned = [];
  for (const node of nodes) {
    const level = levels.get(node.id); if (!level) continue;
    const refinement = boundedEvolutionLevelRefinement(level); owned.push(Object.freeze({ ...node, evolutionLevel: level }));
    for (const effect of node.effects) apply(effect, refinement, traits, ecology, worldmaking, luminous, habitats, affinityDefense);
  }
  boundTraits(traits);
  const luminousEcology = compileLuminous(luminous, vector);
  const compiled = Object.freeze({
    effects: Object.freeze(traits), ecology: Object.freeze(ecology), worldmaking: Object.freeze(worldmaking),
    luminous: Object.freeze(luminousEcology),
    habitatCapabilities: Object.freeze([...habitats].sort()), affinityDefense: Object.freeze(affinityDefense),
    pressureDefense: Object.freeze({ scarcity: '0', renewal: '0', climate: '0', toxicity: '0', maintenance: '0' }),
    totalOwnedCells: owned.length, totalEvolutionLevels: totalLevels(vector), ownedNodes: Object.freeze(owned),
    levelVectorVersion: 2, effectVersion: EVOLUTION_EFFECT_VERSION, contentVersion,
  });
  cache(compiled, key); return compiled;
}

function apply(effect, refinement, traits, ecology, worldmaking, luminous, habitats, affinityDefense) {
  const scale = 1 + refinement * .5;
  if (effect.kind === 'trait') {
    if (ADDITIVE_TRAITS.has(effect.key)) traits[effect.key] = (traits[effect.key] ?? 0) + effect.value * scale;
    else traits[effect.key] = (traits[effect.key] ?? 1) * (1 + (effect.value - 1) * scale);
    return;
  }
  if (effect.kind === 'ecology') { ecology[effect.key] = (ecology[effect.key] ?? 0) + effect.value * scale; return; }
  if (effect.kind === 'habitat') { habitats.add(effect.capability); return; }
  if (effect.kind === 'worldmaking') { worldmaking[effect.key] = true; return; }
  if (effect.kind === 'luminous') {
    if (effect.key === 'enabled') luminous.enabled = true;
    else luminous[effect.key] = (luminous[effect.key] ?? 0) + effect.value * scale;
    return;
  }
  if (effect.kind === 'defense' && affinityDefense[effect.affinity] !== undefined) {
    affinityDefense[effect.affinity] = addProgressionIntegers(affinityDefense[effect.affinity], String(Math.round(effect.value * scale)));
  }
}

function defaultEcology() {
  return { resourceFloorReduction: 0, freshwaterSupport: 0, marineSupport: 0, recycling: 0 };
}
function boundTraits(traits) {
  for (const [key, cap] of Object.entries(TRAIT_CAPS)) if (key in traits) {
    traits[key] = Math.max(1 - cap, Math.min(1 + cap, traits[key]));
  }
  for (const key of ADDITIVE_TRAITS) if (key in traits) traits[key] = Math.max(0, Math.min(1, traits[key]));
}
function compileLuminous(source, vector) {
  const levels = totalLevels(vector); const enabled = source.enabled === true;
  const generationScale = enabled ? Math.max(.20, Math.min(1.7, source.generation)) : 0;
  const domainScale = enabled ? Math.max(.24, Math.min(1.5, source.domain)) : 0;
  const retention = enabled ? Math.max(.976, Math.min(.996, .980 + source.retention)) : .976;
  const upkeepScale = Math.max(.76, Math.min(1.25, 1 + source.upkeep));
  const transportScale = Math.max(0, Math.min(.45, source.transport));
  const recoveryScale = Math.max(0, Math.min(.35, source.recovery));
  const visualDevelopment = enabled ? Math.max(.08, Math.min(1, source.visual)) : 0;
  return { enabled, rating: levels, generationScale, retention, upkeepScale, domainScale,
    transportScale, recoveryScale, visualDevelopment, development: visualDevelopment };
}
function totalLevels(vector) {
  let total = '0'; for (const entry of vector) total = addProgressionIntegers(total, normalizeProgressionInteger(entry.level, '0')); return total;
}
function cache(value, key) {
  const weight = (key.length + JSON.stringify(value).length) * 2;
  if (weight > EVOLUTION_COMPILE_CACHE_BYTE_LIMIT) { oversizeSkips++; return; }
  CACHE.set(key, value); WEIGHTS.set(key, weight); cacheBytes += weight;
  while (CACHE.size > EVOLUTION_COMPILE_CACHE_LIMIT || cacheBytes > EVOLUTION_COMPILE_CACHE_BYTE_LIMIT) {
    const oldest = CACHE.keys().next().value; CACHE.delete(oldest); cacheBytes -= WEIGHTS.get(oldest) ?? 0; WEIGHTS.delete(oldest); evictions++;
  }
}
export function evolutionCompileCacheDiagnostics() {
  return Object.freeze({ size: CACHE.size, limit: EVOLUTION_COMPILE_CACHE_LIMIT, bytes: cacheBytes,
    byteLimit: EVOLUTION_COMPILE_CACHE_BYTE_LIMIT, hits, misses, evictions, oversizeSkips });
}
export function resetEvolutionCompileCache() { CACHE.clear(); WEIGHTS.clear(); cacheBytes = 0; hits = 0; misses = 0; evictions = 0; oversizeSkips = 0; }
export const getEvolutionCompileCacheDiagnostics = evolutionCompileCacheDiagnostics;
export const clearEvolutionCompileCache = resetEvolutionCompileCache;
