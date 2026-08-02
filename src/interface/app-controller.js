/**
 * Browser composition for the playable run: worker first, deterministic
 * main-thread fallback second. This module owns no authoritative simulation.
 */
import { BALANCE as B } from '../game/balance.js';
import { scoreResult } from '../game/scoring.js';
import { buildMemorySnapshot, memoryEffects, purchaseMemory } from '../game/memory.js';
import { createRng } from '../core/prng.js';
import { createTopology } from '../world/icosphere.js';
import { createFields } from '../world/fields.js';
import { GLRenderer } from '../rendering/renderer.js';
import { Canvas2DRenderer } from '../rendering/fallback2d.js';
import { AttractState } from '../rendering/attract-state.js';
import { createCamera, focusCamera, rotate, applyInertia } from '../rendering/camera.js';
import { pickNode } from '../rendering/picking.js';
import { bindGlobeInput } from './globe-input.js';
import { RunController } from '../simulation/simulator.js';
import { loadMeta, saveMeta } from '../platform/storage.js';
import { saveSettings } from '../platform/settings.js';
import * as ui from './surfaces.js';
import { createAppState } from './app-state.js';

const TITLE_SEED = 20260731;

/** @param {{canvas:HTMLCanvasElement, caps:object, settings:object}} options */
export function startGameApp(options) {
  const app = new GameApp(options);
  app.boot();
  return app;
}

class GameApp {
  constructor({ canvas, caps, settings }) {
    this.canvas = canvas; this.caps = caps; this.settings = settings;
    this.el = ui.elements(); this.topo = createTopology(4); this.camera = createCamera();
    this.meta = loadMeta(); this.flow = createAppState(); this.speed = settings.speed; this.snapshot = null;
    this.renderer = null; this.worker = null; this.fallback = null; this.paused = false;
    this.attract = null; this.memorySnapshot = null; this.input = null;
    this.debt = 0; this.last = performance.now(); this.lastSnapshot = 0;
    this.lastRender = 0; this.hiddenRun = false;
  }

  get state() { return this.flow.state; }

  boot() {
    this.makeRenderer(TITLE_SEED);
    this.resize();
    this.camera.dist = this.canvas.clientWidth < 600 ? 6 : 4.1;
    const centerX = this.canvas.clientWidth * (0.5 + this.camera.offsetX * 0.5);
    const center = pickNode(this.canvas, centerX, this.canvas.clientHeight / 2, this.camera, this.topo);
    this.attract = new AttractState(this.topo, center?.node ?? 0);
    this.bindUi(); this.bindCanvas(); this.bindLifecycle();
    this.el.speed.value = String(this.speed);
    this.el.boot.textContent = `Cells ready — ${this.renderer.backend === 'webgl2' ? 'WebGL2' : 'Canvas 2D'}`;
    ui.show(this.el, 'title');
    window.__IN_BOOT__ = Object.freeze({ renderer: this.renderer.backend, version: '0.1.0', playable: true });
    requestAnimationFrame((now) => this.frame(now));
    console.info(`boot ok: ${this.renderer.backend}; playable worker path ready`);
  }

  makeRenderer(seed) {
    const fields = createFields(createRng(seed ^ 0x51ab3d71), this.topo);
    this.renderer?.dispose();
    try { this.renderer = new GLRenderer(this.canvas, this.topo, fields); }
    catch (error) { console.warn('WebGL2 init failed; using Canvas 2D fallback', error); this.renderer = new Canvas2DRenderer(this.canvas, this.topo, fields); }
  }

  bindUi() {
    this.el.begin.addEventListener('click', () => this.startRun());
    this.el.memoryButton.addEventListener('click', () => this.enterMemory());
    this.el.restart.addEventListener('click', () => this.startRun());
    this.el.pause.addEventListener('click', () => this.setPaused(!this.paused));
    this.el.speed.addEventListener('change', () => this.setSpeed(Number(this.el.speed.value)));
    this.el.dialog.addEventListener('cancel', (event) => event.preventDefault());
  }

