/** One frame-loop visual clock; it never owns simulation time or pause leases. */
const FULL_TURN = 360; const BASE_DURATION_MS = 2800; const MIN_DURATION_MS = 450;
const REDUCED_DURATION_MS = 60_000;
export function createTimeDialState(phase = 60) {
  return { phase: finiteAngle(phase), hourPhase: finiteAngle(phase / 12), lastNow: null };
}
export function visualDialRate(speed, reduced = false) {
  const bounded = Math.max(1, Math.min(32, Number(speed) || 1));
  const duration = (reduced ? REDUCED_DURATION_MS : BASE_DURATION_MS) / Math.sqrt(bounded);
  return FULL_TURN / Math.max(reduced ? 1 : MIN_DURATION_MS, duration);
}
export function advanceTimeDial(state, now, options = {}) {
  const time = Number.isFinite(now) ? now : state.lastNow ?? 0;
  const elapsed = state.lastNow == null ? 0 : Math.max(0, Math.min(100, time - state.lastNow));
  state.lastNow = time;
  if (options.running && !options.paused) {
    const delta = elapsed * visualDialRate(options.speed, options.reduced);
    state.phase = finiteAngle(state.phase + delta);
    state.hourPhase = finiteAngle(state.hourPhase + delta / 12);
  }
  return Object.freeze({ minute: state.phase, hour: state.hourPhase });
}
export function createTimeDial(button) {
  const state = createTimeDialState(); const minute = button.querySelector('.clock-minute');
  const hour = button.querySelector('.clock-hour'); let rendered = '';
  return { state, reset(now) { state.lastNow = Number.isFinite(now) ? now : state.lastNow; }, frame(now, options) {
    const angles = advanceTimeDial(state, now, options);
    const key = `${angles.minute.toFixed(3)}:${angles.hour.toFixed(3)}:${options.reduced}`;
    button.classList.toggle('is-reduced', Boolean(options.reduced));
    if (key === rendered) return angles; rendered = key;
    minute.style.transform = `translateX(-50%) rotate(${angles.minute}deg)`;
    hour.style.transform = `translateX(-50%) rotate(${angles.hour}deg)`; return angles;
  } };
}
function finiteAngle(value) { return ((Number.isFinite(value) ? value : 0) % FULL_TURN + FULL_TURN) % FULL_TURN; }
