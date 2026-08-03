/** Permanent Evolution atlas: physical-frontier queries, transactions, and run compilation. */
import { CONTINUITY_MEMORY } from './continuity.js';
import { ECOLOGY_MEMORY } from './ecology.js';
import { FLOW_MEMORY } from './flow.js';
import { PERCEPTION_MEMORY } from './perception.js';
import { REACH_MEMORY } from './reach.js';
import { RESERVE_MEMORY } from './reserve.js';
import { renderMemorySnapshot } from './scene.js';
import { MEMORY_ATLAS_HASH } from './atlas.js';
import { hashStringU32, hexU32 } from '../../core/hash.js';
import { createTopology } from '../../world/icosphere.js';
export { createMemoryFields } from './scene.js';
export { MEMORY_ATLAS_REVERSE } from './atlas.js';
export { applyMemoryConditionals } from './node.js';

export const MEMORY_GRAPH_VERSION = 4;
export const MEMORY_BRANCHES = Object.freeze(['Reach', 'Flow', 'Reserve', 'Ecology', 'Perception', 'Continuity']);
export const MEMORY_NODES = Object.freeze([
  ...REACH_MEMORY, ...FLOW_MEMORY, ...RESERVE_MEMORY,
  ...ECOLOGY_MEMORY, ...PERCEPTION_MEMORY, ...CONTINUITY_MEMORY,
]);
export const MEMORY_NODE_IDS = Object.freeze(MEMORY_NODES.map((node) => node.id));
export const MEMORY_LANDMARK_IDS = Object.freeze(MEMORY_NODES.filter((node) => node.authored).map((node) => node.id));
export const MEMORY_ROOT_IDS = Object.freeze(MEMORY_BRANCHES.map((branch) => MEMORY_NODES.find((node) => node.branch === branch).id));
const ROOT_IDS = new Set(MEMORY_ROOT_IDS); const BY_ID = new Map(MEMORY_NODES.map((node) => [node.id, node]));
const TOPOLOGY = createTopology(3); const BY_CELL = new Map(MEMORY_NODES.map((node) => [node.cell, node]));
export const MEMORY_CELL_BY_ID = Object.freeze(Object.fromEntries(MEMORY_NODES.map((node) => [node.id, node.cell])));
export const MEMORY_PHYSICAL_ADJACENCY = Object.freeze(Object.fromEntries(MEMORY_NODES.map((node) => [node.id,
  Object.freeze(Array.from(TOPOLOGY.nodeNeighbors.slice(TOPOLOGY.nodeStart[node.cell], TOPOLOGY.nodeStart[node.cell + 1]),
    (cell) => BY_CELL.get(cell)?.id).filter(Boolean))])));
const ADDITIVE = new Set(['growthCap', 'anastomosis', 'redundantLoops',
  'coldReserve', 'symbioticFilm', 'distributedSensing']);
const EFFECT_KEYS = new Set(['reach', 'uptake', 'maintenance', 'conductance', 'reinforce',
  'stressResist', 'heatTol', 'droughtTol', 'toxinTol',
  'energyCap', 'regrow', 'growCost', ...ADDITIVE]);
const COMPILED = new Map();

export function getMemoryNode(id) { return BY_ID.get(id) ?? null; }
export function getMemoryAdjacentIds(id) { return MEMORY_PHYSICAL_ADJACENCY[id] ?? Object.freeze([]); }
function recognizedOwnedIds(meta) {
  return new Set(Array.isArray(meta?.memoryNodes) ? meta.memoryNodes.filter((id) => BY_ID.has(id)) : []);
}
function firstOwnedAdjacentId(id, ownedIds) {
  return getMemoryAdjacentIds(id).find((neighborId) => ownedIds.has(neighborId)) ?? null;
}
/** The sole current adjacency authority; only actual level-3 cell neighbors count. */
export function hasOwnedAdjacentCell(meta, id, ownedIds = recognizedOwnedIds(meta)) {
  return BY_ID.has(id) && firstOwnedAdjacentId(id, ownedIds) !== null;
}
function memoryFrontier(meta, id, ownedIds) {
  const adjacencyMet = hasOwnedAdjacentCell(meta, id, ownedIds); const bootstrap = ROOT_IDS.has(id);
  return { adjacencyMet, adjacentOwnedId: firstOwnedAdjacentId(id, ownedIds),
    bootstrap, frontierMet: adjacencyMet || bootstrap };
}

