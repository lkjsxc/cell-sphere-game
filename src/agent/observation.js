/** Fair player-visible projection. Hidden simulation and future seeds never enter it. */
import { SCORE_MODEL_VERSION } from '../game/scoring.js';
import { TROPHIES } from '../game/trophies/index.js';
import { compileEvolution, evolutionCellState, getMemoryAdjacentIds, groupAccessibleMemory,
  previewEvolutionLevel } from '../game/skills/index.js';
import {
  ENVIRONMENT_MODEL_VERSION,
  ENVIRONMENT_SCHEDULE_HASH,
  ENVIRONMENT_SCHEDULE_VERSION,
  environmentScheduleAtTick,
} from '../game/environment-level.js';
import { formatProgressionEngineering, incrementProgressionInteger, maxProgressionInteger,
  normalizeProgressionInteger } from '../core/progression-integer.js';
import { AGENT_GOALS } from './schema.js';

export const OBSERVATION_SCHEMA = 4;
export const OBSERVATION_KEYS = Object.freeze([
  'schema', 'metaRevision', 'worldOrdinal', 'activeWorld', 'environmentSchedule',
  'bestEnvironmentLevelReached', 'bestEnvironmentExposure', 'echoBalance', 'echoBalanceFormatted',
  'scoreModelVersion', 'bestScore', 'worldPotential', 'evolutionSummary', 'affinities',
  'evolutionCells', 'ownedEvolutionCells', 'availableEvolutionCells', 'activeBuilds', 'nearBuilds',
  'habitatCapabilities', 'lastResult', 'trophySummary', 'goals',
]);
export const PUBLIC_CELL_KEYS = Object.freeze([
  'id', 'name', 'affinity', 'tags', 'kind', 'tier', 'currentLevel', 'nextLevel', 'nextCost',
  'nextCostFormatted', 'owned', 'reachable', 'affordable', 'reason', 'gameplay', 'evolutionPower',
  'worldPotential', 'buildProgress', 'masteryContribution', 'neighbors',
]);
export const PUBLIC_SKILL_KEYS = PUBLIC_CELL_KEYS;

export function buildAgentObservation(state, active = null) {
  const compiled = compileEvolution(state.meta);
  const groups = groupAccessibleMemory(state.meta);
  const all = groups.flatMap((group) => group.nodes);
  const cells = Object.freeze(all.map((node) => publicSkill(state.meta, node, compiled)));
  const ownedEntries = Object.freeze(cells.filter((node) => node.owned));
  const availableEntries = Object.freeze(cells.filter((node) => node.reachable));
  const builds = publicBuilds(compiled);
  const idleSchedule = environmentScheduleAtTick('0');
  return Object.freeze({
    schema: OBSERVATION_SCHEMA,
    metaRevision: normalizeProgressionInteger(state.meta.revision, '0'),
    worldOrdinal: incrementProgressionInteger(maxProgressionInteger(state.meta.runs, state.meta.worldSeedIndex)),
    environmentSchedule: Object.freeze({ environmentModelVersion: ENVIRONMENT_MODEL_VERSION,
      environmentScheduleVersion: ENVIRONMENT_SCHEDULE_VERSION, environmentScheduleHash: ENVIRONMENT_SCHEDULE_HASH,
      idleStartEnvironmentLevel: '0', openingTicks: idleSchedule.nextEnvironmentLevelTick }),
    activeWorld: publicActiveWorld(active),
    bestEnvironmentLevelReached: normalizeProgressionInteger(state.meta.bestEnvironmentLevelReached, '0'),
    bestEnvironmentExposure: publicExposure(state.meta.bestEnvironmentExposure),
    echoBalance: state.meta.echoBalance,
    echoBalanceFormatted: formatExact(state.meta.echoBalance),
    scoreModelVersion: state.meta.scoreModelVersion ?? SCORE_MODEL_VERSION,
    bestScore: state.meta.bestScore,
    worldPotential: compiled.worldPotential,
    evolutionSummary: Object.freeze({ breadth: compiled.affinitySummaries.reduce((sum, entry) => sum + entry.breadth, 0),
      totalLevels: compiled.totalEvolutionLevels, excessDepth: compiled.excessEvolutionDepth,
      breadthPower: compiled.breadthPower, defenseRating: compiled.evolutionDefenseRating,
      levelVectorVersion: compiled.levelVectorVersion, effectVersion: compiled.effectVersion,
      potentialVersion: compiled.potentialVersion }),
    affinities: Object.freeze(compiled.affinitySummaries.map((entry) => Object.freeze({ ...entry,
      pressureDefense: compiled.affinityDefense?.[entry.affinity] ?? '0' }))),
    evolutionCells: cells, ownedEvolutionCells: ownedEntries, availableEvolutionCells: availableEntries,
    activeBuilds: builds.active, nearBuilds: builds.near,
    habitatCapabilities: Object.freeze([...(compiled.habitatCapabilities ?? [])]),
    lastResult: state.lastResult,
    trophySummary: trophySummary(state.meta),
    goals: Object.freeze({ selected: state.goal, available: AGENT_GOALS }),
  });
}

