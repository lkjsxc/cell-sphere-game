/** Risk protected: the renderer has no GPU in Node, but its pure logic
 *  (camera, picking, instance packing) and its shader/uniform contract can
 *  and must be checked here. The uniform cross-check catches a declared-but-
 *  never-uploaded uniform (silent zero) or a typo'd upload name. A real GPU
 *  render is verified separately by scripts/browser-test.mjs where the
 *  environment permits (see docs/testing.md for the seccomp caveat). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { createCamera, cameraEye, viewProjection, cameraRay, intersectUnitSphere, rotate } from '../../src/rendering/camera.js';
import { buildVeinInstances, buildTipInstances } from '../../src/rendering/instances.js';
import * as SH from '../../src/rendering/shaders.js';
import * as SHN from '../../src/rendering/shaders-network.js';
import * as SHB from '../../src/rendering/shaders-boundary.js';
import { parseUniformNames } from '../../src/rendering/gl-utils.js';
import { createCellGeometry } from '../../src/rendering/cell-geometry.js';
import { AttractState } from '../../src/rendering/attract-state.js';
import { createTopology } from '../../src/world/icosphere.js';
import { createFields } from '../../src/world/fields.js';
import { createRng } from '../../src/core/prng.js';

const here = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(resolve(here, p), 'utf8');

test('viewProjection yields 16 finite numbers', () => {
  const vp = viewProjection(createCamera(), 16 / 9);
  assert.equal(vp.length, 16);
  for (const v of vp) assert.ok(Number.isFinite(v), `non-finite ${v}`);
});

test('cameraEye sits at the configured distance from the origin', () => {
  const cam = createCamera();
  const e = cameraEye(cam);
  const d = Math.hypot(e[0], e[1], e[2]);
  assert.ok(Math.abs(d - cam.dist) < 1e-6, `distance ${d} != ${cam.dist}`);
});

test('grab rotation follows the pointer horizontally and vertically', () => {
  for (const [dragX, dragY, axis, direction] of [[0.18, 0, 0, 1], [0, 0.18, 1, -1]]) {
    const cam = createCamera();
    const grabbed = cam.direction.slice();
    const before = project(viewProjection(cam, 1), grabbed);
    rotate(cam, dragX, dragY, false);
    const after = project(viewProjection(cam, 1), grabbed);
    assert.ok((after[axis] - before[axis]) * direction > 0.1,
      `grabbed point did not follow drag ${dragX},${dragY}`);
  }
});

test('vertical rotation crosses both poles and completes a full orbit', () => {
  const cam = createCamera();
  const startDirection = cam.direction.slice(); const startUp = cam.up.slice();
  for (let step = 0; step < 96; step++) {
    rotate(cam, 0, (Math.PI * 2) / 96, false);
    for (const value of viewProjection(cam, 1)) assert.ok(Number.isFinite(value));
  }
  assert.ok(Math.hypot(...cam.direction.map((value, i) => value - startDirection[i])) < 1e-6);
  assert.ok(Math.hypot(...cam.up.map((value, i) => value - startUp[i])) < 1e-6);
});

test('cameraRay direction is a unit vector', () => {
  const cam = createCamera();
  const r = cameraRay(cam, 0, 0, 1);
  const len = Math.hypot(r.dir[0], r.dir[1], r.dir[2]);
  assert.ok(Math.abs(len - 1) < 1e-6, `dir len ${len}`);
});

test('ray toward the globe hits; ray away misses', () => {
  const cam = createCamera();
  const hit = cameraRay(cam, 0, 0, 1); // center of screen aims at origin
  const t = intersectUnitSphere(hit);
  assert.ok(t !== null && t > 0, 'center ray must hit the unit sphere');
  const away = { origin: [0, 0, 5], dir: [0, 0, 1] };
  assert.equal(intersectUnitSphere(away), null, 'outward ray must miss');
});

function project(matrix, point) {
  const x = matrix[0] * point[0] + matrix[4] * point[1] + matrix[8] * point[2] + matrix[12];
  const y = matrix[1] * point[0] + matrix[5] * point[1] + matrix[9] * point[2] + matrix[13];
  const w = matrix[3] * point[0] + matrix[7] * point[1] + matrix[11] * point[2] + matrix[15];
  return [x / w, y / w];
}

test('parseUniformNames strips array brackets', () => {
  const names = parseUniformNames(SH.FS_GLOBE);
  assert.ok(names.has('uEventCenter'), 'array uniform base name lost');
  assert.ok(!names.has('uEventCenter[4]'), 'bracketed name leaked');
  assert.ok(names.has('uEntropy'));
});

test('every declared uniform is uploaded by the renderer modules', () => {
  const uploaded = new Set();
  const re = /\.u\.get\(['"]([^'"]+)['"]\)/g;
  for (const src of [read('../../src/rendering/renderer.js'), read('../../src/rendering/world-pass.js'),
    read('../../src/rendering/network-pass.js')]) {
    let m;
    while ((m = re.exec(src)) !== null) uploaded.add(m[1]);
  }
  const programs = {
    background: [SH.VS_BACKGROUND, SH.FS_BACKGROUND],
    globe: [SH.VS_GLOBE, SH.FS_GLOBE],
    atmosphere: [SH.VS_ATMOSPHERE, SH.FS_ATMOSPHERE],
    veins: [SHN.VS_VEINS, SHN.FS_VEINS],
    tips: [SHN.VS_TIPS, SHN.FS_TIPS],
    boundary: [SHB.VS_BOUNDARY, SHB.FS_BOUNDARY],
  };
  for (const [name, sources] of Object.entries(programs)) {
    const declared = new Set();
    for (const s of sources) for (const u of parseUniformNames(s)) declared.add(u);
    assert.ok(declared.size > 0, `${name} declared no uniforms`);
    for (const u of declared) {
      assert.ok(uploaded.has(u), `${name}: uniform "${u}" declared but never uploaded`);
    }
  }
  // Spot-check the high-value overlay uniforms really exist in the globe shader.
  for (const u of ['uEventCenter', 'uEventStrength', 'uSignalCenter', 'uSignalRadius']) {
    assert.ok(parseUniformNames(SH.FS_GLOBE).has(u), `globe missing ${u}`);
  }
});

test('dual-cell render geometry stays indexed, finite, and cell-addressable', () => {
  const topo = createTopology(3);
  const fields = createFields(createRng(42), topo);
  const geometry = createCellGeometry(topo, fields);
  assert.equal(geometry.dual.cellCount, topo.nodeCount);
  assert.equal(geometry.indices.length, topo.edgeCount * 6);
  assert.equal(geometry.boundaryIndices.length, topo.edgeCount * 6);
  assert.equal(geometry.vertexCell.length, geometry.vertexCount);
  for (const value of geometry.positions) assert.ok(Number.isFinite(value));
  for (const index of geometry.indices) assert.ok(index < geometry.vertexCount);
});

test('title organism grows through real adjacency and stays bounded', () => {
  const topo = createTopology(2);
  const attract = new AttractState(topo, 0);
  for (let step = 1; step <= 80; step++) attract.update(step * 300, true);
  const snap = attract.snapshot;
  const alive = snap.alive.reduce((sum, value) => sum + value, 0);
  assert.equal(alive, 54);
  for (let edge = 0; edge < topo.edgeCount; edge++) {
    if (!snap.edgeActive[edge]) continue;
    assert.equal(snap.alive[topo.edgeA[edge]], 1);
    assert.equal(snap.alive[topo.edgeB[edge]], 1);
  }
  attract.reset(12);
  assert.equal(snap.alive[12], 1);
  assert.equal(snap.alive.reduce((sum, value) => sum + value, 0), 1);
});

// --- instance builders on a synthetic 3-node line graph ---------------------

function syntheticTopoAndSnapshot() {
  // nodes 0-1-2; edges e0=(0,1) active, e1=(1,2) inactive.
  const positions = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
  const topo = {
    nodeCount: 3, edgeCount: 2, positions,
    edgeA: Uint16Array.from([0, 1]),
    edgeB: Uint16Array.from([1, 2]),
    // CSR: node0->[e0], node1->[e0,e1], node2->[e1]; neighbors mirror.
    nodeStart: Uint32Array.from([0, 1, 3, 4]),
    nodeEdges: Uint32Array.from([0, 0, 1, 1]),
    nodeNeighbors: Uint16Array.from([1, 0, 2, 1]),
  };
  const snapshot = {
    edgeActive: Uint8Array.from([1, 0]),
    conductance: Float32Array.from([1.2, 0.1]),
    flux: Float32Array.from([0.3, 0]),
    stress: Float32Array.from([0.1, 0.4, 0.2]),
    alive: Uint8Array.from([1, 1, 0]),
    biomass: Float32Array.from([1.0, 0.8, 0]),
  };
  return { topo, snapshot };
}

test('buildVeinInstances emits only active edges with 9-float stride', () => {
  const { topo, snapshot } = syntheticTopoAndSnapshot();
  const out = new Float32Array(topo.edgeCount * 9);
  const n = buildVeinInstances(topo, snapshot, out);
  assert.equal(n, 1, 'only the active edge');
  // First endpoint must be node 0's position (1,0,0).
  assert.equal(out[0], 1); assert.equal(out[1], 0); assert.equal(out[2], 0);
  // Width encodes conductance; flux normalized and clamped.
  assert.ok(out[6] > 0.006, 'width should reflect conductance');
  assert.ok(out[8] >= 0 && out[8] <= 1, 'flux param out of [0,1]');
});

test('buildTipInstances emits living frontier nodes only', () => {
  const { topo, snapshot } = syntheticTopoAndSnapshot();
  const out = new Float32Array(topo.nodeCount * 5);
  const n = buildTipInstances(topo, snapshot, out);
  // node0 alive but its only neighbor (1) is alive -> not frontier.
  // node1 alive with dead neighbor 2 -> frontier. node2 dead.
  assert.equal(n, 1, 'exactly one frontier tip');
  assert.equal(out[0], 0); assert.equal(out[1], 1); assert.equal(out[2], 0); // node1 pos
});
