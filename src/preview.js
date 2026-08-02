/**
 * Development preview: runs a real simulation on the main thread and feeds
 * it to the renderer. Activated with ?preview=1 — used for visual checks
 * and screenshot evidence, never as a substitute for the worker path.
 */
import { createTopology } from './world/icosphere.js';
import { createFields } from './world/fields.js';
import { createRng } from './core/prng.js';
import { RunController } from './simulation/simulator.js';
import { GLRenderer } from './rendering/renderer.js';
import { Canvas2DRenderer } from './rendering/fallback2d.js';
import { createCamera, rotate, zoom } from './rendering/camera.js';
import { pickNode } from './rendering/picking.js';

const SEED = 20260731;

/** @param {HTMLCanvasElement} canvas */
export function startPreview(canvas) {
  const topo = createTopology(4);
  const fields = createFields(createRng(SEED ^ 0x51ab3d71), topo);

  let renderer;
  try {
    renderer = new GLRenderer(canvas, topo, fields);
  } catch (err) {
    console.warn('WebGL2 init failed, using Canvas 2D fallback', err);
    renderer = new Canvas2DRenderer(canvas, topo, fields);
  }

  const camera = createCamera();
  let snapshot = null;
  let fade = 1;

  const rc = new RunController({ seed: SEED, strainId: 'pioneer' }, (m) => {
    if (m.t === 'draft') rc.decide(m.options[0]);
    if (m.t === 'extinct') {
      // Restart the world after a short fade — the preview never idles.
      fade = 0;
      setTimeout(() => {
        location.reload();
      }, 1200);
    }
  });
  rc.start();

  // Pointer: drag rotates, wheel zooms, tap places a Signal.
  let dragging = false;
  let moved = 0;
  let lastX = 0;
  let lastY = 0;
  canvas.addEventListener('pointerdown', (e) => {
    dragging = true; moved = 0; lastX = e.clientX; lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    moved += Math.abs(dx) + Math.abs(dy);
    rotate(camera, dx * 0.006, dy * 0.005);
    lastX = e.clientX; lastY = e.clientY;
  });
  canvas.addEventListener('pointerup', (e) => {
    dragging = false;
    if (moved < 8) {
      const hit = pickNode(canvas, e.clientX, e.clientY, camera, topo);
      if (hit) rc.placeSignal(hit.node);
    }
  });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    zoom(camera, e.deltaY > 0 ? 1.08 : 0.93);
  }, { passive: false });

  const dpr = Math.min(2, globalThis.devicePixelRatio || 1);
  const resize = () => renderer.resize(canvas.clientWidth, canvas.clientHeight, dpr);
  resize();
  globalThis.addEventListener('resize', resize);

  let last = performance.now();
  const loop = (now) => {
    const dt = Math.min(100, now - last);
    last = now;
    if (rc.state.status === 'running') {
      rc.advance(Math.round(dt * 0.01 * 8)); // ~8x speed
    }
    fade = Math.min(1, fade + dt * 0.002);
    if (rc.state.tick % 2 === 0 || !snapshot) snapshot = rc.snapshot();
    rotate(camera, -dt * 0.00004, 0, false);
    renderer.render({
      snapshot, camera, time: now / 1000, pulse: true, fade,
    });
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  console.info(`preview running: seed ${SEED}, backend ${renderer.backend}`);
}
