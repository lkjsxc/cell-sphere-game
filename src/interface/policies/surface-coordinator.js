/** Coordinates one context surface, natural dismissal, and focus restoration. */
export function createSurfaceCoordinator(onDismiss) {
  let active = null; let opener = null; let element = null; let triggers = [];
  let downOutside = false; let swallowClick = false; const scrim = document.getElementById('surface-scrim');
  const inside = (target) => element?.contains(target) || triggers.some((trigger) => trigger.contains(target));
  const keydown = (event) => {
    if (event.key !== 'Escape' || !active) return;
    event.preventDefault(); event.stopPropagation(); onDismiss(active);
  };
  const pointerdown = (event) => { if (!active) return; downOutside = !inside(event.target);
    if (downOutside) { event.preventDefault(); event.stopImmediatePropagation(); } };
  const pointerup = (event) => {
    if (!active || !downOutside || inside(event.target)) { downOutside = false; return; }
    downOutside = false; swallowClick = true; event.preventDefault(); event.stopImmediatePropagation(); onDismiss(active);
  };
  const click = (event) => { if (!swallowClick) return; swallowClick = false; event.preventDefault(); event.stopImmediatePropagation(); };
  document.addEventListener('keydown', keydown); document.addEventListener('pointerdown', pointerdown, true);
  document.addEventListener('pointerup', pointerup, true); document.addEventListener('click', click, true);
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
      if (scrim) scrim.hidden = true; const restore = opener;
      active = null; opener = null; element = null; triggers = []; downOutside = false;
      if (restore?.isConnected) requestAnimationFrame(() => restore.focus({ preventScroll: true }));
    },
    toggle(name) { if (active !== name) return false; onDismiss(name); return true; },
    bounds() { return element && !element.hidden ? element.getBoundingClientRect() : null; },
    get active() { return active; },
    dispose() { document.removeEventListener('keydown', keydown); document.removeEventListener('pointerdown', pointerdown, true);
      document.removeEventListener('pointerup', pointerup, true); document.removeEventListener('click', click, true); },
  };
}
