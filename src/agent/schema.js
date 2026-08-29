/** Separate, bounded agent-save schema. Browser saves never import this document. */
import { hashStringU32, hexU32 } from '../core/hash.js';
import {incrementProgressionInteger,maxProgressionInteger,normalizeProgressionInteger} from '../core/progression-integer.js';
import { normalizeEnvironmentLevel } from '../game/environment-level.js';
import { ENVIRONMENT_EXPOSURE_VERSION } from '../game/environment-exposure.js';
import { challengeDimensions, ENVIRONMENT_PROFILE_VERSION } from '../simulation/challenge-profile.js';
import { defaultMeta, validateMeta } from '../platform/storage.js';
import { defaultHistory, validateHistory } from '../platform/history.js';

export const AGENT_SAVE_SCHEMA = 6;
export const AGENT_GOALS = Object.freeze([
  'balanced', 'breadth-first', 'depth-first', 'cheapest', 'diversity', 'weak', 'sustainability',
  'fertility', 'freshwater', 'scarcity', 'cryogenic', 'marine', 'luminous', 'worldmaking', 'reach-100',
  'conservative', 'random-legal',
]);
const GOALS = new Set(AGENT_GOALS);
const SEED_LIMIT = 0x100000000;

export function defaultAgentSave(seed = 0) {
  return canonical({ campaignSeed: validSeed(seed) ? seed : 0, meta: defaultMeta(),
    history: defaultHistory(), goal: 'balanced', lastResult: null });
}

export function validateAgentSave(raw) {
  if (!raw || typeof raw !== 'object' || raw.schema !== AGENT_SAVE_SCHEMA) return defaultAgentSave();
  return canonical({ campaignSeed: validSeed(raw.campaignSeed) ? raw.campaignSeed : 0,
    meta: validateMeta(raw.meta), history: validateHistory(raw.history),
    goal: GOALS.has(raw.goal) ? raw.goal : 'balanced', lastResult: validateLastResult(raw.lastResult) });
}

export function exportAgentSave(value) {
  const state = validateAgentSave({ ...value, schema: AGENT_SAVE_SCHEMA });
  return Object.freeze({ ...state, stateHash: hashAgentSave(state) });
}

export function hashAgentSave(value) {
  const canonicalState = canonical(value);
  return hexU32(hashStringU32(JSON.stringify(canonicalState)));
}

function canonical(value) {
  const meta = validateMeta(value?.meta); const history = validateHistory(value?.history);
  return Object.freeze({ schema: AGENT_SAVE_SCHEMA,
    campaignSeed:validSeed(value?.campaignSeed)?value.campaignSeed:0,
    worldOrdinal:incrementProgressionInteger(maxProgressionInteger(meta.runs,meta.worldSeedIndex)), goal: GOALS.has(value?.goal) ? value.goal : 'balanced',
    meta, history, lastResult: validateLastResult(value?.lastResult) });
}

