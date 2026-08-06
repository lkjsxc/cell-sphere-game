/** Permanent Evolution atlas: physical-frontier queries, transactions, and run compilation. */
import { CONTINUITY_MEMORY } from './continuity.js';
import { ECOLOGY_MEMORY } from './ecology.js';
import { FLOW_MEMORY } from './flow.js';
import { PERCEPTION_MEMORY } from './perception.js';
import { REACH_MEMORY } from './reach.js';
import { RESERVE_MEMORY } from './reserve.js';
import { renderMemorySnapshot } from './scene.js';
import { MEMORY_ATLAS_HASH } from './atlas.js';
import { AFFINITY_METADATA_HASH, EVOLUTION_AFFINITY_IDS, EVOLUTION_CONTENT_VERSION } from './affinities.js';
import { BUILD_MASTERY_VERSION } from './builds.js';
import { FULL_EVOLUTION_POWER, WORLD_POTENTIAL_VERSION } from './potential.js';
import { EVOLUTION_COST_VERSION, nextEvolutionCostForNode } from './cost.js';
import { EVOLUTION_EFFECT_VERSION, compileEvolutionVector } from './effects.js';
import {EVOLUTION_LEVEL_VECTOR_VERSION,EVOLUTION_LEVEL_DOCUMENT_DIGIT_LIMIT,canonicalLevelVectorKey,levelFromVector,
  levelMapFromVector, normalizeEvolutionLevelVector, normalizedMetaRevision,
  ownedIdsFromVector, replaceEvolutionLevel, summarizeEvolutionLevelVector } from './levels.js';
import {compareProgressionIntegers,incrementProgressionInteger,normalizeProgressionInteger,
  parseProgressionInteger,ProgressionIntegerError,subtractProgressionIntegers} from '../../core/progression-integer.js';
import { hashStringU32, hexU32 } from '../../core/hash.js';
import { createGeodesicTopology } from '../../world/icosphere.js';
export { createMemoryFields } from './scene.js';
export { MEMORY_ATLAS_REVERSE } from './atlas.js';
export { applyMemoryConditionals } from './node.js';
export { AFFINITY_METADATA_HASH, EVOLUTION_AFFINITIES, EVOLUTION_AFFINITY_IDS, EVOLUTION_CONTENT_VERSION } from './affinities.js';
export { BUILD_MASTERY_VERSION, BUILD_RECIPES, compileBuilds } from './builds.js';
export { EVOLUTION_COST_VERSION, evolutionCostForTargetLevel } from './cost.js';
export { EVOLUTION_EFFECT_VERSION, EVOLUTION_COMPILE_CACHE_LIMIT, EVOLUTION_COMPILE_CACHE_BYTE_LIMIT, clearEvolutionCompileCache,
  evolutionCompileCacheDiagnostics, getEvolutionCompileCacheDiagnostics, resetEvolutionCompileCache } from './effects.js';
export { EVOLUTION_LEVEL_VECTOR_VERSION, EVOLUTION_LEVEL_DOCUMENT_DIGIT_LIMIT, boundedEvolutionLevelRefinement } from './levels.js';
export { BASE_WORLD_POTENTIAL, EVOLUTION_POWER_BY_KIND, FULL_EVOLUTION_POWER, WORLD_POTENTIAL_ANCHORS,
  WORLD_POTENTIAL_VERSION, legacyWorldPotentialV2Number, modeledScoreRange,
  worldPotentialForBreadthAndDepth, worldPotentialForPower } from './potential.js';

