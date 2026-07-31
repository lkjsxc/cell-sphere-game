/** Risk protected: broken card data or biased drafts would warp every build
 *  and every balance measurement. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ADAPTATIONS, cardById, drawDraftOptions } from '../../src/game/adaptations.js';
import { baseTraits } from '../../src/game/strains.js';
import { createRng } from '../../src/core/prng.js';

const VALID_CATS = new Set(['reach', 'metabolism', 'resilience', 'transport', 'symbiosis', 'memory']);

test('at least 24 cards with unique ids and valid structure', () => {
  assert.ok(ADAPTATIONS.length >= 24, `only ${ADAPTATIONS.length} cards`);
  const ids = new Set(ADAPTATIONS.map((c) => c.id));
  assert.equal(ids.size, ADAPTATIONS.length, 'duplicate ids');
  for (const card of ADAPTATIONS) {
    assert.ok(card.nameJa.length > 0, `${card.id} missing name`);
    assert.ok(card.effectJa.length > 0, `${card.id} missing effect text`);
    assert.ok(card.weight > 0, `${card.id} weight`);
    assert.ok(card.cats.length >= 1 && card.cats.length <= 2, `${card.id} cats`);
    for (const cat of card.cats) assert.ok(VALID_CATS.has(cat), `${card.id} bad cat ${cat}`);
  }
});

test('every card effect key is a real trait', () => {
  const traitKeys = new Set(Object.keys(baseTraits()));
  for (const card of ADAPTATIONS) {
    for (const key of Object.keys(card.effects)) {
      assert.ok(traitKeys.has(key), `${card.id} references unknown trait ${key}`);
    }
  }
});

test('cardById resolves and rejects', () => {
  assert.equal(cardById('anastomosis').nameJa, '吻合再接続');
  assert.throws(() => cardById('nope'), /unknown adaptation/);
});

test('draft draws are unique, exclude owned and last-offered', () => {
  const rng = createRng(555);
  for (let i = 0; i < 50; i++) {
    const opts = drawDraftOptions(rng, {
      owned: ['long-filaments', 'anastomosis'],
      lastOffered: ['dense-cords'],
      crisisCats: [],
    }, 3);
    assert.equal(opts.length, 3);
    assert.equal(new Set(opts).size, 3, 'duplicate options');
    for (const id of opts) {
      assert.notEqual(id, 'long-filaments');
      assert.notEqual(id, 'anastomosis');
      assert.notEqual(id, 'dense-cords');
    }
  }
});

test('crisis boosting raises resilience category share', () => {
  const count = (crisisCats) => {
    const rng = createRng(1234);
    let res = 0;
    let total = 0;
    for (let i = 0; i < 300; i++) {
      for (const id of drawDraftOptions(rng, { owned: [], lastOffered: [], crisisCats }, 3)) {
        total++;
        if (cardById(id).cats.includes('resilience')) res++;
      }
    }
    return res / total;
  };
  const plain = count([]);
  const boosted = count(['resilience']);
  assert.ok(boosted > plain * 1.4, `boost too weak: ${plain} -> ${boosted}`);
});

test('all six categories are represented in the pool', () => {
  const seen = new Set();
  for (const card of ADAPTATIONS) for (const c of card.cats) seen.add(c);
  assert.deepEqual([...seen].sort(), [...VALID_CATS].sort());
});
