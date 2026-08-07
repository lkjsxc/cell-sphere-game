/** Versioned, corruption-safe persistence for cross-run progression. */
import { EVOLUTION_LEVEL_VECTOR_VERSION, MEMORY_GRAPH_VERSION, MEMORY_NODE_IDS,
  getMemoryNode, normalizeEvolutionLevels } from '../game/skills/index.js';
import { LEGACY_MEMORY_BY_ID, LEGACY_MEMORY_GRAPH_VERSION } from '../game/skills/legacy-v4-manifest.js';
import { LEGACY_TROPHY_IDS, TROPHY_CATALOG_VERSION, TROPHY_IDS } from '../game/trophies/index.js';
import { TROPHY_MAX_KEYS, TROPHY_SUM_KEYS } from '../game/trophies/keys.js';
import { createGeodesicTopology, createTopology } from '../world/icosphere.js';
import { SCORE_MODEL_VERSION } from '../game/scoring.js';
import { ENVIRONMENT_MODEL_VERSION, legacyEnvironmentFrontierForRuns, normalizeEnvironmentLevel } from '../game/environment-level.js';
import { ENVIRONMENT_EXPOSURE_VERSION } from '../game/environment-exposure.js';
import { addProgressionIntegers, maxProgressionInteger,
  normalizeProgressionInteger } from '../core/progression-integer.js';
import { loadNamespacedDocument, saveNamespacedDocument } from './namespace-store.js';
const VALID_MEMORY_IDS = new Set(MEMORY_NODE_IDS);
const VALID_TROPHY_IDS = new Set(TROPHY_IDS);
const VALID_LEGACY_TROPHY_IDS = new Set(LEGACY_TROPHY_IDS);
const ATLAS_TOPOLOGY = Object.freeze({ kind: 'geodesic', frequency: 5, nodeCount: 252, edgeCount: 750 });
export const LEGACY_MEMORY_MAP = Object.freeze({
  'first-trace': 'perception-quiet-echo', 'deep-reserve': 'reserve-deep-vault',
  'remembered-reach': 'reach-horizon-instinct', 'flow-imprint': 'flow-channel-imprint',
  'scar-wisdom': 'ecology-tempered-scars', continuity: 'continuity-remembered-burden',
});

export function defaultMeta() {
  return { schema: 13, revision: '0', memoryGraphVersion: MEMORY_GRAPH_VERSION,
    memoryMigrationVersion: MEMORY_GRAPH_VERSION, evolutionLevelVectorVersion: EVOLUTION_LEVEL_VECTOR_VERSION,
    trophyVersion: TROPHY_CATALOG_VERSION,
    scoreModelVersion: SCORE_MODEL_VERSION, bestScore: '0', legacyBestScore: '0', legacyBestScores: {},
    totalEchoes: '0', echoBalance: '0', runs: '0', worldSeedIndex: '0',
    environmentRecordVersion: ENVIRONMENT_MODEL_VERSION, bestEnvironmentLevelReached: '0',
    bestEnvironmentExposure: defaultEnvironmentExposureRecord(), longestWorldTicks: '0',
    legacyEnvironmentFrontier: '0',
    resultKeys: [], evolutionTransactionKeys: [], evolutionLevels: [],
    legacyMemoryNodes: [], quarantinedMemoryNodes: [], imprints: [], trophyIds: [], legacyTrophyIds: [], trophyQueue: [], trophyBackfillVersion: 0,
    trophyProgress: { version: 4, geographyMask: 0, geographyVersion: 3,
      crisisMask: 0, lakeTypeMask: 0, lakeSalinityMask: 0, aggregate: {} },
    legacyAdaptationProgress: { ids: [], categoryMask: 0 }, migrationNotice: null };
}

