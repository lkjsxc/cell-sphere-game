/** Authored Evolution graph: exact transactions, adjacency, and direct ecology compilation. */
import { EVOLUTION_CATALOG, EVOLUTION_DOMAINS, EVOLUTION_NODE_IDS } from './catalog.js';
import { renderMemorySnapshot } from './scene.js';
import { EVOLUTION_COST_VERSION, evolutionCostForTargetLevel, nextEvolutionCostForNode } from './cost.js';
import {
  EVOLUTION_LEVEL_DOCUMENT_DIGIT_LIMIT, EVOLUTION_LEVEL_VECTOR_VERSION, boundedEvolutionLevelRefinement,
  canonicalLevelVectorKey, levelFromVector, levelMapFromVector, normalizeEvolutionLevelVector,
  normalizedMetaRevision, ownedIdsFromVector, replaceEvolutionLevel,
} from './levels.js';
import {
  EVOLUTION_COMPILE_CACHE_BYTE_LIMIT, EVOLUTION_COMPILE_CACHE_LIMIT, EVOLUTION_EFFECT_VERSION,
  clearEvolutionCompileCache, compileEvolutionVector, evolutionCompileCacheDiagnostics,
  getEvolutionCompileCacheDiagnostics, resetEvolutionCompileCache,
} from './effects.js';
import { addProgressionIntegers, compareProgressionIntegers, incrementProgressionInteger, normalizeProgressionInteger,
  parseProgressionInteger, ProgressionIntegerError, subtractProgressionIntegers } from '../../core/progression-integer.js';
import { hashStringU32, hexU32 } from '../../core/hash.js';
import { createGeodesicTopology } from '../../world/icosphere.js';
import { createEvolutionTerritoryProjection } from './territories.js';

export { createMemoryFields } from './scene.js';
export { EVOLUTION_COST_VERSION, evolutionCostForTargetLevel } from './cost.js';
export { EVOLUTION_EFFECT_VERSION, EVOLUTION_COMPILE_CACHE_LIMIT, EVOLUTION_COMPILE_CACHE_BYTE_LIMIT,
  clearEvolutionCompileCache, evolutionCompileCacheDiagnostics, getEvolutionCompileCacheDiagnostics, resetEvolutionCompileCache } from './effects.js';
export { EVOLUTION_LEVEL_VECTOR_VERSION, EVOLUTION_LEVEL_DOCUMENT_DIGIT_LIMIT, boundedEvolutionLevelRefinement } from './levels.js';
export { EVOLUTION_CATALOG, EVOLUTION_DOMAINS } from './catalog.js';
export { evolutionRunConfiguration } from './run-config.js';
export { EVOLUTION_TERRITORY_EDGE, writeEvolutionTerritoryEdges } from './territories.js';

export const MEMORY_GRAPH_VERSION = 6;
export const EVOLUTION_CONTENT_VERSION = 8;
export const MEMORY_TOPOLOGY_FREQUENCY = 2;
export const HABITAT_CAPABILITIES = Object.freeze([
  'LAKE_ACCESS', 'TUNDRA_ACCESS', 'SNOW_ICE_ACCESS',
  'SHALLOW_OCEAN_EDGE_ACCESS', 'SHALLOW_OCEAN_ACCESS', 'DEEP_OCEAN_ACCESS',
]);
export const MEMORY_NODES = EVOLUTION_CATALOG;
export const MEMORY_NODE_IDS = EVOLUTION_NODE_IDS;
export const MEMORY_ROOT_IDS = Object.freeze(['first-division']);
export const EVOLUTION_CONTENT_HASH = hexU32(hashStringU32(MEMORY_NODES.map((node) => JSON.stringify({
  id: node.id, cell: node.cell, domain: node.domain, tier: node.tier, cost: node.cost, effects: node.effects,
})).join('|')));
export const EVOLUTION_COMPILER_VERSIONS = Object.freeze({
  levels: EVOLUTION_LEVEL_VECTOR_VERSION, cost: EVOLUTION_COST_VERSION, effects: EVOLUTION_EFFECT_VERSION, content: EVOLUTION_CONTENT_VERSION,
});

