/** Current-only, corruption-safe persistence for cross-run progression. */
import { EVOLUTION_LEVEL_VECTOR_VERSION, MEMORY_GRAPH_VERSION, MEMORY_NODE_IDS,
  normalizeEvolutionLevels } from '../game/skills/index.js';
import { TROPHY_CATALOG_VERSION, TROPHY_IDS } from '../game/trophies/index.js';
import { TROPHY_MAX_KEYS, TROPHY_SUM_KEYS } from '../game/trophies/keys.js';
import { createGeodesicTopology, createTopology } from '../world/icosphere.js';
import { SCORE_MODEL_VERSION } from '../game/scoring.js';
import { ENVIRONMENT_MODEL_VERSION, normalizeEnvironmentLevel } from '../game/environment-level.js';
import { ENVIRONMENT_EXPOSURE_VERSION } from '../game/environment-exposure.js';
import { maxProgressionInteger, normalizeProgressionInteger } from '../core/progression-integer.js';
import { loadNamespacedDocument, saveNamespacedDocument } from './namespace-store.js';

const VALID_TROPHY_IDS = new Set(TROPHY_IDS);
const EVOLUTION_TOPOLOGY = Object.freeze({ kind: 'geodesic', frequency: 2, nodeCount: 42, edgeCount: 120 });

export function defaultMeta() {
  return { schema: 15, revision: '0', memoryGraphVersion: MEMORY_GRAPH_VERSION,
    evolutionLevelVectorVersion: EVOLUTION_LEVEL_VECTOR_VERSION, trophyVersion: TROPHY_CATALOG_VERSION,
    scoreModelVersion: SCORE_MODEL_VERSION, bestScore: '0', totalEchoes: '0', echoBalance: '0',
    runs: '0', worldSeedIndex: '0', environmentRecordVersion: ENVIRONMENT_MODEL_VERSION,
    bestEnvironmentLevelReached: '0', bestEnvironmentExposure: defaultEnvironmentExposureRecord(), longestWorldTicks: '0',
    resultKeys: [], evolutionTransactionKeys: [], evolutionLevels: [], imprints: [], trophyIds: [], trophyQueue: [],
    trophyProgress: { version: 5, geographyMask: 0, geographyVersion: 3,
      lakeTypeMask: 0, lakeSalinityMask: 0, aggregate: {} } };
}

/** A mismatched document deliberately starts fresh; no legacy migrations exist. */
export function validateMeta(raw) {
  const base = defaultMeta();
  if (!raw || typeof raw !== 'object' || raw.schema !== base.schema) return base;
  const out = { ...base };
  out.revision = normalizeProgressionInteger(raw.revision, '0');
  out.totalEchoes = normalizeProgressionInteger(raw.totalEchoes, '0');
  out.echoBalance = normalizeProgressionInteger(raw.echoBalance, '0');
  out.runs = normalizeProgressionInteger(raw.runs, '0');
  out.worldSeedIndex = maxProgressionInteger(out.runs, normalizeProgressionInteger(raw.worldSeedIndex, out.runs));
  out.bestScore = raw.scoreModelVersion === SCORE_MODEL_VERSION ? normalizeProgressionInteger(raw.bestScore, '0') : '0';
  out.bestEnvironmentLevelReached = normalizeEnvironmentLevel(raw.bestEnvironmentLevelReached, '0');
  out.bestEnvironmentExposure = validateEnvironmentExposureRecord(raw.bestEnvironmentExposure);
  out.longestWorldTicks = normalizeProgressionInteger(raw.longestWorldTicks, '0');
  if (Array.isArray(raw.resultKeys)) out.resultKeys = uniqueTransactionKeys(raw.resultKeys, 16);
  if (Array.isArray(raw.evolutionTransactionKeys)) out.evolutionTransactionKeys = uniqueTransactionKeys(raw.evolutionTransactionKeys, 32);
  out.evolutionLevels = Array.isArray(raw.evolutionLevels)
    ? normalizeEvolutionLevels({ evolutionLevels: raw.evolutionLevels.slice(0, MEMORY_NODE_IDS.length * 2) })
    : [];
  if (Array.isArray(raw.imprints)) out.imprints = raw.imprints.slice(-16).map(validateImprint).filter(Boolean).slice(-8);
  const owned = new Set(Array.isArray(raw.trophyIds) ? raw.trophyIds.filter((id) => VALID_TROPHY_IDS.has(id)) : []);
  out.trophyIds = TROPHY_IDS.filter((id) => owned.has(id));
  const queued = new Set(Array.isArray(raw.trophyQueue) ? raw.trophyQueue.filter((id) => owned.has(id)) : []);
  out.trophyQueue = TROPHY_IDS.filter((id) => queued.has(id));
  out.trophyProgress = validateTrophyProgress(raw.trophyProgress);
  return out;
}

/** Convert a current run's world-edge imprint to the compact Evolution sphere. */
export function convertImprintToAtlas(imprint) {
  if (!imprint || typeof imprint !== 'object' || imprint.kind !== 'strongest-corridor') return null;
  if (!Number.isInteger(imprint.seed) || imprint.seed < 0 || imprint.seed >= 0x100000000) return null;
  const world = createTopology(4); const evolution = createGeodesicTopology(2);
  const edges = uniqueCells(imprint.edges, world.edgeCount).slice(0, 20); if (!edges.length) return null;
  const cells = morphologyCells(evolution, edges.map((edge) => nearestMidpointCell(world, evolution, edge)));
  return cells.length >= 12 ? { kind: imprint.kind, seed: imprint.seed, cells, topology: { ...EVOLUTION_TOPOLOGY } } : null;
}

