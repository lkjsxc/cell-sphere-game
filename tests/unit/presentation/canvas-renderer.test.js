/** Focused Canvas 2D path and clipping regressions. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Canvas2DRenderer } from '../../../src/rendering/fallback2d.js';
import { LIFE_EDGE_STYLE_COUNT } from '../../../src/rendering/life-edges.js';

test('Canvas Evolution boundaries clip crossing segments at the globe limb', () => {
  const calls = []; const ctx = {
    beginPath() { calls.push(['begin']); },
    moveTo(x, y) { calls.push(['move', x, y]); },
    lineTo(x, y) { calls.push(['line', x, y]); },
    setLineDash(value) { calls.push(['dash', ...value]); },
    stroke() { calls.push(['stroke']); },
  };
  const renderer = {
    ctx,
    dual: { boundaryCornerA: Uint16Array.from([0]), boundaryCornerB: Uint16Array.from([1]) },
    cornerFacing: Float32Array.from([-.25, .75]),
    cornerX: Float32Array.from([0, 10]), cornerY: Float32Array.from([4, 8]),
    lifeEdgeBatchCounts: new Uint16Array(LIFE_EDGE_STYLE_COUNT),
    lifeEdgeBatches: Array.from({ length: LIFE_EDGE_STYLE_COUNT }, () => new Uint16Array(1)),
    edgeMode: 'evolution',
  };
  renderer.lifeEdgeBatchCounts[5] = 1;
  Canvas2DRenderer.prototype.drawLifeBoundaries.call(renderer, 1);
  const move = calls.find(([name]) => name === 'move');
  const line = calls.find(([name]) => name === 'line');
  assert.deepEqual(move, ['move', 2.5, 5]);
  assert.deepEqual(line, ['line', 10, 8]);
  assert.ok(calls.some(([name]) => name === 'stroke'));
});

test('Canvas World boundaries retain the predecessor whole-segment limb cull', () => {
  const calls = []; const ctx = {
    beginPath() {}, moveTo() { calls.push('move'); }, lineTo() { calls.push('line'); },
    setLineDash() {}, stroke() {},
  };
  const renderer = {
    ctx,
    dual: { boundaryCornerA: Uint16Array.from([0]), boundaryCornerB: Uint16Array.from([1]) },
    cornerFacing: Float32Array.from([-.25, .75]),
    cornerX: Float32Array.from([0, 10]), cornerY: Float32Array.from([4, 8]),
    lifeEdgeBatchCounts: new Uint16Array(LIFE_EDGE_STYLE_COUNT),
    lifeEdgeBatches: Array.from({ length: LIFE_EDGE_STYLE_COUNT }, () => new Uint16Array(1)),
    edgeMode: 'world',
  };
  renderer.lifeEdgeBatchCounts[1] = 1;
  Canvas2DRenderer.prototype.drawLifeBoundaries.call(renderer, 1);
  assert.deepEqual(calls, []);
});
