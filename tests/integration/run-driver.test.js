/** Run-ID transport, watchdog, and abort/extinction first-wins contracts. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRunDriver } from '../../src/interface/run-driver.js';
import { seedForRun } from '../../src/interface/app-data.js';
import { identityFields } from '../../src/core/world-session.js';

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
function deliver(worker, driver, message) { worker.deliver({ ...message, ...identityFields(driver.identity) }); }

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

test('Adaptation commands acknowledge success and reject duplicates in fallback authority', async () => {
  const messages = []; const driver = createRunDriver({ worker: false }, (message) => messages.push(message));
  const runId = driver.start({ seed: 77, adaptationMode: 'manual' }, 32);
  driver.frame(1500, performance.now()); const offer = messages.find((message) => message.t === 'adaptation-offered')?.offer;
  assert.ok(offer); const invalid = driver.chooseAdaptation(offer, 'not-offered'); await Promise.resolve();
  assert.equal(messages.find((message) => message.commandId === invalid.commandId)?.reason, 'option-not-present');
  const accepted = driver.chooseAdaptation(offer, offer.options[1]); await Promise.resolve();
  const selected = messages.find((message) => message.t === 'adaptation-selected' && message.commandId === accepted.commandId);
  assert.equal(selected.runId, runId); assert.equal(selected.offerVersion, offer.offerVersion); assert.equal(selected.protocolVersion, 2);
  const duplicate = driver.chooseAdaptation(offer, offer.options[1]); await Promise.resolve();
  assert.equal(messages.find((message) => message.commandId === duplicate.commandId)?.reason, 'already-resolved');
  assert.equal(messages.filter((message) => message.t === 'adaptation-selected').length, 1);
  const mode = driver.setAdaptationMode('manual'); await Promise.resolve();
  assert.equal(messages.find((message) => message.t === 'adaptation-mode' && message.commandId === mode.commandId)?.mode, 'manual');
});

test('new generations reject stale messages from prior workers', () => withWorkers(() => {
  const messages = []; const driver = createRunDriver({ worker: true }, (message) => messages.push(message));
  const first = driver.start({ seed: 1 }, 1); const oldWorker = FakeWorker.instances.at(-1);
  const second = driver.start({ seed: 2 }, 1); const current = FakeWorker.instances.at(-1);
  assert.ok(second > first && oldWorker.terminated);
  oldWorker.deliver({ t: 'extinct', runId: first, summary: { runId: first } });
  deliver(current, driver, { t: 'ready', runId: second });
  assert.equal(messages.some((message) => message.runId === first), false);
  assert.equal(messages.filter((message) => message.t === 'ready').length, 1);
}));

test('abort and extinction races settle on the first delivered authority outcome', () => withWorkers(() => {
  const outcomes = []; const driver = createRunDriver({ worker: true }, (message) => {
    if (message.t === 'aborted' || message.t === 'extinct') outcomes.push(message.t);
  });
  const first = driver.start({ seed: 3 }, 1); const a = FakeWorker.instances.at(-1);
  deliver(a, driver, { t: 'ready', runId: first }); driver.ready(); driver.abort();
  deliver(a, driver, { t: 'extinct', runId: first, summary: { runId: first } });
  deliver(a, driver, { t: 'aborted', runId: first, summary: { runId: first } });
  assert.deepEqual(outcomes, ['extinct']);
  const second = driver.start({ seed: 4 }, 1); const b = FakeWorker.instances.at(-1);
  deliver(b, driver, { t: 'ready', runId: second }); driver.ready(); driver.abort();
  deliver(b, driver, { t: 'aborted', runId: second, summary: { runId: second } });
  deliver(b, driver, { t: 'extinct', runId: second, summary: { runId: second } });
  assert.deepEqual(outcomes, ['extinct', 'aborted']);
}));

test('fallback synchronous emissions occur only after the complete identity is published', () => {
  const messages = []; let published = null; const driver = createRunDriver({ worker: false }, (message) => {
    assert.deepEqual(identityFields(message), identityFields(published)); messages.push(message);
  });
  published = driver.reserveIdentity({ worldSessionId: 91, seed: 123, presentationGeneration: 17 });
  const runId = driver.start({ seed: 123, adaptationMode: 'random' }, 1, published);
  assert.equal(runId, published.runId); assert.equal(messages.some((message) => message.t === 'started'), true);
  assert.equal(messages.some((message) => message.t === 'snapshot'), true);
  driver.stop(); assert.equal(driver.identity, null); assert.equal(driver.snapshot, null); assert.equal(driver.runId, 0);
});

test('retirement invalidates queued fallback commands', async () => {
  const messages = []; const driver = createRunDriver({ worker: false }, (message) => messages.push(message));
  const first = driver.reserveIdentity({ worldSessionId: 1, seed: 44, presentationGeneration: 1 });
  driver.start({ seed: 44, adaptationMode: 'manual' }, 1, first); const command = driver.setAdaptationMode('random');
  const before = messages.length; const second = driver.reserveIdentity({ worldSessionId: 2, seed: 45, presentationGeneration: 2 });
  driver.start({ seed: 45, adaptationMode: 'manual' }, 1, second); await Promise.resolve();
  assert.equal(messages.slice(before).some((message) => message.commandId === command.commandId), false);
});

test('worker callbacks require the full session/run/generation tuple', () => withWorkers(() => {
  const messages = []; const driver = createRunDriver({ worker: true }, (message) => messages.push(message));
  const runId = driver.start({ seed: 9 }, 1); const worker = FakeWorker.instances.at(-1); const current = driver.identity;
  worker.deliver({ t: 'ready', ...identityFields(current), presentationGeneration: current.presentationGeneration + 1 });
  assert.equal(messages.length, 0); deliver(worker, driver, { t: 'ready', runId }); assert.equal(messages.length, 1);
}));

test('worker silence requests status then exposes an explicit recoverable failure', () => withWorkers(() => {
  const messages = []; const driver = createRunDriver({ worker: true }, (message) => messages.push(message));
  const runId = driver.start({ seed: 5 }, 1); const worker = FakeWorker.instances.at(-1);
  deliver(worker, driver, { t: 'ready', runId }); driver.ready(); const base = performance.now();
  driver.frame(0, base + 2600);
  assert.equal(worker.sent.some((message) => message.t === 'status' && message.runId === runId), true);
  driver.frame(0, base + 5100);
  assert.equal(driver.outcome, 'failed'); assert.equal(worker.terminated, true);
  assert.equal(messages.at(-1).t, 'worker-failed'); assert.equal(messages.at(-1).runId, runId);
}));