function validateImprint(raw) {
  if (!raw || typeof raw !== 'object' || raw.kind !== 'strongest-corridor') return null;
  if (!Number.isInteger(raw.seed) || raw.seed < 0 || raw.seed >= 0x100000000) return null;
  if (raw.topology?.frequency !== 2 || raw.topology?.nodeCount !== 42) return null;
  const cells = uniqueCells(raw.cells, 42).slice(0, 20);
  return cells.length >= 12 ? { kind: raw.kind, seed: raw.seed, cells, topology: { ...EVOLUTION_TOPOLOGY } } : null;
}
function morphologyCells(atlas, seeds) {
  const cells = [];
  for (const target of seeds) { if (!cells.length) cells.push(target);
    else for (const cell of shortestPath(atlas, cells.at(-1), target)) if (!cells.includes(cell)) cells.push(cell);
    if (cells.length >= 20) break;
  }
  const occupied = new Set(cells.slice(0, 20)); const queue = [...occupied];
  for (let head = 0; occupied.size < 12 && head < queue.length; head++) for (let offset = atlas.nodeStart[queue[head]];
    offset < atlas.nodeStart[queue[head] + 1] && occupied.size < 12; offset++) {
    const next = atlas.nodeNeighbors[offset]; if (!occupied.has(next)) { occupied.add(next); queue.push(next); }
  }
  return [...occupied].slice(0, 20);
}
function nearestMidpointCell(world, atlas, edge) {
  const a = world.edgeA[edge] * 3; const b = world.edgeB[edge] * 3;
  const x = world.positions[a] + world.positions[b]; const y = world.positions[a + 1] + world.positions[b + 1];
  const z = world.positions[a + 2] + world.positions[b + 2]; let best = 0; let score = -Infinity;
  for (let cell = 0; cell < atlas.nodeCount; cell++) { const at = cell * 3;
    const dot = x * atlas.positions[at] + y * atlas.positions[at + 1] + z * atlas.positions[at + 2];
    if (dot > score) { score = dot; best = cell; }
  }
  return best;
}
function shortestPath(topo, start, target) {
  if (start === target) return [target]; const previous = new Int16Array(topo.nodeCount).fill(-1); previous[start] = start; const queue = [start];
  for (let head = 0; head < queue.length && previous[target] < 0; head++) for (let offset = topo.nodeStart[queue[head]];
    offset < topo.nodeStart[queue[head] + 1]; offset++) {
    const next = topo.nodeNeighbors[offset]; if (previous[next] < 0) { previous[next] = queue[head]; queue.push(next); }
  }
  const path = []; for (let cell = target; cell !== start && cell >= 0; cell = previous[cell]) path.push(cell); return path.reverse();
}
function uniqueCells(values, limit) { return Array.isArray(values) ? values.filter((value, index, all) =>
  Number.isInteger(value) && value >= 0 && value < limit && all.indexOf(value) === index) : []; }
function validateTrophyProgress(raw) {
  const value = raw && typeof raw === 'object' ? raw : {}; const aggregate = {};
  const geographyMask = Math.min(63, boundedInteger(value.geographyMask, 0)) & 63;
  for (const key of [...TROPHY_MAX_KEYS, ...TROPHY_SUM_KEYS]) {
    const amount = boundedInteger(value.aggregate?.[key], 0);
    const maximum = key === 'environmentPressureTicksQ' ? 1_000_000_000 : 10_000_000;
    if (amount) aggregate[key] = Math.min(maximum, amount);
  }
  return { version: 5, geographyMask, geographyVersion: 3,
    lakeTypeMask: Math.min(31, boundedInteger(value.lakeTypeMask, 0)),
    lakeSalinityMask: Math.min(7, boundedInteger(value.lakeSalinityMask, 0)), aggregate };
}
function uniqueTransactionKeys(values, limit) { return [...new Set(values.slice(-limit * 2).filter((key) =>
  typeof key === 'string' && key.length > 0 && key.length <= 128))].slice(-limit); }
function defaultEnvironmentExposureRecord() {
  return Object.freeze({ version: ENVIRONMENT_EXPOSURE_VERSION, totalTicks: '0', pressureTicksQ: '0',
    qualityPressureTicksQ: '0', timeAtPeakTicks: '0', peakPressureQ: 0, currentLevel: '0' });
}
function validateEnvironmentExposureRecord(raw) {
  if (!raw || typeof raw !== 'object' || raw.version !== ENVIRONMENT_EXPOSURE_VERSION) return defaultEnvironmentExposureRecord();
  return Object.freeze({ version: ENVIRONMENT_EXPOSURE_VERSION,
    totalTicks: normalizeProgressionInteger(raw.totalTicks, '0'), pressureTicksQ: normalizeProgressionInteger(raw.pressureTicksQ, '0'),
    qualityPressureTicksQ: normalizeProgressionInteger(raw.qualityPressureTicksQ, '0'),
    timeAtPeakTicks: normalizeProgressionInteger(raw.timeAtPeakTicks, '0'),
    peakPressureQ: Math.max(0, Math.min(1_000_000, boundedInteger(raw.peakPressureQ, 0))),
    currentLevel: normalizeEnvironmentLevel(raw.currentLevel, '0') });
}
function boundedInteger(value, fallback) { return Number.isFinite(value) && value >= 0 ? Math.floor(value) : fallback; }

export function loadMeta() { return loadNamespacedDocument('meta', validateMeta, defaultMeta); }
export function saveMeta(meta) { return saveNamespacedDocument('meta', meta, validateMeta); }
/** @typedef {ReturnType<typeof defaultMeta>} Meta */
