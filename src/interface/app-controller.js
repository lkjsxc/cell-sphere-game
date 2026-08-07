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
import { applySettingsToDocument, saveSettings, validateSettings } from '../platform/settings.js';
import { recoverRunTransaction } from '../platform/run-transaction-store.js';
import { createAppState } from './app-state.js';
import { createRunDriver } from './run-driver.js';
import { handleRunMessage } from './app-message.js';
import { createPauseControl, pauseLabel } from './pause-control.js';
import { applyAutoRotation, createCameraPolicy, interruptCameraPolicy } from './camera-policy.js';
import { createSurfaceCoordinator } from './policies/surface-coordinator.js';
import { applySafeLayout, safeLayout } from './policies/layout-policy.js'; import { createTimeDial } from './policies/time-dial.js';
import { advanceContinuation, cancelContinuation, completeContinuation, continuationLabel, createContinuation,
  createContinuationInteractionGuard, setContinuationHidden } from './policies/continuation.js';
import { sameWorldIdentity } from '../core/world-session.js';
import { isStandardSpeed, renderIntervalForSpeed, validateRuntimeSpeed } from '../core/runtime-speed.js';
import { createWorldReplacementState, finishAbandoned, finishRun, requestWorldReplacement,
  startRun } from './policies/run-session.js';
import { createNewWorldSurface } from './policies/new-world-surface.js'; import { createHistorySurface } from './history-surface.js'; import { createHistoryPlayback } from './history-playback.js';
import { createInspectorSurface } from './inspection/inspector-surface.js';
import { createMemorySurface } from './panel-surfaces.js';
import { createMetricSurface } from './inspection/metric-surface.js'; import { createEventLogSurface, eventLogWorlds } from './inspection/event-log-surface.js';
import { createSceneSelector } from './policies/scene-selector.js';
import { createTrophySurface } from './policies/trophy-surface.js';
import { buildTrophySnapshot } from '../game/trophies/scene.js';
import { createTrophyNotifications } from './policies/trophy-notifications.js';
import {availableEvolutionLevels,buyEvolutionLevel,closeEvolutionCell,closeTrophy,enterEvolution,enterTrophies,focusAvailableEvolutionCell,
  focusTrophy,initializeProgression,presentEvolution,presentTrophies,progressionTap,reconcileBeforeHistoryClear,selectEvolutionCell,selectTrophy} from './policies/progression-spheres.js';
