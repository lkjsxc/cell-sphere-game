#!/usr/bin/env node
/** Exhaustive Evolution Globe address, physical-frontier, effect, and economy audit. */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { MEMORY_ATLAS_REVERSE, validateAtlasMapping } from '../../src/game/skills/atlas.js';
import {
  MEMORY_BRANCHES, MEMORY_GRAPH_VERSION, MEMORY_NODES, MEMORY_NODE_IDS,
  MEMORY_PHYSICAL_ADJACENCY, MEMORY_ROOT_IDS, canPurchaseMemory, compileMemory,
  hasOwnedAdjacentCell, purchaseMemory, validateMemoryGraph,
} from '../../src/game/skills/index.js';
import { defaultMeta } from '../../src/platform/storage.js';

const atlas = validateAtlasMapping(); const graph = validateMemoryGraph(); const errors = [];
const expectedEconomyHash = '34b4e4a9'; const expectedEffectHash = '8444edfd';
let adjacentAllowed = 0; let rootBootstrapAllowed = 0; let nonadjacentDenied = 0; let singleOwnerStates = 0;
for (const node of MEMORY_NODES) {
  const physical = new Set(MEMORY_PHYSICAL_ADJACENCY[node.id]); const root = MEMORY_ROOT_IDS.includes(node.id);
  for (const ownerId of MEMORY_NODE_IDS) {
    if (ownerId === node.id) continue; singleOwnerStates++;
    const adjacent = physical.has(ownerId); const actual = hasOwnedAdjacentCell({ memoryNodes: [ownerId] }, node.id);
    if (actual !== adjacent && errors.length < 20) errors.push(`physical mismatch: ${ownerId}->${node.id}`);
    const meta = { ...defaultMeta(), runs: 0, echoBalance: node.cost, memoryNodes: [ownerId],
      requiredRuns: 1_000_000, runsRemaining: 1_000_000, experienceMet: false };
    const purchasable = canPurchaseMemory(meta, node.id);
    if (adjacent) { if (purchasable) adjacentAllowed++; else if (errors.length < 20) errors.push(`frontier denied: ${ownerId}->${node.id}`); }
    else if (root) { if (purchasable) rootBootstrapAllowed++; else if (errors.length < 20) errors.push(`root denied: ${node.id}`); }
    else { nonadjacentDenied++; if (purchasable && errors.length < 20) errors.push(`nonadjacent authority accepted: ${ownerId}->${node.id}`); }
  }
  if (canPurchaseMemory({ ...defaultMeta(), echoBalance: node.cost - 1,
    memoryNodes: [MEMORY_PHYSICAL_ADJACENCY[node.id][0]] }, node.id)) errors.push(`insufficient funds accepted: ${node.id}`);
}
const rootBootstrapStates = MEMORY_ROOT_IDS.reduce((sum, id) =>
  sum + MEMORY_NODE_IDS.length - 1 - MEMORY_PHYSICAL_ADJACENCY[id].length, 0);
const fresh = { ...defaultMeta(), runs: 0, echoBalance: 1_000_000, requiredRuns: 1_000_000, experienceMet: false };
const freshAccepted = MEMORY_NODE_IDS.filter((id) => canPurchaseMemory(fresh, id));
if (freshAccepted.join('|') !== MEMORY_ROOT_IDS.join('|')) errors.push('fresh bootstrap is not exactly the six canonical roots');
let meta = { ...fresh, echoBalance: graph.totalCost, totalEchoes: graph.totalCost };
while (meta.memoryNodes.length < MEMORY_NODES.length) {
  const node = MEMORY_NODES.find((candidate) => canPurchaseMemory(meta, candidate.id));
  if (!node) { errors.push(`acquisition stalled after ${meta.memoryNodes.length}`); break; }
  meta = purchaseMemory(meta, node.id).meta;
}
const skillDir = new URL('../../src/game/skills/', import.meta.url);
const productionFiles = readdirSync(skillDir).filter((name) => name.endsWith('.js')).map((name) => new URL(name, skillDir));
productionFiles.push(new URL('../../src/interface/panel-surfaces.js', import.meta.url), new URL('../../index.html', import.meta.url));
const production = productionFiles.map((file) => readFileSync(file, 'utf8')).join('\n');
const staleTerms = ['required' + 'Runs', 'runs' + 'Remaining', 'experience' + 'Met', 'Worlds ' + 'observed'];
const obsoleteVocabularyFound = staleTerms.filter((term) => production.includes(term));
const parentAuthorityFields = MEMORY_NODES.filter((node) => Object.hasOwn(node, 'requires')).length;
const obsoleteAuthorityFields = MEMORY_NODES.filter((node) => Object.keys(node).some((key) => /run|experience/i.test(key))).length;
const effectTypes = Object.fromEntries(['scalar', 'conditional', 'unlock'].map((type) =>
  [type, MEMORY_NODES.filter((node) => node.effect.type === type).length]));
const compiled = compileMemory({ memoryNodes: MEMORY_NODE_IDS });
const costDistribution = Object.fromEntries([...new Set(MEMORY_NODES.map((node) => node.cost))].sort((a, b) => a - b)
  .map((cost) => [cost, MEMORY_NODES.filter((node) => node.cost === cost).length]));
const valid = atlas.valid && graph.valid && errors.length === 0 && obsoleteVocabularyFound.length === 0
  && parentAuthorityFields === 0 && obsoleteAuthorityFields === 0 && graph.economyHash === expectedEconomyHash
  && graph.effectHash === expectedEffectHash && adjacentAllowed === graph.frontierStates
  && rootBootstrapAllowed === rootBootstrapStates && singleOwnerStates === 642 * 641
  && meta.memoryNodes.length === 642 && meta.echoBalance === 0;
const report = {
  topology: { cells: atlas.cells, unique: atlas.unique, layoutRelations: atlas.layoutRelations,
    physicalRelations: graph.physicalRelations, directedFrontierStates: graph.frontierStates,
    degree: { min: graph.minDegree, max: graph.maxDegree }, mappingHash: atlas.hash },
  graph: { version: MEMORY_GRAPH_VERSION, nodes: MEMORY_NODES.length, reachable: graph.reachable,
    roots: MEMORY_ROOT_IDS, branches: Object.fromEntries(MEMORY_BRANCHES.map((branch) => [branch, graph.branchCounts[branch]])) },
  authority: { freshAccepted: freshAccepted.length, singleOwnerStates, adjacentAllowed,
    rootBootstrapAllowed, rootBootstrapStates, nonadjacentDenied,
    parentAuthorityFields, obsoleteAuthorityFields, obsoleteVocabularyFound },
  content: { exactEffects: MEMORY_NODES.filter((node) => node.effect && node.effectEn && node.description).length,
    effectTypes, compiledScalars: Object.keys(compiled.effects).length, compiledConditionals: compiled.conditionals.length,
    compiledUnlocks: compiled.unlocks.length, effectHash: graph.effectHash,
    authoredLandmarks: MEMORY_NODES.filter((node) => node.authored).length,
    minorSkills: MEMORY_NODES.filter((node) => !node.authored).length },
  economy: { totalCost: graph.totalCost, economyHash: graph.economyHash, costDistribution,
    purchased: meta.memoryNodes.length, balanceAfter: meta.echoBalance },
  everyCellAddressed: MEMORY_ATLAS_REVERSE.every((index) => index >= 0), errors, valid,
};
mkdirSync('reports', { recursive: true }); writeFileSync('reports/skill-audit.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!valid || !report.everyCellAddressed || report.content.exactEffects !== 642) process.exitCode = 1;
