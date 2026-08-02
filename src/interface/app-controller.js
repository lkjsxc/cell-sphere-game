/** Browser composition for the autonomous world, observation, and Memory loop. */
import { scoreResult } from '../game/scoring.js';
import { buildMemorySnapshot, compileMemory, getMemoryNode, purchaseMemory } from '../game/memory.js';
import { createRng } from '../core/prng.js';
import { createTopology } from '../world/icosphere.js';
import { createFields } from '../world/fields.js';
import { GLRenderer } from '../rendering/renderer.js';
import { Canvas2DRenderer } from '../rendering/fallback2d.js';
import { AttractState } from '../rendering/attract-state.js';
import { createCamera, focusCamera, applyInertia } from '../rendering/camera.js';
import { pickNode } from '../rendering/picking.js';
import { bindGlobeInput } from './globe-input.js';
import { loadMeta, saveMeta, defaultMeta } from '../platform/storage.js';
import { appendMemoryEvent, appendWorld, clearHistory, loadHistory, normalizeHistoryEvents, parseHistory, saveHistory, serializeHistory } from '../platform/history.js';
import { applySettingsToDocument, saveSettings } from '../platform/settings.js';
import { createAppState } from './app-state.js';
import { createRunDriver } from './run-driver.js';
import { handleRunMessage } from './app-message.js'; import { createAdaptationEffects } from './adaptation-effects.js';
import { createPauseControl } from './pause-control.js';
import { applyAutoRotation, createCameraPolicy, interruptCameraPolicy } from './camera-policy.js';
import { createSurfaceCoordinator } from './policies/surface-coordinator.js';
import { applySafeLayout, safeLayout } from './policies/layout-policy.js';
import { advanceContinuation, cancelContinuation, continuationLabel, createContinuation, setContinuationPause, startContinuation } from './policies/continuation.js';
import { createHistorySurface } from './history-surface.js'; import { createHistoryPlayback } from './history-playback.js';
import { createInspectorSurface } from './inspector-surface.js';
import { createAdaptationSurface, createMemorySurface, nearestMemoryNode } from './panel-surfaces.js';
import { createSettingsSurface } from './settings-surface.js';
import { downloadData, parseImportedData, qualityDpr, seedForRun } from './app-data.js';
import * as ui from './surfaces.js';
const TITLE_SEED = 20260731;
export function startGameApp(options) { const app = new GameApp(options); app.boot(); return app; }
class GameApp {
  constructor({ canvas, caps, settings }) {
    Object.assign(this, { canvas, caps, settings }); this.el = ui.elements(); this.topo = createTopology(4);
    this.adaptationEffects = createAdaptationEffects(this.topo, this.el.adaptationCaption); this.camera = createCamera(); this.meta = loadMeta(); this.archive = loadHistory(settings.historyRetention);
    this.flow = createAppState(); this.speed = settings.speed; this.snapshot = null; this.selectedNode = null;
    this.renderer = null; this.fields = null; this.attract = null; this.memorySnapshot = null; this.overlay = null;
    this.offers = []; this.cards = []; this.currentHistory = []; this.lastResult = null; this.requestId = 0;
    this.runSeed = null; this.visualSeed = null; this.historySnapshot = null; this.historyHighlights = [];
    this.last = performance.now(); this.lastRender = 0; this.lastInspect = 0; this.cameraPolicy = createCameraPolicy(this.last);
    this.driver = createRunDriver(caps, (message) => this.message(message)); this.pause = createPauseControl((paused) => this.applyPause(paused)); this.surfaces = createSurfaceCoordinator(() => this.closeActiveOverlay());
    this.historyPlayback = createHistoryPlayback(this); this.continuation = createContinuation(); this.countdownLabel = '';
  }
  get state() { return this.flow.state; }
  boot() {
    this.makeRenderer(TITLE_SEED); focusCamera(this.camera, openingDirection(this.fields, this.topo)); this.resize(false);
    const x = this.canvas.clientWidth * (0.5 + this.camera.offsetX * 0.5);
    this.attract = new AttractState(this.topo, pickNode(this.canvas, x, this.canvas.clientHeight / 2, this.camera, this.topo)?.node ?? 0);
    this.makeSurfaces(); this.bindUi(); this.bindCanvas(); this.bindLifecycle(); this.el.speed.value = String(this.speed);
    this.el.boot.textContent = `Cells ready — ${this.renderer.backend === 'webgl2' ? 'WebGL2' : 'Canvas 2D'}`; ui.show(this.el, 'title');
    if (this.meta.migrationNotice?.pending) { ui.toast(this.el, 'Your earlier Memory was woven into the expanded atlas.');
      this.meta = { ...this.meta, migrationNotice: { ...this.meta.migrationNotice, pending: false } }; saveMeta(this.meta); }
    window.__IN_BOOT__ = Object.freeze({ renderer: this.renderer.backend, version: '0.2.0', playable: true }); window.__IN_APP__ = this;
    requestAnimationFrame((now) => this.frame(now)); console.info(`boot ok: ${this.renderer.backend}; passive world ready`);
  }
  makeSurfaces() {
    this.adapt = createAdaptationSurface({ onClose: () => this.panelClosed('adaptations'), onChoose: (offer, card) => this.choose(offer, card) });
    this.inspector = createInspectorSurface({ onClose: () => this.closeInspector(), onHistory: () => this.openHistory('current') });
    this.historyUi = createHistorySurface({ onClose: () => this.panelClosed('history'),
      onWorld: (world) => this.historyPlayback.selectWorld(world), onSeek: (tick, event, world) => this.historyPlayback.seek(tick, event, world),
      onLive: () => this.historyPlayback.live() });
    this.memoryUi = createMemorySurface({ onCloseNode: () => this.closeMemoryNode(), onCloseList: () => this.panelClosed('memory-list'), onUnlock: (id) => this.buyMemory(id), onSelect: (id) => this.selectMemoryNode(id) });
    this.settingsUi = createSettingsSurface({ read: () => this.settings, onChange: (value) => this.applySettings(value), onClose: () => this.panelClosed('settings'), onAction: (action, value) => this.settingsAction(action, value) });
  }
  makeRenderer(seed) {
    this.visualSeed = seed; this.fields = createFields(createRng(seed ^ 0x51ab3d71), this.topo); this.renderer?.dispose();
    const fallback = () => { this.renderer = new Canvas2DRenderer(this.canvas, this.topo, this.fields); ui.announce(this.el, 'WebGL was lost. The observational Canvas renderer is continuing.'); };
    try { this.renderer = new GLRenderer(this.canvas, this.topo, this.fields, { onContextLoss: fallback }); }
    catch (error) { console.warn('WebGL2 unavailable; Canvas 2D active', error); fallback(); }
  }
  bindUi() {
    this.el.begin.addEventListener('click', () => this.startRun()); this.el.restart.addEventListener('click', () => this.startRun());
    this.el.resultNext.addEventListener('click', () => this.startRun()); this.el.memoryButton.addEventListener('click', () => this.enterMemory());
    this.el.pause.addEventListener('click', () => this.pause.set('manual', !this.pause.has('manual')));
    this.el.speed.addEventListener('change', () => this.setSpeed(Number(this.el.speed.value))); this.el.adaptationButton.addEventListener('click', () => this.openAdaptations());
    document.querySelectorAll('.settings-open').forEach((button) => button.addEventListener('click', () => this.openSettings()));
    document.querySelectorAll('.history-open').forEach((button) => button.addEventListener('click', () => this.openHistory()));
    this.el.resultHistory.addEventListener('click', () => this.openHistory('current')); this.el.resultDetails.addEventListener('click', () => this.openResultDetails());
    document.getElementById('result-details-close')?.addEventListener('click', () => this.panelClosed('result-details'));
    document.getElementById('memory-list-button')?.addEventListener('click', () => this.openMemoryList());
    document.addEventListener('keydown', (event) => { if ((event.metaKey || event.ctrlKey) && event.key === ',') { event.preventDefault(); this.openSettings(); } });
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
    if (this.state === 'memory') { const node = nearestMemoryNode(hit.hit, this.topo); if (node) this.selectMemoryNode(node.id); return; }
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
  startRun() {
    this.closeActiveOverlay(); this.adaptationEffects.clear(); cancelContinuation(this.continuation); this.el.countdown.textContent = ''; this.pause.clear(); this.selectedNode = null; this.offers = []; this.cards = []; this.currentHistory = []; this.lastResult = null;
    const seed = seedForRun(this.meta.runs); this.runSeed = seed; this.makeRenderer(seed); this.flow.send(this.state === 'title' ? 'begin' : 'restart'); this.resize(false); this.snapshot = null; this.historySnapshot = null; this.historyHighlights = [];
    ui.show(this.el, 'run'); ui.announce(this.el, 'The seeded world is choosing a suitable place to begin.');
    const memory = compileMemory(this.meta); this.driver.start({ seed, strainId: 'pioneer', memoryEffects: memory.effects,
      memoryConditionals: memory.conditionals, memoryUnlocks: memory.unlocks, adaptationMode: this.settings.adaptationMode }, this.speed);
  }
  message(message) { if (!this.historyPlayback.handle(message)) handleRunMessage(this, message); }
  mergeHistory(events) { const bySeq = new Map(this.currentHistory.map((event) => [event.seq, event]));
    for (const event of normalizeHistoryEvents(events)) bySeq.set(event.seq, event); this.currentHistory = [...bySeq.values()].sort((a, b) => a.seq - b.seq); }
  adaptationModel() { return { offers: this.offers, cards: this.cards, mode: this.settings.adaptationMode, tick: this.snapshot?.tick ?? 0 }; }
  pendingCount() { return this.offers.filter((offer) => offer.resolvedTick == null).length; }
  choose(offerId, cardId) { this.driver.message({ t: 'choose-adaptation', offerId, cardId }); }
  setSpeed(value) { this.speed = value; this.settings = { ...this.settings, speed: value }; saveSettings(this.settings); this.driver.setSpeed(value); }
  applyPause(paused) { this.driver.setPaused(paused); this.el.pause.setAttribute('aria-pressed', String(paused)); this.el.pause.textContent = paused ? 'Resume' : 'Pause'; }
  finishRun(result) {
    this.closeActiveOverlay(); this.adaptationEffects.clear(); this.selectedNode = null; this.flow.send('extinct'); this.lastResult = result; this.currentHistory = normalizeHistoryEvents(result.history); const score = scoreResult(result);
    const next = { ...this.meta, runs: this.meta.runs + 1, totalEchoes: this.meta.totalEchoes + score.echoes,
      echoBalance: this.meta.echoBalance + score.echoes, bestScore: Math.max(this.meta.bestScore, score.total),
      imprints: result.imprint.edges.length ? [...this.meta.imprints, result.imprint].slice(-8) : this.meta.imprints };
    this.meta = next; if (!saveMeta(next)) ui.announce(this.el, 'Progress is temporary because browser storage is unavailable.');
    this.archive = appendWorld(this.archive, result, score, next.runs, this.settings.historyRetention); saveHistory(this.archive, this.settings.historyRetention);
    const record = this.archive.worlds.at(-1); this.historyPlayback.save(record && { id: record.id, seed: record.seed, completedAt: next.runs });
    ui.showResult(this.el, score, { ...result, adaptationOffers: result.offers }); this.resize(false);
    if (this.settings.autoContinue) { startContinuation(this.continuation, performance.now()); this.updateContinuation(); }
  }
  enterMemory() { this.closeActiveOverlay(); this.adaptationEffects.clear(); cancelContinuation(this.continuation); this.el.countdown.textContent = ''; this.flow.send('memory'); this.selectedNode = null;
    this.memorySnapshot = buildMemorySnapshot(this.topo, this.meta); if (this.memorySnapshot.focus) focusCamera(this.camera, this.memorySnapshot.focus);
    ui.showMemory(this.el, this.meta, this.availableMemory()); this.resize(false); }
  selectMemoryNode(id) { const node = getMemoryNode(id); if (!node) return; this.closeActiveOverlay(); this.selectedNode = node.cell;
    focusCamera(this.camera, this.topo.positions.subarray(node.cell * 3, node.cell * 3 + 3)); interruptCameraPolicy(this.cameraPolicy, performance.now(), 60_000);
    this.memorySnapshot = buildMemorySnapshot(this.topo, this.meta, id); this.memoryUi.openNode(node, this.meta); this.overlay = 'memory-node';
    this.surfaces.open('memory-node', this.memoryUi.panel, document.getElementById('memory-node-heading')); this.resize(true); }
  closeMemoryNode() { this.memoryUi.closeNode(); this.surfaces.close('memory-node'); if (this.overlay === 'memory-node') this.overlay = null; this.selectedNode = null;
    this.memorySnapshot = buildMemorySnapshot(this.topo, this.meta); this.resize(true); interruptCameraPolicy(this.cameraPolicy, performance.now()); }
  buyMemory(id) { const purchase = purchaseMemory(this.meta, id); if (!purchase.ok) return; if (!saveMeta(purchase.meta)) return ui.announce(this.el, 'That Memory could not be stored; no Echoes were spent.');
    this.meta = purchase.meta; this.archive = appendMemoryEvent(this.archive, id, purchase.spent, this.meta.echoBalance, this.meta.runs); saveHistory(this.archive, this.settings.historyRetention);
    this.memorySnapshot = buildMemorySnapshot(this.topo, this.meta, id); this.memoryUi.refresh(this.meta);
    ui.showMemory(this.el, this.meta, this.availableMemory()); ui.toast(this.el, `${purchase.node.nameEn} joined Memory.`); }
  openAdaptations() { if (this.state !== 'running') return; this.openFull('adaptations'); this.adapt.open(this.adaptationModel());
    this.activateSurface('adaptations', this.adapt.surface, 'adaptations-heading'); }
  openHistory(scope = null) { this.historyPlayback.open(scope ?? (this.state === 'title' || this.state === 'memory' ? 'past' : 'current')); }
  openSettings() { this.openFull('settings'); this.settingsUi.open(this.state === 'running'); this.activateSurface('settings', this.settingsUi.surface, 'settings-heading'); }
  openMemoryList() { if (this.state !== 'memory') return; this.openFull('memory-list'); this.memoryUi.openList(this.meta);
    this.activateSurface('memory-list', this.memoryUi.listSurface, 'memory-list-heading'); }
  openResultDetails() { if (this.state !== 'result') return; this.openFull('result-details');
    this.activateSurface('result-details', document.getElementById('result-details'), 'result-details-heading'); }
  openFull(name) { this.closeActiveOverlay(); this.overlay = name; this.pause.set('panel', this.state === 'running' && this.settings.pauseOnPanels); this.pauseContinuation('surface', true); }
  activateSurface(name, element, heading) { this.surfaces.open(name, element, document.getElementById(heading)); this.resize(true); }
  panelClosed(name) { if (this.overlay === name) this.closeActiveOverlay(); }
  closeActiveOverlay() { const name = this.overlay; if (!name) return;
    if (name === 'inspector') this.inspector.close(); else if (name === 'memory-node') this.memoryUi.closeNode();
    else if (name === 'adaptations') this.adapt.close(); else if (name === 'history') { this.historyPlayback.close(); this.historyUi.close(); }
    else if (name === 'settings') this.settingsUi.close(); else if (name === 'memory-list') this.memoryUi.closeList();
    this.surfaces.close(name); this.overlay = null; this.pause.set('panel', false); this.pauseContinuation('surface', false);
    if (name === 'inspector' || name === 'memory-node') this.selectedNode = null; this.resize(true);
  }
  applySettings(value) { const before = this.settings; this.settings = value; saveSettings(value); applySettingsToDocument(value);
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
    else if (action === 'reset-progress' && confirm('Reset Echoes, Memory, and Imprints? This cannot be undone.')) { this.meta = defaultMeta(); saveMeta(this.meta); ui.announce(this.el, 'Progression was reset.'); }
    else if (action === 'import') { const data = parseImportedData(value); this.meta = data.meta; this.archive = data.history; this.applySettings(data.settings);
      saveMeta(this.meta); saveHistory(this.archive, this.settings.historyRetention); ui.announce(this.el, 'Local data was imported.'); }
    else if (action === 'import-error') throw new Error('invalid import');
  } catch { ui.announce(this.el, 'That local-data action could not be completed.'); } }
  availableMemory() { return this.memorySnapshot?.nodeStates?.filter((node) => node.reachable && !node.owned).length ?? 0; }
  pauseContinuation(reason, paused) { setContinuationPause(this.continuation, reason, paused, performance.now()); this.updateContinuation(); }
  updateContinuation() { const label = continuationLabel(this.continuation); if (label === this.countdownLabel) return;
    this.countdownLabel = label; this.el.countdown.textContent = label; }
  resize(preserveZoom = true) { const layout = safeLayout(this.canvas.clientWidth, this.canvas.clientHeight, this.state, this.surfaces.bounds());
    applySafeLayout(this.camera, layout, preserveZoom); this.renderer?.resize(this.canvas.clientWidth, this.canvas.clientHeight, qualityDpr(this.settings, this.caps)); }
  frame(now) { const dt = Math.min(100, now - this.last); this.last = now; this.driver.frame(dt, now);
    if (this.state === 'title') this.attract?.update(now, this.settings.motion === 'reduced');
    const active = this.input?.isActive(); if (!active && this.selectedNode == null && this.settings.cameraInertia) applyInertia(this.camera);
    applyAutoRotation(this.camera, this.settings, this.cameraPolicy, { active, selected: this.selectedNode != null,
      overlay: Boolean(this.overlay), hidden: document.hidden }, now, dt);
    if (this.state === 'result' && advanceContinuation(this.continuation, now)) { this.startRun(); return; }
    if (this.state === 'result') this.updateContinuation();
    if (this.inspector?.node != null && (this.state === 'running' || this.state === 'result') && now - this.lastInspect > 333) this.requestInspection();
    const snap = this.historySnapshot ?? (this.state === 'title' ? this.attract?.snapshot : this.state === 'memory' ? this.memorySnapshot : this.snapshot);
    const cadence = this.speed >= 16 ? 66 : 0;
    if (!cadence || now - this.lastRender >= cadence) { this.renderer.render({ snapshot: snap ?? null, camera: this.camera, selectedNode: this.selectedNode,
      adaptation: this.adaptationEffects.frame(now), highlightedCells: this.historyHighlights,
      time: now / 1000, pulse: this.settings.motion !== 'reduced' }); this.lastRender = now; }
    requestAnimationFrame((time) => this.frame(time)); }
}
function openingDirection(fields, topo) { const cell = fields.landmarks.find((mark) => mark.kind === 2)?.cell ?? fields.sources[0]; return topo.positions.subarray(cell * 3, cell * 3 + 3); }
