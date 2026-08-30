/** Exact cell-by-cell Evolution authority and aggregate archetype compilation. */
import { EVOLUTION_ARCHETYPES, EVOLUTION_ARCHETYPE_IDS, EVOLUTION_DOMAINS } from './catalog.js';
import { renderEvolutionSnapshot } from './scene.js';
import { EVOLUTION_COST_VERSION, evolutionCostForTargetLevel } from './cost.js';
import {
  EVOLUTION_LEVEL_DOCUMENT_DIGIT_LIMIT, EVOLUTION_LEVEL_ENTRY_LIMIT, EVOLUTION_LEVEL_VECTOR_VERSION,
  aggregateArchetypeRanks, boundedEvolutionLevelRefinement, canonicalLevelVectorKey,
  levelFromVector, levelMapFromVector, normalizeEvolutionLevelVector, normalizedMetaRevision,
  ownedCellsFromVector, replaceEvolutionLevel, totalEvolutionLevels,
} from './levels.js';
import {
  EVOLUTION_COMPILE_CACHE_BYTE_LIMIT, EVOLUTION_COMPILE_CACHE_LIMIT, EVOLUTION_EFFECT_VERSION,
  clearEvolutionCompileCache, compileEvolutionRanks, evolutionCompileCacheDiagnostics,
  getEvolutionCompileCacheDiagnostics, resetEvolutionCompileCache,
} from './effects.js';
import {
  addProgressionIntegers, compareProgressionIntegers, incrementProgressionInteger,
  normalizeProgressionInteger, parseProgressionInteger, ProgressionIntegerError,
  subtractProgressionIntegers,
} from '../../core/progression-integer.js';
import { hashStringU32, hexU32 } from '../../core/hash.js';
import {
  EVOLUTION_LAYOUT, EVOLUTION_LAYOUT_VERSION, EVOLUTION_ROOT_CELL, EVOLUTION_TOPOLOGY,
  EVOLUTION_TOPOLOGY_LEVEL, createEvolutionCellLayout, validateEvolutionCellLayout,
} from './layout.js';

export { EVOLUTION_CELL_EDGE, EVOLUTION_STATUS, createEvolutionFields, writeEvolutionCellEdges } from './scene.js';
export { EVOLUTION_COST_VERSION, evolutionCostForTargetLevel } from './cost.js';
export {
  EVOLUTION_EFFECT_VERSION, EVOLUTION_COMPILE_CACHE_LIMIT, EVOLUTION_COMPILE_CACHE_BYTE_LIMIT,
  clearEvolutionCompileCache, evolutionCompileCacheDiagnostics, getEvolutionCompileCacheDiagnostics,
  resetEvolutionCompileCache,
} from './effects.js';
export {
  EVOLUTION_LEVEL_VECTOR_VERSION, EVOLUTION_LEVEL_DOCUMENT_DIGIT_LIMIT, EVOLUTION_LEVEL_ENTRY_LIMIT,
  boundedEvolutionLevelRefinement,
} from './levels.js';
export { EVOLUTION_ARCHETYPES, EVOLUTION_ARCHETYPE_IDS, EVOLUTION_DOMAINS } from './catalog.js';
export {
  EVOLUTION_LAYOUT, EVOLUTION_LAYOUT_VERSION, EVOLUTION_ROOT_CELL, EVOLUTION_TOPOLOGY,
  EVOLUTION_TOPOLOGY_LEVEL, createEvolutionCellLayout, validateEvolutionCellLayout,
} from './layout.js';
export { evolutionRunConfiguration } from './run-config.js';