export function memoryNodeState(meta, node, selectedId = null, ownedIds = recognizedOwnedIds(meta)) {
  const current = BY_ID.get(node?.id); if (!current) return null;
  const owned = ownedIds.has(current.id); const frontier = memoryFrontier(meta, current.id, ownedIds);
  const affordable = Number.isFinite(meta?.echoBalance) && meta.echoBalance >= current.cost;
  return Object.freeze({ ...current, owned, reachable: !owned && frontier.frontierMet,
    locked: !owned && !frontier.frontierMet, affordable, adjacencyMet: frontier.adjacencyMet,
    adjacentOwnedId: frontier.adjacentOwnedId, bootstrap: frontier.bootstrap,
    selectedReady: selectedId === current.id && !owned && frontier.frontierMet && affordable });
}

export function groupAccessibleMemory(meta, selectedId = null) {
  const ownedIds = recognizedOwnedIds(meta);
  const nodes = MEMORY_NODES.map((node) => memoryNodeState(meta, node, selectedId, ownedIds));
  return Object.freeze(MEMORY_BRANCHES.map((branch) => Object.freeze({ branch,
    nodes: Object.freeze(nodes.filter((node) => node.branch === branch)) })));
}
export function availableMemoryNodes(meta) {
  return Object.freeze(MEMORY_NODES.filter((node) => canPurchaseMemory(meta, node.id)));
}
export function canPurchaseMemory(meta, id) {
  const node = BY_ID.get(id);
  if (!node || !Array.isArray(meta?.memoryNodes) || !Number.isFinite(meta.echoBalance)) return false;
  const state = memoryNodeState(meta, node, id);
  return state.selectedReady;
}
export function purchaseMemory(meta, id) {
  if (!canPurchaseMemory(meta, id)) return Object.freeze({ ok: false, meta });
  const node = BY_ID.get(id); const balance = meta.echoBalance - node.cost;
  if (balance < 0) return Object.freeze({ ok: false, meta });
  const next = { ...meta, echoBalance: balance, memoryNodes: [...meta.memoryNodes, id] };
  return Object.freeze({ ok: true, node, spent: node.cost, meta: next });
}
export const transactMemoryPurchase = purchaseMemory;

/** Compile canonical owned order once; disconnected migrated islands remain effective. */
export function compileMemory(meta) {
  const owned = recognizedOwnedIds(meta); const key = MEMORY_NODE_IDS.filter((id) => owned.has(id)).join('|');
  if (COMPILED.has(key)) return COMPILED.get(key);
  const effects = {}; const conditionals = []; const unlocks = [];
  for (const node of MEMORY_NODES) {
    if (!owned.has(node.id)) continue; const effect = node.effect;
    if (effect.type === 'scalar') mergeEffect(effects, effect);
    else if (effect.type === 'conditional') conditionals.push(Object.freeze({ nodeId: node.id, ...effect }));
    else unlocks.push(Object.freeze({ nodeId: node.id, key: effect.key, mode: effect.mode }));
    if (effect.bonus) mergeEffect(effects, effect.bonus);
  }
  const compiled = Object.freeze({ effects: Object.freeze(effects),
    conditionals: Object.freeze(conditionals), unlocks: Object.freeze(unlocks) });
  COMPILED.set(key, compiled); return compiled;
}
function mergeEffect(target, effect) {
  if (effect.operation === 'add' || ADDITIVE.has(effect.key)) target[effect.key] = (target[effect.key] ?? 0) + effect.value;
  else target[effect.key] = (target[effect.key] ?? 1) * effect.value;
}
export function memoryEffects(meta) { return compileMemory(meta).effects; }
export function campaignResolved(meta) { return Number.isFinite(meta?.runs) && meta.runs >= 4; }
export function buildMemoryScene(meta, selectedId = null) {
  const groups = groupAccessibleMemory(meta, selectedId); const nodes = Object.freeze(groups.flatMap((group) => group.nodes));
  return Object.freeze({ version: MEMORY_GRAPH_VERSION, selectedId, nodes, groups });
}
export function buildMemorySnapshot(topo, meta, selectedId = null, emphasizedIds = []) {
  return renderMemorySnapshot(topo, meta, buildMemoryScene(meta, selectedId), emphasizedIds);
}

