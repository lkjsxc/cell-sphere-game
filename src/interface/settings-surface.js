/** Unified Menu surface. The controller owns persistence and pause leases. */
import { validateSettings } from '../platform/settings.js';

const byId = (id) => document.getElementById(id);

export function createSettingsSurface(options) {
  const surface = byId('menu-dialog'); const form = /** @type {HTMLFormElement} */ (byId('settings-form'));
  const close = /** @type {HTMLButtonElement} */ (byId('menu-close')); const note = byId('settings-time-note');
  let settings = options.read();
  close.addEventListener('click', () => options.onClose());
  form.addEventListener('change', () => {
    settings = validateSettings(readForm(form, settings)); options.onChange(settings); render(form, settings);
  });
  for (const [id, action] of [['menu-history', 'history'], ['menu-result', 'result'], ['menu-event-log', 'event-log'],
    ['menu-new-world', 'new-world'], ['menu-home', 'scene-home'], ['menu-evolution', 'scene-evolution'], ['menu-trophies', 'scene-trophies']])
    byId(id)?.addEventListener('click', () => options.onAction(action));
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
    open(context = {}) { settings = options.read(); render(form, settings); if (note) note.hidden = !context.worldContinues;
      const active = ['starting', 'running', 'result'].includes(context.phase); byId('menu-world-identity').textContent = active
        ? `Seed ${context.seed} · ${context.phase === 'result' ? 'completed' : context.phase} · world ${context.worldSessionId ?? '—'}` : 'No active world. Start one from Home or Next World.';
      byId('menu-result').hidden = context.phase !== 'result'; byId('menu-new-world').hidden = context.phase !== 'running'; surface.hidden = false; },
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