/** Recognized ownership is monotonic across graph versions; topology never closes islands. */
export function validateMeta(raw) {
  const base = defaultMeta(); if (raw === null || typeof raw !== 'object') return base;
  const sourceSchema = Number.isInteger(raw.schema) ? raw.schema : 1; const out = { ...base };
  out.revision = normalizeProgressionInteger(raw.revision, '0');
  const sourceScoreVersion = boundedInteger(raw.scoreModelVersion, 1);
  const sourceBest = normalizeProgressionInteger(raw.bestScore, '0'); const legacyBestScores = {};
  if (raw.legacyBestScores && typeof raw.legacyBestScores === 'object') for (const [rawVersion, rawValue] of Object.entries(raw.legacyBestScores)) {
    const version = boundedInteger(Number(rawVersion), 0); if (version < 1 || version >= SCORE_MODEL_VERSION) continue;
    const value = normalizeProgressionInteger(rawValue, '0'); if (value !== '0') legacyBestScores[version] = value;
  }
  const undifferentiatedLegacy = normalizeProgressionInteger(raw.legacyBestScore, '0');
  if (undifferentiatedLegacy !== '0') legacyBestScores[1] = maxProgressionInteger(legacyBestScores[1] ?? '0', undifferentiatedLegacy);
  if (sourceScoreVersion === SCORE_MODEL_VERSION) out.bestScore = sourceBest;
  else if (sourceBest !== '0') {
    const version = Math.max(1, Math.min(SCORE_MODEL_VERSION - 1, sourceScoreVersion));
    legacyBestScores[version] = maxProgressionInteger(legacyBestScores[version] ?? '0', sourceBest);
  }
  out.legacyBestScores = legacyBestScores;
  out.legacyBestScore = Object.values(legacyBestScores).reduce((best, value) => maxProgressionInteger(best, value), '0');
  out.totalEchoes = normalizeProgressionInteger(raw.totalEchoes, '0');
  out.echoBalance = normalizeProgressionInteger(raw.echoBalance, sourceSchema === 1 ? out.totalEchoes : '0');
  out.runs = normalizeProgressionInteger(raw.runs, '0');
  out.worldSeedIndex = maxProgressionInteger(out.runs, normalizeProgressionInteger(raw.worldSeedIndex, out.runs));
  // Schema ≤11 treated highestEnvironmentLevel as an unlocked static frontier.
  // Preserve it as inert evidence; never infer a dynamic achieved peak from it.
  const explicitLegacyFrontier = normalizeEnvironmentLevel(raw.legacyEnvironmentFrontier, '0');
  const formerHighestEnvironmentLevel = normalizeEnvironmentLevel(raw.highestEnvironmentLevel, '0');
  out.legacyEnvironmentFrontier = explicitLegacyFrontier !== '0'
    ? explicitLegacyFrontier
    : (formerHighestEnvironmentLevel !== '0' ? formerHighestEnvironmentLevel
      : (sourceSchema >= 11 ? '0' : legacyEnvironmentFrontierForRuns(out.runs)));
  if (sourceSchema >= 12) {
    out.bestEnvironmentLevelReached = normalizeEnvironmentLevel(raw.bestEnvironmentLevelReached, '0');
    out.bestEnvironmentExposure = validateEnvironmentExposureRecord(raw.bestEnvironmentExposure);
    out.longestWorldTicks = normalizeProgressionInteger(raw.longestWorldTicks, '0');
    out.environmentRecordVersion = ENVIRONMENT_MODEL_VERSION;
  }
  if (Array.isArray(raw.resultKeys)) out.resultKeys = uniqueTransactionKeys(raw.resultKeys, 16);
  if (Array.isArray(raw.evolutionTransactionKeys)) out.evolutionTransactionKeys = uniqueTransactionKeys(raw.evolutionTransactionKeys, 32);
  const sourceGraphVersion = boundedInteger(raw.memoryGraphVersion, sourceSchema >= 4 ? LEGACY_MEMORY_GRAPH_VERSION : 3);
  const ownership=migrateMemoryIds(Array.isArray(raw.memoryNodes)?raw.memoryNodes.slice(0,1300):raw.memoryNodes,sourceSchema,sourceGraphVersion);
  out.evolutionLevels=Array.isArray(raw.evolutionLevels)
    ?normalizeEvolutionLevels({evolutionLevels:raw.evolutionLevels.slice(0,MEMORY_NODE_IDS.length*2)})
    : normalizeEvolutionLevels({ memoryNodes: ownership.valid });
  out.legacyMemoryNodes = sourceGraphVersion < MEMORY_GRAPH_VERSION
    ? ownership.legacy : uniqueLegacyIds(raw.legacyMemoryNodes);
  out.memoryMigrationVersion = MEMORY_GRAPH_VERSION;
  out.evolutionLevelVectorVersion = EVOLUTION_LEVEL_VECTOR_VERSION;
  if (sourceGraphVersion < MEMORY_GRAPH_VERSION) out.echoBalance = addProgressionIntegers(out.echoBalance, ownership.refund);
  out.quarantinedMemoryNodes = mergeQuarantine([
    ...ownership.quarantine,...quarantinedEvolutionIds(Array.isArray(raw.evolutionLevels)?raw.evolutionLevels.slice(0,MEMORY_NODE_IDS.length*2):[]),
  ], raw.quarantinedMemoryNodes);
  if(Array.isArray(raw.imprints))out.imprints=raw.imprints.slice(-16).map((value)=>validateImprint(value,sourceSchema)).filter(Boolean).slice(-8);
  if (sourceSchema >= 6) {
    const rawOwned=Array.isArray(raw.trophyIds)?raw.trophyIds.slice(0,TROPHY_IDS.length*2):[]; const ownedTrophies = new Set(rawOwned.filter((id) => VALID_TROPHY_IDS.has(id)));
    const legacy=new Set([...(Array.isArray(raw.legacyTrophyIds)?raw.legacyTrophyIds.slice(0,LEGACY_TROPHY_IDS.length*2):[]),...rawOwned]
      .filter((id)=>VALID_LEGACY_TROPHY_IDS.has(id)));
    out.trophyIds = TROPHY_IDS.filter((id) => ownedTrophies.has(id)); out.legacyTrophyIds = LEGACY_TROPHY_IDS.filter((id) => legacy.has(id));
    out.trophyBackfillVersion = [1, 2, 3].includes(raw.trophyBackfillVersion) ? raw.trophyBackfillVersion : 0;
    const queued=new Set(Array.isArray(raw.trophyQueue)?raw.trophyQueue.slice(0,TROPHY_IDS.length*2).filter((id)=>ownedTrophies.has(id)):[]);
    out.trophyQueue = TROPHY_IDS.filter((id) => queued.has(id)); out.trophyProgress = validateTrophyProgress(raw.trophyProgress);
    out.legacyAdaptationProgress = validateLegacyAdaptationProgress(raw.legacyAdaptationProgress ?? raw.trophyProgress);
  }
  if (sourceGraphVersion < MEMORY_GRAPH_VERSION) out.migrationNotice = Object.freeze({
    kind: 'evolution-frequency-5', pending: true, refund: ownership.refund,
    legacyOwned: ownership.legacy.length, currentOwned: out.evolutionLevels.length,
  });
  else if (validMigrationNotice(raw.migrationNotice)) out.migrationNotice = Object.freeze({ ...raw.migrationNotice });
  return out;
}