export const EVOLUTION_PROGRESSION_VERSION = 7;
export const EVOLUTION_CONTENT_VERSION = 9;
export const HABITAT_CAPABILITIES = Object.freeze([
  'LAKE_ACCESS', 'TUNDRA_ACCESS', 'SNOW_ICE_ACCESS',
  'SHALLOW_OCEAN_EDGE_ACCESS', 'SHALLOW_OCEAN_ACCESS', 'DEEP_OCEAN_ACCESS',
]);
export const EVOLUTION_CONTENT_HASH = hexU32(hashStringU32([
  `layout:${EVOLUTION_LAYOUT_VERSION}:${EVOLUTION_LAYOUT.diagnostics.digest}`,
  ...EVOLUTION_ARCHETYPES.map((archetype) => JSON.stringify({
    id: archetype.id, domain: archetype.domain, tier: archetype.tier, cost: archetype.cost,
    refinementCost: archetype.refinementCost, effects: archetype.effects,
  })),
].join('|')));
export const EVOLUTION_COMPILER_VERSIONS = Object.freeze({
  levels: EVOLUTION_LEVEL_VECTOR_VERSION, cost: EVOLUTION_COST_VERSION,
  effects: EVOLUTION_EFFECT_VERSION, content: EVOLUTION_CONTENT_VERSION,
  layout: EVOLUTION_LAYOUT_VERSION,
});

const ARCHETYPE_BY_ID = new Map(EVOLUTION_ARCHETYPES.map((archetype, index) => [archetype.id, { archetype, index }]));
const EMPTY = Object.freeze([]);

export function getEvolutionArchetype(id) { return ARCHETYPE_BY_ID.get(id)?.archetype ?? null; }
export function evolutionArchetypeForCell(cell) {
  return validCell(cell) ? EVOLUTION_ARCHETYPES[EVOLUTION_LAYOUT.archetypeByCell[cell]] : null;
}
export function getEvolutionAdjacentCells(cell) {
  if (!validCell(cell)) return EMPTY;
  return Object.freeze(Array.from(EVOLUTION_TOPOLOGY.nodeNeighbors.slice(
    EVOLUTION_TOPOLOGY.nodeStart[cell], EVOLUTION_TOPOLOGY.nodeStart[cell + 1],
  )));
}
export function normalizeEvolutionLevels(meta) {
  return normalizeEvolutionLevelVector(meta, EVOLUTION_TOPOLOGY.nodeCount);
}
export function evolutionLevel(meta, cell) {
  return validCell(cell) ? levelFromVector(normalizeEvolutionLevels(meta), cell) : '0';
}
export function ownedEvolutionCells(meta) { return ownedCellsFromVector(normalizeEvolutionLevels(meta)); }
export function canonicalEvolutionKey(meta) { return canonicalLevelVectorKey(normalizeEvolutionLevels(meta)); }
export function evolutionLevelVectorHash(meta) { return hexU32(hashStringU32(canonicalEvolutionKey(meta))); }

