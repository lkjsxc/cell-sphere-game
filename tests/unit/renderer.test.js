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
import { TitleShowcase, TITLE_SHOWCASE } from '../../src/showcase/player.js';
import { createTopology } from '../../src/world/icosphere.js';
import { createFields } from '../../src/world/fields.js';
import { createRng } from '../../src/core/prng.js';
import { applySafeLayout, cameraDistanceForProjectedDiameter, projectedSphereDiameter, safeLayout,
  targetGlobeDiameterRatio, WIDE_GLOBE_CENTER_RATIO } from '../../src/interface/policies/layout-policy.js';
import { createWorldIdentity } from '../../src/core/world-session.js';
import { createBlankSnapshot } from '../../src/rendering/blank-snapshot.js';
import { GLRenderer } from '../../src/rendering/renderer.js';
import { Canvas2DRenderer } from '../../src/rendering/fallback2d.js';
import { WorldPass } from '../../src/rendering/world-pass.js';
import { ENVIRONMENT_MODEL_VERSION, ENVIRONMENT_SCHEDULE_HASH,
  ENVIRONMENT_SCHEDULE_VERSION } from '../../src/game/environment-level.js';

const here = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(resolve(here, p), 'utf8');

test('scene composition is viewport-stable, centered in portrait, and two-thirds wide', () => {
  const cases = [[1440, 900, .65, .68], [1920, 1080, .65, .68], [1024, 768, .57, .66], [390, 844, .49, .51]];
  for (const [width, height, minimum, maximum] of cases) {
    const a = safeLayout(width, height, 'world'); const b = safeLayout(width, height, 'world');
    const center = .5 + a.offsetX / 2;
    assert.ok(center >= minimum && center <= maximum, `${width}x${height} center ${center}`);
    assert.deepEqual(a, b); assert.ok(Number.isFinite(a.distance));
  }
  const camera = createCamera(); const layout = safeLayout(1440, 900, 'evolution');
  applySafeLayout(camera, layout, false); const distance = camera.dist;
  applySafeLayout(camera, safeLayout(1440, 900, 'evolution'), true);
  assert.equal(camera.dist, distance); assert.equal(camera.offsetX, layout.offsetX);
  assert.equal(WIDE_GLOBE_CENTER_RATIO, 2 / 3);

  const required = [[320, 568], [360, 640], [390, 844], [430, 932], [768, 1024],
    [844, 390], [1024, 600], [1440, 900]];
  for (const [width, height] of required) {
    const value = safeLayout(width, height, 'world'); const center = .5 + value.offsetX / 2;
    if (width < height) assert.ok(center >= .49 && center <= .51, `${width}x${height} portrait center ${center}`);
    else {
      const ratio = center / (1 - center);
      assert.ok(center >= .65 && center <= .68, `${width}x${height} wide center ${center}`);
      assert.ok(ratio >= 1.9 && ratio <= 2.1, `${width}x${height} left:right ${ratio}`);
    }
  }

  const insetLayout = safeLayout(1200, 600, 'world', { left: 40, right: 20 });
  const insetCenterX = 1200 * (.5 + insetLayout.offsetX / 2);
  const insetCenterRatio = (insetCenterX - insetLayout.rect.left) / insetLayout.rect.width;
  assert.ok(insetCenterRatio >= .65 && insetCenterRatio <= .68, `safe-area center ${insetCenterRatio}`);
});

test('World and Home framing derive distance from the projected globe target', () => {
  const required = [[320, 568], [360, 640], [390, 844], [430, 932], [768, 1024],
    [844, 390], [1024, 600], [1440, 900]];
  for (const [width, height] of required) {
    for (const scene of ['home', 'world']) {
      const layout = safeLayout(width, height, scene); const shorter = Math.min(layout.rect.width, layout.rect.height);
      const ratio = projectedSphereDiameter(layout.distance, height) / shorter;
      assert.ok(Math.abs(ratio - layout.targetDiameterRatio) < 1e-12,
        `${scene} ${width}x${height}: ${ratio} != ${layout.targetDiameterRatio}`);
      assert.equal(layout.targetDiameterRatio, targetGlobeDiameterRatio(layout.rect.width / layout.rect.height));
    }
  }
  assert.ok(Math.abs(targetGlobeDiameterRatio(320 / 568) - 1.08) < 1e-12);
  assert.ok(Math.abs(targetGlobeDiameterRatio(1) - .98) < 1e-12);
  assert.ok(Math.abs(targetGlobeDiameterRatio(1440 / 900) - .90) < 1e-12);
});

