/** Permanent Evolution atlas: physical-frontier queries, transactions, and run compilation. */
import { CONTINUITY_MEMORY } from './continuity.js';
import { ECOLOGY_MEMORY } from './ecology.js';
import { FLOW_MEMORY } from './flow.js';
import { PERCEPTION_MEMORY } from './perception.js';
import { REACH_MEMORY } from './reach.js';
import { RESERVE_MEMORY } from './reserve.js';
import { renderMemorySnapshot } from './scene.js';
import { MEMORY_ATLAS_HASH } from './atlas.js';
import { AFFINITY_METADATA_HASH, EVOLUTION_AFFINITIES, EVOLUTION_AFFINITY_IDS,
  EVOLUTION_CONTENT_VERSION } from './affinities.js';
import { BUILD_RECIPES, compileBuilds } from './builds.js';
import { BASE_WORLD_POTENTIAL, FULL_EVOLUTION_POWER, WORLD_POTENTIAL_VERSION,
  worldPotentialForPower } from './potential.js';
import { hashStringU32, hexU32 } from '../../core/hash.js';
import { createGeodesicTopology } from '../../world/icosphere.js';
export { createMemoryFields } from './scene.js';
export { MEMORY_ATLAS_REVERSE } from './atlas.js';
export { applyMemoryConditionals } from './node.js';
export { AFFINITY_METADATA_HASH, EVOLUTION_AFFINITIES, EVOLUTION_AFFINITY_IDS, EVOLUTION_CONTENT_VERSION } from './affinities.js';
export { BUILD_RECIPES, compileBuilds } from './builds.js';
export { BASE_WORLD_POTENTIAL, EVOLUTION_POWER_BY_KIND, FULL_EVOLUTION_POWER, WORLD_POTENTIAL_ANCHORS,
  WORLD_POTENTIAL_VERSION, modeledScoreRange, worldPotentialForPower } from './potential.js';

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
const ADDITIVE = new Set(['growthCap', 'anastomosis', 'redundantLoops',
  'coldReserve', 'symbioticFilm', 'distributedSensing']);
const EFFECT_KEYS = new Set(['reach', 'uptake', 'maintenance', 'conductance', 'reinforce',
  'stressResist', 'heatTol', 'droughtTol', 'toxinTol',
  'energyCap', 'regrow', 'growCost', ...ADDITIVE]);
const COMPILED = new Map(); const COMPILED_LIMIT = 512;

export function getMemoryNode(id) { return BY_ID.get(id) ?? null; }
export function getMemoryAdjacentIds(id) { return MEMORY_PHYSICAL_ADJACENCY[id] ?? Object.freeze([]); }
export function newlyAvailableAdjacentIds(meta, id) {
  const owned = recognizedOwnedIds(meta); const baseline = owned.has(id)
    ? { ...meta, memoryNodes: (meta?.memoryNodes ?? []).filter((ownedId) => ownedId !== id) } : meta;
  return Object.freeze(getMemoryAdjacentIds(id).filter((neighborId) => {
    const state = memoryNodeState(baseline, BY_ID.get(neighborId)); return state && !state.owned && !state.reachable;
  }));
}
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
  const adjacencyMet = hasOwnedAdjacentCell(meta, id, ownedIds);
  const bootstrap = ownedIds.size === 0 && ROOT_IDS.has(id);
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
  return Object.freeze(MEMORY_BRANCHES.map((affinity) => Object.freeze({ branch: affinity, affinity,
    nodes: Object.freeze(nodes.filter((node) => node.affinity === affinity)) })));
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
  return Object.freeze({ ok: true, node, spent: node.cost, preview: memoryPurchasePreview(meta, id), meta: next });
}
export const transactMemoryPurchase = purchaseMemory;

