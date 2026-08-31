#!/usr/bin/env node
/** Production-backed fine-cell Evolution topology, exact economy, and compiler audit. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import {
  EVOLUTION_ARCHETYPES, EVOLUTION_COMPILER_VERSIONS, EVOLUTION_LAYOUT, EVOLUTION_ROOT_CELL,
  EVOLUTION_TOPOLOGY, availableEvolutionCells, buildEvolutionProjection, compileEvolution,
  createEvolutionCellLayout, evolutionCellState, evolutionCostForTargetLevel, evolutionLevel,
  getEvolutionAdjacentCells, normalizeEvolutionLevels, purchaseEvolutionLevel, validateEvolutionAuthority,
} from '../../src/game/skills/index.js';
import { addProgressionIntegers, compareProgressionIntegers } from '../../src/core/progression-integer.js';
import { defaultMeta } from '../../src/platform/storage.js';
import { evolutionCellForArchetype, evolutionPathToArchetype } from '../lib.mjs';

const started = performance.now(); const authority = validateEvolutionAuthority();
const layoutStarted = performance.now(); const repeatedLayout = createEvolutionCellLayout(EVOLUTION_TOPOLOGY);
const layoutConstructionMs = performance.now() - layoutStarted;
let meta = { ...defaultMeta(), echoBalance: '1000000000000000' }; let spent = '0'; let guard = 0;
const traversalStarted = performance.now();
while (normalizeEvolutionLevels(meta).length < EVOLUTION_TOPOLOGY.nodeCount && guard++ < EVOLUTION_TOPOLOGY.nodeCount + 1) {
  const projection = buildEvolutionProjection(meta); const cell = availableEvolutionCells(projection)
    .find((candidate) => projection.owned[candidate] === 0);
  if (!Number.isInteger(cell)) throw new Error(`legal fine-cell traversal stopped at ${normalizeEvolutionLevels(meta).length}`);
  const state = evolutionCellState(projection, cell); const transaction = purchaseEvolutionLevel(meta, cell, {
    expectedLocalLevel: state.localLevel, expectedAggregateRank: state.aggregateRank,
    expectedRevision: meta.revision, transactionKey: `audit-breadth-${guard}`,
  });
  if (!transaction.ok) throw new Error(`purchase rejected: cell ${cell} (${transaction.reason})`);
  spent = addProgressionIntegers(spent, transaction.spent); meta = transaction.meta;
}
const traversalMs = performance.now() - traversalStarted; const breadth = compileEvolution(meta);
let repeatMeta = { ...meta, echoBalance: `1${'0'.repeat(400)}` }; const repeat = [];
for (let index = 0; index < 9; index++) {
  const state = evolutionCellState(repeatMeta, EVOLUTION_ROOT_CELL); const transaction = purchaseEvolutionLevel(repeatMeta, EVOLUTION_ROOT_CELL, {
    expectedLocalLevel: state.localLevel, expectedAggregateRank: state.aggregateRank,
    expectedRevision: repeatMeta.revision, transactionKey: `audit-depth-${index}`,
  });
  if (!transaction.ok) throw new Error(`repeat rejected at ${state.localLevel}: ${transaction.reason}`);
  repeat.push({ oldLocal: transaction.oldLocalLevel, nextLocal: transaction.newLocalLevel,
    oldAggregate: transaction.oldAggregateRank, nextAggregate: transaction.newAggregateRank, cost: transaction.spent });
  repeatMeta = transaction.meta;
}
const hugeLevel = `1${'0'.repeat(256)}`; const compileAt = performance.now();
const extreme = compileEvolution({ evolutionLevels: [{ cell: EVOLUTION_ROOT_CELL, level: hugeLevel }] });
const extremeCompileMs = performance.now() - compileAt; const root = EVOLUTION_ARCHETYPES[EVOLUTION_LAYOUT.rootArchetype];
const sampledTargets = ['1', '2', '3', '10', '1000000', hugeLevel];
const costs = sampledTargets.map((level) => ({ level, cost: evolutionCostForTargetLevel(root, level) }));
const sparkCell = evolutionCellForArchetype('bioelectric-spark'); const buddingCell = evolutionCellForArchetype('reliable-budding');
const luminous = compileEvolution({ evolutionLevels: [{ cell: EVOLUTION_ROOT_CELL, level: '1' },
  { cell: buddingCell, level: '1' }, { cell: sparkCell, level: '1' }] });
const repeatedArchetype = EVOLUTION_LAYOUT.archetypeByCell.find((value) => value !== EVOLUTION_LAYOUT.rootArchetype);
const occurrences = Array.from(EVOLUTION_LAYOUT.archetypeByCell).flatMap((value, cell) => value === repeatedArchetype ? [cell] : []).slice(0, 2);
const concentrated = compileEvolution({ evolutionLevels: [{ cell: occurrences[0], level: '2' }] });
const distributed = compileEvolution({ evolutionLevels: occurrences.map((cell) => ({ cell, level: '1' })) });
const projectionAt = performance.now(); const projection = buildEvolutionProjection(meta); const projectionMs = performance.now() - projectionAt;
const diagnostics = EVOLUTION_LAYOUT.diagnostics;
const representativeRoutes = [
  'cohesive-repair', 'fertility-crown', 'living-waters', 'scarcity-sanctuary',
  'cryogenic-rest', 'marine-symbiosis', 'luminous-crown', 'living-biosphere',
].map((archetype) => {
  const path = evolutionPathToArchetype(archetype);
  return { archetype, target: path.at(-1), hops: path.length - 1,
    legal: path[0] === EVOLUTION_ROOT_CELL && path.every((cell, index) => index === 0
      || getEvolutionAdjacentCells(path[index - 1]).includes(cell)) };
});
const report = {
  versions: EVOLUTION_COMPILER_VERSIONS,
  topology: { level: EVOLUTION_TOPOLOGY.levels, cells: EVOLUTION_TOPOLOGY.nodeCount, boundaries: EVOLUTION_TOPOLOGY.edgeCount,
    pentagons: [...EVOLUTION_TOPOLOGY.degree].filter((degree) => degree === 5).length,
    hexagons: [...EVOLUTION_TOPOLOGY.degree].filter((degree) => degree === 6).length,
    authorityValid: authority.valid, rootCell: EVOLUTION_ROOT_CELL,
    firstRing: getEvolutionAdjacentCells(EVOLUTION_ROOT_CELL).map((cell) => EVOLUTION_ARCHETYPES[EVOLUTION_LAYOUT.archetypeByCell[cell]].domain) },
  layout: { version: EVOLUTION_LAYOUT.version, digest: diagnostics.digest,
    edgeDigest: diagnostics.edgeDigest, repeatDigest: repeatedLayout.diagnostics.digest,
    constructionMs: Number(layoutConstructionMs.toFixed(3)), construction: diagnostics.construction,
    archetypes: diagnostics.archetypes, rootCount: diagnostics.rootCount,
    minOccurrence: diagnostics.minNonRootCount, maxOccurrence: diagnostics.maxNonRootCount,
    archetypeComponents: Array.from(diagnostics.componentCount),
    domainComponents: Array.from(diagnostics.domainComponentCount),
    tierMedianRootDistance: diagnostics.tierMedianRootDistance,
    root: diagnostics.root, substrateFit: diagnostics.substrateFit },
  authored: { archetypes: EVOLUTION_ARCHETYPES.length,
    completeText: EVOLUTION_ARCHETYPES.every((archetype) => archetype.nameEn && archetype.summary && archetype.description && archetype.effects.length),
    directEffects: EVOLUTION_ARCHETYPES.every((archetype) => archetype.effects.every((effect) =>
      ['trait', 'ecology', 'habitat', 'worldmaking', 'luminous', 'defense'].includes(effect.kind))) },
  breadth: { cells: normalizeEvolutionLevels(meta).length, spent, traversalMs: Number(traversalMs.toFixed(1)),
    habitats: breadth.habitatCapabilities.length, luminousEnabled: breadth.luminous.enabled },
  repeat: { finalLocalLevel: evolutionLevel(repeatMeta, EVOLUTION_ROOT_CELL), purchases: repeat,
    costsMonotone: repeat.every((row, index) => index === 0 || compareProgressionIntegers(row.cost, repeat[index - 1].cost) > 0) },
  aggregateEquivalence: { archetype: EVOLUTION_ARCHETYPES[repeatedArchetype].id, cells: occurrences,
    identicalCompiler: JSON.stringify(distributed) === JSON.stringify(concentrated) },
  representativeRoutes,
  projection: { constructionMs: Number(projectionMs.toFixed(3)), ownedCells: projection.ownedCellCount,
    readyCells: projection.readyCells.length,
    bytes: projection.owned.byteLength + projection.reachable.byteLength + projection.affordable.byteLength + projection.recent.byteLength },
  directExtreme: { digits: hugeLevel.length, compileMs: Number(extremeCompileMs.toFixed(3)),
    effectsFinite: Object.values(extreme.effects).every((value) => Number.isFinite(value) && value > 0 && value < 10),
    cache: (await import('../../src/game/skills/index.js')).evolutionCompileCacheDiagnostics() },
  luminous: { enabled: luminous.luminous.enabled, generationScale: luminous.luminous.generationScale,
    visualDevelopment: luminous.luminous.visualDevelopment },
  costs, costsMonotone: costs.every((row, index) => index === 0 || compareProgressionIntegers(row.cost, costs[index - 1].cost) > 0),
  elapsedMs: Number((performance.now() - started).toFixed(1)), valid: false,
};
report.valid = report.topology.cells === 2562 && report.topology.boundaries === 7680
  && report.topology.pentagons === 12 && report.topology.hexagons === 2550 && report.topology.authorityValid
  && report.topology.firstRing.every((domain) => domain === 'Foundation')
  && report.layout.digest === report.layout.repeatDigest && report.layout.rootCount === 1
  && report.layout.minOccurrence === 62 && report.layout.maxOccurrence === 63
  && report.layout.archetypeComponents.every((count) => count === 1)
  && report.layout.domainComponents.every((count) => count === 1)
  && report.layout.root.land && report.layout.root.greenBiome
  && report.layout.root.greenNeighbors === report.layout.root.degree
  && report.layout.tierMedianRootDistance.slice(1, 6).every((distance, index, values) => index === 0 || distance > values[index - 1])
  && Object.values(report.layout.substrateFit.byDomain).every((fit) => fit.suitabilityMargin > .005)
  && report.layout.substrateFit.byDomain.Fertility.waterFraction < report.layout.substrateFit.global.waterFraction
  && report.layout.construction.visits <= report.layout.construction.budget && report.layout.constructionMs < 1500
  && report.authored.archetypes === 42 && report.authored.completeText && report.authored.directEffects
  && report.breadth.cells === 2562 && report.breadth.habitats === 6 && report.breadth.luminousEnabled
  && report.repeat.finalLocalLevel === '10' && report.repeat.costsMonotone && report.aggregateEquivalence.identicalCompiler
  && report.representativeRoutes.every((route) => route.legal && route.hops >= 0)
  && report.projection.ownedCells === 2562 && report.projection.bytes === 10248
  && report.directExtreme.effectsFinite && report.directExtreme.compileMs < 100
  && report.directExtreme.cache.bytes <= report.directExtreme.cache.byteLimit && report.costsMonotone
  && report.luminous.enabled && report.luminous.generationScale > 0;
mkdirSync(new URL('../../reports', import.meta.url).pathname, { recursive: true });
for (const name of ['evolution-level-audit.json', 'skill-audit.json']) {
  writeFileSync(new URL(`../../reports/${name}`, import.meta.url), JSON.stringify(report, null, 2));
}
console.log(JSON.stringify(report, null, 2)); if (!report.valid) process.exitCode = 1;
