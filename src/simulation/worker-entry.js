/** Module Worker protocol around the shared authoritative RunController. */
import { RunController } from './simulator.js';
import { snapshotTransfers } from './snapshot.js';
import { BALANCE as B } from '../game/balance.js';

let controller = null;
let speed = 1;
let paused = false;
let snapshotEvery = B.SNAPSHOT_EVERY;
let ticksSinceSnapshot = 0;
let tickDebt = 0;

function post(message, transfers) {
  if (transfers?.length) self.postMessage(message, transfers);
  else self.postMessage(message);
}

function maybeSnapshot(force = false) {
  ticksSinceSnapshot++;
  if (!force && ticksSinceSnapshot < snapshotEvery) return;
  ticksSinceSnapshot = 0;
  const snapshot = controller.snapshot();
  post({ t: 'snapshot', ...snapshot }, snapshotTransfers(snapshot));
}

function frame() {
  if (!controller || paused || speed <= 0 || controller.state.status === 'extinct') return;
  tickDebt += (speed * B.TICKS_PER_SECOND) / 20;
  const ticks = Math.floor(tickDebt);
  tickDebt -= ticks;
  if (ticks <= 0) return;
  controller.advance(ticks);
  maybeSnapshot();
}

self.onmessage = (event) => {
  const message = event.data;
  try {
    switch (message.t) {
      case 'init':
        controller = new RunController(message.cfg, post);
        post({ t: 'ready' });
        break;
      case 'start':
        tickDebt = 0;
        controller.start();
        maybeSnapshot(true);
        break;
      case 'set-adaptation-mode':
        controller.setAdaptationMode(message.mode);
        maybeSnapshot(true);
        break;
      case 'choose-adaptation':
        controller.chooseAdaptation(message.offerId, message.cardId);
        maybeSnapshot(true);
        break;
      case 'inspect-cell':
        post({ t: 'cell-inspection', requestId: message.requestId,
          cell: controller.inspectCell(message.node) });
        break;
      case 'speed':
        speed = message.value;
        snapshotEvery = B.SNAPSHOT_EVERY; // frame-count cadence: two 50 ms slices ≈ 10 Hz
        break;
      case 'pause': paused = true; break;
      case 'resume': paused = false; break;
      case 'snapshot-now': maybeSnapshot(true); break;
      default: post({ t: 'error', message: `unknown message: ${message.t}` });
    }
  } catch (error) {
    post({ t: 'error', requestId: message.requestId, message: error.message });
  }
};

// Hidden tabs are paused by the main-thread lifecycle adapter.
setInterval(frame, 50);
