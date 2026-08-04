/** Risk protected: score must be pure, bounded, and independent of presentation. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { componentValues, echoesFor, evaluate, rankFor } from '../../src/game/scoring.js';

const LOW = Object.freeze({
  survivalSeconds: 80, peakCoverage: 0.08, sustainedCoverage: 0.03,
  peakConnectedShare: 0.3, totalUptake: 20, totalMaintenance: 40, stressBurden: .8, worldPotential: 16000,
});
const HIGH = Object.freeze({
  survivalSeconds: 300, peakCoverage: 0.7, sustainedCoverage: 0.5,
  peakConnectedShare: 0.95, totalUptake: 500, totalMaintenance: 80, stressBurden: .1, worldPotential: 16000,
});

test('SCORE improves for stronger authoritative metrics', () => {
  const low = evaluate(LOW);
  const high = evaluate(HIGH);
  assert.ok(high.total > low.total, `${high.total} <= ${low.total}`);
  assert.equal(high.breakdown.length, 6);
  assert.ok(high.breakdown.every((part) => part.points >= 0));
  assert.equal(high.rank, rankFor(high.total));
});

test('components stay normalized and no score input is presentation state', () => {
  const values = componentValues(HIGH);
  assert.ok(Object.values(values).every((value) => value >= 0 && value <= 1));
  assert.deepEqual(evaluate(HIGH), evaluate({ ...HIGH, language: 'ja', quality: 'eco', fps: 12 }));
});

test('Echoes are deterministic, nonnegative, and monotonic', () => {
  assert.equal(echoesFor(0), 4);
  assert.ok(echoesFor(100000) >= 28 && echoesFor(100000) <= 40);
  assert.ok(echoesFor(100000) > echoesFor(1000));
  assert.equal(echoesFor(100000), echoesFor(100000));
});