export function buildEvolutionProjection(meta, selectedCell = null, recentCells = EMPTY) {
  const vector = normalizeEvolutionLevels(meta); const levels = levelMapFromVector(vector);
  const aggregate = aggregateArchetypeRanks(vector, EVOLUTION_LAYOUT.archetypeByCell, EVOLUTION_ARCHETYPE_IDS);
  const count = EVOLUTION_TOPOLOGY.nodeCount; const owned = new Uint8Array(count); const reachable = new Uint8Array(count);
  const affordable = new Uint8Array(count); const recent = new Uint8Array(count);
  const levelByCell = Array.from({ length: count }, () => '0');
  for (const [cell, level] of levels) { levelByCell[cell] = level; owned[cell] = 1; reachable[cell] = 1; }
  if (vector.length === 0) reachable[EVOLUTION_ROOT_CELL] = 1;
  else for (const entry of vector) for (let offset = EVOLUTION_TOPOLOGY.nodeStart[entry.cell];
    offset < EVOLUTION_TOPOLOGY.nodeStart[entry.cell + 1]; offset++) reachable[EVOLUTION_TOPOLOGY.nodeNeighbors[offset]] = 1;

  const nextAggregateRankByArchetype = Array(EVOLUTION_ARCHETYPES.length).fill(null);
  const nextCostByArchetype = Array(EVOLUTION_ARCHETYPES.length).fill(null);
  const balance = normalizeProgressionInteger(meta?.echoBalance, '0');
  for (let index = 0; index < EVOLUTION_ARCHETYPES.length; index++) {
    try {
      const nextRank = incrementProgressionInteger(aggregate.totals[index]);
      const cost = evolutionCostForTargetLevel(EVOLUTION_ARCHETYPES[index], nextRank);
      nextAggregateRankByArchetype[index] = nextRank; nextCostByArchetype[index] = cost;
    } catch (error) { if (!isBoundary(error)) throw error; }
  }
  for (let cell = 0; cell < count; cell++) {
    const archetype = EVOLUTION_LAYOUT.archetypeByCell[cell]; const cost = nextCostByArchetype[archetype];
    if (cost !== null && compareProgressionIntegers(balance, cost) >= 0) affordable[cell] = 1;
  }
  for (const cell of recentCells) if (validCell(cell)) recent[cell] = 1;
  const readyCells = new Uint16Array(count); let readyCount = 0;
  for (let cell = 0; cell < count; cell++) if (reachable[cell] && affordable[cell]) readyCells[readyCount++] = cell;
  const normalizedSelected = validCell(selectedCell) ? selectedCell : null;
  return Object.freeze({ kind: 'evolution-projection', version: EVOLUTION_PROGRESSION_VERSION,
    contentVersion: EVOLUTION_CONTENT_VERSION, contentHash: EVOLUTION_CONTENT_HASH,
    layoutVersion: EVOLUTION_LAYOUT_VERSION, layoutDigest: EVOLUTION_LAYOUT.diagnostics.digest,
    metaRevision: normalizedMetaRevision(meta), balance, selectedCell: normalizedSelected,
    vector, levelByCell: Object.freeze(levelByCell), aggregateRanks: aggregate.ranks,
    aggregateRankByArchetype: aggregate.totals, aggregateKey: aggregate.canonicalKey,
    nextAggregateRankByArchetype: Object.freeze(nextAggregateRankByArchetype),
    nextCostByArchetype: Object.freeze(nextCostByArchetype), owned, reachable, affordable, recent,
    readyCells: readyCells.subarray(0, readyCount), ownedCellCount: vector.length,
    totalLevels: totalEvolutionLevels(vector) });
}

export function evolutionCellState(metaOrProjection, cell, selectedCell = null) {
  if (!validCell(cell)) return Object.freeze({ cell: null, reason: 'unknown-cell', owned: false, locked: true,
    reachable: false, affordable: false, selectedReady: false, localLevel: '0', nextLocalLevel: '1',
    aggregateRank: '0', nextAggregateRank: '1', nextCost: null });
  const projection = metaOrProjection?.kind === 'evolution-projection'
    ? metaOrProjection : buildEvolutionProjection(metaOrProjection, selectedCell);
  const archetypeIndex = EVOLUTION_LAYOUT.archetypeByCell[cell]; const archetype = EVOLUTION_ARCHETYPES[archetypeIndex];
  const localLevel = projection.levelByCell[cell]; let nextLocalLevel = null;
  try {
    nextLocalLevel = incrementProgressionInteger(localLevel);
    if (nextLocalLevel.length > EVOLUTION_LEVEL_DOCUMENT_DIGIT_LIMIT) nextLocalLevel = null;
  } catch (error) { if (!isBoundary(error)) throw error; }
  const aggregateRank = projection.aggregateRankByArchetype[archetypeIndex];
  const nextAggregateRank = projection.nextAggregateRankByArchetype[archetypeIndex];
  const nextCost = projection.nextCostByArchetype[archetypeIndex];
  const owned = projection.owned[cell] === 1; const reachable = projection.reachable[cell] === 1;
  const affordable = projection.affordable[cell] === 1; const boundary = nextLocalLevel === null || nextAggregateRank === null || nextCost === null;
  const reason = boundary ? 'progression-security-boundary' : !reachable ? 'adjacency-required'
    : !affordable ? 'insufficient-echoes' : 'ready';
  const selection = selectedCell ?? projection.selectedCell;
  return Object.freeze({ ...archetype, cell, archetypeId: archetype.id, archetypeIndex,
    localLevel, nextLocalLevel, aggregateRank, nextAggregateRank, nextCost,
    owned, reachable, locked: !owned && !reachable, affordable, reason,
    selected: selection === cell, selectedReady: selection === cell && reason === 'ready',
    neighbors: getEvolutionAdjacentCells(cell), recent: projection.recent[cell] === 1 });
}

