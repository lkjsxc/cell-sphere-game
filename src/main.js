/** Browser composition root. Game state stays inside interface/app-controller. */
import { detectCapabilities } from './platform/capabilities.js';
import { applySettingsToDocument, loadSettings } from './platform/settings.js';
import { startGameApp } from './interface/app-controller.js';
import { migrateStorageNamespace } from './platform/namespace-migration.js';
import { DIAGNOSTIC_GLOBALS } from './core/identity.js';

const diagnosticErrors = [];
globalThis[DIAGNOSTIC_GLOBALS.errors] = diagnosticErrors;
globalThis.addEventListener?.('error', (event) => recordDiagnosticError(event.error ?? event.message));
globalThis.addEventListener?.('unhandledrejection', (event) => recordDiagnosticError(event.reason));

function boot() {
  const canvas = /** @type {HTMLCanvasElement|null} */ (document.getElementById('gl-canvas'));
  if (!canvas) throw new Error('missing game canvas');
  const storageMigration = migrateStorageNamespace(); const settings = loadSettings();
  applySettingsToDocument(settings);
  startGameApp({ canvas, caps: detectCapabilities(), settings, storageMigration });
}

try { boot(); }
catch (error) {
  console.error('boot failed', error);
  const status = document.getElementById('boot-status');
  recordDiagnosticError(error);
  if (status) status.textContent = 'The world could not wake. Reload the page to try again.';
}

function recordDiagnosticError(value) {
  const message = value instanceof Error ? `${value.name}: ${value.message}` : String(value ?? 'Unknown browser error');
  diagnosticErrors.push(message.slice(0, 500)); if (diagnosticErrors.length > 32) diagnosticErrors.shift();
}
