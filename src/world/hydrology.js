import { FEATURE, WATER } from './constants.js';
import { quantile, smoothField, sphericalField } from './noise.js';
import { chooseDrainageOutlets } from './drainage-basins.js';

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
  const riverGate = quantile(landFlows, 0.86); let peak = riverGate;
  for (const value of landFlows) peak = Math.max(peak, value);
  const major = traceMajorSystems(topo, terrain, drainTo, flowAccumulation, order);
  const riverOrder = new Uint8Array(n); const riverStrength = new Float32Array(n); const featureFlags = new Uint32Array(n);
  for (let i = 0; i < n; i++) {
    if (!terrain.landMask[i] || flowAccumulation[i] < riverGate && major.riverClass[i] === 0) continue;
    riverOrder[i] = streamOrder[i]; riverStrength[i] = Math.fround(Math.max(major.strength[i], Math.min(1,
      (flowAccumulation[i] - riverGate * .7) / Math.max(1, peak - riverGate * .7))));
    terrain.waterClass[i] = WATER.RIVER; featureFlags[i] |= FEATURE.RIVER;
    if (major.riverClass[i] === 2) featureFlags[i] |= FEATURE.RIVER_TRUNK;
    if (!major.riverClass[i] && riverOrder[i] < 3) { major.riverClass[i] = 1; featureFlags[i] |= FEATURE.TRIBUTARY; }
  }
  for (let cell = 0; cell < n; cell++) if (riverStrength[cell] > 0) {
    let branches = 0; let best = major.riverUpstream[cell];
    for (let p = topo.nodeStart[cell]; p < topo.nodeStart[cell + 1]; p++) { const next = topo.nodeNeighbors[p];
      if (drainTo[next] !== cell || riverStrength[next] <= 0) continue; branches++;
      if (best < 0 || flowAccumulation[next] > flowAccumulation[best]) best = next; }
    major.riverUpstream[cell] = best;
    if (branches > 1 && major.riverClass[cell] === 2) { major.riverClass[cell] = 4; featureFlags[cell] |= FEATURE.RIVER_CONFLUENCE; }
    if (major.riverClass[cell] === 3) featureFlags[cell] |= FEATURE.RIVER_HEADWATER;
    if (!terrain.landMask[drainTo[cell]]) { major.riverClass[cell] = 5; featureFlags[cell] |= FEATURE.RIVER_MOUTH | FEATURE.RIVER_DELTA; }
  }
  const lakeId = identifyLakes(topo, terrain, filledElevation, featureFlags);
  return { rainfall, filledElevation, drainTo, flowAccumulation, riverOrder, riverStrength,
    riverClass: major.riverClass, riverSystem: major.riverSystem, riverUpstream: major.riverUpstream,
    majorRivers: major.systems, lakeId, featureFlags };
}

function traceMajorSystems(topo, terrain, drainTo, flow, elevationOrder) {
  const n = topo.nodeCount; const length = new Uint16Array(n); const bestUp = new Int32Array(n); bestUp.fill(-1);
  for (let cell = 0; cell < n; cell++) if (terrain.landMask[cell]) length[cell] = 1;
  for (const cell of elevationOrder) { const down = drainTo[cell]; if (!terrain.landMask[cell] || down < 0 || !terrain.landMask[down]) continue;
    const candidate = length[cell] + 1; if (candidate > length[down] || candidate === length[down] && (bestUp[down] < 0 || flow[cell] > flow[bestUp[down]])) {
      length[down] = candidate; bestUp[down] = cell; } }
  const mouths = [];
  for (let cell = 0; cell < n; cell++) if (terrain.landMask[cell] && drainTo[cell] >= 0 && !terrain.landMask[drainTo[cell]]) mouths.push(cell);
  mouths.sort((a, b) => length[b] - length[a] || flow[b] - flow[a] || a - b);
  const target = Math.max(2, Math.min(6, Math.round(terrain.landMask.reduce((sum, value) => sum + value, 0) / 280)));
  const riverClass = new Uint8Array(n); const riverSystem = new Int16Array(n); riverSystem.fill(-1);
  const riverUpstream = new Int32Array(n); riverUpstream.fill(-1); const strength = new Float32Array(n); const systems = [];
  for (const mouth of mouths) { if (systems.length >= target || length[mouth] < 8) break;
    if (systems.some((system) => sphereDot(topo.positions, mouth, system.mouth) > .965)) continue;
    const reverse = []; let cell = mouth; while (cell >= 0) { reverse.push(cell); cell = bestUp[cell]; } const cells = reverse.reverse(); const id = systems.length;
    for (let index = 0; index < cells.length; index++) { cell = cells[index]; riverClass[cell] = index === 0 ? 3 : index === cells.length - 1 ? 5 : 2;
      riverSystem[cell] = id; riverUpstream[cell] = index ? cells[index - 1] : -1; strength[cell] = Math.fround(.14 + .72 * index / Math.max(1, cells.length - 1)); }
    systems.push(Object.freeze({ id, mouth, headwater: cells[0], length: cells.length, basinFlow: flow[mouth], cells: Uint16Array.from(cells) }));
  }
  return { riverClass, riverSystem, riverUpstream, strength, systems: Object.freeze(systems) };
}
function sphereDot(positions, a, b) { const ai = a * 3; const bi = b * 3;
  return positions[ai] * positions[bi] + positions[ai + 1] * positions[bi + 1] + positions[ai + 2] * positions[bi + 2]; }

function priorityFlood(topo, terrain) {
  const n = topo.nodeCount; const filled = terrain.baseElevation.slice(); const outlets = chooseDrainageOutlets(topo, terrain);
  const drain = new Int32Array(n); drain.fill(-1);
  const seen = new Uint8Array(n); const heap = [];
  for (let i = 0; i < n; i++) if (!terrain.landMask[i]) {
    seen[i] = 1; push(heap, i, filled);
  }
  while (heap.length) {
    const cell = pop(heap, filled);
    for (let p = topo.nodeStart[cell]; p < topo.nodeStart[cell + 1]; p++) {
      const next = topo.nodeNeighbors[p];
      if (seen[next] || !terrain.landMask[cell] && terrain.landMask[next] && !outlets[next]) continue;
      seen[next] = 1; drain[next] = cell;
      filled[next] = Math.fround(Math.max(filled[next], filled[cell] + 0.00001));
      push(heap, next, filled);
    }
  }
  for (let cell = 0; cell < n; cell++) if (terrain.landMask[cell]) {
    let best = drain[cell];
    for (let p = topo.nodeStart[cell]; p < topo.nodeStart[cell + 1]; p++) { const next = topo.nodeNeighbors[p];
      if (!terrain.landMask[next] && !outlets[cell] || filled[next] >= filled[cell] || best >= 0 && filled[next] > filled[best]) continue;
      if (best < 0 || filled[next] < filled[best] || next < best) best = next; }
    drain[cell] = best;
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
