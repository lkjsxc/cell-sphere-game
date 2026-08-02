import { ARCHETYPE, WATER } from './constants.js';
import { quantile, smoothField, sphericalField } from './noise.js';

/** Build coherent land plates, ridges, ocean classes, and coast distances. */
export function createTerrain(rng, topo) {
  const { nodeCount: n, positions } = topo;
  const archetype = 1 + rng.intBelow(3);
  const broadLobes = archetype === ARCHETYPE.CONTINENTAL ? 4 : 6;
  const broad = sphericalField(rng, positions, n, { lobes: broadLobes, sharpness: 2 });
  const detail = sphericalField(rng, positions, n, { lobes: 9, sharpness: 3, signed: true });
  const ridgeNoise = sphericalField(rng, positions, n, { lobes: 6, sharpness: 4, signed: true });
  const raw = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const ridge = 1 - Math.abs(ridgeNoise[i] * 2 - 1);
    raw[i] = Math.fround(broad[i] * 0.72 + detail[i] * 0.16 + ridge * ridge * 0.12);
  }
  const baseElevation = normalize(smoothField(raw, topo, 2));
  const landTarget = 0.42 + rng.float() * 0.14;
  const seaLevel = Math.fround(quantile(baseElevation, 1 - landTarget));
  const landMask = new Uint8Array(n);
  for (let i = 0; i < n; i++) landMask[i] = baseElevation[i] > seaLevel ? 1 : 0;
  removeSpecks(landMask, topo, 3);

  const altitude = baseElevation.slice();
  const oceanDepth = new Float32Array(n);
  const ridgeStrength = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    oceanDepth[i] = landMask[i] ? 0 : Math.fround(Math.min(1,
      (seaLevel - baseElevation[i]) / Math.max(0.08, seaLevel)));
    let relief = 0;
    for (let p = topo.nodeStart[i]; p < topo.nodeStart[i + 1]; p++) {
      relief = Math.max(relief, Math.abs(baseElevation[i] - baseElevation[topo.nodeNeighbors[p]]));
    }
    const crest = 1 - Math.abs(ridgeNoise[i] * 2 - 1);
    ridgeStrength[i] = landMask[i]
      ? Math.fround(Math.min(1, relief * 8 + crest * crest * 0.55)) : 0;
  }

  const coastDistance = distanceFromBoundary(landMask, topo);
  const waterClass = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    if (landMask[i]) waterClass[i] = WATER.LAND;
    else waterClass[i] = oceanDepth[i] > 0.34 ? WATER.DEEP_OCEAN : WATER.SHALLOW_OCEAN;
  }
  return {
    archetype, seaLevel, landMask, waterClass, altitude, baseElevation,
    oceanDepth, coastDistance, ridgeStrength,
  };
}

function normalize(values) {
  let lo = Infinity; let hi = -Infinity;
  for (let i = 0; i < values.length; i++) {
    lo = Math.min(lo, values[i]); hi = Math.max(hi, values[i]);
  }
  const out = new Float32Array(values.length); const span = hi - lo || 1;
  for (let i = 0; i < values.length; i++) out[i] = Math.fround((values[i] - lo) / span);
  return out;
}

function removeSpecks(mask, topo, limit) {
  const seen = new Uint8Array(mask.length); const queue = new Int32Array(mask.length);
  for (let root = 0; root < mask.length; root++) {
    if (!mask[root] || seen[root]) continue;
    let head = 0; let tail = 1; queue[0] = root; seen[root] = 1;
    while (head < tail) {
      const cell = queue[head++];
      for (let p = topo.nodeStart[cell]; p < topo.nodeStart[cell + 1]; p++) {
        const next = topo.nodeNeighbors[p];
        if (mask[next] && !seen[next]) { seen[next] = 1; queue[tail++] = next; }
      }
    }
    if (tail <= limit) for (let i = 0; i < tail; i++) mask[queue[i]] = 0;
  }
}

function distanceFromBoundary(mask, topo) {
  const n = mask.length; const distance = new Int16Array(n); distance.fill(-1);
  const queue = new Int32Array(n); let head = 0; let tail = 0;
  for (let i = 0; i < n; i++) {
    for (let p = topo.nodeStart[i]; p < topo.nodeStart[i + 1]; p++) {
      if (mask[i] !== mask[topo.nodeNeighbors[p]]) {
        distance[i] = 0; queue[tail++] = i; break;
      }
    }
  }
  while (head < tail) {
    const cell = queue[head++];
    for (let p = topo.nodeStart[cell]; p < topo.nodeStart[cell + 1]; p++) {
      const next = topo.nodeNeighbors[p];
      if (distance[next] < 0 && mask[next] === mask[cell]) {
        distance[next] = distance[cell] + 1; queue[tail++] = next;
      }
    }
  }
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = Math.fround(Math.min(1, distance[i] / 12));
  return out;
}
