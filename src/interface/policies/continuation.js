/** Pure one-shot result countdown with explicit temporary suspension leases. */
const ACTIVE = new Set(['counting', 'suspended']);
export function createContinuation(durationMs = 9000) {
  return { durationMs, remainingMs: durationMs, status: 'inactive', deadline: 0,
    lastNow: 0, pauses: new Set(), resumeAt: 0, generation: 0, resultKey: null, runId: null };
}
export function startContinuation(state, now, identity = {}) {
  state.remainingMs = state.durationMs; state.status = 'counting'; state.deadline = now + state.durationMs;
  state.lastNow = now; state.pauses.clear(); state.resumeAt = 0; state.resultKey = identity.resultKey ?? null;
  state.runId = identity.runId ?? null; state.generation += 1; return state.generation;
}
export function setContinuationPause(state, reason, paused, now, graceMs = 0) {
  if (!ACTIVE.has(state.status)) return false;
  accrue(state, now);
  if (paused) state.pauses.add(reason); else { state.pauses.delete(reason);
    state.resumeAt = Math.max(state.resumeAt, now + Math.max(0, graceMs)); }
  if (state.pauses.size || now < state.resumeAt) { state.status = 'suspended'; state.deadline = 0; }
  else { state.status = 'counting'; state.deadline = now + state.remainingMs; }
  state.lastNow = now; return true;
}
export function cancelContinuation(state) {
  if (!ACTIVE.has(state.status) && state.status !== 'firing') return false;
  state.status = 'cancelled'; state.deadline = 0; state.pauses.clear(); state.resumeAt = 0;
  state.generation += 1; return true;
}
export function advanceContinuation(state, now) {
  if (!ACTIVE.has(state.status)) return false;
  if (state.status === 'suspended') {
    state.lastNow = now;
    if (state.pauses.size || now < state.resumeAt) return false;
    state.status = 'counting'; state.deadline = now + state.remainingMs; return false;
  }
  accrue(state, now); state.lastNow = now;
  if (state.remainingMs > 0) return false;
  state.status = 'firing'; state.deadline = 0; return true;
}
export function completeContinuation(state, generation) {
  if (state.status !== 'firing' || generation !== state.generation) return false;
  state.status = 'completed'; state.pauses.clear(); return true;
}
export function continuationLabel(state) {
  if (state.status === 'counting') return `Next world in ${Math.max(0, Math.ceil(state.remainingMs / 1000))}`;
  if (state.status !== 'suspended') return '';
  if (state.pauses.has('surface')) return 'Auto next paused while this panel is open';
  if (state.pauses.has('hidden')) return 'Auto next paused while this page is hidden';
  return 'Auto next paused during result interaction';
}
function accrue(state, now) {
  if (state.status !== 'counting') return;
  state.remainingMs = Math.max(0, state.deadline - now); state.lastNow = now;
}
