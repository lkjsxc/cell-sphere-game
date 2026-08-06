/** Fair player-visible projection. Hidden simulation and future-seed state never enter it. */
import { SCORE_MODEL_VERSION } from '../game/scoring.js';
import { TROPHIES } from '../game/trophies/index.js';
import { compileEvolution, evolutionCellState, getMemoryAdjacentIds, groupAccessibleMemory,
  previewEvolutionLevel } from '../game/skills/index.js';
import { recommendedEnvironmentLevel } from '../game/environment-level.js';
import { compileChallengeProfile } from '../simulation/challenge-profile.js';
import {formatProgressionEngineering,incrementProgressionInteger,maxProgressionInteger,
  normalizeProgressionInteger} from '../core/progression-integer.js';
import { AGENT_GOALS } from './schema.js';

export const OBSERVATION_SCHEMA = 2;
export const OBSERVATION_KEYS = Object.freeze([
  'schema', 'metaRevision', 'worldOrdinal', 'environmentLevel', 'highestEnvironmentLevel',
  'nextWorldPressure', 'echoBalance', 'echoBalanceFormatted', 'scoreModelVersion', 'bestScore',
  'worldPotential', 'evolutionSummary', 'affinities', 'evolutionCells', 'ownedEvolutionCells', 'availableEvolutionCells',
  'activeBuilds', 'nearBuilds', 'habitatCapabilities', 'lastResult', 'trophySummary', 'goals',
]);
export const PUBLIC_CELL_KEYS = Object.freeze([
  'id', 'name', 'affinity', 'tags', 'kind', 'tier', 'currentLevel', 'nextLevel', 'nextCost',
  'nextCostFormatted', 'owned', 'reachable', 'affordable', 'reason', 'gameplay', 'evolutionPower',
  'worldPotential', 'buildProgress', 'masteryContribution', 'neighbors',
]);
/** Schema-1 import compatibility; schema-2 callers use PUBLIC_CELL_KEYS. */
export const PUBLIC_SKILL_KEYS = PUBLIC_CELL_KEYS;

export function buildAgentObservation(state) {
  const compiled = compileEvolution(state.meta); const groups = groupAccessibleMemory(state.meta);
  const all = groups.flatMap((group) => group.nodes); const cells = Object.freeze(all.map((node) => publicSkill(state.meta, node, compiled)));
  const ownedEntries = Object.freeze(cells.filter((node) => node.owned));
  const availableEntries = Object.freeze(cells.filter((node) => node.reachable));
  const builds = publicBuilds(compiled); const environmentLevel = recommendedEnvironmentLevel(state.meta);
  const pressure = compileChallengeProfile({ environmentLevel, evolution:compiled });
  return Object.freeze({ schema:OBSERVATION_SCHEMA, metaRevision:normalizeProgressionInteger(state.meta.revision, '0'),
    worldOrdinal:incrementProgressionInteger(maxProgressionInteger(state.meta.runs,state.meta.worldSeedIndex)),environmentLevel,
    highestEnvironmentLevel:normalizeProgressionInteger(state.meta.highestEnvironmentLevel, '0'),
    nextWorldPressure:publicPressure(pressure),
    echoBalance:state.meta.echoBalance, echoBalanceFormatted:formatExact(state.meta.echoBalance),
    scoreModelVersion:state.meta.scoreModelVersion ?? SCORE_MODEL_VERSION,
    bestScore:state.meta.bestScore, worldPotential:compiled.worldPotential,
    evolutionSummary:Object.freeze({ breadth:compiled.affinitySummaries.reduce((sum, entry) => sum + entry.breadth, 0),
      totalLevels:compiled.totalEvolutionLevels, excessDepth:compiled.excessEvolutionDepth,
      breadthPower:compiled.breadthPower, defenseRating:compiled.evolutionDefenseRating,
      levelVectorVersion:compiled.levelVectorVersion, effectVersion:compiled.effectVersion,
      potentialVersion:compiled.potentialVersion }),
    affinities:Object.freeze(compiled.affinitySummaries.map((entry) => Object.freeze({ ...entry,
      pressureDefense:compiled.affinityDefense?.[entry.affinity] ?? '0' }))),
    evolutionCells:cells, ownedEvolutionCells:ownedEntries, availableEvolutionCells:availableEntries,
    activeBuilds:builds.active, nearBuilds:builds.near,
    habitatCapabilities:Object.freeze([...(compiled.habitatCapabilities ?? [])]),
    lastResult:state.lastResult, trophySummary:trophySummary(state.meta),
    goals:Object.freeze({ selected:state.goal, available:AGENT_GOALS }),
  });
}

export function publicAffinity(node) { return node.affinity ?? 'Fertility'; }
export function publicTags(node) { return Object.freeze([...(node.secondaryTags ?? [])]); }

