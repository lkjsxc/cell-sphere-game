/** Permanent Memory atlas: graph queries, transactions, and run compilation. */
import { CONTINUITY_MEMORY } from './memory-continuity.js';
import { ECOLOGY_MEMORY } from './memory-ecology.js';
import { FLOW_MEMORY } from './memory-flow.js';
import { PERCEPTION_MEMORY } from './memory-perception.js';
import { REACH_MEMORY } from './memory-reach.js';
import { RESERVE_MEMORY } from './memory-reserve.js';
import { renderMemorySnapshot } from './memory-scene.js';

export const MEMORY_GRAPH_VERSION = 1;
export const MEMORY_BRANCHES = Object.freeze(['Reach', 'Flow', 'Reserve', 'Ecology', 'Perception', 'Continuity']);
export const MEMORY_NODES = Object.freeze([
  ...REACH_MEMORY, ...FLOW_MEMORY, ...RESERVE_MEMORY,
  ...ECOLOGY_MEMORY, ...PERCEPTION_MEMORY, ...CONTINUITY_MEMORY,
]);
export const MEMORY_NODE_IDS = Object.freeze(MEMORY_NODES.map((node) => node.id));
const BY_ID = new Map(MEMORY_NODES.map((node) => [node.id, node]));
const ADDITIVE = new Set(['signalCharges', 'growthCap', 'anastomosis', 'redundantLoops',
  'coldReserve', 'symbioticFilm', 'distributedSensing']);
const EFFECT_KEYS = new Set(['reach', 'uptake', 'maintenance', 'conductance', 'reinforce',
  'stressResist', 'heatTol', 'droughtTol', 'toxinTol', 'signalRadius', 'signalDuration',
  'energyCap', 'regrow', 'growCost', ...ADDITIVE]);
const COMPILED = new Map();

export function getMemoryNode(id) { return BY_ID.get(id) ?? null; }

export function memoryNodeState(meta, node, selectedId = null) {
  const ownedIds = new Set(Array.isArray(meta?.memoryNodes) ? meta.memoryNodes : []);
  const owned = ownedIds.has(node.id);
  const prerequisitesMet = node.requires.every((id) => ownedIds.has(id));
  const affordable = Number.isFinite(meta?.echoBalance) && meta.echoBalance >= node.cost;
  return Object.freeze({ ...node, owned, reachable: !owned && prerequisitesMet,
    locked: !owned && !prerequisitesMet, affordable,
    selectedReady: selectedId === node.id && !owned && prerequisitesMet && affordable });
}

export function groupAccessibleMemory(meta, selectedId = null) {
  const nodes = MEMORY_NODES.map((node) => memoryNodeState(meta, node, selectedId));
  return Object.freeze(MEMORY_BRANCHES.map((branch) => Object.freeze({ branch,
    nodes: Object.freeze(nodes.filter((node) => node.branch === branch)) })));
}

export function availableMemoryNodes(meta) {
  return Object.freeze(MEMORY_NODES.filter((node) => canPurchaseMemory(meta, node.id)));
}

export function canPurchaseMemory(meta, id) {
  const node = BY_ID.get(id);
  if (!node || !Array.isArray(meta?.memoryNodes) || !Number.isFinite(meta.echoBalance)) return false;
  if (meta.memoryNodes.includes(id) || meta.echoBalance < node.cost) return false;
  return node.requires.every((required) => meta.memoryNodes.includes(required));
}

export function purchaseMemory(meta, id) {
  if (!canPurchaseMemory(meta, id)) return Object.freeze({ ok: false, meta });
  const node = BY_ID.get(id);
  const next = { ...meta, echoBalance: meta.echoBalance - node.cost,
    memoryNodes: [...meta.memoryNodes, id] };
  return Object.freeze({ ok: true, node, spent: node.cost, meta: next });
}
export const transactMemoryPurchase = purchaseMemory;

/** Compile canonical owned order once; callers pass `effects` into a run. */
export function compileMemory(meta) {
  const owned = new Set(Array.isArray(meta?.memoryNodes) ? meta.memoryNodes : []);
  const key = MEMORY_NODE_IDS.filter((id) => owned.has(id)).join('|');
  if (COMPILED.has(key)) return COMPILED.get(key);
  const effects = {}; const conditionals = []; const unlocks = [];
  for (const node of MEMORY_NODES) {
    if (!owned.has(node.id)) continue;
    const effect = node.effect;
    if (effect.type === 'scalar') mergeEffect(effects, effect);
    else if (effect.type === 'conditional') conditionals.push(Object.freeze({ nodeId: node.id, ...effect }));
    else unlocks.push(Object.freeze({ nodeId: node.id, key: effect.key, mode: effect.mode }));
    if (effect.bonus) mergeEffect(effects, effect.bonus);
  }
  const compiled = Object.freeze({ effects: Object.freeze(effects),
    conditionals: Object.freeze(conditionals), unlocks: Object.freeze(unlocks) });
  COMPILED.set(key, compiled);
  return compiled;
}

