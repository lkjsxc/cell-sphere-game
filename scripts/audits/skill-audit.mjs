#!/usr/bin/env node
/** Production-backed authored Evolution topology, exact economy, and compiler audit. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { createGeodesicTopology, createTopology } from '../../src/world/icosphere.js';
import { EVOLUTION_COMPILER_VERSIONS, MEMORY_NODES, availableMemoryNodes, compileEvolution, evolutionCompileCacheDiagnostics,
  createEvolutionTerritories, evolutionCostForTargetLevel, evolutionLevel, getMemoryAdjacentIds, normalizeEvolutionLevels, purchaseEvolutionLevel,
  validateMemoryGraph } from '../../src/game/skills/index.js';
import { addProgressionIntegers, compareProgressionIntegers } from '../../src/core/progression-integer.js';
import { defaultMeta } from '../../src/platform/storage.js';

const started = performance.now(); const topology = createGeodesicTopology(2); const graph = validateMemoryGraph();
const presentationTopology = createTopology(4); const territoryStarted = performance.now();
const territories = createEvolutionTerritories(presentationTopology); const territoryConstructionMs = performance.now() - territoryStarted;
let meta = { ...defaultMeta(), echoBalance: '1000000' }; let spent = '0'; let guard = 0;
while (normalizeEvolutionLevels(meta).length < MEMORY_NODES.length && guard++ < 64) {
  const node = availableMemoryNodes(meta).find((entry) => entry.currentLevel === '0');
  if (!node) throw new Error(`legal breadth traversal stopped at ${normalizeEvolutionLevels(meta).length}`);
  const transaction = purchaseEvolutionLevel(meta, node.id, { expectedLevel: '0', expectedRevision: meta.revision, transactionKey: `audit-breadth-${guard}` });
  if (!transaction.ok) throw new Error(`purchase rejected: ${node.id} (${transaction.reason})`);
  spent = addProgressionIntegers(spent, transaction.spent); meta = transaction.meta;
}
const breadth = compileEvolution(meta); const root = MEMORY_NODES.find((node) => node.id === 'first-division');
let repeatMeta = { ...meta, echoBalance: `1${'0'.repeat(400)}` }; const repeat = [];
for (let index = 0; index < 9; index++) {
  const before = evolutionLevel(repeatMeta, root.id); const transaction = purchaseEvolutionLevel(repeatMeta, root.id,
    { expectedLevel: before, expectedRevision: repeatMeta.revision, transactionKey: `audit-depth-${index}` });
  if (!transaction.ok) throw new Error(`repeat rejected at ${before}: ${transaction.reason}`);
  repeat.push({ old: transaction.oldLevel, next: transaction.newLevel, cost: transaction.spent }); repeatMeta = transaction.meta;
}
const hugeLevel = `1${'0'.repeat(256)}`; const compileAt = performance.now();
const extreme = compileEvolution({ ...defaultMeta(), evolutionLevels: [{ id: root.id, level: hugeLevel }] });
const extremeCompileMs = performance.now() - compileAt; const sampledTargets = ['1', '2', '3', '10', '1000000', hugeLevel];
const costs = sampledTargets.map((level) => ({ level, cost: evolutionCostForTargetLevel(root, level) }));
const spark = MEMORY_NODES.find((node) => node.id === 'bioelectric-spark');
const luminous = compileEvolution({ ...defaultMeta(), evolutionLevels: [{ id: root.id, level: '1' }, { id: 'reliable-budding', level: '1' }, { id: spark.id, level: '1' }] });
const degreeCounts = Object.fromEntries([...new Set(topology.degree)].map((degree) => [degree, [...topology.degree].filter((value) => value === degree).length]));
const report = {
  versions: EVOLUTION_COMPILER_VERSIONS,
  topology: { frequency: 2, cells: topology.nodeCount, boundaries: topology.edgeCount, pentagons: degreeCounts[5] ?? 0, hexagons: degreeCounts[6] ?? 0,
    graphValid: graph.valid, roots: graph.roots, firstRing: getMemoryAdjacentIds(root.id).map((id) => MEMORY_NODES.find((node) => node.id === id)?.domain) },
  presentation: { levels: presentationTopology.levels, cells: presentationTopology.nodeCount, boundaries: presentationTopology.edgeCount,
    territories: territories.skillCount, coveredCells: territories.diagnostics.coveredCells,
    minTerritoryCells: territories.diagnostics.minSize, maxTerritoryCells: territories.diagnostics.maxSize,
    connected: territories.componentCount.every((count) => count === 1), expectedContacts: territories.diagnostics.expectedContacts,
    actualContacts: territories.diagnostics.actualContacts, tieCells: territories.diagnostics.tieCellCount,
    digest: territories.diagnostics.digest, constructionMs: Number(territoryConstructionMs.toFixed(3)) },
  authored: { cells: MEMORY_NODES.length, completeText: MEMORY_NODES.every((node) => node.nameEn && node.summary && node.description && node.effects.length),
    directEffects: MEMORY_NODES.every((node) => node.effects.every((effect) => ['trait', 'ecology', 'habitat', 'worldmaking', 'luminous', 'defense'].includes(effect.kind))) },
  breadth: { cells: normalizeEvolutionLevels(meta).length, spent, habitats: breadth.habitatCapabilities.length, luminousEnabled: breadth.luminous.enabled },
  repeat: { finalLevel: evolutionLevel(repeatMeta, root.id), purchases: repeat,
    costsMonotone: repeat.every((row, index) => index === 0 || compareProgressionIntegers(row.cost, repeat[index - 1].cost) > 0) },
  directExtreme: { digits: hugeLevel.length, compileMs: Number(extremeCompileMs.toFixed(3)), effectsFinite: Object.values(extreme.effects).every((value) => Number.isFinite(value) && value > 0 && value < 10),
    cache: evolutionCompileCacheDiagnostics() },
  luminous: { enabled: luminous.luminous.enabled, generationScale: luminous.luminous.generationScale, visualDevelopment: luminous.luminous.visualDevelopment },
  costs, costsMonotone: costs.every((row, index) => index === 0 || compareProgressionIntegers(row.cost, costs[index - 1].cost) > 0), elapsedMs: Number((performance.now() - started).toFixed(1)), valid: false,
};
report.valid = report.topology.cells === 42 && report.topology.boundaries === 120 && report.topology.pentagons === 12 && report.topology.hexagons === 30
  && report.topology.graphValid && report.topology.roots.join() === 'first-division' && report.topology.firstRing.every((domain) => domain === 'Foundation')
  && report.presentation.levels === 4 && report.presentation.cells === 2562 && report.presentation.boundaries === 7680
  && report.presentation.territories === 42 && report.presentation.coveredCells === 2562 && report.presentation.connected
  && report.presentation.expectedContacts === 120 && report.presentation.actualContacts === 120 && report.presentation.constructionMs < 100
  && report.authored.cells === 42 && report.authored.completeText && report.authored.directEffects && report.breadth.cells === 42
  && report.repeat.finalLevel === '10' && report.repeat.costsMonotone && report.directExtreme.effectsFinite && report.directExtreme.compileMs < 100
  && report.directExtreme.cache.bytes <= report.directExtreme.cache.byteLimit && report.costsMonotone && report.luminous.enabled && report.luminous.generationScale > 0;
mkdirSync(new URL('../../reports', import.meta.url).pathname, { recursive: true });
for (const name of ['evolution-level-audit.json', 'skill-audit.json']) writeFileSync(new URL(`../../reports/${name}`, import.meta.url), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2)); if (!report.valid) process.exitCode = 1;
