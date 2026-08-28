/** Route versioned run-driver messages without growing the composition root. */
import { identityFields, sameWorldIdentity } from '../core/world-session.js';
import {markWorldStarted,recoverAuthorityLossDuringReplacement,recoverPreAuthorityFailure} from './policies/run-session.js';
import * as ui from './surfaces.js';

export function handleRunMessage(app, message) {
  if (!sameWorldIdentity(message, app.worldIdentity)) return false;
  if (message.t === 'heartbeat') return true;
  if (message.t === 'ready') return app.driver.ready(message);
  if (message.t === 'started') { if (app.phase !== 'starting' || !markWorldStarted(app, message)) return false;
    app.flow.send('ready'); app.focusCamera(app.topo.positions.subarray(message.inoculationCell * 3, message.inoculationCell * 3 + 3));
    ui.announce(app.el, `Life is establishing itself at cell ${message.inoculationCell}; no tending is required.`); return true; }
  if (message.t === 'snapshot') { app.snapshot = message;
    ui.updateHud(app.el, message); app.metricUi.update(app.metricModel()); return; }
  if (message.t === 'history-batch') { app.mergeHistory(message.events); return true; }
  if (message.t === 'cell-inspection') { if (message.requestId === app.requestId && message.cell.node === app.selectedNode) {
    app.inspector.updateDynamic(message.cell, app.currentHistory.filter((event) => event.primaryCells.includes(app.selectedNode))); } return; }
  if (message.t === 'environment-transition') {
    app.lastEnvironmentAnnouncementTick = message.tick;
    return ui.announce(app.el, `Environment Level ${message.environmentLevel} reached.`);
  }
  if (message.t === 'terminal-collapse') { ui.announce(app.el, 'Final trace — the remaining tissue is releasing.'); return true; }
  if (message.t === 'extinct') return app.finishRun({ ...message.summary, ...identityFields(message) }, message.visualHistoryBuffer);
  if (message.t === 'aborted') return app.finishAbandoned({ ...message.summary, ...identityFields(message) });
  if (message.t === 'worker-failed' && message.recoverable && message.phase === 'pre-authority') return recoverPreAuthorityFailure(app, message);
  if(message.t==='worker-failed'&&recoverAuthorityLossDuringReplacement(app,message))return true;
  if(message.t==='worker-failed')return app.failRun(message.message);
  if (message.t === 'error') ui.announce(app.el, `The world reported a recoverable error: ${message.message}`);
}