export const MEMORY_GRAPH_VERSION = 5;
export const HABITAT_CAPABILITIES = Object.freeze([
  'LAKE_ACCESS', 'TUNDRA_ACCESS', 'SNOW_ICE_ACCESS',
  'SHALLOW_OCEAN_EDGE_ACCESS', 'SHALLOW_OCEAN_ACCESS', 'DEEP_OCEAN_ACCESS',
]);
export const MEMORY_BRANCHES = EVOLUTION_AFFINITY_IDS;
const LEGACY_TERRITORIES = Object.freeze(['Reach', 'Flow', 'Reserve', 'Ecology', 'Perception', 'Continuity']);
export const MEMORY_NODES = Object.freeze([
  ...REACH_MEMORY, ...FLOW_MEMORY, ...RESERVE_MEMORY,
  ...ECOLOGY_MEMORY, ...PERCEPTION_MEMORY, ...CONTINUITY_MEMORY,
]);
export const MEMORY_NODE_IDS = Object.freeze(MEMORY_NODES.map((node) => node.id));
export const MEMORY_LANDMARK_IDS = Object.freeze(MEMORY_NODES.filter((node) => node.authored).map((node) => node.id));
export const MEMORY_ROOT_IDS = Object.freeze(LEGACY_TERRITORIES.map((branch) => MEMORY_NODES.find((node) => node.branch === branch).id));
export const EVOLUTION_CONTENT_HASH = hexU32(hashStringU32(MEMORY_NODES.map((node) => JSON.stringify({ id:node.id, cell:node.cell,
  affinity:node.affinity, tags:node.secondaryTags, power:node.evolutionPower, tradeoff:node.tradeoff,
  habitats:node.habitatContributions, transformations:node.transformationContributions, builds:node.buildContributions })).join('|')));
const ROOT_IDS = new Set(MEMORY_ROOT_IDS); const BY_ID = new Map(MEMORY_NODES.map((node) => [node.id, node]));
const TOPOLOGY = createGeodesicTopology(5); const BY_CELL = new Map(MEMORY_NODES.map((node) => [node.cell, node]));
export const MEMORY_CELL_BY_ID = Object.freeze(Object.fromEntries(MEMORY_NODES.map((node) => [node.id, node.cell])));
export const MEMORY_PHYSICAL_ADJACENCY = Object.freeze(Object.fromEntries(MEMORY_NODES.map((node) => [node.id,
  Object.freeze(Array.from(TOPOLOGY.nodeNeighbors.slice(TOPOLOGY.nodeStart[node.cell], TOPOLOGY.nodeStart[node.cell + 1]),
    (cell) => BY_CELL.get(cell)?.id).filter(Boolean))])));
const ADDITIVE_EFFECT_KEYS = Object.freeze(['growthCap', 'anastomosis', 'redundantLoops',
  'coldReserve', 'symbioticFilm', 'distributedSensing']);
const EFFECT_KEYS = new Set(['reach', 'uptake', 'maintenance', 'conductance', 'reinforce',
  'stressResist', 'heatTol', 'droughtTol', 'toxinTol',
  'energyCap', 'regrow', 'growCost', ...ADDITIVE_EFFECT_KEYS]);

export const EVOLUTION_COMPILER_VERSIONS = Object.freeze({
  levels: EVOLUTION_LEVEL_VECTOR_VERSION, cost: EVOLUTION_COST_VERSION,
  effects: EVOLUTION_EFFECT_VERSION, mastery: BUILD_MASTERY_VERSION,
  potential: WORLD_POTENTIAL_VERSION,
});

export function getMemoryNode(id) { return BY_ID.get(id) ?? null; }
export function getMemoryAdjacentIds(id) { return MEMORY_PHYSICAL_ADJACENCY[id] ?? Object.freeze([]); }
export function normalizeEvolutionLevels(meta) {
  return normalizeEvolutionLevelVector(meta, MEMORY_NODE_IDS);
}
export function evolutionLevel(meta, id) {
  return BY_ID.has(id) ? levelFromVector(normalizeEvolutionLevels(meta), id) : '0';
}
export function ownedEvolutionIds(meta) {
  return ownedIdsFromVector(normalizeEvolutionLevels(meta));
}
export function canonicalEvolutionKey(meta) {
  return canonicalLevelVectorKey(normalizeEvolutionLevels(meta));
}
export function evolutionLevelVectorHash(meta) {
  return hexU32(hashStringU32(canonicalEvolutionKey(meta)));
}
export function evolutionSummary(meta) {
  return summarizeEvolutionLevelVector(normalizeEvolutionLevels(meta), MEMORY_NODES, EVOLUTION_AFFINITY_IDS);
}
export function evolutionAffinitySummaries(meta) { return evolutionSummary(meta).affinities; }
export function evolutionAffinitySummary(meta, affinityId) {
  return evolutionAffinitySummaries(meta).find((entry) => entry.affinity === affinityId) ?? null;
}
export function evolutionAffinityBreadth(meta) {
  return Object.freeze(Object.fromEntries(evolutionAffinitySummaries(meta)
    .map((entry) => [entry.affinity, entry.breadth])));
}
export function evolutionAffinityDepth(meta) {
  return Object.freeze(Object.fromEntries(evolutionAffinitySummaries(meta)
    .map((entry) => [entry.affinity, entry.depth])));
}
export const affinityEvolutionSummaries = evolutionAffinitySummaries;
export const affinityBreadthSummary = evolutionAffinityBreadth;
export const affinityDepthSummary = evolutionAffinityDepth;

