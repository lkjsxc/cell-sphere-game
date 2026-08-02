/**
 * Module Web Worker entry: wraps RunController with the message protocol.
 * The worker owns canonical run state and timing; the main thread renders
 * snapshots and sends decisions. No SharedArrayBuffer — snapshots are
 * copied and transferred.
 */
import { RunController } from './simulator.js';
import { snapshotTransfers } from './snapshot.js';
import { BALANCE as B } from '../game/balance.js';

let controller = null;
let speed = 1;
let paused = false;
let snapshotEvery = B.SNAPSHOT_EVERY;
let ticksSinceSnapshot = 0;
let tickDebt = 0;

/** Post a message, transferring snapshot buffers when present. */
function post(msg, transfers) {
  if (transfers && transfers.length) self.postMessage(msg, transfers);
  else self.postMessage(msg);
}

function emit(msg) {
  if (msg.t === 'extinct') {
    post(msg);
    return;
  }
  post(msg);
}

function maybeSnapshot(force = false) {
  ticksSinceSnapshot++;
  if (!force && ticksSinceSnapshot < snapshotEvery) return;
  ticksSinceSnapshot = 0;
  const snap = controller.snapshot();
  post({ t: 'snapshot', ...snap }, snapshotTransfers(snap));
}

/** Fixed-step batch driven by the worker's own timer. */
function frame() {
  if (!controller || paused || speed <= 0) return;
  if (controller.state.status === 'extinct') return;

  // Carry fractional ticks: at 10 Hz, 1× advances exactly one tick every
  // two 50 ms slices; 32× advances 16. No speed gets an accidental bonus.
  tickDebt += (speed * B.TICKS_PER_SECOND) / 20;
  const ticks = Math.floor(tickDebt);
  tickDebt -= ticks;
  if (ticks <= 0) return;
  controller.advance(ticks);
  maybeSnapshot();
}

self.onmessage = (ev) => {
  const msg = ev.data;
  switch (msg.t) {
    case 'init': {
      controller = new RunController(msg.cfg, emit);
      post({ t: 'ready' });
      break;
    }
    case 'start': {
      tickDebt = 0;
      controller.start();
      maybeSnapshot(true);
      break;
    }
    case 'decide': {
      controller.decide(msg.card);
      maybeSnapshot(true);
      break;
    }
    case 'reroll': {
      controller.reroll();
      break;
    }
    case 'signal': {
      controller.placeSignal(msg.node);
      maybeSnapshot(true);
      break;
    }
    case 'speed': {
      speed = msg.value;
      // At high speed, publish snapshots less often (render 10-15 FPS).
      snapshotEvery = speed >= 16 ? Math.max(2, Math.round(speed / 2)) : B.SNAPSHOT_EVERY;
      break;
    }
    case 'pause': { paused = true; break; }
    case 'resume': { paused = false; break; }
    case 'snapshot-now': { maybeSnapshot(true); break; }
    default:
      post({ t: 'error', message: `unknown message: ${msg.t}` });
  }
};

// 50ms worker timer: cheap, keeps simulation authoritative even when the
// main thread is busy rendering. Paused automatically when the page hides
// (the main thread sends 'pause' on visibilitychange).
setInterval(frame, 50);
