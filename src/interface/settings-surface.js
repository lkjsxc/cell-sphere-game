/** Small Menu surface for common preferences and secondary local-data actions. */
const byId = (id) => document.getElementById(id);

export function createSettingsSurface(options) {
  const surface = byId('menu-dialog'); const form = /** @type {HTMLFormElement} */ (byId('settings-form'));
  const close = /** @type {HTMLButtonElement} */ (byId('menu-close')); const note = byId('settings-time-note');
  let settings = options.read();
  close.addEventListener('click', () => options.onClose());
  form.addEventListener('change', () => {
    options.onChange(readForm(form, settings)); settings = options.read(); render(form, settings);
  });
  for (const [id, action] of [['menu-history', 'history'], ['menu-new-world', 'new-world']])
    byId(id)?.addEventListener('click', () => options.onAction(action));
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
    open(context = {}) {
      settings = options.read(); render(form, settings);
      if (note) note.hidden = !context.worldContinues;
      byId('menu-history').hidden = context.phase !== 'running';
      byId('menu-new-world').hidden = context.phase !== 'running';
      surface.hidden = false;
    },
    sync() { settings = options.read(); render(form, settings); },
    close() { surface.hidden = true; },
  };
}

function render(form, settings) {
  for (const element of form.elements) {
    if (!(element instanceof HTMLInputElement || element instanceof HTMLSelectElement)) continue;
    const name = element.name; if (!name || !(name in settings)) continue;
    if (element instanceof HTMLInputElement && element.type === 'checkbox') element.checked = Boolean(settings[name]);
    else element.value = String(settings[name]);
  }
}

function readForm(form, current) {
  const out = { ...current };
  for (const element of form.elements) {
    if (!(element instanceof HTMLInputElement || element instanceof HTMLSelectElement)) continue;
    const name = element.name; if (!name || !(name in out)) continue;
    out[name] = element instanceof HTMLInputElement && element.type === 'checkbox' ? element.checked : element.value;
  }
  return out;
}
