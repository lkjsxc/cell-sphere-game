import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ENVIRONMENT_LEVEL_VERSION,
  frontierAfterEnvironmentCompletion,
  legacyEnvironmentFrontierForRuns,
  recommendedEnvironmentLevel,
  resolveEnvironmentAttempt,
} from '../../src/game/environment-level.js';
import {
  CHALLENGE_PROFILE_VERSION,
  MAX_EVENTS_PER_WORLD,
  MIN_TELEGRAPH_TICKS,
  challengeProfileHash,
  compileChallengeProfile,
  pressureForNetRating,
  validateChallengeProfile,
} from '../../src/simulation/challenge-profile.js';

const undefended = Object.freeze({ affinityDefense: Object.freeze({
  Fertility: '0', Freshwater: '0', Scarcity: '0', Cryogenic: '0', Marine: '0', Luminous: '0',
}) });

test('Environment Level frontier protects worlds one and two then recommends Level 1', () => {
  assert.equal(ENVIRONMENT_LEVEL_VERSION, 1);
  assert.equal(recommendedEnvironmentLevel({ runs: '0', highestEnvironmentLevel: '0' }), '0');
  assert.equal(frontierAfterEnvironmentCompletion({ runs: '0', highestEnvironmentLevel: '0' }, '0'), '1');
  assert.equal(recommendedEnvironmentLevel({ runs: '1', highestEnvironmentLevel: '1' }), '0');
  assert.equal(recommendedEnvironmentLevel({ runs: '2', highestEnvironmentLevel: '1' }), '1');
  assert.equal(resolveEnvironmentAttempt({ runs: '1', highestEnvironmentLevel: '99' }, { mode: 'advance' }).reason, 'protected-onboarding');
});

test('completion advances exactly one frontier while retry and lower selection do not skip', () => {
  const meta = { runs: '8', highestEnvironmentLevel: '7' };
  assert.equal(frontierAfterEnvironmentCompletion(meta, '7'), '8');
  assert.equal(frontierAfterEnvironmentCompletion(meta, '6'), '7');
  assert.deepEqual(resolveEnvironmentAttempt(meta, { mode: 'retry', environmentLevel: '7' }), {
    ok: true, reason: 'environment-retry', mode: 'retry', environmentLevel: '7', highestEnvironmentLevel: '7',
  });
  assert.equal(resolveEnvironmentAttempt(meta, { mode: 'select', environmentLevel: '6' }).ok, true);
  assert.equal(resolveEnvironmentAttempt(meta, { mode: 'select', environmentLevel: '8' }).reason, 'environment-level-locked');
});

test('legacy finite campaigns receive a conservative explicit frontier idempotently', () => {
  assert.deepEqual(['0','1','2','3','4','5','10','11','9007199254740993'].map(legacyEnvironmentFrontierForRuns),
    ['0','0','1','2','2','2','3','4','4']);
});

test('Level 0 has no harmful events and fresh Level 1 preserves the mild pressure anchor', () => {
  const zero = compileChallengeProfile({ environmentLevel: '0', evolution: undefended });
  const one = compileChallengeProfile({ environmentLevel: '1', evolution: undefended });
  assert.equal(CHALLENGE_PROFILE_VERSION, 1); assert.equal(zero.events.count, 0);
  assert.equal(one.dimensions.events.pressure, 0.35); assert.equal(one.events.count, 1);
  assert.equal(one.events.earliestStartTick, 2400); assert.deepEqual([one.events.intensityMin, one.events.intensityMax], [0.5, 0.7]);
  assert.equal(one.events.telegraphTicks, MIN_TELEGRAPH_TICKS);
});

test('fixed Evolution pressure is monotone across directly compiled Environment Levels', () => {
  const levels = ['0','1','2','10','100','1000','9007199254740992','9007199254740993',`1${'0'.repeat(999)}`];
  let previous = -1;
  for (const level of levels) {
    const profile = compileChallengeProfile({ environmentLevel: level, evolution: undefended });
    assert.ok(profile.dimensions.events.pressure >= previous, `${level} became easier`);
    assert.ok(Object.values(profile.coefficients).every(Number.isFinite));
    assert.ok(profile.events.count >= 0 && profile.events.count <= MAX_EVENTS_PER_WORLD);
    assert.ok(profile.events.telegraphTicks >= MIN_TELEGRAPH_TICKS);
    previous = profile.dimensions.events.pressure;
  }
});

test('matched multi-affinity defense can contest later levels without nonfinite runtime values', () => {
  const rating = '1000000';
  const evolution = { affinityDefense: { Fertility:rating, Freshwater:rating, Scarcity:rating,
    Cryogenic:rating, Marine:rating, Luminous:rating } };
  const profile = compileChallengeProfile({ environmentLevel: '1000', evolution });
  assert.ok(Object.values(profile.dimensions).every((dimension) => dimension.netRating === '0' && dimension.pressure === 0));
  assert.equal(profile.coefficients.renewalScale, 1); assert.equal(profile.events.count, 1);
});

test('compiler hashes are deterministic, defense-sensitive, and validation rejects tampering', () => {
  const a = compileChallengeProfile({ environmentLevel: '10', evolution: undefended });
  const b = compileChallengeProfile({ environmentLevel: '10', evolution: undefended });
  const defended = compileChallengeProfile({ environmentLevel: '10', evolution: {
    affinityDefense: Object.fromEntries(Object.keys(undefended.affinityDefense).map((key) => [key, '5000'])) } });
  assert.deepEqual(a, b); assert.equal(a.hash, challengeProfileHash(a)); assert.notEqual(a.hash, defended.hash);
  assert.deepEqual(validateChallengeProfile(a), a);
  assert.equal(validateChallengeProfile({ ...a, hash: '00000000' }).environmentLevel, '0');
});

test('rating projection is bounded and never requires Number conversion of a huge decimal', () => {
  assert.equal(pressureForNetRating('0'), 0); assert.equal(pressureForNetRating('1000'), 0.35);
  const huge = pressureForNetRating(`9${'9'.repeat(999)}`);
  assert.ok(Number.isFinite(huge) && huge > 0.999 && huge <= 1);
});
