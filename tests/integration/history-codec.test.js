/** Visual History codec, recorder bounds, migration, and neutrality. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { decodeVisualHistory, encodeVisualHistory, MAX_BYTES, thinFrames } from '../../src/history/codec.js';
import { createPreviewBuffers, nearestFrame, projectPreview } from '../../src/history/preview.js';
import { RunController } from '../../src/simulation/simulator.js';
import { scoreResult } from '../../src/game/scoring.js';
import { createRecentRuns, validateRecentRun } from '../../src/platform/recent-runs.js';
import { createHistoryLoadGuard, createHistoryPlayback } from '../../src/interface/history-playback.js';
import { loadHistory, normalizeHistoryEvents, serializeHistory, validateHistory } from '../../src/platform/history.js';

function frame(tick, flags = 0, cells = 32) {
  const data = new Uint8Array(cells); data[tick % cells] = 0b10111001;
  return { tick, entropyQ: tick % 256, flags, aliveCount: 1, cells: data };
}

test('INHV v1 round trips fixed checkpoints and projects reusable buffers', () => {
  const input = [frame(0, 5), frame(50), frame(93, 3)];
  const buffer = encodeVisualHistory({ cellCount: 32, seed: 17, cadence: 50 }, input);
  const decoded = decodeVisualHistory(buffer);
  assert.equal(decoded.version, 1); assert.equal(decoded.seed, 17); assert.equal(decoded.frames.length, 3);
  assert.deepEqual([...decoded.frames[1].cells], [...input[1].cells]);
  assert.equal(nearestFrame(decoded.frames, 70).tick, 50); assert.equal(nearestFrame(decoded.frames, 73).tick, 93);
  const reuse = createPreviewBuffers(32); const projected = projectPreview(decoded.frames[1], reuse);
  assert.strictEqual(projected.alive, reuse.alive); assert.equal(projected.alive[18], 1);
  assert.equal(projected.lifeState[18], 2);
  for (const removed of ['nutrient', 'conductance', 'flux', 'edgeActive']) assert.equal(removed in projected, false);
});

test('codec rejects malformed, truncated, oversized, and unordered data', () => {
  const valid = encodeVisualHistory({ cellCount: 32, seed: 2 }, [frame(0, 1), frame(5, 2)]);
  const badMagic = valid.slice(0); new Uint8Array(badMagic)[0] = 0;
  assert.throws(() => decodeVisualHistory(badMagic), /magic/);
  assert.throws(() => decodeVisualHistory(valid.slice(0, -1)), /length/);
  assert.throws(() => encodeVisualHistory({ cellCount: 32, seed: 2 }, [frame(5), frame(5)]), /checkpoint/);
  assert.throws(() => decodeVisualHistory(new ArrayBuffer(MAX_BYTES + 1)), /size/);
});

test('thinning preserves every major checkpoint before ordinary cadence', () => {
  const frames = Array.from({ length: 130 }, (_, index) => frame(index * 10, index % 29 === 0 ? 1 : 0, 2562));
  const thinned = thinFrames(frames, 2562); const buffer = encodeVisualHistory({ cellCount: 2562, seed: 9 }, frames);
  assert.ok(buffer.byteLength <= MAX_BYTES); assert.ok(thinned.length < frames.length);
  for (const major of frames.filter((item) => item.flags)) assert.ok(thinned.some((item) => item.tick === major.tick));
});

test('a detailed five-minute run stays bounded and recorder is authority-neutral', () => {
  const cfg = { seed: 20260731 }; const quiet = new RunController(cfg); quiet.start();
  const observed = new RunController(cfg); observed.start();
  while (quiet.state.status !== 'extinct') quiet.advance(37);
  while (observed.state.status !== 'extinct') { observed.advance(11); observed.historyPreview(observed.state.tick - 23); observed.historyBuffer(); }
  const a = quiet.buildResult(); const b = observed.buildResult();
  assert.deepEqual({ hash: b.hash, cause: b.cause, offers: b.offers, history: b.history, imprint: b.imprint },
    { hash: a.hash, cause: a.cause, offers: a.offers, history: a.history, imprint: a.imprint });
  assert.deepEqual(scoreResult(b), scoreResult(a));
  const started = performance.now(); const buffer = observed.historyBuffer(); const decoded = decodeVisualHistory(buffer);
  const decodeMs = performance.now() - started; const seekStart = performance.now();
  for (let i = 0; i < 10_000; i++) nearestFrame(decoded.frames, i % (decoded.terminalTick + 1));
  const seekMs = performance.now() - seekStart;
  assert.ok(buffer.byteLength <= MAX_BYTES); assert.equal(decoded.frames[0].tick, 0);
  assert.ok(decoded.frames.at(-1).flags & 2); assert.ok(decodeMs < 100); assert.ok(seekMs < 100);
});

test('current History normalizes bounded semantic cells and rejects mismatched schemas', () => {
  const primaryCells = [4, 4, -1, 5, 6, 7, 8, 9, 10, 11, 12, 9999];
  const events = normalizeHistoryEvents([{ tick: 2, type: 'inoculation', cellId: 31 },
    { tick: 3, type: 'resource-reserve', primaryCells }]);
  assert.deepEqual(events[0].primaryCells, [31]); assert.equal(events[0].cellId, 31);
  assert.deepEqual(events[1].primaryCells, [4, 5, 6, 7, 8, 9, 10, 11]);
  assert.deepEqual(validateHistory({ schema: 8, worlds: [] }), { schema: 9, worlds: [], evolution: [], trophies: [] });
  globalThis.localStorage = { getItem: () => JSON.stringify({ schema: 8, worlds: [] }), setItem: () => {} };
  try { assert.equal(loadHistory().schema, 9); } finally { delete globalThis.localStorage; }
});

test('dynamic History retains bounded authoritative interpolation evidence', () => {
  const history = validateHistory({ schema: 9, worlds: [{ seed: 8, tick: 1500, score: '4', startEnvironmentLevel: '0',
    environmentModelVersion: 2, environmentScheduleVersion: 2, environmentScheduleHash: 'ce29fefd',
    environmentPressureSummary: { level: '1', nextLevel: '2', profileHash: '01234567', nextProfileHash: '89abcdef',
      interpolationQ: 500000, effectiveCoefficients: { renewalScale: .82, maintenanceScale: 1.13, ignored: Infinity },
      pressure: .4, severityQ: 400000 } }] });
  const pressure = history.worlds[0].environmentPressureSummary;
  assert.equal(history.schema, 9); assert.equal(pressure.nextLevel, '2'); assert.equal(pressure.interpolationQ, 500000);
  assert.deepEqual(pressure.effectiveCoefficients, { renewalScale: .82, maintenanceScale: 1.13 });
});

test('semantic History enforces its byte bound even with maximum-width exact fields',()=>{
  const huge='9'.repeat(4000),evolution=Array.from({length:128},(_,seq)=>({seq,nodeId:'ecology-tempered-scars',oldLevel:huge,newLevel:huge,
    cost:huge,balanceBefore:huge,balanceAfter:huge,run:huge,environmentLevel:'0',transactionKey:`wide-${seq}`}));
  const archive=validateHistory({schema:9,worlds:[],evolution,trophies:[]},32),serialized=serializeHistory(archive);
  assert.ok(new TextEncoder().encode(serialized).byteLength<=700000);assert.ok(archive.evolution.length>0&&archive.evolution.length<128);
  assert.equal(archive.evolution.at(-1).newLevel,huge);
});

test('recent-runs validates buffers and gracefully degrades without IndexedDB', async () => {
  const buffer = encodeVisualHistory({ cellCount: 32, seed: 2 }, [frame(0, 3)]);
  assert.ok(validateRecentRun({ id: '1-2-abcd', seed: 2, completedAt: 1, buffer }));
  assert.equal(validateRecentRun({ id: '1-2-abcd', seed: 3, completedAt: 1, buffer }), null);
  const recent = createRecentRuns(null); assert.equal(await recent.ready(), false);
  assert.equal(await recent.put({}), false); assert.equal(await recent.get('missing'), null); assert.deepEqual(await recent.list(), []);
});

test('past-world load guard rejects stale asynchronous completions', () => {
  const guard = createHistoryLoadGuard(); const first = guard.next(); const second = guard.next();
  assert.equal(guard.isCurrent(first), false); assert.equal(guard.isCurrent(second), true);
  guard.invalidate(); assert.equal(guard.isCurrent(second), false);
});

test('Live and close restore current fields and snapshot immediately', () => {
  const app = { state: 'running', visualSeed: 7, runSeed: 7, overlay: null, archive: { worlds: [] }, currentHistory: [],
    snapshot: { tick: 90 }, lastResult: null, driver: { generation: 2, message() {} }, historySnapshot: null, historyHighlights: [],
    makeRenderer(seed) { this.visualSeed = seed; }, resize() {}, openFull() { this.overlay = 'history'; }, activateSurface() {} };
  let playback; app.historyUi = { worldId: 'current', surface: {}, setAvailability() {}, updateFrame() {},
    open(model, id) { this.worldId = id; playback.selectWorld(model.worlds.find((world) => world.id === id)); } };
  playback = createHistoryPlayback(app); playback.open('current'); app.visualSeed = 99; app.historySnapshot = { approximate: true };
  app.historyHighlights = [4]; playback.live(); assert.equal(app.visualSeed, 7); assert.equal(app.historySnapshot, null);
  assert.deepEqual(app.historyHighlights, []); app.visualSeed = 88; app.historySnapshot = {}; playback.close();
  assert.equal(app.visualSeed, 7); assert.equal(app.historySnapshot, null);
});
