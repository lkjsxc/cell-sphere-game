/** Browser composition root. Game state stays inside interface/app-controller. */
import { detectCapabilities } from './platform/capabilities.js';
import { applySettingsToDocument, loadSettings } from './platform/settings.js';
import { startGameApp } from './interface/app-controller.js';

function boot() {
  const canvas = /** @type {HTMLCanvasElement|null} */ (document.getElementById('gl-canvas'));
  if (!canvas) throw new Error('missing game canvas');
  const settings = loadSettings();
  applySettingsToDocument(settings);
  startGameApp({ canvas, caps: detectCapabilities(), settings });
}

try { boot(); }
catch (error) {
  console.error('boot failed', error);
  const status = document.getElementById('boot-status');
  if (status) status.textContent = '起動に失敗しました。ページを再読み込みしてください。';
}
