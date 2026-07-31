/** Risk protected: nondeterministic or biased randomness would corrupt every
 *  golden test and every shared seed. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../../src/core/prng.js';

test('same seed produces identical sequences', () => {
  const a = createRng(12345);
  const b = createRng(12345);
  for (let i = 0; i < 1000; i++) {
    assert.equal(a.nextU32(), b.nextU32(), `diverged at ${i}`);
  }
});

test('different seeds diverge immediately', () => {
  const a = createRng(1);
  const b = createRng(2);
  let same = 0;
  for (let i = 0; i < 100; i++) if (a.nextU32() === b.nextU32()) same++;
  assert.ok(same < 3, `too many collisions: ${same}`);
});

test('float stays in [0,1)', () => {
  const r = createRng(999);
  for (let i = 0; i < 10000; i++) {
    const v = r.float();
    assert.ok(v >= 0 && v < 1, `out of range: ${v}`);
  }
});

test('intBelow stays in range', () => {
  const r = createRng(7);
  for (let i = 0; i < 10000; i++) {
    const v = r.intBelow(17);
    assert.ok(Number.isInteger(v) && v >= 0 && v < 17);
  }
});

test('distribution sanity: chi-square-ish bucket spread', () => {
  const r = createRng(4242);
  const buckets = new Array(10).fill(0);
  const n = 100000;
  for (let i = 0; i < n; i++) buckets[r.intBelow(10)]++;
  const expected = n / 10;
  for (const count of buckets) {
    assert.ok(Math.abs(count - expected) < expected * 0.05,
      `bucket off: ${count} vs ${expected}`);
  }
});

test('state save/restore reproduces the future', () => {
  const r = createRng(555);
  for (let i = 0; i < 50; i++) r.nextU32();
  const st = r.state();
  const future = [r.nextU32(), r.nextU32(), r.nextU32()];
  r.setState(st);
  assert.deepEqual([r.nextU32(), r.nextU32(), r.nextU32()], future);
});

test('all outputs are unsigned 32-bit', () => {
  const r = createRng(2026);
  for (let i = 0; i < 5000; i++) {
    const v = r.nextU32();
    assert.ok(v >= 0 && v <= 0xffffffff && Number.isInteger(v));
  }
});
