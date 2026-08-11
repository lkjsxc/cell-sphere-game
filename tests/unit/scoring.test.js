/** SCORE v6 is realized-only, exact at authority boundaries, and presentation-independent. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addProgressionIntegers, compareProgressionIntegers, divideProgressionIntegers, sqrtProgressionInteger } from '../../src/core/progression-integer.js';
import { componentValues, echoesFor, evaluate, rankFor, scoreResultMatchesAuthority, SCORE_MODEL_VERSION } from '../../src/game/scoring.js';

const LOW = Object.freeze({ scoreMerit: { raw: { survival: 40, exploration: 6, presence: 4, coherence: 3, stewardship: 4, worldmaking: 0 } } });
const HIGH = Object.freeze({ scoreMerit: { raw: { survival: 300, exploration: 180, presence: 30, coherence: 28, stewardship: 170, worldmaking: 90 } } });
test('SCORE v6 improves for cumulative realized merit without a predictive multiplier', () => {
  const low = evaluate(LOW); const high = evaluate(HIGH);
  assert.equal(SCORE_MODEL_VERSION, 6); assert.equal(low.modelVersion, SCORE_MODEL_VERSION);
  assert.ok(compareProgressionIntegers(high.total, low.total) > 0); assert.equal(high.breakdown.length, 6);
  assert.ok(high.breakdown.every((part) => /^[0-9]+$/.test(part.points))); assert.equal('predictiveMultiplier' in high, false);
  assert.deepEqual(high.rank, rankFor(high.total));
});
test('predictive or presentation fields cannot alter realized SCORE', () => {
  const base = evaluate(HIGH); const input = { ...HIGH, predictiveMultiplier: `9${'0'.repeat(1000)}`, forecastVersion: 99, fps: 12, speed: 256, camera: 'lost' };
  const decorated = evaluate(input); assert.deepEqual(decorated, base); assert.deepEqual(componentValues(HIGH), componentValues(input));
});
test('current Result projection equals recomputed authority and rejects a forged score', () => {
  const score = evaluate(HIGH); const result = { ...HIGH, scoreModelVersion: SCORE_MODEL_VERSION, score: score.total, scoreProjection: score, survivalSeconds: 300 };
  assert.equal(scoreResultMatchesAuthority(result), true);
  assert.equal(scoreResultMatchesAuthority({ ...result, scoreProjection: { ...score, total: `1${'0'.repeat(1000)}` } }), false);
});
test('each cumulative realized axis is monotone', () => {
  let previous = '0';
  for (let step = 0; step <= 20; step++) {
    const raw = Object.fromEntries(Object.keys(HIGH.scoreMerit.raw).map((key) => [key, HIGH.scoreMerit.raw[key] * step / 20]));
    const score = evaluate({ scoreMerit: { raw } }).total; assert.ok(compareProgressionIntegers(score, previous) >= 0); previous = score;
  }
});
test('Echoes use the current realized conversion and remain exact for huge SCORE', () => {
  assert.equal(echoesFor('0'), '5'); assert.ok(compareProgressionIntegers(echoesFor('10000'), '5') > 0);
  const huge = `1${'0'.repeat(1000)}`; const reward = echoesFor(huge); const root = sqrtProgressionInteger(divideProgressionIntegers(huge, '1000'));
  assert.equal(reward, addProgressionIntegers('5', root)); assert.ok(reward.length > 400);
});
test('Environment credit requires sustained realized pressure performance', () => {
  const instant = evaluate({ ...HIGH, environmentExposure: exposure('20', '20000000', '20000000', '20') });
  const exposed = evaluate({ ...HIGH, environmentExposure: exposure('3000', '3000000000', '3000000000', '900') });
  assert.equal(instant.environmentCredit.bonus, 0); assert.ok(exposed.environmentCredit.bonus > 0 && exposed.environmentCredit.bonus <= .12);
  assert.ok(compareProgressionIntegers(exposed.total, instant.total) > 0);
});
test('ranks continue procedurally after named onboarding ranks', () => {
  assert.equal(rankFor('999999').en, 'World Gardener'); assert.equal(rankFor('1000000').en, 'Living World');
  assert.equal(rankFor('2500000').en, 'Living World · Cycle 2'); assert.equal(rankFor(`1${'0'.repeat(100)}`).cycle.length > 1, true);
});
function exposure(totalTicks, pressureTicksQ, qualityPressureTicksQ, timeAtPeakTicks) { return { version: 2, totalTicks, pressureTicksQ, qualityPressureTicksQ, timeAtPeakTicks, peakPressureQ: 1_000_000, currentLevel: '4' }; }
