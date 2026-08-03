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
import { clearHistory, loadHistory, normalizeHistoryEvents, parseHistory, saveHistory, serializeHistory } from '../platform/history.js';
import { applySettingsToDocument, saveSettings } from '../platform/settings.js';
import { createAppState } from './app-state.js';
import { createRunDriver } from './run-driver.js';
import { handleRunMessage } from './app-message.js'; import { createAdaptationEffects } from './policies/adaptation-effects.js';
import { createPauseControl, pauseLabel } from './pause-control.js';
import { applyAutoRotation, createCameraPolicy, interruptCameraPolicy } from './camera-policy.js';
import { createSurfaceCoordinator } from './policies/surface-coordinator.js';
import { applySafeLayout, safeLayout } from './policies/layout-policy.js'; import { createTimeDial } from './policies/time-dial.js';
import { advanceContinuation, cancelContinuation, completeContinuation, continuationLabel, createContinuation,
  createContinuationInteractionGuard, setContinuationHidden } from './policies/continuation.js';
import { sameWorldIdentity } from '../core/world-session.js';
import { createWorldReplacementState, finishAbandoned, finishRun, requestWorldReplacement, startRun } from './policies/run-session.js';
import { createNewWorldSurface } from './policies/new-world-surface.js'; import { createHistorySurface } from './history-surface.js'; import { createHistoryPlayback } from './history-playback.js';
import { createInspectorSurface } from './inspection/inspector-surface.js'; import { createReachBalanceSurface } from './inspection/reach-surface.js';
import { createAdaptationSurface, createMemorySurface } from './panel-surfaces.js';
import { createTrophySurface } from './policies/trophy-surface.js';
import { availableSkills, buySkill, closeSkill, closeTrophy, enterEvolution, enterTrophies, focusAvailableSkill,
  focusTrophy, initializeProgression, progressionTap, reconcileBeforeHistoryClear, selectSkill, selectTrophy } from './policies/progression-spheres.js';