  bindCanvas() {
    this.input = bindGlobeInput(this.canvas, this.camera, {
      canInteract: () => ['title', 'running', 'memory'].includes(this.state) && (!this.paused || this.state === 'memory'),
      onTap: (x, y) => this.tapGlobe(x, y),
    });
  }

  bindLifecycle() {
    const resize = () => this.resize();
    if (typeof ResizeObserver === 'function') new ResizeObserver(resize).observe(this.canvas);
    else addEventListener('resize', resize);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state === 'running' && !this.paused) { this.hiddenRun = true; this.setPaused(true); }
      else if (!document.hidden && this.hiddenRun) { this.hiddenRun = false; this.setPaused(false); }
    });
  }

  tapGlobe(x, y) {
    const hit = pickNode(this.canvas, x, y, this.camera, this.topo);
    if (!hit) return;
    if (this.state === 'title') this.attract?.reset(hit.node);
    else if (this.state === 'running') this.send({ t: 'signal', node: hit.node });
  }

  startRun() {
    this.worker?.terminate(); this.worker = null; this.fallback = null; this.paused = false; this.debt = 0;
    const params = new URLSearchParams(location.search);
    const given = Number(params.get('seed'));
    const seed = Number.isInteger(given) && given >= 0 && given < 0x40000000 ? given
      : params.has('demo') ? TITLE_SEED : (TITLE_SEED + this.meta.runs * 104729) & 0x3fffffff;
    this.makeRenderer(seed);
    this.flow.send(this.state === 'title' ? 'begin' : 'restart'); this.resize(); this.snapshot = null;
    ui.show(this.el, 'run'); ui.announce(this.el, 'Life is blooming at the recommended cell. Tap the world to place a Signal.');
    const cfg = { seed, strainId: 'pioneer', memoryEffects: memoryEffects(this.meta) };
    if (this.caps.worker) this.startWorker(cfg); else this.startFallback(cfg, 'Web Worker が使えないため、互換モードで実行中です。');
  }

  startWorker(cfg) {
    try {
      const worker = new Worker(new URL('../simulation/worker-entry.js', import.meta.url), { type: 'module' });
      this.worker = worker;
      worker.onmessage = (event) => this.message(event.data);
      worker.onerror = () => {
        worker.terminate();
        if (this.state === 'starting') this.startFallback(cfg, 'The Worker was unavailable. The same simulation is running on this thread.');
        else ui.announce(this.el, 'The simulation stopped unexpectedly. Begin another world to recover.');
      };
      worker.postMessage({ t: 'init', cfg });
    } catch { this.startFallback(cfg, 'The Worker was unavailable. The same simulation is running on this thread.'); }
  }

  startFallback(cfg, note) {
    this.worker?.terminate(); this.worker = null;
    this.fallback = new RunController(cfg, (message) => this.message(message));
    this.fallback.start(); this.snapshot = this.fallback.snapshot(); ui.updateHud(this.el, this.snapshot); ui.announce(this.el, note);
  }

  message(msg) {
    if (msg.t === 'ready') { this.worker?.postMessage({ t: 'speed', value: this.speed }); this.worker?.postMessage({ t: 'start' }); return; }
    if (msg.t === 'snapshot') { this.snapshot = msg; ui.updateHud(this.el, msg); return; }
    if (msg.t === 'started') { this.flow.send('ready'); return; }
    if (msg.t === 'signal') { ui.announce(this.el, 'The Signal is bending the frontier toward a new region.'); return; }
    if (msg.t === 'event') { ui.announce(this.el, `${msg.family} is moving across the world.`); return; }
    if (msg.t === 'draft') { this.flow.send('draft'); ui.showDraft(this.el, msg.options, (card) => this.choose(card)); return; }
    if (msg.t === 'decided') { this.flow.send('choose'); ui.hideDraft(this.el); ui.announce(this.el, 'The Adaptation is changing the network’s form.'); return; }
    if (msg.t === 'extinct') this.finishRun(msg.summary);
  }

  choose(card) { ui.hideDraft(this.el); this.send({ t: 'decide', card }); }
  send(message) { if (this.worker) this.worker.postMessage(message); else if (this.fallback) this.fallback[message.t === 'signal' ? 'placeSignal' : 'decide'](message.node ?? message.card); }
  setSpeed(value) { this.speed = value; this.settings.speed = value; saveSettings(this.settings); this.worker?.postMessage({ t: 'speed', value }); }
  setPaused(value) {
    if (!['running', 'draft'].includes(this.state)) return;
    this.paused = value; this.el.pause.setAttribute('aria-pressed', String(value));
    this.el.pause.textContent = value ? 'Resume' : 'Pause'; this.worker?.postMessage({ t: value ? 'pause' : 'resume' });
    ui.announce(this.el, value ? 'Game time is paused.' : 'Growth resumes.');
  }

  finishRun(result) {
    this.flow.send('extinct'); this.paused = true; ui.hideDraft(this.el);
    const score = scoreResult(result);
    this.meta = { ...this.meta, runs: this.meta.runs + 1, totalEchoes: this.meta.totalEchoes + score.echoes,
      echoBalance: this.meta.echoBalance + score.echoes, bestScore: Math.max(this.meta.bestScore, score.total),
      imprints: result.imprint.edges.length ? [...this.meta.imprints, result.imprint].slice(-8) : this.meta.imprints };
    saveMeta(this.meta); ui.showResult(this.el, score, result);
  }

  enterMemory() {
    this.flow.send('memory'); this.resize(); this.memorySnapshot = buildMemorySnapshot(this.topo, this.meta); if (this.memorySnapshot.focus) focusCamera(this.camera, this.memorySnapshot.focus);
    ui.showMemory(this.el, this.meta, (id) => this.buyMemory(id));
  }

  buyMemory(id) {
    const purchase = purchaseMemory(this.meta, id);
    if (!purchase.ok) return;
    this.meta = purchase.meta; saveMeta(this.meta);
    this.memorySnapshot = buildMemorySnapshot(this.topo, this.meta);
    ui.showMemory(this.el, this.meta, (next) => this.buyMemory(next));
    ui.announce(this.el, `${purchase.node.nameEn} is now part of every future world.`);
  }

  resize() { const memory = this.state === 'memory'; this.camera.offsetX = memory ? (this.canvas.clientWidth >= 800 ? -0.3 : 0) : (this.canvas.clientWidth >= 800 ? 0.26 : 0); this.camera.offsetY = memory && this.canvas.clientWidth < 800 ? 0.32 : 0; this.renderer?.resize(this.canvas.clientWidth, this.canvas.clientHeight, Math.min(this.caps.dpr, 2)); }
  frame(now) {
    const dt = Math.min(100, now - this.last); this.last = now;
    this.advanceFallback(dt, now);
    if (this.state === 'title') {
      this.attract?.update(now, this.settings.motion === 'reduced');
      if (this.settings.motion !== 'reduced') rotate(this.camera, -dt * 0.000035, 0, false);
    } else if (!this.input?.isActive() && this.settings.cameraInertia) applyInertia(this.camera);
    const rendered = this.state === 'title' ? this.attract?.snapshot ?? null
      : this.state === 'memory' ? this.memorySnapshot : this.snapshot;
    if (this.speed < 16 || now - this.lastRender > 66) { this.renderer.render({ snapshot: rendered, camera: this.camera, time: now / 1000, pulse: this.settings.motion !== 'reduced' }); this.lastRender = now; }
    requestAnimationFrame((time) => this.frame(time));
  }

  advanceFallback(dt, now) {
    if (!this.fallback || this.state !== 'running' || this.paused) return;
    this.debt += (dt / 1000) * this.speed * B.TICKS_PER_SECOND;
    const ticks = Math.floor(this.debt); this.debt -= ticks;
    if (ticks) this.fallback.advance(ticks);
    if (now - this.lastSnapshot > 100 || !this.snapshot) { this.snapshot = this.fallback.snapshot(); this.lastSnapshot = now; ui.updateHud(this.el, this.snapshot); }
  }
}