function publicSkill(meta, node, compiled) {
  const state = evolutionCellState(meta, node); const preview = previewEvolutionLevel(meta, node.id);
  return Object.freeze({ id:node.id, name:node.name ?? node.nameEn ?? node.id,
    affinity:publicAffinity(node), tags:publicTags(node), kind:node.kind, tier:node.tier,
    currentLevel:state.currentLevel,nextLevel:state.nextLevel,nextCost:state.nextCost,
    nextCostFormatted:state.nextCost===null?'Unavailable at document security boundary':formatExact(state.nextCost), owned:state.owned, reachable:state.reachable,
    affordable:state.affordable, reason:state.reason,
    gameplay:Object.freeze({ before:preview?.changes?.map((change) => `${change.key}: ${format(change.before)}`).join('; ') || 'Current build',
      after:preview?.changes?.map((change) => `${change.key}: ${format(change.after)}`).join('; ')
        || node.effectEn || node.description || 'Permanent production effect',
      summary:node.effectEn ?? node.description ?? 'Permanent production effect',
      unlocks:Object.freeze((preview?.unlocked ?? []).map((entry) => entry.key)) }),
    evolutionPower:Object.freeze({ before:preview?.powerBefore ?? compiled.breadthPower,
      after:preview?.powerAfter ?? compiled.breadthPower, delta:preview?.powerGain ?? 0 }),
    worldPotential:Object.freeze({ before:preview?.potentialBefore ?? compiled.worldPotential,
      after:preview?.potentialAfter ?? compiled.worldPotential, delta:preview?.potentialDelta ?? '0' }),
    buildProgress:Object.freeze((preview?.buildProgress ?? []).map(publicBuild).slice(0, 16)),
    masteryContribution:Object.freeze({ affinityDefense:compiled.affinityDefense?.[node.affinity] ?? '0',
      builds:Object.freeze([...(node.buildContributions ?? [])]) }),
    neighbors:Object.freeze([...getMemoryAdjacentIds(node.id)]),
  });
}
function publicBuilds(compiled) {
  return Object.freeze({ active:Object.freeze((compiled.activeBuilds ?? []).map(publicBuild).slice(0, 24)),
    near:Object.freeze((compiled.nearBuilds ?? []).map(publicBuild).slice(0, 24)) });
}
function publicBuild(build) { return Object.freeze({ id:build.id, name:build.name ?? build.nameEn ?? build.id,
  progress:Number.isFinite(build.after) ? build.after : Number.isFinite(build.progress) ? build.progress : build.active ? 1 : 0,
  active:Boolean(build.active), masteryRank:normalizeProgressionInteger(build.rankAfter ?? build.masteryRank, '0'),
  nextMasteryRank:normalizeProgressionInteger(build.nextMasteryRank, '1'),
  missing:Object.freeze((build.missing ?? []).map((item) => typeof item === 'string'
    ? item : Object.freeze({ type:item.type, id:item.id, remaining:item.remaining })).slice(0, 16)),
  ingredientSupport:Object.freeze((build.ingredientSupport ?? []).map((item) => Object.freeze({ ...item }))),
  effects:Object.freeze(Object.entries(build.mechanicalEffects ?? build.effect ?? {}).map(([key, value]) => Object.freeze({ key, value }))),
  tradeoffs:Object.freeze([...(build.tradeoffs ?? [])]), habitats:Object.freeze([...(build.habitats ?? [])]) }); }
function publicPressure(profile) { return Object.freeze({ version:profile.version, environmentLevel:profile.environmentLevel,
  publicRating:profile.publicRating, hash:profile.hash,
  dimensions:Object.freeze(Object.fromEntries(Object.entries(profile.dimensions).map(([key, value]) => [key,
    Object.freeze({ environmentRating:value.environmentRating, defenseRating:value.defenseRating, pressure:value.pressure })]))),
  events:Object.freeze({ count:profile.events.count, earliestStartTick:profile.events.earliestStartTick,
    intensityMin:profile.events.intensityMin, intensityMax:profile.events.intensityMax,
    telegraphTicks:profile.events.telegraphTicks }) }); }
function trophySummary(meta) {
  const owned = new Set(meta.trophyIds ?? []); return Object.freeze({ earned:owned.size,
    total:TROPHIES.length, queued:Object.freeze([...(meta.trophyQueue ?? [])]),
    ids:Object.freeze(TROPHIES.filter((trophy) => owned.has(trophy.id)).map((trophy) => trophy.id)) });
}
function format(value) { return Number.isFinite(value) ? `${Math.round(value * 1000) / 1000}` : 'unchanged'; }
function formatExact(value) { const exact=normalizeProgressionInteger(value, '0');
  return exact.length <= 15 ? exact.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : formatProgressionEngineering(exact, 6); }
