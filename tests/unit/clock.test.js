/** Risk protected: speed changes must only scale tick counts, and suspended
 *  tabs must not create unbounded catch-up work. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClock, advanceClock } from '../../src/core/clock.js';
import { advanceTimeDial, createTimeDialState, visualDialRate } from '../../src/interface/policies/time-dial.js';
import { pauseLabel } from '../../src/interface/pause-control.js';

test('1x: 100ms yields exactly 1 tick at 10Hz', () => {
  const c = createClock(10);
  assert.equal(advanceClock(c, 100, 1, 1000), 1);
  assert.equal(advanceClock(c, 99, 1, 1000), 0);
  assert.equal(advanceClock(c, 1, 1, 1000), 1); // 200ms accumulated total
});

test('speed multiplies game time only', () => {
  const c = createClock(10);
  assert.equal(advanceClock(c, 1000, 32, 10000), 320);
});

test('paused speed yields nothing and accumulates nothing', () => {
  const c = createClock(10);
  assert.equal(advanceClock(c, 1000, 0, 1000), 0);
  assert.equal(c.accMs, 0);
});

test('maxTicks caps catch-up and drops backlog', () => {
  const c = createClock(10);
  // Simulate a 10s suspend at 32x: 3200 ticks wanted, cap 500.
  const ticks = advanceClock(c, 10000, 32, 500);
  assert.equal(ticks, 500);
  assert.equal(c.accMs, 0);
});

test('fractional accumulation is preserved across slices', () => {
  const c = createClock(10);
  let total = 0;
  for (let i = 0; i < 100; i++) total += advanceClock(c, 33, 1, 100);
  // 3300ms at 10Hz = 33 ticks exactly.
  assert.equal(total, 33);
});

test('both visual dial hands move, freeze, and resume from one bounded phase', () => {
  const state = createTimeDialState(60); const start = advanceTimeDial(state, 0, { running: true, speed: 1 });
  const moving = advanceTimeDial(state, 100, { running: true, speed: 1 });
  assert.ok(moving.minute > start.minute); assert.ok(moving.hour > start.hour);
  assert.ok(moving.minute - start.minute > moving.hour - start.hour);
  const frozen = advanceTimeDial(state, 1100, { running: true, paused: true, speed: 32 });
  assert.deepEqual(frozen, moving); const resumed = advanceTimeDial(state, 1200, { running: true, speed: 32 });
  assert.ok(resumed.minute > frozen.minute); assert.ok(resumed.minute - frozen.minute < 50);
  const reduced = advanceTimeDial(state, 1300, { running: true, reduced: true, speed: 32 });
  assert.ok(reduced.minute > resumed.minute); assert.ok(reduced.hour > resumed.hour);
  assert.ok(reduced.minute - resumed.minute < resumed.minute - frozen.minute);
  assert.ok(visualDialRate(32) > visualDialRate(1));
  assert.ok(visualDialRate(1, true) < visualDialRate(1));
  assert.equal(visualDialRate(32, true), visualDialRate(1, true), 'reduced motion depended on game speed');
  assert.equal(visualDialRate(32), visualDialRate(16), '32x exceeded the visual cap');
});

test('time dial labels explain the owner without releasing another lease', () => {
  assert.equal(pauseLabel(new Set()), 'Pause world time');
  assert.equal(pauseLabel(new Set(['manual'])), 'Resume world time');
  assert.match(pauseLabel(new Set(['manual', 'panel'])), /panel/);
  assert.match(pauseLabel(new Set(['worker-failed'])), /unavailable/);
});
