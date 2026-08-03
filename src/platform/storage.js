/** Versioned, corruption-safe persistence for cross-run progression. */
import { ADAPTATIONS } from '../game/adaptations.js';
import { MEMORY_GRAPH_VERSION, MEMORY_NODE_IDS } from '../game/skills/index.js';
import { LEGACY_TROPHY_IDS, TROPHY_CATALOG_VERSION, TROPHY_IDS } from '../game/trophies/index.js';
import { TROPHY_MAX_KEYS, TROPHY_SUM_KEYS } from '../game/trophies/keys.js';
import { createTopology } from '../world/icosphere.js';

const KEY = 'incremental-network-game:meta:v1';
const VALID_MEMORY_IDS = new Set(MEMORY_NODE_IDS);
const VALID_TROPHY_IDS = new Set(TROPHY_IDS);
const VALID_LEGACY_TROPHY_IDS = new Set(LEGACY_TROPHY_IDS);
const VALID_ADAPTATION_IDS = new Set(ADAPTATIONS.map((card) => card.id));
const ATLAS_TOPOLOGY = Object.freeze({ kind: 'icosphere', levels: 3, nodeCount: 642, edgeCount: 1920 });
export const LEGACY_MEMORY_MAP = Object.freeze({
  'first-trace': 'perception-quiet-echo', 'deep-reserve': 'reserve-deep-vault',
  'remembered-reach': 'reach-horizon-instinct', 'flow-imprint': 'flow-channel-imprint',
  'scar-wisdom': 'ecology-tempered-scars', continuity: 'continuity-remembered-burden',
});

export function defaultMeta() {
  return { schema: 8, memoryGraphVersion: MEMORY_GRAPH_VERSION, trophyVersion: TROPHY_CATALOG_VERSION,
    bestScore: 0, totalEchoes: 0, echoBalance: 0, runs: 0, worldSeedIndex: 0,
    memoryNodes: [], quarantinedMemoryNodes: [], imprints: [], trophyIds: [], legacyTrophyIds: [], trophyQueue: [], trophyBackfillVersion: 0,
    trophyProgress: { version: 3, adaptationIds: [], geographyMask: 0, geographyVersion: 3,
      crisisMask: 0, adaptationCategoryMask: 0, lakeTypeMask: 0, lakeSalinityMask: 0, aggregate: {} }, migrationNotice: null };
}

/** Recognized ownership is monotonic across graph versions; topology never closes islands. */
export function validateMeta(raw) {
  const base = defaultMeta(); if (raw === null || typeof raw !== 'object') return base;
  const sourceSchema = Number.isInteger(raw.schema) ? raw.schema : 1; const out = { ...base };
  out.bestScore = boundedInteger(raw.bestScore, 0); out.totalEchoes = boundedInteger(raw.totalEchoes, 0);
  out.echoBalance = Number.isFinite(raw.echoBalance) && raw.echoBalance >= 0 ? Math.floor(raw.echoBalance)
    : sourceSchema === 1 ? out.totalEchoes : 0;
  out.runs = boundedInteger(raw.runs, 0);
  out.worldSeedIndex = Math.max(out.runs, boundedInteger(raw.worldSeedIndex, out.runs));
  const ownership = migrateMemoryIds(raw.memoryNodes, sourceSchema);
  out.memoryNodes = MEMORY_NODE_IDS.filter((id) => ownership.valid.includes(id));
  out.quarantinedMemoryNodes = mergeQuarantine(ownership.quarantine, raw.quarantinedMemoryNodes);
  if (Array.isArray(raw.imprints)) out.imprints = raw.imprints.map((value) => validateImprint(value, sourceSchema)).filter(Boolean).slice(-8);
  if (sourceSchema >= 6) {
    const rawOwned = Array.isArray(raw.trophyIds) ? raw.trophyIds : []; const ownedTrophies = new Set(rawOwned.filter((id) => VALID_TROPHY_IDS.has(id)));
    const legacy = new Set([...(Array.isArray(raw.legacyTrophyIds) ? raw.legacyTrophyIds : []), ...rawOwned].filter((id) => VALID_LEGACY_TROPHY_IDS.has(id)));
    out.trophyIds = TROPHY_IDS.filter((id) => ownedTrophies.has(id)); out.legacyTrophyIds = LEGACY_TROPHY_IDS.filter((id) => legacy.has(id));
    out.trophyBackfillVersion = raw.trophyBackfillVersion === 2 ? 2 : raw.trophyBackfillVersion === 1 ? 1 : 0;
    const queued = new Set(Array.isArray(raw.trophyQueue) ? raw.trophyQueue.filter((id) => ownedTrophies.has(id)) : []);
    out.trophyQueue = TROPHY_IDS.filter((id) => queued.has(id)); out.trophyProgress = validateTrophyProgress(raw.trophyProgress);
  }
  if (sourceSchema < 5) out.migrationNotice = Object.freeze({ kind: 'memory-atlas-v5', pending: true });
  else if (validMigrationNotice(raw.migrationNotice)) out.migrationNotice =
    Object.freeze({ kind: 'memory-atlas-v5', pending: raw.migrationNotice.pending });
  return out;
}

