/** Route versioned run-driver messages without growing the composition root. */
import { saveSettings } from '../platform/settings.js';
import { focusCamera } from '../rendering/camera.js';
import { identityFields, sameWorldIdentity } from '../core/world-session.js';
import { markWorldStarted, recoverPreAuthorityFailure } from './policies/run-session.js';
import * as ui from './surfaces.js';

export function handleRunMessage(app, message) {
  if (!sameWorldIdentity(message, app.worldIdentity)) return false;
  if (message.t === 'heartbeat') return true;
  if (message.t === 'ready') return app.driver.ready(message);
  if (message.t === 'started') { if (app.phase !== 'starting' || !markWorldStarted(app, message)) return false;
    app.flow.send('ready'); focusCamera(app.camera, app.topo.positions.subarray(message.inoculationCell * 3, message.inoculationCell * 3 + 3));
    ui.announce(app.el, `Life inoculated cell ${message.inoculationCell}.`); return true; }
  if (message.t === 'snapshot') { app.snapshot = message; app.adaptationEffects.onSnapshot(message);
    ui.updateHud(app.el, message); app.adapt.update(app.adaptationModel()); app.metricUi.update(app.metricModel()); return; }
  if (message.t === 'history-batch') { app.mergeHistory(message.events); return true; }
  if (message.t === 'cell-inspection') { if (message.requestId === app.requestId && message.cell.node === app.selectedNode) {
    app.inspector.updateDynamic(message.cell, app.currentHistory.filter((event) => event.primaryCells.includes(app.selectedNode))); } return; }
  if (message.t === 'adaptation-offered') { app.offers.push(message.offer); ui.updateAdaptationCount(app.el, app.pendingCount()); return; }
  if (message.t === 'adaptation-selected') { const offer = app.offers.find((item) => item.id === message.offerId);
    if (offer) Object.assign(offer, { resolvedTick: message.tick, selectedCardId: message.cardId, selectionMode: message.selectionMode });
    if (!app.cards.includes(message.cardId)) app.cards.push(message.cardId); ui.updateAdaptationCount(app.el, app.pendingCount());
    app.adapt.acknowledge(message); app.adapt.update(app.adaptationModel()); app.adaptationEffects.selected(message, app.snapshot, app.settings.motion === 'reduced'); return; }
  if (message.t === 'adaptation-selection-rejected') { mergeCurrentOffer(app, message.currentOffer); app.adapt.reject(message);
    app.adapt.update(app.adaptationModel()); ui.announce(app.el, `Adaptation not applied: ${humanize(message.reason)}.`); return; }
  if (message.t === 'adaptation-mode') { app.settings = { ...app.settings, adaptationMode: message.mode }; saveSettings(app.settings);
    ui.updateAdaptationMode(app.el, message.mode); app.settingsUi.sync(); app.adapt.acknowledgeMode(message); app.adapt.update(app.adaptationModel()); return; }
  if (message.t === 'adaptation-mode-rejected') { app.adapt.rejectMode(message); app.adapt.update(app.adaptationModel());
    ui.updateAdaptationMode(app.el, app.settings.adaptationMode); app.settingsUi.sync(); ui.announce(app.el, `Adaptation mode not changed: ${humanize(message.reason)}.`); return; }
  if (message.t === 'event') return ui.announce(app.el, `${humanize(message.family)} · ${message.phase}`);
  if (message.t === 'terminal-collapse') { ui.announce(app.el, 'Final trace — the remaining tissue is releasing.');
    app.el.eventTime.textContent = `${app.gameTime(app.snapshot?.tick ?? 0)} · TERMINAL`; return true; }
  if (message.t === 'extinct') return app.finishRun({ ...message.summary, ...identityFields(message) });
  if (message.t === 'aborted') return app.finishAbandoned({ ...message.summary, ...identityFields(message) });
  if (message.t === 'worker-failed' && message.recoverable && message.phase === 'pre-authority') return recoverPreAuthorityFailure(app, message);
  if (message.t === 'worker-failed') return app.failRun(message.message);
  if (message.t === 'error') ui.announce(app.el, `The world reported a recoverable error: ${message.message}`);
}

function mergeCurrentOffer(app, current) { if (!current) return; const index = app.offers.findIndex((offer) => offer.id === current.id);
  if (index < 0) app.offers.push(current); else app.offers[index] = current; }
function humanize(value) { return String(value).replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()); }
