import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import {
  EVOLUTION_CELL_EDGE, EVOLUTION_LAYOUT, EVOLUTION_REGION_EDGE, EVOLUTION_ROOT_CELL, EVOLUTION_TOPOLOGY,
  EVOLUTION_SUBSTRATE_SEED, buildEvolutionProjection, createEvolutionCellLayout, createEvolutionFields,
  evolutionCellEdgeStatus, evolutionRegionEdge, validateEvolutionCellLayout, writeEvolutionCellEdges,
} from '../../../src/game/skills/index.js';
import { defaultMeta } from '../../../src/platform/storage.js';

test('the immutable connected layout satisfies every product-shape gate and repeats deterministically', () => {
  const diagnostics = validateEvolutionCellLayout(EVOLUTION_LAYOUT); const started = performance.now();
  const repeated = createEvolutionCellLayout(EVOLUTION_TOPOLOGY); const elapsed = performance.now() - started;
  assert.equal(diagnostics.rootCount, 1); assert.deepEqual([diagnostics.cells, diagnostics.edges], [2562, 7680]);
  assert.deepEqual([diagnostics.minNonRootCount, diagnostics.maxNonRootCount], [62, 63]);
  assert.ok([...diagnostics.componentCount].every((count) => count === 1));
  assert.ok([...diagnostics.domainComponentCount].every((count) => count === 1));
  assert.deepEqual(diagnostics.tierMedianRootDistance.slice(1, 6), [8, 20, 24, 29, 31.5]);
  assert.deepEqual(diagnostics.root, {
    cell: 2265, biome: 5, waterClass: 0, land: true, greenBiome: true,
    greenNeighbors: 6, degree: 6, growthSuitability: 1.059999942779541,
    baseNutrient: 0.7472620010375977, baseMoisture: 0.6074897646903992,
    baseTemp: 0.4741906225681305,
  });
  assert.equal(diagnostics.digest, '09da2261'); assert.equal(diagnostics.edgeDigest, 'c03988ac');
  assert.ok(diagnostics.construction.visits <= diagnostics.construction.budget);
  assert.deepEqual(repeated.archetypeByCell, EVOLUTION_LAYOUT.archetypeByCell);
  assert.deepEqual(repeated.domainByCell, EVOLUTION_LAYOUT.domainByCell);
  assert.deepEqual(repeated.edgeStructure, EVOLUTION_LAYOUT.edgeStructure);
  assert.equal(repeated.diagnostics.digest, diagnostics.digest);
  assert.ok(elapsed < 1500, `layout construction took ${elapsed} ms`);

  const { global, byDomain, nonMarineWaterFraction } = diagnostics.substrateFit;
  for (const fit of Object.values(byDomain)) assert.ok(fit.suitabilityMargin > .005);
  assert.ok(byDomain.Marine.waterFraction > nonMarineWaterFraction);
  assert.ok(byDomain.Freshwater.freshwaterInfluence > global.freshwaterInfluence);
  assert.ok(byDomain.Cryogenic.temperature < global.temperature);
  assert.ok(byDomain.Scarcity.moisture < global.moisture
    || byDomain.Scarcity.growthSuitability < global.growthSuitability);
  assert.ok(byDomain.Fertility.greenFraction > global.greenFraction);
  assert.ok(byDomain.Fertility.growthSuitability > global.growthSuitability);
  assert.ok(byDomain.Fertility.waterFraction < global.waterFraction);
});

