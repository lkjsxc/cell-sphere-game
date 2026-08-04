/** Run-ID-aware Worker protocol around the shared authoritative controller. */
import { RunController } from '../simulator.js';
import { snapshotTransfers } from '../snapshot.js';
import { BALANCE as B } from '../../game/balance.js';
import { RUN_PROTOCOL_VERSION, acceptsRunProtocol } from '../../core/run-protocol.js';
import { createWorldIdentity, identityFields, sameWorldIdentity } from '../../core/world-session.js';
import { MAX_TICKS_PER_SLICE, snapshotIntervalForSpeed, validateRuntimeSpeed } from '../../core/runtime-speed.js';

let controller = null; let identity = null; let speed = 1; let paused = false; let developerMode = false;
let tickDebt = 0; let lastHeartbeat = 0; let lastSnapshotAt = 0; let lastFrameAt = performance.now();

function post(message, transfers) {
  const envelope = { protocolVersion: RUN_PROTOCOL_VERSION, ...message, ...identityFields(identity) };
  if (transfers?.length) self.postMessage(envelope, transfers); else self.postMessage(envelope);
}
function heartbeat(force = false) {
  const now = performance.now(); if (!force && now - lastHeartbeat < 1000) return;
  lastHeartbeat = now; post({ t: 'heartbeat', tick: controller?.state.tick ?? 0,
    status: controller?.state.status ?? 'initializing', paused });
}
function maybeSnapshot(force = false, now = performance.now()) {
  if (!force && now - lastSnapshotAt < snapshotIntervalForSpeed(speed)) return;
  lastSnapshotAt = now; const snapshot = controller.snapshot();
  post({ t: 'snapshot', ...snapshot }, snapshotTransfers(snapshot));
}
function frame() {
  const now = performance.now(); const elapsed = Math.max(0, now - lastFrameAt); lastFrameAt = now; heartbeat();
  if (!controller || paused || speed <= 0
      || !['running', 'terminal-collapse'].includes(controller.state.status)) return;
  tickDebt += (elapsed / 1000) * speed * B.TICKS_PER_SECOND;
  const ticks = Math.min(Math.floor(tickDebt), MAX_TICKS_PER_SLICE); tickDebt -= ticks; if (ticks <= 0) return;
  controller.advance(ticks);
  if (controller.state.status !== 'extinct' && controller.state.status !== 'aborted') maybeSnapshot(false, now);
}
function guardedFrame() {
  try { frame(); } catch (error) { paused = true; post({ t: 'error', fatal: true, message: error.message }); }
}

self.onmessage = (event) => {
  const message = event.data;
  try {
    if (!acceptsRunProtocol(message)) {
      self.postMessage({t:'error',fatal:true,protocolVersion:RUN_PROTOCOL_VERSION,
        message:`protocol version mismatch: ${message?.protocolVersion ?? 'missing'} != ${RUN_PROTOCOL_VERSION}`});return;
    }
    if (message.t === 'init') {
      identity = createWorldIdentity(message); developerMode = message.developerMode === true;
      controller = new RunController({ ...message.cfg, ...identityFields(identity) }, post);
      paused = false; speed = 1; tickDebt = 0; lastSnapshotAt = 0; lastFrameAt = performance.now();
      post({ t: 'ready' }); heartbeat(true); return;
    }
    if (!controller || !sameWorldIdentity(message, identity)) return;
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
      case 'speed': {
        const next = validateRuntimeSpeed(message.value, { developerMode, fallback: speed });
        const accepted = next === Number(message.value); speed = next;
        post({ t: accepted ? 'speed-ack' : 'speed-rejected', requested: message.value, value: speed }); break;
      }
      case 'pause': paused = true; lastFrameAt = performance.now(); heartbeat(true); break;
      case 'resume': paused = false; lastFrameAt = performance.now(); heartbeat(true); break;
      case 'snapshot-now': maybeSnapshot(true); break;
      case 'status': heartbeat(true); break;
      default: post({ t: 'error', message: `unknown message: ${message.t}` });
    }
  } catch (error) { post({ t: 'error', requestId: message.requestId, message: error.message }); }
};

// One bounded authority slice per turn keeps pause/status messages responsive; tick debt is never discarded.
setInterval(guardedFrame, 16);
