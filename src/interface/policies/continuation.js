/** Untouched-only, one-shot automatic continuation for a single result generation. */
const ACTIVE = new Set(['counting', 'paused-hidden']);
const INTERACTION_EVENTS = Object.freeze([
  'pointerdown', 'touchstart', 'wheel', 'keydown', 'click', 'focusin', 'input', 'change',
]);

export function createContinuation(durationMs = 9000) {
  return { durationMs, remainingMs: durationMs, status: 'inactive', deadline: 0, lastNow: 0,
    generation: 0, resultKey: null, runId: null, presentationGeneration: null, cancelReason: null };
}
export function startContinuation(state, now, identity = {}) {
  state.remainingMs = state.durationMs; state.status = 'counting'; state.deadline = now + state.durationMs;
  state.lastNow = now; state.resultKey = identity.resultKey ?? identity.resultTransactionKey ?? null;
  state.runId = identity.runId ?? null; state.presentationGeneration = identity.presentationGeneration ?? null;
  state.cancelReason = null; state.generation += 1; return state.generation;
}
export function disableContinuation(state, identity = {}) {
  state.status = 'disabled'; state.deadline = 0; state.remainingMs = state.durationMs;
  state.resultKey = identity.resultKey ?? identity.resultTransactionKey ?? null;
  state.runId = identity.runId ?? null; state.presentationGeneration = identity.presentationGeneration ?? null;
  state.cancelReason = null; state.generation += 1; return state.generation;
}
export function setContinuationHidden(state, hidden, now) {
  if (!ACTIVE.has(state.status)) return false;
  accrue(state, now);
  state.status = hidden ? 'paused-hidden' : 'counting'; state.lastNow = now;
  state.deadline = hidden ? 0 : now + state.remainingMs; return true;
}
export function cancelContinuation(state, reason = 'interaction') {
  if (!ACTIVE.has(state.status) && state.status !== 'firing') return false;
  state.status = 'cancelled'; state.deadline = 0; state.cancelReason = reason; return true;
}
export function resetContinuation(state) {
  state.status = 'inactive'; state.deadline = 0; state.remainingMs = state.durationMs;
  state.resultKey = null; state.runId = null; state.presentationGeneration = null; state.cancelReason = null;
}
export function advanceContinuation(state, now) {
  if (state.status !== 'counting') return false;
  accrue(state, now); state.lastNow = now;
  if (state.remainingMs > 0) return false;
  state.status = 'firing'; state.deadline = 0; return true;
}
export function completeContinuation(state, generation) {
  if (state.status !== 'firing' || generation !== state.generation) return false;
  state.status = 'completed'; return true;
}
export function continuationLabel(state) {
  if (state.status === 'counting') return `Next world in ${Math.max(0, Math.ceil(state.remainingMs / 1000))}`;
  if (state.status === 'paused-hidden') return 'Auto next paused while this page is hidden';
  if (state.status === 'cancelled') return 'Auto next cancelled for this result';
  return '';
}
export function continuationInteractionType(event) {
  if (!event?.isTrusted || !INTERACTION_EVENTS.includes(event.type)) return null;
  if (event.type === 'keydown' && event.key == null) return null;
  if (event.type === 'focusin') return 'focus';
  if (event.type === 'wheel') return 'wheel';
  if (event.type === 'keydown') return 'keyboard';
  if (event.type === 'touchstart') return 'touch';
  if (event.type === 'pointerdown') return event.pointerType === 'touch' ? 'touch' : 'pointer';
  return 'control';
}
export function createContinuationInteractionGuard(target, onInteraction) {
  let programmaticFocusDepth = 0; let disposed = false;
  const handle = (event) => {
    const type = continuationInteractionType(event); if (!type) return;
    if (type === 'focus' && programmaticFocusDepth) return; onInteraction(type, event);
  };
  for (const type of INTERACTION_EVENTS) target.addEventListener(type, handle, true);
  return { runProgrammaticFocus(callback) { programmaticFocusDepth++; try { callback(); } finally { programmaticFocusDepth--; } },
    dispose() { if (disposed) return; disposed = true; for (const type of INTERACTION_EVENTS) target.removeEventListener(type, handle, true); },
    get listenerCount() { return disposed ? 0 : INTERACTION_EVENTS.length; } };
}
function accrue(state, now) {
  if (state.status !== 'counting') return;
  state.remainingMs = Math.max(0, state.deadline - now);
}
