/** Source-level ownership and existing-draw contract for the planetary sky. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const read = (path) => readFileSync(resolve(here, path), 'utf8');

test('planetary sky extends existing draws and has one bounded presentation authority', () => {
  const renderer = read('../../../src/rendering/renderer.js'); const world = read('../../../src/rendering/world-pass.js');
  const fallback = read('../../../src/rendering/fallback2d.js'); const canvasSky = read('../../../src/rendering/fallback-celestial.js');
  const shell = read('../../../src/rendering/shaders-shell.js'); const globe = read('../../../src/rendering/shaders.js');
  const deepSpace = read('../../../src/rendering/deep-space-field.js'); const stars = read('../../../src/rendering/star-field.js');
  const policy = read('../../../src/interface/policies/celestial-presentation.js');
  const projection = read('../../../src/rendering/celestial-projection.js');
  const app = read('../../../src/interface/app-controller.js');
  const history = read('../../../src/interface/history-playback.js');
  assert.match(renderer, /drawCalls = 4/); assert.match(shell, /uDeepSpaceField/); assert.match(shell, /uStarCounts/);
  assert.match(shell, /uShootingPath/); assert.doesNotMatch(shell, /vec2\(20\.0, 12\.0\)/);
  assert.doesNotMatch(shell, /for \(int index/);
  assert.match(globe, /uCloudField/); assert.match(canvasSky, /sampleValidCloudField/);
  assert.match(globe, /cloudNormal = normalize\(vPos\)/); assert.match(canvasSky, /topo\.positions/);
  assert.match(canvasSky, /CANVAS_CLOUD_PHASE_BUCKETS = 1024/); assert.match(fallback, /cloudSampleEpoch/);
  assert.ok(globe.indexOf('float cloudOpacity') < globe.indexOf('float stressed'));
  assert.ok(globe.indexOf('float cloudOpacity') < globe.indexOf('for (int i = 0; i < 8'));
  assert.match(renderer, /gl\.RGB8/); assert.match(renderer, /deepSpaceFieldUploads/); assert.match(renderer, /deleteTexture/);
  assert.match(canvasSky, /createCanvasDeepSpaceRaster/); assert.match(canvasSky, /drawDeepSpace/);
  assert.match(deepSpace, /DEEP_SPACE_FIELD_WIDTH = 256/); assert.match(deepSpace, /DEEP_SPACE_FIELD_COMPONENTS = 3/);
  assert.match(stars, /STAR_STRATA/); assert.match(stars, /balanced: Object\.freeze\(\[160, 42, 8\]\)/);
  assert.match(world, /gl\.R8/); assert.match(world, /gl\.REPEAT/); assert.match(world, /deleteTexture/);
  assert.equal((world.match(/texImage2D/g) ?? []).length, 1, 'cloud upload has more than one owner');
  assert.match(policy, /SHOOTING_STAR_SLOT_MS = 300_000/); assert.match(policy, /CLOUD_WRAP_MS = 3_000_000/);
  assert.match(policy, /MAX_CELESTIAL_FRAME_MS = 100/); assert.match(projection, /normalizeCelestialProjection/);
  assert.match(app, /mode !== 'memory' && mode !== 'trophies'/);
  assert.match(history, /makeRenderer\(world\.seed, 'history'\)/);
  for (const source of [renderer, world, fallback, canvasSky]) assert.doesNotMatch(source, /Math\.random|setInterval|setTimeout|requestAnimationFrame/);
  assert.doesNotMatch(policy, /runtime-speed|game\/|simulation\/|reward|score|echo/i);
});