const TOPOLOGY = createGeodesicTopology(MEMORY_TOPOLOGY_FREQUENCY);
const BY_ID = new Map(MEMORY_NODES.map((node) => [node.id, node]));
const BY_CELL = new Map(MEMORY_NODES.map((node) => [node.cell, node]));
const ROOT_IDS = new Set(MEMORY_ROOT_IDS);
export const MEMORY_CELL_BY_ID = Object.freeze(Object.fromEntries(MEMORY_NODES.map((node) => [node.id, node.cell])));
export const MEMORY_PHYSICAL_ADJACENCY = Object.freeze(Object.fromEntries(MEMORY_NODES.map((node) => [node.id,
  Object.freeze(Array.from(TOPOLOGY.nodeNeighbors.slice(TOPOLOGY.nodeStart[node.cell], TOPOLOGY.nodeStart[node.cell + 1]),
    (cell) => BY_CELL.get(cell)?.id).filter(Boolean))])));

export function getMemoryNode(id) { return BY_ID.get(id) ?? null; }
export function getMemoryAdjacentIds(id) { return MEMORY_PHYSICAL_ADJACENCY[id] ?? EMPTY; }
export function normalizeEvolutionLevels(meta) { return normalizeEvolutionLevelVector(meta, MEMORY_NODE_IDS); }
export function evolutionLevel(meta, id) { return BY_ID.has(id) ? levelFromVector(normalizeEvolutionLevels(meta), id) : '0'; }
export function ownedEvolutionIds(meta) { return ownedIdsFromVector(normalizeEvolutionLevels(meta)); }
export function canonicalEvolutionKey(meta) { return canonicalLevelVectorKey(normalizeEvolutionLevels(meta)); }
export function evolutionLevelVectorHash(meta) { return hexU32(hashStringU32(canonicalEvolutionKey(meta))); }

export function evolutionSummary(meta) {
  const vector = normalizeEvolutionLevels(meta); const levels = levelMapFromVector(vector);
  const domains = EVOLUTION_DOMAINS.map((domain) => {
    const owned = MEMORY_NODES.filter((node) => node.domain === domain && levels.has(node.id));
    const totalLevels = sum(owned.map((node) => levels.get(node.id)));
    return Object.freeze({ domain, breadth: owned.length, totalLevels });
  });
  return Object.freeze({ breadth: vector.length, totalLevels: sum(vector.map((entry) => entry.level)), domains: Object.freeze(domains) });
}

export function hasOwnedAdjacentCell(meta, id, ownedIds = new Set(ownedEvolutionIds(meta))) {
  return BY_ID.has(id) && getMemoryAdjacentIds(id).some((neighbor) => ownedIds.has(neighbor));
}
function frontier(meta, id, owned) {
  const adjacentOwnedId = getMemoryAdjacentIds(id).find((neighbor) => owned.has(neighbor)) ?? null;
  const bootstrap = owned.size === 0 && ROOT_IDS.has(id);
  return { bootstrap, adjacentOwnedId, adjacencyMet: adjacentOwnedId !== null, frontierMet: bootstrap || adjacentOwnedId !== null };
}

export function evolutionCellState(meta, nodeOrId, selectedId = null) {
  const id = typeof nodeOrId === 'string' ? nodeOrId : nodeOrId?.id; const node = BY_ID.get(id);
  if (!node) return Object.freeze({ id: id ?? null, reason: 'unknown-cell', owned: false, locked: true,
    reachable: false, affordable: false, selectedReady: false, currentLevel: '0', nextLevel: '1', nextCost: null });
  const vector = normalizeEvolutionLevels(meta); const levels = levelMapFromVector(vector); const currentLevel = levels.get(id) ?? '0';
  let nextLevel = null; let nextCost = null; let boundary = false;
  try {
    nextLevel = incrementProgressionInteger(currentLevel);
    if (nextLevel.length > EVOLUTION_LEVEL_DOCUMENT_DIGIT_LIMIT) boundary = true;
    else nextCost = nextEvolutionCostForNode(node, currentLevel);
  } catch (error) { if (isBoundary(error)) boundary = true; else throw error; }
  if (boundary) { nextLevel = null; nextCost = null; }
  const owned = currentLevel !== '0'; const ownedIds = new Set(vector.map((entry) => entry.id)); const edge = frontier(meta, id, ownedIds);
  const reachable = owned || edge.frontierMet; const balance = normalizeProgressionInteger(meta?.echoBalance, '0');
  const affordable = !boundary && compareProgressionIntegers(balance, nextCost) >= 0;
  const reason = boundary ? 'progression-security-boundary' : !reachable ? 'adjacency-required' : !affordable ? 'insufficient-echoes' : 'ready';
  return Object.freeze({ ...node, currentLevel, nextLevel, nextCost, owned, reachable, locked: !owned && !edge.frontierMet,
    affordable, adjacencyMet: edge.adjacencyMet, adjacentOwnedId: edge.adjacentOwnedId, bootstrap: edge.bootstrap,
    reason, selectedReady: selectedId === id && reason === 'ready' });
}

