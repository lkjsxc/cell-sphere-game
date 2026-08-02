/** Closed trait model and strain merge semantics. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { baseTraits, traitsFor, STRAINS } from '../../src/game/strains.js';

test('base traits are neutral and contain no Signal authority', () => {
  const traits = baseTraits();
  assert.equal(traits.reach, 1);
  assert.equal(traits.uptake, 1);
  assert.equal(traits.anastomosis, 0);
  for (const key of Object.keys(traits)) assert.doesNotMatch(key, /signal/i);
});

test('three strains have distinct profiles', () => {
  assert.equal(STRAINS.length, 3);
  assert.deepEqual(STRAINS.map((strain) => strain.id), ['pioneer', 'conservator', 'weaver']);
  for (const strain of STRAINS) assert.ok(strain.nameJa && strain.descJa);
});

test('strain mods replace neutral multipliers', () => {
  const traits = traitsFor('pioneer');
  assert.equal(traits.reach, 1.4);
  assert.equal(traits.uptake, 1);
});

test('unknown strain falls back to Pioneer', () => {
  assert.equal(traitsFor('nope').reach, STRAINS[0].mods.reach);
});

test('memory effects multiply multipliers and add flags', () => {
  const traits = traitsFor('conservator', { reach: 1.1, anastomosis: 1 });
  assert.ok(Math.abs(traits.reach - 0.88) < 1e-9);
  assert.equal(traits.anastomosis, 1);
});

test('unknown and removed trait keys throw', () => {
  assert.throws(() => traitsFor('pioneer', { bogus: 2 }), /unknown trait/);
  assert.throws(() => traitsFor('pioneer', { signalCharges: 1 }), /unknown trait/);
});
