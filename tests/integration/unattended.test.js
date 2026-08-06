/** Nonvisual soak for persistent result-to-next-world ownership. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RunController } from '../../src/simulation/simulator.js';
import { defaultMeta } from '../../src/platform/storage.js';
import { clearHistory, serializeHistory } from '../../src/platform/history.js';
import { createAppState } from '../../src/interface/app-state.js';
import { applyRunResult } from '../../src/interface/policies/run-result.js';
import { advanceContinuation, completeContinuation, createContinuation, setContinuationHidden,
  startContinuation } from '../../src/interface/policies/continuation.js';

function complete(seed, worldOrdinal = 1) {
  const run = new RunController({ seed, worldOrdinal, worldPotential:16000 }); run.start();
  let guard = 0; while (run.state.status !== 'extinct' && guard++ < 500) run.advance(50);
  assert.equal(run.state.status, 'extinct'); return run.buildResult();
}

test('bounded transaction keys reject delayed results after a newer world', () => {
  let meta = defaultMeta(); let archive = clearHistory(); const keys = new Set();
  const first = { ...complete(101, 1), runId: 1 }; const second = { ...complete(102, 2), runId: 2 };
  for(const result of[first,second]){meta={...meta,worldSeedIndex:result.worldOrdinal};const transaction=applyRunResult(meta,archive,result,24,keys);
    assert.equal(transaction.applied, true); keys.add(transaction.key); meta = transaction.meta; archive = transaction.archive; }
  assert.equal(applyRunResult(meta, archive, first, 24, keys).applied, false);
  assert.equal(meta.runs, '2');
});

test('100 unattended result transitions award once and remain bounded', { timeout: 60_000 }, () => {
  let meta = defaultMeta(); let archive = clearHistory(); let lastKey = null; let echoes = 0n; let now = 0;
  const flow = createAppState(); const countdown = createContinuation(9000); const heapStart = process.memoryUsage().heapUsed;
  for (let world = 0; world < 100; world++) {
    flow.send(world ? 'restart' : 'begin'); flow.send('ready'); const result = complete(5_000_000 + world, world + 1);
    flow.send('extinct');meta={...meta,worldSeedIndex:result.worldOrdinal};const transaction=applyRunResult(meta,archive,result,24,lastKey);
    assert.equal(transaction.applied,true,`world ${world+1}: ${transaction.reason}`);meta=transaction.meta;archive=transaction.archive;
    lastKey = transaction.key; echoes += BigInt(transaction.score.echoes);
    assert.equal(applyRunResult(meta, archive, result, 24, lastKey).applied, false, 'duplicate result awarded');
    startContinuation(countdown, now); now += 4000; assert.equal(advanceContinuation(countdown, now), false);
    if (world % 10 === 0) { setContinuationHidden(countdown, true, now); now += 30_000;
      assert.equal(advanceContinuation(countdown, now), false); setContinuationHidden(countdown, false, now); }
    now += 5000; assert.equal(advanceContinuation(countdown, now), true);
    assert.equal(completeContinuation(countdown, countdown.generation), true);
  }
  assert.equal(meta.runs, '100'); assert.equal(meta.totalEchoes, String(echoes)); assert.equal(meta.echoBalance, String(echoes));
  assert.equal(archive.worlds.length, 24); assert.ok(serializeHistory(archive, 24).length < 700_000);
  assert.ok(meta.imprints.length <= 8); assert.ok(process.memoryUsage().heapUsed - heapStart < 160 * 1024 * 1024);
});