test('the fixed Evolution substrate uses coherent deterministic World geography', () => {
  assert.equal(EVOLUTION_SUBSTRATE_SEED, 0xe701c311);
  const fields = createEvolutionFields(EVOLUTION_TOPOLOGY); const repeated = createEvolutionFields(EVOLUTION_TOPOLOGY);
  for (const key of ['landMask', 'biomeId', 'altitude', 'baseMoisture', 'baseTemp', 'baseNutrient',
    'forestDensity', 'lakeId', 'lakeDepth', 'lakeShore', 'ridgeStrength']) assert.deepEqual(fields[key], repeated[key], key);
  const landCells = fields.landMask.reduce((sum, value) => sum + value, 0); const waterCells = EVOLUTION_TOPOLOGY.nodeCount - landCells;
  const landFraction = landCells / EVOLUTION_TOPOLOGY.nodeCount;
  const largestLand = largestComponent(fields.landMask, 1); const largestWater = largestComponent(fields.landMask, 0);
  let sameLand = 0; let sameBiome = 0; let coastEdges = 0; let lakeEdges = 0;
  for (let edge = 0; edge < EVOLUTION_TOPOLOGY.edgeCount; edge++) {
    const a = EVOLUTION_TOPOLOGY.edgeA[edge]; const b = EVOLUTION_TOPOLOGY.edgeB[edge];
    if (fields.landMask[a] === fields.landMask[b]) sameLand++; else coastEdges++;
    if (fields.biomeId[a] === fields.biomeId[b]) sameBiome++;
    if (fields.lakeId[a] !== fields.lakeId[b] && (fields.lakeId[a] >= 0 || fields.lakeId[b] >= 0)) lakeEdges++;
  }
  const biomes = new Set(fields.biomeId); const landBiomes = new Set(); const oceanBiomes = new Set();
  for (let cell = 0; cell < EVOLUTION_TOPOLOGY.nodeCount; cell++) {
    (fields.landMask[cell] ? landBiomes : oceanBiomes).add(fields.biomeId[cell]);
  }
  assert.ok(landFraction >= .38 && landFraction <= .58, `land fraction ${landFraction}`);
  assert.ok(largestLand >= landCells * .70); assert.ok(largestWater >= waterCells * .70);
  assert.ok(sameLand / EVOLUTION_TOPOLOGY.edgeCount >= .90);
  assert.ok(biomes.size >= 6 && landBiomes.size >= 4 && oceanBiomes.size >= 1);
  assert.ok(sameBiome / EVOLUTION_TOPOLOGY.edgeCount >= .65);
  assert.ok(new Set([...fields.lakeId].filter((value) => value >= 0)).size >= 1);
  assert.ok(coastEdges > 0 && lakeEdges > 0); assert.ok(Object.isFrozen(fields));
});

test('Evolution has no duplicate placeholder geography owner', () => {
  const substrate = readFileSync(new URL('../../../src/game/skills/substrate.js', import.meta.url), 'utf8');
  const scene = readFileSync(new URL('../../../src/game/skills/scene.js', import.meta.url), 'utf8');
  assert.match(substrate, /createFields\(createRng\(EVOLUTION_SUBSTRATE_SEED\), EVOLUTION_TOPOLOGY\)/);
  assert.match(scene, /from '\.\/substrate\.js'/);
  assert.doesNotMatch(`${substrate}\n${scene}`, /sphericalField|smoothField|lobes:|landMask:\s*new|biomeId:\s*new/);
});

