/** Pure, one-shot real-time countdown. Simulation time never enters this state. */
export function createContinuation(durationMs = 9000) {
  return { durationMs, remainingMs: durationMs, active: false, completed: false,
    lastNow: 0, pauses: new Set(), generation: 0 };
}

export function startContinuation(state, now) {
  state.remainingMs = state.durationMs; state.active = true; state.completed = false;
  state.lastNow = now; state.pauses.clear(); state.generation += 1; return state.generation;
}

export function setContinuationPause(state, reason, paused, now) {
  advanceContinuation(state, now);
  if (paused) state.pauses.add(reason); else state.pauses.delete(reason);
  state.lastNow = now;
}

export function cancelContinuation(state) {
  state.active = false; state.pauses.clear(); state.generation += 1;
}

export function advanceContinuation(state, now) {
  if (!state.active || state.completed) return false;
  if (!state.pauses.size) state.remainingMs = Math.max(0, state.remainingMs - Math.max(0, now - state.lastNow));
  state.lastNow = now;
  if (state.remainingMs > 0) return false;
  state.active = false; state.completed = true; return true;
}

export function continuationLabel(state) {
  if (!state.active && !state.completed) return '';
  if (state.pauses.size) return 'Automatic continuation paused';
  return `Next world in ${Math.max(0, Math.ceil(state.remainingMs / 1000))}`;
}
