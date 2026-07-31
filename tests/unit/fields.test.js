/** Risk protected: world fields must be seed-reproducible (shared seeds)
 *  and well-behaved (bounded, non-degenerate). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../../src/core/prng.js';
import { createTopology } from '../../src/world/icosphere.js';
import { createFields } from '../../src/world/fields.js';

const topo = createTopology(4);

function fieldsFor(seed) {
  return createFields(createRng(seed), topo);
}

test('same seed reproduces identical fields', () => {
  const a = fieldsFor(42);
  const b = fieldsFor(42);
  assert.deepEqual(a.baseNutrient, b.baseNutrient);
  assert.deepEqual(a.baseMoisture, b.baseMoisture);
  assert.deepEqual(a.baseTemp, b.baseTemp);
  assert.deepEqual(a.altitude, b.altitude);
  assert.deepEqual(a.sources, b.sources);
});

test('different seeds produce different worlds', () => {
  const a = fieldsFor(1);
  const b = fieldsFor(2);
  let diff = 0;
  for (let i = 0; i < topo.nodeCount; i++) {
    if (a.baseNutrient[i] !== b.baseNutrient[i]) diff++;
  }
  assert.ok(diff > topo.nodeCount * 0.5, `too similar: ${diff}`);
});

test('all fields are within [0,1]', () => {
  const f = fieldsFor(7);
  for (const arr of [f.baseNutrient, f.baseMoisture, f.baseTemp, f.altitude, f.toxVuln, f.eventVuln]) {
    for (let i = 0; i < arr.length; i++) {
      assert.ok(arr[i] >= 0 && arr[i] <= 1, `out of bounds ${arr[i]}`);
    }
  }
});

test('fields are non-degenerate (real variance)', () => {
  const f = fieldsFor(99);
  const stats = (arr) => {
    let lo = Infinity; let hi = -Infinity; let sum = 0;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] < lo) lo = arr[i];
      if (arr[i] > hi) hi = arr[i];
      sum += arr[i];
    }
    return { lo, hi, mean: sum / arr.length };
  };
  const n = stats(f.baseNutrient);
  assert.ok(n.hi - n.lo > 0.4, `nutrient range too small: ${n.hi - n.lo}`);
  assert.ok(n.mean > 0.25 && n.mean < 0.75, `nutrient mean ${n.mean}`);
});

test('resource sources: anchored on the peak, collectively richer than average', () => {
  for (const seed of [7, 42, 123, 999, 31337]) {
    const f = fieldsFor(seed);
    assert.equal(f.sources.length, 6, `seed ${seed}`);
    assert.equal(new Set(f.sources).size, 6, `seed ${seed}`);
    // Anchor is the global nutrient maximum.
    let peak = 0;
    for (let i = 1; i < topo.nodeCount; i++) {
      if (f.baseNutrient[i] > f.baseNutrient[peak]) peak = i;
    }
    assert.equal(f.sources[0], peak, `seed ${seed} anchor`);
    // Source mean beats world mean (well-distributed richness sampling).
    let worldSum = 0;
    for (let i = 0; i < topo.nodeCount; i++) worldSum += f.baseNutrient[i];
    const worldMean = worldSum / topo.nodeCount;
    const srcMean = f.sources.reduce((acc, s) => acc + f.baseNutrient[s], 0) / 6;
    assert.ok(srcMean > worldMean, `seed ${seed}: src ${srcMean} <= world ${worldMean}`);
    // Pairwise separation: angle > 40deg (dot < 0.77).
    for (let a = 0; a < 6; a++) {
      for (let b = a + 1; b < 6; b++) {
        const i = f.sources[a]; const j = f.sources[b];
        const dot = topo.positions[i * 3] * topo.positions[j * 3]
          + topo.positions[i * 3 + 1] * topo.positions[j * 3 + 1]
          + topo.positions[i * 3 + 2] * topo.positions[j * 3 + 2];
        assert.ok(dot < 0.77, `seed ${seed} sources ${i},${j} too close`);
      }
    }
  }
});
