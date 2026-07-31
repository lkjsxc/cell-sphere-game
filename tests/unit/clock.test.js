/** Risk protected: speed changes must only scale tick counts, and suspended
 *  tabs must not create unbounded catch-up work. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClock, advanceClock } from '../../src/core/clock.js';

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
