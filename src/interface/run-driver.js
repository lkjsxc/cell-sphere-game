/** Session/run/generation-aware Worker-first deterministic simulation adapter. */
import { BALANCE as B } from '../game/balance.js';
import { RunController } from '../simulation/simulator.js';
import { RUN_PROTOCOL_VERSION, runCommand } from '../core/run-protocol.js';
import { createWorldIdentity, identityFields, sameWorldIdentity } from '../core/world-session.js';
import { executeAdaptationMode, executeAdaptationSelection } from '../simulation/protocol/adaptation-command.js';

export function createRunDriver(caps, onMessage) {
  let worker = null; let fallback = null; let generation = 0; let runSequence = 0; let presentationSequence = 0; let commandSequence = 0;
  let activeIdentity = null; let speed = 1; let paused = false; let debt = 0;
  let lastSnapshot = null; let cfg = null; let authorityStarted = false;
  let settled = null; let abortPending = false; let lastWorkerMessageAt = 0; let statusRequestedAt = 0;
  const now = () => performance.now();

  function reserveIdentity(value) {
    stop(); const runId = ++runSequence;
    activeIdentity = createWorldIdentity({ worldSessionId: value?.worldSessionId ?? runId, runId,
      seed: value?.seed ?? 0, presentationGeneration: value?.presentationGeneration ?? ++presentationSequence,
      resultTransactionKey: value?.resultTransactionKey });
    presentationSequence = Math.max(presentationSequence, activeIdentity.presentationGeneration);
    return activeIdentity;
  }
  function accepts(value, identity = activeIdentity, complete = false) {
    if (!identity || value?.runId !== identity.runId) return false;
    for (const name of ['worldSessionId', 'seed', 'presentationGeneration', 'resultTransactionKey']) {
      if ((complete || value?.[name] != null) && value?.[name] !== identity[name]) return false;
    }
    return true;
  }
  function emit(message, identity = activeIdentity) {
    const observational = ['history-buffer', 'history-preview', 'cell-inspection'].includes(message.t);
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
    commandSequence = 0; cfg = { ...config, ...identityFields(session) }; speed = initialSpeed;
    paused = false; debt = 0; lastSnapshot = null; settled = null; abortPending = false; authorityStarted = false;
    lastWorkerMessageAt = now(); statusRequestedAt = 0; const token = generation;
    if (caps.worker) try {
      worker = new Worker(new URL('../simulation/protocol/worker-entry.js', import.meta.url), { type: 'module' });
      worker.onmessage = (event) => {
        if (token !== generation || !sameWorldIdentity(session, activeIdentity) || !accepts(event.data, session, true)) return;
        if (event.data.t === 'error' && event.data.fatal) failWorker(event.data.message, session);
        else emit(event.data, session);
      };
      worker.onerror = () => { if (token === generation) failWorker('The simulation worker stopped unexpectedly.', session); };
      worker.onmessageerror = () => { if (token === generation) failWorker('The simulation worker sent unreadable data.', session); };
      worker.postMessage({ t: 'init', protocolVersion: RUN_PROTOCOL_VERSION, ...identityFields(session), cfg }); return session.runId;
    } catch { /* deterministic pre-authority fallback below */ }
    startFallback(session); return session.runId;
  }

  function startFallback(session = activeIdentity) {
    worker?.terminate(); worker = null;
    try {
      const runId = session.runId; fallback = new RunController(cfg, (message) => emit({ ...message, runId }, session));
      authorityStarted = true; fallback.start(); const snapshot = fallback.snapshot(); emit({ t: 'snapshot', ...snapshot, runId }, session);
    } catch (error) { fallback = null; settled = 'failed'; onMessage({ t: 'worker-failed', ...identityFields(session),
      phase: 'pre-authority', recoverable: true, message: error.message }); }
  }
  function failWorker(reason, session = activeIdentity) {
    if (settled || !sameWorldIdentity(session, activeIdentity)) return;
    if (!authorityStarted) { startFallback(session); return; }
    worker?.terminate(); worker = null; fallback = null; settled = 'failed';
    onMessage({ t: 'worker-failed', ...identityFields(session), phase: 'authority', recoverable: false, message: reason });
  }

  function message(value) {
    const session = activeIdentity; if (!session || !accepts({ ...identityFields(session), ...value }, session)) return false;
    if (settled && !['history-buffer', 'history-preview', 'inspect-cell'].includes(value.t)) return false;
    const envelope = { ...value, ...identityFields(session) };
    if (worker) worker.postMessage(envelope);
    else if (fallback) try {
      if (value.t === 'choose-adaptation') { const rejected = executeAdaptationSelection(fallback, envelope, session.runId); if (rejected) emit(rejected, session); }
      else if (value.t === 'set-adaptation-mode') { const rejected = executeAdaptationMode(fallback, envelope, session.runId); if (rejected) emit(rejected, session); }
      else if (value.t === 'inspect-cell') emit({ t: 'cell-inspection', runId: session.runId, requestId: value.requestId, cell: fallback.inspectCell(value.node) }, session);
      else if (value.t === 'snapshot-now') emit({ t: 'snapshot', runId: session.runId, ...fallback.snapshot() }, session);
      else if (value.t === 'history-preview') { const frame = fallback.historyPreview(value.tick); emit({ t: 'history-preview', runId: session.runId,
        requestId: value.requestId, tick: frame.tick, entropyQ: frame.entropyQ, flags: frame.flags,
        aliveCount: frame.aliveCount, cells: frame.cells.slice().buffer }, session); }
      else if (value.t === 'history-buffer') emit({ t: 'history-buffer', runId: session.runId,
        requestId: value.requestId, buffer: fallback.historyBuffer() }, session);
    } catch (error) { emit({ t: 'error', runId: session.runId, requestId: value.requestId, message: error.message }, session); }
    return true;
  }

  function sendCommand(type, payload) {
    const session = activeIdentity; if (!session || settled) return null;
    const token = generation; const commandId = ++commandSequence;
    const command = { ...runCommand(type, session.runId, commandId, payload), ...identityFields(session) };
    if (worker) message(command); else queueMicrotask(() => {
      if (token === generation && sameWorldIdentity(session, activeIdentity)) message(command);
    });
    return Object.freeze({ protocolVersion: RUN_PROTOCOL_VERSION, ...identityFields(session), commandId });
  }
  const chooseAdaptation = (offer, cardId) => sendCommand('choose-adaptation', { offerId: offer.id, offerVersion: offer.offerVersion, cardId });
  const setAdaptationMode = (mode) => sendCommand('set-adaptation-mode', { mode });
  function abort(expected = activeIdentity) {
    if (!sameWorldIdentity(expected, activeIdentity) || settled || abortPending) return false; abortPending = true;
    if (worker) { worker.postMessage({ t: 'abort', ...identityFields(activeIdentity) }); return true; }
    if (!fallback) { abortPending = false; return false; }
    const accepted = fallback.abort(); if (!accepted && sameWorldIdentity(expected, activeIdentity)) abortPending = false; return accepted;
  }
  function frame(dt, time) {
    if (worker && !paused && !settled) { const silent = time - lastWorkerMessageAt;
      if (silent > 2500 && !statusRequestedAt) { statusRequestedAt = time; worker.postMessage({ t: 'status', ...identityFields(activeIdentity) }); }
      else if (silent > 5000 || (statusRequestedAt && time - statusRequestedAt > 2000)) failWorker('World time stopped responding.'); }
    if (!fallback || paused || !['running', 'terminal-collapse'].includes(fallback.state.status)) return;
    debt += (dt / 1000) * speed * B.TICKS_PER_SECOND; const ticks = Math.floor(debt); debt -= ticks; if (ticks) fallback.advance(ticks);
    if (fallback.state.status === 'extinct' || fallback.state.status === 'aborted') return;
    if (time - lastSnapshotTime > (speed >= 16 ? 80 : 100) || !lastSnapshot) { lastSnapshotTime = time;
      emit({ t: 'snapshot', runId: activeIdentity.runId, ...fallback.snapshot() }); }
  }
  let lastSnapshotTime = 0;
  function ready(expected = activeIdentity) { if (!worker || settled || !sameWorldIdentity(expected, activeIdentity)) return false;
    authorityStarted = true; worker.postMessage({ t: 'speed', ...identityFields(activeIdentity), value: speed });
    worker.postMessage({ t: 'start', ...identityFields(activeIdentity) }); return true; }
  function setSpeed(value) { speed = value; if (worker && activeIdentity) worker.postMessage({ t: 'speed', ...identityFields(activeIdentity), value }); }
  function setPaused(value) { paused = value; if (worker && activeIdentity) worker.postMessage({ t: value ? 'pause' : 'resume', ...identityFields(activeIdentity) }); }
  function stop() { generation++; commandSequence++; worker?.terminate(); worker = null; fallback = null; cfg = null;
    lastSnapshot = null; activeIdentity = null; authorityStarted = false; settled = null; abortPending = false; debt = 0; statusRequestedAt = 0; }
  return { reserveIdentity, start, stop, abort, ready, message, chooseAdaptation, setAdaptationMode, frame, setSpeed, setPaused,
    installSnapshot(value) { lastSnapshot = value; }, get snapshot() { return lastSnapshot; },
    get hasFallback() { return Boolean(fallback); }, get generation() { return generation; },
    get identity() { return activeIdentity; }, get runId() { return activeIdentity?.runId ?? 0; }, get outcome() { return settled; } };
}
