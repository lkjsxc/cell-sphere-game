/** Celestial presentation stays deterministic, bounded, and outside game time. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CLOUD_PRIMARY_AXIS, CLOUD_SECONDARY_AXIS, createCloudField, sampleCloudField,
  transformCloudDirection, validCloudField } from '../../../src/rendering/cloud-field.js';
import { normalizeCelestialProjection } from '../../../src/rendering/celestial-projection.js';
import { CANVAS_CLOUD_ANGLE_BUCKETS, canvasCloudAmount,
  canvasCloudAngleBucket } from '../../../src/rendering/fallback-celestial.js';
import { advanceCelestialPresentation, celestialPresentationSnapshot, celestialProjection,
  CLOUD_PRIMARY_INITIAL_ANGLE, CLOUD_PRIMARY_PERIOD_MS, CLOUD_SECONDARY_INITIAL_ANGLE,
  CLOUD_SECONDARY_PERIOD_MS, createCelestialPresentation, MAX_CELESTIAL_FRAME_MS, setCelestialHidden,
  setCelestialQuality, setCelestialReduced, setCelestialScene, setCelestialVisualSeed,
  SHOOTING_STAR_SLOT_MS, shootingStarForSlot, STAR_BUDGETS } from '../../../src/interface/policies/celestial-presentation.js';

test('the shared six-face directional field is deterministic, continuous, and low-frequency', () => {
  const a = createCloudField(1234); const b = createCloudField(1234); const c = createCloudField(1235);
  assert.equal(validCloudField(a), true); assert.equal(a.faceSize, 64); assert.equal(a.faceCount, 6);
  assert.equal(a.byteLength, 24_576); assert.equal(a.signature, b.signature); assert.deepEqual(a.bytes, b.bytes);
  assert.notEqual(a.signature, c.signature); assert.notDeepEqual(a.bytes, c.bytes);
  assert.ok(a.coverage >= .18 && a.coverage <= .42, `coverage ${a.coverage}`);
  let maximumSeamDelta = 0;
  for (const first of [-1, 1]) for (const second of [-1, 1]) for (const plane of ['xy', 'xz', 'yz']) {
    for (let step = -10; step <= 10; step++) {
      const free = step / 10 * .9;
      const direction = plane === 'xy' ? [first, second, free]
        : plane === 'xz' ? [first, free, second] : [free, first, second];
      const axisA = plane === 'xy' || plane === 'xz' ? 0 : 1; const axisB = plane === 'xy' ? 1 : 2;
      const sideA = direction.slice(); const sideB = direction.slice(); sideA[axisA] *= 1.000001; sideB[axisB] *= 1.000001;
      maximumSeamDelta = Math.max(maximumSeamDelta,
        Math.abs(sampleCloudField(a, ...sideA) - sampleCloudField(a, ...sideB)));
    }
  }
  assert.ok(maximumSeamDelta < .001, `directional seam ${maximumSeamDelta}`);
  let adjacent = 0; let distant = 0; const area = a.faceSize * a.faceSize;
  for (let face = 0; face < 6; face++) for (let y = 0; y < a.faceSize; y += 4) for (let x = 0; x < a.faceSize - 16; x += 4) {
    const at = face * area + y * a.faceSize + x; adjacent += Math.abs(a.bytes[at] - a.bytes[at + 1]);
    distant += Math.abs(a.bytes[at] - a.bytes[at + 15]);
  }
  assert.ok(adjacent < distant * .35, `field resolved into cell-scale noise: ${adjacent}/${distant}`);
  assert.throws(() => createCloudField(1, { faceSize: 48 }), /dimensions/);
  assert.equal(sampleCloudField(null, 0, 0, 1), 0);
  assert.equal(sampleCloudField(a, 0, 0, 0), 0);
});

test('two bounded non-cardinal rotations remain finite and non-harmonic', () => {
  const dot = CLOUD_PRIMARY_AXIS.reduce((sum, value, index) => sum + value * CLOUD_SECONDARY_AXIS[index], 0);
  const separation = Math.acos(dot) * 180 / Math.PI; assert.ok(separation >= 35, separation);
  for (const axis of [CLOUD_PRIMARY_AXIS, CLOUD_SECONDARY_AXIS]) {
    assert.ok(Math.abs(Math.hypot(...axis) - 1) < 1e-12);
    const cardinalSeparation = Math.acos(Math.max(...axis.map(Math.abs))) * 180 / Math.PI;
    assert.ok(cardinalSeparation >= 20, cardinalSeparation);
  }
  assert.equal(CLOUD_PRIMARY_PERIOD_MS, 52 * 60_000); assert.equal(CLOUD_SECONDARY_PERIOD_MS, 109 * 60_000);
  assert.notEqual(CLOUD_SECONDARY_PERIOD_MS % CLOUD_PRIMARY_PERIOD_MS, 0);
  for (const time of [0, 1, 1e6, 1e12, Number.MAX_SAFE_INTEGER]) {
    const value = transformCloudDirection(.2, .7, .68, time, time * .73);
    assert.ok(value.every(Number.isFinite)); assert.ok(Math.abs(Math.hypot(...value) - 1) < 1e-10);
  }
});

test('the Canvas directional cache uses the coarsest imperceptible selected step', () => {
  const field = createCloudField(3_531_364_387);
  const primary = canvasCloudAngleBucket(CLOUD_PRIMARY_INITIAL_ANGLE);
  const secondary = canvasCloudAngleBucket(CLOUD_SECONDARY_INITIAL_ANGLE);
  let maximum = 0; let total = 0; let samples = 0;
  for (const [primaryStep, secondaryStep] of [[1, 0], [0, 1]]) {
    for (let latitude = -30; latitude <= 30; latitude++) for (let longitude = -60; longitude <= 60; longitude++) {
      const lat = latitude / 30 * Math.PI / 2; const lon = longitude / 60 * Math.PI;
      const x = Math.cos(lat) * Math.cos(lon); const y = Math.sin(lat); const z = Math.cos(lat) * Math.sin(lon);
      const before = canvasCloudAmount(field, x, y, z, primary, secondary, 1);
      const after = canvasCloudAmount(field, x, y, z,
        (primary + primaryStep) % CANVAS_CLOUD_ANGLE_BUCKETS,
        (secondary + secondaryStep) % CANVAS_CLOUD_ANGLE_BUCKETS, 1);
      const delta = Math.abs(after - before); maximum = Math.max(maximum, delta); total += delta; samples++;
    }
  }
  assert.equal(CANVAS_CLOUD_ANGLE_BUCKETS, 2048);
  assert.ok(maximum <= 4, `cache step changed opacity byte by ${maximum}`);
  assert.ok(total / samples < .4, `cache step mean ${total / samples}`);
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
  assert.equal(celestialProjection(state).cloudPrimaryAngle,
    (CLOUD_PRIMARY_INITIAL_ANGLE + state.cloudPrimaryMs / CLOUD_PRIMARY_PERIOD_MS * Math.PI * 2) % (Math.PI * 2));
  assert.equal(celestialProjection(state).cloudSecondaryAngle,
    (CLOUD_SECONDARY_INITIAL_ANGLE + state.cloudSecondaryMs / CLOUD_SECONDARY_PERIOD_MS * Math.PI * 2) % (Math.PI * 2));
  assert.equal(celestialPresentationSnapshot(state).droppedMs, 3684);
});

test('frame cadence agrees and reduced motion freezes clouds while suppressing travel', () => {
  const run = (hz) => { const state = createCelestialPresentation({ now: 0, scene: 'world', visualSeed: 71 });
    const frame = 1000 / hz; for (let index = 1; index <= hz * 60; index++) advanceCelestialPresentation(state, index * frame); return state; };
  const times = [30, 60, 120, 144].map((hz) => run(hz).elapsedMs);
  assert.ok(Math.max(...times) - Math.min(...times) < .001, times.join(','));
  const state = run(60); const before = celestialProjection(state); setCelestialReduced(state, true, 61_000);
  const reduced = advanceCelestialPresentation(state, 180_000); assert.equal(reduced.eligibleTimeMs, before.eligibleTimeMs + MAX_CELESTIAL_FRAME_MS);
  assert.equal(reduced.cloudPrimaryAngle, celestialProjection(state).cloudPrimaryAngle);
  assert.equal(reduced.cloudSecondaryAngle, celestialProjection(state).cloudSecondaryAngle); assert.equal(reduced.shootingStar, null);
  setCelestialScene(state, 'trophies', 181_000); assert.equal(advanceCelestialPresentation(state, 300_000).shootingStar, null);
});

test('visual seed replacement is lifecycle-bound and quality changes only the fixed budget', () => {
  const state = createCelestialPresentation({ now: 0, scene: 'home', visualSeed: 8, quality: 'auto',
    caps: { cpuHint: 8, memoryHint: 4, dpr: 1, saveData: false } });
  const first = celestialProjection(state); assert.equal(first.starCount, STAR_BUDGETS.balanced);
  assert.deepEqual(first.starCounts, [160, 42, 8]); assert.equal(first.deepSpace.byteLength, 98_304);
  assert.equal(state.deepSpaceGenerations, 1); assert.equal(state.starGenerations, 1);
  assert.equal(setCelestialVisualSeed(state, 8), false); assert.equal(state.cloudGenerations, 1);
  assert.equal(setCelestialVisualSeed(state, 9), true); assert.equal(state.cloudGenerations, 2);
  assert.notEqual(first.cloud.signature, state.cloud.signature); assert.equal(first.deepSpace, state.deepSpace);
  assert.equal(first.stars, state.stars);
  setCelestialQuality(state, 'high'); assert.equal(celestialProjection(state).starCount, 300);
  setCelestialVisualSeed(state, 0, false); const disabled = celestialProjection(state);
  assert.equal(disabled.cloudEnabled, false); assert.equal(disabled.cloud, null); assert.equal(disabled.starCount, 300);

  const degraded = createCelestialPresentation({ scene: 'home', visualSeed: 12,
    cloudFactory: () => { throw new Error('synthetic cloud failure'); },
    deepSpaceFactory: () => { throw new Error('synthetic deep-space failure'); } });
  assert.equal(celestialProjection(degraded).cloudEnabled, false);
  assert.equal(celestialPresentationSnapshot(degraded).cloudError, 'synthetic cloud failure');
  assert.equal(celestialProjection(degraded).deepSpace, null);
  assert.equal(celestialPresentationSnapshot(degraded).deepSpaceError, 'synthetic deep-space failure');
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
  assert.equal(normalizeCelestialProjection({ ...valid, cloudPrimaryAngle: Infinity }).cloudPrimaryAngle, 0);
  assert.equal(normalizeCelestialProjection({ ...valid, cloudSecondaryAngle: NaN }).cloudSecondaryAngle, 0);
  assert.equal(normalizeCelestialProjection({ ...valid, shootingStar: { ...active, progress: NaN } }).shootingStar, null);
  assert.equal(normalizeCelestialProjection({ ...valid, stars: [] }).starCount, 0);
  assert.equal(normalizeCelestialProjection({ ...valid, deepSpace: { bytes: new Uint8Array(3) } }).deepSpace, null);
});
