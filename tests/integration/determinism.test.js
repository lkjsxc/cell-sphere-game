/** GOLDEN-CLASS INTEGRATION: the core determinism contract.
 *
 * Same seed + same decisions must produce an identical final state hash
 * regardless of how ticks are batched (speed), when draft decisions are
 * delivered (pause/resume), or which signals are placed when.
 *
 * These tests run the production RunController — no simplified model.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RunController } from '../../src/simulation/simulator.js';

/** Run to extinction with auto-decisions; returns the final result. */
function runFull(cfg, { chunk = 50, decideDelay = 0, signals = [] } = {}) {
  let pending = null;
  let waited = 0;
  const rc = new RunController(cfg, (m) => {
    if (m.t === 'draft') pending = m;
  });
  rc.start();

  const signalAt = new Map(signals); // tick -> node
  let guard = 0;
  while (rc.state.status !== 'extinct' && guard++ < 6000) {
    rc.advance(chunk);
    // Deliver a queued decision after the requested delay.
    if (pending) {
      if (waited++ >= decideDelay) {
        rc.decide(pending.options[0]);
        pending = null;
        waited = 0;
      }
    }
    const sig = signalAt.get(rc.state.tick);
    if (sig !== undefined) rc.placeSignal(sig);
  }
  assert.equal(rc.state.status, 'extinct', 'run did not finish');
  return rc.buildResult();
}

test('same seed reproduces the identical final hash', () => {
  const a = runFull({ seed: 424242, strainId: 'pioneer' });
  const b = runFull({ seed: 424242, strainId: 'pioneer' });
  assert.equal(a.hash, b.hash);
  assert.equal(a.tick, b.tick);
  assert.equal(a.cause, b.cause);
  assert.deepEqual(a.ownedCards, b.ownedCards);
});

test('different seeds diverge', () => {
  const a = runFull({ seed: 1 });
  const b = runFull({ seed: 2 });
  assert.notEqual(a.hash, b.hash);
});

test('speed invariance: chunk 1 / 7 / 32 / 50 yield identical outcomes', () => {
  const ref = runFull({ seed: 987654, strainId: 'conservator' }, { chunk: 50 });
  for (const chunk of [1, 7, 32]) {
    const r = runFull({ seed: 987654, strainId: 'conservator' }, { chunk });
    assert.equal(r.hash, ref.hash, `chunk ${chunk} diverged`);
    assert.equal(r.tick, ref.tick, `chunk ${chunk} length diverged`);
  }
});

test('pause/resume around drafts does not change the outcome', () => {
  const immediate = runFull({ seed: 55555, strainId: 'weaver' }, { decideDelay: 0 });
  const delayed = runFull({ seed: 55555, strainId: 'weaver' }, { decideDelay: 3, chunk: 11 });
  assert.equal(delayed.hash, immediate.hash);
  assert.equal(delayed.tick, immediate.tick);
});

test('signals at fixed ticks are deterministic', () => {
  const signals = [[120, 500], [400, 1000], [900, 1500]];
  const a = runFull({ seed: 7777 }, { signals });
  const b = runFull({ seed: 7777 }, { signals, chunk: 13 });
  assert.equal(a.hash, b.hash);
  assert.ok(a.signalsPlaced >= 1, 'no signals registered');
});

test('strain choice changes the outcome', () => {
  const pioneer = runFull({ seed: 31337, strainId: 'pioneer' });
  const weaver = runFull({ seed: 31337, strainId: 'weaver' });
  assert.notEqual(pioneer.hash, weaver.hash);
});

test('replay log round-trips with the run', () => {
  const r = runFull({ seed: 24680 }, { signals: [[150, 42]] });
  assert.ok(r.replay.length >= 7, `replay too short: ${r.replay.length}`);
  // Entries are [tick, type, ...]; ticks must be nondecreasing.
  let last = -1;
  for (const entry of r.replay) {
    assert.ok(entry[0] >= last, 'replay ticks decreased');
    last = entry[0];
    assert.ok(Number.isInteger(entry[1]), 'replay type not integer');
  }
});