export function evolutionSummary(metaOrProjection) {
  const projection = metaOrProjection?.kind === 'evolution-projection'
    ? metaOrProjection : buildEvolutionProjection(metaOrProjection);
  const domains = EVOLUTION_DOMAINS.map((domain) => {
    const indexes = EVOLUTION_ARCHETYPES.flatMap((archetype, index) => archetype.domain === domain ? [index] : []);
    let aggregateLevels = '0'; let ownedCells = 0;
    for (const index of indexes) aggregateLevels = addProgressionIntegers(aggregateLevels, projection.aggregateRankByArchetype[index]);
    for (let cell = 0; cell < EVOLUTION_TOPOLOGY.nodeCount; cell++) {
      if (projection.owned[cell] && EVOLUTION_ARCHETYPES[EVOLUTION_LAYOUT.archetypeByCell[cell]].domain === domain) ownedCells++;
    }
    return Object.freeze({ domain, ownedCells, aggregateLevels });
  });
  return Object.freeze({ ownedCells: projection.ownedCellCount, totalLevels: projection.totalLevels,
    domains: Object.freeze(domains) });
}

export function availableEvolutionCells(metaOrProjection) {
  const projection = metaOrProjection?.kind === 'evolution-projection'
    ? metaOrProjection : buildEvolutionProjection(metaOrProjection);
  const cells = [];
  for (let cell = 0; cell < EVOLUTION_TOPOLOGY.nodeCount; cell++) if (projection.reachable[cell]) cells.push(cell);
  return Object.freeze(cells);
}
export function canPurchaseEvolutionLevel(meta, cell) { return evolutionCellState(meta, cell, cell).reason === 'ready'; }
export function nextEvolutionCost(meta, cell) { return evolutionCellState(meta, cell).nextCost; }

export function compileEvolution(metaOrProjection) {
  const projection = metaOrProjection?.kind === 'evolution-projection' ? metaOrProjection : null;
  const aggregate = projection ? { ranks: projection.aggregateRanks, canonicalKey: projection.aggregateKey }
    : aggregateArchetypeRanks(normalizeEvolutionLevels(metaOrProjection), EVOLUTION_LAYOUT.archetypeByCell, EVOLUTION_ARCHETYPE_IDS);
  return compileEvolutionRanks({ ranks: aggregate.ranks, canonicalKey: aggregate.canonicalKey,
    archetypes: EVOLUTION_ARCHETYPES, contentVersion: EVOLUTION_CONTENT_VERSION });
}

export function previewEvolutionLevel(meta, cell, sourceProjection = null) {
  if (!validCell(cell)) return null;
  const projection = sourceProjection?.kind === 'evolution-projection' ? sourceProjection : buildEvolutionProjection(meta, cell);
  const state = evolutionCellState(projection, cell, cell);
  if (state.nextLocalLevel === null || state.nextAggregateRank === null || state.nextCost === null) return null;
  let nextVector;
  try { nextVector = replaceEvolutionLevel(projection.vector, EVOLUTION_TOPOLOGY.nodeCount, cell, state.nextLocalLevel); }
  catch (error) { if (isBoundary(error)) return null; throw error; }
  const before = compileEvolution({ evolutionLevels: projection.vector });
  const after = compileEvolution({ evolutionLevels: nextVector });
  return Object.freeze({ cell, archetypeId: state.archetypeId,
    oldLocalLevel: state.localLevel, newLocalLevel: state.nextLocalLevel,
    oldAggregateRank: state.aggregateRank, newAggregateRank: state.nextAggregateRank,
    cost: state.nextCost, changes: Object.freeze(describeChanges(state, before, after)),
    unlocked: Object.freeze(after.habitatCapabilities.filter((entry) => !before.habitatCapabilities.includes(entry))),
    compilerVersions: EVOLUTION_COMPILER_VERSIONS });
}

