/**
 * Composition root. Boots the platform, detects capabilities, starts the
 * title scene (a real rendered globe), and hands off to the preview runner
 * when ?preview=1 is present. Full screen wiring lands with the interface
 * layer; this file stays small.
 */
import { detectCapabilities } from './platform/capabilities.js';
import { loadSettings, applySettingsToDocument } from './platform/settings.js';
import { createTopology } from './world/icosphere.js';
import { createFields } from './world/fields.js';
import { createRng } from './core/prng.js';
import { GLRenderer } from './rendering/renderer.js';
import { Canvas2DRenderer } from './rendering/fallback2d.js';
import { createCamera } from './rendering/camera.js';
import { startPreview } from './preview.js';

const TITLE_SEED = 20260731;

async function boot() {
  const statusEl = document.getElementById('boot-status');
  const report = (text) => { if (statusEl) statusEl.textContent = text; };

  const caps = detectCapabilities();
  const settings = loadSettings();
  applySettingsToDocument(settings);
  const canvas = document.getElementById('gl-canvas');

  if (new URLSearchParams(location.search).get('preview') === '1') {
    startPreview(canvas);
    report('プレビューモード — 実シミュレーション稼働中');
    return;
  }

  // Title scene: the real globe, slowly rotating, no fake footage.
  const topo = createTopology(4);
  const fields = createFields(createRng(TITLE_SEED ^ 0x51ab3d71), topo);
  let renderer;
  try {
    renderer = new GLRenderer(canvas, topo, fields, {
      onContextLoss: () => report('描画コンテキストを喪失しました。再読み込みしてください。'),
    });
  } catch (err) {
    console.warn('WebGL2 init failed; using Canvas 2D fallback', err);
    renderer = new Canvas2DRenderer(canvas, topo, fields);
  }

  const camera = createCamera();
  const dpr = Math.min(caps.dpr, 2);
  const resize = () => renderer.resize(canvas.clientWidth, canvas.clientHeight, dpr);
  resize();
  globalThis.addEventListener('resize', resize);

  const pulse = settings.motion !== 'reduced';
  let last = performance.now();
  const loop = (now) => {
    const dt = Math.min(100, now - last);
    last = now;
    camera.yaw += dt * 0.00006;
    renderer.render({ snapshot: null, camera, time: now / 1000, pulse });
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  const backendName = renderer.backend === 'webgl2' ? 'WebGL2' : 'Canvas 2D';
  report(`システム準備完了 — ${backendName}`);
  console.info(`boot ok: ${backendName}`);
  window.__IN_BOOT__ = Object.freeze({
    renderer: backendName,
    reducedMotion: settings.motion === 'reduced',
    version: '0.1.0',
  });
}

boot().catch((err) => {
  console.error('boot failed', err);
  const statusEl = document.getElementById('boot-status');
  if (statusEl) statusEl.textContent = '起動に失敗しました。コンソールを確認してください。';
});
