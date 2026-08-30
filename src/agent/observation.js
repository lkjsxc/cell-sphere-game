/** Fair bounded projection of player-visible state. Hidden simulation and layout-generation inputs never enter it. */
import { SCORE_MODEL_VERSION } from '../game/scoring.js';
import { TROPHIES } from '../game/trophies/index.js';
import {
  EVOLUTION_ARCHETYPES, EVOLUTION_LAYOUT, EVOLUTION_TOPOLOGY, buildEvolutionProjection,
  compileEvolution, evolutionCellState, evolutionSummary, previewEvolutionLevel,
} from '../game/skills/index.js';
import { ENVIRONMENT_MODEL_VERSION, ENVIRONMENT_SCHEDULE_HASH, ENVIRONMENT_SCHEDULE_VERSION,
  environmentScheduleAtTick } from '../game/environment-level.js';
import { formatProgressionEngineering, incrementProgressionInteger, maxProgressionInteger,
  normalizeProgressionInteger } from '../core/progression-integer.js';
import { challengeDimensions } from '../simulation/challenge-profile.js';
import { AGENT_GOALS } from './schema.js';

export const OBSERVATION_SCHEMA = 9;
export const EVOLUTION_AGENT_CANDIDATE_LIMIT = 224;
const FRONTIER_CANDIDATE_LIMIT = EVOLUTION_AGENT_CANDIDATE_LIMIT - EVOLUTION_ARCHETYPES.length;
const EVOLUTION_DOMAINS = Object.freeze([...new Set(EVOLUTION_ARCHETYPES.map((archetype) => archetype.domain))]);
const DOMAIN_DISTANCE_BY_NAME = buildDomainDistances();
export const OBSERVATION_KEYS = Object.freeze([
  'schema', 'metaRevision', 'worldOrdinal', 'activeWorld', 'environmentSchedule', 'bestEnvironmentLevelReached',
  'bestEnvironmentExposure', 'echoBalance', 'echoBalanceFormatted', 'scoreModelVersion', 'bestScore', 'evolutionSummary',
  'evolutionCells', 'ownedEvolutionCells', 'availableEvolutionCells', 'habitatCapabilities', 'lastResult', 'trophySummary', 'goals',
]);
export const PUBLIC_CELL_KEYS = Object.freeze([
  'cell', 'archetypeId', 'name', 'domain', 'kind', 'tier', 'localLevel', 'nextLocalLevel',
  'aggregateRank', 'nextAggregateRank', 'nextCost', 'nextCostFormatted', 'owned', 'reachable',
  'affordable', 'reason', 'summary', 'gameplay', 'neighbors', 'rootDistance', 'domainDistance',
]);

export function buildAgentObservation(state, active = null) {
  const projection = buildEvolutionProjection(state.meta); const compiled = compileEvolution(projection);
  const candidateCells = selectCandidateCells(projection); const previewByArchetype = new Map();
  const cells = Object.freeze(candidateCells.map((cell) => publicCell(projection, cell, previewByArchetype)));
  const summary = evolutionSummary(projection); const reachableCount = count(projection.reachable);
  const schedule = environmentScheduleAtTick('0');
  return Object.freeze({ schema: OBSERVATION_SCHEMA, metaRevision: normalizeProgressionInteger(state.meta.revision, '0'),
    worldOrdinal: incrementProgressionInteger(maxProgressionInteger(state.meta.runs, state.meta.worldSeedIndex)),
    environmentSchedule: Object.freeze({ environmentModelVersion: ENVIRONMENT_MODEL_VERSION,
      environmentScheduleVersion: ENVIRONMENT_SCHEDULE_VERSION, environmentScheduleHash: ENVIRONMENT_SCHEDULE_HASH,
      idleStartEnvironmentLevel: '0', openingTicks: schedule.nextEnvironmentLevelTick }),
    activeWorld: publicActiveWorld(active), bestEnvironmentLevelReached: normalizeProgressionInteger(state.meta.bestEnvironmentLevelReached, '0'),
    bestEnvironmentExposure: publicExposure(state.meta.bestEnvironmentExposure), echoBalance: state.meta.echoBalance,
    echoBalanceFormatted: formatExact(state.meta.echoBalance), scoreModelVersion: state.meta.scoreModelVersion ?? SCORE_MODEL_VERSION,
    bestScore: state.meta.bestScore,
    evolutionSummary: Object.freeze({ ...summary, aggregateRankVersion: compiled.aggregateRankVersion,
      effectVersion: compiled.effectVersion, topologyCells: EVOLUTION_TOPOLOGY.nodeCount,
      reachableCells: reachableCount, readyCells: projection.readyCells.length,
      candidateCount: cells.length, candidateLimit: EVOLUTION_AGENT_CANDIDATE_LIMIT,
      candidatesTruncated: reachableCount > cells.length }),
    evolutionCells: cells, ownedEvolutionCells: Object.freeze(cells.filter((cell) => cell.owned)),
    availableEvolutionCells: Object.freeze(cells.filter((cell) => cell.reachable)),
    habitatCapabilities: Object.freeze([...compiled.habitatCapabilities]), lastResult: state.lastResult,
    trophySummary: trophySummary(state.meta), goals: Object.freeze({ selected: state.goal, available: AGENT_GOALS }),
  });
}

