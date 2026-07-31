/**
 * Small deterministic math helpers. Polynomial curves only — no
 * transcendentals — so results are bit-stable across engines.
 */

/** @param {number} v @param {number} lo @param {number} hi */
export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

/** @param {number} v */
export function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** @param {number} a @param {number} b @param {number} t */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/** Hermite smoothstep on a clamped [0,1] input. @param {number} t */
export function smoothstep(t) {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

/** Quintic smootherstep on a clamped [0,1] input. @param {number} t */
export function smootherstep(t) {
  const x = clamp01(t);
  return x * x * x * (x * (x * 6 - 15) + 10);
}

/**
 * Frame-rate-independent exponential approach.
 * @param {number} current @param {number} target
 * @param {number} rate half-life-style rate per second (0..1 retained per s)
 * @param {number} dtSeconds
 */
export function approach(current, target, rate, dtSeconds) {
  const keep = Math.pow(clamp01(rate), dtSeconds);
  return target + (current - target) * keep;
}

/**
 * Bell-shaped tolerance curve centered at `center` with half-width `width`.
 * Returns 1 at center, 0 at |x-center| >= width. Polynomial, deterministic.
 * Used for moisture/temperature suitability.
 */
export function tolerance(x, center, width) {
  const d = (x - center) / width;
  if (d <= -1 || d >= 1) return 0;
  const u = 1 - d * d;
  // Values this close to the boundary are float-representation noise.
  return u <= 1e-12 ? 0 : u * u;
}