export function convertImprintToAtlas(imprint) { return validateImprint(imprint, 4); }

function migrateMemoryIds(raw, sourceSchema, sourceGraphVersion) {
  const valid = []; const quarantine = []; const legacy = []; let legacySpend = 0;
  if (!Array.isArray(raw)) return { valid, quarantine, legacy, refund: '0' };
  for (const candidate of raw) {
    if (typeof candidate !== 'string' || !/^[a-z][a-z-]{0,63}$/.test(candidate)) continue;
    const oldId = sourceSchema < 4 ? (LEGACY_MEMORY_MAP[candidate] ?? candidate) : candidate;
    if (sourceGraphVersion < MEMORY_GRAPH_VERSION) {
      const row = LEGACY_MEMORY_BY_ID.get(oldId);
      if (row) {
        if (!legacy.includes(oldId)) { legacy.push(oldId); legacySpend += row.oldCost; }
        if (!valid.includes(row.targetId)) valid.push(row.targetId);
      } else if (!quarantine.includes(candidate)) quarantine.push(candidate);
    } else if (VALID_MEMORY_IDS.has(oldId)) { if (!valid.includes(oldId)) valid.push(oldId); }
    else if (!quarantine.includes(candidate)) quarantine.push(candidate);
  }
  const representedCost = valid.reduce((sum, id) => sum + (getMemoryNode(id)?.cost ?? 0), 0);
  return { valid, quarantine, legacy, refund: String(Math.max(0, legacySpend - representedCost)) };
}