export function validateMemoryGraph(nodes = MEMORY_NODES) {
  const errors = []; const ids = new Set(); const cells = new Set(); const unlockKeys = new Set();
  const byId = new Map(); const byCell = new Map(); const composition = {}; const branchCounts = {}; let totalCost = 0;
  for (const node of nodes) {
    if (!/^[a-z][a-z-]+$/.test(node.id) || ids.has(node.id)) errors.push(`invalid id: ${node.id}`); ids.add(node.id); byId.set(node.id, node);
    if (!Number.isInteger(node.cell) || node.cell < 0 || node.cell >= TOPOLOGY.nodeCount || cells.has(node.cell)) errors.push(`invalid cell: ${node.id}`);
    else { cells.add(node.cell); byCell.set(node.cell, node); }
    if (MEMORY_CELL_BY_ID[node.id] !== undefined && MEMORY_CELL_BY_ID[node.id] !== node.cell) errors.push(`unstable cell: ${node.id}`);
    if (!Number.isFinite(node.cost) || node.cost <= 0) errors.push(`invalid cost: ${node.id}`); else totalCost += node.cost;
    composition[node.kind] = (composition[node.kind] ?? 0) + 1; branchCounts[node.branch] = (branchCounts[node.branch] ?? 0) + 1;
    const effects = node.effect?.bonus ? [node.effect, node.effect.bonus] : [node.effect];
    for (const effect of effects) {
      if (!effect || !['scalar', 'conditional', 'unlock'].includes(effect.type)) { errors.push(`invalid effect: ${node.id}`); continue; }
      if ((effect.type === 'scalar' || effect.type === 'conditional') && !EFFECT_KEYS.has(effect.key)) errors.push(`unknown effect: ${node.id}`);
      if (!['multiply', 'add'].includes(effect.operation) && effect.type !== 'unlock') errors.push(`invalid operation: ${node.id}`);
      if (effect.type === 'conditional' && !effect.trigger) errors.push(`invalid trigger: ${node.id}`);
      if (effect.type === 'unlock' && (!effect.key || !effect.mode || unlockKeys.has(effect.key))) errors.push(`invalid unlock: ${node.id}`);
      if (effect.type === 'unlock') unlockKeys.add(effect.key);
    }
  }
  const expectedKinds = { micro: 582, conditional: 24, unlock: 18, keystone: 6, connector: 6, capstone: 6 };
  if (nodes.length !== 642) errors.push(`node count: ${nodes.length}`);
  for (const [kind, count] of Object.entries(expectedKinds)) if (composition[kind] !== count) errors.push(`kind count: ${kind}`);
  for (const branch of MEMORY_BRANCHES) if (branchCounts[branch] !== 107) errors.push(`branch count: ${branch}`);
  const adjacency = new Map(); let frontierStates = 0;
  for (const node of nodes) {
    const neighbors = [];
    if (Number.isInteger(node.cell) && node.cell >= 0 && node.cell < TOPOLOGY.nodeCount) for (let offset = TOPOLOGY.nodeStart[node.cell]; offset < TOPOLOGY.nodeStart[node.cell + 1]; offset++) {
      const neighbor = byCell.get(TOPOLOGY.nodeNeighbors[offset]); if (neighbor) neighbors.push(neighbor.id);
    }
    adjacency.set(node.id, neighbors); frontierStates += neighbors.length;
  }
  for (const branch of MEMORY_BRANCHES) {
    const territory = nodes.filter((node) => node.branch === branch); const allowed = new Set(territory.map((node) => node.cell));
    if (territory.length && connectedCells(TOPOLOGY, territory[0].cell, allowed) !== allowed.size) errors.push(`disconnected branch: ${branch}`);
  }
  const roots = MEMORY_ROOT_IDS.filter((id) => byId.has(id)); const reachable = new Set(roots); const queue = [...roots];
  for (let head = 0; head < queue.length; head++) for (const id of adjacency.get(queue[head]) ?? []) if (!reachable.has(id)) { reachable.add(id); queue.push(id); }
  if (roots.length !== 6) errors.push(`root count: ${roots.length}`);
  for (const node of nodes) if (!reachable.has(node.id)) errors.push(`unreachable: ${node.id}`);
  const degrees = [...adjacency.values()].map((neighbors) => neighbors.length);
  const economyHash = hexU32(hashStringU32(nodes.map((node) => `${node.id}:${node.cost}`).join('|')));
  const effectHash = hexU32(hashStringU32(nodes.map((node) => `${node.id}:${JSON.stringify(node.effect)}`).join('|')));
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors), totalCost,
    economyHash, effectHash, composition: Object.freeze(composition), branchCounts: Object.freeze(branchCounts),
    roots: Object.freeze(roots), reachable: reachable.size, physicalRelations: frontierStates / 2, frontierStates,
    minDegree: Math.min(...degrees), maxDegree: Math.max(...degrees), topologyLevel: TOPOLOGY.levels, mappingHash: MEMORY_ATLAS_HASH });
}
function connectedCells(topo, root, allowed) {
  const seen = new Set([root]); const queue = [root];
  for (const cell of queue) for (let offset = topo.nodeStart[cell]; offset < topo.nodeStart[cell + 1]; offset++) {
    const next = topo.nodeNeighbors[offset]; if (allowed.has(next) && !seen.has(next)) { seen.add(next); queue.push(next); }
  }
  return seen.size;
}
