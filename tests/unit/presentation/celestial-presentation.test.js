/** Celestial presentation stays deterministic, bounded, and outside game time. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCloudField, sampleCloudField, validCloudField } from '../../../src/rendering/cloud-field.js';
import { normalizeCelestialProjection } from '../../../src/rendering/celestial-projection.js';
import { advanceCelestialPresentation, celestialPresentationSnapshot, celestialProjection,
  CLOUD_WRAP_MS, createCelestialPresentation, MAX_CELESTIAL_FRAME_MS, setCelestialHidden,
  setCelestialQuality, setCelestialReduced, setCelestialScene, setCelestialVisualSeed,
  SHOOTING_STAR_SLOT_MS, shootingStarForSlot, STAR_BUDGETS } from '../../../src/interface/policies/celestial-presentation.js';

test('the shared 128x64 opacity field is deterministic, seamless, and low-frequency', () => {
  const a = createCloudField(1234); const b = createCloudField(1234); const c = createCloudField(1235);
  assert.equal(validCloudField(a), true); assert.equal(a.width, 128); assert.equal(a.height, 64);
  assert.equal(a.byteLength, 8192); assert.equal(a.signature, b.signature); assert.deepEqual(a.bytes, b.bytes);
  assert.notEqual(a.signature, c.signature); assert.notDeepEqual(a.bytes, c.bytes);
  assert.ok(a.coverage >= .18 && a.coverage <= .42, `coverage ${a.coverage}`);
  for (const v of [0, .13, .5, .91, 1]) {
    assert.ok(Math.abs(sampleCloudField(a, 0, v) - sampleCloudField(a, 1, v)) < 1e-12, `seam at ${v}`);
  }
  let adjacent = 0; let distant = 0;
  for (let y = 0; y < a.height; y += 4) for (let x = 0; x < a.width; x += 4) {
    const value = a.bytes[y * a.width + x]; adjacent += Math.abs(value - a.bytes[y * a.width + ((x + 1) % a.width)]);
    distant += Math.abs(value - a.bytes[y * a.width + ((x + 23) % a.width)]);
  }
  assert.ok(adjacent < distant * .45, `field resolved into cell-scale noise: ${adjacent}/${distant}`);
  assert.throws(() => createCloudField(1, { width: 64, height: 32 }), /dimensions/);
  assert.equal(sampleCloudField(null, 0, 0), 0);
});

test('one deterministic shooting star exists in every 300-second slot', () => {
  for (const seed of [0, 1, 0x6e5a91c3, 0xffffffff]) {
    const events = Array.from({ length: 24 * 12 }, (_, slot) => shootingStarForSlot(seed, slot));
    assert.equal(new Set(events.map((event) => event.id)).size, events.length);
    for (const event of events) {
      assert.ok(event.durationMs >= 700 && event.durationMs <= 1200);
      assert.ok(event.startOffsetMs >= 8000 && event.startOffsetMs + event.durationMs < SHOOTING_STAR_SLOT_MS);
      assert.ok(event.startX >= .05 && event.startX <= .95 && event.endX >= .05 && event.endX <= .95);
      assert.ok(event.startY >= .05 && event.startY <= .95 && event.endY >= .05 && event.endY <= .95);
      for (const value of Object.values(event).filter((value) => typeof value === 'number')) assert.ok(Number.isFinite(value));
      assert.deepEqual(event, shootingStarForSlot(seed, event.slotIndex));
    }
    for (let hour = 0; hour < 24; hour++) assert.equal(events.slice(hour * 12, hour * 12 + 12).length, 12);
  }
});

test('only bounded visible Full-motion Home and World frames advance the clock', () => {
  const state = createCelestialPresentation({ now: 1000, scene: 'home', visualSeed: 44, quality: 'balanced' });
  advanceCelestialPresentation(state, 1016); assert.equal(state.elapsedMs, 16);
  advanceCelestialPresentation(state, 3016); assert.equal(state.elapsedMs, 16 + MAX_CELESTIAL_FRAME_MS);
  assert.equal(state.droppedMs, 1900);
  setCelestialHidden(state, true, 4016); advanceCelestialPresentation(state, 20_000);
  setCelestialHidden(state, false, 30_000); advanceCelestialPresentation(state, 30_016);
  assert.equal(state.elapsedMs, 232);
  setCelestialScene(state, 'evolution', 31_000); advanceCelestialPresentation(state, 60_000);
  setCelestialScene(state, 'world', 70_000); setCelestialReduced(state, true, 70_010); advanceCelestialPresentation(state, 90_000);
  setCelestialReduced(state, false, 100_000); advanceCelestialPresentation(state, 100_020);
  assert.equal(state.elapsedMs, 362); assert.equal(celestialProjection(state).eligible, true);
  assert.equal(celestialProjection(state).cloudPhase, (state.elapsedMs / CLOUD_WRAP_MS) % 1);
  assert.equal(celestialPresentationSnapshot(state).droppedMs, 3684);
});

test('frame cadence agrees and reduced motion freezes clouds while suppressing travel', () => {
  const run = (hz) => { const state = createCelestialPresentation({ now: 0, scene: 'world', visualSeed: 71 });
    const frame = 1000 / hz; for (let index = 1; index <= hz * 60; index++) advanceCelestialPresentation(state, index * frame); return state; };
  const times = [30, 60, 120, 144].map((hz) => run(hz).elapsedMs);
  assert.ok(Math.max(...times) - Math.min(...times) < .001, times.join(','));
  const state = run(60); const before = celestialProjection(state); setCelestialReduced(state, true, 61_000);
  const reduced = advanceCelestialPresentation(state, 180_000); assert.equal(reduced.eligibleTimeMs, before.eligibleTimeMs + MAX_CELESTIAL_FRAME_MS);
  assert.equal(reduced.cloudPhase, celestialProjection(state).cloudPhase); assert.equal(reduced.shootingStar, null);
  setCelestialScene(state, 'trophies', 181_000); assert.equal(advanceCelestialPresentation(state, 300_000).shootingStar, null);
});

test('visual seed replacement is lifecycle-bound and quality changes only the fixed budget', () => {
  const state = createCelestialPresentation({ now: 0, scene: 'home', visualSeed: 8, quality: 'auto',
    caps: { cpuHint: 8, memoryHint: 4, dpr: 1, saveData: false } });
  const first = celestialProjection(state); assert.equal(first.starCount, STAR_BUDGETS.balanced);
  assert.equal(setCelestialVisualSeed(state, 8), false); assert.equal(state.cloudGenerations, 1);
  assert.equal(setCelestialVisualSeed(state, 9), true); assert.equal(state.cloudGenerations, 2);
  assert.notEqual(first.cloud.signature, state.cloud.signature);
  setCelestialQuality(state, 'high'); assert.equal(celestialProjection(state).starCount, 96);
  setCelestialVisualSeed(state, 0, false); const disabled = celestialProjection(state);
  assert.equal(disabled.cloudEnabled, false); assert.equal(disabled.cloud, null); assert.equal(disabled.starCount, 96);

  const degraded = createCelestialPresentation({ scene: 'home', visualSeed: 12,
    cloudFactory: () => { throw new Error('synthetic cloud failure'); } });
  assert.equal(celestialProjection(degraded).cloudEnabled, false);
  assert.equal(celestialPresentationSnapshot(degraded).cloudError, 'synthetic cloud failure');
});

test('ineligible scenes pause one active event and defensive projection rejects nonfinite inputs', () => {
  const state = createCelestialPresentation({ now: 0, scene: 'world', visualSeed: 17 });
  const scheduled = shootingStarForSlot(state.skySeed, 3);
  state.elapsedMs = 3 * SHOOTING_STAR_SLOT_MS + scheduled.startOffsetMs + scheduled.durationMs * .5;
  const active = celestialProjection(state).shootingStar; assert.equal(active.id, scheduled.id);
  const cached = state.scheduledEvent; celestialProjection(state); assert.equal(state.scheduledEvent, cached);
  setCelestialScene(state, 'evolution', 0); advanceCelestialPresentation(state, 100_000);
  assert.equal(celestialProjection(state).shootingStar, null);
  setCelestialScene(state, 'world', 200_000);
  assert.equal(celestialProjection(state).shootingStar.id, active.id);
  assert.equal(celestialProjection(state).shootingStar.progress, active.progress);

  const valid = celestialProjection(state);
  assert.equal(normalizeCelestialProjection({ ...valid, cloudPhase: Infinity }).cloudPhase, 0);
  assert.equal(normalizeCelestialProjection({ ...valid, shootingStar: { ...active, progress: NaN } }).shootingStar, null);
  assert.equal(normalizeCelestialProjection({ ...valid, stars: [] }).starCount, 0);
});
