import { createRng } from '../core/prng.js';
import { createTopology } from '../world/icosphere.js';
import { createFields } from '../world/fields.js';
import { GLRenderer } from '../rendering/renderer.js';
import { Canvas2DRenderer } from '../rendering/fallback2d.js';
import { TitleShowcase, TITLE_SHOWCASE } from '../showcase/player.js';
import { createCamera, focusCamera as orientCamera } from '../rendering/camera.js';
import { pickNode } from '../rendering/picking.js';
import { bindGlobeInput } from './globe-input.js';
import { loadMeta, saveMeta, defaultMeta } from '../platform/storage.js';
import { clearHistory, loadHistory, normalizeHistoryEvents, parseHistory, saveHistory, serializeHistory } from '../platform/history.js';
import { applySettingsToDocument, saveSettings, validateSettings } from '../platform/settings.js';
import { recoverRunTransaction } from '../platform/run-transaction-store.js';
import { createAppState } from './app-state.js';
import { createRunDriver } from './run-driver.js';
import { handleRunMessage } from './app-message.js';
import { createPauseControl, pauseLabel } from './pause-control.js';
import { createSurfaceCoordinator } from './policies/surface-coordinator.js';
import { applySafeLayout, safeLayout } from './policies/layout-policy.js'; import { createTimeDial } from './policies/time-dial.js';
import { advanceContinuation, cancelContinuation, completeContinuation, continuationPresentation,
  createContinuation, createContinuationPresentationCadence, disableContinuation,
  planContinuationPresentation, setContinuationHidden } from './policies/continuation.js';
import { createTrustedInteractionGuard } from './policies/trusted-interaction.js';
import { advanceCameraMotion, beginCameraDrag, cameraMotionActivity, cameraMotionSnapshot, createCameraMotion,
  endCameraDrag, recordCameraDrag, resetCameraMotion, setCameraMotionHidden, setCameraMotionReduced,
  setCameraMotionScene, setCameraMotionSurface } from './policies/camera-motion.js';
import { sameWorldIdentity } from '../core/world-session.js';
import { effectiveGameRateForSpeed, isStandardSpeed, renderIntervalForSpeed, validateRuntimeSpeed } from '../core/runtime-speed.js';
import { createWorldReplacementState, finishAbandoned, finishRun, requestWorldReplacement,
  startRun } from './policies/run-session.js';
import { createNewWorldSurface } from './policies/new-world-surface.js'; import { createHistorySurface } from './history-surface.js'; import { createHistoryPlayback } from './history-playback.js';
import { createInspectorSurface } from './inspection/inspector-surface.js';
import { createMemorySurface } from './panel-surfaces.js';
import { createMetricSurface } from './inspection/metric-surface.js';
import { createSceneSelector } from './policies/scene-selector.js';
import { createTrophySurface } from './policies/trophy-surface.js';
import { buildTrophySnapshot } from '../game/trophies/scene.js';
import { createTrophyNotifications } from './policies/trophy-notifications.js';
import {availableEvolutionLevels,buyEvolutionLevel,closeEvolutionCell,closeTrophy,enterEvolution,enterTrophies,
  initializeProgression,presentEvolution,presentTrophies,progressionTap,reconcileBeforeHistoryClear,selectEvolutionCell,selectTrophy} from './policies/progression-spheres.js';
