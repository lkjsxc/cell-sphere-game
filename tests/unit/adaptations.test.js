/** Adaptation content, weighted offers, and exact-uniform passive choices. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ADAPTATIONS, cardById, drawAdaptationOptions, selectRandomOption, uniformIndex,
} from '../../src/game/adaptations.js';
import { baseTraits } from '../../src/game/strains.js';
import { createRng } from '../../src/core/prng.js';

const VALID_CATS = new Set(['reach', 'metabolism', 'resilience', 'transport', 'symbiosis', 'memory']);

test('at least 24 cards have unique ids and closed trait effects', () => {
  assert.ok(ADAPTATIONS.length >= 24);
  assert.equal(new Set(ADAPTATIONS.map((card) => card.id)).size, ADAPTATIONS.length);
  const traitKeys = new Set(Object.keys(baseTraits()));
  for (const card of ADAPTATIONS) {
    assert.ok(card.nameJa && card.effectJa && card.weight > 0);
    assert.ok(card.cats.length >= 1 && card.cats.length <= 2);
    for (const category of card.cats) assert.ok(VALID_CATS.has(category));
    for (const key of Object.keys(card.effects)) {
      assert.ok(traitKeys.has(key), `${card.id} references unknown ${key}`);
      assert.doesNotMatch(key, /signal/i);
    }
  }
});

test('card lookup resolves and rejects', () => {
  assert.equal(cardById('anastomosis').nameJa, '吻合再接続');
  assert.throws(() => cardById('nope'), /unknown adaptation/);
});

test('offer options are unique and exclude owned and immediately offered cards', () => {
  const rng = createRng(555);
  for (let i = 0; i < 50; i++) {
    const options = drawAdaptationOptions(rng, {
      owned: ['long-filaments', 'anastomosis'],
      lastOffered: ['dense-cords'], crisisCats: [],
    });
    assert.equal(options.length, 3);
    assert.equal(new Set(options).size, 3);
    for (const id of options) assert.ok(!['long-filaments', 'anastomosis', 'dense-cords'].includes(id));
  }
});

test('crisis weighting raises resilience share', () => {
  const share = (crisisCats) => {
    const rng = createRng(1234);
    let resilient = 0;
    for (let i = 0; i < 300; i++) {
      for (const id of drawAdaptationOptions(rng, { owned: [], lastOffered: [], crisisCats })) {
        if (cardById(id).cats.includes('resilience')) resilient++;
      }
    }
    return resilient / 900;
  };
  assert.ok(share(['resilience']) > share([]) * 1.4);
});

test('exact-uniform option selection is deterministic and balanced at scale', () => {
  const sample = (seed) => {
    const rng = createRng(seed);
    const counts = [0, 0, 0];
    for (let i = 0; i < 60000; i++) counts[uniformIndex(rng, 3)]++;
    return counts;
  };
  const counts = sample(8901);
  assert.deepEqual(counts, sample(8901));
  for (const count of counts) assert.ok(Math.abs(count - 20000) < 500, counts.join(','));
  const options = ['a', 'b', 'c'];
  assert.ok(options.includes(selectRandomOption(createRng(1), options)));
  assert.throws(() => selectRandomOption(createRng(1), ['a', 'b']), /exactly three/);
});

test('all six categories are represented', () => {
  const seen = new Set(ADAPTATIONS.flatMap((card) => card.cats));
  assert.deepEqual([...seen].sort(), [...VALID_CATS].sort());
});
