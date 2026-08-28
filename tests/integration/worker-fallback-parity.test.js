/** Real production Worker transport must agree with the shared fallback authority. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Worker } from 'node:worker_threads';
import { RunController } from '../../src/simulation/simulator.js';
import { decodeVisualHistory } from '../../src/history/codec.js';
import { RUN_PROTOCOL_VERSION } from '../../src/core/run-protocol.js';
import { createWorldIdentity, identityFields } from '../../src/core/world-session.js';
import {
  ENVIRONMENT_MODEL_VERSION,
  ENVIRONMENT_SCHEDULE_HASH,
  ENVIRONMENT_SCHEDULE_VERSION,
} from '../../src/game/environment-level.js';

const WORKER_TIMEOUT_MS = 15_000;

test('production Worker and fallback agree through transitions, chronic exposure, and extinction', { timeout: 20_000 }, async (t) => {
  const identity = createWorldIdentity({ worldSessionId: 701, runId: 701, seed: 77, presentationGeneration: 1,
    environmentModelVersion: ENVIRONMENT_MODEL_VERSION, environmentScheduleVersion: ENVIRONMENT_SCHEDULE_VERSION,
    environmentScheduleHash: ENVIRONMENT_SCHEDULE_HASH, immutableStartConfigurationHash: 'c0ffee77' });
  const cfg = { seed: 77, worldOrdinal: '3', ...identityFields(identity) };
  const worker = new Worker(new URL('./worker-authority-shim.mjs', import.meta.url), { type: 'module', execArgv: [] });
  t.after(() => worker.terminate());
  const workerRun = await runWorker(worker, identity, cfg);

  const fallbackMessages = []; const fallback = new RunController(cfg, (message) => fallbackMessages.push(message));
  fallback.start(); while (fallback.state.status !== 'extinct') fallback.advance(64);
  const fallbackResult = fallback.buildResult();

  assert.deepEqual(comparableResult(workerRun.result), comparableResult(fallbackResult));
  assert.deepEqual(workerRun.transitions, transitionsFrom(fallbackMessages));
  const fallbackVisual = fallbackMessages.find((message) => message.t === 'extinct')?.visualHistoryBuffer;
  assert.ok(workerRun.visualHistoryBuffer instanceof ArrayBuffer); assert.ok(fallbackVisual instanceof ArrayBuffer);
  assert.equal(decodeVisualHistory(workerRun.visualHistoryBuffer).terminalTick, fallbackResult.tick);
  assert.equal(decodeVisualHistory(fallbackVisual).terminalTick, fallbackResult.tick);
});

function runWorker(worker, identity, cfg) {
  return new Promise((resolve, reject) => {
    const transitions = [];
    const timer = setTimeout(() => reject(new Error(`Worker authority did not complete within ${WORKER_TIMEOUT_MS}ms`)), WORKER_TIMEOUT_MS);
    const finish = (value) => { clearTimeout(timer); resolve(value); };
    worker.once('error', (error) => { clearTimeout(timer); reject(error); });
    worker.on('message', (message) => {
      if (message.t === 'error') { clearTimeout(timer); reject(new Error(message.message)); return; }
      if (message.t === 'environment-transition') transitions.push({ tick: message.tick,
        environmentLevel: message.environmentLevel, profileHash: message.profileHash });
      if (message.t === 'ready') {
        worker.postMessage({ t: 'speed', protocolVersion: RUN_PROTOCOL_VERSION, ...identityFields(identity), publicMultiplier: 64 });
        worker.postMessage({ t: 'start', protocolVersion: RUN_PROTOCOL_VERSION, ...identityFields(identity) });
      }
      if (message.t === 'extinct') finish({ result: message.summary, transitions, visualHistoryBuffer: message.visualHistoryBuffer });
    });
    worker.postMessage({ t: 'init', protocolVersion: RUN_PROTOCOL_VERSION, ...identityFields(identity), cfg, developerMode: true });
  });
}

function comparableResult(result) {
  return {
    hash: result.hash, tick: result.tick, finalEnvironmentLevel: result.finalEnvironmentLevel,
    peakEnvironmentLevel: result.peakEnvironmentLevel, environmentTransitionCount: result.environmentTransitionCount,
    environmentExposure: result.environmentExposure, recentEnvironmentTransitions: result.recentEnvironmentTransitions,
    environmentPressureSummary: result.environmentPressureSummary,
  };
}
function transitionsFrom(messages) {
  return messages.filter((message) => message.t === 'environment-transition').map((message) => ({ tick: message.tick,
    environmentLevel: message.environmentLevel, profileHash: message.profileHash }));
}
