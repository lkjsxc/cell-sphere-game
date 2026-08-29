/** Risk protected: atmosphere quality must never inherit gameplay resolution. */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ATMOSPHERE_GEOMETRY, ATMOSPHERE_SAGITTA_LIMIT_CSS_PX } from '../../../src/rendering/atmosphere-geometry.js';
import { createCamera, FOV_Y, zoom } from '../../../src/rendering/camera.js';
import { projectedSphereDiameter } from '../../../src/interface/policies/layout-policy.js';
import { createTopology } from '../../../src/world/icosphere.js';

const here = dirname(fileURLToPath(import.meta.url));
const requiredViewports = [[320, 568], [360, 640], [390, 844], [430, 932],
  [768, 1024], [844, 390], [1024, 600], [1440, 900]];

test('fixed atmosphere geometry has exact bounded counts and a stable signature', async () => {
  const geometry = ATMOSPHERE_GEOMETRY;
  assert.equal(geometry.refinement, 5);
  assert.equal(geometry.vertexCount, 10242);
  assert.equal(geometry.triangleCount, 20480);
  assert.equal(geometry.indexCount, 61440);
  assert.equal(geometry.indexType, 'uint16');
  assert.equal(geometry.positionBytes, 122904);
  assert.equal(geometry.indexBytes, 122880);
  assert.equal(geometry.byteLength, 245784);
  assert.equal(geometry.constructionCount, 1);
  assert.ok(Object.isFrozen(geometry));
  const repeated = (await import('../../../src/rendering/atmosphere-geometry.js?deterministic=1')).ATMOSPHERE_GEOMETRY;
  assert.equal(repeated.signature, geometry.signature);
  assert.deepEqual(repeated.positions, geometry.positions);
  assert.deepEqual(repeated.indices, geometry.indices);
});

test('every atmosphere vertex and triangle is finite, unit, valid, and outward', () => {
  const { positions, indices, vertexCount } = ATMOSPHERE_GEOMETRY;
  for (let vertex = 0; vertex < vertexCount; vertex++) {
    const at = vertex * 3; const x = positions[at]; const y = positions[at + 1]; const z = positions[at + 2];
    assert.ok(Number.isFinite(x + y + z), `vertex ${vertex} is nonfinite`);
    assert.ok(Math.abs(Math.hypot(x, y, z) - 1) < 8e-8, `vertex ${vertex} is off sphere`);
  }
  for (let triangle = 0; triangle < indices.length; triangle += 3) {
    const ai = indices[triangle]; const bi = indices[triangle + 1]; const ci = indices[triangle + 2];
    assert.ok(ai < vertexCount && bi < vertexCount && ci < vertexCount);
    assert.notEqual(ai, bi); assert.notEqual(bi, ci); assert.notEqual(ci, ai);
    const a = ai * 3; const b = bi * 3; const c = ci * 3;
    const abx = positions[b] - positions[a]; const aby = positions[b + 1] - positions[a + 1]; const abz = positions[b + 2] - positions[a + 2];
    const acx = positions[c] - positions[a]; const acy = positions[c + 1] - positions[a + 1]; const acz = positions[c + 2] - positions[a + 2];
    const nx = aby * acz - abz * acy; const ny = abz * acx - abx * acz; const nz = abx * acy - aby * acx;
    const area = Math.hypot(nx, ny, nz); const outward = nx * positions[a] + ny * positions[a + 1] + nz * positions[a + 2];
    assert.ok(area > 1e-7, `triangle ${triangle / 3} is degenerate`);
    assert.ok(outward > 0, `triangle ${triangle / 3} winding is inward`);
  }
});

test('level 5 is the smallest midpoint refinement meeting the supported CSS sagitta bound', () => {
  const camera = createCamera(); zoom(camera, 0);
  const maximumRadius = Math.max(...requiredViewports.map(([, height]) =>
    projectedSphereDiameter(camera.dist, height, FOV_Y, 1.095) / 2));
  const sagitta = maximumRadius * (1 - Math.cos(ATMOSPHERE_GEOMETRY.maximumAngularEdge / 2));
  assert.ok(Math.abs(maximumRadius - 1067.101990732306) < 1e-9);
  assert.ok(Math.abs(ATMOSPHERE_GEOMETRY.maximumAngularEdge - 0.04134123872145546) < 1e-12);
  assert.ok(sagitta <= ATMOSPHERE_SAGITTA_LIMIT_CSS_PX, `${sagitta} > ${ATMOSPHERE_SAGITTA_LIMIT_CSS_PX}`);
  const lower = createTopology(4); const lowerEdge = maximumAngularEdge(lower.positions, lower.triangles);
  assert.ok(maximumRadius * (1 - Math.cos(lowerEdge / 2)) > ATMOSPHERE_SAGITTA_LIMIT_CSS_PX);
});

test('WorldPass binds only the renderer-owned atmosphere positions, indices, type, and count', () => {
  const source = readFileSync(resolve(here, '../../../src/rendering/world-pass.js'), 'utf8');
  const fixture = readFileSync(resolve(here, '../../../scripts/browser/atmosphere-fixture.mjs'), 'utf8');
  assert.match(source, /from '\.\/atmosphere-geometry\.js'/);
  assert.match(source, /this\.atmosphereGeometry\.positions/);
  assert.match(source, /this\.atmosphereGeometry\.indices/);
  assert.match(source, /this\.atmosphereGeometry\.indexCount/);
  assert.match(source, /this\.atmosphereIndexType/);
  assert.doesNotMatch(source, /programs\.atmosphere[\s\S]{0,500}this\.topo\.(?:positions|triangles)/);
  assert.doesNotMatch(source, /drawElements\([^\n]*this\.topo\.triangles/);
  assert.doesNotMatch(fixture, /atmosphereCount\s*\?\?|atmosphereGeometry\s*\?\?|world\.topo\.triangles/);
});

function maximumAngularEdge(positions, indices) {
  let maximum = 0;
  for (let at = 0; at < indices.length; at += 3) for (const [left, right] of [
    [indices[at], indices[at + 1]], [indices[at + 1], indices[at + 2]], [indices[at + 2], indices[at]],
  ]) {
    const a = left * 3; const b = right * 3;
    const dot = positions[a] * positions[b] + positions[a + 1] * positions[b + 1] + positions[a + 2] * positions[b + 2];
    maximum = Math.max(maximum, Math.acos(Math.max(-1, Math.min(1, dot))));
  }
  return maximum;
}
