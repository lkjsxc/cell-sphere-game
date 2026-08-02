/** Graph-native world contract: deterministic, coherent, and hydrologically real. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../../src/core/prng.js';
import { fnv1aBytes, hashF32, hexU32 } from '../../src/core/hash.js';
import { createTopology } from '../../src/world/icosphere.js';
import { BIOME, FEATURE, WATER, createFields } from '../../src/world/fields.js';

const topo = createTopology(4);
const fieldsFor = (seed) => createFields(createRng(seed), topo);
const floats = ['altitude', 'baseElevation', 'filledElevation', 'oceanDepth',
  'coastDistance', 'flowAccumulation', 'riverStrength', 'rainfall',
  'baseMoisture', 'baseTemp', 'baseNutrient', 'forestDensity',
  'ridgeStrength', 'hazardSusceptibility', 'toxVuln', 'eventVuln'];
const integers = ['landMask', 'waterClass', 'drainTo', 'riverOrder', 'lakeId',
  'biomeId', 'featureFlags', 'regionId'];

function worldHash(fields) {
  let hash = fnv1aBytes(Uint8Array.of(fields.archetype, Math.round(fields.seaLevel * 255)));
  for (const key of floats) hash = hashF32(hash, fields[key], 100000);
  for (const key of integers) {
    const value = fields[key];
    hash = fnv1aBytes(new Uint8Array(value.buffer, value.byteOffset, value.byteLength), hash);
  }
  return hexU32(hash);
}

function componentSizes(predicate) {
  const seen = new Uint8Array(topo.nodeCount); const sizes = [];
  const queue = new Int32Array(topo.nodeCount);
  for (let root = 0; root < topo.nodeCount; root++) {
    if (seen[root] || !predicate(root)) continue;
    let head = 0; let tail = 1; queue[0] = root; seen[root] = 1;
    while (head < tail) {
      const cell = queue[head++];
      for (let p = topo.nodeStart[cell]; p < topo.nodeStart[cell + 1]; p++) {
        const next = topo.nodeNeighbors[p];
        if (!seen[next] && predicate(next)) { seen[next] = 1; queue[tail++] = next; }
      }
    }
    sizes.push(tail);
  }
  return sizes.sort((a, b) => b - a);
}

function adjacent(a, b) {
  for (let p = topo.nodeStart[a]; p < topo.nodeStart[a + 1]; p++) {
    if (topo.nodeNeighbors[p] === b) return true;
  }
  return false;
}

test('world hash and every explicit array are deterministic', () => {
  const a = fieldsFor(20260731); const b = fieldsFor(20260731);
  assert.equal(worldHash(a), worldHash(b));
  assert.equal(worldHash(a), 'eccc4bba');
  for (const key of [...floats, ...integers]) assert.deepEqual(a[key], b[key], key);
  assert.deepEqual(a.landmarks, b.landmarks);
  assert.deepEqual(a.sources, b.sources);
  assert.notEqual(worldHash(a), worldHash(fieldsFor(20260730)));
});

test('normal worlds have bounded coherent land and typed classes', () => {
  for (const seed of [1, 7, 42, 999, 31337, 20260731]) {
    const f = fieldsFor(seed);
    const land = f.landMask.reduce((sum, value) => sum + value, 0);
    assert.ok(land / topo.nodeCount >= 0.38 && land / topo.nodeCount <= 0.58, `seed ${seed}`);
    assert.ok(componentSizes((i) => f.landMask[i])[0] > land * 0.7, `fragmented seed ${seed}`);
    assert.ok(f.landMask instanceof Uint8Array && f.waterClass instanceof Uint8Array);
    assert.ok(f.drainTo instanceof Int32Array && f.lakeId instanceof Int16Array);
    assert.ok(f.riverOrder instanceof Uint8Array && f.featureFlags instanceof Uint32Array);
  }
});

test('fields and biome assignments are bounded and ecologically valid', () => {
  const f = fieldsFor(42); const validBiomes = new Set(Object.values(BIOME));
  for (const key of floats) for (const value of f[key]) {
    assert.ok(Number.isFinite(value) && value >= 0, `${key}: ${value}`);
    if (key !== 'flowAccumulation') assert.ok(value <= 1.001, `${key}: ${value}`);
  }
  for (let i = 0; i < topo.nodeCount; i++) {
    assert.ok(validBiomes.has(f.biomeId[i]), `biome ${f.biomeId[i]}`);
    if (!f.landMask[i]) {
      assert.ok(f.waterClass[i] === WATER.DEEP_OCEAN || f.waterClass[i] === WATER.SHALLOW_OCEAN);
      assert.ok(f.biomeId[i] === BIOME.DEEP_OCEAN || f.biomeId[i] === BIOME.SHALLOW_OCEAN);
    }
  }
});

test('forests are land climate outcomes and form coherent stands', () => {
  const f = fieldsFor(20260731); let forest = 0;
  for (let i = 0; i < topo.nodeCount; i++) if (f.forestDensity[i] > 0.34) {
    forest++;
    assert.equal(f.landMask[i], 1);
    assert.ok(f.baseMoisture[i] > 0.4 && f.baseTemp[i] > 0.15);
    assert.ok(f.featureFlags[i] & FEATURE.FOREST);
  }
  assert.ok(forest > 100);
  assert.ok(componentSizes((i) => f.forestDensity[i] > 0.34)[0] > forest * 0.6);
});

test('priority-flood drainage has neighboring downstream cells and no cycles', () => {
  const f = fieldsFor(123);
  for (let root = 0; root < topo.nodeCount; root++) if (f.landMask[root]) {
    const seen = new Set(); let cell = root;
    while (f.landMask[cell]) {
      assert.ok(!seen.has(cell), `cycle from ${root}`); seen.add(cell);
      const down = f.drainTo[cell];
      assert.ok(down >= 0 && adjacent(cell, down), `${cell} -> ${down}`);
      assert.ok(f.filledElevation[down] < f.filledElevation[cell]);
      cell = down;
    }
  }
});

test('accumulation increases downstream and rivers reach real mouths', () => {
  const f = fieldsFor(20260731); let rivers = 0; let tributaries = 0; let mouths = 0;
  for (let i = 0; i < topo.nodeCount; i++) if (f.landMask[i]) {
    const down = f.drainTo[i];
    assert.ok(f.flowAccumulation[down] + 0.0001 >= f.flowAccumulation[i]);
    if (!(f.featureFlags[i] & FEATURE.RIVER)) continue;
    rivers++; tributaries += !!(f.featureFlags[i] & FEATURE.TRIBUTARY);
    if (!f.landMask[down]) {
      mouths++; assert.ok(f.featureFlags[i] & FEATURE.RIVER_MOUTH);
    } else assert.ok(f.featureFlags[down] & FEATURE.RIVER, `broken river ${i}`);
  }
  assert.ok(rivers > 120 && tributaries > 40 && mouths > 5);
  assert.ok(componentSizes((i) => !!(f.featureFlags[i] & FEATURE.RIVER))[0] > 40);
  assert.ok(Math.max(...f.riverStrength) > 0.95);
});

test('lake IDs, landmarks, and sources reference authoritative cells', () => {
  for (const seed of [7, 42, 999, 20260731]) {
    const f = fieldsFor(seed); const lakeIds = new Set();
    for (let i = 0; i < topo.nodeCount; i++) if (f.lakeId[i] >= 0) {
      lakeIds.add(f.lakeId[i]); assert.equal(f.waterClass[i], WATER.LAKE);
      assert.ok(f.featureFlags[i] & FEATURE.LAKE);
    }
    assert.ok(lakeIds.size < 32);
    assert.ok(Object.isFrozen(f.landmarks) && f.landmarks.length >= 5);
    for (const mark of f.landmarks) {
      assert.ok(Object.isFrozen(mark) && mark.cell >= 0 && mark.cell < topo.nodeCount);
      assert.ok(f.featureFlags[mark.cell] & FEATURE.LANDMARK);
    }
    assert.ok(Object.isFrozen(f.sources) && new Set(f.sources).size === 6);
    const score = (i) => f.baseNutrient[i]
      * Math.max(0.2, 1 - Math.abs(f.baseTemp[i] - 0.6) * 1.6)
      * Math.max(0.2, 1 - Math.abs(f.baseMoisture[i] - 0.55) * 1.2);
    let worldScore = 0; let landCount = 0; let best = -1; let bestScore = -1;
    for (let i = 0; i < topo.nodeCount; i++) if (f.landMask[i] && f.lakeId[i] < 0) {
      const value = score(i); worldScore += value; landCount++;
      if (value > bestScore) { bestScore = value; best = i; }
    }
    let sourceScore = 0;
    for (const cell of f.sources) {
      assert.equal(f.landMask[cell], 1); assert.equal(f.lakeId[cell], -1);
      assert.ok(f.baseTemp[cell] > 0.25 && f.baseMoisture[cell] > 0.3);
      sourceScore += score(cell);
    }
    assert.notEqual(f.sources[0], best);
    assert.ok(sourceScore / 6 > worldScore / landCount);
  }
});

test('default seed guarantees a readable living hemisphere', () => {
  const f = fieldsFor(20260731); let coast = 0; let highland = 0; let dry = 0; let wet = 0;
  for (let i = 0; i < topo.nodeCount; i++) {
    coast += !!(f.featureFlags[i] & FEATURE.COAST);
    highland += !!(f.featureFlags[i] & FEATURE.HIGHLAND);
    if (f.landMask[i]) { dry += f.baseMoisture[i] < 0.38; wet += f.baseMoisture[i] > 0.65; }
  }
  assert.ok(coast > 70 && highland > 150 && dry > 150 && wet > 50);
  assert.ok(f.landmarks.some((mark) => mark.kind === 2));
});

test('generation performance remains comfortably off the hot path', () => {
  const start = performance.now();
  for (let seed = 100; seed < 108; seed++) fieldsFor(seed);
  assert.ok(performance.now() - start < 1200);
});