function selectCandidateCells(projection) {
  const selected = new Set(); const frontier = []; const firstFrontierByArchetype = new Map();
  const firstOwnedByArchetype = new Map();
  for (let cell = 0; cell < EVOLUTION_TOPOLOGY.nodeCount; cell++) {
    const archetype = EVOLUTION_LAYOUT.archetypeByCell[cell];
    if (projection.owned[cell] && !firstOwnedByArchetype.has(archetype)) firstOwnedByArchetype.set(archetype, cell);
    if (!projection.owned[cell] && projection.reachable[cell]) {
      frontier.push(cell); if (!firstFrontierByArchetype.has(archetype)) firstFrontierByArchetype.set(archetype, cell);
    }
  }
  for (const cell of [...firstFrontierByArchetype.values()].sort((a, b) => a - b)) selected.add(cell);
  for (const cell of frontier) if (selected.size < FRONTIER_CANDIDATE_LIMIT) selected.add(cell);
  for (const cell of [...firstOwnedByArchetype.values()].sort((a, b) => a - b)) {
    if (selected.size >= EVOLUTION_AGENT_CANDIDATE_LIMIT) break; selected.add(cell);
  }
  return Object.freeze([...selected].sort((a, b) => a - b));
}

function publicCell(projection, cell, previewByArchetype) {
  const state = evolutionCellState(projection, cell); let preview = previewByArchetype.get(state.archetypeIndex);
  if (preview === undefined) { preview = previewEvolutionLevel({ evolutionLevels: projection.vector }, cell, projection);
    previewByArchetype.set(state.archetypeIndex, preview); }
  return Object.freeze({ cell, archetypeId: state.archetypeId, name: state.nameEn, domain: state.domain,
    kind: state.kind, tier: state.tier, localLevel: state.localLevel, nextLocalLevel: state.nextLocalLevel,
    aggregateRank: state.aggregateRank, nextAggregateRank: state.nextAggregateRank, nextCost: state.nextCost,
    nextCostFormatted: state.nextCost === null ? 'Unavailable' : formatExact(state.nextCost), owned: state.owned,
    reachable: state.reachable, affordable: state.affordable, reason: state.reason, summary: state.summary,
    gameplay: Object.freeze({ before: preview?.changes?.map((change) => `${change.key}: ${format(change.before)}`).join('; ') || 'No current change',
      after: preview?.changes?.map((change) => `${change.key}: ${format(change.after)}`).join('; ') || state.summary,
      unlocks: Object.freeze(preview?.unlocked ?? []) }), neighbors: state.neighbors,
    rootDistance: EVOLUTION_LAYOUT.rootDistance[cell], domainDistance: publicDomainDistances(cell),
  });
}

function buildDomainDistances() {
  const result = Object.create(null);
  for (const domain of EVOLUTION_DOMAINS) {
    const distances = new Uint16Array(EVOLUTION_TOPOLOGY.nodeCount).fill(0xffff);
    const queue = new Uint16Array(EVOLUTION_TOPOLOGY.nodeCount); let head = 0; let tail = 0;
    for (let cell = 0; cell < EVOLUTION_TOPOLOGY.nodeCount; cell++) {
      const archetype = EVOLUTION_ARCHETYPES[EVOLUTION_LAYOUT.archetypeByCell[cell]];
      if (archetype.domain === domain) { distances[cell] = 0; queue[tail++] = cell; }
    }
    while (head < tail) {
      const cell = queue[head++];
      for (let offset = EVOLUTION_TOPOLOGY.nodeStart[cell]; offset < EVOLUTION_TOPOLOGY.nodeStart[cell + 1]; offset++) {
        const neighbor = EVOLUTION_TOPOLOGY.nodeNeighbors[offset];
        if (distances[neighbor] === 0xffff) { distances[neighbor] = distances[cell] + 1; queue[tail++] = neighbor; }
      }
    }
    result[domain] = distances;
  }
  return Object.freeze(result);
}

function publicDomainDistances(cell) {
  return Object.freeze(Object.fromEntries(EVOLUTION_DOMAINS.map((domain) => [domain, DOMAIN_DISTANCE_BY_NAME[domain][cell]])));
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
function trophySummary(meta) { const owned = new Set(meta.trophyIds ?? []); return Object.freeze({ earned: owned.size, total: TROPHIES.length,
  queued: Object.freeze([...(meta.trophyQueue ?? [])]), ids: Object.freeze(TROPHIES.filter((trophy) => owned.has(trophy.id)).map((trophy) => trophy.id)) }); }
function format(value) { return Number.isFinite(value) ? `${Math.round(value * 1000) / 1000}` : String(value); }
function formatExact(value) { const exact = normalizeProgressionInteger(value, '0'); return exact.length <= 15 ? exact.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : formatProgressionEngineering(exact, 6); }
function count(values) { let total = 0; for (const value of values) total += value ? 1 : 0; return total; }
function validVersion(value) { return Number.isInteger(value) && value > 0 ? value : 0; }
function validHash(value) { return typeof value === 'string' && /^[0-9a-f]{8}$/.test(value) ? value : null; }