export function groupAccessibleMemory(meta, selectedId = null) {
  const nodes = MEMORY_NODES.map((node) => evolutionCellState(meta, node, selectedId));
  return Object.freeze(EVOLUTION_DOMAINS.map((domain) => Object.freeze({ domain, nodes: Object.freeze(nodes.filter((node) => node.domain === domain)) })));
}
export function availableMemoryNodes(meta) {
  const ready = MEMORY_NODES.map((node) => evolutionCellState(meta, node, node.id)).filter((node) => node.reason === 'ready');
  return Object.freeze([...ready.filter((node) => !node.owned), ...ready.filter((node) => node.owned)]);
}
export function canPurchaseEvolutionLevel(meta, id) { return evolutionCellState(meta, id, id).reason === 'ready'; }
export function nextEvolutionCost(meta, id) {
  const node = BY_ID.get(id); if (!node) return null;
  try { const current = evolutionLevel(meta, id); const next = incrementProgressionInteger(current);
    return next.length > EVOLUTION_LEVEL_DOCUMENT_DIGIT_LIMIT ? null : nextEvolutionCostForNode(node, current); }
  catch (error) { if (isBoundary(error)) return null; throw error; }
}

export function compileEvolution(meta) {
  const vector = normalizeEvolutionLevels(meta);
  return compileEvolutionVector({ vector, canonicalKey: canonicalLevelVectorKey(vector), nodes: MEMORY_NODES,
    contentVersion: EVOLUTION_CONTENT_VERSION });
}

export function previewEvolutionLevel(meta, id) {
  const node = BY_ID.get(id); if (!node) return null;
  const vector = normalizeEvolutionLevels(meta); const oldLevel = levelFromVector(vector, id);
  let newLevel; let cost; let nextVector;
  try {
    newLevel = incrementProgressionInteger(oldLevel); cost = nextEvolutionCostForNode(node, oldLevel);
    nextVector = replaceEvolutionLevel(vector, MEMORY_NODE_IDS, id, newLevel);
  } catch (error) { if (isBoundary(error)) return null; throw error; }
  const before = compileEvolution({ ...meta, evolutionLevels: vector }); const after = compileEvolution({ ...meta, evolutionLevels: nextVector });
  return Object.freeze({ nodeId: id, oldLevel, newLevel, cost, changes: Object.freeze(describeChanges(node, before, after)),
    unlocked: Object.freeze(after.habitatCapabilities.filter((entry) => !before.habitatCapabilities.includes(entry))),
    compilerVersions: EVOLUTION_COMPILER_VERSIONS });
}
function describeChanges(node, before, after) {
  return node.effects.map((effect) => {
    if (effect.kind === 'trait') return Object.freeze({ key: effect.key, before: before.effects[effect.key] ?? (effect.key === 'growthCap' ? 0 : 1),
      after: after.effects[effect.key] ?? (effect.key === 'growthCap' ? 0 : 1) });
    if (effect.kind === 'ecology') return Object.freeze({ key: effect.key, before: before.ecology[effect.key] ?? 0, after: after.ecology[effect.key] ?? 0 });
    if (effect.kind === 'luminous') return Object.freeze({ key: `luminous-${effect.key}`,
      before: before.luminous[`${effect.key}Scale`] ?? before.luminous[effect.key] ?? 0,
      after: after.luminous[`${effect.key}Scale`] ?? after.luminous[effect.key] ?? 0 });
    if (effect.kind === 'habitat') return Object.freeze({ key: effect.capability, before: before.habitatCapabilities.includes(effect.capability) ? 1 : 0,
      after: after.habitatCapabilities.includes(effect.capability) ? 1 : 0 });
    if (effect.kind === 'worldmaking') return Object.freeze({ key: effect.key, before: before.worldmaking[effect.key] ? 1 : 0,
      after: after.worldmaking[effect.key] ? 1 : 0 });
    return Object.freeze({ key: effect.affinity ?? 'pressure-defense', before: 0, after: 1 });
  });
}

