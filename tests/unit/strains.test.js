/** Risk protected: trait merging feeds the whole simulation; unknown keys
 *  must fail loudly and merge semantics must be unambiguous. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { baseTraits, traitsFor, STRAINS } from '../../src/game/strains.js';

test('base traits are neutral', () => {
  const t = baseTraits();
  assert.equal(t.reach, 1);
  assert.equal(t.uptake, 1);
  assert.equal(t.signalCharges, 0);
  assert.equal(t.anastomosis, 0);
});

test('three strains exist with distinct profiles', () => {
  assert.equal(STRAINS.length, 3);
  const ids = new Set(STRAINS.map((s) => s.id));
  assert.deepEqual([...ids], ['pioneer', 'conservator', 'weaver']);
  for (const s of STRAINS) {
    assert.ok(s.nameJa.length > 0);
    assert.ok(s.descJa.length > 0);
  }
});

test('strain mods replace neutral multipliers', () => {
  const t = traitsFor('pioneer');
  assert.equal(t.reach, 1.4);
  assert.equal(t.uptake, 1.0); // untouched stays neutral
});

test('unknown strain falls back to the first strain', () => {
  const t = traitsFor('nope');
  assert.equal(t.reach, STRAINS[0].mods.reach);
});

test('memory effects multiply multipliers and add flags', () => {
  const t = traitsFor('conservator', { reach: 1.1, signalCharges: 1, anastomosis: 1 });
  assert.ok(Math.abs(t.reach - 0.8 * 1.1) < 1e-9);
  assert.equal(t.signalCharges, 1);
  assert.equal(t.anastomosis, 1);
});

test('unknown trait keys throw', () => {
  assert.throws(() => traitsFor('pioneer', { bogus: 2 }), /unknown trait/);
});
