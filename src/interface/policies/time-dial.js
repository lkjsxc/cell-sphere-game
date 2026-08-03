/** One frame-loop visual clock; it never owns simulation time or pause leases. */
const FULL_TURN = 360; const BASE_DURATION_MS = 2800; const MIN_DURATION_MS = 900;
export function createTimeDialState(phase = 60) {
  return { phase: finiteAngle(phase), lastNow: null };
}
export function visualDialRate(speed) {
  const bounded = Math.max(1, Math.min(32, Number(speed) || 1));
  return FULL_TURN / Math.max(MIN_DURATION_MS, BASE_DURATION_MS / Math.sqrt(bounded));
}
export function advanceTimeDial(state, now, options = {}) {
  const time = Number.isFinite(now) ? now : state.lastNow ?? 0;
  const elapsed = state.lastNow == null ? 0 : Math.max(0, Math.min(100, time - state.lastNow));
  state.lastNow = time;
  if (options.running && !options.paused && !options.reduced) {
    state.phase = finiteAngle(state.phase + elapsed * visualDialRate(options.speed));
  }
  return Object.freeze({ minute: state.phase, hour: state.phase / 12 });
}
export function createTimeDial(button) {
  const state = createTimeDialState(); const minute = button.querySelector('.clock-minute');
  const hour = button.querySelector('.clock-hour'); let rendered = '';
  return { state, reset(now) { state.lastNow = Number.isFinite(now) ? now : state.lastNow; }, frame(now, options) {
    const angles = advanceTimeDial(state, now, options); const key = `${angles.minute.toFixed(3)}:${options.reduced}`;
    button.classList.toggle('is-reduced', Boolean(options.reduced));
    if (key === rendered) return angles; rendered = key;
    minute.style.transform = `translateX(-50%) rotate(${angles.minute}deg)`;
    hour.style.transform = `translateX(-50%) rotate(${angles.hour}deg)`; return angles;
  } };
}
function finiteAngle(value) { return ((Number.isFinite(value) ? value : 0) % FULL_TURN + FULL_TURN) % FULL_TURN; }