function validateImprint(raw, sourceSchema) {
  if (!raw || typeof raw !== 'object' || raw.kind !== 'strongest-corridor') return null;
  if (!Number.isInteger(raw.seed) || raw.seed < 0 || raw.seed >= 0x40000000) return null;
  if (Array.isArray(raw.cells)) {
    const atlas = createGeodesicTopology(5); const alreadyCurrent = raw.topology?.frequency === 5 || raw.topology?.nodeCount === 252;
    const seeds = alreadyCurrent ? uniqueCells(raw.cells, 252).slice(0, 64) : projectOldAtlasCells(raw.cells);
    const cells = morphologyCells(atlas, seeds);
    return cells.length >= 32 ? { kind: raw.kind, seed: raw.seed, cells, topology: { ...ATLAS_TOPOLOGY } } : null;
  }
  if (!Array.isArray(raw.edges) || sourceSchema >= 5) return null;
  return projectLegacyEdges(raw);
}

function projectLegacyEdges(raw) {
  const world = createTopology(4); const atlas = createGeodesicTopology(5);
  const edges = uniqueCells(raw.edges, world.edgeCount).slice(0, 28); if (!edges.length) return null;
  const projected = edges.map((edge) => nearestMidpointCell(world, atlas, edge));
  return { kind: raw.kind, seed: raw.seed, cells: morphologyCells(atlas, projected), topology: { ...ATLAS_TOPOLOGY } };
}

function projectOldAtlasCells(values) {
  const oldAtlas = createTopology(3); const atlas = createGeodesicTopology(5);
  return uniqueCells(values, 642).slice(0, 64).map((oldCell) => {
    const at = oldCell * 3; let best = 0; let score = -Infinity;
    for (let cell = 0; cell < atlas.nodeCount; cell++) { const bt = cell * 3;
      const dot = oldAtlas.positions[at] * atlas.positions[bt] + oldAtlas.positions[at + 1] * atlas.positions[bt + 1]
        + oldAtlas.positions[at + 2] * atlas.positions[bt + 2];
      if (dot > score) { score = dot; best = cell; }
    }
    return best;
  });
}

function morphologyCells(atlas, seeds) {
  const cells = [];
  for (const target of seeds) { if (!cells.length) cells.push(target);
    else for (const cell of shortestPath(atlas, cells.at(-1), target)) if (!cells.includes(cell)) cells.push(cell);
    if (cells.length >= 64) break;
  }
  const occupied = new Set(cells.slice(0, 64)); const queue = [...occupied];
  for (let head = 0; occupied.size < 32 && head < queue.length; head++) for (let offset = atlas.nodeStart[queue[head]];
    offset < atlas.nodeStart[queue[head] + 1] && occupied.size < 32; offset++) {
    const next = atlas.nodeNeighbors[offset]; if (!occupied.has(next)) { occupied.add(next); queue.push(next); }
  }
  return [...occupied].slice(0, 64);
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
  for (let head = 0; head < queue.length && previous[target] < 0; head++) for (let offset = topo.nodeStart[queue[head]]; offset < topo.nodeStart[queue[head] + 1]; offset++) {
    const next = topo.nodeNeighbors[offset]; if (previous[next] < 0) { previous[next] = queue[head]; queue.push(next); }
  }
  const path = []; for (let cell = target; cell !== start && cell >= 0; cell = previous[cell]) path.push(cell); return path.reverse();
}
function uniqueCells(values, limit) { return values.filter((value, index, all) =>
  Number.isInteger(value) && value >= 0 && value < limit && all.indexOf(value) === index); }
