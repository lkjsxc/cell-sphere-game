/** Nonmodal Settings surface. The controller owns persistence and pause leases. */
import { validateSettings } from '../platform/settings.js';

const byId = (id) => document.getElementById(id);

export function createSettingsSurface(options) {
  const surface = byId('settings-dialog'); const form = /** @type {HTMLFormElement} */ (byId('settings-form'));
  const close = /** @type {HTMLButtonElement} */ (byId('settings-close')); const note = byId('settings-time-note');
  let settings = options.read();
  close.addEventListener('click', () => options.onClose());
  form.addEventListener('change', () => {
    settings = validateSettings(readForm(form, settings)); options.onChange(settings); render(form, settings);
  });
  byId('camera-reset')?.addEventListener('click', () => options.onAction('camera-reset'));
  byId('export-data')?.addEventListener('click', () => options.onAction('export'));
  byId('clear-history')?.addEventListener('click', () => options.onAction('clear-history'));
  byId('reset-progress')?.addEventListener('click', () => options.onAction('reset-progress'));
  byId('import-data')?.addEventListener('change', async (event) => {
    const input = /** @type {HTMLInputElement} */ (event.currentTarget); const file = input.files?.[0]; input.value = '';
    if (!file || file.size > 1_500_000) return options.onAction('import-error');
    try { options.onAction('import', await file.text()); } catch { options.onAction('import-error'); }
  });
  return {
    surface,
    open(worldContinues) { settings = options.read(); render(form, settings); if (note) note.hidden = !worldContinues; surface.hidden = false; },
    sync() { settings = options.read(); render(form, settings); }, close() { surface.hidden = true; },
  };
}

function render(form, settings) {
  for (const element of form.elements) {
    if (!(element instanceof HTMLInputElement || element instanceof HTMLSelectElement)) continue;
    const name = element.name; if (!name || !(name in settings)) continue;
    if (element instanceof HTMLInputElement && element.type === 'checkbox') element.checked = Boolean(settings[name]);
    else element.value = String(settings[name]);
  }
  const help = byId('adaptation-choice-help'); if (help) help.textContent = settings.adaptationMode === 'random'
    ? 'The world chooses one of the three options immediately. Best for relaxed and unattended play.'
    : 'Offers wait in Adaptations until you choose. The world continues while they wait.';
}

function readForm(form, current) {
  const out = { ...current };
  for (const element of form.elements) {
    if (!(element instanceof HTMLInputElement || element instanceof HTMLSelectElement)) continue;
    const name = element.name; if (!name || !(name in out)) continue;
    if (element instanceof HTMLInputElement && element.type === 'checkbox') out[name] = element.checked;
    else if (name === 'speed' || name === 'historyRetention') out[name] = Number(element.value);
    else out[name] = element.value;
  }
  return out;
}
