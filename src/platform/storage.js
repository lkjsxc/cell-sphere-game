/** Versioned, corruption-safe persistence for cross-run progression. */
import { MEMORY_GRAPH_VERSION, MEMORY_NODE_IDS } from '../game/memory.js';

const KEY = 'incremental-network-game:meta:v1';
const VALID_MEMORY_IDS = new Set(MEMORY_NODE_IDS);
const TOPOLOGY = Object.freeze({ kind: 'icosphere', levels: 4, nodeCount: 2562, edgeCount: 7680 });
export const LEGACY_MEMORY_MAP = Object.freeze({
  'first-trace': 'perception-quiet-echo',
  'deep-reserve': 'reserve-deep-vault',
  'remembered-reach': 'reach-horizon-instinct',
  'flow-imprint': 'flow-channel-imprint',
  'scar-wisdom': 'ecology-tempered-scars',
  continuity: 'continuity-unbroken-lesson',
});

export function defaultMeta() {
  return {
    schema: 4, memoryGraphVersion: MEMORY_GRAPH_VERSION,
    bestScore: 0, totalEchoes: 0, echoBalance: 0, runs: 0,
    memoryNodes: [], quarantinedMemoryNodes: [], imprints: [], migrationNotice: null,
  };
}

/** Migrate any prior document into the explicit schema-4 shape. */
export function validateMeta(raw) {
  const base = defaultMeta();
  if (raw === null || typeof raw !== 'object') return base;
  const r = raw; const sourceSchema = Number.isInteger(r.schema) ? r.schema : 1;
  const out = { ...base };
  out.bestScore = boundedInteger(r.bestScore, 0);
  out.totalEchoes = boundedInteger(r.totalEchoes, 0);
  if (Number.isFinite(r.echoBalance) && r.echoBalance >= 0) out.echoBalance = Math.floor(r.echoBalance);
  else if (sourceSchema === 1) out.echoBalance = out.totalEchoes;
  out.runs = boundedInteger(r.runs, 0);
  const { valid, quarantine } = migrateMemoryIds(r.memoryNodes, sourceSchema);
  out.memoryNodes = valid;
  out.quarantinedMemoryNodes = mergeQuarantine(quarantine, r.quarantinedMemoryNodes);
  if (Array.isArray(r.imprints)) out.imprints = r.imprints.map(validateImprint).filter(Boolean).slice(-8);
  if (sourceSchema !== 4) out.migrationNotice = Object.freeze({ kind: 'memory-atlas-v4', pending: true });
  else if (validMigrationNotice(r.migrationNotice)) out.migrationNotice =
    Object.freeze({ kind: 'memory-atlas-v4', pending: r.migrationNotice.pending });
  return out;
}

function boundedInteger(value, fallback) {
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : fallback;
}

function migrateMemoryIds(raw, sourceSchema) {
  const valid = []; const quarantine = [];
  if (!Array.isArray(raw)) return { valid, quarantine };
  for (const candidate of raw) {
    if (typeof candidate !== 'string' || !/^[a-z][a-z-]{0,63}$/.test(candidate)) continue;
    const id = sourceSchema < 4 ? (LEGACY_MEMORY_MAP[candidate] ?? candidate) : candidate;
    if (VALID_MEMORY_IDS.has(id)) { if (!valid.includes(id)) valid.push(id); }
    else if (!quarantine.includes(candidate)) quarantine.push(candidate);
  }
  return { valid, quarantine };
}

function mergeQuarantine(found, raw) {
  const ids = [...found];
  if (Array.isArray(raw)) for (const id of raw) {
    if (typeof id === 'string' && /^[a-z][a-z-]{0,63}$/.test(id) && !ids.includes(id)) ids.push(id);
  }
  return ids.slice(0, 32);
}

function validMigrationNotice(value) {
  return value && typeof value === 'object' && value.kind === 'memory-atlas-v4'
    && typeof value.pending === 'boolean';
}

function validateImprint(raw) {
  if (!raw || typeof raw !== 'object' || raw.kind !== 'strongest-corridor') return null;
  if (!Number.isInteger(raw.seed) || raw.seed < 0 || raw.seed >= 0x40000000) return null;
  const topology = validateTopology(raw.topology);
  if (!topology || !Array.isArray(raw.edges)) return null;
  const edges = raw.edges.filter((edge, index, all) => Number.isInteger(edge)
    && edge >= 0 && edge < topology.edgeCount && all.indexOf(edge) === index).slice(0, 28);
  return edges.length ? { kind: 'strongest-corridor', seed: raw.seed, edges,
    topology: { ...topology } } : null;
}

function validateTopology(raw) {
  if (raw === undefined) return TOPOLOGY;
  if (!raw || typeof raw !== 'object') return null;
  return raw.kind === TOPOLOGY.kind && raw.levels === TOPOLOGY.levels
    && raw.nodeCount === TOPOLOGY.nodeCount && raw.edgeCount === TOPOLOGY.edgeCount
    ? TOPOLOGY : null;
}

export function loadMeta() {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    return validateMeta(raw ? JSON.parse(raw) : null);
  } catch { return defaultMeta(); }
}

/** Persist a validated copy without mutating the caller. */
export function saveMeta(meta) {
  try {
    if (!globalThis.localStorage || typeof globalThis.localStorage.setItem !== 'function') return false;
    globalThis.localStorage.setItem(KEY, JSON.stringify(validateMeta(meta)));
    return true;
  } catch { return false; }
}

/** @typedef {ReturnType<typeof defaultMeta>} Meta */