export function purchaseEvolutionLevel(meta, id, command = {}) {
  const node = BY_ID.get(id); const balanceBefore = normalizeProgressionInteger(meta?.echoBalance, '0');
  const revision = normalizedMetaRevision(meta); const transactionKey = validTransactionKey(command.transactionKey);
  if (!node) return failed(meta, null, id, 'unknown-cell', balanceBefore, revision, transactionKey);
  if (command.transactionKey === undefined || command.expectedLevel === undefined || command.expectedRevision === undefined)
    return failed(meta, node, id, 'missing-precondition', balanceBefore, revision, transactionKey);
  if (!transactionKey) return failed(meta, node, id, 'invalid-transaction-key', balanceBefore, revision, null);
  const expectedLevel = canonical(command.expectedLevel); const expectedRevision = canonical(command.expectedRevision);
  if (expectedLevel === null || expectedRevision === null) return failed(meta, node, id, 'invalid-precondition', balanceBefore, revision, transactionKey);
  const vector = normalizeEvolutionLevels(meta); const oldLevel = levelFromVector(vector, id);
  const receipts = receiptKeys(meta?.evolutionTransactionKeys);
  if (receipts.includes(transactionKey)) return failed(meta, node, id, 'duplicate-transaction', balanceBefore, revision, transactionKey, oldLevel);
  if (expectedLevel !== oldLevel) return failed(meta, node, id, 'stale-level', balanceBefore, revision, transactionKey, oldLevel);
  if (expectedRevision !== revision) return failed(meta, node, id, 'stale-revision', balanceBefore, revision, transactionKey, oldLevel);
  let state; try { state = evolutionCellState({ ...meta, evolutionLevels: vector, echoBalance: balanceBefore }, id, id); }
  catch (error) { if (isBoundary(error)) return failed(meta, node, id, 'progression-security-boundary', balanceBefore, revision, transactionKey, oldLevel); throw error; }
  if (state.reason !== 'ready') return failed(meta, node, id, state.reason, balanceBefore, revision, transactionKey, oldLevel, state.nextCost);
  try {
    const preview = previewEvolutionLevel({ ...meta, evolutionLevels: vector }, id); const balanceAfter = subtractProgressionIntegers(balanceBefore, state.nextCost);
    const evolutionLevels = replaceEvolutionLevel(vector, MEMORY_NODE_IDS, id, state.nextLevel);
    const nextReceipts = [...receipts.filter((key) => key !== transactionKey), transactionKey].slice(-32);
    const nextMeta = Object.freeze({ ...(meta ?? {}), evolutionLevels, echoBalance: balanceAfter,
      revision: incrementProgressionInteger(revision), evolutionTransactionKeys: Object.freeze(nextReceipts) });
    return Object.freeze({ ok: true, reason: 'ready', node, nodeId: id, oldLevel, newLevel: state.nextLevel,
      cost: state.nextCost, spent: state.nextCost, balanceBefore, balanceAfter, transactionKey, preview,
      compilerVersions: EVOLUTION_COMPILER_VERSIONS, meta: nextMeta });
  } catch (error) { if (isBoundary(error)) return failed(meta, node, id, 'progression-security-boundary', balanceBefore, revision, transactionKey, oldLevel, state.nextCost); throw error; }
}
function failed(meta, node, id, reason, balanceBefore, revision, transactionKey, oldLevel = '0', cost = null) {
  return Object.freeze({ ok: false, reason, node, nodeId: id, oldLevel, newLevel: oldLevel, cost, spent: '0',
    balanceBefore, balanceAfter: balanceBefore, revision, transactionKey, preview: null, compilerVersions: EVOLUTION_COMPILER_VERSIONS, meta });
}