test('projected diameter conversion round-trips and varies continuously with aspect', () => {
  for (const diameter of [280, 480, 900, 1200]) {
    const distance = cameraDistanceForProjectedDiameter(900, diameter);
    assert.ok(Math.abs(projectedSphereDiameter(distance, 900) - diameter) < 1e-9);
  }
  for (const boundary of [.62, .78, 1.1, 1.5]) {
    const left = targetGlobeDiameterRatio(boundary - 1e-7); const right = targetGlobeDiameterRatio(boundary + 1e-7);
    assert.ok(Math.abs(left - right) < 1e-6, `${boundary}: discontinuity ${left} -> ${right}`);
  }
  for (const boundary of [.92, 1.72]) {
    const left = safeLayout((boundary - 1e-5) * 1000, 1000, 'world');
    const right = safeLayout((boundary + 1e-5) * 1000, 1000, 'world');
    const leftCenter = .5 + left.offsetX / 2; const rightCenter = .5 + right.offsetX / 2;
    assert.ok(Math.abs(leftCenter - rightCenter) < .002, `${boundary}: center discontinuity ${leftCenter} -> ${rightCenter}`);
  }
});

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
    rotate(cam, dragX, dragY);
    const after = project(viewProjection(cam, 1), grabbed);
    assert.ok((after[axis] - before[axis]) * direction > 0.1,
      `grabbed point did not follow drag ${dragX},${dragY}`);
  }
});

