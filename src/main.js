/**
 * Composition root. Boots the platform, detects capabilities, and hands
 * control to the application state machine. Kept deliberately small: all
 * behavior lives in domain modules, this file only wires them together.
 *
 * Boot stages (filled in as systems land):
 *   1. capability detection + settings defaults        (this commit)
 *   2. world + simulation worker                       (simulation commit)
 *   3. renderer (WebGL2, Canvas2D fallback)            (rendering commit)
 *   4. interface screens + game layer                  (game commit)
 */
import { detectCapabilities } from './platform/capabilities.js';
import { loadSettings, applySettingsToDocument } from './platform/settings.js';

async function boot() {
  const statusEl = document.getElementById('boot-status');
  const report = (text) => { if (statusEl) statusEl.textContent = text; };

  const caps = detectCapabilities();
  const settings = loadSettings();
  applySettingsToDocument(settings);

  const rendererName = caps.webgl2 ? 'WebGL2' : 'Canvas 2D';
  report(`システム準備完了 — ${rendererName} / ${caps.worker ? 'Worker' : 'MainThread'}`);

  // Expose a minimal, read-only boot report for diagnostics and tests.
  window.__IN_BOOT__ = Object.freeze({
    renderer: rendererName,
    execution: caps.worker ? 'worker' : 'main-thread',
    reducedMotion: settings.motion === 'reduced',
    version: '0.1.0',
  });
}

boot().catch((err) => {
  console.error('boot failed', err);
  const statusEl = document.getElementById('boot-status');
  if (statusEl) statusEl.textContent = '起動に失敗しました。コンソールを確認してください。';
});
