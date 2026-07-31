/**
 * Boundary assertions. Cheap guards at external edges (messages, saves,
 * configuration). Internal hot loops do not call these.
 */

/** @param {unknown} cond @param {string} msg @returns {asserts cond} */
export function assert(cond, msg) {
  if (!cond) throw new Error(`assertion failed: ${msg}`);
}

/** @param {unknown} v @param {string} what @returns {asserts v is number} */
export function assertFiniteNumber(v, what) {
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    throw new Error(`assertion failed: ${what} must be a finite number, got ${v}`);
  }
}

/** @param {unknown} v @param {string} what @returns {asserts v is number} */
export function assertIntInRange(v, lo, hi, what) {
  if (!Number.isInteger(v) || v < lo || v > hi) {
    throw new Error(`assertion failed: ${what} must be int in [${lo}, ${hi}], got ${v}`);
  }
}