function recognizedOwnedIds(meta) { return new Set(ownedEvolutionIds(meta)); }
function firstOwnedAdjacentId(id, ownedIds) {
  return getMemoryAdjacentIds(id).find((neighborId) => ownedIds.has(neighborId)) ?? null;
}
/** The sole current adjacency authority; only actual frequency-5 cell neighbors count. */
export function hasOwnedAdjacentCell(meta, id, ownedIds = recognizedOwnedIds(meta)) {
  return BY_ID.has(id) && firstOwnedAdjacentId(id, ownedIds) !== null;
}
function memoryFrontier(meta, id, ownedIds) {
  const adjacencyMet = hasOwnedAdjacentCell(meta, id, ownedIds);
  const bootstrap = ownedIds.size === 0 && ROOT_IDS.has(id);
  return { adjacencyMet, adjacentOwnedId: firstOwnedAdjacentId(id, ownedIds),
    bootstrap, frontierMet: adjacencyMet || bootstrap };
}

export function evolutionCellState(meta, nodeOrId, selectedId = null) {
  const id = typeof nodeOrId === 'string' ? nodeOrId : nodeOrId?.id;
  const node = BY_ID.get(id);
  if (!node) return Object.freeze({ id: id ?? null, reason: 'unknown-cell', owned: false,
    locked: true, reachable: false, affordable: false, selectedReady: false,
    currentLevel: '0', nextLevel: '1', nextCost: null });
  const vector=normalizeEvolutionLevels(meta),levels=levelMapFromVector(vector);
  const currentLevel=levels.get(id)??'0';let nextLevel=null,nextCost=null,boundary=false;
  try{nextLevel=incrementProgressionInteger(currentLevel);if(nextLevel.length>EVOLUTION_LEVEL_DOCUMENT_DIGIT_LIMIT)boundary=true;
    else nextCost=nextEvolutionCostForNode(node,currentLevel)}
  catch(error){if(isProgressionBoundary(error))boundary=true;else throw error}
  if(boundary){nextLevel=null;nextCost=null}
  const ownedIds=new Set(vector.map((entry)=>entry.id)),owned=currentLevel!=='0';
  const frontier=memoryFrontier(meta,id,ownedIds),reachable=owned||frontier.frontierMet;
  const balance=normalizeProgressionInteger(meta?.echoBalance,'0');
  const affordable=!boundary&&compareProgressionIntegers(balance,nextCost)>=0;
  const reason=boundary?'progression-security-boundary':!reachable?'adjacency-required':!affordable?'insufficient-echoes':'ready';
  return Object.freeze({ ...node, currentLevel, nextLevel, nextCost, owned, reachable,
    locked: !owned && !frontier.frontierMet, affordable, adjacencyMet: frontier.adjacencyMet,
    adjacentOwnedId: frontier.adjacentOwnedId, bootstrap: frontier.bootstrap, reason,
    selectedReady: selectedId === id && reason === 'ready' });
}

/** Legacy state alias; ownership and readiness are derived from levels. */
export function memoryNodeState(meta, node, selectedId = null) {
  const state = evolutionCellState(meta, node, selectedId);
  return state.reason === 'unknown-cell' ? null : state;
}
export function groupAccessibleMemory(meta, selectedId = null) {
  const nodes = MEMORY_NODES.map((node) => evolutionCellState(meta, node, selectedId));
  return Object.freeze(MEMORY_BRANCHES.map((affinity) => Object.freeze({ branch: affinity, affinity,
    nodes: Object.freeze(nodes.filter((node) => node.affinity === affinity)) })));
}
export function availableMemoryNodes(meta) {
  const ready = MEMORY_NODES.map((node) => evolutionCellState(meta, node, node.id))
    .filter((state) => state.reason === 'ready');
  return Object.freeze([...ready.filter((state) => !state.owned), ...ready.filter((state) => state.owned)]);
}
export function canPurchaseEvolutionLevel(meta, id) {
  return evolutionCellState(meta, id, id).reason === 'ready';
}
/** Legacy eligibility alias; owned cells remain purchasable for their next level. */
export const canPurchaseMemory = canPurchaseEvolutionLevel;

