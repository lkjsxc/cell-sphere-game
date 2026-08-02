/**
 * Browser composition for the playable run: worker first, deterministic
 * main-thread fallback second. This module owns no authoritative simulation.
 */
import { BALANCE as B } from '../game/balance.js';
import { scoreResult } from '../game/scoring.js';
import { createRng } from '../core/prng.js';
import { createTopology } from '../world/icosphere.js';
import { createFields } from '../world/fields.js';
import { GLRenderer } from '../rendering/renderer.js';
import { Canvas2DRenderer } from '../rendering/fallback2d.js';
import { createCamera, rotate, zoom, applyInertia } from '../rendering/camera.js';
import { pickNode } from '../rendering/picking.js';
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
    this.pointer = null; this.debt = 0; this.last = performance.now(); this.lastSnapshot = 0;
    this.lastRender = 0; this.hiddenRun = false;
  }

  get state() { return this.flow.state; }

  boot() {
    this.makeRenderer(TITLE_SEED);
    this.resize(); this.bindUi(); this.bindCanvas(); this.bindLifecycle();
    this.el.speed.value = String(this.speed);
    this.el.boot.textContent = `システム準備完了 — ${this.renderer.backend === 'webgl2' ? 'WebGL2' : 'Canvas 2D'}`;
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
    this.el.restart.addEventListener('click', () => this.startRun());
    this.el.pause.addEventListener('click', () => this.setPaused(!this.paused));
    this.el.speed.addEventListener('change', () => this.setSpeed(Number(this.el.speed.value)));
    this.el.dialog.addEventListener('cancel', (event) => event.preventDefault());
  }

  bindCanvas() {
    this.canvas.addEventListener('pointerdown', (event) => {
      if (!['title', 'running'].includes(this.state)) return;
      this.pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: 0, at: performance.now() };
      this.canvas.setPointerCapture(event.pointerId);
    });
    this.canvas.addEventListener('pointermove', (event) => {
      if (!this.pointer || event.pointerId !== this.pointer.id) return;
      const dx = event.clientX - this.pointer.x; const dy = event.clientY - this.pointer.y;
      this.pointer.moved += Math.abs(dx) + Math.abs(dy); rotate(this.camera, dx * 0.006, dy * 0.005);
      this.pointer.x = event.clientX; this.pointer.y = event.clientY;
    });
    this.canvas.addEventListener('pointerup', (event) => this.finishPointer(event));
    this.canvas.addEventListener('pointercancel', () => { this.pointer = null; });
    this.canvas.addEventListener('wheel', (event) => { event.preventDefault(); zoom(this.camera, event.deltaY > 0 ? 1.08 : 0.93); }, { passive: false });
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

  finishPointer(event) {
    const pointer = this.pointer; this.pointer = null;
    if (!pointer || event.pointerId !== pointer.id || this.state !== 'running' || this.paused) return;
    if (pointer.moved < 10 && performance.now() - pointer.at < 500) {
      const hit = pickNode(this.canvas, event.clientX, event.clientY, this.camera, this.topo);
      if (hit) this.send({ t: 'signal', node: hit.node });
    }
  }

  startRun() {
    this.worker?.terminate(); this.worker = null; this.fallback = null; this.paused = false; this.debt = 0;
    const params = new URLSearchParams(location.search);
    const given = Number(params.get('seed'));
    const seed = Number.isInteger(given) && given >= 0 && given < 0x40000000 ? given
      : params.has('demo') ? TITLE_SEED : (TITLE_SEED + this.meta.runs * 104729) & 0x3fffffff;
    this.makeRenderer(seed); this.resize();
    this.flow.send(this.state === 'title' ? 'begin' : 'restart'); this.snapshot = null;
    ui.show(this.el, 'run'); ui.announce(this.el, '推奨地点で生命が芽生えています。球体をタップして Signal を送れます。');
    const cfg = { seed, strainId: 'pioneer' };
    if (this.caps.worker) this.startWorker(cfg); else this.startFallback(cfg, 'Web Worker が使えないため、互換モードで実行中です。');
  }

  startWorker(cfg) {
    try {
      const worker = new Worker(new URL('../simulation/worker-entry.js', import.meta.url), { type: 'module' });
      this.worker = worker;
      worker.onmessage = (event) => this.message(event.data);
      worker.onerror = () => {
        worker.terminate();
        if (this.state === 'starting') this.startFallback(cfg, 'Worker の起動に失敗しました。互換モードで実行中です。');
        else ui.announce(this.el, 'シミュレーションが中断されました。もう一度育ててください。');
      };
      worker.postMessage({ t: 'init', cfg });
    } catch { this.startFallback(cfg, 'Worker の起動に失敗しました。互換モードで実行中です。'); }
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
    if (msg.t === 'signal') { ui.announce(this.el, 'Signal が前線を新しい地域へ導いています。'); return; }
    if (msg.t === 'event') { ui.announce(this.el, `${msg.family} が世界を移動しています。`); return; }
    if (msg.t === 'draft') { this.flow.send('draft'); ui.showDraft(this.el, msg.options, (card) => this.choose(card)); return; }
    if (msg.t === 'decided') { this.flow.send('choose'); ui.hideDraft(this.el); ui.announce(this.el, '適応がネットワークの形を変え始めました。'); return; }
    if (msg.t === 'extinct') this.finishRun(msg.summary);
  }

  choose(card) { ui.hideDraft(this.el); this.send({ t: 'decide', card }); }
  send(message) { if (this.worker) this.worker.postMessage(message); else if (this.fallback) this.fallback[message.t === 'signal' ? 'placeSignal' : 'decide'](message.node ?? message.card); }
  setSpeed(value) { this.speed = value; this.settings.speed = value; saveSettings(this.settings); this.worker?.postMessage({ t: 'speed', value }); }
  setPaused(value) {
    if (!['running', 'draft'].includes(this.state)) return;
    this.paused = value; this.el.pause.setAttribute('aria-pressed', String(value));
    this.el.pause.textContent = value ? '再開' : '一時停止'; this.worker?.postMessage({ t: value ? 'pause' : 'resume' });
    ui.announce(this.el, value ? 'ゲーム時間を止めました。' : '成長を再開しました。');
  }

  finishRun(result) {
    this.flow.send('extinct'); this.paused = true; ui.hideDraft(this.el);
    const score = scoreResult(result);
    this.meta = { ...this.meta, runs: this.meta.runs + 1, totalEchoes: this.meta.totalEchoes + score.echoes, bestScore: Math.max(this.meta.bestScore, score.total) };
    saveMeta(this.meta); ui.showResult(this.el, score, result);
  }

  resize() { this.renderer?.resize(this.canvas.clientWidth, this.canvas.clientHeight, Math.min(this.caps.dpr, 2)); }
  frame(now) {
    const dt = Math.min(100, now - this.last); this.last = now;
    this.advanceFallback(dt, now);
    if (this.state === 'title' && this.settings.motion !== 'reduced') this.camera.yaw += dt * 0.00006;
    else if (!this.pointer && this.settings.cameraInertia) applyInertia(this.camera);
    if (this.speed < 16 || now - this.lastRender > 66) { this.renderer.render({ snapshot: this.snapshot, camera: this.camera, time: now / 1000, pulse: this.settings.motion !== 'reduced' }); this.lastRender = now; }
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
