/** Risk protected: shared seeds must round-trip through human input,
 *  including phone-typed confusables. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeSeedCode, decodeSeedCode, SEED_MAX, randomSeed } from '../../src/core/seed-code.js';
import { createRng } from '../../src/core/prng.js';

test('round trip at boundaries and samples', () => {
  for (const seed of [0, 1, 31, 32, 1000, 123456789, SEED_MAX - 1]) {
    const code = encodeSeedCode(seed);
    assert.match(code, /^[0-9A-HJKMNP-TV-Z]{3}-[0-9A-HJKMNP-TV-Z]{3}$/, `bad code ${code}`);
    assert.equal(decodeSeedCode(code), seed, `round trip failed for ${seed}`);
  }
});

test('exhaustive small-range round trip', () => {
  for (let seed = 0; seed < 4096; seed++) {
    assert.equal(decodeSeedCode(encodeSeedCode(seed)), seed);
  }
});

test('decode is case-insensitive and forgives confusables', () => {
  const code = encodeSeedCode(777000);
  assert.equal(decodeSeedCode(code.toLowerCase()), 777000);
  assert.equal(decodeSeedCode(code.replace('-', ' ')), 777000);
  // I->1, L->1, O->0 substitutions decode to the same value.
  const tricky = code.replaceAll('1', 'I').replaceAll('0', 'O');
  assert.equal(decodeSeedCode(tricky), 777000);
});

test('invalid input returns null, never throws', () => {
  for (const bad of [null, undefined, 42, '', 'ABC', 'ABC-DEFG', '!!!!-@@@', 'U U U-U U U']) {
    assert.equal(decodeSeedCode(bad), null, `expected null for ${String(bad)}`);
  }
});

test('encode rejects out-of-range seeds', () => {
  assert.throws(() => encodeSeedCode(-1));
  assert.throws(() => encodeSeedCode(SEED_MAX));
  assert.throws(() => encodeSeedCode(1.5));
});

test('randomSeed stays within 30 bits', () => {
  const r = createRng(31337);
  for (let i = 0; i < 1000; i++) {
    const s = randomSeed(r);
    assert.ok(s >= 0 && s < SEED_MAX);
  }
});
