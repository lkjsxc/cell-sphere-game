/** Visual History v3 codec, truthful renderer channels, bounds, and playback safety. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { decodeVisualHistory, encodeVisualHistory, MAX_BYTES, maxVisualHistoryFrames, thinFrames } from '../../src/history/codec.js';
import { createPreviewBuffers, nearestFrame, projectPreview } from '../../src/history/preview.js';
import { RunController } from '../../src/simulation/simulator.js';
import { scoreResult } from '../../src/game/scoring.js';
import { createRecentRuns, validateRecentRun } from '../../src/platform/recent-runs.js';
import { createHistoryLoadGuard, createHistoryPlayback } from '../../src/interface/history-playback.js';
import { createWorldIdentity, identityFields } from '../../src/core/world-session.js';
import { ENVIRONMENT_MODEL_VERSION, ENVIRONMENT_SCHEDULE_HASH, ENVIRONMENT_SCHEDULE_VERSION } from '../../src/game/environment-level.js';
import { FRAME_FLAGS } from '../../src/history/recorder.js';
import { defaultHistory, loadHistory, normalizeHistoryEvents, serializeHistory, validateHistory } from '../../src/platform/history.js';
import { EVOLUTION_CONTENT_HASH, EVOLUTION_LAYOUT_VERSION, EVOLUTION_ROOT_CELL } from '../../src/game/skills/index.js';

function frame(tick, flags = 0, count = 32) {
  const cells = new Uint8Array(count); const resources = new Uint8Array(count); const worldmaking = new Uint8Array(count);
  const cell = tick % count; cells[cell] = 0b10111001; resources[cell] = (21 << 3) | 5; worldmaking[cell] = (19 << 3) | 4;
  return { tick, entropyQ: tick % 256, flags, aliveCount: 1, luminousDevelopmentQ: 153, cells, resources, worldmaking };
}

function closeTo(actual, expected, tolerance, message = '') {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${message} expected ${expected}, got ${actual}`);
}

test('INHV v3 round trips complete render-semantic checkpoints through reusable buffers', () => {
  const input = [frame(0, FRAME_FLAGS.INITIAL | FRAME_FLAGS.MAJOR), frame(50), frame(93, FRAME_FLAGS.TERMINAL | FRAME_FLAGS.MAJOR)];
  const buffer = encodeVisualHistory({ cellCount: 32, seed: 17, cadence: 50 }, input);
  const decoded = decodeVisualHistory(buffer);
  assert.equal(decoded.version, 3); assert.equal(decoded.seed, 17); assert.equal(decoded.frames.length, 3);
  const fullWordSeed = 2693800525; const fullWord = decodeVisualHistory(encodeVisualHistory({ cellCount: 32, seed: fullWordSeed }, input));
  assert.equal(fullWord.seed, fullWordSeed);
  assert.deepEqual([...decoded.frames[1].cells], [...input[1].cells]);
  assert.deepEqual([...decoded.frames[1].resources], [...input[1].resources]);
  assert.deepEqual([...decoded.frames[1].worldmaking], [...input[1].worldmaking]);
  assert.equal(nearestFrame(decoded.frames, 70).tick, 50); assert.equal(nearestFrame(decoded.frames, 73).tick, 93);
  const reuse = createPreviewBuffers(32); const projected = projectPreview(decoded.frames[1], reuse);
  assert.strictEqual(projected.alive, reuse.alive); assert.strictEqual(projected.resourceState, reuse.resourceState);
  assert.equal(projected.alive[18], 1); assert.equal(projected.lifeState[18], 2);
  assert.equal(projected.resourceState[18], 5); assert.equal(projected.transformationState[18], 4);
  closeTo(projected.resourceRichnessQ[18], 21 * 255 / 31, 1, 'richness');
  closeTo(projected.electricityQ[18], 19 * 255 / 31, 1, 'charge');
  closeTo(projected.luminousDevelopment, 153 / 255, .001, 'development');
  for (const removed of ['nutrient', 'conductance', 'flux', 'edgeActive']) assert.equal(removed in projected, false);
});

test('v3 codec rejects old, malformed, truncated, oversized, and unordered data', () => {
  const valid = encodeVisualHistory({ cellCount: 32, seed: 2 }, [frame(0, FRAME_FLAGS.INITIAL), frame(5, FRAME_FLAGS.TERMINAL)]);
  const badMagic = valid.slice(0); new Uint8Array(badMagic)[0] = 0;
  const oldVersion = valid.slice(0); new Uint8Array(oldVersion)[4] = 1;
  assert.throws(() => decodeVisualHistory(badMagic), /magic/);
  assert.throws(() => decodeVisualHistory(oldVersion), /version/);
  assert.throws(() => decodeVisualHistory(valid.slice(0, -1)), /length/);
  assert.throws(() => encodeVisualHistory({ cellCount: 32, seed: 2 }, [frame(5), frame(5)]), /checkpoint/);
  assert.throws(() => decodeVisualHistory(new ArrayBuffer(MAX_BYTES + 1)), /size/);
});

test('thinning keeps initial/terminal and samples event-heavy visual History within the byte cap', () => {
  const cellCount = 2562; const max = maxVisualHistoryFrames(cellCount);
  const frames = Array.from({ length: max + 72 }, (_, index) => frame(index * 10,
    index === 0 ? FRAME_FLAGS.INITIAL | FRAME_FLAGS.MAJOR
      : index === max + 71 ? FRAME_FLAGS.TERMINAL | FRAME_FLAGS.MAJOR
        : index === 11 ? FRAME_FLAGS.TRANSITION | FRAME_FLAGS.MAJOR : index % 2 ? FRAME_FLAGS.MAJOR : 0, cellCount));
  const thinned = thinFrames(frames, cellCount); const buffer = encodeVisualHistory({ cellCount, seed: 9 }, frames);
  assert.equal(thinned.length, max); assert.ok(buffer.byteLength <= MAX_BYTES);
  assert.equal(thinned[0].tick, frames[0].tick); assert.equal(thinned.at(-1).tick, frames.at(-1).tick);
  assert.ok(thinned.some((item) => item.flags & FRAME_FLAGS.TRANSITION)); assert.ok(thinned.some((item) => item.flags & FRAME_FLAGS.MAJOR));
});

test('recorder retains historical resource, transformation, charge, and Luminous development appearance', () => {
  const run = new RunController({ seed: 20260731 }); run.start(); const state = run.state; const cell = state.inoculationCell;
  state.tick = 1; state.biomass[cell] = 1.25; state.stress[cell] = .42;
  state.resourceRichness[cell] = .68; state.resourceState[cell] = 5; state.transformationState[cell] = 4;
  state.electricityQ[cell] = 177; state.luminous = { ...state.luminous, enabled: true, visualDevelopment: .61 };
  run.historyRecorder.capture(state, FRAME_FLAGS.MAJOR);
  const history = decodeVisualHistory(run.historyBuffer()); const checkpoint = nearestFrame(history.frames, 1);
  const projected = projectPreview(checkpoint, createPreviewBuffers(state.topo.nodeCount)); const live = run.snapshot();
  assert.equal(projected.resourceState[cell], live.resourceState[cell]); assert.equal(projected.transformationState[cell], live.transformationState[cell]);
  closeTo(projected.resourceRichnessQ[cell], live.resourceRichnessQ[cell], 5, 'historical richness');
  closeTo(projected.electricityQ[cell], live.electricityQ[cell], 5, 'historical charge');
  closeTo(projected.luminousDevelopment, live.luminousDevelopment, .01, 'historical development');
});

test('terminal authority carries the v3 visual bundle before the session can retire', () => {
  const messages = []; const run = new RunController({ seed: 20260733 }, (message) => messages.push(message)); run.start();
  while (run.state.status !== 'extinct') run.advance(37);
  const terminal = messages.find((message) => message.t === 'extinct');
  assert.ok(terminal?.visualHistoryBuffer instanceof ArrayBuffer);
  const decoded = decodeVisualHistory(terminal.visualHistoryBuffer);
  assert.equal(decoded.seed, run.state.seed); assert.equal(decoded.terminalTick, run.state.tick);
  assert.ok(decoded.frames.at(-1).flags & FRAME_FLAGS.TERMINAL);
});

test('a detailed five-minute run stays bounded and recorder is authority-neutral', () => {
  const cfg = { seed: 20260731 }; const quiet = new RunController(cfg); quiet.start();
  const observed = new RunController(cfg); observed.start();
  while (quiet.state.status !== 'extinct') quiet.advance(37);
  while (observed.state.status !== 'extinct') { observed.advance(11); observed.historyBuffer(); }
  const a = quiet.buildResult(); const b = observed.buildResult();
  assert.deepEqual({ hash: b.hash, cause: b.cause, offers: b.offers, history: b.history, imprint: b.imprint },
    { hash: a.hash, cause: a.cause, offers: a.offers, history: a.history, imprint: a.imprint });
  assert.deepEqual(scoreResult(b), scoreResult(a));
  const started = performance.now(); const buffer = observed.historyBuffer(); const decoded = decodeVisualHistory(buffer);
  const decodeMs = performance.now() - started; const seekStart = performance.now();
  for (let i = 0; i < 10_000; i++) nearestFrame(decoded.frames, i % (decoded.terminalTick + 1));
  const seekMs = performance.now() - seekStart;
  assert.ok(buffer.byteLength <= MAX_BYTES); assert.ok(observed.historyRecorder.frames.length <= maxVisualHistoryFrames(observed.state.topo.nodeCount));
  assert.equal(decoded.frames[0].tick, 0); assert.ok(decoded.frames.at(-1).flags & FRAME_FLAGS.TERMINAL); assert.ok(decodeMs < 100); assert.ok(seekMs < 100);
});

test('current History normalizes bounded semantic cells and rejects mismatched schemas', () => {
  const primaryCells = [4, 4, -1, 5, 6, 7, 8, 9, 10, 11, 12, 9999];
  const events = normalizeHistoryEvents([{ tick: 2, type: 'inoculation', cellId: 31 },
    { tick: 3, type: 'resource-reserve', primaryCells }]);
  assert.deepEqual(events[0].primaryCells, [31]); assert.equal(events[0].cellId, 31);
  assert.deepEqual(events[1].primaryCells, [4, 5, 6, 7, 8, 9, 10, 11]);
  assert.deepEqual(validateHistory({ schema: 8, worlds: [] }), defaultHistory());
  const oversized = validateHistory({ schema: 10, worlds: Array.from({ length: 32 }, (_, seed) => ({ seed, tick: seed,
    environmentModelVersion: 2, startEnvironmentLevel: '0' })) }, 32);
  assert.equal(oversized.worlds.length, 24);
  globalThis.localStorage = { getItem: () => JSON.stringify({ schema: 8, worlds: [] }), setItem: () => {} };
  try { assert.equal(loadHistory().schema, 10); } finally { delete globalThis.localStorage; }
});

test('dynamic History retains bounded authoritative interpolation evidence', () => {
  const dimensions = Object.fromEntries([
    ['scarcity', 'Resource yield', .45], ['renewal', 'Renewal', .40], ['climate', 'Climate', .29],
    ['toxicity', 'Toxicity', .23], ['maintenance', 'Maintenance & transport', .35],
  ].map(([key, label, pressure]) => [key, { label, pressure }]));
  const history = validateHistory({ schema: 10, worlds: [{ seed: 8, tick: 1500, score: '4', startEnvironmentLevel: '0',
    environmentModelVersion: 2, environmentScheduleVersion: 2, environmentScheduleHash: 'ce29fefd',
    environmentProfileVersion: 5,
    environmentPressureSummary: { level: '1', nextLevel: '2', profileHash: '01234567', nextProfileHash: '89abcdef',
      profileVersion: 5, nextProfileVersion: 5, interpolationQ: 500000,
      effectiveCoefficients: { resourceYieldScale: .93, renewalScale: .82, maintenanceScale: 1.13, ignored: Infinity },
      dimensions, pressure: .4, severityQ: 400000 } }] });
  const pressure = history.worlds[0].environmentPressureSummary;
  assert.equal(history.schema, 10); assert.equal(pressure.nextLevel, '2'); assert.equal(pressure.interpolationQ, 500000);
  assert.equal(pressure.detailAvailable, true); assert.equal(pressure.dimensions.scarcity.label, 'Resource yield');
  assert.deepEqual(pressure.effectiveCoefficients, { resourceYieldScale: .93, renewalScale: .82, maintenanceScale: 1.13 });
  const legacy = validateHistory({ schema: 10, worlds: [{ seed: 9, tick: 1500, score: '4', startEnvironmentLevel: '0',
    environmentModelVersion: 2, environmentProfileVersion: 4,
    environmentPressureSummary: { ...history.worlds[0].environmentPressureSummary, profileVersion: 4, dimensions } }] });
  assert.equal(legacy.worlds[0].environmentPressureSummary.detailAvailable, false);
  assert.deepEqual(legacy.worlds[0].environmentPressureSummary.dimensions, {});
});

test('semantic History enforces its byte bound even with maximum-width exact fields', () => {
  const huge = '9'.repeat(4000); const evolution = Array.from({ length: 128 }, (_, seq) => ({ seq, cell: seq,
    archetypeId: 'first-division', oldLocalLevel: huge, newLocalLevel: huge,
    oldAggregateRank: huge, newAggregateRank: huge, cost: huge, balanceBefore: huge, balanceAfter: huge,
    run: huge, bestEnvironmentLevelReached: '0', transactionKey: `wide-${seq}` }));
  for (const event of evolution) event.cell = EVOLUTION_ROOT_CELL;
  const archive = validateHistory({ schema: 10, evolutionVersion: 3,
    evolutionLayoutVersion: EVOLUTION_LAYOUT_VERSION, evolutionContentHash: EVOLUTION_CONTENT_HASH,
    worlds: [], evolution, trophies: [] }); const serialized = serializeHistory(archive);
  assert.ok(new TextEncoder().encode(serialized).byteLength <= 700000); assert.ok(archive.evolution.length > 0 && archive.evolution.length < 128);
  assert.equal(archive.evolution.at(-1).newLocalLevel, huge);
});

test('predecessor Evolution History resets while independent World and Trophy records survive', () => {
  const current = defaultHistory();
  const predecessor = validateHistory({ ...current, evolutionVersion: current.evolutionVersion - 1,
    evolutionLayoutVersion: EVOLUTION_LAYOUT_VERSION - 1, evolutionContentHash: '00000000',
    worlds: [{ seed: 7, tick: 12, environmentModelVersion: ENVIRONMENT_MODEL_VERSION, startEnvironmentLevel: '0' }],
    evolution: [{ cell: 0, archetypeId: 'first-division', oldLocalLevel: '0', newLocalLevel: '1' }],
    trophies: [{ key: 'trophy.earned', subjectId: 'first-world', tick: 12, run: '1' }] });
  assert.equal(predecessor.worlds.length, 1); assert.equal(predecessor.trophies.length, 1);
  assert.deepEqual(predecessor.evolution, []);
  assert.equal(predecessor.evolutionLayoutVersion, EVOLUTION_LAYOUT_VERSION);
  assert.equal(predecessor.evolutionContentHash, EVOLUTION_CONTENT_HASH);
});

test('recent-runs rejects v1 buffers and gracefully degrades without IndexedDB', async () => {
  const buffer = encodeVisualHistory({ cellCount: 32, seed: 2 }, [frame(0, FRAME_FLAGS.INITIAL | FRAME_FLAGS.TERMINAL)]);
  const v1 = buffer.slice(0); new Uint8Array(v1)[4] = 1;
  assert.ok(validateRecentRun({ id: '1-2-abcd', seed: 2, completedAt: 1, buffer }));
  assert.equal(validateRecentRun({ id: '1-2-abcd', seed: 2, completedAt: 1, buffer: v1 }), null);
  assert.equal(validateRecentRun({ id: '1-2-abcd', seed: 3, completedAt: 1, buffer }), null);
  const recent = createRecentRuns(null); assert.equal(await recent.ready(), false);
  assert.equal(await recent.put({}), false); assert.equal(await recent.get('missing'), null); assert.deepEqual(await recent.list(), []);
});

test('completed visual and semantic History retain an unsigned 32-bit world seed', () => {
  const seed = 2693800525;
  const buffer = encodeVisualHistory({ cellCount: 32, seed }, [frame(0, FRAME_FLAGS.INITIAL | FRAME_FLAGS.TERMINAL)]);
  assert.ok(validateRecentRun({ id: '1-2-full-word', seed, completedAt: 1, buffer }));
  const archive = validateHistory({ schema: 10, worlds: [{ seed, tick: 5,
    environmentModelVersion: ENVIRONMENT_MODEL_VERSION, startEnvironmentLevel: '0' }] });
  assert.equal(archive.worlds[0]?.seed, seed);
});

test('past-world load guard rejects stale asynchronous completions', () => {
  const guard = createHistoryLoadGuard(); const first = guard.next(); const second = guard.next();
  assert.equal(guard.isCurrent(first), false); assert.equal(guard.isCurrent(second), true);
  guard.invalidate(); assert.equal(guard.isCurrent(second), false);
});

test('current History only swaps to a visual checkpoint after matching v3 data is decoded', () => {
  const identity = createWorldIdentity({ worldSessionId: 1, runId: 1, seed: 7, presentationGeneration: 1,
    environmentModelVersion: ENVIRONMENT_MODEL_VERSION, environmentScheduleVersion: ENVIRONMENT_SCHEDULE_VERSION,
    environmentScheduleHash: ENVIRONMENT_SCHEDULE_HASH, immutableStartConfigurationHash: 'abcdef12' }); const sent = []; const world = { id: 'current', current: true, seed: 7, tick: 50, events: [] };
  const app = { state: 'running', visualSeed: 7, runSeed: 7, overlay: null, archive: { worlds: [] }, currentHistory: [],
    snapshot: { ...identityFields(identity), tick: 50 }, lastResult: null, worldIdentity: identity,
    topo4: { nodeCount: 32 }, topo: null, driver: { generation: 2, message(value) { sent.push(value); } },
    historySnapshot: null, historyHighlights: [], historyPlaybackActive: false,
    makeRenderer(seed) { this.visualSeed = seed; }, resize() {}, openFull() { this.overlay = 'history'; }, activateSurface() {} };
  app.topo = app.topo4; app.historyUi = { worldId: 'current', surface: { hidden: false }, selectedWorld: world, tick: 50,
    isLive: false, visualAvailable: null, setAvailability(value) { this.visualAvailable = value; }, updateFrame(tick, liveTick, presentation) { this.presentation = presentation; } };
  const playback = createHistoryPlayback(app); playback.selectWorld(world); playback.seek(10, null, world);
  assert.equal(app.historySnapshot, null); assert.equal(app.historyPlaybackActive, false); assert.equal(app.historyUi.presentation.mode, 'loading');
  const buffer = encodeVisualHistory({ cellCount: 32, seed: 7 }, [frame(0, FRAME_FLAGS.INITIAL), frame(50, FRAME_FLAGS.TERMINAL)]);
  assert.equal(playback.handle({ t: 'history-buffer', requestId: sent[0].requestId, buffer, ...identityFields(identity) }), true);
  assert.equal(app.historyPlaybackActive, true); assert.equal(app.historySnapshot.historyVisual, true);
  assert.equal(app.historySnapshot.historyFrameTick, 50); assert.equal(app.historySnapshot.resourceState[18], 5);
  playback.live(); assert.equal(app.historySnapshot, null); assert.equal(app.historyPlaybackActive, false);
});

test('a stale current visual-buffer response cannot overwrite a newer world selection', () => {
  const identity = createWorldIdentity({ worldSessionId: 2, runId: 2, seed: 8, presentationGeneration: 1,
    environmentModelVersion: ENVIRONMENT_MODEL_VERSION, environmentScheduleVersion: ENVIRONMENT_SCHEDULE_VERSION,
    environmentScheduleHash: ENVIRONMENT_SCHEDULE_HASH, immutableStartConfigurationHash: 'abcdef13' }); const sent = [];
  const current = { id: 'current', current: true, seed: 8, tick: 50, events: [] }; const past = { id: 'past-8', current: false, seed: 9, tick: 25, events: [] };
  const app = { state: 'running', visualSeed: 8, runSeed: 8, overlay: null, archive: { worlds: [] }, currentHistory: [],
    snapshot: { ...identityFields(identity), tick: 50 }, lastResult: null, worldIdentity: identity,
    topo4: { nodeCount: 32 }, topo: null, driver: { generation: 2, message(value) { sent.push(value); } },
    historySnapshot: null, historyHighlights: [], historyPlaybackActive: false,
    makeRenderer(seed) { this.visualSeed = seed; this.topo = this.topo4; }, resize() {}, openFull() {}, activateSurface() {} };
  app.topo = app.topo4; app.historyUi = { worldId: 'current', surface: { hidden: false }, selectedWorld: current, tick: 50,
    isLive: false, visualAvailable: null, setAvailability(value) { this.visualAvailable = value; }, updateFrame() {}, get selectedEvent() { return null; } };
  const playback = createHistoryPlayback(app); playback.selectWorld(current); const staleRequest = sent.at(-1).requestId;
  app.historyUi.worldId = past.id; app.historyUi.selectedWorld = past; app.historyUi.tick = past.tick; playback.selectWorld(past);
  app.historyUi.worldId = 'current'; app.historyUi.selectedWorld = current; app.historyUi.tick = current.tick; playback.selectWorld(current);
  const freshRequest = sent.at(-1).requestId;
  const fresh = encodeVisualHistory({ cellCount: 32, seed: 8 }, [frame(0, FRAME_FLAGS.INITIAL), frame(50, FRAME_FLAGS.TERMINAL)]);
  const stale = encodeVisualHistory({ cellCount: 32, seed: 8 }, [frame(0, FRAME_FLAGS.INITIAL), frame(25, FRAME_FLAGS.TERMINAL)]);
  playback.handle({ t: 'history-buffer', requestId: freshRequest, buffer: fresh, ...identityFields(identity) });
  assert.equal(app.historySnapshot.historyFrameTick, 50);
  playback.handle({ t: 'history-buffer', requestId: staleRequest, buffer: stale, ...identityFields(identity) });
  assert.equal(app.historySnapshot.historyFrameTick, 50);
});

test('Live and close restore current fields and snapshot immediately', () => {
  const app = { state: 'running', visualSeed: 7, runSeed: 7, overlay: null, archive: { worlds: [] }, currentHistory: [],
    snapshot: { tick: 90 }, lastResult: null, driver: { generation: 2, message() {} }, historySnapshot: null, historyHighlights: [],
    makeRenderer(seed) { this.visualSeed = seed; }, resize() {}, openFull() { this.overlay = 'history'; }, activateSurface() {} };
  let playback; app.historyUi = { worldId: 'current', surface: {}, setAvailability() {}, updateFrame() {}, selectedWorld: { current: true, tick: 90 },
    open(model, id) { this.worldId = id; playback.selectWorld(model.worlds.find((world) => world.id === id)); } };
  playback = createHistoryPlayback(app); playback.open('current'); app.visualSeed = 99; app.historySnapshot = { approximate: true };
  app.historyHighlights = [4]; playback.live(); assert.equal(app.visualSeed, 7); assert.equal(app.historySnapshot, null);
  assert.deepEqual(app.historyHighlights, []); app.visualSeed = 88; app.historySnapshot = {}; playback.close();
  assert.equal(app.visualSeed, 7); assert.equal(app.historySnapshot, null);
});