function describeChanges(archetype, before, after) {
  return archetype.effects.map((effect) => {
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

export function purchaseEvolutionLevel(meta, cell, command = {}) {
  const balanceBefore = normalizeProgressionInteger(meta?.echoBalance, '0'); const revision = normalizedMetaRevision(meta);
  const transactionKey = validTransactionKey(command.transactionKey); const archetype = evolutionArchetypeForCell(cell);
  if (!archetype) return failed(meta, null, cell, 'unknown-cell', balanceBefore, revision, transactionKey);
  if (command.activeWorld === true) return failed(meta, archetype, cell, 'world-active', balanceBefore, revision, transactionKey);
  if (command.transactionKey === undefined || command.expectedLocalLevel === undefined
    || command.expectedAggregateRank === undefined || command.expectedRevision === undefined) {
    return failed(meta, archetype, cell, 'missing-precondition', balanceBefore, revision, transactionKey);
  }
  if (!transactionKey) return failed(meta, archetype, cell, 'invalid-transaction-key', balanceBefore, revision, null);
  const expectedLocalLevel = canonical(command.expectedLocalLevel);
  const expectedAggregateRank = canonical(command.expectedAggregateRank);
  const expectedRevision = canonical(command.expectedRevision);
  if (expectedLocalLevel === null || expectedAggregateRank === null || expectedRevision === null) {
    return failed(meta, archetype, cell, 'invalid-precondition', balanceBefore, revision, transactionKey);
  }
  const projection = buildEvolutionProjection(meta, cell); const state = evolutionCellState(projection, cell, cell);
  const receipts = receiptKeys(meta?.evolutionTransactionKeys);
  if (receipts.includes(transactionKey)) return failed(meta, archetype, cell, 'duplicate-transaction', balanceBefore, revision, transactionKey,
    state.localLevel, state.aggregateRank);
  if (expectedLocalLevel !== state.localLevel) return failed(meta, archetype, cell, 'stale-local-level', balanceBefore, revision, transactionKey,
    state.localLevel, state.aggregateRank);
  if (expectedAggregateRank !== state.aggregateRank) return failed(meta, archetype, cell, 'stale-aggregate-rank', balanceBefore, revision, transactionKey,
    state.localLevel, state.aggregateRank);
  if (expectedRevision !== revision) return failed(meta, archetype, cell, 'stale-revision', balanceBefore, revision, transactionKey,
    state.localLevel, state.aggregateRank);
  if (state.reason !== 'ready') return failed(meta, archetype, cell, state.reason, balanceBefore, revision, transactionKey,
    state.localLevel, state.aggregateRank, state.nextCost);
  try {
    const preview = previewEvolutionLevel(meta, cell, projection);
    const balanceAfter = subtractProgressionIntegers(balanceBefore, state.nextCost);
    const evolutionLevels = replaceEvolutionLevel(projection.vector, EVOLUTION_TOPOLOGY.nodeCount, cell, state.nextLocalLevel);
    const nextReceipts = [...receipts, transactionKey].slice(-32);
    const nextMeta = Object.freeze({ ...(meta ?? {}), evolutionLevels, echoBalance: balanceAfter,
      revision: incrementProgressionInteger(revision), evolutionTransactionKeys: Object.freeze(nextReceipts),
      evolutionLevelVectorVersion: EVOLUTION_LEVEL_VECTOR_VERSION,
      evolutionLayoutVersion: EVOLUTION_LAYOUT_VERSION, evolutionContentHash: EVOLUTION_CONTENT_HASH });
    return Object.freeze({ ok: true, reason: 'ready', cell, archetype, archetypeId: archetype.id,
      oldLocalLevel: state.localLevel, newLocalLevel: state.nextLocalLevel,
      oldAggregateRank: state.aggregateRank, newAggregateRank: state.nextAggregateRank,
      cost: state.nextCost, spent: state.nextCost, balanceBefore, balanceAfter, transactionKey,
      revisionBefore: revision, revisionAfter: nextMeta.revision, preview,
      compilerVersions: EVOLUTION_COMPILER_VERSIONS, meta: nextMeta });
  } catch (error) {
    if (isBoundary(error)) return failed(meta, archetype, cell, 'progression-security-boundary', balanceBefore, revision,
      transactionKey, state.localLevel, state.aggregateRank, state.nextCost);
    throw error;
  }
}

function failed(meta, archetype, cell, reason, balanceBefore, revision, transactionKey,
  localLevel = '0', aggregateRank = '0', cost = null) {
  return Object.freeze({ ok: false, reason, cell, archetype, archetypeId: archetype?.id ?? null,
    oldLocalLevel: localLevel, newLocalLevel: localLevel, oldAggregateRank: aggregateRank,
    newAggregateRank: aggregateRank, cost, spent: '0', balanceBefore, balanceAfter: balanceBefore,
    revisionBefore: revision, revisionAfter: revision, transactionKey, preview: null,
    compilerVersions: EVOLUTION_COMPILER_VERSIONS, meta });
}

export function newlyReachableEvolutionCells(beforeProjection, afterProjection) {
  const cells = [];
  for (let cell = 0; cell < EVOLUTION_TOPOLOGY.nodeCount; cell++) {
    if (!beforeProjection.reachable[cell] && afterProjection.reachable[cell] && !afterProjection.owned[cell]) cells.push(cell);
  }
  return Object.freeze(cells);
}

export function buildEvolutionSnapshot(meta, selectedCell = null, recentCells = EMPTY) {
  const projection = buildEvolutionProjection(meta, selectedCell, recentCells);
  return renderEvolutionSnapshot(EVOLUTION_LAYOUT, meta, projection);
}

export function validateEvolutionAuthority() {
  const errors = []; const ids = new Set();
  for (const archetype of EVOLUTION_ARCHETYPES) {
    if (!/^[a-z][a-z-]+$/.test(archetype.id) || ids.has(archetype.id)) errors.push(`invalid archetype id: ${archetype.id}`);
    ids.add(archetype.id);
    if (typeof archetype.nameEn !== 'string' || typeof archetype.summary !== 'string'
      || typeof archetype.description !== 'string' || !Array.isArray(archetype.effects) || !archetype.effects.length) {
      errors.push(`missing authored content: ${archetype.id}`);
    }
    if (!Number.isInteger(archetype.cost) || archetype.cost <= 0
      || !Number.isInteger(archetype.refinementCost) || archetype.refinementCost <= 0) errors.push(`invalid cost: ${archetype.id}`);
  }
  if (EVOLUTION_ARCHETYPES.filter((archetype) => archetype.kind === 'root').length !== 1
    || EVOLUTION_ARCHETYPES[EVOLUTION_LAYOUT.rootArchetype]?.id !== 'first-division') errors.push('invalid root archetype');
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors),
    archetypes: EVOLUTION_ARCHETYPES.length, rootCell: EVOLUTION_ROOT_CELL,
    topologyLevel: EVOLUTION_TOPOLOGY_LEVEL, topologyCells: EVOLUTION_TOPOLOGY.nodeCount,
    topologyEdges: EVOLUTION_TOPOLOGY.edgeCount, contentHash: EVOLUTION_CONTENT_HASH,
    contentVersion: EVOLUTION_CONTENT_VERSION, layout: EVOLUTION_LAYOUT.diagnostics });
}

function validCell(cell) { return Number.isInteger(cell) && cell >= 0 && cell < EVOLUTION_TOPOLOGY.nodeCount; }
function canonical(value) { try { return parseProgressionInteger(value); } catch { return null; } }
function validTransactionKey(value) { return typeof value === 'string' && value.length > 0 && value.length <= 128 ? value : null; }
function receiptKeys(value) { return Array.isArray(value) ? [...new Set(value.filter(validTransactionKey))].slice(-32) : []; }
function isBoundary(error) { return error instanceof ProgressionIntegerError || (error instanceof RangeError && /wide|digit|boundary|too many/i.test(error.message)); }
