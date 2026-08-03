/** Run-ID-aware Worker-first simulation adapter with deterministic fallback. */
import { BALANCE as B } from '../game/balance.js';
import { RunController } from '../simulation/simulator.js';
import { RUN_PROTOCOL_VERSION, runCommand } from '../core/run-protocol.js';
import { executeAdaptationMode, executeAdaptationSelection } from '../simulation/protocol/adaptation-command.js';

export function createRunDriver(caps, onMessage) {
  let worker = null; let fallback = null; let generation = 0; let runSequence = 0; let commandSequence = 0;
  let activeRunId = 0; let speed = 1; let paused = false; let debt = 0;
  let lastSnapshot = 0; let snapshot = null; let cfg = null; let authorityStarted = false;
  let settled = null; let abortPending = false; let lastWorkerMessageAt = 0; let statusRequestedAt = 0;
  const now = () => performance.now();

  function emit(message) {
    const observational = ['history-buffer', 'history-preview', 'cell-inspection'].includes(message.t);
    if (message.runId !== activeRunId || (settled && !observational)) return false;
    lastWorkerMessageAt = now(); statusRequestedAt = 0;
    if (message.t === 'snapshot') snapshot = message;
    if (message.t === 'extinct' || message.t === 'aborted') settled = message.t;
    if (message.t === 'abort-rejected') abortPending = false;
    onMessage(message); return true;
  }

  function start(config, initialSpeed) {
    stop(); activeRunId = ++runSequence; commandSequence = 0; cfg = { ...config, runId: activeRunId };
    speed = initialSpeed; paused = false; debt = 0; snapshot = null; settled = null;
    abortPending = false; authorityStarted = false; lastWorkerMessageAt = now(); statusRequestedAt = 0;
    const token = generation;
    if (caps.worker) try {
      worker = new Worker(new URL('../simulation/protocol/worker-entry.js', import.meta.url), { type: 'module' });
      worker.onmessage = (event) => {
        if (token !== generation || event.data.runId !== activeRunId) return;
        if (event.data.t === 'error' && event.data.fatal) failWorker(event.data.message);
        else emit(event.data);
      };
      worker.onerror = () => { if (token === generation) failWorker('The simulation worker stopped unexpectedly.'); };
      worker.onmessageerror = () => { if (token === generation) failWorker('The simulation worker sent unreadable data.'); };
      worker.postMessage({ t: 'init', protocolVersion: RUN_PROTOCOL_VERSION, runId: activeRunId, cfg }); return activeRunId;
    } catch { /* safe pre-authority fallback */ }
    startFallback(); return activeRunId;
  }

  function startFallback() {
    worker?.terminate(); worker = null; authorityStarted = true;
    const runId = activeRunId;
    fallback = new RunController(cfg, (message) => emit({ ...message, runId }));
    fallback.start(); snapshot = fallback.snapshot(); emit({ t: 'snapshot', ...snapshot, runId });
  }
  function failWorker(reason) {
    if (settled) return;
    if (!authorityStarted) { generation++; startFallback(); return; }
    worker?.terminate(); worker = null; fallback = null; settled = 'failed';
    onMessage({ t: 'worker-failed', runId: activeRunId, message: reason });
  }

  function message(value) {
    if (settled && !['history-buffer', 'history-preview', 'inspect-cell'].includes(value.t)) return;
    if (worker) worker.postMessage({ ...value, runId: activeRunId });
    else if (fallback) try {
      if (value.t === 'choose-adaptation') { const rejected = executeAdaptationSelection(fallback, value, activeRunId); if (rejected) emit(rejected); }
      else if (value.t === 'set-adaptation-mode') { const rejected = executeAdaptationMode(fallback, value, activeRunId); if (rejected) emit(rejected); }
      else if (value.t === 'inspect-cell') emit({ t: 'cell-inspection', runId: activeRunId,
        requestId: value.requestId, cell: fallback.inspectCell(value.node) });
      else if (value.t === 'snapshot-now') emit({ t: 'snapshot', runId: activeRunId, ...fallback.snapshot() });
      else if (value.t === 'history-preview') { const frame = fallback.historyPreview(value.tick);
        emit({ t: 'history-preview', runId: activeRunId, requestId: value.requestId, tick: frame.tick,
          entropyQ: frame.entropyQ, flags: frame.flags, aliveCount: frame.aliveCount, cells: frame.cells.slice().buffer }); }
      else if (value.t === 'history-buffer') emit({ t: 'history-buffer', runId: activeRunId,
        requestId: value.requestId, buffer: fallback.historyBuffer() });
    } catch (error) { emit({ t: 'error', runId: activeRunId, requestId: value.requestId, message: error.message }); }
  }

  function sendCommand(type, payload) { const commandId = ++commandSequence; const command = runCommand(type, activeRunId, commandId, payload);
    if (worker) message(command); else queueMicrotask(() => message(command));
    return Object.freeze({ protocolVersion: RUN_PROTOCOL_VERSION, runId: activeRunId, commandId }); }
  function chooseAdaptation(offer, cardId) { return sendCommand('choose-adaptation',
    { offerId: offer.id, offerVersion: offer.offerVersion, cardId }); }
  function setAdaptationMode(mode) { return sendCommand('set-adaptation-mode', { mode }); }

  function abort() {
    if (settled || abortPending) return false; abortPending = true;
    if (worker) worker.postMessage({ t: 'abort', runId: activeRunId });
    else if (fallback && !fallback.abort()) abortPending = false;
    return abortPending;
  }
  function frame(dt, time) {
    if (worker && !paused && !settled) {
      const silent = time - lastWorkerMessageAt;
      if (silent > 2500 && !statusRequestedAt) { statusRequestedAt = time; worker.postMessage({ t: 'status', runId: activeRunId }); }
      else if (silent > 5000 || (statusRequestedAt && time - statusRequestedAt > 2000)) failWorker('World time stopped responding.');
    }
    if (!fallback || paused || !['running', 'terminal-collapse'].includes(fallback.state.status)) return;
    debt += (dt / 1000) * speed * B.TICKS_PER_SECOND;
    const ticks = Math.floor(debt); debt -= ticks; if (ticks) fallback.advance(ticks);
    if (fallback.state.status === 'extinct' || fallback.state.status === 'aborted') return;
    if (time - lastSnapshot > (speed >= 16 ? 80 : 100) || !snapshot) {
      lastSnapshot = time; emit({ t: 'snapshot', runId: activeRunId, ...fallback.snapshot() });
    }
  }
  function ready() { if (!worker || settled) return; authorityStarted = true;
    worker.postMessage({ t: 'speed', runId: activeRunId, value: speed }); worker.postMessage({ t: 'start', runId: activeRunId }); }
  function setSpeed(value) { speed = value; worker?.postMessage({ t: 'speed', runId: activeRunId, value }); }
  function setPaused(value) { paused = value; worker?.postMessage({ t: value ? 'pause' : 'resume', runId: activeRunId }); }
  function stop() { generation++; worker?.terminate(); worker = null; fallback = null; }
  return { start, stop, abort, ready, message, chooseAdaptation, setAdaptationMode, frame, setSpeed, setPaused,
    get snapshot() { return snapshot; }, set snapshot(value) { snapshot = value; },
    get hasFallback() { return Boolean(fallback); }, get generation() { return generation; },
    get runId() { return activeRunId; }, get outcome() { return settled; } };
}