export function publicAffinity(node) { return node.affinity ?? 'Fertility'; }
export function publicTags(node) { return Object.freeze([...(node.secondaryTags ?? [])]); }

function publicActiveWorld(active) {
  if (!active) return null;
  return Object.freeze({ worldOrdinal: active.worldOrdinal, tick: active.tick, status: active.status,
    currentEnvironmentLevel: active.currentEnvironmentLevel, peakEnvironmentLevel: active.peakEnvironmentLevel,
    environmentScheduleVersion: active.environmentScheduleVersion,
    environmentProfileVersion: Number.isInteger(active.environmentProfileVersion) ? active.environmentProfileVersion : 0,
    eventDirectorVersion: Number.isInteger(active.eventDirector?.version) ? active.eventDirector.version : 0,
    environmentLevelStartTick: active.environmentLevelStartTick,
    nextEnvironmentLevelTick: active.nextEnvironmentLevelTick,
    environmentLevelProgressQ: active.environmentLevelProgressQ,
    environmentPressureSummary: publicPressure(active.environmentPressureSummary),
    environmentExposure: publicExposure(active.environmentExposure),
    onboardingEnvironmentModifier: Object.freeze({ ...active.onboardingEnvironmentModifier }),
    resources: Object.freeze({ ...active.resources }), reach: active.reach,
    electricity: Object.freeze({ ...active.electricity }),
    // Only already-active public events are present; no future director queue.
    activeEvents: Object.freeze((active.activeEvents ?? []).map((event) => Object.freeze({ ...event }))),
  });
}
function publicExposure(raw) {
  if (!raw || typeof raw !== 'object') return Object.freeze({ version: 0, totalTicks: '0', pressureTicksQ: '0',
    qualityPressureTicksQ: '0', timeAtPeakTicks: '0', peakPressureQ: 0, currentLevel: '0' });
  return Object.freeze({ version: Number.isInteger(raw.version) ? raw.version : 0,
    totalTicks: normalizeProgressionInteger(raw.totalTicks, '0'),
    pressureTicksQ: normalizeProgressionInteger(raw.pressureTicksQ, '0'),
    qualityPressureTicksQ: normalizeProgressionInteger(raw.qualityPressureTicksQ, '0'),
    timeAtPeakTicks: normalizeProgressionInteger(raw.timeAtPeakTicks, '0'),
    peakPressureQ: Number.isInteger(raw.peakPressureQ) ? Math.max(0, Math.min(1_000_000, raw.peakPressureQ)) : 0,
    currentLevel: normalizeProgressionInteger(raw.currentLevel, '0') });
}
function publicPressure(raw) {
  const coefficients = {}; const dimensions = {};
  for (const [key, value] of Object.entries(raw?.effectiveCoefficients ?? {})) {
    if (/^[a-z][A-Za-z0-9]{0,63}$/.test(key) && Number.isFinite(value)) coefficients[key] = Math.max(-1_000_000, Math.min(1_000_000, value));
  }
  for (const [key, value] of Object.entries(raw?.dimensions ?? {})) {
    if (/^[a-z][a-z-]{0,31}$/.test(key) && value && typeof value === 'object') dimensions[key] = Object.freeze({
      netRating: normalizeProgressionInteger(value.netRating, '0'),
      pressure: Number.isFinite(value.pressure) ? Math.max(0, Math.min(1, value.pressure)) : 0,
    });
  }
  return Object.freeze({ level: normalizeProgressionInteger(raw?.level, '0'),
    profileHash: typeof raw?.profileHash === 'string' ? raw.profileHash : null,
    nextLevel: normalizeProgressionInteger(raw?.nextLevel, '0'),
    nextProfileHash: typeof raw?.nextProfileHash === 'string' ? raw.nextProfileHash : null,
    interpolationQ: Number.isInteger(raw?.interpolationQ) ? Math.max(0, Math.min(1_000_000, raw.interpolationQ)) : 0,
    effectiveCoefficients: Object.freeze(coefficients), dimensions: Object.freeze(dimensions),
    pressure: Number.isFinite(raw?.pressure) ? Math.max(0, Math.min(1, raw.pressure)) : 0,
    severityQ: Number.isInteger(raw?.severityQ) ? Math.max(0, Math.min(1_000_000, raw.severityQ)) : 0 });
}

