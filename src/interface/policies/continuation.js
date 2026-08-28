/** Untouched-only, one-shot automatic continuation for a single result generation. */
const ACTIVE = new Set(['counting', 'paused-hidden']);

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
function accrue(state, now) {
  if (state.status !== 'counting') return;
  state.remainingMs = Math.max(0, state.deadline - now);
}
