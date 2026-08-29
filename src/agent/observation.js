/** Fair player-visible projection. Hidden simulation and future seeds never enter it. */
import { SCORE_MODEL_VERSION } from '../game/scoring.js';
import { TROPHIES } from '../game/trophies/index.js';
import { compileEvolution, evolutionCellState, getMemoryAdjacentIds, groupAccessibleMemory, previewEvolutionLevel } from '../game/skills/index.js';
import { ENVIRONMENT_MODEL_VERSION, ENVIRONMENT_SCHEDULE_HASH, ENVIRONMENT_SCHEDULE_VERSION, environmentScheduleAtTick } from '../game/environment-level.js';
import { addProgressionIntegers, formatProgressionEngineering, incrementProgressionInteger, maxProgressionInteger, normalizeProgressionInteger } from '../core/progression-integer.js';
import { challengeDimensions } from '../simulation/challenge-profile.js';
import { AGENT_GOALS } from './schema.js';

export const OBSERVATION_SCHEMA = 7;
export const OBSERVATION_KEYS = Object.freeze([
  'schema', 'metaRevision', 'worldOrdinal', 'activeWorld', 'environmentSchedule', 'bestEnvironmentLevelReached',
  'bestEnvironmentExposure', 'echoBalance', 'echoBalanceFormatted', 'scoreModelVersion', 'bestScore', 'evolutionSummary',
  'evolutionCells', 'ownedEvolutionCells', 'availableEvolutionCells', 'habitatCapabilities', 'lastResult', 'trophySummary', 'goals',
]);
export const PUBLIC_CELL_KEYS = Object.freeze([
  'id', 'name', 'domain', 'kind', 'tier', 'currentLevel', 'nextLevel', 'nextCost', 'nextCostFormatted',
  'owned', 'reachable', 'affordable', 'reason', 'summary', 'gameplay', 'neighbors',
]);
export const PUBLIC_SKILL_KEYS = PUBLIC_CELL_KEYS;
export function buildAgentObservation(state, active = null) {
  const compiled = compileEvolution(state.meta); const all = groupAccessibleMemory(state.meta).flatMap((group) => group.nodes);
  const cells = Object.freeze(all.map((node) => publicSkill(state.meta, node)));
  const schedule = environmentScheduleAtTick('0');
  return Object.freeze({ schema: OBSERVATION_SCHEMA, metaRevision: normalizeProgressionInteger(state.meta.revision, '0'),
    worldOrdinal: incrementProgressionInteger(maxProgressionInteger(state.meta.runs, state.meta.worldSeedIndex)),
    environmentSchedule: Object.freeze({ environmentModelVersion: ENVIRONMENT_MODEL_VERSION, environmentScheduleVersion: ENVIRONMENT_SCHEDULE_VERSION,
      environmentScheduleHash: ENVIRONMENT_SCHEDULE_HASH, idleStartEnvironmentLevel: '0', openingTicks: schedule.nextEnvironmentLevelTick }),
    activeWorld: publicActiveWorld(active), bestEnvironmentLevelReached: normalizeProgressionInteger(state.meta.bestEnvironmentLevelReached, '0'),
    bestEnvironmentExposure: publicExposure(state.meta.bestEnvironmentExposure), echoBalance: state.meta.echoBalance,
    echoBalanceFormatted: formatExact(state.meta.echoBalance), scoreModelVersion: state.meta.scoreModelVersion ?? SCORE_MODEL_VERSION,
    bestScore: state.meta.bestScore,
    evolutionSummary: Object.freeze({ ownedCells: compiled.totalOwnedCells, totalLevels: compiled.totalEvolutionLevels,
      domains: domainSummary(compiled.ownedNodes), levelVectorVersion: compiled.levelVectorVersion, effectVersion: compiled.effectVersion }),
    evolutionCells: cells, ownedEvolutionCells: Object.freeze(cells.filter((node) => node.owned)),
    availableEvolutionCells: Object.freeze(cells.filter((node) => node.reachable)), habitatCapabilities: Object.freeze([...compiled.habitatCapabilities]),
    lastResult: state.lastResult, trophySummary: trophySummary(state.meta), goals: Object.freeze({ selected: state.goal, available: AGENT_GOALS }),
  });
}
function publicActiveWorld(active) { if (!active) return null; return Object.freeze({ worldOrdinal: active.worldOrdinal, tick: active.tick, status: active.status,
  currentEnvironmentLevel: active.currentEnvironmentLevel, peakEnvironmentLevel: active.peakEnvironmentLevel,
  environmentScheduleVersion: active.environmentScheduleVersion, environmentProfileVersion: Number.isInteger(active.environmentProfileVersion) ? active.environmentProfileVersion : 0,
  environmentLevelStartTick: active.environmentLevelStartTick, nextEnvironmentLevelTick: active.nextEnvironmentLevelTick,
  environmentLevelProgressQ: active.environmentLevelProgressQ, environmentPressureSummary: publicEnvironmentPressure(active.environmentPressureSummary),
  environmentExposure: publicExposure(active.environmentExposure), resources: Object.freeze({ ...active.resources }), reach: active.reach,
  luminous: Object.freeze({ ...active.luminous }), }); }
