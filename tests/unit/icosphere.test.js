/** Risk protected: a broken topology corrupts every simulation and render
 *  path; counts, symmetry, and normalization are the foundation contract. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTopology } from '../../src/world/icosphere.js';

const topo = createTopology(4);

test('canonical counts at level 4', () => {
  assert.equal(topo.nodeCount, 2562);
  assert.equal(topo.triCount, 5120);
  assert.equal(topo.edgeCount, 7680);
  assert.equal(topo.positions.length, 2562 * 3);
  assert.equal(topo.triangles.length, 5120 * 3);
});

test('positions lie on the unit sphere within tolerance', () => {
  for (let i = 0; i < topo.nodeCount; i++) {
    const x = topo.positions[i * 3];
    const y = topo.positions[i * 3 + 1];
    const z = topo.positions[i * 3 + 2];
    const len = Math.sqrt(x * x + y * y + z * z);
    assert.ok(Math.abs(len - 1) < 1e-5, `node ${i} len ${len}`);
  }
});

test('degrees: exactly twelve 5-neighbors, all others 6', () => {
  let fives = 0;
  for (let i = 0; i < topo.nodeCount; i++) {
    const d = topo.degree[i];
    if (d === 5) fives++;
    else assert.equal(d, 6, `node ${i} degree ${d}`);
  }
  assert.equal(fives, 12);
});

test('no duplicate undirected edges', () => {
  const seen = new Set();
  for (let e = 0; e < topo.edgeCount; e++) {
    const a = topo.edgeA[e]; const b = topo.edgeB[e];
    assert.ok(a < b, `edge ${e} not canonical (${a},${b})`);
    const key = a * 100000 + b;
    assert.ok(!seen.has(key), `duplicate edge ${a},${b}`);
    seen.add(key);
  }
});

test('adjacency CSR is symmetric and consistent', () => {
  // Every edge appears in both endpoint adjacency lists.
  let slots = 0;
  for (let n = 0; n < topo.nodeCount; n++) {
    const start = topo.nodeStart[n];
    const end = topo.nodeStart[n + 1];
    assert.equal(end - start, topo.degree[n]);
    for (let o = start; o < end; o++) {
      slots++;
      const e = topo.nodeEdges[o];
      const nb = topo.nodeNeighbors[o];
      const a = topo.edgeA[e]; const b = topo.edgeB[e];
      assert.ok((a === n && b === nb) || (b === n && a === nb),
        `slot ${o} inconsistent`);
    }
  }
  assert.equal(slots, topo.edgeCount * 2);
});

test('triangle indices reference valid nodes', () => {
  for (let i = 0; i < topo.triangles.length; i++) {
    assert.ok(topo.triangles[i] < topo.nodeCount);
  }
});

test('generation is deterministic across calls', () => {
  const again = createTopology(4);
  assert.deepEqual(again.positions, topo.positions);
  assert.deepEqual(again.triangles, topo.triangles);
  assert.deepEqual(again.edgeA, topo.edgeA);
  assert.deepEqual(again.edgeB, topo.edgeB);
});
