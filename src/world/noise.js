import { createRng } from '../core/prng.js';

/** Derive all subsystem streams up front, so later draw counts stay isolated. */
export function deriveWorldStreams(rng) {
  const salts = [0x8042ca99, 0x85a308d3, 0xd2dc19cf, 0x03707344];
  return salts.map((salt) => createRng((rng.nextU32() ^ salt) >>> 0));
}

function direction(rng) {
  let x; let y; let z; let d;
  do {
    x = rng.range(-1, 1); y = rng.range(-1, 1); z = rng.range(-1, 1);
    d = x * x + y * y + z * z;
  } while (d < 0.08 || d > 1);
  const inv = 1 / Math.sqrt(d);
  return [x * inv, y * inv, z * inv];
}

/** Seamless broad spherical kernels, normalized and Float32-quantized. */
export function sphericalField(rng, positions, count, options = {}) {
  const lobes = options.lobes ?? 7;
  const sharpness = options.sharpness ?? 2;
  const signed = options.signed ?? false;
  const dirs = Array.from({ length: lobes }, () => direction(rng));
  const weights = dirs.map(() => rng.range(signed ? -1 : 0.35, 1));
  const out = new Float32Array(count);
  let lo = Infinity; let hi = -Infinity;
  for (let i = 0; i < count; i++) {
    const x = positions[i * 3]; const y = positions[i * 3 + 1]; const z = positions[i * 3 + 2];
    let value = 0;
    for (let k = 0; k < lobes; k++) {
      let dot = x * dirs[k][0] + y * dirs[k][1] + z * dirs[k][2];
      if (!signed && dot < 0) dot = 0;
      let kernel = dot;
      for (let p = 1; p < sharpness; p++) kernel *= Math.abs(dot);
      value += kernel * weights[k];
    }
    out[i] = value;
    if (value < lo) lo = value;
    if (value > hi) hi = value;
  }
  const span = hi - lo || 1;
  for (let i = 0; i < count; i++) out[i] = Math.fround((out[i] - lo) / span);
  return out;
}

/** Deterministic graph blur; useful for climate and continent-scale coherence. */
export function smoothField(input, topo, passes) {
  let current = input;
  for (let pass = 0; pass < passes; pass++) {
    const next = new Float32Array(topo.nodeCount);
    for (let i = 0; i < topo.nodeCount; i++) {
      let sum = current[i] * 2; let weight = 2;
      for (let p = topo.nodeStart[i]; p < topo.nodeStart[i + 1]; p++) {
        sum += current[topo.nodeNeighbors[p]]; weight++;
      }
      next[i] = Math.fround(sum / weight);
    }
    current = next;
  }
  return current;
}

export function quantile(values, fractionBelow) {
  const ordered = Array.from(values, (value, cell) => ({ value, cell }));
  ordered.sort((a, b) => a.value - b.value || a.cell - b.cell);
  const index = Math.max(0, Math.min(ordered.length - 1,
    Math.floor(fractionBelow * ordered.length)));
  return ordered[index].value;
}
