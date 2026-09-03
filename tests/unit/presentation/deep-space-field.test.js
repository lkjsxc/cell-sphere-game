/** Generated orbital backdrop and star strata stay deterministic and bounded. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDeepSpaceField, DEEP_SPACE_FIELD_COMPONENTS, deepSpaceInfluence,
  validDeepSpaceField } from '../../../src/rendering/deep-space-field.js';
import { createStarCatalog, MAX_SKY_STARS, SKY_STAR_STRIDE, STAR_BUDGETS,
  STAR_STRATA, STAR_STRATA_COUNTS, validStarCatalog } from '../../../src/rendering/star-field.js';

test('the 256x128 RGB deep-space field is deterministic, chromatic, and near-black', () => {
  const a = createDeepSpaceField(0x6e5a91c3); const b = createDeepSpaceField(0x6e5a91c3);
  const c = createDeepSpaceField(0x6e5a91c2);
  assert.equal(validDeepSpaceField(a), true); assert.deepEqual([a.width, a.height, a.components], [256, 128, 3]);
  assert.equal(a.byteLength, 98_304); assert.equal(a.signature, b.signature); assert.deepEqual(a.bytes, b.bytes);
  assert.notEqual(a.signature, c.signature); assert.notDeepEqual(a.bytes, c.bytes);
  assert.ok(a.maximumLuminance - a.minimumLuminance >= 2, `${a.minimumLuminance}/${a.maximumLuminance}`);
  assert.ok(a.maximumLuminance <= 7, String(a.maximumLuminance));
  assert.ok(a.meanLuminance >= 1 && a.meanLuminance <= 4, String(a.meanLuminance));
  let chromatic = 0; let adjacent = 0; let distant = 0;
  for (let y = 0; y < a.height; y += 4) for (let x = 0; x < a.width; x += 4) {
    const at = (y * a.width + x) * DEEP_SPACE_FIELD_COMPONENTS;
    chromatic += Math.max(a.bytes[at], a.bytes[at + 1], a.bytes[at + 2]) - Math.min(a.bytes[at], a.bytes[at + 1], a.bytes[at + 2]);
    const next = (y * a.width + Math.min(a.width - 1, x + 1)) * DEEP_SPACE_FIELD_COMPONENTS;
    const far = (y * a.width + Math.min(a.width - 1, x + 31)) * DEEP_SPACE_FIELD_COMPONENTS;
    adjacent += Math.abs(a.bytes[at + 2] - a.bytes[next + 2]); distant += Math.abs(a.bytes[at + 2] - a.bytes[far + 2]);
  }
  assert.ok(chromatic > 2_000, String(chromatic));
  assert.ok(adjacent < distant * .18, `field resolved into pixel noise: ${adjacent}/${distant}`);
  assert.ok(Math.abs(deepSpaceInfluence(a, .2, .7) - deepSpaceInfluence(a, .8, .2)) > .1);
  assert.throws(() => createDeepSpaceField(1, { width: 128, height: 64 }), /dimensions/);
});

test('three star strata have ordered fixed budgets and varied material', () => {
  const field = createDeepSpaceField(0x6e5a91c3); const a = createStarCatalog(0x6e5a91c3, field);
  const b = createStarCatalog(0x6e5a91c3, field); const c = createStarCatalog(3, field);
  assert.equal(validStarCatalog(a), true); assert.equal(a.byteLength, MAX_SKY_STARS * SKY_STAR_STRIDE * 4);
  assert.deepEqual(a, b); assert.notDeepEqual(a, c);
  assert.deepEqual(STAR_BUDGETS, { eco: 224, balanced: 356, high: 500 });
  assert.deepEqual(STAR_STRATA_COUNTS.balanced, [280, 64, 12]);
  let warm = 0; let cool = 0; const occupied = new Set();
  for (let star = 0; star < MAX_SKY_STARS; star++) {
    const at = star * SKY_STAR_STRIDE; const x = a[at]; const y = a[at + 1]; const size = a[at + 2]; const intensity = a[at + 3];
    assert.ok(x >= .01 && x <= .99 && y >= .01 && y <= .99); assert.ok(size >= .5 && size <= 3.7);
    assert.ok(intensity >= .2 && intensity <= 1); warm += a[at + 4] < -.28; cool += a[at + 4] > .28;
    occupied.add(`${Math.floor(x * 12)}:${Math.floor(y * 7)}`);
  }
  assert.ok(warm >= 115 && cool >= 115, `${warm}/${cool}`); assert.ok(occupied.size >= 75, String(occupied.size));
  assert.ok(STAR_STRATA[0].size[1] < STAR_STRATA[1].size[1] && STAR_STRATA[1].size[1] < STAR_STRATA[2].size[1]);
});