function publicSkill(meta, node, compiled) {
  const state = evolutionCellState(meta, node);
  const preview = previewEvolutionLevel(meta, node.id);
  return Object.freeze({ id: node.id, name: node.name ?? node.nameEn ?? node.id,
    affinity: publicAffinity(node), tags: publicTags(node), kind: node.kind, tier: node.tier,
    currentLevel: state.currentLevel, nextLevel: state.nextLevel, nextCost: state.nextCost,
    nextCostFormatted: state.nextCost === null ? 'Unavailable at document security boundary' : formatExact(state.nextCost),
    owned: state.owned, reachable: state.reachable, affordable: state.affordable, reason: state.reason,
    gameplay: Object.freeze({ before: preview?.changes?.map((change) => `${change.key}: ${format(change.before)}`).join('; ') || 'Current build',
      after: preview?.changes?.map((change) => `${change.key}: ${format(change.after)}`).join('; ')
        || node.effectEn || node.description || 'Permanent production effect',
      summary: node.effectEn ?? node.description ?? 'Permanent production effect',
      unlocks: Object.freeze((preview?.unlocked ?? []).map((entry) => entry.key)) }),
    evolutionPower: Object.freeze({ before: preview?.powerBefore ?? compiled.breadthPower,
      after: preview?.powerAfter ?? compiled.breadthPower, delta: preview?.powerGain ?? 0 }),
    worldPotential: Object.freeze({ before: preview?.potentialBefore ?? compiled.worldPotential,
      after: preview?.potentialAfter ?? compiled.worldPotential, delta: preview?.potentialDelta ?? '0' }),
    buildProgress: Object.freeze((preview?.buildProgress ?? []).map(publicBuild).slice(0, 16)),
    masteryContribution: Object.freeze({ affinityDefense: compiled.affinityDefense?.[node.affinity] ?? '0',
      builds: Object.freeze([...(node.buildContributions ?? [])]) }),
    neighbors: Object.freeze([...getMemoryAdjacentIds(node.id)]),
  });
}
function publicBuilds(compiled) {
  return Object.freeze({ active: Object.freeze((compiled.activeBuilds ?? []).map(publicBuild).slice(0, 24)),
    near: Object.freeze((compiled.nearBuilds ?? []).map(publicBuild).slice(0, 24)) });
}
function publicBuild(build) { return Object.freeze({ id: build.id, name: build.name ?? build.nameEn ?? build.id,
  progress: Number.isFinite(build.after) ? build.after : Number.isFinite(build.progress) ? build.progress : build.active ? 1 : 0,
  active: Boolean(build.active), masteryRank: normalizeProgressionInteger(build.rankAfter ?? build.masteryRank, '0'),
  nextMasteryRank: normalizeProgressionInteger(build.nextMasteryRank, '1'),
  missing: Object.freeze((build.missing ?? []).map((item) => typeof item === 'string'
    ? item : Object.freeze({ type: item.type, id: item.id, remaining: item.remaining })).slice(0, 16)),
  ingredientSupport: Object.freeze((build.ingredientSupport ?? []).map((item) => Object.freeze({ ...item }))),
  effects: Object.freeze(Object.entries(build.mechanicalEffects ?? build.effect ?? {}).map(([key, value]) => Object.freeze({ key, value }))),
  tradeoffs: Object.freeze([...(build.tradeoffs ?? [])]), habitats: Object.freeze([...(build.habitats ?? [])]) }); }
function trophySummary(meta) {
  const owned = new Set(meta.trophyIds ?? []);
  return Object.freeze({ earned: owned.size, total: TROPHIES.length, queued: Object.freeze([...(meta.trophyQueue ?? [])]),
    ids: Object.freeze(TROPHIES.filter((trophy) => owned.has(trophy.id)).map((trophy) => trophy.id)) });
}
function format(value) { return Number.isFinite(value) ? `${Math.round(value * 1000) / 1000}` : 'unchanged'; }
function formatExact(value) { const exact = normalizeProgressionInteger(value, '0');
  return exact.length <= 15 ? exact.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : formatProgressionEngineering(exact, 6); }
