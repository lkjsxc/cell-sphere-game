/** Whole-cell lake world contract: deterministic, connected, and ecological. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../../src/core/prng.js';
import { fnv1aBytes, hashF32, hexU32 } from '../../src/core/hash.js';
import { createTopology } from '../../src/world/icosphere.js';
import { BIOME, BIOME_EFFECTS, FEATURE, LANDMARK, WATER, createFields } from '../../src/world/fields.js';

const topo = createTopology(4); const fieldsFor = (seed) => createFields(createRng(seed), topo);
const floats = ['altitude', 'baseElevation', 'oceanDepth', 'coastDistance', 'lakeDepth',
  'freshwaterInfluence', 'baseMoisture', 'baseTemp', 'baseNutrient', 'forestDensity',
  'ridgeStrength', 'hazardSusceptibility', 'toxVuln', 'eventVuln', 'growthSuitability',
  'maintenanceMultiplier', 'uptakeMultiplier', 'resourceRenewal', 'routeCost'];
const integers = ['landMask', 'waterClass', 'lakeId', 'lakeShore', 'biomeId', 'featureFlags', 'regionId'];

function worldHash(fields) {
  let hash = fnv1aBytes(Uint8Array.of(fields.archetype, Math.round(fields.seaLevel * 255)));
  for (const key of floats) hash = hashF32(hash, fields[key], 100000);
  for (const key of integers) { const value = fields[key];
    hash = fnv1aBytes(new Uint8Array(value.buffer, value.byteOffset, value.byteLength), hash); }
  hash = fnv1aBytes(new TextEncoder().encode(JSON.stringify(fields.lakes)), hash);
  return hexU32(hash);
}
function neighbors(cell) { return topo.nodeNeighbors.subarray(topo.nodeStart[cell], topo.nodeStart[cell + 1]); }
function connected(cells) {
  const allowed = new Set(cells); const seen = new Set([cells[0]]); const queue = [cells[0]];
  for (let head = 0; head < queue.length; head++) for (const next of neighbors(queue[head])) {
    if (allowed.has(next) && !seen.has(next)) { seen.add(next); queue.push(next); }
  }
  return seen.size === cells.length;
}
function componentSizes(predicate) {
  const seen = new Uint8Array(topo.nodeCount); const sizes = [];
  for (let root = 0; root < topo.nodeCount; root++) {
    if (seen[root] || !predicate(root)) continue; const queue = [root]; seen[root] = 1;
    for (let head = 0; head < queue.length; head++) for (const next of neighbors(queue[head])) {
      if (!seen[next] && predicate(next)) { seen[next] = 1; queue.push(next); }
    }
    sizes.push(queue.length);
  }
  return sizes.sort((a, b) => b - a);
}

test('world hash, lake records, and typed fields are deterministic', () => {
  const a = fieldsFor(20260731); const b = fieldsFor(20260731);
  assert.equal(worldHash(a), worldHash(b)); assert.equal(worldHash(a), '54d962c6');
  for (const key of [...floats, ...integers]) assert.deepEqual(a[key], b[key], key);
  assert.deepEqual(a.lakes, b.lakes); assert.deepEqual(a.landmarks, b.landmarks); assert.deepEqual(a.sources, b.sources);
  assert.notEqual(worldHash(a), worldHash(fieldsFor(20260730)));
});

test('drainage analysis and obsolete waterway systems stay private', () => {
  const fields = fieldsFor(42);
  for (const key of ['rainfall', 'filledElevation', 'drainTo', 'flowAccumulation',
    'riverOrder', 'riverStrength', 'riverClass', 'riverSystem', 'riverUpstream', 'majorRivers']) {
    assert.equal(key in fields, false, key);
  }
  assert.equal('RIVER' in WATER, false); assert.equal('GREAT_RIVER' in LANDMARK, false);
  for (const key of ['RIVER', 'TRIBUTARY', 'RIVER_MOUTH', 'RIVER_HEADWATER',
    'RIVER_CONFLUENCE', 'RIVER_TRUNK', 'RIVER_DELTA']) assert.equal(key in FEATURE, false, key);
});

test('normal worlds retain coherent land and typed lake ecology', () => {
  for (const seed of [1, 7, 42, 999, 31337, 20260731]) {
    const fields = fieldsFor(seed); const land = fields.landMask.reduce((sum, value) => sum + value, 0);
    assert.ok(land / topo.nodeCount >= .38 && land / topo.nodeCount <= .58, `seed ${seed}`);
    assert.ok(componentSizes((cell) => fields.landMask[cell])[0] > land * .7, `fragmented seed ${seed}`);
    assert.ok(fields.landMask instanceof Uint8Array && fields.waterClass instanceof Uint8Array);
    assert.ok(fields.lakeId instanceof Int16Array && fields.lakeDepth instanceof Float32Array);
    assert.ok(fields.lakeShore instanceof Uint8Array && fields.freshwaterInfluence instanceof Float32Array);
    assert.ok(fields.featureFlags instanceof Uint32Array && Object.isFrozen(fields.lakes));
  }
});

test('lakes are connected separated whole-cell components with complete records', () => {
  const types = new Set(); const salinities = new Set();
  for (const seed of [1, 2, 7, 42, 99, 999, 31337, 20260731]) {
    const fields = fieldsFor(seed); assert.ok(fields.lakes.length >= 5 && fields.lakes.length <= 8, `seed ${seed}`);
    assert.deepEqual(fields.lakes.map((lake) => lake.id), fields.lakes.map((_, id) => id));
    for (const lake of fields.lakes) {
      types.add(lake.type); salinities.add(lake.salinity);
      assert.ok(Object.isFrozen(lake) && Object.isFrozen(lake.cells)
        && Object.isFrozen(lake.shoreCells) && Object.isFrozen(lake.wetlandCells));
      assert.equal(lake.area, lake.cells.length); assert.ok(lake.area >= 3 && lake.area <= 18);
      assert.ok(connected(lake.cells), `seed ${seed} lake ${lake.id} disconnected`);
      assert.ok(['small', 'medium', 'large'].includes(lake.areaClass));
      assert.ok(['shallow', 'middle', 'deep'].includes(lake.depthClass));
      assert.ok(['open', 'seasonal', 'closed'].includes(lake.outletStatus));
      assert.ok(['fresh', 'brackish', 'saline'].includes(lake.salinity));
      assert.ok(Number.isFinite(lake.surfaceElevation) && lake.catchment >= lake.area);
      assert.equal('outflowCell' in lake, false);
      assert.ok(lake.minDepth > 0 && lake.minDepth <= lake.meanDepth && lake.meanDepth <= lake.maxDepth);
      for (const cell of lake.cells) {
        assert.equal(fields.lakeId[cell], lake.id); assert.equal(fields.landMask[cell], 1);
        assert.equal(fields.waterClass[cell], WATER.LAKE); assert.equal(fields.biomeId[cell], BIOME.LAKE);
        assert.ok(fields.featureFlags[cell] & FEATURE.LAKE); assert.ok(fields.lakeDepth[cell] > 0);
        assert.ok(fields.freshwaterInfluence[cell] >= .49);
        for (const next of neighbors(cell)) if (fields.lakeId[next] >= 0) assert.equal(fields.lakeId[next], lake.id);
      }
    }
  }
  assert.ok(types.size >= 3, `types: ${[...types]}`); assert.ok(salinities.size >= 2, `salinities: ${[...salinities]}`);
});

test('shore and wetland cells are full-cell ecological neighbors', () => {
  for (const seed of [7, 42, 999, 20260731]) { const fields = fieldsFor(seed); let influenced = 0;
    for (const value of fields.freshwaterInfluence) influenced += value > 0;
    const lakeArea = fields.lakes.reduce((sum, lake) => sum + lake.area, 0); assert.ok(influenced > lakeArea * 2);
    for (const lake of fields.lakes) {
      assert.ok(lake.shoreCells.length > 0 && lake.wetlandCells.length > 0);
      const shore = new Set(lake.shoreCells);
      for (const cell of lake.shoreCells) {
        assert.equal(fields.landMask[cell], 1); assert.equal(fields.lakeId[cell], -1);
        assert.equal(fields.lakeShore[cell], 1); assert.ok(fields.featureFlags[cell] & FEATURE.LAKE_SHORE);
        assert.ok([...neighbors(cell)].some((next) => fields.lakeId[next] === lake.id));
        assert.ok(fields.freshwaterInfluence[cell] > 0);
      }
      for (const cell of lake.wetlandCells) {
        assert.ok(shore.has(cell)); assert.equal(fields.biomeId[cell], BIOME.WETLAND);
        assert.ok(fields.featureFlags[cell] & FEATURE.WETLAND);
      }
    }
  }
});

test('biome factors are bounded and lakes remain ecology participants', () => {
  const fields = fieldsFor(42); const validBiomes = new Set(Object.values(BIOME));
  for (const key of floats) for (const value of fields[key]) {
    assert.ok(Number.isFinite(value) && value >= 0, `${key}: ${value}`);
    const factor = ['growthSuitability', 'maintenanceMultiplier', 'uptakeMultiplier', 'resourceRenewal', 'routeCost'].includes(key);
    assert.ok(value <= (factor ? 3.001 : 1.001), `${key}: ${value}`);
  }
  for (let cell = 0; cell < topo.nodeCount; cell++) {
    assert.ok(validBiomes.has(fields.biomeId[cell]));
    if (!fields.landMask[cell]) assert.ok([BIOME.DEEP_OCEAN, BIOME.SHALLOW_OCEAN].includes(fields.biomeId[cell]));
  }
  const effect = BIOME_EFFECTS[BIOME.LAKE];
  assert.ok(effect.growth > 0 && effect.renewal > 0 && effect.routeCost < 2);
});

test('forests, sources, and landmarks agree with lake geography', () => {
  const fields = fieldsFor(20260731); let forest = 0;
  for (let cell = 0; cell < topo.nodeCount; cell++) if (fields.forestDensity[cell] > .34) {
    forest++; assert.equal(fields.landMask[cell], 1); assert.equal(fields.lakeId[cell], -1);
    assert.ok(fields.featureFlags[cell] & FEATURE.FOREST);
  }
  assert.ok(forest > 50); assert.ok(Object.isFrozen(fields.landmarks) && fields.landmarks.length >= 5);
  assert.ok(fields.landmarks.some((mark) => mark.kind === LANDMARK.GREAT_LAKE));
  assert.ok(fields.landmarks.some((mark) => mark.kind === LANDMARK.LAKE_SHORE));
  assert.equal(new Set(fields.sources).size, 6);
  for (const cell of fields.sources) { assert.equal(fields.landMask[cell], 1); assert.equal(fields.lakeId[cell], -1); }
});

test('generation performance remains comfortably off the hot path', () => {
  const start = performance.now(); for (let seed = 100; seed < 108; seed++) fieldsFor(seed);
  assert.ok(performance.now() - start < 1800);
});