function publicExposure(raw) { if (!raw || typeof raw !== 'object') return Object.freeze({ version: 0, totalTicks: '0', pressureTicksQ: '0', qualityPressureTicksQ: '0', timeAtPeakTicks: '0', peakPressureQ: 0, currentLevel: '0' });
  return Object.freeze({ version: Number.isInteger(raw.version) ? raw.version : 0, totalTicks: normalizeProgressionInteger(raw.totalTicks, '0'),
    pressureTicksQ: normalizeProgressionInteger(raw.pressureTicksQ, '0'), qualityPressureTicksQ: normalizeProgressionInteger(raw.qualityPressureTicksQ, '0'),
    timeAtPeakTicks: normalizeProgressionInteger(raw.timeAtPeakTicks, '0'), peakPressureQ: Number.isInteger(raw.peakPressureQ) ? Math.max(0, Math.min(1_000_000, raw.peakPressureQ)) : 0,
    currentLevel: normalizeProgressionInteger(raw.currentLevel, '0') }); }
export function publicEnvironmentPressure(raw) { const dimensions = {};
  for (const [key, definition] of Object.entries(challengeDimensions())) {
    const value = raw?.dimensions?.[key]; dimensions[key] = Object.freeze({ label: definition.label,
      pressure: Number.isFinite(value?.pressure) ? Math.max(0, Math.min(1, value.pressure)) : 0 });
  }
  return Object.freeze({ level: normalizeProgressionInteger(raw?.level, '0'), profileVersion: validVersion(raw?.profileVersion),
    profileHash: validHash(raw?.profileHash), nextLevel: normalizeProgressionInteger(raw?.nextLevel, '0'),
    nextProfileVersion: validVersion(raw?.nextProfileVersion), nextProfileHash: validHash(raw?.nextProfileHash),
    interpolationQ: Number.isInteger(raw?.interpolationQ) ? Math.max(0, Math.min(1_000_000, raw.interpolationQ)) : 0,
    dimensions: Object.freeze(dimensions), pressure: Number.isFinite(raw?.pressure) ? Math.max(0, Math.min(1, raw.pressure)) : 0,
    severityQ: Number.isInteger(raw?.severityQ) ? Math.max(0, Math.min(1_000_000, raw.severityQ)) : 0 }); }
function publicSkill(meta, node) {
  const state = evolutionCellState(meta, node); const preview = previewEvolutionLevel(meta, node.id);
  return Object.freeze({ id: node.id, name: node.nameEn ?? node.id, domain: node.domain, kind: node.kind, tier: node.tier,
    currentLevel: state.currentLevel, nextLevel: state.nextLevel, nextCost: state.nextCost, nextCostFormatted: state.nextCost === null ? 'Unavailable' : formatExact(state.nextCost),
    owned: state.owned, reachable: state.reachable, affordable: state.affordable, reason: state.reason, summary: node.summary,
    gameplay: Object.freeze({ before: preview?.changes?.map((change) => `${change.key}: ${format(change.before)}`).join('; ') || 'No current change',
      after: preview?.changes?.map((change) => `${change.key}: ${format(change.after)}`).join('; ') || node.summary,
      unlocks: Object.freeze(preview?.unlocked ?? []) }), neighbors: Object.freeze([...getMemoryAdjacentIds(node.id)]), });
}
function trophySummary(meta) { const owned = new Set(meta.trophyIds ?? []); return Object.freeze({ earned: owned.size, total: TROPHIES.length,
  queued: Object.freeze([...(meta.trophyQueue ?? [])]), ids: Object.freeze(TROPHIES.filter((trophy) => owned.has(trophy.id)).map((trophy) => trophy.id)) }); }
function format(value) { return Number.isFinite(value) ? `${Math.round(value * 1000) / 1000}` : String(value); }
function formatExact(value) { const exact = normalizeProgressionInteger(value, '0'); return exact.length <= 15 ? exact.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : formatProgressionEngineering(exact, 6); }
function domainSummary(nodes) { const entries = new Map();
  for (const node of nodes) { const item = entries.get(node.domain) ?? { domain: node.domain, cells: 0, levels: '0' };
    item.cells++; item.levels = addProgressionIntegers(item.levels, node.evolutionLevel); entries.set(node.domain, item); }
  return Object.freeze([...entries.values()].map((entry) => Object.freeze(entry)));
}
function validVersion(value) { return Number.isInteger(value) && value > 0 ? value : 0; }
function validHash(value) { return typeof value === 'string' && /^[0-9a-f]{8}$/.test(value) ? value : null; }
