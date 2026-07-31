/**
 * Seedable PRNG: xoshiro128** 1.1 (32-bit).
 *
 * The only source of randomness allowed in simulation and content selection.
 * `Math.random` is banned in those layers. All operations are integer-only
 * (Math.imul + unsigned shifts) so sequences are identical on every engine.
 */

/** @param {number} seed arbitrary 32-bit integer @returns {Rng} */
export function createRng(seed) {
  // splitmix32 expands one integer into four well-mixed state words.
  let z = seed >>> 0;
  const splitmix = () => {
    z = (z + 0x9e3779b9) >>> 0;
    let t = z ^ (z >>> 16);
    t = Math.imul(t, 0x21f0aaad);
    t = (t ^ (t >>> 15)) >>> 0;
    t = Math.imul(t, 0x735a2d97);
    return (t ^ (t >>> 15)) >>> 0;
  };
  const s = new Uint32Array([splitmix(), splitmix(), splitmix(), splitmix()]);

  function rotl(x, k) {
    return ((x << k) | (x >>> (32 - k))) >>> 0;
  }

  function nextU32() {
    const result = Math.imul(rotl(Math.imul(s[1], 5) >>> 0, 7), 9) >>> 0;
    const t = (s[1] << 9) >>> 0;
    s[2] = (s[2] ^ s[0]) >>> 0;
    s[3] = (s[3] ^ s[1]) >>> 0;
    s[1] = (s[1] ^ s[2]) >>> 0;
    s[0] = (s[0] ^ s[3]) >>> 0;
    s[2] = (s[2] ^ t) >>> 0;
    s[3] = rotl(s[3], 11);
    return result;
  }

  return {
    /** @returns {number} unsigned 32-bit integer */
    nextU32,
    /** @returns {number} float in [0, 1) */
    float: () => nextU32() / 4294967296,
    /** @param {number} n positive integer @returns {number} int in [0, n)
     *  Modulo bias is < n/2^32 — negligible for game-scale draws. */
    intBelow: (n) => nextU32() % n,
    /** @returns {number} float in [a, b) */
    range: (a, b) => a + (b - a) * (nextU32() / 4294967296),
    /** @param {number} p probability @returns {boolean} */
    chance: (p) => nextU32() < p * 4294967296,
    /** @template T @param {readonly T[]} arr @returns {T} */
    pick: (arr) => arr[nextU32() % arr.length],
    /** Serializable state for replay/diagnostics. @returns {number[]} */
    state: () => [s[0], s[1], s[2], s[3]],
    /** @param {number[]} st */
    setState: (st) => { s[0] = st[0] >>> 0; s[1] = st[1] >>> 0; s[2] = st[2] >>> 0; s[3] = st[3] >>> 0; },
  };
}

/** @typedef {ReturnType<typeof createRng>} Rng */