function validateLastResult(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const worldOrdinal = normalizeProgressionInteger(raw.worldOrdinal, '0');
  const score = normalizeProgressionInteger(raw.score, '0');
  if (worldOrdinal === '0') return null;
  const habitats = {};
  for (const key of ['lake', 'tundra', 'snowIce', 'shallowOcean', 'deepOcean'])
    habitats[key] = integer(raw.habitats?.[key]) ?? 0;
  if (raw.startEnvironmentLevel !== '0' || raw.finalEnvironmentLevel === undefined) return null;
  const environmentProfileVersion = integer(raw.environmentProfileVersion, 1) ?? 0;
  return Object.freeze({ resultSchemaVersion: integer(raw.resultSchemaVersion, 1) ?? 0, worldOrdinal,
    startEnvironmentLevel: '0',
    finalEnvironmentLevel: normalizeEnvironmentLevel(raw.finalEnvironmentLevel, '0'),
    peakEnvironmentLevel: normalizeEnvironmentLevel(raw.peakEnvironmentLevel, raw.finalEnvironmentLevel ?? '0'),
    bestEnvironmentLevelReached: normalizeEnvironmentLevel(raw.bestEnvironmentLevelReached, '0'),
    environmentScheduleVersion: integer(raw.environmentScheduleVersion, 1) ?? 0,
    environmentProfileVersion,
    environmentExposure: validateExposure(raw.environmentExposure),
    timeAtPeakTicks: normalizeProgressionInteger(raw.timeAtPeakTicks, '0'),
    archetype: text(raw.archetype, 40, 'Living World'), survivalSeconds: finite(raw.survivalSeconds),
    cause: text(raw.cause, 32, 'unknown'), terminalCause: text(raw.terminalCause, 32, 'unknown'),
    score, scoreModelVersion: integer(raw.scoreModelVersion, 1) ?? 1,
    rank: text(raw.rank, 64, 'Seed'), echoes:normalizeProgressionInteger(raw.echoes, '0'), peakReach: fraction(raw.peakReach),
    pressure:validatePressure(raw.pressure, environmentProfileVersion),
    sustainedReach: fraction(raw.sustainedReach), peakConnectedShare: fraction(raw.peakConnectedShare),
    resources: Object.freeze({ initial: finite(raw.resources?.initial), final: finite(raw.resources?.final),
      depletedCells: integer(raw.resources?.depletedCells) ?? 0, recoveredCells: integer(raw.resources?.recoveredCells) ?? 0,
      freshwaterSupportedCellSeconds: finite(raw.resources?.freshwaterSupportedCellSeconds),
      livingTicksByQuintile: Object.freeze(Array.from({ length: 5 }, (_, index) => finite(raw.resources?.livingTicksByQuintile?.[index]))) }),
    habitats: Object.freeze(habitats),
    worldmaking: Object.freeze({ transformedCells: integer(raw.worldmaking?.transformedCells) ?? 0,
      glacialLakeCells: integer(raw.worldmaking?.glacialLakeCells) ?? 0,
      maritimeForestCells: integer(raw.worldmaking?.maritimeForestCells) ?? 0,
      electrifiedCells: integer(raw.worldmaking?.electrifiedCells) ?? 0,
      finalElectrifiedCells: integer(raw.worldmaking?.finalElectrifiedCells) ?? 0,
      everPoweredCells: integer(raw.worldmaking?.everPoweredCells) ?? 0,
      poweredCellSeconds: finite(raw.worldmaking?.poweredCellSeconds) }),
    reach: Object.freeze({ gained: integer(raw.reach?.gained) ?? 0, lost: integer(raw.reach?.lost) ?? 0,
      peakLandOccupancy: fraction(raw.reach?.peakLandOccupancy), reach100: raw.reach?.reach100 === true }),
    stateHash: typeof raw.stateHash === 'string' ? raw.stateHash.slice(0, 16) : '',
    trophiesAwarded: strings(raw.trophiesAwarded, 96),
  });
}
function validateExposure(raw) {
  if (!raw || typeof raw !== 'object' || raw.version !== ENVIRONMENT_EXPOSURE_VERSION) {
    return Object.freeze({ version: ENVIRONMENT_EXPOSURE_VERSION, totalTicks: '0', pressureTicksQ: '0',
      qualityPressureTicksQ: '0', timeAtPeakTicks: '0', peakPressureQ: 0, currentLevel: '0' });
  }
  return Object.freeze({ version: ENVIRONMENT_EXPOSURE_VERSION,
    totalTicks: normalizeProgressionInteger(raw.totalTicks, '0'), pressureTicksQ: normalizeProgressionInteger(raw.pressureTicksQ, '0'),
    qualityPressureTicksQ: normalizeProgressionInteger(raw.qualityPressureTicksQ, '0'),
    timeAtPeakTicks: normalizeProgressionInteger(raw.timeAtPeakTicks, '0'),
    peakPressureQ: Math.max(0, Math.min(1_000_000, integer(raw.peakPressureQ) ?? 0)),
    currentLevel: normalizeEnvironmentLevel(raw.currentLevel, '0') });
}
function validatePressure(raw, environmentProfileVersion) {
  if (!raw || typeof raw !== 'object') return null;
  const dimensions = {}; const definitions = challengeDimensions();
  const detailAvailable = environmentProfileVersion === ENVIRONMENT_PROFILE_VERSION
    && raw.profileVersion === ENVIRONMENT_PROFILE_VERSION
    && raw.nextProfileVersion === ENVIRONMENT_PROFILE_VERSION
    && Object.keys(definitions).every((key) => Number.isFinite(raw.dimensions?.[key]?.pressure));
  if (detailAvailable) {
    for (const [key, definition] of Object.entries(definitions)) {
      const value = raw.dimensions?.[key]; dimensions[key] = Object.freeze({
        label: definition.label, pressure:fraction(value?.pressure),
      });
    }
  }
  return Object.freeze({ level: normalizeEnvironmentLevel(raw.level ?? raw.environmentLevel, '0'),
    profileVersion: detailAvailable ? ENVIRONMENT_PROFILE_VERSION : environmentProfileVersion,
    profileHash: validHash(raw.profileHash), nextLevel: normalizeEnvironmentLevel(raw.nextLevel, raw.level ?? '0'),
    nextProfileVersion: detailAvailable ? ENVIRONMENT_PROFILE_VERSION : 0,
    nextProfileHash: detailAvailable ? validHash(raw.nextProfileHash) : '',
    interpolationQ: Math.max(0, Math.min(1_000_000, integer(raw.interpolationQ) ?? 0)),
    pressure: fraction(raw.pressure), severityQ: Math.max(0, Math.min(1_000_000, integer(raw.severityQ) ?? 0)),
    detailAvailable, dimensions:Object.freeze(dimensions) });
}
function validSeed(value) { return Number.isInteger(value) && value >= 0 && value < SEED_LIMIT; }
function integer(value, min = 0) { return Number.isFinite(value) && value >= min ? Math.floor(value) : null; }
function finite(value) { return Number.isFinite(value) && value >= 0 ? value : 0; }
function fraction(value) { return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)); }
function text(value, max, fallback) { return typeof value === 'string' && value ? value.slice(0, max) : fallback; }
function validHash(value) { return typeof value === 'string' && /^[0-9a-f]{8}$/.test(value) ? value : ''; }
function strings(value, max) { return Object.freeze(Array.isArray(value)
  ? [...new Set(value.filter((item) => typeof item === 'string'))].slice(0, max) : []); }
