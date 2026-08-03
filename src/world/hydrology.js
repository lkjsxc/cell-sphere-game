import { FEATURE, WATER } from './constants.js';
import { smoothField, sphericalField } from './noise.js';
import { chooseDrainageOutlets } from './drainage-basins.js';

/** Private drainage analysis projected into connected whole-cell lakes. */
export function createHydrology(rng, topo, terrain) {
  const rainfall = createRainfall(rng, topo, terrain);
  const { filledElevation, drainTo } = priorityFlood(topo, terrain);
  const drainage = accumulateDrainage(topo, terrain, rainfall, filledElevation, drainTo);
  return buildLakes(topo, terrain, rainfall, filledElevation, drainTo, drainage);
}

function createRainfall(rng, topo, terrain) {
  const n = topo.nodeCount;
  const wetNoise = smoothField(sphericalField(rng, topo.positions, n,
    { lobes: 7, sharpness: 2, signed: true }), topo, 2);
  const rainfall = new Float32Array(n);
  for (let cell = 0; cell < n; cell++) {
    const equator = 1 - Math.abs(topo.positions[cell * 3 + 1]);
    const oceanInfluence = 1 - terrain.coastDistance[cell];
    rainfall[cell] = Math.fround(clamp(.12 + wetNoise[cell] * .43
      + oceanInfluence * .25 + equator * .16 - terrain.ridgeStrength[cell] * .09));
  }
  return rainfall;
}

function accumulateDrainage(topo, terrain, rainfall, filled, drainTo) {
  const order = Array.from({ length: topo.nodeCount }, (_, cell) => cell)
    .sort((a, b) => filled[b] - filled[a] || a - b);
  const flow = new Float32Array(topo.nodeCount); const catchment = new Uint32Array(topo.nodeCount);
  for (let cell = 0; cell < topo.nodeCount; cell++) if (terrain.landMask[cell]) {
    flow[cell] = Math.fround(.2 + rainfall[cell] * .8); catchment[cell] = 1;
  }
  for (const cell of order) {
    if (!terrain.landMask[cell]) continue; const down = drainTo[cell];
    if (down < 0) continue;
    flow[down] = Math.fround(flow[down] + flow[cell]); catchment[down] += catchment[cell];
  }
  return { flow, catchment };
}

function buildLakes(topo, terrain, rainfall, filled, drainTo, drainage) {
  const n = topo.nodeCount; const lakeId = new Int16Array(n); lakeId.fill(-1);
  const lakeDepth = new Float32Array(n); const lakeShore = new Uint8Array(n);
  const freshwaterInfluence = new Float32Array(n); const featureFlags = new Uint32Array(n);
  const candidates = lakeCandidates(topo, terrain, rainfall, filled, drainage.flow);
  const landCount = terrain.landMask.reduce((sum, value) => sum + value, 0);
  const target = Math.max(5, Math.min(8, Math.round(landCount / 190)));
  const reserved = new Uint8Array(n); const selected = [];
  for (const candidate of candidates) {
    if (selected.length >= target) break;
    if (reserved[candidate.root] || !terrain.landMask[candidate.root]) continue;
    const hash = cellHash(candidate.root, Math.round(drainage.flow[candidate.root] * 256));
    const desired = 3 + hash % 16;
    const cells = growLake(candidate.root, desired, topo, terrain, filled, drainage.flow, reserved);
    if (cells.length < 3) continue;
    const id = selected.length; for (const cell of cells) lakeId[cell] = id;
    reserveSeparation(cells, reserved, topo, 2); selected.push({ id, cells });
  }
  const records = selected.map((lake) => describeLake(lake, topo, terrain, rainfall,
    filled, drainTo, drainage, lakeId, lakeDepth));
  for (const record of records) {
    for (const cell of record.cells) { terrain.waterClass[cell] = WATER.LAKE; featureFlags[cell] |= FEATURE.LAKE; }
    if (record.outletCell >= 0) featureFlags[record.outletCell] |= FEATURE.LAKE_OUTLET;
    if (record.type === 'glacial') for (const cell of record.cells) featureFlags[cell] |= FEATURE.GLACIAL_LAKE;
  }
  const completed = records.map((record) => addShoreEcology(record, topo, terrain, rainfall,
    lakeId, lakeShore, freshwaterInfluence, featureFlags));
  return { lakeId, lakeDepth, lakeShore, freshwaterInfluence,
    lakes: Object.freeze(completed), featureFlags };
}