export function newlyAvailableAdjacentIds(meta, id) {
  const vector = normalizeEvolutionLevels(meta); const current = levelFromVector(vector, id);
  if (current !== '0') return Object.freeze([]);
  const baseline = meta;
  return Object.freeze(getMemoryAdjacentIds(id).filter((neighborId) => {
    const state = evolutionCellState(baseline, neighborId); return !state.owned && !state.reachable;
  }));
}

export function nextEvolutionCost(meta,id){const node=BY_ID.get(id);if(!node)return null;
 try{const current=evolutionLevel(meta,id),next=incrementProgressionInteger(current);return next.length>EVOLUTION_LEVEL_DOCUMENT_DIGIT_LIMIT?null:nextEvolutionCostForNode(node,current)}
 catch(error){if(isProgressionBoundary(error))return null;throw error}
}

export function compileEvolution(meta) {
  const vector = normalizeEvolutionLevels(meta);
  return compileEvolutionVector({ vector, canonicalKey: canonicalLevelVectorKey(vector), nodes: MEMORY_NODES,
    summary: summarizeEvolutionLevelVector(vector, MEMORY_NODES, EVOLUTION_AFFINITY_IDS),
    contentVersion: EVOLUTION_CONTENT_VERSION, habitatCapabilities: HABITAT_CAPABILITIES });
}
/** Legacy compiler alias; binary ownership is never authoritative. */
export const compileMemory = compileEvolution;
export function worldPotential(meta) { return compileEvolution(meta).worldPotential; }

export function previewEvolutionLevel(meta,id){
  const node=BY_ID.get(id);if(!node)return null;
  const vector=normalizeEvolutionLevels(meta),oldLevel=levelFromVector(vector,id);let newLevel,cost,nextVector;
  try{newLevel=incrementProgressionInteger(oldLevel);cost=nextEvolutionCostForNode(node,oldLevel);
    nextVector=replaceEvolutionLevel(vector,MEMORY_NODE_IDS,id,newLevel)}
  catch(error){if(isProgressionBoundary(error))return null;throw error}
  const before = compileEvolution({ ...meta, evolutionLevels: vector });
  const after = compileEvolution({ ...meta, evolutionLevels: nextVector });
  const keys = new Set([...Object.keys(before.effects), ...Object.keys(after.effects)]);
  const changes = [...keys].filter((keyName) => (before.effects[keyName] ?? 1) !== (after.effects[keyName] ?? 1))
    .map((keyName) => Object.freeze({ key: keyName, before: before.effects[keyName] ?? 1,
      after: after.effects[keyName] ?? 1 }));
  const unlocked = after.unlocks.filter((entry) => !before.unlocks.some((old) => old.key === entry.key));
  const beforeBuilds = new Map([...before.activeBuilds, ...before.nearBuilds].map((build) => [build.id, build]));
  const buildProgress = [...after.activeBuilds, ...after.nearBuilds]
    .filter((build) => node.buildContributions.includes(build.id)).map((build) => Object.freeze({
      id: build.id, name: build.name, before: beforeBuilds.get(build.id)?.progress ?? 0, after: build.progress,
      rankBefore: beforeBuilds.get(build.id)?.masteryRank ?? '0', rankAfter: build.masteryRank,
      active: build.active, missing: build.missing,
    }));
  return Object.freeze({ nodeId: id, oldLevel, newLevel, cost,
    powerBefore: before.evolutionPower, powerAfter: after.evolutionPower,
    powerGain: after.evolutionPower - before.evolutionPower,
    potentialBefore: before.worldPotential, potentialAfter: after.worldPotential,
    potentialDelta: subtractProgressionIntegers(after.worldPotential, before.worldPotential),
    changes: Object.freeze(changes), unlocked: Object.freeze(unlocked),
    buildProgress: Object.freeze(buildProgress), compilerVersions: EVOLUTION_COMPILER_VERSIONS });
}
/** Legacy preview alias; it now previews exactly one next level. */
export const memoryPurchasePreview = previewEvolutionLevel;

