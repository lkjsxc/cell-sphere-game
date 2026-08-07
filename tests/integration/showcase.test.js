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
  assert.equal(TITLE_SHOWCASE.schema,1);assert.equal(TITLE_SHOWCASE.replayVersion, REPLAY_VERSION);
  assert.equal(TITLE_SHOWCASE.frameCount, 89); assert.equal(TITLE_SHOWCASE.durationMs, 22_250);
  assert.equal(TITLE_SHOWCASE.frameIntervalMs, 250); assert.equal(history.cellCount, 2562);
  assert.equal(history.frames.length, TITLE_SHOWCASE.frameCount);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), TITLE_SHOWCASE.dataHash);
  assert.match(TITLE_SHOWCASE.sourceHash, /^[0-9a-f]{64}$/);
});

test('showcase has germination, branching, maturity, pressure, fragmentation, and extinction', () => {
  const { history } = payload(); const counts = history.frames.map((frame) => frame.aliveCount);
  assert.deepEqual(counts.slice(0, 4), [1, 1, 1, 1]);
  assert.ok(counts[12] > 150 && counts[13] > 200 && counts[26] === TITLE_SHOWCASE.peakLiving);
  assert.equal(TITLE_SHOWCASE.worldOrdinal, 3);
  assert.ok(TITLE_SHOWCASE.matureTick > TITLE_SHOWCASE.peakTick && TITLE_SHOWCASE.pressureTick > TITLE_SHOWCASE.matureTick);
  assert.ok(counts[42] > counts[72] && counts[72] > counts[84]);
  assert.equal(counts.at(-1), 0);
  const sixPoints = [0, 12, 26, 42, 72, 88].map((index) => counts[index]);
  assert.equal(new Set(sixPoints).size, sixPoints.length);
});

test('runtime decodes once, starts visibly, and retains bounded cell arrays', () => {
  const title = new TitleShowcase(createTopology(4));
  assert.equal(title.snapshot.alive[TITLE_SHOWCASE.focusCell], 1);
  assert.equal(title.frames.length, TITLE_SHOWCASE.frameCount);
  const retained = title.frames.reduce((sum, frame) => sum + frame.cells.byteLength, 0)
    + title.snapshot.alive.byteLength + title.snapshot.biomass.byteLength
    + title.snapshot.stress.byteLength + title.snapshot.lifeState.byteLength;
  assert.ok(retained < 260 * 1024, `retained ${retained}`);
  title.update(0); const firstArrays = title.buffers;
  title.update(6000); assert.equal(title.buffers, firstArrays);
  assert.ok(title.snapshot.metrics.aliveCount > 100);
});
