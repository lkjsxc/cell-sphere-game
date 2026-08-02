/** Risk protected: a broken topology corrupts every simulation and render
 *  path; counts, symmetry, and normalization are the foundation contract. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTopology } from '../../src/world/icosphere.js';
import { createDualMesh } from '../../src/world/dual-mesh.js';

const topo = createTopology(4);
const dual = createDualMesh(topo);

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

test('dual mesh forms mostly hexagonal cells with twelve World Knots', () => {
  assert.equal(dual.cellCount, 2562);
  assert.equal(dual.cornerCount, 5120);
  assert.equal(dual.boundaryCount, 7680);
  assert.equal(dual.cellCorners.length, 15360);
  let knots = 0;
  for (let cell = 0; cell < dual.cellCount; cell++) {
    const sides = dual.cellStart[cell + 1] - dual.cellStart[cell];
    if (sides === 5) knots++;
    else assert.equal(sides, 6, `cell ${cell} has ${sides} sides`);
  }
  assert.equal(knots, 12);
});

test('dual corners are finite unit vectors and boundaries are manifold', () => {
  for (let corner = 0; corner < dual.cornerCount; corner++) {
    const x = dual.corners[corner * 3];
    const y = dual.corners[corner * 3 + 1];
    const z = dual.corners[corner * 3 + 2];
    assert.ok(Number.isFinite(x + y + z), `corner ${corner} is not finite`);
    assert.ok(Math.abs(Math.hypot(x, y, z) - 1) < 1e-5, `corner ${corner} off sphere`);
  }
  for (let edge = 0; edge < dual.boundaryCount; edge++) {
    const a = dual.boundaryCornerA[edge];
    const b = dual.boundaryCornerB[edge];
    assert.notEqual(a, b, `boundary ${edge} repeats one corner`);
    assert.ok(a < dual.cornerCount && b < dual.cornerCount, `boundary ${edge} invalid`);
  }
});

test('dual cell winding faces outward and generation is deterministic', () => {
  for (let cell = 0; cell < dual.cellCount; cell++) {
    const start = dual.cellStart[cell]; const end = dual.cellStart[cell + 1];
    const center = topo.positions.subarray(cell * 3, cell * 3 + 3);
    for (let offset = start; offset < end; offset++) {
      const ca = dual.cellCorners[offset] * 3;
      const cb = dual.cellCorners[offset + 1 < end ? offset + 1 : start] * 3;
      const ax = dual.corners[ca] - center[0];
      const ay = dual.corners[ca + 1] - center[1];
      const az = dual.corners[ca + 2] - center[2];
      const bx = dual.corners[cb] - center[0];
      const by = dual.corners[cb + 1] - center[1];
      const bz = dual.corners[cb + 2] - center[2];
      const facing = (ay * bz - az * by) * center[0]
        + (az * bx - ax * bz) * center[1]
        + (ax * by - ay * bx) * center[2];
      assert.ok(facing > 0, `cell ${cell} has inward edge at ${offset - start}`);
    }
  }
  const again = createDualMesh(createTopology(4));
  assert.deepEqual(again.corners, dual.corners);
  assert.deepEqual(again.cellCorners, dual.cellCorners);
});
