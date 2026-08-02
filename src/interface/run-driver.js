/** Worker-first simulation adapter with an identical deterministic fallback. */
import { BALANCE as B } from '../game/balance.js';
import { RunController } from '../simulation/simulator.js';

export function createRunDriver(caps, onMessage) {
  let worker = null; let fallback = null; let generation = 0; let speed = 1;
  let paused = false; let debt = 0; let lastSnapshot = 0; let snapshot = null;
  const emit = (message) => onMessage(message);

  function start(cfg, initialSpeed) {
    stop(); generation++; speed = initialSpeed; paused = false; debt = 0; snapshot = null;
    const token = generation;
    if (caps.worker) {
      try {
        worker = new Worker(new URL('../simulation/worker-entry.js', import.meta.url), { type: 'module' });
        worker.onmessage = (event) => { if (token === generation) emit(event.data); };
        worker.onerror = () => { if (token === generation && !fallback) startFallback(cfg); };
        worker.postMessage({ t: 'init', cfg }); return;
      } catch { /* deterministic fallback below */ }
    }
    startFallback(cfg);
  }

  function startFallback(cfg) {
    worker?.terminate(); worker = null;
    fallback = new RunController(cfg, emit); fallback.start(); snapshot = fallback.snapshot();
    emit({ t: 'snapshot', ...snapshot });
  }

  function message(value) {
    if (worker) worker.postMessage(value);
    else if (fallback) {
      try {
        if (value.t === 'choose-adaptation') fallback.chooseAdaptation(value.offerId, value.cardId);
        else if (value.t === 'set-adaptation-mode') fallback.setAdaptationMode(value.mode);
        else if (value.t === 'inspect-cell') emit({ t: 'cell-inspection', requestId: value.requestId,
          cell: fallback.inspectCell(value.node) });
        else if (value.t === 'snapshot-now') { snapshot = fallback.snapshot(); emit({ t: 'snapshot', ...snapshot }); }
        else if (value.t === 'history-preview') { const frame = fallback.historyPreview(value.tick);
          emit({ t: 'history-preview', requestId: value.requestId, tick: frame.tick, entropyQ: frame.entropyQ,
            flags: frame.flags, aliveCount: frame.aliveCount, cells: frame.cells.slice().buffer }); }
        else if (value.t === 'history-buffer') emit({ t: 'history-buffer', requestId: value.requestId,
          buffer: fallback.historyBuffer() });
      } catch (error) { emit({ t: 'error', requestId: value.requestId, message: error.message }); }
    }
  }

  function frame(dt, now) {
    if (!fallback || paused || fallback.state.status !== 'running') return;
    debt += (dt / 1000) * speed * B.TICKS_PER_SECOND;
    const ticks = Math.floor(debt); debt -= ticks;
    if (ticks) fallback.advance(ticks);
    if (now - lastSnapshot > (speed >= 16 ? 80 : 100) || !snapshot) {
      snapshot = fallback.snapshot(); lastSnapshot = now; emit({ t: 'snapshot', ...snapshot });
    }
  }

  function ready() { worker?.postMessage({ t: 'speed', value: speed }); worker?.postMessage({ t: 'start' }); }
  function setSpeed(value) { speed = value; worker?.postMessage({ t: 'speed', value }); }
  function setPaused(value) { paused = value; worker?.postMessage({ t: value ? 'pause' : 'resume' }); }
  function stop() { generation++; worker?.terminate(); worker = null; fallback = null; }

  return { start, stop, ready, message, frame, setSpeed, setPaused,
    get snapshot() { return snapshot; }, set snapshot(value) { snapshot = value; },
    get hasFallback() { return Boolean(fallback); }, get generation() { return generation; } };
}