function lakeCandidates(topo, terrain, rainfall, filled, flow) {
  const n = topo.nodeCount; const depression = new Float32Array(n); const seen = new Uint8Array(n);
  for (let cell = 0; cell < n; cell++) depression[cell] = terrain.landMask[cell]
    ? Math.max(0, filled[cell] - terrain.baseElevation[cell]) : 0;
  const queue = new Int32Array(n); const candidates = []; const roots = new Set();
  for (let root = 0; root < n; root++) {
    if (seen[root] || depression[root] <= .0015) continue;
    let head = 0; let tail = 1; queue[0] = root; seen[root] = 1; let best = root;
    while (head < tail) { const cell = queue[head++];
      if (depression[cell] > depression[best] || depression[cell] === depression[best] && flow[cell] > flow[best]) best = cell;
      for (let offset = topo.nodeStart[cell]; offset < topo.nodeStart[cell + 1]; offset++) {
        const next = topo.nodeNeighbors[offset];
        if (!seen[next] && depression[next] > .0015) { seen[next] = 1; queue[tail++] = next; }
      }
    }
    roots.add(best); candidates.push({ root: best, score: 4 + depression[best] * 40 + Math.min(2, flow[best] * .02) });
  }
  for (let cell = 0; cell < n; cell++) if (terrain.landMask[cell] && terrain.coastDistance[cell] > 0 && !roots.has(cell)) {
    let neighborMean = 0; const degree = topo.nodeStart[cell + 1] - topo.nodeStart[cell];
    for (let offset = topo.nodeStart[cell]; offset < topo.nodeStart[cell + 1]; offset++) neighborMean += terrain.baseElevation[topo.nodeNeighbors[offset]];
    const concavity = Math.max(0, neighborMean / degree - terrain.baseElevation[cell]);
    const score = depression[cell] * 32 + concavity * 18 + rainfall[cell] * .7
      + Math.min(1.5, flow[cell] * .012) - terrain.ridgeStrength[cell] * .35;
    candidates.push({ root: cell, score });
  }
  return candidates.sort((a, b) => b.score - a.score || a.root - b.root);
}

function growLake(root, desired, topo, terrain, filled, flow, reserved) {
  const cells = []; const chosen = new Uint8Array(topo.nodeCount); const frontier = new Set([root]);
  while (cells.length < desired && frontier.size) {
    let best = -1; let bestScore = Infinity;
    for (const cell of frontier) {
      if (reserved[cell] || chosen[cell] || !terrain.landMask[cell] || terrain.coastDistance[cell] === 0) continue;
      const depression = Math.max(0, filled[cell] - terrain.baseElevation[cell]);
      const score = terrain.baseElevation[cell] + terrain.ridgeStrength[cell] * .035
        - depression * .7 - Math.min(.02, flow[cell] * .0002) + (cellHash(root, cell) % 101) * 1e-7;
      if (score < bestScore || score === bestScore && cell < best) { best = cell; bestScore = score; }
    }
    if (best < 0) break; frontier.delete(best); chosen[best] = 1; cells.push(best);
    for (let offset = topo.nodeStart[best]; offset < topo.nodeStart[best + 1]; offset++) {
      const next = topo.nodeNeighbors[offset]; if (!chosen[next]) frontier.add(next);
    }
  }
  return cells.sort((a, b) => a - b);
}

function reserveSeparation(cells, reserved, topo, radius) {
  const queue = cells.map((cell) => [cell, 0]); const seen = new Set(cells);
  for (let head = 0; head < queue.length; head++) { const [cell, distance] = queue[head]; reserved[cell] = 1;
    if (distance >= radius) continue;
    for (let offset = topo.nodeStart[cell]; offset < topo.nodeStart[cell + 1]; offset++) {
      const next = topo.nodeNeighbors[offset]; if (!seen.has(next)) { seen.add(next); queue.push([next, distance + 1]); }
    }
  }
}