export function convertImprintToAtlas(imprint) { return validateImprint(imprint, 4); }

function migrateMemoryIds(raw, sourceSchema) {
  const valid = []; const quarantine = []; if (!Array.isArray(raw)) return { valid, quarantine };
  for (const candidate of raw) {
    if (typeof candidate !== 'string' || !/^[a-z][a-z-]{0,63}$/.test(candidate)) continue;
    const id = sourceSchema < 4 ? (LEGACY_MEMORY_MAP[candidate] ?? candidate) : candidate;
    if (VALID_MEMORY_IDS.has(id)) { if (!valid.includes(id)) valid.push(id); }
    else if (!quarantine.includes(candidate)) quarantine.push(candidate);
  }
  return { valid, quarantine };
}

function validateImprint(raw, sourceSchema) {
  if (!raw || typeof raw !== 'object' || raw.kind !== 'strongest-corridor') return null;
  if (!Number.isInteger(raw.seed) || raw.seed < 0 || raw.seed >= 0x40000000) return null;
  if (Array.isArray(raw.cells)) {
    const cells = morphologyCells(createTopology(3), uniqueCells(raw.cells, 642).slice(0, 64));
    return cells.length >= 32 ? { kind: raw.kind, seed: raw.seed, cells, topology: { ...ATLAS_TOPOLOGY } } : null;
  }
  if (!Array.isArray(raw.edges) || sourceSchema >= 5) return null;
  return projectLegacyEdges(raw);
}

function projectLegacyEdges(raw) {
  const world = createTopology(4); const atlas = createTopology(3);
  const edges = uniqueCells(raw.edges, world.edgeCount).slice(0, 28); if (!edges.length) return null;
  const projected = edges.map((edge) => nearestMidpointCell(world, atlas, edge));
  return { kind: raw.kind, seed: raw.seed, cells: morphologyCells(atlas, projected), topology: { ...ATLAS_TOPOLOGY } };
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
function validateTrophyProgress(raw) { const value = raw && typeof raw === 'object' ? raw : {}; const adaptationIds = []; const aggregate = {};
  if (Array.isArray(value.adaptationIds)) for (const id of value.adaptationIds) if (VALID_ADAPTATION_IDS.has(id) && !adaptationIds.includes(id)) adaptationIds.push(id);
  const geographyMask = Math.min(63, boundedInteger(value.geographyMask, 0)) & ([2, 3].includes(value.geographyVersion) ? 63 : 61);
  for (const key of [...TROPHY_MAX_KEYS, ...TROPHY_SUM_KEYS]) { const amount = boundedInteger(value.aggregate?.[key], 0); if (amount) aggregate[key] = Math.min(10_000_000, amount); }
  return { version: 3, adaptationIds, geographyMask, geographyVersion: 3,
    crisisMask: Math.min(127, boundedInteger(value.crisisMask, 0)), adaptationCategoryMask: Math.min(63, boundedInteger(value.adaptationCategoryMask, 0)),
    lakeTypeMask: Math.min(31, boundedInteger(value.lakeTypeMask, 0)), lakeSalinityMask: Math.min(7, boundedInteger(value.lakeSalinityMask, 0)), aggregate }; }
function boundedInteger(value, fallback) { return Number.isFinite(value) && value >= 0 ? Math.floor(value) : fallback; }
function mergeQuarantine(found, raw) { const ids = [...new Set(found)]; if (Array.isArray(raw)) for (const id of raw)
  if (typeof id === 'string' && /^[a-z][a-z-]{0,63}$/.test(id) && !ids.includes(id)) ids.push(id); return ids.slice(0, 32); }
function validMigrationNotice(value) { return value && typeof value === 'object' && value.kind === 'memory-atlas-v5' && typeof value.pending === 'boolean'; }

export function loadMeta() { try { const raw = globalThis.localStorage?.getItem(KEY); return validateMeta(raw ? JSON.parse(raw) : null); }
  catch { return defaultMeta(); } }
export function saveMeta(meta) { try { if (!globalThis.localStorage?.setItem) return false;
    globalThis.localStorage.setItem(KEY, JSON.stringify(validateMeta(meta))); return true; } catch { return false; } }
/** @typedef {ReturnType<typeof defaultMeta>} Meta */