test('vertical rotation crosses both poles and completes a full orbit', () => {
  const cam = createCamera();
  const startDirection = cam.direction.slice(); const startUp = cam.up.slice();
  for (let step = 0; step < 96; step++) {
    rotate(cam, 0, (Math.PI * 2) / 96);
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
  assert.equal(names.has('uEventCenter'), false, 'renderer still reconstructs spherical caps');
  assert.ok(names.has('uEntropy')); assert.doesNotMatch(SH.VS_GLOBE, /aEvent/);
  assert.match(SH.VS_GLOBE, /in vec4 aEcology/);
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
  for (const u of ['uSelectedCenter', 'uHasSelection']) {
    assert.ok(parseUniformNames(SH.FS_GLOBE).has(u), `globe missing ${u}`);
  }
  assert.ok(!parseUniformNames(SH.FS_GLOBE).has('uSignalCenter'));
});

test('globe keeps duplicated dual corners on one continuous position shell', () => {
  assert.match(SH.VS_GLOBE, /vPos = aPos;/);
  assert.doesNotMatch(SH.VS_GLOBE, /atlasRelief|\brelief\b|aPos\s*\*/);
  const topo = createTopology(3); const geometry = createCellGeometry(topo, createFields(createRng(42), topo));
  const first = new Map();
  for (let cell = 0; cell < topo.nodeCount; cell++) for (let offset = geometry.dual.cellStart[cell]; offset < geometry.dual.cellStart[cell + 1]; offset++) {
    const corner = geometry.dual.cellCorners[offset]; const vertex = cell + offset + 1;
    const position = [...geometry.positions.subarray(vertex * 3, vertex * 3 + 3)];
    if (first.has(corner)) assert.deepEqual(position, first.get(corner), `corner ${corner} split between cells`);
    else first.set(corner, position);
  }
  assert.match(read('../../src/rendering/fallback2d.js'), /drawBaseShell\(ctx, cx, cy, radius/);
});

test('renderers bind exact world identity and reject an old snapshot before drawing', () => {
  const environment = { environmentModelVersion: ENVIRONMENT_MODEL_VERSION,
    environmentScheduleVersion: ENVIRONMENT_SCHEDULE_VERSION, environmentScheduleHash: ENVIRONMENT_SCHEDULE_HASH,
    immutableStartConfigurationHash: 'abcdef12' };
  const current = createWorldIdentity({ worldSessionId: 2, runId: 3, seed: 4, presentationGeneration: 5, ...environment });
  const old = createWorldIdentity({ worldSessionId: 1, runId: 2, seed: 3, presentationGeneration: 4, ...environment });
  const currentScene = { worldIdentity: current, snapshot: createBlankSnapshot(8, current) };
  const oldScene = { worldIdentity: current, snapshot: createBlankSnapshot(8, old) };
  for (const prototype of [GLRenderer.prototype, Canvas2DRenderer.prototype]) {
    assert.equal(prototype.accepts.call({ boundIdentity: current }, currentScene), true);
    assert.equal(prototype.accepts.call({ boundIdentity: current }, oldScene), false);
  }
  assert.equal(WorldPass.prototype.accepts.call({ boundIdentity: current }, currentScene.snapshot), true);
  assert.equal(WorldPass.prototype.accepts.call({ boundIdentity: current }, oldScene.snapshot), false);
});

test('the app frame loop schedules its next RAF unconditionally', () => {
  const app = read('../../src/interface/app-controller.js');
  assert.match(app, /finally \{ this\.frameAudit\.scheduled\+\+; this\.rafId = requestAnimationFrame/);
  assert.doesNotMatch(app, /requestWorldReplacement\('auto-next',[\s\S]{0,120}return;/);
});

test('renderer teardown zeroes dynamic buffers and removes the exact context listener idempotently', () => {
  const renderer = read('../../src/rendering/renderer.js'); const world = read('../../src/rendering/world-pass.js');
  assert.match(renderer, /this\.contextLossListener/); assert.match(renderer, /removeEventListener\('webglcontextlost', this\.contextLossListener\)/);
  assert.match(renderer, /if \(this\.disposed\) return/); assert.match(world, /lifeData\.fill\(0\)/);
  assert.match(world, /ecologyData\.fill\(0\)/); assert.doesNotMatch(world, /eventData|aEvent/);
  assert.doesNotMatch(world, /adaptationData|aAdaptation|uAdaptation/);
  assert.match(world, /bufferSubData/);
});

test('production renderer keeps four draws and has no fine waterway machinery', () => {
  const renderer = read('../../src/rendering/renderer.js'); const shaders = read('../../src/rendering/shaders.js');
  const fallback = read('../../src/rendering/fallback2d.js');
  const world = read('../../src/rendering/world-pass.js'); const geometry = read('../../src/rendering/cell-geometry.js');
  const production = `${world}\n${geometry}\n${shaders}\n${fallback}`;
  assert.match(renderer, /drawCalls = 4/);
  assert.doesNotMatch(renderer, /network|vein|tip|drawElementsInstanced/i);
  assert.doesNotMatch(fallback, /edgeActive|conductance|flux|renderNetwork|tip|vein/i);
  assert.doesNotMatch(shaders, /orbit|uTwinkle/);
  assert.match(shaders, /uTime/); assert.match(shaders, /uPulse/); assert.match(shaders, /uElectricityDevelopment/);
  assert.match(world, /uElectricityDevelopment/);
  assert.doesNotMatch(production, /riverDown|riverUp|riverMeta|aRiver|vRiver|drawRivers|riverBoundary|quadraticCurveTo|localChannel/i);
  assert.match(shaders, /float lakeCell/); assert.match(geometry, /const lakeEdge/);
  assert.match(shaders, /resourceState/); assert.match(shaders, /recoveringResource/); assert.match(shaders, /powered/);
  assert.doesNotMatch(shaders, /mix\(base, vec3\(grey\)[^;]*uEntropy/);
  assert.doesNotMatch(fallback, /const dim = 1 - entropy/);
  assert.equal(existsSync(resolve(here, '../../src/rendering/network-pass.js')), false);
  assert.equal(existsSync(resolve(here, '../../src/rendering/shaders-network.js')), false);
});

test('dual-cell lakes use terrain material and cell-boundary edges only', () => {
  const topo = createTopology(3); const fields = createFields(createRng(42), topo);
  const geometry = createCellGeometry(topo, fields);
  assert.equal(geometry.dual.cellCount, topo.nodeCount);
  assert.equal(geometry.indices.length, topo.edgeCount * 6);
  assert.equal(geometry.boundaryIndices.length, topo.edgeCount * 6);
  for (const removed of ['riverDown', 'riverUp', 'riverMeta', 'riverIndices']) assert.equal(removed in geometry, false);
  assert.equal(geometry.vertexCell.length, geometry.vertexCount);
  for (const value of [...geometry.positions, ...geometry.terrain, ...geometry.boundaryFeature]) assert.ok(Number.isFinite(value));
  for (const index of geometry.indices) assert.ok(index < geometry.vertexCount);
  let lakeVertices = 0; let shoreVertices = 0; let lakeEdges = 0;
  for (let vertex = 0; vertex < geometry.vertexCount; vertex++) {
    const cell = geometry.vertexCell[vertex]; const material = geometry.terrain[vertex * 4 + 2];
    if (fields.lakeId[cell] >= 0) { lakeVertices++; assert.ok(material > 0 && material < 1.5); }
    if (fields.lakeShore[cell]) { shoreVertices++; assert.ok(material >= 2); }
  }
  for (let vertex = 0; vertex < geometry.boundaryFeature.length / 2; vertex++) lakeEdges += geometry.boundaryFeature[vertex * 2] > 0;
  assert.ok(lakeVertices > 0 && shoreVertices > 0 && lakeEdges > 0);
});

test('title showcase presents a production lifecycle and freezes when hidden or reduced', () => {
  const title = new TitleShowcase(createTopology(4));
  assert.equal(title.snapshot.alive.reduce((sum, value) => sum + value, 0), 1);
  title.update(0, false, false); title.update(6000, false, false);
  assert.ok(title.snapshot.metrics.aliveCount > 100);
  assert.ok(title.snapshot.lifeState.some((value) => value === LIFE_STATE.FRONTIER));
  title.update(9000, false, false); const visibleFrame = title.frameIndex;
  title.update(9000, false, true); title.update(19000, false, false);
  assert.equal(title.frameIndex, visibleFrame, 'hidden time advanced the lifecycle');
  title.update(20000, true, false); assert.equal(title.frameIndex, TITLE_SHOWCASE.reducedFrame);
  title.update(80000, true, false); assert.equal(title.frameIndex, TITLE_SHOWCASE.reducedFrame);
  title.apply(TITLE_SHOWCASE.frameCount - 1);
  assert.equal(title.snapshot.metrics.aliveCount, 0, 'showcase does not fade to extinction');
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
