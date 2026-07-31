/**
 * Human-readable seed codes.
 *
 * A world seed is 30 bits (over a billion distinct worlds). It is encoded as
 * six Crockford-base32 characters displayed as "ABC-DEF": easy to read aloud,
 * type on a phone, and share. Decoding is case-insensitive and forgives the
 * classic confusables (I/L -> 1, O -> 0).
 */

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // 32 chars, no I L O U
const DECODE_MAP = (() => {
  const m = new Int8Array(128).fill(-1);
  for (let i = 0; i < ALPHABET.length; i++) m[ALPHABET.charCodeAt(i)] = i;
  m['I'.charCodeAt(0)] = 1; m['L'.charCodeAt(0)] = 1; m['O'.charCodeAt(0)] = 0;
  return m;
})();

export const SEED_BITS = 30;
export const SEED_MAX = 1 << SEED_BITS; // exclusive

/** @param {number} seed integer in [0, 2^30) @returns {string} "ABC-DEF" */
export function encodeSeedCode(seed) {
  if (!Number.isInteger(seed) || seed < 0 || seed >= SEED_MAX) {
    throw new RangeError(`seed out of range: ${seed}`);
  }
  let v = seed;
  const chars = new Array(6);
  for (let i = 5; i >= 0; i--) {
    chars[i] = ALPHABET[v & 31];
    v = Math.floor(v / 32);
  }
  return `${chars[0]}${chars[1]}${chars[2]}-${chars[3]}${chars[4]}${chars[5]}`;
}

/** @param {string} code @returns {number|null} seed or null if invalid */
export function decodeSeedCode(code) {
  if (typeof code !== 'string') return null;
  const clean = code.toUpperCase().replace(/[\s-]/g, '');
  if (clean.length !== 6) return null;
  let v = 0;
  for (let i = 0; i < 6; i++) {
    const c = clean.charCodeAt(i);
    const d = c < 128 ? DECODE_MAP[c] : -1;
    if (d < 0) return null;
    v = v * 32 + d;
  }
  return v;
}

/** @param {import('./prng.js').Rng} rng @returns {number} seed in [0, 2^30) */
export function randomSeed(rng) {
  return rng.nextU32() & (SEED_MAX - 1);
}
