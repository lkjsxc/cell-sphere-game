/** Untouched-only, one-shot automatic continuation for a single result generation. */
const ACTIVE = new Set(['counting', 'paused-hidden']);
export const CONTINUATION_STYLE_INTERVAL_MS = 1000 / 30;

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

/** One semantic and visual projection of continuation authority; it owns no clock. */
export function continuationPresentation(state) {
  const status = CONTINUATION_STATUSES.has(state?.status) ? state.status : 'inactive';
  const durationMs = positive(state?.durationMs, 1); const remainingMs = clamp(finite(state?.remainingMs, durationMs), 0, durationMs);
  const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const progress = status === 'firing' || status === 'completed' ? 1 : clamp(1 - remainingMs / durationMs, 0, 1);
  const active = ACTIVE.has(status); const paused = status === 'paused-hidden'; const cancelled = status === 'cancelled';
  const disabled = status === 'disabled'; const firing = status === 'firing'; const complete = status === 'completed';
  const visibleText = visibleTextFor(status); const accessibleText = accessibleTextFor(status, remainingSeconds);
  return Object.freeze({ status, progress, remainingMs, remainingSeconds, visibleText, accessibleText,
    active, paused, cancelled, disabled, firing, complete });
}

/** Pure mutation plan that bounds style work and avoids per-frame DOM text changes. */
export function createContinuationPresentationCadence() {
  return { status: null, progress: null, visibleText: null, accessibleText: null,
    remainingSeconds: null, lastStyleAt: -Infinity };
}
export function planContinuationPresentation(cadence, projection, now, force = false) {
  const time = Math.max(0, finite(now, cadence.lastStyleAt > 0 ? cadence.lastStyleAt : 0));
  const statusChanged = cadence.status !== projection.status;
  const visibleChanged = cadence.visibleText !== projection.visibleText;
  const accessibleChanged = cadence.accessibleText !== projection.accessibleText
    && (statusChanged || cadence.remainingSeconds !== projection.remainingSeconds);
  const progressChanged = cadence.progress == null || Math.abs(cadence.progress - projection.progress) > 1e-7;
  const styleChanged = force || statusChanged
    || (progressChanged && time - cadence.lastStyleAt >= CONTINUATION_STYLE_INTERVAL_MS);
  cadence.status = projection.status;
  if (visibleChanged) cadence.visibleText = projection.visibleText;
  if (accessibleChanged) { cadence.accessibleText = projection.accessibleText; cadence.remainingSeconds = projection.remainingSeconds; }
  if (styleChanged) { cadence.progress = projection.progress; cadence.lastStyleAt = time; }
  return Object.freeze({ ...projection, statusChanged, visibleChanged, accessibleChanged, styleChanged });
}
function accrue(state, now) {
  if (state.status !== 'counting') return;
  state.remainingMs = Math.max(0, state.deadline - now);
}
const CONTINUATION_STATUSES = new Set(['inactive', 'counting', 'paused-hidden', 'cancelled', 'disabled', 'firing', 'completed']);
function visibleTextFor(status) {
  if (status === 'counting') return 'World cycle continues automatically';
  if (status === 'paused-hidden') return 'World cycle paused while hidden';
  if (status === 'cancelled') return 'Automatic cycle cancelled by interaction';
  if (status === 'disabled') return 'Automatic continuation is off';
  if (status === 'firing') return 'The next World is germinating';
  if (status === 'completed') return 'World cycle complete';
  return '';
}
function accessibleTextFor(status, seconds) {
  const unit = seconds === 1 ? 'second' : 'seconds';
  if (status === 'counting') return `Next World starts automatically in ${seconds} ${unit}. Any interaction cancels it.`;
  if (status === 'paused-hidden') return `Automatic next World is paused with ${seconds} ${unit} remaining while this page is hidden.`;
  if (status === 'cancelled') return 'Automatic next World was cancelled by interaction for this Result. Start it manually when ready.';
  if (status === 'disabled') return 'Automatic continuation is off. Start the next World manually when ready.';
  if (status === 'firing') return 'The next World is starting automatically.';
  if (status === 'completed') return 'The automatic World cycle is complete.';
  return '';
}
function finite(value, fallback) { return Number.isFinite(value) ? value : fallback; }
function positive(value, fallback) { return Number.isFinite(value) && value > 0 ? value : fallback; }
function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, value)); }
