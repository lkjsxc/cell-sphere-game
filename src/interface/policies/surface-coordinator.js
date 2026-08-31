/** Coordinates one physical shell without pre-empting globe gesture classification. */
const CONTROL_SELECTOR = 'button,a[href],input,select,textarea,label,[role="button"],[role="link"],[data-action]';
export function classifySurfaceTarget(path, surface, currentTriggers) {
  if (surface && path.includes(surface)) return 'inside';
  if (currentTriggers.some((trigger) => path.includes(trigger))) return 'current-trigger';
  if (path.some((node) => node?.matches?.('[data-globe-gesture]'))) return 'globe-gesture';
  if (path.some((node) => node?.matches?.('[data-surface-trigger]'))) return 'control';
  if (path.some((node) => node?.matches?.(CONTROL_SELECTOR))) return 'control';
  if (path.some((node) => node?.matches?.('canvas'))) return 'canvas';
  return 'empty';
}

export function createSurfaceCoordinator(onDismiss, runProgrammaticFocus = (callback) => callback(), onActiveChange = () => {}) {
  let active = null; let opener = null; let element = null; let triggers = []; let policy = {};
  let restoreFocus = true; let focusGeneration = 0; const sequences = new Map();
  const shell = document.getElementById('context-shell'); const scrim = document.getElementById('surface-scrim');
  const pathOf = (event) => event.composedPath?.() ?? [event.target];
  const dismiss = (preserveTarget) => { restoreFocus = !preserveTarget; onDismiss(active); };
  const keydown = (event) => {
    if (event.key !== 'Escape' || !active) return;
    event.preventDefault(); event.stopPropagation(); dismiss(false);
  };
  const pointerdown = (event) => {
    if (!active || (event.pointerType === 'mouse' && event.button !== 0)) return;
    sequences.set(event.pointerId, { category: classifySurfaceTarget(pathOf(event), element, triggers),
      x: event.clientX, y: event.clientY, travel: 0 });
  };
  const pointermove = (event) => { const sequence = sequences.get(event.pointerId); if (!sequence) return;
    const distance = Math.hypot(event.clientX - sequence.x, event.clientY - sequence.y); sequence.travel += distance;
    sequence.x = event.clientX; sequence.y = event.clientY; };
  const pointerup = (event) => {
    const sequence = sequences.get(event.pointerId); sequences.delete(event.pointerId);
    if (!sequence || sequence.category !== 'empty' || sequence.travel > 12 || policy.dismissOnBlank === false) return;
    dismiss(true);
  };
  const pointercancel = (event) => sequences.delete(event.pointerId);
  document.addEventListener('keydown', keydown); document.addEventListener('pointerdown', pointerdown, true);
  document.addEventListener('pointermove', pointermove, true); document.addEventListener('pointerup', pointerup, true);
  document.addEventListener('pointercancel', pointercancel, true);
  return {
    open(name, nextElement, focusTarget = null, extraTriggers = [], nextPolicy = {}) {
      if (element && element !== nextElement) element.hidden = true;
      active = name; element = nextElement; policy = nextPolicy;
      triggers = [...document.querySelectorAll(`[data-surface-trigger="${name}"]`), ...extraTriggers].filter(Boolean);
      const focused = document.activeElement;
      opener = focused instanceof HTMLElement && !nextElement.contains(focused) ? focused : triggers[0] ?? null;
      for (const trigger of triggers) trigger.setAttribute('aria-expanded', 'true');
      if (shell) { shell.hidden = false; shell.dataset.surface = name; }
      element.hidden = false; if (scrim) scrim.hidden = false; onActiveChange(name); const token = ++focusGeneration;
      requestAnimationFrame(() => { if (token !== focusGeneration || active !== name) return;
        runProgrammaticFocus(() => focusTarget?.focus?.({ preventScroll: true })); });
    },
    close(name, options = {}) {
      if (name !== active) return;
      if (element) element.hidden = true; for (const trigger of triggers) trigger.setAttribute('aria-expanded', 'false');
      if (shell) { shell.hidden = true; shell.dataset.surface = 'none'; } if (scrim) scrim.hidden = true;
      const restore = restoreFocus && !options.skipFocus ? opener : null;
      active = null; opener = null; element = null; triggers = []; policy = {}; restoreFocus = true; sequences.clear();
      onActiveChange(null);
      const token = ++focusGeneration; if (restore?.isConnected) requestAnimationFrame(() => {
        if (token !== focusGeneration || active) return;
        runProgrammaticFocus(() => restore.focus({ preventScroll: true })); });
    },
    blankTap() { if (!active || policy.dismissOnBlank === false) return false; dismiss(true); return true; },
    reset() { focusGeneration++; restoreFocus = false; if (element) element.hidden = true;
      for (const trigger of triggers) trigger.setAttribute('aria-expanded', 'false');
      if (shell) { shell.hidden = true; shell.dataset.surface = 'none'; } if (scrim) scrim.hidden = true;
      active = null; opener = null; element = null; triggers = []; policy = {}; restoreFocus = true; sequences.clear(); onActiveChange(null); },
    toggle(name) { if (active !== name) return false; dismiss(false); return true; },
    get active() { return active; },
    dispose() { document.removeEventListener('keydown', keydown); document.removeEventListener('pointerdown', pointerdown, true);
      document.removeEventListener('pointermove', pointermove, true); document.removeEventListener('pointerup', pointerup, true);
      document.removeEventListener('pointercancel', pointercancel, true); },
  };
}
