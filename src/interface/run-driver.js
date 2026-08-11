/** Session/run/generation-aware Worker-first deterministic simulation adapter. */
import { BALANCE as B } from '../game/balance.js';
import { RunController } from '../simulation/simulator.js';
import { RUN_PROTOCOL_VERSION } from '../core/run-protocol.js';
import { createWorldIdentity, identityFields, sameWorldIdentity, WORLD_IDENTITY_FIELDS } from '../core/world-session.js';
import {
  ENVIRONMENT_MODEL_VERSION,
  ENVIRONMENT_SCHEDULE_HASH,
  ENVIRONMENT_SCHEDULE_VERSION,
} from '../game/environment-level.js';
import { hashStringU32, hexU32 } from '../core/hash.js';
import { MAX_TICKS_PER_SLICE, snapshotIntervalForSpeed, validateRuntimeSpeed } from '../core/runtime-speed.js';

export function createRunDriver(caps, onMessage, options = {}) {
  const developerMode = options.developerMode === true;
  let worker = null; let fallback = null; let generation = 0; let transportGeneration = 0;
  let runSequence = 0; let presentationSequence = 0;
  let activeIdentity = null; let speed = 1; let paused = false; let debt = 0;
  let lastSnapshot = null; let cfg = null; let authorityStarted = false;
  let settled = null; let abortPending = false; let lastWorkerMessageAt = 0; let statusRequestedAt = 0;
  const now = () => performance.now();

  function reserveIdentity(value) {
    stop(); const runId = ++runSequence;
    const seed = value?.seed ?? 0;
    const presentationGeneration = value?.presentationGeneration ?? ++presentationSequence;
    activeIdentity = createWorldIdentity({ worldSessionId: value?.worldSessionId ?? runId, runId,
      seed, presentationGeneration,
      environmentModelVersion: value?.environmentModelVersion ?? ENVIRONMENT_MODEL_VERSION,
      environmentScheduleVersion: value?.environmentScheduleVersion ?? ENVIRONMENT_SCHEDULE_VERSION,
      environmentScheduleHash: value?.environmentScheduleHash ?? ENVIRONMENT_SCHEDULE_HASH,
      immutableStartConfigurationHash: value?.immutableStartConfigurationHash
        ?? hexU32(hashStringU32(`driver-start:${seed}:${presentationGeneration}`)),
      resultTransactionKey: value?.resultTransactionKey });
    presentationSequence = Math.max(presentationSequence, activeIdentity.presentationGeneration);
    return activeIdentity;
  }
  function accepts(value, identity = activeIdentity, complete = false) {
    if (!identity || value?.runId !== identity.runId) return false;
    for (const name of WORLD_IDENTITY_FIELDS.filter((name) => name !== 'runId')) {
      if ((complete || value?.[name] != null) && value?.[name] !== identity[name]) return false;
    }
    return true;
  }
  function emit(message, identity = activeIdentity) {
    const observational = ['history-buffer', 'cell-inspection'].includes(message.t);
    if (!accepts(message, identity) || !sameWorldIdentity(identity, activeIdentity) || (settled && !observational)) return false;
    lastWorkerMessageAt = now(); statusRequestedAt = 0;
    const envelope = { ...message, ...identityFields(identity) };
    if (message.t === 'snapshot') lastSnapshot = envelope;
    if (message.t === 'extinct' || message.t === 'aborted') settled = message.t;
    if (message.t === 'abort-rejected') abortPending = false;
    onMessage(envelope); return true;
  }

  function start(config, initialSpeed, identity = null) {
    const session = identity ?? reserveIdentity({ seed: config.seed });
    if (!sameWorldIdentity(session, activeIdentity)) throw new Error('world identity was not reserved');
    cfg = { ...config, ...identityFields(session) };
    speed = validateRuntimeSpeed(initialSpeed, { developerMode, fallback: 1 });
    paused = false; debt = 0; lastSnapshot = null; settled = null; abortPending = false; authorityStarted = false;
    lastWorkerMessageAt = now(); statusRequestedAt = 0; const token = generation;
    if (caps.worker) try {
      worker = new Worker(new URL('../simulation/protocol/worker-entry.js', import.meta.url), { type: 'module' });
      const transportToken = ++transportGeneration;
      worker.onmessage = (event) => {
        if (token !== generation || transportToken !== transportGeneration
          || event.data?.protocolVersion !== RUN_PROTOCOL_VERSION
          || !sameWorldIdentity(session, activeIdentity) || !accepts(event.data, session, true)) return;
        if (event.data.t === 'error' && event.data.fatal) failWorker(event.data.message, session);
        else emit(event.data, session);
      };
      worker.onerror = () => { if (token === generation && transportToken === transportGeneration)
        failWorker('The simulation worker stopped unexpectedly.', session); };
      worker.onmessageerror = () => { if (token === generation && transportToken === transportGeneration)
        failWorker('The simulation worker sent unreadable data.', session); };
      worker.postMessage({ t: 'init', protocolVersion: RUN_PROTOCOL_VERSION, ...identityFields(session), cfg, developerMode }); return session.runId;
    } catch { /* deterministic pre-authority fallback below */ }
    startFallback(session); return session.runId;
  }

  function retireWorker() {
    transportGeneration++; const retired = worker; worker = null;
    if (!retired) return;
    retired.onmessage = null; retired.onerror = null; retired.onmessageerror = null; retired.terminate();
  }
  function startFallback(session = activeIdentity) {
    retireWorker();
    try {
      const runId = session.runId; fallback = new RunController(cfg, (message) => emit({ ...message, runId }, session));
      authorityStarted = true; fallback.start(); const snapshot = fallback.snapshot(); emit({ t: 'snapshot', ...snapshot, runId }, session);
    } catch (error) { fallback = null; settled = 'failed'; onMessage({ t: 'worker-failed', ...identityFields(session),
      phase: 'pre-authority', recoverable: true, message: error.message }); }
  }
  function failWorker(reason, session = activeIdentity) {
    if (settled || !sameWorldIdentity(session, activeIdentity)) return;
    if (!authorityStarted) { startFallback(session); return; }
    retireWorker(); fallback = null; settled = 'failed';
    onMessage({ t: 'worker-failed', ...identityFields(session), phase: 'authority', recoverable: false, message: reason });
  }

  function message(value) {
    const session = activeIdentity; if (!session || !accepts({ ...identityFields(session), ...value }, session)) return false;
    if (settled && !['history-buffer', 'inspect-cell'].includes(value.t)) return false;
    const envelope = { protocolVersion:RUN_PROTOCOL_VERSION,...value, ...identityFields(session) };
    if (worker) worker.postMessage(envelope);
    else if (fallback) try {
      if (value.t === 'inspect-cell') emit({ t: 'cell-inspection', runId: session.runId, requestId: value.requestId, cell: fallback.inspectCell(value.node) }, session);
      else if (value.t === 'snapshot-now') emit({ t: 'snapshot', runId: session.runId, ...fallback.snapshot() }, session);
      else if (value.t === 'history-buffer') emit({ t: 'history-buffer', runId: session.runId,
        requestId: value.requestId, buffer: fallback.historyBuffer() }, session);
    } catch (error) { emit({ t: 'error', runId: session.runId, requestId: value.requestId, message: error.message }, session); }
    return true;
  }

  function abort(expected = activeIdentity) {
    if (!sameWorldIdentity(expected, activeIdentity) || settled || abortPending) return false; abortPending = true;
    if (worker) { worker.postMessage({ t: 'abort',protocolVersion:RUN_PROTOCOL_VERSION, ...identityFields(activeIdentity) }); return true; }
    if (!fallback) { abortPending = false; return false; }
    const accepted = fallback.abort(); if (!accepted && sameWorldIdentity(expected, activeIdentity)) abortPending = false; return accepted;
  }
  function frame(dt, time) {
    if (worker && !paused && !settled) { const silent = time - lastWorkerMessageAt;
      if (silent > 2500 && !statusRequestedAt) { statusRequestedAt = time; worker.postMessage({ t: 'status',protocolVersion:RUN_PROTOCOL_VERSION, ...identityFields(activeIdentity) }); }
      else if (silent > 5000 || (statusRequestedAt && time - statusRequestedAt > 2000)) failWorker('World time stopped responding.'); }
    if (!fallback || paused || !['running', 'terminal-collapse'].includes(fallback.state.status)) return;
    debt += (dt / 1000) * speed * B.TICKS_PER_SECOND;
    const ticks = Math.min(Math.floor(debt), MAX_TICKS_PER_SLICE); debt -= ticks; if (ticks) fallback.advance(ticks);
    if (fallback.state.status === 'extinct' || fallback.state.status === 'aborted') return;
    if (time - lastSnapshotTime > snapshotIntervalForSpeed(speed) || !lastSnapshot) { lastSnapshotTime = time;
      emit({ t: 'snapshot', runId: activeIdentity.runId, ...fallback.snapshot() }); }
  }
  let lastSnapshotTime = 0;
  function ready(expected = activeIdentity) { if (!worker || settled || !sameWorldIdentity(expected, activeIdentity)) return false;
    authorityStarted = true; worker.postMessage({ t: 'speed',protocolVersion:RUN_PROTOCOL_VERSION, ...identityFields(activeIdentity), value: speed });
    worker.postMessage({ t: 'start',protocolVersion:RUN_PROTOCOL_VERSION, ...identityFields(activeIdentity) }); return true; }
  function setSpeed(value) { speed = validateRuntimeSpeed(value, { developerMode, fallback: speed });
    if (worker && activeIdentity) worker.postMessage({ t: 'speed',protocolVersion:RUN_PROTOCOL_VERSION, ...identityFields(activeIdentity), value: speed }); return speed; }
  function setPaused(value) { paused = value; if (worker && activeIdentity) worker.postMessage({ t: value ? 'pause' : 'resume',protocolVersion:RUN_PROTOCOL_VERSION, ...identityFields(activeIdentity) }); }
  function stop() { generation++; retireWorker(); fallback = null; cfg = null;
    lastSnapshot = null; activeIdentity = null; authorityStarted = false; settled = null; abortPending = false; debt = 0; statusRequestedAt = 0; lastSnapshotTime = 0; }
  return { reserveIdentity, start, stop, abort, ready, message, frame, setSpeed, setPaused,
    installSnapshot(value) { lastSnapshot = value; }, get snapshot() { return lastSnapshot; },
    get hasFallback() { return Boolean(fallback); }, get generation() { return generation; },
    get identity() { return activeIdentity; }, get runId() { return activeIdentity?.runId ?? 0; }, get outcome() { return settled; } };
}
