/** One document-level trusted-activity capture path for independent presentation policies. */
export const TRUSTED_INTERACTION_EVENTS = Object.freeze([
  'pointerdown', 'touchstart', 'wheel', 'keydown', 'click', 'focusin', 'input', 'change',
]);

export function normalizeTrustedInteraction(event) {
  if (!event?.isTrusted || !TRUSTED_INTERACTION_EVENTS.includes(event.type)) return null;
  if (event.type === 'keydown' && event.key == null) return null;
  if (event.type === 'focusin') return 'focus';
  if (event.type === 'wheel') return 'wheel';
  if (event.type === 'keydown') return 'keyboard';
  if (event.type === 'touchstart') return 'touch';
  if (event.type === 'pointerdown') return event.pointerType === 'touch' ? 'touch' : 'pointer';
  return 'control';
}

export function createTrustedInteractionGuard(target, onInteraction) {
  let programmaticFocusDepth = 0; let disposed = false; let lastTouchPointer = null;
  const handle = (event) => {
    const time = Number.isFinite(event.timeStamp) ? event.timeStamp : 0;
    if (event.type === 'pointerdown' && event.pointerType === 'touch') lastTouchPointer = { target: event.target, time };
    else if (event.type === 'touchstart' && lastTouchPointer?.target === event.target
      && Math.abs(time - lastTouchPointer.time) <= 100) return;
    const type = normalizeTrustedInteraction(event); if (!type) return;
    if (type === 'focus' && programmaticFocusDepth) return; onInteraction(type, event);
  };
  for (const type of TRUSTED_INTERACTION_EVENTS) target.addEventListener(type, handle, true);
  return {
    runProgrammaticFocus(callback) { programmaticFocusDepth++; try { callback(); } finally { programmaticFocusDepth--; } },
    dispose() { if (disposed) return; disposed = true;
      for (const type of TRUSTED_INTERACTION_EVENTS) target.removeEventListener(type, handle, true); },
    get listenerCount() { return disposed ? 0 : TRUSTED_INTERACTION_EVENTS.length; },
  };
}