import { createSettingsSurface } from './settings-surface.js';
import { downloadData, parseImportedData, qualityDpr } from './app-data.js';
import { saveImportedNamespace } from '../platform/namespace-migration.js';
import { DIAGNOSTIC_GLOBALS, PAGES_URL, PRODUCT, REPOSITORY, STORAGE_KEYS, TAGLINE, VERSION } from '../core/identity.js';
import * as ui from './surfaces.js';
const TITLE_SEED = TITLE_SHOWCASE.seed;
export function startGameApp(options) { const app = new GameApp(options); app.boot(); return app; }
class GameApp {
  constructor({ canvas, caps, settings, storageMigration = null, developerMode = false }) {
    Object.assign(this, { canvas, caps, settings, storageMigration, developerMode }); this.el = ui.elements(); this.topo4 = createTopology(4); this.topo = this.topo4; initializeProgression(this);
    this.camera = createCamera(); this.runTransactionRecovery = recoverRunTransaction(settings.historyRetention);
    this.meta = this.runTransactionRecovery?.meta ?? loadMeta(); this.archive = this.runTransactionRecovery?.history ?? loadHistory(settings.historyRetention);
    this.resultKeys = new Set(this.meta.resultKeys); this.flow = createAppState();
    this.speed = validateRuntimeSpeed(settings.speed, { developerMode, fallback: 1 }); this.snapshot = null; this.selectedNode = null;
    this.renderer = null; this.fields = null; this.worldFields = null; this.showcase = null; this.overlay = null; this.cameraByScene = new Map();
    this.currentHistory = []; this.lastResult = null; this.lastScore = null; this.lastResultIdentity = null; this.requestId = 0; this.requestGeneration = 0;
    this.runSeed = null; this.activeRunId = 0; this.worldIdentity = null; this.retiredWorldIdentity = null;
    this.worldSessionSequence = 0; this.presentationGeneration = 0; this.worldReplacement = createWorldReplacementState();
    this.visualSeed = null; this.historySnapshot = null; this.historyHighlights = [];
    this.last = performance.now(); this.lastRender = 0; this.lastInspect = 0; this.cameraPolicy = createCameraPolicy(this.last); this.layoutClass = null; this.effectivePaused = false;
    this.presentationAudit = { blankFrames: 0, lastBlank: null }; this.frameAudit = { frames: 0, scheduled: 0, errors: 0, lastError: null };
    this.driver = createRunDriver(caps, (message) => this.message(message), { developerMode }); this.pause = createPauseControl((paused, reasons) => this.applyPause(paused, reasons));
    this.continuation = createContinuation(); this.countdownLabel = '';
    this.interactionGuard = createContinuationInteractionGuard(document, (type) => this.cancelAutoNext(type));
    this.surfaces = createSurfaceCoordinator(() => this.closeActiveOverlay(), (focus) => this.interactionGuard.runProgrammaticFocus(focus));
    this.historyPlayback = createHistoryPlayback(this); this.timeDial = createTimeDial(this.el.pause);
  }
  get phase() { return this.flow.phase; } get scene() { return this.flow.scene; }
  get state() { return this.flow.phase; } boot() {
    this.makeRenderer(TITLE_SEED); focusCamera(this.camera,
      this.topo.positions.subarray(TITLE_SHOWCASE.focusCell * 3, TITLE_SHOWCASE.focusCell * 3 + 3)); this.resize(false);
    this.showcase = new TitleShowcase(this.topo);
    this.makeSurfaces(); this.bindUi(); this.bindCanvas(); this.bindLifecycle(); this.el.speed.value = String(this.speed);
    const temporary = (this.storageMigration && (!this.storageMigration.available || !this.storageMigration.complete))
      || (this.runTransactionRecovery && !this.runTransactionRecovery.persisted);
    this.el.boot.textContent = `Cells ready — ${this.renderer.backend === 'webgl2' ? 'WebGL2' : 'Canvas 2D'}${temporary ? ' · progress is temporary' : ''}`;
    ui.show(this.el, 'home'); this.sceneSelector.update('home');
    if (this.meta.migrationNotice?.pending) { ui.toast(this.el, 'Your earlier Evolution cells and Imprints were moved into the Evolution Globe.');
      this.meta = { ...this.meta, migrationNotice: { ...this.meta.migrationNotice, pending: false } }; saveMeta(this.meta); }
    if (temporary) ui.announce(this.el, 'Browser storage is unavailable or recovery is incomplete; this session remains playable but changes may be temporary.');
    window[DIAGNOSTIC_GLOBALS.boot] = Object.freeze({ product: PRODUCT, tagline: TAGLINE, version: VERSION,
      repository: REPOSITORY, pages: PAGES_URL, storage: STORAGE_KEYS, storageMigration: this.storageMigration,
      renderer: this.renderer.backend, playable: true, developerMode: this.developerMode }); window[DIAGNOSTIC_GLOBALS.app] = this;
    requestAnimationFrame((now) => this.frame(now)); console.info(`boot ok: ${this.renderer.backend}; passive world ready`);
  } makeSurfaces() {
    this.sceneSelector = createSceneSelector({ onSelect: (scene) => this.selectScene(scene) });
    this.inspector = createInspectorSurface({ onClose: () => this.closeInspector(), onHistory: () => this.openHistory('current') });
    this.metricUi = createMetricSurface({ onClose: () => this.panelClosed('metric'), onSelect: (cells) => this.focusEventCells(cells) });
    this.eventLogUi = createEventLogSurface({ onClose: () => this.panelClosed('event-log'), onFocus: (cells) => this.focusEventCells(cells),
      onHistory: (world, event) => this.openHistoryEvent(world, event), onTrophy: (id) => { this.selectScene('trophies'); selectTrophy(this, id); } });
    this.historyUi = createHistorySurface({ onClose: () => this.panelClosed('history'),
      onWorld: (world) => this.historyPlayback.selectWorld(world), onSeek: (tick, event, world) => this.historyPlayback.seek(tick, event, world),
      onLive: () => this.historyPlayback.live() });
    this.memoryUi = createMemorySurface({ onCloseNode: () => this.closeMemoryNode(), onUnlock: (id) => this.buyMemory(id), onSelect: (id) => this.selectMemoryNode(id) });
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
      try { next = new Canvas2DRenderer(this.canvas, this.topo, this.fields); }
      catch (firstError) {
        this.replaceRenderCanvas();
        try { next = new Canvas2DRenderer(this.canvas, this.topo, this.fields); }
        catch { throw firstError; }
      }
      next.bindWorldSession(binding); this.renderer = next;
      ui.announce(this.el, 'WebGL was lost. The observational Canvas renderer is continuing.');
    };
    try { const next = new GLRenderer(this.canvas, this.topo, this.fields, { onContextLoss: fallback });
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
    document.getElementById('trophy-next-button')?.addEventListener('click', () => ['idle', 'result'].includes(this.phase) ? this.requestWorldReplacement('trophy-restart', this.phase === 'result' ? this.lastResultIdentity : null) : this.selectScene('world'));
    document.getElementById('trophy-focus')?.addEventListener('click', () => this.focusTrophy());
    this.el.pause.addEventListener('click', () => { if (this.phase === 'running') this.pause.set('manual', !this.pause.has('manual')); });
    this.el.speed.addEventListener('change', () => this.setSpeed(Number(this.el.speed.value)));
    document.getElementById('evolution-focus-available')?.addEventListener('click',()=>this.focusAvailableEvolutionCell());
    document.querySelectorAll('.menu-open').forEach((button) => button.addEventListener('click', () => this.openMenu()));
    document.querySelectorAll('.history-open').forEach((button) => button.addEventListener('click', () => this.openHistory()));
    this.el.resultHistory.addEventListener('click', () => this.openHistory('current')); this.el.resultControl.addEventListener('click', () => this.openResult());
    document.getElementById('result-close')?.addEventListener('click', () => this.panelClosed('result'));
    this.el.eventButton.addEventListener('click', () => this.openEventLog()); document.getElementById('history-event-log')?.addEventListener('click', () => this.openEventLog());
    for (const button of [this.el.scoreButton, this.el.entropyButton, this.el.reachButton]) button.addEventListener('click', () => this.openMetric(button.dataset.metric));
    document.addEventListener('keydown', (event) => { if ((event.metaKey || event.ctrlKey) && event.key === ',') { event.preventDefault(); this.openMenu(); }
      else if(event.key==='Home'&&this.scene==='evolution'&&!event.target.closest?.('#scene-selector')){event.preventDefault();this.focusAvailableEvolutionCell();}
      else if (event.key === 'Home' && this.scene === 'trophies' && !event.target.closest?.('#scene-selector')) { event.preventDefault(); this.focusTrophy(); } });
  }
  bindCanvas() { const interrupt = () => interruptCameraPolicy(this.cameraPolicy, performance.now());
    this.input = bindGlobeInput(this.canvas, this.camera, { canInteract: () => true,
      onTap: (x, y) => this.tapGlobe(x, y), onInterrupt: interrupt, onInteractionStart: interrupt,
      onInteractionEnd: () => interruptCameraPolicy(this.cameraPolicy, performance.now()) }); }
  bindLifecycle() {
    const resize = () => this.resize(true);
    if (typeof ResizeObserver === 'function') { this.resizeObserver = new ResizeObserver(resize); this.resizeObserver.observe(this.canvas); }
    else addEventListener('resize', resize);
    document.addEventListener('visibilitychange', () => { const now = performance.now(); this.last = now;
      this.pause.set('hidden', document.hidden && ['starting', 'running'].includes(this.phase));
      setContinuationHidden(this.continuation, document.hidden, now); this.updateContinuation(); });
  }
  tapGlobe(x, y) {
    const hit = pickNode(this.canvas, x, y, this.camera, this.topo); if (!hit) { this.surfaces.blankTap(); return; }
    if (progressionTap(this, hit.node)) return; this.selectCell(hit.node);
  }
  selectScene(next) {
    if (!['home', 'world', 'evolution', 'trophies'].includes(next)) return false;
    const previous = this.scene; if (previous === next) { ui.show(this.el, next); this.sceneSelector.update(next); return true; }
    this.cameraByScene.set(previous, cloneCamera(this.camera)); this.closeActiveOverlay(); this.flow.select(next); const saved = this.cameraByScene.get(next);
    if (next === 'home') this.makeRenderer(TITLE_SEED);
    else if (next === 'world') this.makeRenderer(this.worldIdentity ? this.runSeed : TITLE_SEED, 'world', this.worldIdentity);
    else if (next === 'evolution') presentEvolution(this, Boolean(saved));
    else presentTrophies(this, Boolean(saved));
    if (saved) restoreCamera(this.camera, saved);
    ui.show(this.el, next); this.sceneSelector.update(next); this.updateSceneActions(); this.resize(Boolean(saved)); return true;
  }
  updateSceneActions() {
    this.el.begin.textContent = this.phase === 'idle' ? 'Grow a world' : 'Return to World';
    const active = ['starting', 'running'].includes(this.phase); this.el.restart.textContent = active ? 'Return to World' : 'Next World';
    const trophyNext = document.getElementById('trophy-next-button'); if (trophyNext) trophyNext.textContent = active ? 'Return to World' : 'Next World';
    const evolutionLine = document.getElementById('evolution-line'); if (evolutionLine) evolutionLine.textContent = active
      ? 'Current world unchanged; Evolution upgrades begin next world.' : 'Shape what every future world inherits.';
  }
  selectCell(node, context = null) {
    this.closeActiveOverlay(); this.selectedNode = node; interruptCameraPolicy(this.cameraPolicy, performance.now(), 60_000);
    const events = this.currentHistory.filter((event) => event.primaryCells.includes(node)); this.inspector.open({ node, world: this.fields, topo: this.topo, dynamic: null, events, context });
    this.overlay = 'inspector'; this.surfaces.open('inspector', this.inspector.panel, document.getElementById('inspector-heading')); this.resize(true);
    if (this.scene === 'world' && (this.phase === 'running' || this.phase === 'result')) this.requestInspection();
  }
  requestInspection() { if (this.selectedNode == null || !this.worldIdentity) return; this.driver.message({ t: 'inspect-cell',
    requestId: ++this.requestId, requestGeneration: this.requestGeneration, node: this.selectedNode }); this.lastInspect = performance.now(); }
  closeInspector() { this.inspector.close(); this.surfaces.close('inspector'); if (this.overlay === 'inspector') this.overlay = null;
    this.selectedNode = null; this.resize(true); interruptCameraPolicy(this.cameraPolicy, performance.now()); }
  requestWorldReplacement(reason, expected = null, attemptOptions = null) { return requestWorldReplacement(this, reason, expected, attemptOptions); }
  startRun(reason = null, attemptOptions = null) { return startRun(this, reason, attemptOptions); }
  message(message) { if (!sameWorldIdentity(message, this.worldIdentity)) return false;
    if (!this.historyPlayback.handle(message)) return handleRunMessage(this, message); return true; }
  mergeHistory(events) { const bySeq = new Map(this.currentHistory.map((event) => [event.seq, event]));
    for (const event of normalizeHistoryEvents(events)) bySeq.set(event.seq, event); this.currentHistory = [...bySeq.values()].sort((a, b) => a.seq - b.seq).slice(-80);
    const latest = this.currentHistory.at(-1); if (latest) ui.updateCurrentEvent(this.el, latest, this.phase === 'result');
    this.eventLogUi.update(this.eventLogModel()); this.metricUi.update(this.metricModel()); }
  eventLogModel() { return eventLogWorlds(this.worldIdentity ? { events: this.currentHistory, seed: this.runSeed,
    tick: this.lastResult?.tick ?? this.snapshot?.tick ?? 0, terminal: this.phase === 'result' } : null, this.archive); }
  metricModel() { return { snapshot: this.snapshot, result: this.phase === 'result' ? this.lastResult : null,
    score: this.phase === 'result' ? this.lastScore : null, history: this.currentHistory }; }
  focusEventCells(cells) { if (!cells?.length) return; if (this.scene !== 'world') this.selectScene('world'); this.historyHighlights = cells.slice(0, 8);
    const node = this.historyHighlights[0]; if (Number.isInteger(node) && node >= 0 && node < this.topo4.nodeCount) focusCamera(this.camera, this.topo4.positions.subarray(node * 3, node * 3 + 3));
    ui.announce(this.el, `${this.historyHighlights.length} event ${this.historyHighlights.length === 1 ? 'cell' : 'cells'} highlighted.`); }
  gameTime(tick = 0) { const seconds = Math.floor(tick / 10); return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }
  setSpeed(value) {
    const next = validateRuntimeSpeed(value, { developerMode: this.developerMode, fallback: this.speed });
    this.speed = next; this.el.speed.value = String(next);
    if (isStandardSpeed(next)) { this.settings = { ...this.settings, speed: next }; saveSettings(this.settings); }
    this.driver.setSpeed(next); this.settingsUi?.sync?.(); return next;
  }
  applyPause(paused, reasons = this.pause.values()) { if (paused !== this.effectivePaused) { this.effectivePaused = paused; this.driver.setPaused(paused); } this.timeDial.reset(performance.now());
    this.el.pause.setAttribute('aria-pressed', String(reasons.has('manual'))); this.el.pause.classList.toggle('is-paused', paused);
    this.el.pause.dataset.action = paused && reasons.size === 1 && reasons.has('manual') ? 'recommended' : 'normal'; this.el.pause.setAttribute('aria-label', pauseLabel(reasons)); }
  finishRun(result) { finishRun(this, result); }
  finishAbandoned(summary) { finishAbandoned(this, summary); }
  failRun(message) { this.pause.set('worker-failed', true); ui.announce(this.el, `${message} Start a new world to continue.`); }
  enterEvolution(){enterEvolution(this)}enterMemory(){this.enterEvolution()}
  enterTrophies(){enterTrophies(this)}
  selectEvolutionCell(id){selectEvolutionCell(this,id)}closeEvolutionCell(){closeEvolutionCell(this)}buyEvolutionLevel(id){buyEvolutionLevel(this,id)}
  selectMemoryNode(id){this.selectEvolutionCell(id)}closeMemoryNode(){this.closeEvolutionCell()}buyMemory(id){this.buyEvolutionLevel(id)}
  selectTrophy(id) { selectTrophy(this, id); } closeTrophy() { closeTrophy(this); } focusTrophy() { focusTrophy(this); }
  openHistory(scope = null) { if (this.surfaces.toggle('history')) return;
    this.historyPlayback.open(scope ?? (this.scene === 'world' ? 'current' : 'past')); }
  openHistoryEvent(world, event) { this.openHistory(world?.id ?? (world?.current ? 'current' : 'past'));
    if (event) queueMicrotask(() => this.historyPlayback.seek(event.tick, event, this.historyUi.selectedWorld ?? world)); }
  openEventLog(preferred = 'current') { if (this.surfaces.toggle('event-log')) return; this.openFull('event-log');
    this.eventLogUi.open(this.eventLogModel(), preferred); this.el.eventButton.dataset.read = 'true';
    this.activateSurface('event-log', this.eventLogUi.surface, 'event-log-heading'); }
  openMetric(kind) { if (!['running', 'result'].includes(this.phase)) return;
    if (this.surfaces.active === 'metric' && this.metricUi.kind === kind) { this.surfaces.toggle('metric'); return; }
    this.openFull('metric'); this.metricUi.open(kind, this.metricModel()); this.activateSurface('metric', this.metricUi.surface, 'metric-heading');
    for (const button of document.querySelectorAll('[data-metric]')) button.setAttribute('aria-expanded', String(button.dataset.metric === kind)); }
  openMenu() { if (this.surfaces.toggle('menu')) return; this.openFull('menu'); this.settingsUi.open({ phase: this.phase,
    worldContinues: this.phase === 'running', seed: this.runSeed, worldSessionId: this.worldIdentity?.worldSessionId }); this.activateSurface('menu', this.settingsUi.surface, 'menu-heading'); }
  openSettings() { this.openMenu(); }
  openResult() { if (this.phase !== 'result' || this.surfaces.toggle('result')) return; this.openFull('result');
    this.activateSurface('result', document.getElementById('result-dialog'), 'result-heading'); }
  openNewWorld() { if (this.phase !== 'running' || this.surfaces.toggle('new-world')) return; this.openFull('new-world');
    this.pause.set('new-world', true); this.newWorld.open(this.snapshot); this.activateSurface('new-world', this.newWorld.surface, 'new-world-heading'); }
  confirmNewWorld() { return this.requestWorldReplacement('confirmed-new-world', this.worldIdentity); }
  focusAvailableEvolutionCell(){focusAvailableEvolutionCell(this)}focusAvailableSkill(){this.focusAvailableEvolutionCell()}
  openFull(name) { this.closeActiveOverlay(); this.overlay = name; this.pause.set('panel', this.phase === 'running' && this.settings.pauseOnPanels); }
  activateSurface(name, element, heading) { this.surfaces.open(name, element, document.getElementById(heading), [], { dismissOnBlank: true }); this.resize(true); }
  panelClosed(name) { if (this.overlay === name) this.closeActiveOverlay(); }
  closeActiveOverlay() { const name = this.overlay; if (!name) return;
    if(name==='memory-node')return closeEvolutionCell(this);if(name==='trophy-detail')return closeTrophy(this);
    if (name === 'inspector') this.inspector.close();
    else if (name === 'history') { this.historyPlayback.close(); this.historyUi.close(); }
    else if (name === 'menu') this.settingsUi.close(); else if (name === 'new-world') this.newWorld.close();
    else if (name === 'metric') this.metricUi.close(); else if (name === 'event-log') this.eventLogUi.close();
    else if (name === 'result') document.getElementById('result-dialog').hidden = true;
    this.surfaces.close(name); this.overlay = null; this.pause.set('panel', false); this.pause.set('new-world', false);
    if (name === 'inspector') this.selectedNode = null; this.resize(true);
  }
  applySettings(value) { const before = this.settings;
    const requestedSpeed = validateRuntimeSpeed(value?.speed, { developerMode: this.developerMode, fallback: this.speed });
    const durableSpeed = isStandardSpeed(requestedSpeed) ? requestedSpeed : before.speed;
    this.settings = validateSettings({ ...value, speed: durableSpeed }); saveSettings(this.settings); applySettingsToDocument(this.settings);
    if (requestedSpeed !== this.speed) { this.speed = requestedSpeed; this.el.speed.value = String(requestedSpeed); this.driver.setSpeed(requestedSpeed); }
    if (this.overlay && this.settings.pauseOnPanels !== before.pauseOnPanels) this.pause.set('panel', this.phase === 'running' && this.settings.pauseOnPanels);
    if (this.phase === 'result' && this.settings.autoContinue !== before.autoContinue && !this.settings.autoContinue) {
      cancelContinuation(this.continuation, 'setting-disabled'); this.updateContinuation(); }
    this.resize(true); interruptCameraPolicy(this.cameraPolicy, performance.now()); }
  settingsAction(action, value) { try {
    if (action === 'history') this.openHistory(this.scene === 'world' ? 'current' : 'past');
    else if (action === 'result') this.openResult(); else if (action === 'event-log') this.openEventLog();
    else if (action === 'new-world') this.openNewWorld(); else if (action.startsWith('scene-')) this.selectScene(action.slice(6));
    else if (action === 'camera-reset') { Object.assign(this.camera, createCamera()); this.selectedNode = null; }
    else if (action === 'export') downloadData(this.meta, this.archive, this.settings);
    else if (action === 'clear-history' && confirm('Clear all preserved History?')) { const trophies = reconcileBeforeHistoryClear(this); this.archive = clearHistory(); saveHistory(this.archive); this.historyPlayback.clear(); ui.announce(this.el, `History was cleared.${trophies.length ? ` ${trophies.length} proven trophies were preserved.` : ''}`); }
    else if (action === 'reset-progress' && confirm('Reset Echoes, Evolution levels, Imprints, and Trophies? This cannot be undone.')) { this.meta = defaultMeta(); this.resultKeys = new Set(); saveMeta(this.meta); this.trophyNotifications.replace(this.meta); ui.announce(this.el, 'Progression was reset.'); }
    else if (action === 'import') { const data = parseImportedData(value); const persistence = saveImportedNamespace(data);
      this.meta = data.meta; this.resultKeys = new Set(this.meta.resultKeys); this.archive = data.history; this.applySettings(data.settings);
      this.trophyNotifications.replace(this.meta); ui.announce(this.el, persistence.ok ? 'Local data was imported.'
        : 'Local data was imported for this session, but browser storage could not commit it safely.'); }
    else if (action === 'import-error') throw new Error('invalid import');
  } catch { ui.announce(this.el, 'That local-data action could not be completed.'); } }
  availableEvolutionLevels(){return availableEvolutionLevels(this)}availableMemory(){return this.availableEvolutionLevels()}
  worldResourceAudit() { return Object.freeze({ interactionListeners: this.interactionGuard.listenerCount,
    historyRequests: this.historyPlayback.pendingRequests }); }
  cancelAutoNext(reason) { if (this.phase !== 'result') return false;
    const cancelled = cancelContinuation(this.continuation, reason); if (cancelled) this.updateContinuation(); return cancelled; }
  updateContinuation() { const label = continuationLabel(this.continuation); if (label === this.countdownLabel) return; this.countdownLabel = label; this.el.countdown.textContent = label; }
  resize(preserveZoom = true) { const cls = this.canvas.clientWidth < 600 ? 'compact' : this.canvas.clientWidth < 900 ? 'tablet' : 'wide'; const layout = safeLayout(this.canvas.clientWidth, this.canvas.clientHeight, this.scene); preserveZoom &&= cls === this.layoutClass; this.layoutClass = cls;
    applySafeLayout(this.camera, layout, preserveZoom); this.renderer?.resize(this.canvas.clientWidth, this.canvas.clientHeight, qualityDpr(this.settings, this.caps)); }
  frame(now) { this.frameAudit.frames++;
    try { this.frameStep(now); } catch (error) { this.frameAudit.errors++; this.frameAudit.lastError = error.message; console.error('frame recovered', error); }
    finally { this.frameAudit.scheduled++; this.rafId = requestAnimationFrame((time) => this.frame(time)); }
  }
  frameStep(now) { const dt = Math.max(0, now - this.last); this.last = now;
    this.timeDial.frame(now, { running: this.phase === 'running', paused: this.pause.paused, speed: this.speed, reduced: this.settings.motion === 'reduced' }); this.driver.frame(dt, now);
    if (this.scene === 'home') this.showcase?.update(now, this.settings.motion === 'reduced', document.hidden);
    const active = this.input?.isActive(); if (!active && this.selectedNode == null && this.settings.cameraInertia) applyInertia(this.camera);
    applyAutoRotation(this.camera, this.settings, this.cameraPolicy, { active, selected: this.selectedNode != null,
      overlay: Boolean(this.overlay), hidden: document.hidden }, now, dt);
    if (this.phase === 'result' && advanceContinuation(this.continuation, now)) {
      const expected = this.lastResultIdentity; const valid = sameWorldIdentity(expected, this.worldIdentity)
        && this.continuation.resultKey === expected?.resultTransactionKey && this.resultKeys.has(this.continuation.resultKey);
      if (valid) { const generation = this.continuation.generation; completeContinuation(this.continuation, generation);
        this.requestWorldReplacement('auto-next', expected); } else cancelContinuation(this.continuation, 'stale-result');
    }
    if (this.phase === 'result') this.updateContinuation();
    if (this.inspector?.node != null && this.scene === 'world' && ['running', 'result'].includes(this.phase) && now - this.lastInspect > 333) this.requestInspection();
    const snap = this.historySnapshot ?? (this.scene === 'home' ? this.showcase?.snapshot : this.scene === 'evolution' ? this.memorySnapshot : this.scene === 'trophies' ? this.trophySnapshot : this.snapshot);
    const cadence = this.scene === 'world' ? renderIntervalForSpeed(this.speed) : 0;
    if (!cadence || now - this.lastRender >= cadence) { this.renderer.render({ snapshot: snap ?? null, worldIdentity: this.scene === 'world' ? this.worldIdentity : null,
      camera: this.camera, selectedNode: this.selectedNode,
      highlightedCells: this.historyHighlights, time: now / 1000, pulse: this.settings.motion !== 'reduced' }); this.lastRender = now; }
  }
}
function cloneCamera(camera) { return { ...camera, direction: [...camera.direction], right: [...camera.right], up: [...camera.up] }; }
function restoreCamera(camera, saved) { Object.assign(camera, saved, { direction: [...saved.direction], right: [...saved.right], up: [...saved.up] }); }
