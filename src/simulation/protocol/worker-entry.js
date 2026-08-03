/** Run-ID-aware Worker protocol around the shared authoritative controller. */
import { RunController } from '../simulator.js';
import { snapshotTransfers } from '../snapshot.js';
import { BALANCE as B } from '../../game/balance.js';
import { RUN_PROTOCOL_VERSION } from '../../core/run-protocol.js';
import { executeAdaptationMode, executeAdaptationSelection } from './adaptation-command.js';

let controller = null; let runId = 0; let speed = 1; let paused = false;
let snapshotEvery = B.SNAPSHOT_EVERY; let ticksSinceSnapshot = 0; let tickDebt = 0; let lastHeartbeat = 0;

function post(message, transfers) {
  const envelope = { protocolVersion: RUN_PROTOCOL_VERSION, ...message, runId };
  if (transfers?.length) self.postMessage(envelope, transfers); else self.postMessage(envelope);
}
function heartbeat(force = false) {
  const now = performance.now(); if (!force && now - lastHeartbeat < 1000) return;
  lastHeartbeat = now; post({ t: 'heartbeat', tick: controller?.state.tick ?? 0,
    status: controller?.state.status ?? 'initializing', paused });
}
function maybeSnapshot(force = false) {
  ticksSinceSnapshot++; if (!force && ticksSinceSnapshot < snapshotEvery) return;
  ticksSinceSnapshot = 0; const snapshot = controller.snapshot();
  post({ t: 'snapshot', ...snapshot }, snapshotTransfers(snapshot));
}
function frame() {
  heartbeat();
  if (!controller || paused || speed <= 0
      || !['running', 'terminal-collapse'].includes(controller.state.status)) return;
  tickDebt += (speed * B.TICKS_PER_SECOND) / 20;
  const ticks = Math.floor(tickDebt); tickDebt -= ticks; if (ticks <= 0) return;
  controller.advance(ticks);
  if (controller.state.status !== 'extinct' && controller.state.status !== 'aborted') maybeSnapshot();
}
function guardedFrame() {
  try { frame(); } catch (error) { paused = true; post({ t: 'error', fatal: true, message: error.message }); }
}

self.onmessage = (event) => {
  const message = event.data;
  try {
    if (message.t === 'init') {
      runId = message.runId; controller = new RunController({ ...message.cfg, runId }, post);
      paused = false; tickDebt = 0; post({ t: 'ready' }); heartbeat(true); return;
    }
    if (!controller) return;
    if (message.t === 'choose-adaptation' || message.t === 'set-adaptation-mode') {
      const rejected = message.t === 'choose-adaptation' ? executeAdaptationSelection(controller, message, runId)
        : executeAdaptationMode(controller, message, runId); if (rejected) post(rejected); else maybeSnapshot(true); return;
    }
    if (message.runId !== runId) return;
    switch (message.t) {
      case 'start': controller.start(); maybeSnapshot(true); break;
      case 'abort': if (!controller.abort()) post({ t: 'abort-rejected', status: controller.state.status }); break;
      case 'inspect-cell': post({ t: 'cell-inspection', requestId: message.requestId,
        cell: controller.inspectCell(message.node) }); break;
      case 'history-preview': {
        const preview = controller.historyPreview(message.tick); const cells = preview.cells.slice().buffer;
        post({ t: 'history-preview', requestId: message.requestId, tick: preview.tick,
          entropyQ: preview.entropyQ, flags: preview.flags, aliveCount: preview.aliveCount, cells }, [cells]); break;
      }
      case 'history-buffer': {
        const buffer = controller.historyBuffer();
        post({ t: 'history-buffer', requestId: message.requestId, buffer }, [buffer]); break;
      }
      case 'speed': speed = message.value; snapshotEvery = B.SNAPSHOT_EVERY; break;
      case 'pause': paused = true; heartbeat(true); break;
      case 'resume': paused = false; heartbeat(true); break;
      case 'snapshot-now': maybeSnapshot(true); break;
      case 'status': heartbeat(true); break;
      default: post({ t: 'error', message: `unknown message: ${message.t}` });
    }
  } catch (error) { post({ t: 'error', requestId: message.requestId, message: error.message }); }
};

setInterval(guardedFrame, 50);