function validateTrophyProgress(raw) { const value = raw && typeof raw === 'object' ? raw : {}; const aggregate = {};
  const sourceVersion=boundedInteger(value.version,1);const currentOnly=new Set(['autonomousWorlds','zeroEventWorlds','scarcityWorlds','resourceDepletedCells','habitatClassMask']);
  const geographyMask = Math.min(63, boundedInteger(value.geographyMask, 0)) & ([2, 3].includes(value.geographyVersion) ? 63 : 61);
  for (const key of [...TROPHY_MAX_KEYS, ...TROPHY_SUM_KEYS]) { const amount = sourceVersion<4&&currentOnly.has(key)?0:boundedInteger(value.aggregate?.[key], 0); if (amount) aggregate[key] = Math.min(10_000_000, amount); }
  return { version: 4, geographyMask, geographyVersion: 3,
    crisisMask: Math.min(127, boundedInteger(value.crisisMask, 0)),
    lakeTypeMask: Math.min(31, boundedInteger(value.lakeTypeMask, 0)), lakeSalinityMask: Math.min(7, boundedInteger(value.lakeSalinityMask, 0)), aggregate }; }
function validateLegacyAdaptationProgress(raw) { const value = raw && typeof raw === 'object' ? raw : {};
  const ids=Array.isArray(value.ids??value.adaptationIds)?[...new Set((value.ids??value.adaptationIds).slice(0,48)
    .filter((id)=>typeof id==='string'&&/^[a-z0-9-]{1,48}$/.test(id)))].slice(0,24):[];
  return { ids, categoryMask: Math.min(63, boundedInteger(value.categoryMask ?? value.adaptationCategoryMask, 0)) }; }
function uniqueTransactionKeys(values,limit){return[...new Set(values.slice(-limit*2).filter((key)=>
  typeof key==='string'&&key.length>0&&key.length<=128))].slice(-limit)}
function quarantinedEvolutionIds(raw) { if (!Array.isArray(raw)) return [];
  return raw.map((entry) => entry?.id).filter((id) => typeof id === 'string'
    && /^[a-z][a-z-]{0,63}$/.test(id) && !VALID_MEMORY_IDS.has(id)); }
function defaultEnvironmentExposureRecord() {
  return Object.freeze({ version: ENVIRONMENT_EXPOSURE_VERSION, totalTicks: '0', pressureTicksQ: '0',
    qualityPressureTicksQ: '0', timeAtPeakTicks: '0', peakPressureQ: 0, currentLevel: '0' });
}
function validateEnvironmentExposureRecord(raw) {
  if (!raw || typeof raw !== 'object' || raw.version !== ENVIRONMENT_EXPOSURE_VERSION) return defaultEnvironmentExposureRecord();
  return Object.freeze({ version: ENVIRONMENT_EXPOSURE_VERSION,
    totalTicks: normalizeProgressionInteger(raw.totalTicks, '0'),
    pressureTicksQ: normalizeProgressionInteger(raw.pressureTicksQ, '0'),
    qualityPressureTicksQ: normalizeProgressionInteger(raw.qualityPressureTicksQ, '0'),
    timeAtPeakTicks: normalizeProgressionInteger(raw.timeAtPeakTicks, '0'),
    peakPressureQ: Math.max(0, Math.min(1_000_000, boundedInteger(raw.peakPressureQ, 0))),
    currentLevel: normalizeEnvironmentLevel(raw.currentLevel, '0') });
}
function boundedInteger(value, fallback) { return Number.isFinite(value) && value >= 0 ? Math.floor(value) : fallback; }
function mergeQuarantine(found,raw){const ids=[...new Set(found)];if(Array.isArray(raw))for(const id of raw.slice(0,64))
  if (typeof id === 'string' && /^[a-z][a-z-]{0,63}$/.test(id) && !ids.includes(id)) ids.push(id); return ids.slice(0, 32); }
function uniqueLegacyIds(raw){return Array.isArray(raw)?[...new Set(raw.slice(0,1300).filter((id)=>typeof id==='string'&&LEGACY_MEMORY_BY_ID.has(id)))].slice(0,642):[]}
function validMigrationNotice(value) { return value && typeof value === 'object' && value.kind === 'evolution-frequency-5'
  && typeof value.pending === 'boolean'; }

export function loadMeta() { return loadNamespacedDocument('meta', validateMeta, defaultMeta); }
export function saveMeta(meta) { return saveNamespacedDocument('meta', meta, validateMeta); }
/** @typedef {ReturnType<typeof defaultMeta>} Meta */
