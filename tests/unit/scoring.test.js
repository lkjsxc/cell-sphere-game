/** Risk protected: SCORE v3 is cumulative, monotone, and presentation-independent. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { componentValues, echoesFor, evaluate, rankFor, SCORE_MODEL_VERSION } from '../../src/game/scoring.js';

const LOW = Object.freeze({ scoreMerit: { raw: { survival: 40, exploration: 60, presence: 4,
  coherence: 3, stewardship: 40, worldmaking: 0 } }, worldPotential: 16000 });
const HIGH = Object.freeze({ scoreMerit: { raw: { survival: 300, exploration: 800, presence: 44,
  coherence: 40, stewardship: 780, worldmaking: 220 } }, worldPotential: 16000 });

test('SCORE v3 improves for cumulative authoritative merit', () => {
  const low = evaluate(LOW); const high = evaluate(HIGH);
  assert.equal(low.modelVersion, SCORE_MODEL_VERSION); assert.equal(SCORE_MODEL_VERSION, 3);
  assert.ok(high.total > low.total, `${high.total} <= ${low.total}`);
  assert.equal(high.breakdown.length, 6); assert.ok(high.breakdown.every((part) => part.points >= 0));
  assert.equal(high.rank, rankFor(high.total));
});

test('components stay normalized and presentation state cannot affect SCORE', () => {
  const values = componentValues(HIGH);
  assert.ok(Object.values(values).every((value) => value >= 0 && value <= 1));
  assert.deepEqual(evaluate(HIGH), evaluate({ ...HIGH, language: 'ja', quality: 'eco', fps: 12, speed: 256 }));
});

test('every cumulative axis and World Potential are monotone', () => {
  let previous = 0;
  for (let step = 0; step <= 20; step++) {
    const raw = Object.fromEntries(Object.keys(HIGH.scoreMerit.raw).map((key) => [key, HIGH.scoreMerit.raw[key] * step / 20]));
    const score = evaluate({ scoreMerit: { raw }, worldPotential: 16000 + step * 1000 }).total;
    assert.ok(score >= previous, `${score} < ${previous} at ${step}`); previous = score;
  }
});

test('Echoes follow the recalibrated bounded progression curve', () => {
  assert.equal(echoesFor(0), 8); assert.equal(echoesFor(10000), 19);
  assert.ok(echoesFor(25000) >= 22 && echoesFor(25000) <= 30);
  assert.ok(echoesFor(100000) >= 38 && echoesFor(100000) <= 52);
  assert.ok(echoesFor(1000000) >= 105 && echoesFor(1000000) <= 135);
  assert.equal(echoesFor(100000), echoesFor(100000));
});
