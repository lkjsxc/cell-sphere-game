import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import {
  EVOLUTION_CELL_EDGE, EVOLUTION_LAYOUT, EVOLUTION_ROOT_CELL, EVOLUTION_TOPOLOGY,
  EVOLUTION_SUBSTRATE_SEED, buildEvolutionProjection, createEvolutionCellLayout, createEvolutionFields,
  validateEvolutionCellLayout,
  writeEvolutionCellEdges,
} from '../../../src/game/skills/index.js';
import { defaultMeta } from '../../../src/platform/storage.js';

test('the immutable weave satisfies every product-shape gate and repeats deterministically', () => {
  const diagnostics = validateEvolutionCellLayout(EVOLUTION_LAYOUT); const started = performance.now();
  const repeated = createEvolutionCellLayout(EVOLUTION_TOPOLOGY); const elapsed = performance.now() - started;
  assert.equal(diagnostics.rootCount, 1); assert.deepEqual([diagnostics.cells, diagnostics.edges], [2562, 7680]);
  assert.ok(diagnostics.minNonRootCount >= Math.ceil(2562 * .01)); assert.ok(diagnostics.maxNonRootCount <= Math.floor(2562 * .04));
  assert.ok(diagnostics.largestComponent <= 8); assert.ok(diagnostics.neighborhoodDiversity >= .95);
  assert.deepEqual(repeated.archetypeByCell, EVOLUTION_LAYOUT.archetypeByCell);
  assert.equal(repeated.diagnostics.digest, diagnostics.digest);
  assert.ok(elapsed < 100, `layout construction took ${elapsed} ms`);
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
  const source = readFileSync(new URL('../../../src/game/skills/scene.js', import.meta.url), 'utf8');
  assert.match(source, /return createFields\(createRng\(EVOLUTION_SUBSTRATE_SEED\), topology\);/);
  assert.doesNotMatch(source, /sphericalField|smoothField|lobes:|landMask:\s*new|biomeId:\s*new/);
});

test('fine edges classify quiet, owned, frontier, recent, and selected from exact cells', () => {
  const fresh = buildEvolutionProjection({ ...defaultMeta(), echoBalance: '1000' }, EVOLUTION_ROOT_CELL);
  const edges = writeEvolutionCellEdges(EVOLUTION_LAYOUT, fresh);
  const incident = new Set();
  for (let edge = 0; edge < EVOLUTION_TOPOLOGY.edgeCount; edge++) {
    if (EVOLUTION_TOPOLOGY.edgeA[edge] === EVOLUTION_ROOT_CELL || EVOLUTION_TOPOLOGY.edgeB[edge] === EVOLUTION_ROOT_CELL) incident.add(edge);
  }
  assert.equal(edges.filter((value) => value === EVOLUTION_CELL_EDGE.SELECTED).length, incident.size);
  for (const edge of incident) assert.equal(edges[edge], EVOLUTION_CELL_EDGE.SELECTED);
  const ownedCell = EVOLUTION_LAYOUT.rootRing[0];
  const ownedMeta = { ...defaultMeta(), echoBalance: '1000',
    evolutionLevels: [{ cell: EVOLUTION_ROOT_CELL, level: '1' }, { cell: ownedCell, level: '1' }] };
  const projection = buildEvolutionProjection(ownedMeta);
  const classified = writeEvolutionCellEdges(EVOLUTION_LAYOUT, projection);
  assert.ok(classified.includes(EVOLUTION_CELL_EDGE.QUIET)); assert.ok(classified.includes(EVOLUTION_CELL_EDGE.OWNED));
  assert.ok(classified.includes(EVOLUTION_CELL_EDGE.FRONTIER));
  const recent = writeEvolutionCellEdges(EVOLUTION_LAYOUT, buildEvolutionProjection(ownedMeta, null, [ownedCell]));
  assert.ok(recent.includes(EVOLUTION_CELL_EDGE.RECENT));
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
