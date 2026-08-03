/** Run-ID transport, watchdog, and abort/extinction first-wins contracts. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRunDriver } from '../../src/interface/run-driver.js';
import { seedForRun } from '../../src/interface/app-data.js';

class FakeWorker {
  static instances = [];
  constructor() { this.sent = []; this.terminated = false; FakeWorker.instances.push(this); }
  postMessage(message) { this.sent.push(message); }
  terminate() { this.terminated = true; }
  deliver(data) { this.onmessage?.({ data }); }
}
function withWorkers(run) {
  const prior = globalThis.Worker; globalThis.Worker = FakeWorker; FakeWorker.instances = [];
  try { return run(); } finally { if (prior) globalThis.Worker = prior; else delete globalThis.Worker; }
}

test('world seed sequence advances unless an explicit seed is present', () => {
  assert.equal(seedForRun(0, '?demo=1'), 20260731);
  assert.equal(seedForRun(1, '?demo=1'), 20365460);
  assert.equal(seedForRun(9, '?seed=123'), 123);
});

test('fallback abort is authoritative, reward-free data, and exactly once', () => {
  const messages = []; const driver = createRunDriver({ worker: false }, (message) => messages.push(message));
  const runId = driver.start({ seed: 42, adaptationMode: 'manual' }, 1);
  assert.ok(messages.every((message) => message.runId === runId));
  driver.frame(1000, performance.now());
  assert.equal(driver.abort(), true); assert.equal(driver.outcome, 'aborted');
  assert.equal(driver.abort(), false);
  const aborts = messages.filter((message) => message.t === 'aborted'); assert.equal(aborts.length, 1);
  assert.equal(aborts[0].summary.runId, runId); assert.equal(aborts[0].summary.cause, 'abandoned');
  assert.equal('echoes' in aborts[0].summary, false); assert.equal('imprint' in aborts[0].summary, false);
  assert.equal(aborts[0].summary.history.at(-1).type, 'run-abandoned');
});

test('new generations reject stale messages from prior workers', () => withWorkers(() => {
  const messages = []; const driver = createRunDriver({ worker: true }, (message) => messages.push(message));
  const first = driver.start({ seed: 1 }, 1); const oldWorker = FakeWorker.instances.at(-1);
  const second = driver.start({ seed: 2 }, 1); const current = FakeWorker.instances.at(-1);
  assert.ok(second > first && oldWorker.terminated);
  oldWorker.deliver({ t: 'extinct', runId: first, summary: { runId: first } });
  current.deliver({ t: 'ready', runId: second });
  assert.equal(messages.some((message) => message.runId === first), false);
  assert.equal(messages.filter((message) => message.t === 'ready').length, 1);
}));

test('abort and extinction races settle on the first delivered authority outcome', () => withWorkers(() => {
  const outcomes = []; const driver = createRunDriver({ worker: true }, (message) => {
    if (message.t === 'aborted' || message.t === 'extinct') outcomes.push(message.t);
  });
  const first = driver.start({ seed: 3 }, 1); const a = FakeWorker.instances.at(-1);
  a.deliver({ t: 'ready', runId: first }); driver.ready(); driver.abort();
  a.deliver({ t: 'extinct', runId: first, summary: { runId: first } });
  a.deliver({ t: 'aborted', runId: first, summary: { runId: first } });
  assert.deepEqual(outcomes, ['extinct']);
  const second = driver.start({ seed: 4 }, 1); const b = FakeWorker.instances.at(-1);
  b.deliver({ t: 'ready', runId: second }); driver.ready(); driver.abort();
  b.deliver({ t: 'aborted', runId: second, summary: { runId: second } });
  b.deliver({ t: 'extinct', runId: second, summary: { runId: second } });
  assert.deepEqual(outcomes, ['extinct', 'aborted']);
}));

test('worker silence requests status then exposes an explicit recoverable failure', () => withWorkers(() => {
  const messages = []; const driver = createRunDriver({ worker: true }, (message) => messages.push(message));
  const runId = driver.start({ seed: 5 }, 1); const worker = FakeWorker.instances.at(-1);
  worker.deliver({ t: 'ready', runId }); driver.ready(); const base = performance.now();
  driver.frame(0, base + 2600);
  assert.equal(worker.sent.some((message) => message.t === 'status' && message.runId === runId), true);
  driver.frame(0, base + 5100);
  assert.equal(driver.outcome, 'failed'); assert.equal(worker.terminated, true);
  assert.equal(messages.at(-1).t, 'worker-failed'); assert.equal(messages.at(-1).runId, runId);
}));
