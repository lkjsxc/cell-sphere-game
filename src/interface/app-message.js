/** Route versioned run-driver messages without growing the composition root. */
import { saveSettings } from '../platform/settings.js';
import { focusCamera } from '../rendering/camera.js';
import * as ui from './surfaces.js';

export function handleRunMessage(app, message) {
  if (message.t === 'ready') return app.driver.ready();
  if (message.t === 'started') { if (app.state === 'starting') app.flow.send('ready');
    focusCamera(app.camera, app.topo.positions.subarray(message.inoculationCell * 3, message.inoculationCell * 3 + 3));
    ui.announce(app.el, `Life inoculated cell ${message.inoculationCell}.`); return; }
  if (message.t === 'snapshot') { app.snapshot = message; app.driver.snapshot = message; ui.updateHud(app.el, message); app.adapt.update(app.adaptationModel()); return; }
  if (message.t === 'history-batch') return app.mergeHistory(message.events);
  if (message.t === 'cell-inspection') { if (message.requestId === app.requestId && message.cell.node === app.selectedNode) {
    app.inspector.updateDynamic(message.cell, app.currentHistory.filter((event) => event.cellId === app.selectedNode)); } return; }
  if (message.t === 'adaptation-offered') { app.offers.push(message.offer); ui.updateAdaptationCount(app.el, app.pendingCount()); return; }
  if (message.t === 'adaptation-selected') { const offer = app.offers.find((item) => item.id === message.offerId);
    if (offer) Object.assign(offer, { resolvedTick: message.tick, selectedCardId: message.cardId, selectionMode: message.selectionMode });
    app.cards.push(message.cardId); ui.updateAdaptationCount(app.el, app.pendingCount()); app.adapt.update(app.adaptationModel());
    ui.toast(app.el, `${humanize(message.cardId)} remembered.`); return; }
  if (message.t === 'adaptation-mode') { app.settings = { ...app.settings, adaptationMode: message.mode };
    saveSettings(app.settings); app.adapt.update(app.adaptationModel()); return; }
  if (message.t === 'event') return ui.announce(app.el, `${humanize(message.family)} · ${message.phase}`);
  if (message.t === 'extinct') return app.finishRun(message.summary);
  if (message.t === 'error') ui.announce(app.el, `The world reported a recoverable error: ${message.message}`);
}

function humanize(value) { return String(value).replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()); }
