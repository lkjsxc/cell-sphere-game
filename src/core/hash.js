/**
 * FNV-1a hashing for seeds, replay digests, and final run-state hashes.
 * Integer-only, allocation-light, identical everywhere.
 */

const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

/** @param {Uint8Array} bytes @param {number} [state] @returns {number} u32 */
export function fnv1aBytes(bytes, state = FNV_OFFSET) {
  let h = state >>> 0;
  for (let i = 0; i < bytes.length; i++) {
    h = (h ^ bytes[i]) >>> 0;
    h = Math.imul(h, FNV_PRIME) >>> 0;
  }
  return h >>> 0;
}

/** @param {string} str @returns {number} u32 */
export function hashStringU32(str) {
  let h = FNV_OFFSET;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h = (h ^ (c & 0xff)) >>> 0;
    h = Math.imul(h, FNV_PRIME) >>> 0;
    h = (h ^ (c >>> 8)) >>> 0;
    h = Math.imul(h, FNV_PRIME) >>> 0;
  }
  return h >>> 0;
}

/**
 * Fold a Float32Array into a running hash after quantizing each value to
 * 1/quant precision. Quantization hides irrelevant float noise while keeping
 * real divergence detectable.
 * @param {number} state running hash
 * @param {Float32Array} arr
 * @param {number} quant e.g. 1000 for 0.001 precision
 * @returns {number} u32
 */
export function hashF32(state, arr, quant) {
  let h = state >>> 0;
  for (let i = 0; i < arr.length; i++) {
    let v = Math.round(arr[i] * quant) | 0;
    h = (h ^ (v & 0xff)) >>> 0; h = Math.imul(h, FNV_PRIME) >>> 0;
    h = (h ^ ((v >>> 8) & 0xff)) >>> 0; h = Math.imul(h, FNV_PRIME) >>> 0;
    h = (h ^ ((v >>> 16) & 0xff)) >>> 0; h = Math.imul(h, FNV_PRIME) >>> 0;
    h = (h ^ ((v >>> 24) & 0xff)) >>> 0; h = Math.imul(h, FNV_PRIME) >>> 0;
  }
  return h >>> 0;
}

/** @param {number} state @param {Uint8Array} arr @returns {number} u32 */
export function hashU8(state, arr) {
  return fnv1aBytes(arr, state);
}

/** Format a u32 hash as 8 hex chars. @param {number} h */
export function hexU32(h) {
  return (h >>> 0).toString(16).padStart(8, '0');
}
