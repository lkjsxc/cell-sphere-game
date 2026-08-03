#!/usr/bin/env node
/** Exhaustive Evolution Globe address, graph, effect, gate, and economy audit. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { MEMORY_ATLAS_REVERSE, validateAtlasMapping } from '../../src/game/memory-atlas.js';
import { MEMORY_BRANCHES, MEMORY_NODES, canPurchaseMemory, purchaseMemory, validateMemoryGraph } from '../../src/game/memory.js';
import { defaultMeta } from '../../src/platform/storage.js';

const atlas = validateAtlasMapping(); const graph = validateMemoryGraph();
let meta = { ...defaultMeta(), runs: 164, echoBalance: graph.totalCost, totalEchoes: graph.totalCost };
while (meta.memoryNodes.length < MEMORY_NODES.length) {
  const node = MEMORY_NODES.find((candidate) => canPurchaseMemory(meta, candidate.id));
  if (!node) break; meta = purchaseMemory(meta, node.id).meta;
}
const effectTypes = Object.fromEntries(['scalar', 'conditional', 'unlock'].map((type) =>
  [type, MEMORY_NODES.filter((node) => node.effect.type === type).length]));
const report = {
  topology: { cells: atlas.cells, unique: atlas.unique, relations: atlas.relations, mappingHash: atlas.hash },
  graph: { version: 3, nodes: MEMORY_NODES.length, reachable: graph.reachable, roots: graph.roots.length,
    branches: Object.fromEntries(MEMORY_BRANCHES.map((branch) => [branch, graph.branchCounts[branch]])), maxDegree: graph.maxDegree },
  content: { exactEffects: MEMORY_NODES.filter((node) => node.effect && node.effectEn && node.description).length,
    effectTypes, authoredLandmarks: MEMORY_NODES.filter((node) => node.authored).length,
    minorSkills: MEMORY_NODES.filter((node) => !node.authored).length },
  economy: { totalCost: graph.totalCost, purchased: meta.memoryNodes.length, balanceAfter: meta.echoBalance,
    maxWorldGate: Math.max(...MEMORY_NODES.map((node) => node.requiredRuns)) },
  everyCellAddressed: MEMORY_ATLAS_REVERSE.every((index) => index >= 0), valid: atlas.valid && graph.valid,
};
mkdirSync('reports', { recursive: true }); writeFileSync('reports/skill-audit.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.valid || !report.everyCellAddressed || report.content.exactEffects !== 642
  || report.economy.purchased !== 642 || report.economy.balanceAfter !== 0) process.exitCode = 1;