export function purchaseEvolutionLevel(meta, id, command = {}) {
  const node = BY_ID.get(id); const balanceBefore = normalizeProgressionInteger(meta?.echoBalance, '0');
  const revision = normalizedMetaRevision(meta); const transactionKey = validTransactionKey(command?.transactionKey);
  if (!node) return failedPurchase(meta, null, id, 'unknown-cell', balanceBefore, revision, transactionKey);
  if(command.transactionKey===undefined||command.expectedLevel===undefined||command.expectedRevision===undefined)
    return failedPurchase(meta,node,id,'missing-precondition',balanceBefore,revision,transactionKey);
  if(!transactionKey)return failedPurchase(meta,node,id,'invalid-transaction-key',balanceBefore,revision,null);
  const expectedLevel=canonicalCommandInteger(command.expectedLevel),expectedRevision=canonicalCommandInteger(command.expectedRevision);
  if(expectedLevel===null||expectedRevision===null)return failedPurchase(meta,node,id,'invalid-precondition',balanceBefore,revision,transactionKey);
  const vector=normalizeEvolutionLevels(meta),oldLevel=levelFromVector(vector,id);
  const receipts = normalizeTransactionKeys(meta?.evolutionTransactionKeys);
  if (transactionKey && receipts.includes(transactionKey))
    return failedPurchase(meta, node, id, 'duplicate-transaction', balanceBefore, revision, transactionKey, oldLevel);
  if(expectedLevel!==oldLevel)return failedPurchase(meta,node,id,'stale-level',balanceBefore,revision,transactionKey,oldLevel);
  if(expectedRevision!==revision)return failedPurchase(meta,node,id,'stale-revision',balanceBefore,revision,transactionKey,oldLevel);
  let state;try{state=evolutionCellState({...meta,evolutionLevels:vector,echoBalance:balanceBefore},id,id)}
  catch(error){if(isProgressionBoundary(error))return failedPurchase(meta,node,id,'progression-security-boundary',balanceBefore,revision,transactionKey,oldLevel,'0');throw error}
  if (state.reason !== 'ready')
    return failedPurchase(meta, node, id, state.reason, balanceBefore, revision, transactionKey, oldLevel, state.nextCost);
  let preview,balanceAfter,evolutionLevels;const newLevel=state.nextLevel;
  try{preview=previewEvolutionLevel({...meta,evolutionLevels:vector},id);balanceAfter=subtractProgressionIntegers(balanceBefore,state.nextCost);
    evolutionLevels=replaceEvolutionLevel(vector,MEMORY_NODE_IDS,id,newLevel)}
  catch(error){if(isProgressionBoundary(error))return failedPurchase(meta,node,id,'progression-security-boundary',balanceBefore,revision,transactionKey,oldLevel,state.nextCost);throw error}
  const nextReceipts = transactionKey ? [...receipts.filter((key) => key !== transactionKey), transactionKey].slice(-32) : receipts;
  const { memoryNodes: _legacyMemoryNodes, ...canonicalInput } = meta ?? {};
  const nextMeta = Object.freeze({ ...canonicalInput, evolutionLevels, echoBalance: balanceAfter,
    revision: incrementProgressionInteger(revision), evolutionTransactionKeys: Object.freeze(nextReceipts) });
  return Object.freeze({ ok: true, reason: 'ready', node, nodeId: id, oldLevel, newLevel,
    cost: state.nextCost, spent: state.nextCost, balanceBefore, balanceAfter, transactionKey,
    preview, compilerVersions: EVOLUTION_COMPILER_VERSIONS, meta: nextMeta });
}

