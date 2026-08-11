import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ENVIRONMENT_LEVEL_DOCUMENT_DIGIT_LIMIT,
  ENVIRONMENT_LEVEL_OPENING_TICKS,
  ENVIRONMENT_LEVEL_VERSION,
  ENVIRONMENT_SCHEDULE_HASH,
  ENVIRONMENT_SCHEDULE_VERSION,
  environmentLevelAtTick,
  environmentProgressAtTick,
  environmentScheduleAtTick,
  environmentTickForLevel,
  validateEnvironmentScheduleState,
} from '../../src/game/environment-level.js';
import {
  CHALLENGE_PROFILE_VERSION,
  environmentProfileHash,
  compileChallengeProfile,
  pressureForNetRating,
  validateChallengeProfile,
} from '../../src/simulation/challenge-profile.js';

const undefended = Object.freeze({ affinityDefense: Object.freeze({
  Fertility: '0', Freshwater: '0', Scarcity: '0', Cryogenic: '0', Marine: '0', Luminous: '0',
}) });

test('Environment Level schedule starts every world at zero and crosses exact thresholds', () => {
  assert.equal(ENVIRONMENT_LEVEL_VERSION, 2);
  assert.equal(environmentLevelAtTick('0'), '0'); assert.equal(environmentLevelAtTick('1199'), '0');
  assert.equal(environmentTickForLevel('0'), '0'); assert.equal(environmentTickForLevel('1'), ENVIRONMENT_LEVEL_OPENING_TICKS);
  assert.equal(environmentTickForLevel('2'), '1800'); assert.equal(environmentTickForLevel('3'), '2400');
  assert.equal(environmentLevelAtTick('1200'), '1'); assert.equal(environmentLevelAtTick('1799'), '1');
  assert.equal(environmentLevelAtTick('1800'), '2');
  const initial = environmentScheduleAtTick('0');
  assert.equal(initial.currentEnvironmentLevel, '0'); assert.equal(initial.environmentLevelStartTick, '0');
  assert.equal(initial.nextEnvironmentLevelTick, ENVIRONMENT_LEVEL_OPENING_TICKS); assert.equal(initial.environmentLevelProgressQ, 0);
});

test('schedule is monotone and direct threshold inversion holds without a level table', () => {
  const levels = ['0', '1', '2', '3', '4', '32', '9007199254740992', '9007199254740993', `1${'0'.repeat(999)}`];
  let priorTick = null;
  for (const level of levels) {
    const tick = environmentTickForLevel(level); assert.equal(environmentLevelAtTick(tick), level);
    if (priorTick !== null) assert.ok(BigInt(tick) > BigInt(priorTick), `${level} threshold did not advance`);
    priorTick = tick;
  }
});

test('schedule progress is bounded, deterministic, and resets at each transition', () => {
  const before = environmentProgressAtTick('1199'); assert.equal(before.currentEnvironmentLevel, '0');
  assert.equal(before.ticksIntoLevel, '1199'); assert.ok(before.environmentLevelProgressQ > 990_000);
  const atOne = environmentProgressAtTick('1200'); assert.equal(atOne.currentEnvironmentLevel, '1');
  assert.equal(atOne.ticksIntoLevel, '0'); assert.equal(atOne.environmentLevelProgressQ, 0);
  const middle = environmentProgressAtTick('1500'); assert.equal(middle.currentEnvironmentLevel, '1');
  assert.equal(middle.environmentLevelProgressQ, 500_000); assert.equal(middle.ticksUntilNextLevel, '300');
});

test('schedule validation derives state and rejects forged redundant fields', () => {
  const state = environmentScheduleAtTick('2401'); const valid = validateEnvironmentScheduleState(state);
  assert.equal(valid.valid, true); assert.equal(valid.environmentScheduleVersion, ENVIRONMENT_SCHEDULE_VERSION);
  assert.equal(valid.environmentScheduleHash, ENVIRONMENT_SCHEDULE_HASH);
  const forged = validateEnvironmentScheduleState({ ...state, currentEnvironmentLevel: '999' });
  assert.equal(forged.valid, false); assert.equal(forged.currentEnvironmentLevel, '3');
});