function mergeEffect(target, effect) {
  if (effect.operation === 'add' || ADDITIVE.has(effect.key))
    target[effect.key] = (target[effect.key] ?? 0) + effect.value;
  else target[effect.key] = (target[effect.key] ?? 1) * effect.value;
}

export function memoryEffects(meta) { return compileMemory(meta).effects; }
export function campaignResolved(meta) { return meta.memoryNodes.includes('continuity-unbroken-lesson'); }

export function buildMemoryScene(meta, selectedId = null) {
  const groups = groupAccessibleMemory(meta, selectedId);
  const nodes = Object.freeze(groups.flatMap((group) => group.nodes));
  const links = Object.freeze(MEMORY_NODES.flatMap((node) => node.requires.map((from) =>
    Object.freeze({ from, to: node.id }))));
  return Object.freeze({ version: MEMORY_GRAPH_VERSION, nodes, links, groups });
}

export function buildMemorySnapshot(topo, meta, selectedId = null) {
  return renderMemorySnapshot(topo, meta, buildMemoryScene(meta, selectedId));
}

export function validateMemoryGraph(nodes = MEMORY_NODES) {
  const errors = []; const ids = new Set(); const cells = new Set(); const unlockKeys = new Set();
  const byId = new Map(); const composition = {}; const branchCounts = {}; let totalCost = 0;
  for (const node of nodes) {
    if (!/^[a-z][a-z-]+$/.test(node.id) || ids.has(node.id)) errors.push(`invalid id: ${node.id}`); ids.add(node.id); byId.set(node.id, node);
    if (!Number.isInteger(node.cell) || node.cell < 0 || node.cell >= 2562 || cells.has(node.cell)) errors.push(`invalid cell: ${node.id}`); cells.add(node.cell);
    if (!Number.isFinite(node.cost) || node.cost <= 0) errors.push(`invalid cost: ${node.id}`); else totalCost += node.cost;
    composition[node.kind] = (composition[node.kind] ?? 0) + 1;
    branchCounts[node.branch] = (branchCounts[node.branch] ?? 0) + 1;
    const effects = node.effect.bonus ? [node.effect, node.effect.bonus] : [node.effect];
    for (const effect of effects) {
      if (!['scalar', 'conditional', 'unlock'].includes(effect.type)) errors.push(`invalid effect: ${node.id}`);
      if ((effect.type === 'scalar' || effect.type === 'conditional') && !EFFECT_KEYS.has(effect.key)) errors.push(`unknown effect: ${node.id}`);
      if (!['multiply', 'add'].includes(effect.operation) && effect.type !== 'unlock') errors.push(`invalid operation: ${node.id}`);
      if (effect.type === 'conditional' && !effect.trigger) errors.push(`invalid trigger: ${node.id}`);
      if (effect.type === 'unlock' && (!effect.key || !effect.mode || unlockKeys.has(effect.key))) errors.push(`invalid unlock: ${node.id}`);
      if (effect.type === 'unlock') unlockKeys.add(effect.key);
    }
  }
  const expectedKinds = { micro: 48, conditional: 24, unlock: 18, keystone: 6, connector: 6, capstone: 6 };
  if (nodes.length !== 108) errors.push(`node count: ${nodes.length}`);
  for (const [kind, count] of Object.entries(expectedKinds)) if (composition[kind] !== count) errors.push(`kind count: ${kind}`);
  for (const branch of MEMORY_BRANCHES) if (branchCounts[branch] !== 18) errors.push(`branch count: ${branch}`);
  const children = new Map(nodes.map((node) => [node.id, 0]));
  for (const node of nodes) for (const required of node.requires) {
    if (!byId.has(required)) errors.push(`missing prerequisite: ${node.id}->${required}`);
    else children.set(required, children.get(required) + 1);
  }
  const visiting = new Set(); const reached = new Set();
  function visit(id) {
    if (visiting.has(id)) { errors.push(`cycle: ${id}`); return; }
    if (reached.has(id)) return; visiting.add(id);
    for (const required of byId.get(id)?.requires ?? []) if (byId.has(required)) visit(required);
    visiting.delete(id); reached.add(id);
  }
  for (const id of ids) visit(id);
  for (const node of nodes) if (children.get(node.id) === 0 && node.kind !== 'capstone') errors.push(`orphan: ${node.id}`);
  const roots = nodes.filter((node) => node.requires.length === 0).map((node) => node.id);
  const rootReachable = new Set(roots); let changed = true;
  while (changed) { changed = false; for (const node of nodes) if (!rootReachable.has(node.id)
    && node.requires.every((id) => rootReachable.has(id))) { rootReachable.add(node.id); changed = true; } }
  if (roots.length !== 6) errors.push(`root count: ${roots.length}`);
  for (const node of nodes) if (!rootReachable.has(node.id)) errors.push(`unreachable: ${node.id}`);
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors),
    totalCost, composition: Object.freeze(composition), branchCounts: Object.freeze(branchCounts),
    roots: Object.freeze(roots), reachable: rootReachable.size });
}
