/** Production-generated title lifecycle provenance and runtime contracts. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { decodeVisualHistory } from '../../src/history/codec.js';
import { createTopology } from '../../src/world/icosphere.js';
import { TitleShowcase, TITLE_SHOWCASE } from '../../src/showcase/player.js';
import { REPLAY_VERSION } from '../../src/simulation/replay.js';

function payload() {
  const bytes = Buffer.from(TITLE_SHOWCASE.dataBase64, 'base64');
  return { bytes, history: decodeVisualHistory(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)) };
}

test('showcase metadata and checked-in bytes are exact', () => {
  const { bytes, history } = payload();
  assert.equal(TITLE_SHOWCASE.schema,2); assert.equal(TITLE_SHOWCASE.replayVersion, REPLAY_VERSION);
  assert.equal(TITLE_SHOWCASE.frameCount, 30); assert.equal(TITLE_SHOWCASE.durationMs, 22_500);
  assert.equal(TITLE_SHOWCASE.frameIntervalMs, 750); assert.equal(history.cellCount, 2562);
  assert.equal(history.frames.length, TITLE_SHOWCASE.frameCount);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), TITLE_SHOWCASE.dataHash);
  assert.match(TITLE_SHOWCASE.sourceHash, /^[0-9a-f]{64}$/);
});

test('showcase has germination, branching, maturity, pressure, fragmentation, and extinction', () => {
  const { history } = payload(); const counts = history.frames.map((frame) => frame.aliveCount);
  assert.deepEqual(counts.slice(0, 2), [1, 1]);
  const peakIndex = counts.indexOf(TITLE_SHOWCASE.peakLiving);
  assert.ok(peakIndex > 2 && peakIndex < counts.length - 8); assert.ok(TITLE_SHOWCASE.peakLiving > 100);
  assert.equal(TITLE_SHOWCASE.worldOrdinal, 3);
  assert.ok(TITLE_SHOWCASE.matureTick > TITLE_SHOWCASE.peakTick && TITLE_SHOWCASE.pressureTick > TITLE_SHOWCASE.matureTick);
  assert.ok(counts[peakIndex] > counts[Math.floor((peakIndex + counts.length - 1) / 2)]);
  assert.equal(counts.at(-1), 0);
  const sixPoints = [0, 2, peakIndex, 20, 25, 29].map((index) => counts[index]);
  assert.equal(new Set(sixPoints).size, sixPoints.length);
});

test('runtime decodes once, starts visibly, and retains bounded cell arrays', () => {
  const title = new TitleShowcase(createTopology(4));
  assert.equal(title.snapshot.alive[TITLE_SHOWCASE.focusCell], 1);
  assert.equal(title.frames.length, TITLE_SHOWCASE.frameCount);
  const retained = title.frames.reduce((sum, frame) => sum + frame.cells.byteLength + frame.resources.byteLength + frame.worldmaking.byteLength, 0)
    + title.snapshot.alive.byteLength + title.snapshot.biomass.byteLength + title.snapshot.stress.byteLength
    + title.snapshot.lifeState.byteLength + title.snapshot.resourceRichnessQ.byteLength + title.snapshot.resourceState.byteLength
    + title.snapshot.transformationState.byteLength + title.snapshot.electricityQ.byteLength;
  assert.ok(retained < 300 * 1024, `retained ${retained}`);
  title.update(0); const firstArrays = title.buffers;
  title.update(6000); assert.equal(title.buffers, firstArrays);
  assert.ok(title.snapshot.metrics.aliveCount > 100);
});