import { createSettingsSurface } from './settings-surface.js';
import { downloadData, parseImportedData, qualityDpr } from './app-data.js';
import * as ui from './surfaces.js';
const TITLE_SEED = TITLE_SHOWCASE.seed;
export function startGameApp(options) { const app = new GameApp(options); app.boot(); return app; }
class GameApp {
  constructor({ canvas, caps, settings }) {
    Object.assign(this, { canvas, caps, settings }); this.el = ui.elements(); this.topo4 = createTopology(4); this.topo = this.topo4; initializeProgression(this);
    this.adaptationEffects = createAdaptationEffects(this.topo4, this.el.adaptationCaption); this.camera = createCamera(); this.meta = loadMeta(); this.archive = loadHistory(settings.historyRetention);
    this.flow = createAppState(); this.speed = settings.speed; this.snapshot = null; this.selectedNode = null;
    this.renderer = null; this.fields = null; this.worldFields = null; this.showcase = null; this.overlay = null;
    this.offers = []; this.cards = []; this.currentHistory = []; this.lastResult = null; this.lastResultIdentity = null; this.resultKeys = new Set(); this.requestId = 0; this.requestGeneration = 0;
    this.runSeed = null; this.activeRunId = 0; this.worldIdentity = null; this.retiredWorldIdentity = null;
    this.worldSessionSequence = 0; this.presentationGeneration = 0; this.worldReplacement = createWorldReplacementState();
    this.visualSeed = null; this.historySnapshot = null; this.historyHighlights = [];
    this.last = performance.now(); this.lastRender = 0; this.lastInspect = 0; this.cameraPolicy = createCameraPolicy(this.last); this.layoutClass = null; this.effectivePaused = false;
    this.presentationAudit = { blankFrames: 0, lastBlank: null }; this.frameAudit = { frames: 0, scheduled: 0, errors: 0, lastError: null };
    this.driver = createRunDriver(caps, (message) => this.message(message)); this.pause = createPauseControl((paused, reasons) => this.applyPause(paused, reasons));
    this.continuation = createContinuation(); this.countdownLabel = '';
    this.interactionGuard = createContinuationInteractionGuard(document, (type) => this.cancelAutoNext(type));
    this.surfaces = createSurfaceCoordinator(() => this.closeActiveOverlay(), (focus) => this.interactionGuard.runProgrammaticFocus(focus));
    this.historyPlayback = createHistoryPlayback(this); this.timeDial = createTimeDial(this.el.pause);
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
    this.inspector = createInspectorSurface({ onClose: () => this.closeInspector(), onHistory: () => this.openHistory('current') }); this.reachUi = createReachBalanceSurface({ onClose: () => this.panelClosed('reach-balance'), onSelect: (cells) => { this.historyHighlights = cells; ui.announce(this.el, `${cells.length} recent Reach cells highlighted.`); } });
    this.historyUi = createHistorySurface({ onClose: () => this.panelClosed('history'),
      onWorld: (world) => this.historyPlayback.selectWorld(world), onSeek: (tick, event, world) => this.historyPlayback.seek(tick, event, world),
      onLive: () => this.historyPlayback.live() });
    this.memoryUi = createMemorySurface({ onCloseNode: () => this.closeMemoryNode(), onUnlock: (id) => this.buyMemory(id), onSelect: (id) => this.selectMemoryNode(id) });
    this.trophyUi = createTrophySurface({ onClose: () => this.closeTrophy(), onSelect: (id) => this.selectTrophy(id) });
    this.newWorld = createNewWorldSurface({ onClose: () => this.panelClosed('new-world'), onConfirm: () => this.confirmNewWorld() });
    this.settingsUi = createSettingsSurface({ read: () => this.settings, onChange: (value) => this.applySettings(value), onClose: () => this.panelClosed('settings'), onAction: (action, value) => this.settingsAction(action, value) });
  }
  makeRenderer(seed, mode = 'world', identity = null) {
    this.visualSeed = seed; this.topo = mode === 'memory' ? this.topo3 : mode === 'trophies' ? this.topo2 : this.topo4;
    if (mode === 'memory') this.fields = this.atlasFields; else if (mode === 'trophies') this.fields = this.trophyFields;
    else { this.worldFields = createFields(createRng(seed ^ 0x51ab3d71), this.topo4); this.fields = this.worldFields; }
    const binding = identity ?? (mode === 'world' && this.worldIdentity?.seed === seed ? this.worldIdentity : null);
    this.renderer?.dispose(); this.renderer = null;
    const fallback = () => { this.renderer?.dispose(); const next = new Canvas2DRenderer(this.canvas, this.topo, this.fields);
      next.bindWorldSession(binding); this.renderer = next; ui.announce(this.el, 'WebGL was lost. The observational Canvas renderer is continuing.'); };
    try { const next = new GLRenderer(this.canvas, this.topo, this.fields, { onContextLoss: fallback });
      next.bindWorldSession(binding); this.renderer = next; }
    catch (error) { console.warn('WebGL2 unavailable; Canvas 2D active', error); fallback(); }
  } bindUi() {
    this.el.begin.addEventListener('click', () => this.requestWorldReplacement('title-grow'));
    this.el.restart.addEventListener('click', () => this.requestWorldReplacement('evolution-restart'));
    this.el.resultNext.addEventListener('click', () => this.requestWorldReplacement('manual-next', this.lastResultIdentity));
    this.el.memoryButton.addEventListener('click', () => this.enterMemory());
    document.querySelectorAll('.trophy-open').forEach((button) => button.addEventListener('click', () => this.enterTrophies()));
    document.getElementById('trophy-next-button')?.addEventListener('click', () => this.requestWorldReplacement('trophy-restart'));
    document.getElementById('trophy-evolution-button')?.addEventListener('click', () => this.enterMemory());
    document.getElementById('trophy-focus')?.addEventListener('click', () => this.focusTrophy());
    this.el.pause.addEventListener('click', () => this.pause.set('manual', !this.pause.has('manual')));
    this.el.speed.addEventListener('change', () => this.setSpeed(Number(this.el.speed.value))); this.el.adaptationButton.addEventListener('click', () => this.openAdaptations());
    document.getElementById('new-world-button')?.addEventListener('click', () => this.openNewWorld());
    document.getElementById('evolution-focus-available')?.addEventListener('click', () => this.focusAvailableSkill());
    document.querySelectorAll('.settings-open').forEach((button) => button.addEventListener('click', () => this.openSettings()));
    document.querySelectorAll('.history-open').forEach((button) => button.addEventListener('click', () => this.openHistory()));
    this.el.resultHistory.addEventListener('click', () => this.openHistory('current')); this.el.resultDetails.addEventListener('click', () => this.openResultDetails()); this.el.reachButton.addEventListener('click', () => this.openReachBalance()); this.el.resultReach.addEventListener('click', () => this.openReachBalance());
    document.getElementById('result-details-close')?.addEventListener('click', () => this.panelClosed('result-details'));
    document.addEventListener('keydown', (event) => { if ((event.metaKey || event.ctrlKey) && event.key === ',') { event.preventDefault(); this.openSettings(); }
      else if (event.key === 'Home' && this.state === 'memory') { event.preventDefault(); this.focusAvailableSkill(); }
      else if (event.key === 'Home' && this.state === 'trophies') { event.preventDefault(); this.focusTrophy(); } });
  }
  bindCanvas() { const interrupt = () => interruptCameraPolicy(this.cameraPolicy, performance.now());
    this.input = bindGlobeInput(this.canvas, this.camera, { canInteract: () => ['title', 'running', 'result', 'memory', 'trophies'].includes(this.state),
      onTap: (x, y) => this.tapGlobe(x, y), onInterrupt: interrupt, onInteractionStart: interrupt,
      onInteractionEnd: () => interruptCameraPolicy(this.cameraPolicy, performance.now()) }); }
  bindLifecycle() {
    const resize = () => this.resize(true);
    if (typeof ResizeObserver === 'function') new ResizeObserver(resize).observe(this.canvas); else addEventListener('resize', resize);
    document.addEventListener('visibilitychange', () => { this.pause.set('hidden', document.hidden && ['starting', 'running'].includes(this.state));
      setContinuationHidden(this.continuation, document.hidden, performance.now()); this.updateContinuation(); });
  }
  tapGlobe(x, y) {
    const hit = pickNode(this.canvas, x, y, this.camera, this.topo); if (!hit) return;
    if (progressionTap(this, hit.node)) return; this.selectCell(hit.node);
  }
  selectCell(node, context = null) {
    this.closeActiveOverlay(); this.selectedNode = node; interruptCameraPolicy(this.cameraPolicy, performance.now(), 60_000);
    const events = this.currentHistory.filter((event) => event.primaryCells.includes(node)); this.inspector.open({ node, world: this.fields, topo: this.topo, dynamic: null, events, context });
    this.overlay = 'inspector'; this.surfaces.open('inspector', this.inspector.panel, document.getElementById('inspector-heading')); this.resize(true);
    if (this.state === 'running' || this.state === 'result') this.requestInspection();
  }
  requestInspection() { if (this.selectedNode == null || !this.worldIdentity) return; this.driver.message({ t: 'inspect-cell',
    requestId: ++this.requestId, requestGeneration: this.requestGeneration, node: this.selectedNode }); this.lastInspect = performance.now(); }
  closeInspector() { this.inspector.close(); this.surfaces.close('inspector'); if (this.overlay === 'inspector') this.overlay = null;
    this.selectedNode = null; this.resize(true); interruptCameraPolicy(this.cameraPolicy, performance.now()); }
  requestWorldReplacement(reason, expected = null) { return requestWorldReplacement(this, reason, expected); }
  startRun(reason = null) { return startRun(this, reason); }
  message(message) { if (!sameWorldIdentity(message, this.worldIdentity)) return false;
    if (!this.historyPlayback.handle(message)) return handleRunMessage(this, message); return true; }
  mergeHistory(events) { const bySeq = new Map(this.currentHistory.map((event) => [event.seq, event]));
    for (const event of normalizeHistoryEvents(events)) bySeq.set(event.seq, event); this.currentHistory = [...bySeq.values()].sort((a, b) => a.seq - b.seq); }
  adaptationModel() { return { offers: this.offers, cards: this.cards, mode: this.settings.adaptationMode, tick: this.snapshot?.tick ?? 0 }; }
  pendingCount() { return this.offers.filter((offer) => offer.resolvedTick == null).length; }
  choose(offer, cardId) { return this.driver.chooseAdaptation(offer, cardId); }
  setSpeed(value) { this.speed = value; this.settings = { ...this.settings, speed: value }; saveSettings(this.settings); this.driver.setSpeed(value); }
  applyPause(paused, reasons = this.pause.values()) { if (paused !== this.effectivePaused) { this.effectivePaused = paused; this.driver.setPaused(paused); } this.timeDial.reset(performance.now());
    this.el.pause.setAttribute('aria-pressed', String(reasons.has('manual'))); this.el.pause.classList.toggle('is-paused', paused);
    this.el.pause.dataset.action = paused && reasons.size === 1 && reasons.has('manual') ? 'recommended' : 'normal'; this.el.pause.setAttribute('aria-label', pauseLabel(reasons)); }
  finishRun(result) { finishRun(this, result); }
  finishAbandoned(summary) { finishAbandoned(this, summary); }
  failRun(message) { this.pause.set('worker-failed', true); ui.announce(this.el, `${message} Start a new world to continue.`); }
  enterMemory() { enterEvolution(this); } enterTrophies() { enterTrophies(this); }
  selectMemoryNode(id) { selectSkill(this, id); } closeMemoryNode() { closeSkill(this); } buyMemory(id) { buySkill(this, id); }
  selectTrophy(id) { selectTrophy(this, id); } closeTrophy() { closeTrophy(this); } focusTrophy() { focusTrophy(this); }
  openAdaptations() { if (this.state !== 'running' || this.surfaces.toggle('adaptations')) return; this.openFull('adaptations'); this.adapt.open(this.adaptationModel());
    this.activateSurface('adaptations', this.adapt.surface, 'adaptations-heading'); }
  openHistory(scope = null) { if (this.surfaces.toggle('history')) return;
    this.historyPlayback.open(scope ?? (['title', 'memory', 'trophies'].includes(this.state) ? 'past' : 'current'));  }
  openSettings() { if (this.surfaces.toggle('settings')) return; this.openFull('settings'); this.settingsUi.open(this.state === 'running'); this.activateSurface('settings', this.settingsUi.surface, 'settings-heading'); }
  openResultDetails() { if (this.state !== 'result' || this.surfaces.toggle('result-details')) return; this.openFull('result-details');
    this.activateSurface('result-details', document.getElementById('result-details'), 'result-details-heading'); }
  openReachBalance() { if (!['running', 'result'].includes(this.state) || this.surfaces.toggle('reach-balance')) return; const result = this.state === 'result'; const data = result ? this.lastResult?.reach : this.snapshot?.reach; if (!data) return; this.openFull('reach-balance'); this.reachUi.open(data, result); this.activateSurface('reach-balance', this.reachUi.surface, 'reach-balance-heading'); }
  openNewWorld() { if (this.state !== 'running' || this.surfaces.toggle('new-world')) return; this.openFull('new-world');
    this.pause.set('new-world', true); this.newWorld.open(this.snapshot); this.activateSurface('new-world', this.newWorld.surface, 'new-world-heading'); }
  confirmNewWorld() { return this.requestWorldReplacement('confirmed-new-world', this.worldIdentity); }
  focusAvailableSkill() { focusAvailableSkill(this); }
  openFull(name) { this.closeActiveOverlay(); this.overlay = name; this.pause.set('panel', this.state === 'running' && this.settings.pauseOnPanels); }
  activateSurface(name, element, heading) { this.surfaces.open(name, element, document.getElementById(heading)); this.resize(true); }
  panelClosed(name) { if (this.overlay === name) this.closeActiveOverlay(); }
  closeActiveOverlay() { const name = this.overlay; if (!name) return;
    if (name === 'memory-node') return closeSkill(this); if (name === 'trophy-detail') return closeTrophy(this);
    if (name === 'inspector') this.inspector.close();
    else if (name === 'adaptations') this.adapt.close(); else if (name === 'history') { this.historyPlayback.close(); this.historyUi.close(); }
    else if (name === 'settings') this.settingsUi.close(); else if (name === 'new-world') this.newWorld.close(); else if (name === 'reach-balance') { this.reachUi.close(); this.historyHighlights = []; }
    this.surfaces.close(name); this.overlay = null; this.pause.set('panel', false); this.pause.set('new-world', false);
    if (name === 'inspector') this.selectedNode = null; this.resize(true);
  }
  applyAdaptationMode(mode) { if (this.state === 'running') return this.driver.setAdaptationMode(mode); this.applySettings({ ...this.settings, adaptationMode: mode }); return null; }
  applySettings(value) { const before = this.settings; const modeChange = this.state === 'running' && value.adaptationMode !== before.adaptationMode;
    this.settings = modeChange ? { ...value, adaptationMode: before.adaptationMode } : value; saveSettings(this.settings); applySettingsToDocument(this.settings); ui.updateAdaptationMode(this.el, this.settings.adaptationMode);
    if (value.speed !== this.speed) { this.speed = value.speed; this.el.speed.value = String(value.speed); this.driver.setSpeed(value.speed); }
    if (modeChange) this.adapt.pendingMode(value.adaptationMode, this.driver.setAdaptationMode(value.adaptationMode));
    if (this.overlay && value.pauseOnPanels !== before.pauseOnPanels) this.pause.set('panel', this.state === 'running' && value.pauseOnPanels);
    if (this.state === 'result' && value.autoContinue !== before.autoContinue && !value.autoContinue) {
      cancelContinuation(this.continuation, 'setting-disabled'); this.updateContinuation(); }
    this.resize(true); interruptCameraPolicy(this.cameraPolicy, performance.now()); }
  settingsAction(action, value) { try {
    if (action === 'camera-reset') { Object.assign(this.camera, createCamera()); this.selectedNode = null; }
    else if (action === 'export') downloadData(this.meta, this.archive, this.settings);
    else if (action === 'clear-history' && confirm('Clear all preserved History?')) { const trophies = reconcileBeforeHistoryClear(this); this.archive = clearHistory(); saveHistory(this.archive); this.historyPlayback.clear(); ui.announce(this.el, `History was cleared.${trophies.length ? ` ${trophies.length} proven trophies were preserved.` : ''}`); }
    else if (action === 'reset-progress' && confirm('Reset Echoes, Evolution Globe skills, and Imprints? This cannot be undone.')) { this.meta = defaultMeta(); saveMeta(this.meta); ui.announce(this.el, 'Progression was reset.'); }
    else if (action === 'import') { const data = parseImportedData(value); this.meta = data.meta; this.archive = data.history; this.applySettings(data.settings);
      saveMeta(this.meta); saveHistory(this.archive, this.settings.historyRetention); ui.announce(this.el, 'Local data was imported.'); }
    else if (action === 'import-error') throw new Error('invalid import');
  } catch { ui.announce(this.el, 'That local-data action could not be completed.'); } }
  availableMemory() { return availableSkills(this); }
  worldResourceAudit() { return Object.freeze({ interactionListeners: this.interactionGuard.listenerCount,
    historyRequests: this.historyPlayback.pendingRequests, adaptationEffects: this.adaptationEffects.queueLength,
    adaptationBytes: this.adaptationEffects.retainedBytes, adaptationTimers: this.adaptationEffects.pendingCount }); }
  cancelAutoNext(reason) { if (this.state !== 'result') return false;
    const cancelled = cancelContinuation(this.continuation, reason); if (cancelled) this.updateContinuation(); return cancelled; }
  updateContinuation() { const label = continuationLabel(this.continuation); if (label === this.countdownLabel) return; this.countdownLabel = label; this.el.countdown.textContent = label; }
  resize(preserveZoom = true) { const cls = this.canvas.clientWidth < 600 ? 'compact' : this.canvas.clientWidth < 900 ? 'tablet' : 'wide'; const layout = safeLayout(this.canvas.clientWidth, this.canvas.clientHeight, this.state); preserveZoom &&= cls === this.layoutClass; this.layoutClass = cls;
    applySafeLayout(this.camera, layout, preserveZoom); this.renderer?.resize(this.canvas.clientWidth, this.canvas.clientHeight, qualityDpr(this.settings, this.caps)); }
  frame(now) { this.frameAudit.frames++;
    try { this.frameStep(now); } catch (error) { this.frameAudit.errors++; this.frameAudit.lastError = error.message; console.error('frame recovered', error); }
    finally { this.frameAudit.scheduled++; this.rafId = requestAnimationFrame((time) => this.frame(time)); }
  }
  frameStep(now) { const dt = Math.min(100, now - this.last); this.last = now;
    this.timeDial.frame(now, { running: this.state === 'running', paused: this.pause.paused, speed: this.speed, reduced: this.settings.motion === 'reduced' }); this.driver.frame(dt, now);
    if (this.state === 'title') this.showcase?.update(now, this.settings.motion === 'reduced', document.hidden);
    const active = this.input?.isActive(); if (!active && this.selectedNode == null && this.settings.cameraInertia) applyInertia(this.camera);
    applyAutoRotation(this.camera, this.settings, this.cameraPolicy, { active, selected: this.selectedNode != null,
      overlay: Boolean(this.overlay), hidden: document.hidden }, now, dt);
    if (this.state === 'result' && advanceContinuation(this.continuation, now)) {
      const expected = this.lastResultIdentity; const valid = sameWorldIdentity(expected, this.worldIdentity)
        && this.continuation.resultKey === expected?.resultTransactionKey && this.resultKeys.has(this.continuation.resultKey);
      if (valid) { const generation = this.continuation.generation; completeContinuation(this.continuation, generation);
        this.requestWorldReplacement('auto-next', expected); } else cancelContinuation(this.continuation, 'stale-result');
    }
    if (this.state === 'result') this.updateContinuation();
    if (this.inspector?.node != null && (this.state === 'running' || this.state === 'result') && now - this.lastInspect > 333) this.requestInspection();
    const snap = this.historySnapshot ?? (this.state === 'title' ? this.showcase?.snapshot : this.state === 'memory' ? this.memorySnapshot : this.state === 'trophies' ? this.trophySnapshot : this.snapshot);
    const cadence = this.speed >= 16 ? 66 : 0;
    if (!cadence || now - this.lastRender >= cadence) { this.renderer.render({ snapshot: snap ?? null, worldIdentity: this.worldIdentity,
      camera: this.camera, selectedNode: this.selectedNode, adaptation: this.adaptationEffects.frame(now),
      highlightedCells: this.historyHighlights, time: now / 1000, pulse: this.settings.motion !== 'reduced' }); this.lastRender = now; }
  }
}
