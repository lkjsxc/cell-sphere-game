/** Run-ID transport, watchdog, and abort/extinction first-wins contracts. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRunDriver } from '../../src/interface/run-driver.js';
import { seedForRun } from '../../src/interface/app-data.js';
import { identityFields } from '../../src/core/world-session.js';
import { compileChallengeProfile } from '../../src/simulation/challenge-profile.js';

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
  const runId = driver.start({ seed: 42, worldOrdinal: 1, worldPotential: 16000 }, 1);
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
  const profile=compileChallengeProfile({environmentLevel:'0'});
  published = driver.reserveIdentity({ worldSessionId:91, seed:123, presentationGeneration:17,
    environmentLevel:'0', challengeProfileHash:profile.hash });
  const runId = driver.start({ seed:123, worldOrdinal:'1', worldPotential:'16000',
    environmentLevel:'0', challengeProfile:profile }, 1, published);
  assert.equal(runId, published.runId); assert.equal(messages.some((message) => message.t === 'started'), true);
  assert.equal(messages.some((message) => message.t === 'snapshot'), true);
  driver.stop(); assert.equal(driver.identity, null); assert.equal(driver.snapshot, null); assert.equal(driver.runId, 0);
});

test('worker callbacks require the full session/run/generation tuple', () => withWorkers(() => {
  const messages = []; const driver = createRunDriver({ worker: true }, (message) => messages.push(message));
  const runId = driver.start({ seed: 9 }, 1); const worker = FakeWorker.instances.at(-1); const current = driver.identity;
  worker.deliver({ t: 'ready', ...identityFields(current), presentationGeneration: current.presentationGeneration + 1 });
  assert.equal(messages.length, 0); deliver(worker, driver, { t: 'ready', runId }); assert.equal(messages.length, 1);
}));

test('retired Worker callbacks cannot kill or mutate same-session fallback authority', () => withWorkers(() => {
  const messages = []; const driver = createRunDriver({ worker: true }, (message) => messages.push(message));
  const runId = driver.start({ seed: 19 }, 1); const worker = FakeWorker.instances.at(-1);
  const queuedError = worker.onerror; const queuedMessage = worker.onmessage;
  deliver(worker, driver, { t: 'error', runId, fatal: true, message: 'pre-authority failure' });
  assert.equal(worker.terminated, true); assert.equal(driver.hasFallback, true); assert.equal(driver.outcome, null);
  const before = messages.length; queuedError?.(new Error('stale transport error'));
  queuedMessage?.({ data: { t: 'extinct', ...identityFields(driver.identity), summary: { runId } } });
  assert.equal(driver.hasFallback, true); assert.equal(driver.outcome, null);
  assert.equal(messages.length, before); assert.equal(messages.some((message) => message.t === 'worker-failed'), false);
}));

test('normal drivers clamp high speed while explicit developer drivers transport 256x', () => withWorkers(() => {
  const normal = createRunDriver({ worker: true }, () => {}); normal.start({ seed: 20 }, 256);
  const normalWorker = FakeWorker.instances.at(-1); deliver(normalWorker, normal, { t: 'ready' }); normal.ready();
  assert.equal(normalWorker.sent.find((message) => message.t === 'init').developerMode, false);
  assert.equal(normalWorker.sent.find((message) => message.t === 'speed').value, 8);
  assert.equal(normal.setSpeed(32), 8); assert.equal(normalWorker.sent.at(-1).value, 8);

  const developer = createRunDriver({ worker: true }, () => {}, { developerMode: true }); developer.start({ seed: 21 }, 256);
  const devWorker = FakeWorker.instances.at(-1); deliver(devWorker, developer, { t: 'ready' }); developer.ready();
  assert.equal(devWorker.sent.find((message) => message.t === 'init').developerMode, true);
  assert.equal(devWorker.sent.find((message) => message.t === 'speed').value, 256);
  assert.equal(developer.setSpeed(128), 128); assert.equal(devWorker.sent.at(-1).value, 128);
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
