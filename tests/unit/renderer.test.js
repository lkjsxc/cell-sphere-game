/** Risk protected: the renderer has no GPU in Node, but its pure logic
 *  (camera, picking, instance packing) and its shader/uniform contract can
 *  and must be checked here. The uniform cross-check catches a declared-but-
 *  never-uploaded uniform (silent zero) or a typo'd upload name. A real GPU
 *  render is verified separately by scripts/browser-test.mjs where the
 *  environment permits (see docs/testing.md for the seccomp caveat). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { createCamera, cameraEye, viewProjection, cameraRay, intersectUnitSphere, rotate } from '../../src/rendering/camera.js';
import { LIFE_STATE, writeLifeStates } from '../../src/core/life-state.js';
import * as SH from '../../src/rendering/shaders.js';
import * as SHB from '../../src/rendering/shaders-boundary.js';
import * as SHS from '../../src/rendering/shaders-shell.js';
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
  for (const src of [read('../../src/rendering/renderer.js'), read('../../src/rendering/world-pass.js')]) {
    let m;
    while ((m = re.exec(src)) !== null) uploaded.add(m[1]);
  }
  const programs = {
    background: [SHS.VS_BACKGROUND, SHS.FS_BACKGROUND],
    globe: [SH.VS_GLOBE, SH.FS_GLOBE],
    atmosphere: [SHS.VS_ATMOSPHERE, SHS.FS_ATMOSPHERE],
    boundary: [SHB.VS_BOUNDARY, SHB.FS_BOUNDARY],
  };
  for (const [name, sources] of Object.entries(programs)) {
    const declared = new Set();
    for (const s of sources) for (const u of parseUniformNames(s)) declared.add(u);
    if (name !== 'background') assert.ok(declared.size > 0, `${name} declared no uniforms`);
    for (const u of declared) {
      assert.ok(uploaded.has(u), `${name}: uniform "${u}" declared but never uploaded`);
    }
  }
  for (const u of ['uEventCenter', 'uEventStrength', 'uSelectedCenter', 'uHasSelection']) {
    assert.ok(parseUniformNames(SH.FS_GLOBE).has(u), `globe missing ${u}`);
  }
  assert.ok(!parseUniformNames(SH.FS_GLOBE).has('uSignalCenter'));
});

test('production renderer has four geographic/cellular draws and no line-artifact path', () => {
  const renderer = read('../../src/rendering/renderer.js'); const shaders = read('../../src/rendering/shaders.js');
  const fallback = read('../../src/rendering/fallback2d.js');
  const world = read('../../src/rendering/world-pass.js'); const geometry = read('../../src/rendering/cell-geometry.js');
  assert.match(renderer, /drawCalls = 4/);
  assert.doesNotMatch(renderer, /network|vein|tip|drawElementsInstanced/i);
  assert.doesNotMatch(fallback, /edgeActive|conductance|flux|renderNetwork|tip|vein/i);
  assert.doesNotMatch(shaders, /orbit|uTwinkle|uTime/);
  assert.doesNotMatch(`${world}\n${geometry}`, /buildRiverGeometry|riverPositions|riverFeature|riverIndices|programs\.river|riverVao/);
  assert.equal(existsSync(resolve(here, '../../src/rendering/network-pass.js')), false);
  assert.equal(existsSync(resolve(here, '../../src/rendering/shaders-network.js')), false);
});

test('dual-cell render geometry stays indexed, finite, and cell-addressable', () => {
  const topo = createTopology(3);
  const fields = createFields(createRng(42), topo);
  const geometry = createCellGeometry(topo, fields);
  assert.equal(geometry.dual.cellCount, topo.nodeCount);
  assert.equal(geometry.indices.length, topo.edgeCount * 6);
  assert.equal(geometry.boundaryIndices.length, topo.edgeCount * 6);
  assert.equal('riverIndices' in geometry, false);
  assert.equal(geometry.vertexCell.length, geometry.vertexCount);
  for (const value of [...geometry.positions, ...geometry.terrain]) assert.ok(Number.isFinite(value));
  for (const index of geometry.indices) assert.ok(index < geometry.vertexCount);
});

test('title organism grows through real adjacency and stays bounded', () => {
  const topo = createTopology(2);
  const attract = new AttractState(topo, 0);
  for (let step = 1; step <= 80; step++) attract.update(step * 300, true);
  const snap = attract.snapshot;
  const alive = snap.alive.reduce((sum, value) => sum + value, 0);
  assert.ok(alive > 0 && alive <= 54, `bounded autonomous bloom: ${alive}`);
  assert.ok(snap.tick > 54, 'title bloom reseeds autonomously after resting');
  assert.equal(snap.lifeState.length, topo.nodeCount);
  assert.ok(snap.lifeState.some((value) => value === LIFE_STATE.FRONTIER));
  attract.reset(12);
  assert.equal(snap.alive[12], 1);
  assert.equal(snap.alive.reduce((sum, value) => sum + value, 0), 1);
});

test('cell life semantics distinguish topology frontier, stress, critical, and remains', () => {
  const topo = { nodeCount: 6, nodeStart: Uint32Array.from([0, 1, 3, 5, 7, 9, 10]),
    nodeNeighbors: Uint16Array.from([1, 0, 2, 1, 3, 2, 4, 3, 5, 4]) };
  const alive = Uint8Array.from([1, 1, 1, 1, 0, 0]);
  const biomass = Float32Array.from([1, 1, 1, 1, 0.02, 0]);
  const stress = Float32Array.from([0, 0, 0.7, 1.1, 0, 0]);
  const result = writeLifeStates(topo, alive, biomass, stress, new Uint8Array(6));
  assert.deepEqual([...result], [LIFE_STATE.LIVING, LIFE_STATE.LIVING, LIFE_STATE.STRESSED,
    LIFE_STATE.CRITICAL, LIFE_STATE.DEAD_REMAINS, LIFE_STATE.UNOCCUPIED]);
  stress[2] = 0; alive[3] = 0; biomass[3] = 0;
  writeLifeStates(topo, alive, biomass, stress, result);
  assert.equal(result[2], LIFE_STATE.FRONTIER);
});
