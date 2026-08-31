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

test('fine edge truth table separates exact ownership from unowned reachability', () => {
  const states = Object.freeze({
    owned: { owned: 1, reachable: 1 },
    reachable: { owned: 0, reachable: 1 },
    locked: { owned: 0, reachable: 0 },
  });
  const layout = { topology: { edgeCount: 1, edgeA: Uint16Array.of(0), edgeB: Uint16Array.of(1) },
    edgeStructure: Uint8Array.of(EVOLUTION_REGION_EDGE.DOMAIN) };
  for (const [nameA, stateA] of Object.entries(states)) for (const [nameB, stateB] of Object.entries(states)) {
    const projection = { selectedCell: null, recent: Uint8Array.of(0, 0),
      owned: Uint8Array.of(stateA.owned, stateB.owned), reachable: Uint8Array.of(stateA.reachable, stateB.reachable),
      affordable: Uint8Array.of(0, 1) };
    const expected = stateA.owned !== stateB.owned ? EVOLUTION_CELL_EDGE.OWNERSHIP_PERIMETER
      : !stateA.owned && stateA.reachable !== stateB.reachable ? EVOLUTION_CELL_EDGE.REACHABLE_PERIMETER
        : EVOLUTION_CELL_EDGE.QUIET;
    const first = writeEvolutionCellEdges(layout, projection)[0];
    assert.equal(evolutionCellEdgeStatus(first), expected, `${nameA}/${nameB}`);
    assert.equal(evolutionRegionEdge(first), EVOLUTION_REGION_EDGE.DOMAIN, `${nameA}/${nameB} relation`);
    projection.affordable.reverse();
    assert.equal(writeEvolutionCellEdges(layout, projection)[0], first, `${nameA}/${nameB} affordability`);
  }
  assert.equal('OWNED' in EVOLUTION_CELL_EDGE, false);
  assert.equal('FRONTIER' in EVOLUTION_CELL_EDGE, false);
});

test('production fixtures have exact ownership and reachable graph cuts', () => {
  const fixtures = [
    { name: 'fresh', levels: [], expected: { ownedCells: 0, candidateCells: 1,
      relations: [0, 0, 0, 6, 7674], states: [7674, 6, 0] } },
    { name: 'root only', levels: [{ cell: EVOLUTION_ROOT_CELL, level: '1' }], expected: { ownedCells: 1, candidateCells: 7,
      relations: [0, 6, 6, 18, 7650], states: [7656, 18, 6] } },
    { name: 'root plus ring', levels: [{ cell: EVOLUTION_ROOT_CELL, level: '1' },
      ...EVOLUTION_LAYOUT.rootRing.map((cell) => ({ cell, level: '1' }))], expected: { ownedCells: 7, candidateCells: 19,
      relations: [12, 18, 12, 30, 7608], states: [7632, 30, 18] } },
  ];
  for (const fixture of fixtures) {
    const meta = { ...defaultMeta(), echoBalance: '1000000000', evolutionLevels: fixture.levels };
    const projection = buildEvolutionProjection(meta); const edges = writeEvolutionCellEdges(EVOLUTION_LAYOUT, projection);
    const report = classifyProductionEdges(projection, edges);
    assert.equal(projection.ownedCellCount, fixture.expected.ownedCells, fixture.name);
    assert.equal(projection.reachable.reduce((sum, value) => sum + value, 0), fixture.expected.candidateCells, fixture.name);
    assert.deepEqual(report.relations, fixture.expected.relations, `${fixture.name} endpoint relations`);
    assert.deepEqual(report.states, fixture.expected.states, `${fixture.name} edge states`);
    assert.equal(report.falseOwnership, 0, `${fixture.name} false ownership`);
    assert.equal(report.missedOwnership, 0, `${fixture.name} missed ownership`);
    for (let edge = 0; edge < EVOLUTION_TOPOLOGY.edgeCount; edge++) {
      assert.equal(evolutionRegionEdge(edges[edge]), EVOLUTION_LAYOUT.edgeStructure[edge], `${fixture.name} relation ${edge}`);
    }
  }
  assert.ok(EVOLUTION_LAYOUT.edgeStructure.includes(EVOLUTION_REGION_EDGE.ARCHETYPE));
  assert.ok(EVOLUTION_LAYOUT.edgeStructure.includes(EVOLUTION_REGION_EDGE.DOMAIN));
  assert.throws(() => writeEvolutionCellEdges(EVOLUTION_LAYOUT, buildEvolutionProjection(defaultMeta()), new Uint8Array(1)),
    /invalid Evolution edge output/);
});

