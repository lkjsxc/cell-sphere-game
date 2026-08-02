import { FEATURE, WATER } from './constants.js';
import { quantile, smoothField, sphericalField } from './noise.js';

/** Priority-flood drainage plus accumulated, connected river networks. */
export function createHydrology(rng, topo, terrain) {
  const n = topo.nodeCount;
  const wetNoise = smoothField(sphericalField(rng, topo.positions, n,
    { lobes: 7, sharpness: 2, signed: true }), topo, 2);
  const rainfall = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const equator = 1 - Math.abs(topo.positions[i * 3 + 1]);
    const oceanInfluence = 1 - terrain.coastDistance[i];
    rainfall[i] = Math.fround(Math.max(0, Math.min(1,
      0.12 + wetNoise[i] * 0.43 + oceanInfluence * 0.25 + equator * 0.16
      - terrain.ridgeStrength[i] * 0.09)));
  }
  const { filledElevation, drainTo } = priorityFlood(topo, terrain);
  const order = Array.from({ length: n }, (_, cell) => cell);
  order.sort((a, b) => filledElevation[b] - filledElevation[a] || a - b);
  const flowAccumulation = new Float32Array(n);
  const streamOrder = new Uint8Array(n); const strongest = new Uint8Array(n);
  const strongestCount = new Uint8Array(n);
  for (let i = 0; i < n; i++) if (terrain.landMask[i]) {
    flowAccumulation[i] = Math.fround(0.2 + rainfall[i] * 0.8);
  }
  for (const cell of order) {
    if (!terrain.landMask[cell]) continue;
    streamOrder[cell] = strongest[cell] + (strongestCount[cell] > 1 ? 1 : 0) || 1;
    const down = drainTo[cell];
    if (down >= 0) {
      flowAccumulation[down] = Math.fround(flowAccumulation[down] + flowAccumulation[cell]);
      const value = streamOrder[cell];
      if (value > strongest[down]) { strongest[down] = value; strongestCount[down] = 1; }
      else if (value === strongest[down]) strongestCount[down]++;
    }
  }
  const landFlows = [];
  for (let i = 0; i < n; i++) if (terrain.landMask[i]) landFlows.push(flowAccumulation[i]);
  const riverGate = quantile(landFlows, 0.86);
  let peak = riverGate;
  for (const value of landFlows) peak = Math.max(peak, value);
  const riverOrder = new Uint8Array(n); const riverStrength = new Float32Array(n);
  const featureFlags = new Uint32Array(n);
  for (let i = 0; i < n; i++) {
    if (!terrain.landMask[i] || flowAccumulation[i] < riverGate) continue;
    riverOrder[i] = streamOrder[i];
    riverStrength[i] = Math.fround(Math.min(1,
      (flowAccumulation[i] - riverGate * 0.7) / Math.max(1, peak - riverGate * 0.7)));
    terrain.waterClass[i] = WATER.RIVER;
    featureFlags[i] |= FEATURE.RIVER;
    if (riverOrder[i] < 3) featureFlags[i] |= FEATURE.TRIBUTARY;
    if (drainTo[i] >= 0 && !terrain.landMask[drainTo[i]]) featureFlags[i] |= FEATURE.RIVER_MOUTH;
  }
  const lakeId = identifyLakes(topo, terrain, filledElevation, featureFlags);
  return {
    rainfall, filledElevation, drainTo, flowAccumulation, riverOrder,
    riverStrength, lakeId, featureFlags,
  };
}

function priorityFlood(topo, terrain) {
  const n = topo.nodeCount; const filled = terrain.baseElevation.slice();
  const drain = new Int32Array(n); drain.fill(-1);
  const seen = new Uint8Array(n); const heap = [];
  for (let i = 0; i < n; i++) if (!terrain.landMask[i]) {
    seen[i] = 1; push(heap, i, filled);
  }
  while (heap.length) {
    const cell = pop(heap, filled);
    for (let p = topo.nodeStart[cell]; p < topo.nodeStart[cell + 1]; p++) {
      const next = topo.nodeNeighbors[p];
      if (seen[next]) continue;
      seen[next] = 1; drain[next] = cell;
      filled[next] = Math.fround(Math.max(filled[next], filled[cell] + 0.00001));
      push(heap, next, filled);
    }
  }
  return { filledElevation: filled, drainTo: drain };
}

function identifyLakes(topo, terrain, filled, flags) {
  const n = topo.nodeCount; const ids = new Int16Array(n); ids.fill(-1);
  const candidate = new Uint8Array(n); const seen = new Uint8Array(n);
  for (let i = 0; i < n; i++) candidate[i] = terrain.landMask[i]
    && filled[i] - terrain.baseElevation[i] > 0.003 ? 1 : 0;
  const queue = new Int32Array(n); let id = 0;
  for (let root = 0; root < n; root++) {
    if (!candidate[root] || seen[root]) continue;
    let head = 0; let tail = 1; queue[0] = root; seen[root] = 1;
    while (head < tail) {
      const cell = queue[head++];
      for (let p = topo.nodeStart[cell]; p < topo.nodeStart[cell + 1]; p++) {
        const next = topo.nodeNeighbors[p];
        if (candidate[next] && !seen[next]) { seen[next] = 1; queue[tail++] = next; }
      }
    }
    if (tail < 2 || tail > Math.max(32, n * 0.025)) continue;
    for (let i = 0; i < tail; i++) {
      const cell = queue[i]; ids[cell] = id; terrain.waterClass[cell] = WATER.LAKE;
      flags[cell] |= FEATURE.LAKE;
    }
    id++;
  }
  return ids;
}

function less(a, b, values) { return values[a] < values[b] || (values[a] === values[b] && a < b); }
function push(heap, cell, values) {
  let i = heap.length; heap.push(cell);
  while (i) {
    const parent = (i - 1) >> 1;
    if (!less(heap[i], heap[parent], values)) break;
    [heap[i], heap[parent]] = [heap[parent], heap[i]]; i = parent;
  }
}
function pop(heap, values) {
  const root = heap[0]; const last = heap.pop();
  if (heap.length) {
    heap[0] = last; let i = 0;
    while (true) {
      let child = i * 2 + 1;
      if (child >= heap.length) break;
      if (child + 1 < heap.length && less(heap[child + 1], heap[child], values)) child++;
      if (!less(heap[child], heap[i], values)) break;
      [heap[i], heap[child]] = [heap[child], heap[i]]; i = child;
    }
  }
  return root;
}