test('fine edges classify quiet, owned, frontier, recent, and selected from exact cells', () => {
  const fresh = buildEvolutionProjection({ ...defaultMeta(), echoBalance: '1000' }, EVOLUTION_ROOT_CELL);
  const edges = writeEvolutionCellEdges(EVOLUTION_LAYOUT, fresh);
  const incident = new Set();
  for (let edge = 0; edge < EVOLUTION_TOPOLOGY.edgeCount; edge++) {
    if (EVOLUTION_TOPOLOGY.edgeA[edge] === EVOLUTION_ROOT_CELL || EVOLUTION_TOPOLOGY.edgeB[edge] === EVOLUTION_ROOT_CELL) incident.add(edge);
  }
  assert.equal(edges.filter((value) => evolutionCellEdgeStatus(value) === EVOLUTION_CELL_EDGE.SELECTED).length, incident.size);
  for (const edge of incident) assert.equal(evolutionCellEdgeStatus(edges[edge]), EVOLUTION_CELL_EDGE.SELECTED);
  for (let edge = 0; edge < EVOLUTION_TOPOLOGY.edgeCount; edge++) {
    assert.equal(evolutionRegionEdge(edges[edge]), EVOLUTION_LAYOUT.edgeStructure[edge]);
  }
  assert.ok(EVOLUTION_LAYOUT.edgeStructure.includes(EVOLUTION_REGION_EDGE.ARCHETYPE));
  assert.ok(EVOLUTION_LAYOUT.edgeStructure.includes(EVOLUTION_REGION_EDGE.DOMAIN));
  const ownedCell = EVOLUTION_LAYOUT.rootRing[0];
  const ownedMeta = { ...defaultMeta(), echoBalance: '1000',
    evolutionLevels: [{ cell: EVOLUTION_ROOT_CELL, level: '1' }, { cell: ownedCell, level: '1' }] };
  const projection = buildEvolutionProjection(ownedMeta);
  const classified = writeEvolutionCellEdges(EVOLUTION_LAYOUT, projection);
  const states = Array.from(classified, evolutionCellEdgeStatus);
  assert.ok(states.includes(EVOLUTION_CELL_EDGE.QUIET)); assert.ok(states.includes(EVOLUTION_CELL_EDGE.OWNED));
  assert.ok(states.includes(EVOLUTION_CELL_EDGE.FRONTIER));
  const recent = writeEvolutionCellEdges(EVOLUTION_LAYOUT, buildEvolutionProjection(ownedMeta, null, [ownedCell]));
  assert.ok(Array.from(recent, evolutionCellEdgeStatus).includes(EVOLUTION_CELL_EDGE.RECENT));
  assert.throws(() => writeEvolutionCellEdges(EVOLUTION_LAYOUT, projection, new Uint8Array(1)), /invalid Evolution edge output/);
});

test('selection changes only the selected cell and its incident edge class', () => {
  const base = buildEvolutionProjection({ ...defaultMeta(), echoBalance: '1000' });
  const selected = buildEvolutionProjection({ ...defaultMeta(), echoBalance: '1000' }, EVOLUTION_ROOT_CELL);
  const baseEdges = writeEvolutionCellEdges(EVOLUTION_LAYOUT, base); const selectedEdges = writeEvolutionCellEdges(EVOLUTION_LAYOUT, selected);
  const changed = [];
  for (let edge = 0; edge < EVOLUTION_TOPOLOGY.edgeCount; edge++) if (baseEdges[edge] !== selectedEdges[edge]) changed.push(edge);
  assert.equal(changed.length, EVOLUTION_TOPOLOGY.degree[EVOLUTION_ROOT_CELL]);
  assert.ok(changed.every((edge) => EVOLUTION_TOPOLOGY.edgeA[edge] === EVOLUTION_ROOT_CELL
    || EVOLUTION_TOPOLOGY.edgeB[edge] === EVOLUTION_ROOT_CELL));
});

function largestComponent(classes, target) {
  const seen = new Uint8Array(EVOLUTION_TOPOLOGY.nodeCount); let largest = 0;
  for (let root = 0; root < EVOLUTION_TOPOLOGY.nodeCount; root++) {
    if (seen[root] || classes[root] !== target) continue; const queue = [root]; seen[root] = 1;
    for (let head = 0; head < queue.length; head++) {
      const cell = queue[head];
      for (let at = EVOLUTION_TOPOLOGY.nodeStart[cell]; at < EVOLUTION_TOPOLOGY.nodeStart[cell + 1]; at++) {
        const next = EVOLUTION_TOPOLOGY.nodeNeighbors[at];
        if (!seen[next] && classes[next] === target) { seen[next] = 1; queue.push(next); }
      }
    }
    largest = Math.max(largest, queue.length);
  }
  return largest;
}