function failedPurchase(meta,node,id,reason,balance,revision,transactionKey,oldLevel='0',cost=undefined){
  let canonicalCost=cost;
  if(canonicalCost===undefined&&node)try{canonicalCost=nextEvolutionCostForNode(node,oldLevel)}catch(error){if(isProgressionBoundary(error))canonicalCost=null;else throw error}
  canonicalCost??=null;
  return Object.freeze({ ok: false, reason, node, nodeId: id, oldLevel,
    newLevel: oldLevel, cost: canonicalCost, spent: '0', balanceBefore: balance,
    balanceAfter:balance,revision,transactionKey,preview:safePurchasePreview(meta,node&&id),
    compilerVersions: EVOLUTION_COMPILER_VERSIONS, meta });
}
function isProgressionBoundary(error){return error instanceof ProgressionIntegerError||(error instanceof RangeError&&/too wide|digit|boundary/i.test(error.message))}
function safePurchasePreview(meta,id){if(!id)return null;try{return previewEvolutionLevel(meta,id)}catch(error){if(isProgressionBoundary(error))return null;throw error}}
function canonicalCommandInteger(value) {
  try { return parseProgressionInteger(value); } catch { return null; }
}
function validTransactionKey(value) {
  return typeof value === 'string' && value.length > 0 && value.length <= 128 ? value : null;
}
function normalizeTransactionKeys(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((key) => validTransactionKey(key)))].slice(-32);
}

/** Legacy transaction aliases backed by level authority. */
export const purchaseMemory = purchaseEvolutionLevel;
export const transactMemoryPurchase = purchaseEvolutionLevel;
export function memoryEffects(meta) { return compileEvolution(meta).effects; }
export function campaignResolved(meta) { return compareProgressionIntegers(meta?.runs ?? '0', '5') >= 0; }
export function buildMemoryScene(meta, selectedId = null) {
  const groups = groupAccessibleMemory(meta, selectedId); const nodes = Object.freeze(groups.flatMap((group) => group.nodes));
  return Object.freeze({ version: MEMORY_GRAPH_VERSION, selectedId, nodes, groups });
}
export function buildMemorySnapshot(topo, meta, selectedId = null, emphasizedIds = []) {
  return renderMemorySnapshot(topo, meta, buildMemoryScene(meta, selectedId), emphasizedIds);
}

