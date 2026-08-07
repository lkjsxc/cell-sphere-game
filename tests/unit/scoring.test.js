/** SCORE v5 exact, cumulative dynamic-exposure-gated, and presentation-independent. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareProgressionIntegers } from '../../src/core/progression-integer.js';
import {componentValues,echoesFor,evaluate,rankFor,scoreResultMatchesAuthority,SCORE_MODEL_VERSION} from '../../src/game/scoring.js';

const LOW = Object.freeze({ scoreMerit: { raw: { survival: 40, exploration: 60, presence: 4,
  coherence: 3, stewardship: 40, worldmaking: 0 } }, worldPotential: '16000' });
const HIGH = Object.freeze({ scoreMerit: { raw: { survival: 300, exploration: 800, presence: 44,
  coherence: 40, stewardship: 780, worldmaking: 220 } }, worldPotential: '16000' });

test('SCORE v5 improves exactly for cumulative authoritative merit', () => {
  const low = evaluate(LOW); const high = evaluate(HIGH);
  assert.equal(low.modelVersion, SCORE_MODEL_VERSION); assert.equal(SCORE_MODEL_VERSION, 5);
  assert.ok(compareProgressionIntegers(high.total, low.total) > 0, `${high.total} <= ${low.total}`);
  assert.equal(high.breakdown.length, 6); assert.ok(high.breakdown.every((part) => BigInt(part.points) >= 0n));
  assert.deepEqual(high.rank, rankFor(high.total));
});

test('maximum-width Potential scores exactly without oversized intermediates or rank labels',()=>{
  const worldPotential='9'.repeat(4070),score=evaluate({...HIGH,worldPotential});
  assert.ok(score.total.length<=4096);assert.match(score.total,/^[1-9]\d*$/);assert.ok(score.echoes.length<score.total.length);
  assert.ok(score.rank.en.length<64);assert.equal(score.rank.cycle.length>1000,true);
});

test('current Result projection must equal recomputed authoritative merit',()=>{const score=evaluate(HIGH),result={...HIGH,
  scoreModelVersion:SCORE_MODEL_VERSION,score:score.total,scoreProjection:score,survivalSeconds:300};
 assert.equal(scoreResultMatchesAuthority(result),true);
 assert.equal(scoreResultMatchesAuthority({...result,scoreProjection:{...score,total:`1${'0'.repeat(1000)}`}}),false);
});

test('components stay normalized and presentation state cannot affect SCORE', () => {
  const values = componentValues(HIGH);
  assert.ok(Object.values(values).every((value) => value >= 0 && value <= 1));
  assert.deepEqual(evaluate(HIGH), evaluate({ ...HIGH, language: 'ja', quality: 'eco', fps: 12, speed: 256 }));
});

test('every cumulative axis and exact World Potential are monotone beyond 2^53', () => {
  let previous = '0';
  for (let step = 0; step <= 20; step++) {
    const raw = Object.fromEntries(Object.keys(HIGH.scoreMerit.raw).map((key) => [key, HIGH.scoreMerit.raw[key] * step / 20]));
    const worldPotential = String(16_000n + BigInt(step) * 1_000_000_000_000_000n);
    const score = evaluate({ scoreMerit: { raw }, worldPotential }).total;
    assert.ok(compareProgressionIntegers(score, previous) >= 0, `${score} < ${previous} at ${step}`); previous = score;
  }
});

test('Echoes retain early anchors and remain exact for huge SCORE', () => {
  assert.equal(echoesFor('0'), '8'); assert.equal(echoesFor('10000'), '19');
  assert.ok(BigInt(echoesFor('25000')) >= 22n && BigInt(echoesFor('25000')) <= 30n);
  assert.ok(BigInt(echoesFor('100000')) >= 38n && BigInt(echoesFor('100000')) <= 52n);
  assert.ok(BigInt(echoesFor('1000000')) >= 105n && BigInt(echoesFor('1000000')) <= 135n);
  const huge = `1${'0'.repeat(1000)}`; const reward = BigInt(echoesFor(huge)) - 8n;
  const quotient = BigInt(huge) / 80n;
  assert.ok(reward * reward <= quotient && (reward + 1n) * (reward + 1n) > quotient);
  assert.ok(echoesFor(huge).length > 400);
});

test('Environment credit requires meaningful sustained dynamic exposure and demonstrated quality', () => {
  const instant = evaluate({ ...HIGH, environmentExposure: exposure('20', '20000000', '20000000', '20') });
  const exposed = evaluate({ ...HIGH, environmentExposure: exposure('3000', '3000000000', '3000000000', '900') });
  assert.equal(instant.environmentCredit.bonus, 0);
  assert.ok(exposed.environmentCredit.bonus > 0 && exposed.environmentCredit.bonus <= .2);
  assert.ok(compareProgressionIntegers(exposed.total, instant.total) > 0);
});

function exposure(totalTicks, pressureTicksQ, qualityPressureTicksQ, timeAtPeakTicks) {
  return { version: 2, totalTicks, pressureTicksQ, qualityPressureTicksQ, timeAtPeakTicks,
    peakPressureQ: 1_000_000, currentLevel: '4' };
}

test('ranks continue procedurally after named onboarding ranks', () => {
  assert.equal(rankFor('999999').en, 'World Gardener');
  assert.equal(rankFor('1000000').en, 'Living World');
  assert.equal(rankFor('2500000').en, 'Living World · Cycle 2');
  assert.equal(rankFor(`1${'0'.repeat(100)}`).cycle.length > 1, true);
});