/** Compile canonical owned order once; disconnected migrated islands remain effective. */
export function compileMemory(meta) {
  const owned = recognizedOwnedIds(meta); const key = MEMORY_NODE_IDS.filter((id) => owned.has(id)).join('|');
  if (COMPILED.has(key)) return COMPILED.get(key);
  const effects = {}; const conditionals = []; const unlocks = []; const resonance = new Map(); const ownedNodes = [];
  let evolutionPower = 0;
  for (const node of MEMORY_NODES) {
    if (!owned.has(node.id)) continue; const effect = node.effect; ownedNodes.push(node);
    evolutionPower += node.evolutionPower;
    if (effect.type === 'scalar') mergeEffect(effects, effect);
    else if (effect.type === 'conditional') conditionals.push(Object.freeze({ nodeId: node.id, ...effect }));
    else if (effect.type === 'resonance') {
      const resonanceKey = `${effect.branch}:${effect.key}:${effect.direction}:${effect.cap}:${effect.scale}`;
      resonance.set(resonanceKey, { ...effect, points: (resonance.get(resonanceKey)?.points ?? 0) + 1 });
    } else unlocks.push(Object.freeze({ nodeId: node.id, key: effect.key, mode: effect.mode }));
    if (effect.bonus) mergeEffect(effects, effect.bonus);
  }
  const resonanceCurves = [];
  for (const curve of resonance.values()) {
    const benefit = curve.cap * (1 - Math.exp(-curve.points / curve.scale));
    const value = curve.direction === 'down' ? 1 - benefit : 1 + benefit;
    mergeEffect(effects, { key: curve.key, value, operation: 'multiply' });
    resonanceCurves.push(Object.freeze({ ...curve, value }));
  }
  boundCompiledEffects(effects);
  const capabilitySet = new Set(unlocks.filter((entry) => entry.mode === 'habitat').map((entry) => entry.key));
  const builds = compileBuilds(ownedNodes); const worldPotential = worldPotentialForPower(evolutionPower);
  const compiled = Object.freeze({ effects: Object.freeze(effects),
    conditionals: Object.freeze(conditionals), unlocks: Object.freeze(unlocks),
    resonanceCurves: Object.freeze(resonanceCurves), evolutionPower, worldPotential,
    potentialVersion: WORLD_POTENTIAL_VERSION, contentVersion: EVOLUTION_CONTENT_VERSION,
    habitatCapabilities: Object.freeze(HABITAT_CAPABILITIES.filter((keyName) => capabilitySet.has(keyName))),
    activeBuilds: builds.activeBuilds, nearBuilds: builds.nearBuilds, buildEffects: builds.buildEffects,
    buildCapabilities: builds.capabilities, transformations: builds.transformations });
  COMPILED.set(key, compiled);
  if (COMPILED.size > COMPILED_LIMIT) COMPILED.delete(COMPILED.keys().next().value);
  return compiled;
}

export function worldPotential(meta) { return compileMemory(meta).worldPotential; }
export function memoryPurchasePreview(meta, id) {
  const node = BY_ID.get(id); if (!node) return null; const owned = recognizedOwnedIds(meta).has(id);
  const without = owned ? { ...meta, memoryNodes: (meta?.memoryNodes ?? []).filter((ownedId) => ownedId !== id) } : meta;
  const withNode = owned ? meta : { ...meta, memoryNodes: [...(meta?.memoryNodes ?? []), id] };
  const before = compileMemory(without);
  const after = compileMemory(withNode);
  const keys = new Set([...Object.keys(before.effects), ...Object.keys(after.effects)]);
  const changes = [...keys].filter((keyName) => (before.effects[keyName] ?? 1) !== (after.effects[keyName] ?? 1))
    .map((keyName) => Object.freeze({ key: keyName, before: before.effects[keyName] ?? 1, after: after.effects[keyName] ?? 1 }));
  const unlocked = after.unlocks.filter((entry) => !before.unlocks.some((old) => old.key === entry.key));
  const beforeBuilds = new Map([...before.activeBuilds, ...before.nearBuilds].map((build) => [build.id, build]));
  const buildProgress = [...after.activeBuilds, ...after.nearBuilds].filter((build) => node.buildContributions.includes(build.id)).map((build) => Object.freeze({
    id: build.id, name: build.name, before: beforeBuilds.get(build.id)?.progress ?? 0, after: build.progress,
    active: build.active, missing: build.missing,
  }));
  return Object.freeze({ nodeId: id, powerBefore: before.evolutionPower, powerAfter: after.evolutionPower,
    powerGain: after.evolutionPower - before.evolutionPower, potentialBefore: before.worldPotential, potentialAfter: after.worldPotential,
    potentialDelta: after.worldPotential - before.worldPotential, changes: Object.freeze(changes), unlocked: Object.freeze(unlocked),
    buildProgress: Object.freeze(buildProgress) });
}
function mergeEffect(target, effect) {
  if (effect.operation === 'add' || ADDITIVE.has(effect.key)) target[effect.key] = (target[effect.key] ?? 0) + effect.value;
  else target[effect.key] = (target[effect.key] ?? 1) * effect.value;
}
const EFFECT_CAPS = Object.freeze({ reach:.9, uptake:.9, maintenance:.5, conductance:1, reinforce:.8,
  stressResist:.9, heatTol:.5, droughtTol:.5, toxinTol:.5, energyCap:.9, regrow:.9, growCost:.35 });
function boundCompiledEffects(effects) {
  for (const [key, cap] of Object.entries(EFFECT_CAPS)) if (key in effects) {
    const raw = effects[key]; const delta = Math.abs(raw - 1);
    effects[key] = raw < 1 ? 1 - cap * (1 - Math.exp(-delta / cap)) : 1 + cap * (1 - Math.exp(-delta / cap));
  }
}
export function memoryEffects(meta) { return compileMemory(meta).effects; }
export function campaignResolved(meta) { return Number.isFinite(meta?.runs) && meta.runs >= 5; }
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