function describeLake(lake, topo, terrain, rainfall, filled, drainTo, drainage, ids, depths) {
  let surface = 0; for (const cell of lake.cells) surface = Math.max(surface, filled[cell], terrain.baseElevation[cell] + .003);
  let minDepth = Infinity; let maxDepth = 0; let depthSum = 0; let rainSum = 0; let latitude = 0; let ridge = 0;
  let outletCell = -1; let outflowCell = -1;
  for (const cell of lake.cells) {
    const depth = Math.max(.002, surface - terrain.baseElevation[cell]); depths[cell] = Math.fround(depth);
    minDepth = Math.min(minDepth, depth); maxDepth = Math.max(maxDepth, depth); depthSum += depth;
    rainSum += rainfall[cell]; latitude += Math.abs(topo.positions[cell * 3 + 1]); ridge += terrain.ridgeStrength[cell];
    const down = drainTo[cell]; if (down >= 0 && ids[down] !== lake.id
      && (outletCell < 0 || filled[down] < filled[outflowCell] || filled[down] === filled[outflowCell] && cell < outletCell)) {
      outletCell = cell; outflowCell = down;
    }
  }
  const area = lake.cells.length; const meanDepth = depthSum / area; const meanRain = rainSum / area;
  const catchment = Math.max(area, outletCell >= 0 ? drainage.catchment[outletCell] : area);
  const flowRatio = outletCell >= 0 ? drainage.flow[outletCell] / area : 0;
  const outletStatus = flowRatio > .85 ? 'open' : meanRain > .42 ? 'seasonal' : 'closed';
  const salinity = outletStatus === 'open' ? 'fresh' : outletStatus === 'seasonal' && meanRain > .5 ? 'fresh'
    : outletStatus === 'seasonal' ? 'brackish' : meanRain > .55 ? 'brackish' : 'saline';
  const type = latitude / area > .7 || surface - terrain.seaLevel > .48 ? 'glacial'
    : meanDepth < .013 ? 'marsh' : outletStatus === 'closed' ? 'salt-basin'
      : ridge / area > .5 || maxDepth > .09 ? 'rift' : 'rain-fed';
  return { id: lake.id, cells: lake.cells, area, areaClass: area <= 5 ? 'small' : area <= 12 ? 'medium' : 'large',
    minDepth, meanDepth, maxDepth, depthClass: maxDepth < .025 ? 'shallow' : maxDepth < .075 ? 'middle' : 'deep',
    surfaceElevation: surface, catchment, outletCell, outflowCell, outletStatus, type, salinity };
}

function addShoreEcology(record, topo, terrain, rainfall, ids, shore, influence, flags) {
  const shoreSet = new Set();
  for (const cell of record.cells) for (let offset = topo.nodeStart[cell]; offset < topo.nodeStart[cell + 1]; offset++) {
    const next = topo.nodeNeighbors[offset]; if (terrain.landMask[next] && ids[next] < 0) shoreSet.add(next);
  }
  const shoreCells = [...shoreSet].sort((a, b) => a - b);
  for (const cell of shoreCells) { shore[cell] = 1; flags[cell] |= FEATURE.LAKE_SHORE; }
  const wetlandCells = shoreCells.slice().sort((a, b) => wetlandScore(b) - wetlandScore(a) || a - b)
    .slice(0, Math.max(1, Math.round(shoreCells.length * (.24 + meanRain() * .22)))).sort((a, b) => a - b);
  for (const cell of wetlandCells) flags[cell] |= FEATURE.WETLAND;
  const sourceStrength = record.salinity === 'fresh' ? 1 : record.salinity === 'brackish' ? .76 : .5;
  spreadInfluence(record.cells, sourceStrength, topo, influence);
  for (const cell of wetlandCells) influence[cell] = Math.fround(Math.max(influence[cell], sourceStrength * .82));
  return Object.freeze({ ...record, cells: Object.freeze(record.cells.slice()),
    shoreCells: Object.freeze(shoreCells), wetlandCells: Object.freeze(wetlandCells) });
  function meanRain() { return record.cells.reduce((sum, cell) => sum + rainfall[cell], 0) / record.area; }
  function wetlandScore(cell) { return rainfall[cell] * .65 + (1 - terrain.baseElevation[cell]) * .25
    + (cell === record.outflowCell ? .2 : 0) + (cellHash(record.id, cell) % 97) * 1e-6; }
}

