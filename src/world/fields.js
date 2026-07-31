/**
 * Static environmental fields over the sphere, generated from the world seed.
 *
 * Technique: sums of radial "blob" functions w·max(0, dot(p, d))^k over
 * seeded random directions. This is seamless on the sphere (no latitude or
 * longitude artifacts), cheap to evaluate once per node, and fully
 * deterministic. Values are stored in Float32Arrays and never change during
 * a run except through the simulation's dynamic layers.
 */
import { clamp01 } from '../core/math.js';

/**
 * One procedural field: sum of seeded radial blobs.
 * @param {import('../core/prng.js').Rng} rng
 * @param {Float32Array} positions node xyz
 * @param {number} nodeCount
 * @param {{blobs: number, power: number, octaves?: number}} opts
 * @returns {Float32Array} raw values, min-max normalized to [0,1]
 */
function blobField(rng, positions, nodeCount, opts) {
  const { blobs, power, octaves = 1 } = opts;
  const out = new Float32Array(nodeCount);
  let amp = 1;
  for (let oct = 0; oct < octaves; oct++) {
    const dirs = new Float32Array(blobs * 3);
    const weights = new Float32Array(blobs);
    for (let b = 0; b < blobs; b++) {
      // Uniform-ish direction: reject tiny vectors, normalize with sqrt only.
      let x, y, z, len2;
      do {
        x = rng.range(-1, 1); y = rng.range(-1, 1); z = rng.range(-1, 1);
        len2 = x * x + y * y + z * z;
      } while (len2 < 0.05 || len2 > 1);
      const inv = 1 / Math.sqrt(len2);
      dirs[b * 3] = x * inv; dirs[b * 3 + 1] = y * inv; dirs[b * 3 + 2] = z * inv;
      weights[b] = rng.range(0.4, 1);
    }
    for (let i = 0; i < nodeCount; i++) {
      const px = positions[i * 3]; const py = positions[i * 3 + 1]; const pz = positions[i * 3 + 2];
      let v = 0;
      for (let b = 0; b < blobs; b++) {
        const d = px * dirs[b * 3] + py * dirs[b * 3 + 1] + pz * dirs[b * 3 + 2];
        if (d > 0) {
          let f = d;
          for (let p = 1; p < power; p++) f *= d; // integer power, no pow()
          v += weights[b] * f;
        }
      }
      out[i] += amp * v;
    }
    amp *= 0.5;
  }
  // Normalize to [0,1].
  let lo = Infinity; let hi = -Infinity;
  for (let i = 0; i < nodeCount; i++) {
    if (out[i] < lo) lo = out[i];
    if (out[i] > hi) hi = out[i];
  }
  const span = hi - lo || 1;
  for (let i = 0; i < nodeCount; i++) out[i] = Math.fround((out[i] - lo) / span);
  return out;
}

/**
 * Generate all static fields for a world.
 * @param {import('../core/prng.js').Rng} rng
 * @param {import('./icosphere.js').Topology} topo
 */
export function createFields(rng, topo) {
  const { positions, nodeCount } = topo;

  const altitude = blobField(rng, positions, nodeCount, { blobs: 5, power: 2, octaves: 3 });
  const nutrientNoise = blobField(rng, positions, nodeCount, { blobs: 7, power: 2, octaves: 2 });
  const moistureNoise = blobField(rng, positions, nodeCount, { blobs: 6, power: 2, octaves: 2 });
  const tempNoise = blobField(rng, positions, nodeCount, { blobs: 5, power: 2, octaves: 2 });
  const toxVuln = blobField(rng, positions, nodeCount, { blobs: 4, power: 3 });
  const eventVuln = blobField(rng, positions, nodeCount, { blobs: 4, power: 3 });

  const baseNutrient = new Float32Array(nodeCount);
  const baseMoisture = new Float32Array(nodeCount);
  const baseTemp = new Float32Array(nodeCount);

  for (let i = 0; i < nodeCount; i++) {
    const y = Math.abs(positions[i * 3 + 1]);
    // Nutrients: patchy richness; opening world is generous.
    const nn = nutrientNoise[i];
    baseNutrient[i] = Math.fround(clamp01(0.22 + 0.68 * nn * nn + 0.1 * altitude[i]));
    // Moisture: noise-driven with mild polar drying.
    baseMoisture[i] = Math.fround(clamp01(0.62 + 0.34 * (moistureNoise[i] - 0.5) - 0.18 * y));
    // Temperature: warm equator, cool poles, noise + altitude cooling.
    baseTemp[i] = Math.fround(clamp01(0.74 - 0.42 * y + 0.22 * (tempNoise[i] - 0.5) - 0.12 * altitude[i]));
  }

  // Resource sources: greedy well-separated local nutrient peaks.
  const sources = pickSources(positions, baseNutrient, nodeCount, 6);

  return Object.freeze({
    altitude, baseNutrient, baseMoisture, baseTemp, toxVuln, eventVuln,
    /** Node indices of the richest well-separated regions. */
    sources: Object.freeze(sources),
  });
}

/**
 * Score-based greedy pick: richness weighted by angular separation from
 * already-chosen sources. Avoids the deep rank descent that hard minimum-
 * distance constraints cause when rich nodes cluster in one blob patch.
 */
function pickSources(positions, nutrient, nodeCount, count) {
  const chosen = [];
  // Anchor: the single richest node.
  let anchor = 0;
  for (let i = 1; i < nodeCount; i++) if (nutrient[i] > nutrient[anchor]) anchor = i;
  chosen.push(anchor);

  // minSep[i] = smallest (1 - dot) from node i to any chosen source (0..2).
  const minSep = new Float32Array(nodeCount).fill(2);
  while (chosen.length < count) {
    const last = chosen[chosen.length - 1];
    const lx = positions[last * 3];
    const ly = positions[last * 3 + 1];
    const lz = positions[last * 3 + 2];
    let bestIdx = -1;
    let bestScore = -1;
    for (let i = 0; i < nodeCount; i++) {
      const dot = lx * positions[i * 3] + ly * positions[i * 3 + 1] + lz * positions[i * 3 + 2];
      const sep = 1 - dot;
      if (sep < minSep[i]) minSep[i] = sep;
      // Full separation credit at ~53deg or more (1 - cos53 ~ 0.6).
      let f = minSep[i] / 0.6;
      if (f > 1) f = 1;
      f = f * f;
      const score = nutrient[i] * (0.25 + 0.75 * f);
      if (score > bestScore) { bestScore = score; bestIdx = i; }
    }
    chosen.push(bestIdx);
  }
  return chosen;
}

/** @typedef {ReturnType<typeof createFields>} Fields */
