/** Coordinates one nonmodal context surface and restores its opener. */
export function createSurfaceCoordinator(onEscape) {
  let active = null; let opener = null; let element = null;
  const keydown = (event) => {
    if (event.key !== 'Escape' || !active) return;
    event.preventDefault(); onEscape(active);
  };
  document.addEventListener('keydown', keydown);
  return {
    open(name, nextElement, focusTarget = null) {
      active = name; element = nextElement;
      opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      element.hidden = false;
      requestAnimationFrame(() => focusTarget?.focus?.({ preventScroll: true }));
    },
    close(name) {
      if (name !== active) return;
      if (element) element.hidden = true;
      const restore = opener; active = null; opener = null; element = null;
      if (restore?.isConnected) requestAnimationFrame(() => restore.focus({ preventScroll: true }));
    },
    bounds() { return element && !element.hidden ? element.getBoundingClientRect() : null; },
    get active() { return active; },
    dispose() { document.removeEventListener('keydown', keydown); },
  };
}