import { createSettingsSurface } from './settings-surface.js';
import { downloadData, parseImportedData, qualityDpr } from './app-data.js';
import { saveImportedNamespace } from '../platform/namespace.js';
import { DIAGNOSTIC_GLOBALS, PAGES_URL, PRODUCT, REPOSITORY, STORAGE_KEYS, TAGLINE, VERSION } from '../core/identity.js';
import * as ui from './surfaces.js';
const TITLE_SEED = TITLE_SHOWCASE.seed;
export function startGameApp(options) { const app = new GameApp(options); app.boot(); return app; }
class GameApp {
  constructor({ canvas, caps, settings, storageStatus = null, developerMode = false }) {
    Object.assign(this, { canvas, caps, settings, storageStatus, developerMode }); this.el = ui.elements(); this.topo4 = createTopology(4); this.topo = this.topo4; initializeProgression(this);
    this.camera = createCamera(); this.cameraMotion = createCameraMotion({ now: performance.now(), scene: 'home',
      reduced: settings.motion === 'reduced', hidden: document.hidden }); this.runTransactionRecovery = recoverRunTransaction();
    this.meta = this.runTransactionRecovery?.meta ?? loadMeta(); this.archive = this.runTransactionRecovery?.history ?? loadHistory();
    this.resultKeys = new Set(this.meta.resultKeys); this.flow = createAppState();
    this.speed = validateRuntimeSpeed(settings.speed, { developerMode, fallback: 1 }); this.snapshot = null; this.selectedNode = null;
    this.renderer = null; this.fields = null; this.worldFields = null; this.showcase = null; this.overlay = null; this.cameraByScene = new Map();
    this.currentHistory = []; this.lastResult = null; this.lastScore = null; this.lastResultIdentity = null; this.requestId = 0; this.requestGeneration = 0;
    this.runSeed = null; this.activeRunId = 0; this.worldIdentity = null; this.retiredWorldIdentity = null;
    this.worldSessionSequence = 0; this.presentationGeneration = 0; this.worldReplacement = createWorldReplacementState();
    this.visualSeed = null; this.historySnapshot = null; this.historyHighlights = []; this.historyPlaybackActive = false;
    this.last = performance.now(); this.lastRender = 0; this.lastInspect = 0; this.layoutClass = null; this.effectivePaused = false;
    this.presentationAudit = { blankFrames: 0, lastBlank: null }; this.frameAudit = { frames: 0, scheduled: 0, errors: 0, lastError: null };
    this.driver = createRunDriver(caps, (message) => this.message(message), { developerMode }); this.pause = createPauseControl((paused, reasons) => this.applyPause(paused, reasons));
    this.continuation = createContinuation(); this.continuationStatus = 'inactive';
    this.continuationCadence = createContinuationPresentationCadence();
    this.continuationAudit = { styleUpdates: 0, visibleTextUpdates: 0, accessibleTextUpdates: 0 };
    this.interactionGuard = createTrustedInteractionGuard(document, (type, event) => this.handleTrustedInteraction(type, event));
    this.surfaces = createSurfaceCoordinator(() => this.closeActiveOverlay(),
      (focus) => this.interactionGuard.runProgrammaticFocus(focus),
      (active) => setCameraMotionSurface(this.cameraMotion, Boolean(active), performance.now()));
    this.historyPlayback = createHistoryPlayback(this); this.timeDial = createTimeDial(this.el.pause);
  }
  get phase() { return this.flow.phase; } get scene() { return this.flow.scene; }
  get state() { return this.flow.phase; } boot() {
    this.makeRenderer(TITLE_SEED); this.focusCamera(
      this.topo.positions.subarray(TITLE_SHOWCASE.focusCell * 3, TITLE_SHOWCASE.focusCell * 3 + 3)); this.resize(false);
    this.showcase = new TitleShowcase(this.topo);
    this.makeSurfaces(); this.bindUi(); this.bindCanvas(); this.bindLifecycle(); this.el.speed.value = String(this.speed);
    const temporary = (this.storageStatus && (!this.storageStatus.available || !this.storageStatus.complete))
      || (this.runTransactionRecovery && !this.runTransactionRecovery.persisted);
    this.el.boot.textContent = `Cells ready — ${this.renderer.backend === 'webgl2' ? 'WebGL2' : 'Canvas 2D'}${temporary ? ' · progress is temporary' : ''}`;
    ui.show(this.el, 'home'); this.sceneSelector.update('home');
    if (temporary) ui.announce(this.el, 'Browser storage is unavailable or recovery is incomplete; this session remains playable but changes may be temporary.');
    window[DIAGNOSTIC_GLOBALS.boot] = Object.freeze({ product: PRODUCT, tagline: TAGLINE, version: VERSION,
      repository: REPOSITORY, pages: PAGES_URL, storage: STORAGE_KEYS, storageStatus: this.storageStatus,
      renderer: this.renderer.backend, playable: true, developerMode: this.developerMode }); window[DIAGNOSTIC_GLOBALS.app] = this;
    requestAnimationFrame((now) => this.frame(now)); console.info(`boot ok: ${this.renderer.backend}; passive world ready`);
  } makeSurfaces() {
    this.sceneSelector = createSceneSelector({ onSelect: (scene) => this.selectScene(scene) });
    this.inspector = createInspectorSurface({ onClose: () => this.closeInspector(), onHistory: () => this.openHistory('current') });
    this.metricUi = createMetricSurface({ onClose: () => this.panelClosed('metric'), onSelect: (cells) => this.focusHistoryCells(cells) });
    this.historyUi = createHistorySurface({ onClose: () => this.panelClosed('history'),
      onWorld: (world) => this.historyPlayback.selectWorld(world), onSeek: (tick, event, world) => this.historyPlayback.seek(tick, event, world),
      onLive: () => this.historyPlayback.live() });
    this.memoryUi = createMemorySurface({ onCloseNode: () => this.closeEvolutionCell(), onUnlock: (id) => this.buyEvolutionLevel(id),
      onSelect: (id) => this.selectEvolutionCell(id), canUnlock: () => !['starting', 'running'].includes(this.phase) });
    this.trophyUi = createTrophySurface({ onClose: () => this.closeTrophy(), onSelect: (id) => this.selectTrophy(id) });
    this.trophyNotifications = createTrophyNotifications({ reduced: () => this.settings.motion === 'reduced',
      announce: (text) => { this.el.live.textContent = text; }, onSelect: (id) => { if (this.scene !== 'trophies') this.selectScene('trophies'); selectTrophy(this, id); },
      onAcknowledge: (id) => {
        this.meta = { ...this.meta, trophyQueue: (this.meta.trophyQueue ?? []).filter((entry) => entry !== id) };
        if (!saveMeta(this.meta)) ui.announce(this.el, 'Trophy feedback was acknowledged for this session, but storage could not save that acknowledgement.');
        if (this.scene === 'trophies') this.trophySnapshot = buildTrophySnapshot(this.topo2, this.meta, this.trophyUi.selectedId, this.meta.trophyQueue); } });
    this.trophyNotifications.sync(this.meta);
    this.newWorld = createNewWorldSurface({ onClose: () => this.panelClosed('new-world'), onConfirm: () => this.confirmNewWorld() });
    this.settingsUi = createSettingsSurface({ read: () => ({ ...this.settings, speed: this.speed }), onChange: (value) => this.applySettings(value), onClose: () => this.panelClosed('menu'), onAction: (action, value) => this.settingsAction(action, value) });
  }
  makeRenderer(seed, mode = 'world', identity = null) {
    this.visualSeed = seed; this.topo = mode === 'memory' ? this.topo3 : mode === 'trophies' ? this.topo2 : this.topo4;
    if (mode === 'memory') this.fields = this.atlasFields; else if (mode === 'trophies') this.fields = this.trophyFields;
    else { this.worldFields = createFields(createRng(seed ^ 0x51ab3d71), this.topo4); this.fields = this.worldFields; }
    const binding = identity ?? (mode === 'world' && this.worldIdentity?.seed === seed ? this.worldIdentity : null);
    this.renderer?.dispose(); this.renderer = null;
    const fallback = () => {
      if (this.renderer?.backend === 'canvas2d') return;
      this.renderer?.dispose(); this.renderer = null; let next;
      try { next = new Canvas2DRenderer(this.canvas, this.topo, this.fields, { developerMode: this.developerMode }); }
      catch (firstError) {
        this.replaceRenderCanvas();
        try { next = new Canvas2DRenderer(this.canvas, this.topo, this.fields, { developerMode: this.developerMode }); }
        catch { throw firstError; }
      }
      next.bindWorldSession(binding); this.renderer = next;
      ui.announce(this.el, 'WebGL was lost. The observational Canvas renderer is continuing.');
    };
    try { const next = new GLRenderer(this.canvas, this.topo, this.fields, { onContextLoss: fallback, developerMode: this.developerMode });
      next.bindWorldSession(binding); this.renderer = next; }
    catch (error) { console.warn('WebGL2 unavailable; Canvas 2D active', error); fallback(); }
  }
  replaceRenderCanvas() {
    const retired = this.canvas; const replacement = /** @type {HTMLCanvasElement} */ (retired.cloneNode(false));
    replacement.width = retired.width; replacement.height = retired.height; const hadInput = Boolean(this.input);
    this.input?.dispose(); this.input = null; retired.replaceWith(replacement); this.canvas = replacement;
    if (this.resizeObserver) { this.resizeObserver.disconnect(); this.resizeObserver.observe(replacement); }
    if (hadInput) this.bindCanvas(); return replacement;
  }
  bindUi() {
    this.el.begin.addEventListener('click', () => this.phase === 'idle' ? this.requestWorldReplacement('title-grow') : this.selectScene('world'));
    this.el.restart.addEventListener('click', () => ['idle', 'result'].includes(this.phase) ? this.requestWorldReplacement('evolution-restart', this.phase === 'result' ? this.lastResultIdentity : null) : this.selectScene('world'));
    this.el.resultNext.addEventListener('click', () => this.requestWorldReplacement('manual-next-world', this.lastResultIdentity));
    this.el.resultEvolution.addEventListener('click', () => this.openResultEvolution());
    document.getElementById('trophy-next-button')?.addEventListener('click', () => ['idle', 'result'].includes(this.phase) ? this.requestWorldReplacement('trophy-restart', this.phase === 'result' ? this.lastResultIdentity : null) : this.selectScene('world'));
    this.el.pause.addEventListener('click', () => { if (this.phase === 'running') this.pause.set('manual', !this.pause.has('manual')); });
    this.el.speed.addEventListener('change', () => this.setSpeed(Number(this.el.speed.value)));
    this.el.environmentButton.addEventListener('click', () => this.openMetric('environment'));
    document.querySelectorAll('.menu-open').forEach((button) => button.addEventListener('click', () => this.openMenu()));
    document.querySelectorAll('.history-open').forEach((button) => button.addEventListener('click', () => this.openHistory()));
    this.el.resultHistory.addEventListener('click', () => this.openHistory('current')); this.el.resultControl.addEventListener('click', () => this.openResult());
    document.getElementById('result-close')?.addEventListener('click', () => this.panelClosed('result'));
    for (const button of [this.el.scoreButton, this.el.reachButton]) button.addEventListener('click', () => this.openMetric(button.dataset.metric));
    document.addEventListener('keydown', (event) => { if ((event.metaKey || event.ctrlKey) && event.key === ',') { event.preventDefault(); this.openMenu(); } });
  }
  bindCanvas() { this.input = bindGlobeInput(this.canvas, this.camera, { canInteract: () => true,
    onTap: (x, y) => this.tapGlobe(x, y),
    onDirectStart: (now) => beginCameraDrag(this.cameraMotion, now),
    onDirectDelta: (dragX, dragY, now) => recordCameraDrag(this.cameraMotion, dragX, dragY, now),
    onDirectEnd: (inputNow, kind, observedNow) => endCameraDrag(this.cameraMotion, inputNow, kind, observedNow),
    onZoom: (now) => cameraMotionActivity(this.cameraMotion, now) }); }
  bindLifecycle() {
    const resize = () => this.resize(true);
    if (typeof ResizeObserver === 'function') { this.resizeObserver = new ResizeObserver(resize); this.resizeObserver.observe(this.canvas); }
    else addEventListener('resize', resize);
    document.addEventListener('visibilitychange', () => { const now = performance.now(); this.last = now;
      if (document.hidden) this.input?.reset();
      this.pause.set('hidden', document.hidden && ['starting', 'running'].includes(this.phase));
      setContinuationHidden(this.continuation, document.hidden, now); setCameraMotionHidden(this.cameraMotion, document.hidden, now);
      this.updateContinuation(now, true); });
  }
  tapGlobe(x, y) {
    const hit = pickNode(this.canvas, x, y, this.camera, this.topo); if (!hit) { this.surfaces.blankTap(); return; }
    if (progressionTap(this, hit.node)) return; this.selectCell(hit.node);
  }
  selectScene(next) {
    if (!['home', 'world', 'evolution', 'trophies'].includes(next)) return false;
    const previous = this.scene; if (previous === next) { ui.show(this.el, next); this.sceneSelector.update(next); return true; }
    this.input?.reset(); this.cameraByScene.set(previous, cloneCamera(this.camera)); this.closeActiveOverlay(); this.flow.select(next); const saved = this.cameraByScene.get(next);
    if (next === 'home') this.makeRenderer(TITLE_SEED);
    else if (next === 'world') this.makeRenderer(this.worldIdentity ? this.runSeed : TITLE_SEED, 'world', this.worldIdentity);
    else if (next === 'evolution') presentEvolution(this, Boolean(saved));
    else presentTrophies(this, Boolean(saved));
    if (saved) restoreCamera(this.camera, saved);
    setCameraMotionScene(this.cameraMotion, next, performance.now());
    ui.show(this.el, next); this.sceneSelector.update(next); this.updateSceneActions(); this.resize(Boolean(saved)); return true;
  }
  updateSceneActions() {
    this.el.begin.textContent = this.phase === 'idle' ? 'Grow a world' : 'Return to World';
    const terminal = this.phase === 'result'; this.el.restart.hidden = !terminal; this.el.restart.textContent = 'Next World';
    const trophyNext = document.getElementById('trophy-next-button'); if (trophyNext) { trophyNext.hidden = !terminal; trophyNext.textContent = 'Next World'; }
    const evolutionLine = document.getElementById('evolution-line'); if (evolutionLine) evolutionLine.textContent = ['starting', 'running'].includes(this.phase)
      ? 'Current world unchanged; Evolution upgrades begin next world.' : 'Shape what every future world inherits.';
  }
  selectCell(node, context = null) {
    this.closeActiveOverlay(); this.selectedNode = node;
    const events = this.currentHistory.filter((event) => event.primaryCells.includes(node)); this.inspector.open({ node, world: this.fields, topo: this.topo, dynamic: null, events, context });
    this.overlay = 'inspector'; this.surfaces.open('inspector', this.inspector.panel, document.getElementById('inspector-heading')); this.resize(true);
    if (this.scene === 'world' && (this.phase === 'running' || this.phase === 'result')) this.requestInspection();
  }
  requestInspection() { if (this.selectedNode == null || !this.worldIdentity) return; this.driver.message({ t: 'inspect-cell',
    requestId: ++this.requestId, requestGeneration: this.requestGeneration, node: this.selectedNode }); this.lastInspect = performance.now(); }
  closeInspector() { this.inspector.close(); this.surfaces.close('inspector'); if (this.overlay === 'inspector') this.overlay = null;
    this.selectedNode = null; this.resize(true); }
  requestWorldReplacement(reason, expected = null, attemptOptions = null) { return requestWorldReplacement(this, reason, expected, attemptOptions); }
  startRun(reason = null, attemptOptions = null) { return startRun(this, reason, attemptOptions); }
  message(message) { if (!sameWorldIdentity(message, this.worldIdentity)) return false;
    if (!this.historyPlayback.handle(message)) return handleRunMessage(this, message); return true; }
  mergeHistory(events) { const bySeq = new Map(this.currentHistory.map((event) => [event.seq, event]));
    for (const event of normalizeHistoryEvents(events)) bySeq.set(event.seq, event); this.currentHistory = [...bySeq.values()].sort((a, b) => a.seq - b.seq).slice(-80);
    const latestTick = this.currentHistory.at(-1)?.tick ?? 0; const liveTick = this.snapshot?.tick ?? latestTick;
    this.historyUi.updateCurrentWorld({ events: this.currentHistory, tick: Math.max(liveTick, latestTick), liveTick }); this.metricUi.update(this.metricModel()); }
  metricModel() { return { snapshot: this.snapshot, result: this.phase === 'result' ? this.lastResult : null,
    score: this.phase === 'result' ? this.lastScore : null, history: this.currentHistory }; }
  focusHistoryCells(cells) { if (!cells?.length) return; if (this.scene !== 'world') this.selectScene('world'); this.historyHighlights = cells.slice(0, 8);
    const node = this.historyHighlights[0]; if (Number.isInteger(node) && node >= 0 && node < this.topo4.nodeCount) this.focusCamera(this.topo4.positions.subarray(node * 3, node * 3 + 3));
    ui.announce(this.el, `${this.historyHighlights.length} History ${this.historyHighlights.length === 1 ? 'cell' : 'cells'} highlighted.`); }
  focusCamera(direction, now = performance.now()) { orientCamera(this.camera, direction); this.resetCameraMotion(this.scene, now); }
  resetCameraMotion(scene = this.scene, now = performance.now()) { this.input?.reset(); resetCameraMotion(this.cameraMotion, now, scene); }
  setSpeed(value) {
    const next = validateRuntimeSpeed(value, { developerMode: this.developerMode, fallback: this.speed });
    this.speed = next; this.el.speed.value = String(next);
    if (isStandardSpeed(next)) { this.settings = { ...this.settings, speed: next }; saveSettings(this.settings); }
    this.driver.setSpeed(next); this.settingsUi?.sync?.(); return next;
  }
  applyPause(paused, reasons = this.pause.values()) { if (paused !== this.effectivePaused) { this.effectivePaused = paused; this.driver.setPaused(paused); } this.timeDial.reset(performance.now());
    this.el.pause.setAttribute('aria-pressed', String(reasons.has('manual'))); this.el.pause.classList.toggle('is-paused', paused);
    this.el.pause.dataset.action = paused && reasons.size === 1 && reasons.has('manual') ? 'recommended' : 'normal'; this.el.pause.setAttribute('aria-label', pauseLabel(reasons)); }
  finishRun(result, visualHistoryBuffer = null) { finishRun(this, result, visualHistoryBuffer); }
  finishAbandoned(summary) { finishAbandoned(this, summary); }
  failRun(message) { this.pause.set('worker-failed', true); ui.announce(this.el, `${message} Start a new world to continue.`); }
  enterEvolution(){return enterEvolution(this)}
  enterTrophies(){enterTrophies(this)}
  selectEvolutionCell(id){selectEvolutionCell(this,id)}closeEvolutionCell(){closeEvolutionCell(this)}buyEvolutionLevel(id){buyEvolutionLevel(this,id)}
  selectTrophy(id) { selectTrophy(this, id); } closeTrophy() { closeTrophy(this); }
  openHistory(scope = null) { if (this.surfaces.toggle('history')) return;
    this.historyPlayback.open(scope ?? (this.scene === 'world' ? 'current' : 'past')); }
  openMetric(kind) {
    const allowed = kind === 'environment' ? ['starting', 'running', 'result'] : ['running', 'result'];
    if (!allowed.includes(this.phase) || !['score', 'reach', 'environment'].includes(kind)) return;
    if (this.surfaces.active === 'metric' && this.metricUi.kind === kind) { this.surfaces.toggle('metric'); return; }
    this.openFull('metric'); this.metricUi.open(kind, this.metricModel()); this.activateSurface('metric', this.metricUi.surface, 'metric-heading');
    for (const button of document.querySelectorAll('[data-metric]')) button.setAttribute('aria-expanded', String(button.dataset.metric === kind)); }
  openMenu() { if (this.surfaces.toggle('menu')) return; this.openFull('menu'); this.settingsUi.open({ phase: this.phase,
    worldContinues: this.phase === 'running', seed: this.runSeed, worldSessionId: this.worldIdentity?.worldSessionId }); this.activateSurface('menu', this.settingsUi.surface, 'menu-heading'); }
  openSettings() { this.openMenu(); }
  openResult() { if (this.phase !== 'result' || this.surfaces.toggle('result')) return; this.openFull('result');
    this.activateSurface('result', document.getElementById('result-dialog'), 'result-heading'); }
  openResultEvolution() {
    if (this.phase !== 'result') return false;
    this.closeActiveOverlay({ skipFocus: true }); const opened = this.enterEvolution();
    if (opened !== false) requestAnimationFrame(() => document.getElementById('scene-evolution')?.focus({ preventScroll: true }));
    return opened !== false;
  }
  openNewWorld() { if (this.phase !== 'running' || this.surfaces.toggle('new-world')) return; this.openFull('new-world');
    this.pause.set('new-world', true); this.newWorld.open(this.snapshot); this.activateSurface('new-world', this.newWorld.surface, 'new-world-heading'); }
  confirmNewWorld() { return this.requestWorldReplacement('confirmed-new-world', this.worldIdentity); }
  openFull(name) { this.closeActiveOverlay(); this.overlay = name;
    // Informational surfaces never stop world authority; destructive confirmation owns its own lease.
    this.pause.set('panel', false); }
  activateSurface(name, element, heading) { this.surfaces.open(name, element, document.getElementById(heading), [], { dismissOnBlank: true }); this.resize(true); }
  panelClosed(name) { if (this.overlay === name) this.closeActiveOverlay(); }
  closeActiveOverlay(options = {}) { const name = this.overlay; if (!name) return;
    if(name==='memory-node')return closeEvolutionCell(this);if(name==='trophy-detail')return closeTrophy(this);
    if (name === 'inspector') this.inspector.close();
    else if (name === 'history') { this.historyPlayback.close(); this.historyUi.close(); }
    else if (name === 'menu') this.settingsUi.close(); else if (name === 'new-world') this.newWorld.close();
    else if (name === 'metric') this.metricUi.close();
    else if (name === 'result') document.getElementById('result-dialog').hidden = true;
    this.surfaces.close(name, options); this.overlay = null; this.pause.set('panel', false); this.pause.set('new-world', false);
    if (name === 'inspector') this.selectedNode = null; this.resize(true);
  }
  applySettings(value, { persist = true } = {}) { const before = this.settings;
    const requestedSpeed = validateRuntimeSpeed(value?.speed, { developerMode: this.developerMode, fallback: this.speed });
    const durableSpeed = isStandardSpeed(requestedSpeed) ? requestedSpeed : before.speed;
    this.settings = validateSettings({ ...value, speed: durableSpeed }); if (persist) saveSettings(this.settings); applySettingsToDocument(this.settings);
    if (this.settings.motion !== before.motion) setCameraMotionReduced(this.cameraMotion, this.settings.motion === 'reduced', performance.now());
    if (requestedSpeed !== this.speed) { this.speed = requestedSpeed; this.el.speed.value = String(requestedSpeed); this.driver.setSpeed(requestedSpeed); }
    if (this.phase === 'result' && this.settings.autoContinue !== before.autoContinue && !this.settings.autoContinue) {
      disableContinuation(this.continuation, this.worldIdentity); this.updateContinuation(performance.now(), true); }
    this.resize(true); }
  settingsAction(action, value) { try {
    if (action === 'history') this.openHistory(this.scene === 'world' ? 'current' : 'past');
    else if (action === 'new-world') this.openNewWorld();
    else if (action === 'export') downloadData(this.meta, this.archive, this.settings);
    else if (action === 'clear-history' && confirm('Clear all preserved History?')) { const trophies = reconcileBeforeHistoryClear(this); this.archive = clearHistory(); saveHistory(this.archive); this.historyPlayback.clear(); ui.announce(this.el, `History was cleared.${trophies.length ? ` ${trophies.length} proven trophies were preserved.` : ''}`); }
    else if (action === 'reset-progress' && confirm('Reset Echoes, Evolution levels, Imprints, and Trophies? This cannot be undone.')) { this.meta = defaultMeta(); this.resultKeys = new Set(); saveMeta(this.meta); this.trophyNotifications.replace(this.meta); ui.announce(this.el, 'Progression was reset.'); }
    else if (action === 'import') { const data = parseImportedData(value); const persistence = saveImportedNamespace(data);
      this.meta = data.meta; this.resultKeys = new Set(this.meta.resultKeys); this.archive = data.history;
      this.applySettings(data.settings, { persist: persistence.ok });
      this.trophyNotifications.replace(this.meta); ui.announce(this.el, persistence.ok ? 'Local data was imported.'
        : 'Local data was imported for this session, but browser storage could not commit it safely.'); }
    else if (action === 'import-error') throw new Error('invalid import');
  } catch { ui.announce(this.el, 'That local-data action could not be completed.'); } }
  availableEvolutionLevels(){return availableEvolutionLevels(this)}
  worldResourceAudit() { return Object.freeze({ interactionListeners: this.interactionGuard.listenerCount,
    historyRequests: this.historyPlayback.pendingRequests, cameraMotion: cameraMotionSnapshot(this.cameraMotion),
    globeInput: this.input?.snapshot() ?? null, layout: this.layout,
    continuationPresentation: Object.freeze({ ...this.continuationAudit }) }); }
  handleTrustedInteraction(type, event) {
    // A browser click follows a completed canvas pointer sequence. Pointerdown already stopped automatic motion;
    // treating the duplicate click as new activity would erase the release velocity created on pointerup.
    const now = performance.now();
    if (!(event?.type === 'click' && event.target === this.canvas)) cameraMotionActivity(this.cameraMotion, now);
    this.cancelAutoNext(type, now);
  }
  cancelAutoNext(reason, now = performance.now()) { if (this.phase !== 'result') return false;
    const cancelled = cancelContinuation(this.continuation, reason); if (cancelled) this.updateContinuation(now, true); return cancelled; }
  updateContinuation(now = performance.now(), force = false) {
    const projection = continuationPresentation(this.continuation);
    const update = planContinuationPresentation(this.continuationCadence, projection, now, force);
    const status = this.continuation.status; const previous = this.continuationStatus;
    if (status !== previous) {
      this.continuationStatus = status;
      if (!document.hidden) {
        const notice = status === 'counting'
          ? previous === 'paused-hidden' ? 'Automatic next World resumed.' : 'Next World will begin automatically unless you interact.'
          : status === 'cancelled' ? 'Automatic next World cancelled for this Result.'
            : status === 'disabled' ? 'Automatic continuation is off for this Result.'
            : status === 'firing' ? 'Starting the next World.' : '';
        if (notice) ui.announce(this.el, notice);
      }
    }
    this.el.continuation.hidden = status === 'inactive';
    if (update.statusChanged) this.el.continuation.dataset.state = status;
    if (update.visibleChanged) { this.el.continuationVisible.textContent = update.visibleText; this.continuationAudit.visibleTextUpdates++; }
    if (update.accessibleChanged) { this.el.continuationAccessible.textContent = update.accessibleText; this.continuationAudit.accessibleTextUpdates++; }
    if (update.styleChanged) {
      const progress = update.progress.toFixed(6); this.el.continuation.style.setProperty('--continuation-progress', progress);
      this.el.continuationTrace.style.strokeDashoffset = String(1 - update.progress); this.continuationAudit.styleUpdates++;
    }
  }
  resetContinuationPresentation() {
    this.continuationStatus = 'inactive'; this.continuationCadence = createContinuationPresentationCadence();
    this.el.continuation.hidden = true; this.el.continuation.dataset.state = 'inactive';
    this.el.continuationVisible.textContent = ''; this.el.continuationAccessible.textContent = '';
    this.el.continuation.style.setProperty('--continuation-progress', '0'); this.el.continuationTrace.style.strokeDashoffset = '1';
  }
  resize(preserveZoom = true) { const cls = this.canvas.clientWidth < 600 ? 'compact' : this.canvas.clientWidth < 900 ? 'tablet' : 'wide'; const layout = safeLayout(this.canvas.clientWidth, this.canvas.clientHeight, this.scene); preserveZoom &&= cls === this.layoutClass; this.layoutClass = cls; this.layout = layout;
    applySafeLayout(this.camera, layout, preserveZoom); this.renderer?.resize(this.canvas.clientWidth, this.canvas.clientHeight, qualityDpr(this.settings, this.caps)); }
  frame(now) { this.frameAudit.frames++;
    try { this.frameStep(now); } catch (error) { this.frameAudit.errors++; this.frameAudit.lastError = error.message; console.error('frame recovered', error); }
    finally { this.frameAudit.scheduled++; this.rafId = requestAnimationFrame((time) => this.frame(time)); }
  }
  frameStep(now) { const dt = Math.max(0, now - this.last); this.last = now;
    this.timeDial.frame(now, { running: this.phase === 'running', paused: this.pause.paused,
      effectiveGameRate: effectiveGameRateForSpeed(this.speed), reduced: this.settings.motion === 'reduced' }); this.driver.frame(dt, now);
    advanceCameraMotion(this.cameraMotion, this.camera, dt, now);
    if (this.scene === 'home') this.showcase?.update(now, this.settings.motion === 'reduced', document.hidden);
    if (this.phase === 'result' && advanceContinuation(this.continuation, now)) {
      const expected = this.lastResultIdentity; const valid = sameWorldIdentity(expected, this.worldIdentity)
        && this.continuation.resultKey === expected?.resultTransactionKey && this.resultKeys.has(this.continuation.resultKey);
      if (valid) { const generation = this.continuation.generation; this.updateContinuation(now, true);
        completeContinuation(this.continuation, generation); this.updateContinuation(now, true);
        this.requestWorldReplacement('auto-next', expected); } else cancelContinuation(this.continuation, 'stale-result');
    }
    if (this.phase === 'result') this.updateContinuation(now);
    if (this.inspector?.node != null && this.scene === 'world' && ['running', 'result'].includes(this.phase) && now - this.lastInspect > 333) this.requestInspection();
    const liveSnapshot = this.scene === 'home' ? this.showcase?.snapshot : this.scene === 'evolution' ? this.memorySnapshot : this.scene === 'trophies' ? this.trophySnapshot : this.snapshot;
    const snap = this.historyPlaybackActive ? this.historySnapshot : liveSnapshot;
    const renderIdentity = this.scene === 'world' && (!this.historyPlaybackActive || snap?.worldSessionId != null) ? this.worldIdentity : null;
    const cadence = this.scene === 'world' ? renderIntervalForSpeed(this.speed) : 0;
    if (!cadence || now - this.lastRender >= cadence) { this.renderer.render({ snapshot: snap ?? null, worldIdentity: renderIdentity,
      camera: this.camera, selectedNode: this.selectedNode,
      highlightedCells: this.historyHighlights, time: now / 1000, pulse: this.settings.motion !== 'reduced' }); this.lastRender = now; }
  }
}
function cloneCamera(camera) { return { ...camera, direction: [...camera.direction], right: [...camera.right], up: [...camera.up] }; }
function restoreCamera(camera, saved) { Object.assign(camera, saved, { direction: [...saved.direction], right: [...saved.right], up: [...saved.up] }); }
