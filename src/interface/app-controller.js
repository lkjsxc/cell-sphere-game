import { buildMemorySnapshot, createMemoryFields, getMemoryNode, MEMORY_ATLAS_REVERSE, MEMORY_NODES, purchaseMemory } from '../game/memory.js';
import { createRng } from '../core/prng.js';
import { createTopology } from '../world/icosphere.js';
import { createFields } from '../world/fields.js';
import { GLRenderer } from '../rendering/renderer.js';
import { Canvas2DRenderer } from '../rendering/fallback2d.js';
import { TitleShowcase, TITLE_SHOWCASE } from '../showcase/player.js';
import { createCamera, focusCamera, applyInertia } from '../rendering/camera.js';
import { pickNode } from '../rendering/picking.js';
import { bindGlobeInput } from './globe-input.js';
import { loadMeta, saveMeta, defaultMeta } from '../platform/storage.js';
import { appendMemoryEvent, clearHistory, loadHistory, normalizeHistoryEvents, parseHistory, saveHistory, serializeHistory } from '../platform/history.js';
import { applySettingsToDocument, saveSettings } from '../platform/settings.js';
import { createAppState } from './app-state.js';
import { createRunDriver } from './run-driver.js';
import { handleRunMessage } from './app-message.js'; import { createAdaptationEffects } from './policies/adaptation-effects.js';
import { createPauseControl, pauseLabel } from './pause-control.js';
import { applyAutoRotation, createCameraPolicy, interruptCameraPolicy } from './camera-policy.js';
import { createSurfaceCoordinator } from './policies/surface-coordinator.js';
import { applySafeLayout, safeLayout } from './policies/layout-policy.js';
import { createTimeDial } from './policies/time-dial.js';
import { advanceContinuation, cancelContinuation, continuationLabel, createContinuation, setContinuationPause, startContinuation } from './policies/continuation.js';
import { finishAbandoned, finishRun, startRun } from './policies/run-session.js';
import { createNewWorldSurface } from './policies/new-world-surface.js';
import { createHistorySurface } from './history-surface.js'; import { createHistoryPlayback } from './history-playback.js';
import { createInspectorSurface } from './inspector-surface.js';
import { createAdaptationSurface, createMemorySurface } from './panel-surfaces.js';
import { createSettingsSurface } from './settings-surface.js';
import { downloadData, parseImportedData, qualityDpr } from './app-data.js';
import * as ui from './surfaces.js';
const TITLE_SEED = TITLE_SHOWCASE.seed;
export function startGameApp(options) { const app = new GameApp(options); app.boot(); return app; }
class GameApp {
  constructor({ canvas, caps, settings }) {
    Object.assign(this, { canvas, caps, settings }); this.el = ui.elements(); this.topo4 = createTopology(4); this.topo3 = createTopology(3); this.topo = this.topo4;
    this.adaptationEffects = createAdaptationEffects(this.topo4, this.el.adaptationCaption); this.camera = createCamera(); this.meta = loadMeta(); this.archive = loadHistory(settings.historyRetention);
    this.flow = createAppState(); this.speed = settings.speed; this.snapshot = null; this.selectedNode = null;
    this.renderer = null; this.fields = null; this.worldFields = null; this.atlasFields = createMemoryFields(this.topo3); this.showcase = null;
    this.memorySnapshot = null; this.overlay = null;
    this.offers = []; this.cards = []; this.currentHistory = []; this.lastResult = null; this.resultKeys = new Set(); this.requestId = 0;
    this.runSeed = null; this.activeRunId = 0; this.visualSeed = null; this.historySnapshot = null; this.historyHighlights = [];
    this.last = performance.now(); this.lastRender = 0; this.lastInspect = 0; this.cameraPolicy = createCameraPolicy(this.last); this.layoutClass = null; this.effectivePaused = false;
    this.driver = createRunDriver(caps, (message) => this.message(message)); this.pause = createPauseControl((paused, reasons) => this.applyPause(paused, reasons)); this.surfaces = createSurfaceCoordinator(() => this.closeActiveOverlay());
    this.historyPlayback = createHistoryPlayback(this); this.continuation = createContinuation(); this.countdownLabel = ''; this.timeDial = createTimeDial(this.el.pause);
  }
  get state() { return this.flow.state; } boot() {
    this.makeRenderer(TITLE_SEED); focusCamera(this.camera,
      this.topo.positions.subarray(TITLE_SHOWCASE.focusCell * 3, TITLE_SHOWCASE.focusCell * 3 + 3)); this.resize(false);
    this.showcase = new TitleShowcase(this.topo);
    this.makeSurfaces(); this.bindUi(); this.bindCanvas(); this.bindLifecycle(); this.el.speed.value = String(this.speed);
    this.el.boot.textContent = `Cells ready — ${this.renderer.backend === 'webgl2' ? 'WebGL2' : 'Canvas 2D'}`; ui.show(this.el, 'title'); ui.updateAdaptationMode(this.el, this.settings.adaptationMode);
    if (this.meta.migrationNotice?.pending) { ui.toast(this.el, 'Your earlier skills and Imprints were moved into the Evolution Globe.');
      this.meta = { ...this.meta, migrationNotice: { ...this.meta.migrationNotice, pending: false } }; saveMeta(this.meta); }
    window.__IN_BOOT__ = Object.freeze({ renderer: this.renderer.backend, version: '0.2.0', playable: true }); window.__IN_APP__ = this;
    requestAnimationFrame((now) => this.frame(now)); console.info(`boot ok: ${this.renderer.backend}; passive world ready`);
  } makeSurfaces() {
    this.adapt = createAdaptationSurface({ onClose: () => this.panelClosed('adaptations'), onChoose: (offer, card) => this.choose(offer, card), onMode: (mode) => this.applyAdaptationMode(mode) });
    this.inspector = createInspectorSurface({ onClose: () => this.closeInspector(), onHistory: () => this.openHistory('current') });
    this.historyUi = createHistorySurface({ onClose: () => this.panelClosed('history'),
      onWorld: (world) => this.historyPlayback.selectWorld(world), onSeek: (tick, event, world) => this.historyPlayback.seek(tick, event, world),
      onLive: () => this.historyPlayback.live() });
    this.memoryUi = createMemorySurface({ onCloseNode: () => this.closeMemoryNode(), onUnlock: (id) => this.buyMemory(id), onSelect: (id) => this.selectMemoryNode(id) });
    this.newWorld = createNewWorldSurface({ onClose: () => this.panelClosed('new-world'), onConfirm: () => this.confirmNewWorld() });
    this.settingsUi = createSettingsSurface({ read: () => this.settings, onChange: (value) => this.applySettings(value), onClose: () => this.panelClosed('settings'), onAction: (action, value) => this.settingsAction(action, value) });
  }
  makeRenderer(seed, memory = false) {
    this.visualSeed = seed; this.topo = memory ? this.topo3 : this.topo4;
    if (memory) this.fields = this.atlasFields;
    else { this.worldFields = createFields(createRng(seed ^ 0x51ab3d71), this.topo4); this.fields = this.worldFields; }
    this.renderer?.dispose();
    const fallback = () => { this.renderer = new Canvas2DRenderer(this.canvas, this.topo, this.fields); ui.announce(this.el, 'WebGL was lost. The observational Canvas renderer is continuing.'); };
    try { this.renderer = new GLRenderer(this.canvas, this.topo, this.fields, { onContextLoss: fallback }); }
    catch (error) { console.warn('WebGL2 unavailable; Canvas 2D active', error); fallback(); }
  } bindUi() {
    this.el.begin.addEventListener('click', () => this.startRun()); this.el.restart.addEventListener('click', () => this.startRun());
    this.el.resultNext.addEventListener('click', () => this.startRun()); this.el.memoryButton.addEventListener('click', () => this.enterMemory());
    this.el.pause.addEventListener('click', () => this.pause.set('manual', !this.pause.has('manual')));
    this.el.speed.addEventListener('change', () => this.setSpeed(Number(this.el.speed.value))); this.el.adaptationButton.addEventListener('click', () => this.openAdaptations());
    document.getElementById('new-world-button')?.addEventListener('click', () => this.openNewWorld());
    document.getElementById('evolution-focus-available')?.addEventListener('click', () => this.focusAvailableSkill());
    document.querySelectorAll('.settings-open').forEach((button) => button.addEventListener('click', () => this.openSettings()));
    document.querySelectorAll('.history-open').forEach((button) => button.addEventListener('click', () => this.openHistory()));
    this.el.resultHistory.addEventListener('click', () => this.openHistory('current')); this.el.resultDetails.addEventListener('click', () => this.openResultDetails());
    document.getElementById('result-details-close')?.addEventListener('click', () => this.panelClosed('result-details'));
    document.addEventListener('keydown', (event) => { if ((event.metaKey || event.ctrlKey) && event.key === ',') { event.preventDefault(); this.openSettings(); }
      else if (event.key === 'Home' && this.state === 'memory') { event.preventDefault(); this.focusAvailableSkill(); } });
  }
  bindCanvas() { const interrupt = () => { interruptCameraPolicy(this.cameraPolicy, performance.now()); if (this.state === 'result') this.pauseContinuation('interaction', true); }; this.input = bindGlobeInput(this.canvas, this.camera, { canInteract: () => ['title', 'running', 'result', 'memory'].includes(this.state),
      onTap: (x, y) => this.tapGlobe(x, y), onInterrupt: interrupt, onInteractionStart: interrupt,
      onInteractionEnd: () => interruptCameraPolicy(this.cameraPolicy, performance.now()) }); }
  bindLifecycle() {
    const resize = () => this.resize(true); const stopNext = () => { if (this.state === 'result') this.pauseContinuation('interaction', true); };
    if (typeof ResizeObserver === 'function') new ResizeObserver(resize).observe(this.canvas); else addEventListener('resize', resize); this.el.result.addEventListener('pointerdown', stopNext); document.addEventListener('keydown', stopNext);
    document.addEventListener('visibilitychange', () => { this.pause.set('hidden', document.hidden && ['starting', 'running'].includes(this.state)); this.pauseContinuation('hidden', document.hidden); });
  }
  tapGlobe(x, y) {
    const hit = pickNode(this.canvas, x, y, this.camera, this.topo); if (!hit) return;
    if (this.state === 'memory') { const index = MEMORY_ATLAS_REVERSE[hit.node];
      if (index >= 0) this.selectMemoryNode(MEMORY_NODES[index].id); return; }
    this.selectCell(hit.node);
  }
  selectCell(node, context = null) {
    this.closeActiveOverlay(); this.selectedNode = node; interruptCameraPolicy(this.cameraPolicy, performance.now(), 60_000);
    const events = this.currentHistory.filter((event) => event.primaryCells.includes(node)); this.inspector.open({ node, world: this.fields, topo: this.topo, dynamic: null, events, context });
    this.overlay = 'inspector'; this.surfaces.open('inspector', this.inspector.panel, document.getElementById('inspector-heading')); this.pauseContinuation('surface', true); this.resize(true);
    if (this.state === 'running' || this.state === 'result') this.requestInspection();
  }
  requestInspection() { if (this.selectedNode == null) return; this.driver.message({ t: 'inspect-cell', requestId: ++this.requestId, node: this.selectedNode }); this.lastInspect = performance.now(); }
  closeInspector() { this.inspector.close(); this.surfaces.close('inspector'); if (this.overlay === 'inspector') this.overlay = null;
    this.selectedNode = null; this.pauseContinuation('surface', false); this.resize(true); interruptCameraPolicy(this.cameraPolicy, performance.now()); }
  startRun() { startRun(this); }
  message(message) { if (!this.historyPlayback.handle(message)) handleRunMessage(this, message); }
  mergeHistory(events) { const bySeq = new Map(this.currentHistory.map((event) => [event.seq, event]));
    for (const event of normalizeHistoryEvents(events)) bySeq.set(event.seq, event); this.currentHistory = [...bySeq.values()].sort((a, b) => a.seq - b.seq); }
  adaptationModel() { return { offers: this.offers, cards: this.cards, mode: this.settings.adaptationMode, tick: this.snapshot?.tick ?? 0 }; }
  pendingCount() { return this.offers.filter((offer) => offer.resolvedTick == null).length; }
  choose(offerId, cardId) { this.driver.message({ t: 'choose-adaptation', offerId, cardId }); }
  setSpeed(value) { this.speed = value; this.settings = { ...this.settings, speed: value }; saveSettings(this.settings); this.driver.setSpeed(value); }
  applyPause(paused, reasons = this.pause.values()) { if (paused !== this.effectivePaused) { this.effectivePaused = paused; this.driver.setPaused(paused); } this.timeDial.reset(performance.now());
    this.el.pause.setAttribute('aria-pressed', String(reasons.has('manual'))); this.el.pause.classList.toggle('is-paused', paused);
    this.el.pause.dataset.action = paused && reasons.size === 1 && reasons.has('manual') ? 'recommended' : 'normal'; this.el.pause.setAttribute('aria-label', pauseLabel(reasons)); }
  finishRun(result) { finishRun(this, result); }
  finishAbandoned(summary) { finishAbandoned(this, summary); }
  failRun(message) { this.pause.set('worker-failed', true); ui.announce(this.el, `${message} Start a new world to continue.`); }
  enterMemory() { this.closeActiveOverlay(); this.adaptationEffects.clear(); cancelContinuation(this.continuation); this.el.countdown.textContent = ''; this.flow.send('memory'); this.selectedNode = null;
    this.makeRenderer(0, true); this.memorySnapshot = buildMemorySnapshot(this.topo3, this.meta); if (this.memorySnapshot.focus) focusCamera(this.camera, this.memorySnapshot.focus);
    this.memoryUi.syncTree(this.meta); ui.showMemory(this.el, this.meta, this.availableMemory()); this.resize(false); }
  selectMemoryNode(id) { const node = getMemoryNode(id); if (!node) return;
    if (this.overlay === 'memory-node' && this.memoryUi.selectedId === id) return this.closeMemoryNode();
    this.closeActiveOverlay(); this.selectedNode = node.cell;
    focusCamera(this.camera, this.topo.positions.subarray(node.cell * 3, node.cell * 3 + 3)); interruptCameraPolicy(this.cameraPolicy, performance.now(), 60_000);
    this.memorySnapshot = buildMemorySnapshot(this.topo, this.meta, id); this.memoryUi.openNode(node, this.meta); this.overlay = 'memory-node';
    this.surfaces.open('memory-node', this.memoryUi.panel, document.getElementById('memory-node-heading')); this.resize(true); }
  closeMemoryNode() { this.memoryUi.closeNode(); this.surfaces.close('memory-node'); if (this.overlay === 'memory-node') this.overlay = null; this.selectedNode = null;
    this.memorySnapshot = buildMemorySnapshot(this.topo, this.meta); this.resize(true); interruptCameraPolicy(this.cameraPolicy, performance.now()); }
  buyMemory(id) { const before = new Set(this.memorySnapshot.nodeStates.filter((node) => node.reachable).map((node) => node.id)); const purchase = purchaseMemory(this.meta, id); if (!purchase.ok) return; if (!saveMeta(purchase.meta)) return ui.announce(this.el, 'That skill could not be stored; no Echoes were spent.');
    this.meta = purchase.meta; this.archive = appendMemoryEvent(this.archive, id, purchase.spent, this.meta.echoBalance, this.meta.runs); saveHistory(this.archive, this.settings.historyRetention);
    const next = buildMemorySnapshot(this.topo, this.meta, id); const newly = next.nodeStates.filter((node) => node.reachable && !before.has(node.id)).map((node) => node.id); this.memorySnapshot = buildMemorySnapshot(this.topo, this.meta, id, newly); this.memoryUi.refresh(this.meta, newly);
    ui.showMemory(this.el, this.meta, this.availableMemory()); ui.announce(this.el, `${purchase.node.nameEn} unlocked. ${newly.length} adjacent skills are now available.`); }
  openAdaptations() { if (this.state !== 'running' || this.surfaces.toggle('adaptations')) return; this.openFull('adaptations'); this.adapt.open(this.adaptationModel());
    this.activateSurface('adaptations', this.adapt.surface, 'adaptations-heading'); }
  openHistory(scope = null) { if (this.surfaces.toggle('history')) return;
    this.historyPlayback.open(scope ?? (this.state === 'title' || this.state === 'memory' ? 'past' : 'current')); }
  openSettings() { if (this.surfaces.toggle('settings')) return; this.openFull('settings'); this.settingsUi.open(this.state === 'running'); this.activateSurface('settings', this.settingsUi.surface, 'settings-heading'); }
  openResultDetails() { if (this.state !== 'result' || this.surfaces.toggle('result-details')) return; this.openFull('result-details');
    this.activateSurface('result-details', document.getElementById('result-details'), 'result-details-heading'); }
  openNewWorld() { if (this.state !== 'running' || this.surfaces.toggle('new-world')) return; this.openFull('new-world');
    this.pause.set('new-world', true); this.newWorld.open(this.snapshot); this.activateSurface('new-world', this.newWorld.surface, 'new-world-heading'); }
  confirmNewWorld() { this.newWorld.pending(); if (!this.driver.abort()) this.panelClosed('new-world'); }
  focusAvailableSkill() { const state = this.memorySnapshot?.nodeStates.find((node) => node.reachable && !node.owned && node.affordable)
    ?? this.memorySnapshot?.nodeStates.find((node) => node.reachable && !node.owned); if (state) this.selectMemoryNode(state.id); }
  openFull(name) { this.closeActiveOverlay(); this.overlay = name; this.pause.set('panel', this.state === 'running' && this.settings.pauseOnPanels); this.pauseContinuation('surface', true); }
  activateSurface(name, element, heading) { this.surfaces.open(name, element, document.getElementById(heading)); this.resize(true); }
  panelClosed(name) { if (this.overlay === name) this.closeActiveOverlay(); }
  closeActiveOverlay() { const name = this.overlay; if (!name) return;
    if (name === 'inspector') this.inspector.close(); else if (name === 'memory-node') this.memoryUi.closeNode();
    else if (name === 'adaptations') this.adapt.close(); else if (name === 'history') { this.historyPlayback.close(); this.historyUi.close(); }
    else if (name === 'settings') this.settingsUi.close(); else if (name === 'new-world') this.newWorld.close();
    this.surfaces.close(name); this.overlay = null; this.pause.set('panel', false); this.pause.set('new-world', false); this.pauseContinuation('surface', false);
    if (name === 'inspector' || name === 'memory-node') this.selectedNode = null;
    if (name === 'memory-node' && this.state === 'memory') this.memorySnapshot = buildMemorySnapshot(this.topo, this.meta); this.resize(true);
  }
  applyAdaptationMode(mode) { this.applySettings({ ...this.settings, adaptationMode: mode }); }
  applySettings(value) { const before = this.settings; this.settings = value; saveSettings(value); applySettingsToDocument(value); ui.updateAdaptationMode(this.el, value.adaptationMode);
    if (value.speed !== this.speed) { this.speed = value.speed; this.el.speed.value = String(value.speed); this.driver.setSpeed(value.speed); }
    if (value.adaptationMode !== before.adaptationMode && this.state === 'running') this.driver.message({ t: 'set-adaptation-mode', mode: value.adaptationMode });
    if (this.overlay && value.pauseOnPanels !== before.pauseOnPanels) this.pause.set('panel', this.state === 'running' && value.pauseOnPanels);
    if (this.state === 'result' && value.autoContinue !== before.autoContinue) { if (value.autoContinue) startContinuation(this.continuation, performance.now());
      else { cancelContinuation(this.continuation); this.el.countdown.textContent = ''; } }
    this.resize(true); interruptCameraPolicy(this.cameraPolicy, performance.now()); }
  settingsAction(action, value) { try {
    if (action === 'camera-reset') { Object.assign(this.camera, createCamera()); this.selectedNode = null; }
    else if (action === 'export') downloadData(this.meta, this.archive, this.settings);
    else if (action === 'clear-history' && confirm('Clear all preserved History?')) { this.archive = clearHistory(); saveHistory(this.archive); this.historyPlayback.clear(); ui.announce(this.el, 'History was cleared.'); }
    else if (action === 'reset-progress' && confirm('Reset Echoes, Evolution Globe skills, and Imprints? This cannot be undone.')) { this.meta = defaultMeta(); saveMeta(this.meta); ui.announce(this.el, 'Progression was reset.'); }
    else if (action === 'import') { const data = parseImportedData(value); this.meta = data.meta; this.archive = data.history; this.applySettings(data.settings);
      saveMeta(this.meta); saveHistory(this.archive, this.settings.historyRetention); ui.announce(this.el, 'Local data was imported.'); }
    else if (action === 'import-error') throw new Error('invalid import');
  } catch { ui.announce(this.el, 'That local-data action could not be completed.'); } }
  availableMemory() { return this.memorySnapshot?.nodeStates?.filter((node) => node.reachable && !node.owned).length ?? 0; }
  pauseContinuation(reason, paused) { setContinuationPause(this.continuation, reason, paused, performance.now()); this.updateContinuation(); }
  updateContinuation() { const label = continuationLabel(this.continuation); if (label === this.countdownLabel) return; this.countdownLabel = label; this.el.countdown.textContent = label; }
  resize(preserveZoom = true) { const cls = this.canvas.clientWidth < 600 ? 'compact' : this.canvas.clientWidth < 900 ? 'tablet' : 'wide'; const layout = safeLayout(this.canvas.clientWidth, this.canvas.clientHeight, this.state); preserveZoom &&= cls === this.layoutClass; this.layoutClass = cls;
    applySafeLayout(this.camera, layout, preserveZoom); this.renderer?.resize(this.canvas.clientWidth, this.canvas.clientHeight, qualityDpr(this.settings, this.caps)); }
  frame(now) { const dt = Math.min(100, now - this.last); this.last = now; this.timeDial.frame(now, { running: this.state === 'running', paused: this.pause.paused, speed: this.speed, reduced: this.settings.motion === 'reduced' }); this.driver.frame(dt, now);
    if (this.state === 'title') this.showcase?.update(now, this.settings.motion === 'reduced', document.hidden);
    const active = this.input?.isActive(); if (!active && this.selectedNode == null && this.settings.cameraInertia) applyInertia(this.camera);
    applyAutoRotation(this.camera, this.settings, this.cameraPolicy, { active, selected: this.selectedNode != null,
      overlay: Boolean(this.overlay), hidden: document.hidden }, now, dt);
    if (this.state === 'result' && advanceContinuation(this.continuation, now)) { this.startRun(); return; }
    if (this.state === 'result') this.updateContinuation();
    if (this.inspector?.node != null && (this.state === 'running' || this.state === 'result') && now - this.lastInspect > 333) this.requestInspection();
    const snap = this.historySnapshot ?? (this.state === 'title' ? this.showcase?.snapshot : this.state === 'memory' ? this.memorySnapshot : this.snapshot);
    const cadence = this.speed >= 16 ? 66 : 0;
    if (!cadence || now - this.lastRender >= cadence) { this.renderer.render({ snapshot: snap ?? null, camera: this.camera, selectedNode: this.selectedNode,
      adaptation: this.adaptationEffects.frame(now), highlightedCells: this.historyHighlights,
      time: now / 1000, pulse: this.settings.motion !== 'reduced' }); this.lastRender = now; }
    requestAnimationFrame((time) => this.frame(time)); }
}