test('selected and recent overrides are incident-only and restore the identical steady cut', () => {
  const levels = [{ cell: EVOLUTION_ROOT_CELL, level: '1' },
    ...EVOLUTION_LAYOUT.rootRing.map((cell) => ({ cell, level: '1' }))];
  const meta = { ...defaultMeta(), echoBalance: '1000000000', evolutionLevels: levels };
  const target = EVOLUTION_LAYOUT.rootRing[0]; const steady = writeEvolutionCellEdges(EVOLUTION_LAYOUT, buildEvolutionProjection(meta));
  const recent = writeEvolutionCellEdges(EVOLUTION_LAYOUT, buildEvolutionProjection(meta, null, [target]));
  const selected = writeEvolutionCellEdges(EVOLUTION_LAYOUT, buildEvolutionProjection(meta, target, [target]));
  assertIncidentOverride(steady, recent, target, EVOLUTION_CELL_EDGE.RECENT);
  assertIncidentOverride(steady, selected, target, EVOLUTION_CELL_EDGE.SELECTED);
  assert.deepEqual(writeEvolutionCellEdges(EVOLUTION_LAYOUT, buildEvolutionProjection(meta)), steady);
});

function classifyProductionEdges(projection, edges) {
  const relations = [0, 0, 0, 0, 0]; const states = [0, 0, 0]; let falseOwnership = 0; let missedOwnership = 0;
  for (let edge = 0; edge < EVOLUTION_TOPOLOGY.edgeCount; edge++) {
    const a = EVOLUTION_TOPOLOGY.edgeA[edge]; const b = EVOLUTION_TOPOLOGY.edgeB[edge];
    const ownedA = projection.owned[a] === 1; const ownedB = projection.owned[b] === 1;
    const reachableA = !ownedA && projection.reachable[a] === 1;
    const reachableB = !ownedB && projection.reachable[b] === 1;
    const relation = ownedA && ownedB ? 0 : ownedA !== ownedB ? 1 : reachableA && reachableB ? 2 : reachableA !== reachableB ? 3 : 4;
    relations[relation]++;
    const status = evolutionCellEdgeStatus(edges[edge]);
    if (status === EVOLUTION_CELL_EDGE.QUIET) states[0]++;
    else if (status === EVOLUTION_CELL_EDGE.REACHABLE_PERIMETER) states[1]++;
    else if (status === EVOLUTION_CELL_EDGE.OWNERSHIP_PERIMETER) states[2]++;
    if (status === EVOLUTION_CELL_EDGE.OWNERSHIP_PERIMETER && ownedA === ownedB) falseOwnership++;
    if (status !== EVOLUTION_CELL_EDGE.OWNERSHIP_PERIMETER && ownedA !== ownedB) missedOwnership++;
  }
  return { relations, states, falseOwnership, missedOwnership };
}

function assertIncidentOverride(steady, override, cell, state) {
  const changed = [];
  for (let edge = 0; edge < EVOLUTION_TOPOLOGY.edgeCount; edge++) {
    const incident = EVOLUTION_TOPOLOGY.edgeA[edge] === cell || EVOLUTION_TOPOLOGY.edgeB[edge] === cell;
    if (incident) assert.equal(evolutionCellEdgeStatus(override[edge]), state);
    else assert.equal(override[edge], steady[edge]);
    if (override[edge] !== steady[edge]) changed.push(edge);
  }
  assert.equal(changed.length, EVOLUTION_TOPOLOGY.degree[cell]);
}

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