export function validateMemoryGraph(nodes = MEMORY_NODES) {
  const errors = []; const ids = new Set(); const cells = new Set(); const unlockKeys = new Set();
  const byId = new Map(); const byCell = new Map(); const composition = {}; const branchCounts = {}; let totalCost = 0; let totalPower = 0;
  for (const node of nodes) {
    if (!/^[a-z][a-z-]+$/.test(node.id) || ids.has(node.id)) errors.push(`invalid id: ${node.id}`); ids.add(node.id); byId.set(node.id, node);
    if (!Number.isInteger(node.cell) || node.cell < 0 || node.cell >= TOPOLOGY.nodeCount || cells.has(node.cell)) errors.push(`invalid cell: ${node.id}`);
    else { cells.add(node.cell); byCell.set(node.cell, node); }
    if (MEMORY_CELL_BY_ID[node.id] !== undefined && MEMORY_CELL_BY_ID[node.id] !== node.cell) errors.push(`unstable cell: ${node.id}`);
    if (!Number.isFinite(node.cost) || node.cost <= 0) errors.push(`invalid cost: ${node.id}`); else totalCost += node.cost;
    if (!Number.isInteger(node.evolutionPower) || node.evolutionPower <= 0) errors.push(`invalid power: ${node.id}`); else totalPower += node.evolutionPower;
    if (!EVOLUTION_AFFINITY_IDS.includes(node.affinity) || !node.secondaryTags?.length || !node.tradeoff
      || !Array.isArray(node.habitatContributions) || !Array.isArray(node.transformationContributions)
      || !node.buildContributions?.length) errors.push(`invalid content: ${node.id}`);
    composition[node.kind] = (composition[node.kind] ?? 0) + 1; branchCounts[node.affinity] = (branchCounts[node.affinity] ?? 0) + 1;
    const effects = node.effect?.bonus ? [node.effect, node.effect.bonus] : [node.effect];
    for (const effect of effects) {
      if (!effect || !['scalar', 'conditional', 'unlock', 'resonance'].includes(effect.type)) { errors.push(`invalid effect: ${node.id}`); continue; }
      if (['scalar', 'conditional', 'resonance'].includes(effect.type) && !EFFECT_KEYS.has(effect.key)) errors.push(`unknown effect: ${node.id}`);
      if (!['multiply', 'add'].includes(effect.operation) && !['unlock', 'resonance'].includes(effect.type)) errors.push(`invalid operation: ${node.id}`);
      if (effect.type === 'conditional' && !effect.trigger) errors.push(`invalid trigger: ${node.id}`);
      if (effect.type === 'resonance' && (!Number.isFinite(effect.cap) || effect.cap <= 0 || effect.cap > 0.5)) errors.push(`invalid resonance: ${node.id}`);
      if (effect.type === 'unlock' && (!effect.key || !effect.mode || unlockKeys.has(effect.key))) errors.push(`invalid unlock: ${node.id}`);
      if (effect.type === 'unlock') unlockKeys.add(effect.key);
    }
  }
  const expectedKinds = { root: 6, major: 30, resonance: 180, conditional: 12, unlock: 12, keystone: 6, capstone: 6 };
  if (nodes.length !== 252) errors.push(`node count: ${nodes.length}`);
  for (const [kind, count] of Object.entries(expectedKinds)) if (composition[kind] !== count) errors.push(`kind count: ${kind}`);
  for (const branch of MEMORY_BRANCHES) if (branchCounts[branch] !== 42) errors.push(`branch count: ${branch}`);
  if (totalPower !== FULL_EVOLUTION_POWER) errors.push(`full power: ${totalPower}`);
  const adjacency = new Map(); let frontierStates = 0;
  for (const node of nodes) {
    const neighbors = [];
    if (Number.isInteger(node.cell) && node.cell >= 0 && node.cell < TOPOLOGY.nodeCount) for (let offset = TOPOLOGY.nodeStart[node.cell]; offset < TOPOLOGY.nodeStart[node.cell + 1]; offset++) {
      const neighbor = byCell.get(TOPOLOGY.nodeNeighbors[offset]); if (neighbor) neighbors.push(neighbor.id);
    }
    adjacency.set(node.id, neighbors); frontierStates += neighbors.length;
  }
  for (const branch of MEMORY_BRANCHES) {
    const territory = nodes.filter((node) => node.affinity === branch); const allowed = new Set(territory.map((node) => node.cell));
    if (territory.length && connectedCells(TOPOLOGY, territory[0].cell, allowed) !== allowed.size) errors.push(`disconnected branch: ${branch}`);
  }
  const roots = MEMORY_ROOT_IDS.filter((id) => byId.has(id)); const reachable = new Set(roots); const queue = [...roots];
  for (let head = 0; head < queue.length; head++) for (const id of adjacency.get(queue[head]) ?? []) if (!reachable.has(id)) { reachable.add(id); queue.push(id); }
  if (roots.length !== 6) errors.push(`root count: ${roots.length}`);
  for (const node of nodes) if (!reachable.has(node.id)) errors.push(`unreachable: ${node.id}`);
  const degrees = [...adjacency.values()].map((neighbors) => neighbors.length);
  const economyHash = hexU32(hashStringU32(nodes.map((node) => `${node.id}:${node.cost}`).join('|')));
  const effectHash = hexU32(hashStringU32(nodes.map((node) => `${node.id}:${JSON.stringify(node.effect)}`).join('|')));
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors), totalCost, totalPower,
    economyHash, effectHash, affinityHash: AFFINITY_METADATA_HASH, contentHash: EVOLUTION_CONTENT_HASH,
    contentVersion: EVOLUTION_CONTENT_VERSION, composition: Object.freeze(composition), branchCounts: Object.freeze(branchCounts),
    roots: Object.freeze(roots), reachable: reachable.size, physicalRelations: frontierStates / 2, frontierStates,
    minDegree: Math.min(...degrees), maxDegree: Math.max(...degrees), topologyFrequency: TOPOLOGY.frequency,
    worldPotential: compileMemory({ memoryNodes: nodes.map((node) => node.id) }).worldPotential,
    mappingHash: MEMORY_ATLAS_HASH });
}
function connectedCells(topo, root, allowed) {
  const seen = new Set([root]); const queue = [root];
  for (const cell of queue) for (let offset = topo.nodeStart[cell]; offset < topo.nodeStart[cell + 1]; offset++) {
    const next = topo.nodeNeighbors[offset]; if (allowed.has(next) && !seen.has(next)) { seen.add(next); queue.push(next); }
  }
  return seen.size;
}
