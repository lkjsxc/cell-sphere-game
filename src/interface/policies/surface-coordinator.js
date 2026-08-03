/** Coordinates one nonmodal surface while preserving meaningful native gestures. */
const CONTROL_SELECTOR = 'button,a[href],input,select,textarea,label,[role="button"],[role="link"],[data-action]';
export function classifySurfaceTarget(path, surface, currentTriggers) {
  if (surface && path.includes(surface)) return 'inside';
  if (currentTriggers.some((trigger) => path.includes(trigger))) return 'current-trigger';
  if (path.some((node) => node?.matches?.('[data-surface-trigger]'))) return 'control';
  if (path.some((node) => node?.matches?.(CONTROL_SELECTOR))) return 'control';
  if (path.some((node) => node?.matches?.('canvas'))) return 'canvas';
  return 'empty';
}

export function createSurfaceCoordinator(onDismiss) {
  let active = null; let opener = null; let element = null; let triggers = [];
  let restoreFocus = true; const sequences = new Map(); const emptyClicks = new Map();
  const scrim = document.getElementById('surface-scrim');
  const pathOf = (event) => event.composedPath?.() ?? [event.target];
  const dismiss = (preserveTarget) => { restoreFocus = !preserveTarget; onDismiss(active); };
  const keydown = (event) => {
    if (event.key !== 'Escape' || !active) return;
    event.preventDefault(); event.stopPropagation(); dismiss(false);
  };
  const pointerdown = (event) => {
    if (!active) return;
    const category = classifySurfaceTarget(pathOf(event), element, triggers);
    const sequence = { category, x: event.clientX, y: event.clientY, target: event.target };
    sequences.set(event.pointerId, sequence);
    if (category === 'control' || category === 'canvas') dismiss(true);
    else if (category === 'empty') { event.preventDefault(); event.stopImmediatePropagation(); }
  };
  const pointerup = (event) => {
    const sequence = sequences.get(event.pointerId); sequences.delete(event.pointerId);
    if (!sequence || sequence.category !== 'empty') return;
    event.preventDefault(); event.stopImmediatePropagation();
    const moved = Math.hypot(event.clientX - sequence.x, event.clientY - sequence.y);
    if (moved <= 12) { if (active) dismiss(false); emptyClicks.set(event.pointerId, sequence.target); }
  };
  const pointercancel = (event) => { sequences.delete(event.pointerId); emptyClicks.delete(event.pointerId); };
  const click = (event) => {
    if (!emptyClicks.has(event.pointerId)) return;
    const target = emptyClicks.get(event.pointerId); emptyClicks.delete(event.pointerId);
    if (event.target !== target) return;
    event.preventDefault(); event.stopImmediatePropagation();
  };
  document.addEventListener('keydown', keydown); document.addEventListener('pointerdown', pointerdown, true);
  document.addEventListener('pointerup', pointerup, true); document.addEventListener('pointercancel', pointercancel, true);
  document.addEventListener('click', click, true);
  return {
    open(name, nextElement, focusTarget = null, extraTriggers = []) {
      active = name; element = nextElement;
      triggers = [...document.querySelectorAll(`[data-surface-trigger="${name}"]`), ...extraTriggers].filter(Boolean);
      const focused = document.activeElement;
      opener = focused instanceof HTMLElement && !nextElement.contains(focused) ? focused : triggers[0] ?? null;
      for (const trigger of triggers) trigger.setAttribute('aria-expanded', 'true');
      element.hidden = false; if (scrim) scrim.hidden = false;
      requestAnimationFrame(() => focusTarget?.focus?.({ preventScroll: true }));
    },
    close(name) {
      if (name !== active) return;
      if (element) element.hidden = true; for (const trigger of triggers) trigger.setAttribute('aria-expanded', 'false');
      if (scrim) scrim.hidden = true; const restore = restoreFocus ? opener : null;
      active = null; opener = null; element = null; triggers = []; restoreFocus = true; sequences.clear();
      if (restore?.isConnected) requestAnimationFrame(() => restore.focus({ preventScroll: true }));
    },
    toggle(name) { if (active !== name) return false; dismiss(false); return true; },
    get active() { return active; },
    dispose() { document.removeEventListener('keydown', keydown); document.removeEventListener('pointerdown', pointerdown, true);
      document.removeEventListener('pointerup', pointerup, true); document.removeEventListener('pointercancel', pointercancel, true);
      document.removeEventListener('click', click, true); },
  };
}