export function newlyAvailableAdjacentIds(meta, id) {
  const current = evolutionLevel(meta, id); if (current === '0') return EMPTY;
  return Object.freeze(getMemoryAdjacentIds(id).filter((neighbor) => evolutionLevel(meta, neighbor) === '0'
    && evolutionCellState(meta, neighbor).reachable));
}
export function buildMemoryScene(meta, selectedId = null) {
  const groups = groupAccessibleMemory(meta, selectedId); return Object.freeze({ version: MEMORY_GRAPH_VERSION, selectedId,
    nodes: Object.freeze(groups.flatMap((group) => group.nodes)), groups });
}
export function buildMemorySnapshot(territories, meta, selectedId = null, emphasizedIds = []) {
  return renderMemorySnapshot(territories, meta, buildMemoryScene(meta, selectedId), emphasizedIds);
}
export function createEvolutionTerritories(presentationTopology) {
  return createEvolutionTerritoryProjection(presentationTopology, TOPOLOGY, MEMORY_NODES);
}
/** Static effects have no per-tick conditional authority. */
export function applyMemoryConditionals(state) { return state.activeTraits; }

export function validateMemoryGraph(nodes = MEMORY_NODES) {
  const errors = []; const ids = new Set(); const cells = new Set(); const byCell = new Map();
  for (const node of nodes) {
    if (!/^[a-z][a-z-]+$/.test(node.id) || ids.has(node.id)) errors.push(`invalid id: ${node.id}`); ids.add(node.id);
    if (!Number.isInteger(node.cell) || node.cell < 0 || node.cell >= TOPOLOGY.nodeCount || cells.has(node.cell)) errors.push(`invalid cell: ${node.id}`);
    else { cells.add(node.cell); byCell.set(node.cell, node); }
    if (typeof node.nameEn !== 'string' || typeof node.summary !== 'string' || typeof node.description !== 'string' || !Array.isArray(node.effects) || !node.effects.length)
      errors.push(`missing authored content: ${node.id}`);
    if (!Number.isInteger(node.cost) || node.cost <= 0 || !Number.isInteger(node.refinementCost) || node.refinementCost <= 0) errors.push(`invalid cost: ${node.id}`);
  }
  if (nodes.length !== TOPOLOGY.nodeCount) errors.push(`node count: ${nodes.length}`);
  const roots = nodes.filter((node) => node.kind === 'root'); if (roots.length !== 1 || roots[0]?.id !== 'first-division') errors.push('exactly First Division must be root');
  const root = roots[0]; const reachable = new Set(root ? [root.cell] : []); const queue = root ? [root.cell] : [];
  for (let head = 0; head < queue.length; head++) for (let offset = TOPOLOGY.nodeStart[queue[head]]; offset < TOPOLOGY.nodeStart[queue[head] + 1]; offset++) {
    const next = TOPOLOGY.nodeNeighbors[offset]; if (byCell.has(next) && !reachable.has(next)) { reachable.add(next); queue.push(next); }
  }
  if (reachable.size !== nodes.length) errors.push(`unreachable cells: ${nodes.length - reachable.size}`);
  const firstRing = root ? Array.from(TOPOLOGY.nodeNeighbors.slice(TOPOLOGY.nodeStart[root.cell], TOPOLOGY.nodeStart[root.cell + 1]), (cell) => byCell.get(cell)) : [];
  if (firstRing.some((node) => node?.domain !== 'Foundation')) errors.push('first ring must be general foundation abilities');
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors), nodes: nodes.length, roots: Object.freeze(roots.map((node) => node.id)),
    reachable: reachable.size, topologyFrequency: TOPOLOGY.frequency, topologyCells: TOPOLOGY.nodeCount,
    contentHash: EVOLUTION_CONTENT_HASH, contentVersion: EVOLUTION_CONTENT_VERSION });
}

function sum(values) { let total = '0'; for (const value of values) total = addProgressionIntegers(total, value); return total; }
function canonical(value) { try { return parseProgressionInteger(value); } catch { return null; } }
function validTransactionKey(value) { return typeof value === 'string' && value.length > 0 && value.length <= 128 ? value : null; }
function receiptKeys(value) { return Array.isArray(value) ? [...new Set(value.filter(validTransactionKey))].slice(-32) : []; }
function isBoundary(error) { return error instanceof ProgressionIntegerError || (error instanceof RangeError && /wide|digit|boundary/i.test(error.message)); }
const EMPTY = Object.freeze([]);
