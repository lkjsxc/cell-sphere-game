/** Risk protected: suitability curves shape every tick; they must be bounded,
 *  smooth, and deterministic. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clamp, clamp01, smoothstep, smootherstep, tolerance, approach } from '../../src/core/math.js';

test('clamp family', () => {
  assert.equal(clamp(5, 0, 3), 3);
  assert.equal(clamp(-1, 0, 3), 0);
  assert.equal(clamp(2, 0, 3), 2);
  assert.equal(clamp01(1.4), 1);
  assert.equal(clamp01(-0.2), 0);
});

test('smoothstep endpoints and monotonicity', () => {
  assert.equal(smoothstep(0), 0);
  assert.equal(smoothstep(1), 1);
  assert.equal(smoothstep(0.5), 0.5);
  let prev = -1;
  for (let t = 0; t <= 1.0001; t += 0.05) {
    const v = smoothstep(t);
    assert.ok(v >= prev);
    prev = v;
  }
  // Out-of-range inputs are clamped, never NaN.
  assert.equal(smoothstep(-3), 0);
  assert.equal(smoothstep(7), 1);
});

test('smootherstep endpoints', () => {
  assert.equal(smootherstep(0), 0);
  assert.equal(smootherstep(1), 1);
  assert.ok(Math.abs(smootherstep(0.5) - 0.5) < 1e-12);
});

test('tolerance bell: 1 at center, 0 outside width', () => {
  assert.equal(tolerance(0.5, 0.5, 0.2), 1);
  assert.equal(tolerance(0.3, 0.5, 0.2), 0);
  assert.equal(tolerance(0.7, 0.5, 0.2), 0);
  const mid = tolerance(0.6, 0.5, 0.2);
  assert.ok(mid > 0 && mid < 1);
});

test('approach converges without overshoot', () => {
  let v = 0;
  for (let i = 0; i < 200; i++) v = approach(v, 10, 0.5, 0.1);
  assert.ok(Math.abs(v - 10) < 0.01);
});