function spreadInfluence(sources, strength, topo, influence) {
  const falloff = [1, .78, .5, .28, .12]; const queue = sources.map((cell) => [cell, 0]); const seen = new Set(sources);
  for (let head = 0; head < queue.length; head++) { const [cell, distance] = queue[head];
    influence[cell] = Math.fround(Math.max(influence[cell], strength * falloff[distance]));
    if (distance === falloff.length - 1) continue;
    for (let offset = topo.nodeStart[cell]; offset < topo.nodeStart[cell + 1]; offset++) {
      const next = topo.nodeNeighbors[offset]; if (!seen.has(next)) { seen.add(next); queue.push([next, distance + 1]); }
    }
  }
}

function priorityFlood(topo, terrain) {
  const n = topo.nodeCount; const filled = terrain.baseElevation.slice(); const outlets = chooseDrainageOutlets(topo, terrain);
  const drain = new Int32Array(n); drain.fill(-1); const seen = new Uint8Array(n); const heap = [];
  for (let cell = 0; cell < n; cell++) if (!terrain.landMask[cell]) { seen[cell] = 1; push(heap, cell, filled); }
  while (heap.length) { const cell = pop(heap, filled);
    for (let offset = topo.nodeStart[cell]; offset < topo.nodeStart[cell + 1]; offset++) { const next = topo.nodeNeighbors[offset];
      if (seen[next] || !terrain.landMask[cell] && terrain.landMask[next] && !outlets[next]) continue;
      seen[next] = 1; drain[next] = cell; filled[next] = Math.fround(Math.max(filled[next], filled[cell] + .00001)); push(heap, next, filled);
    }
  }
  for (let cell = 0; cell < n; cell++) if (terrain.landMask[cell]) { let best = drain[cell];
    for (let offset = topo.nodeStart[cell]; offset < topo.nodeStart[cell + 1]; offset++) { const next = topo.nodeNeighbors[offset];
      if (!terrain.landMask[next] && !outlets[cell] || filled[next] >= filled[cell] || best >= 0 && filled[next] > filled[best]) continue;
      if (best < 0 || filled[next] < filled[best] || next < best) best = next;
    }
    drain[cell] = best;
  }
  return { filledElevation: filled, drainTo: drain };
}

function cellHash(a, b) { let value = (Math.imul(a + 1, 0x9e3779b1) ^ Math.imul(b + 7, 0x85ebca6b)) >>> 0;
  value ^= value >>> 16; value = Math.imul(value, 0x7feb352d); value ^= value >>> 15; return value >>> 0; }
function less(a, b, values) { return values[a] < values[b] || values[a] === values[b] && a < b; }
function push(heap, cell, values) { let index = heap.length; heap.push(cell);
  while (index) { const parent = (index - 1) >> 1; if (!less(heap[index], heap[parent], values)) break;
    [heap[index], heap[parent]] = [heap[parent], heap[index]]; index = parent; } }
function pop(heap, values) { const root = heap[0]; const last = heap.pop();
  if (heap.length) { heap[0] = last; let index = 0;
    while (true) { let child = index * 2 + 1; if (child >= heap.length) break;
      if (child + 1 < heap.length && less(heap[child + 1], heap[child], values)) child++;
      if (!less(heap[child], heap[index], values)) break;
      [heap[index], heap[child]] = [heap[child], heap[index]]; index = child; } }
  return root; }
function clamp(value) { return Math.max(0, Math.min(1, value)); }