test('huge canonical schedule values remain exact and expose only finite progress', () => {
  const level = `9${'0'.repeat(ENVIRONMENT_LEVEL_DOCUMENT_DIGIT_LIMIT - 2)}`; const tick = environmentTickForLevel(level);
  const state = environmentScheduleAtTick(tick); assert.equal(state.currentEnvironmentLevel, level);
  assert.equal(state.environmentLevelProgressQ, 0); assert.ok(state.nextEnvironmentLevelTick.length >= tick.length);
  assert.equal(environmentLevelAtTick(state.nextEnvironmentLevelTick), (BigInt(level) + 1n).toString());
});

test('direct chronic pressure compiler remains finite over schedule-produced huge levels', () => {
  const levels = ['0', '1', '2', '10', '100', '1000', '9007199254740992', `1${'0'.repeat(999)}`];
  let previous = -1;
  for (const level of levels) {
    const profile = compileChallengeProfile({ environmentLevel: level, evolution: undefended });
    assert.ok(profile.dimensions.maintenance.pressure >= previous, `${level} became easier`);
    assert.ok(Object.values(profile.coefficients).every(Number.isFinite)); assert.equal('events' in profile, false);
    previous = profile.dimensions.maintenance.pressure;
  }
});

test('post-ramp exact magnitude continues to worsen bounded attrition without a terminal cap', () => {
  const ordinary = compileChallengeProfile({ environmentLevel: '64', evolution: undefended });
  const high = compileChallengeProfile({ environmentLevel: '1000000', evolution: undefended });
  const huge = compileChallengeProfile({ environmentLevel: `1${'0'.repeat(999)}`, evolution: undefended });
  assert.equal(ordinary.dimensions.maintenance.pressure, high.dimensions.maintenance.pressure);
  assert.ok(high.coefficients.attritionScale > ordinary.coefficients.attritionScale);
  assert.ok(huge.coefficients.attritionScale >= high.coefficients.attritionScale);
});

test('matched multi-affinity defense mitigates public pressure without changing the schedule', () => {
  const rating = '1000000'; const evolution = { affinityDefense: { Fertility: rating, Freshwater: rating, Scarcity: rating,
    Cryogenic: rating, Marine: rating, Luminous: rating } };
  const profile = compileChallengeProfile({ environmentLevel: '1000', evolution });
  assert.ok(Object.values(profile.dimensions).every((dimension) => dimension.netRating === '0' && dimension.pressure === 0));
  assert.equal(profile.coefficients.renewalScale, 1); assert.equal(environmentLevelAtTick(environmentTickForLevel('1000')), '1000');
});

test('retired affinity-object shapes cannot alter current chronic pressure', () => {
  const baseline = compileChallengeProfile({ environmentLevel: '10', evolution: undefended });
  const retired = compileChallengeProfile({ environmentLevel: '10', evolution: { affinities: {
    Fertility: { defenseRating: '999999999', rating: '999999999' },
    Freshwater: { defenseRating: '999999999', rating: '999999999' },
  } } });
  assert.deepEqual(retired, baseline);
});

test('compiler hashes are deterministic, defense-sensitive, and validation rejects tampering', () => {
  const a = compileChallengeProfile({ environmentLevel: '10', evolution: undefended });
  const b = compileChallengeProfile({ environmentLevel: '10', evolution: undefended });
  const defended = compileChallengeProfile({ environmentLevel: '10', evolution: {
    affinityDefense: Object.fromEntries(Object.keys(undefended.affinityDefense).map((key) => [key, '5000'])) } });
  assert.deepEqual(a, b); assert.equal(a.hash, environmentProfileHash(a)); assert.notEqual(a.hash, defended.hash);
  assert.deepEqual(validateChallengeProfile(a), a); assert.equal(validateChallengeProfile({ ...a, hash: '00000000' }).environmentLevel, '0');
  assert.equal(CHALLENGE_PROFILE_VERSION, 4);
});

test('rating projection is bounded and never requires Number conversion of a huge decimal', () => {
  assert.equal(pressureForNetRating('0'), 0); assert.equal(pressureForNetRating('1000'), 0.35);
  const huge = pressureForNetRating(`9${'9'.repeat(999)}`); assert.ok(Number.isFinite(huge) && huge > 0.999 && huge <= 1);
});
