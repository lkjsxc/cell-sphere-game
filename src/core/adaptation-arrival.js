/** Deterministic weighted, bounded presentation traversal over living cells. */
export const ADAPTATION_ARRIVAL_VERSION = 1;
export const ADAPTATION_UNREACHABLE = 0xffff;
const FRACTION = Object.freeze({ reach: .40, metabolism: .30, resilience: .34,
  transport: .28, ecology: .36, perception: .40 });
const MAX_TRAVEL_MS = 1600;

export function computeAdaptationArrivals(input) {
  const { topo, alive, biomass, stress, energy, fields, category = 'reach' } = input;
  const origin = input.originCell; const count = topo.nodeCount;
  const arrivals = new Uint16Array(count); arrivals.fill(ADAPTATION_UNREACHABLE);
  if (!Number.isInteger(origin) || origin < 0 || origin >= count || alive?.[origin] !== 1) {
    return result(arrivals, origin, category, []);
  }
  let living = 0; let peakBiomass = .001;
  for (let i = 0; i < count; i++) if (alive[i] === 1) {
    living++; if (biomass[i] > peakBiomass) peakBiomass = biomass[i];
  }
  const limit = living <= 24 ? living : Math.max(12, Math.ceil(living * (FRACTION[category] ?? .34)));
  const heapCapacity = topo.edgeCount ? topo.edgeCount * 2 + 1 : count * 8;
  const heapCells = new Uint16Array(heapCapacity); const heapCosts = new Uint32Array(heapCapacity);
  const settled = new Uint8Array(count); let heapSize = 0; const reached = [];
  arrivals[origin] = 0; push(origin, 0);
  while (heapSize && reached.length < limit) {
    const [cell, cost] = pop();
    if (cost !== arrivals[cell] || cost > MAX_TRAVEL_MS || settled[cell]) continue;
    settled[cell] = 1; reached.push(cost);
    for (let o = topo.nodeStart[cell]; o < topo.nodeStart[cell + 1]; o++) {
      const next = topo.nodeNeighbors[o]; if (alive[next] !== 1) continue;
      const candidate = cost + edgeCost(input, cell, next, peakBiomass);
      if (candidate > MAX_TRAVEL_MS || candidate >= arrivals[next]) continue;
      arrivals[next] = candidate; push(next, candidate);
    }
  }
  for (let i = 0; i < count; i++) if (!settled[i]) arrivals[i] = ADAPTATION_UNREACHABLE;
  return result(arrivals, origin, category, reached);

  function less(aCost, aCell, bCost, bCell) {
    return aCost < bCost || (aCost === bCost && aCell < bCell);
  }
  function push(cell, cost) {
    let i = heapSize++; heapCells[i] = cell; heapCosts[i] = cost;
    while (i > 0) { const p = (i - 1) >> 1;
      if (!less(cost, cell, heapCosts[p], heapCells[p])) break;
      heapCells[i] = heapCells[p]; heapCosts[i] = heapCosts[p]; i = p;
      heapCells[i] = cell; heapCosts[i] = cost;
    }
  }
  function pop() {
    const cell = heapCells[0]; const cost = heapCosts[0]; const size = --heapSize;
    if (size >= 0) { const tailCell = heapCells[size]; const tailCost = heapCosts[size]; let i = 0;
      while (true) { const left = i * 2 + 1; if (left >= size) break; const right = left + 1;
        let child = right < size && less(heapCosts[right], heapCells[right], heapCosts[left], heapCells[left]) ? right : left;
        if (!less(heapCosts[child], heapCells[child], tailCost, tailCell)) break;
        heapCells[i] = heapCells[child]; heapCosts[i] = heapCosts[child]; i = child;
      }
      if (size > 0) { heapCells[i] = tailCell; heapCosts[i] = tailCost; }
    }
    return [cell, cost];
  }
}

function edgeCost(input, from, to, peakBiomass) {
  const { topo, biomass, stress, energy, fields, category = 'reach', salt = 0 } = input;
  const bio = clamp(biomass[to] / peakBiomass); const strain = clamp(stress[to]);
  const fed = clamp((energy?.[to] ?? 0) / 3); const degree = livingDegree(topo, input.alive, to);
  const moisture = fields?.baseMoisture?.[to] ?? .5; const nutrient = fields?.baseNutrient?.[to] ?? .5;
  const forest = fields?.forestDensity?.[to] ?? 0; const river = fields?.riverStrength?.[to] ?? 0;
  const altitude = fields?.altitude?.[to] ?? .4;
  let cost = 116 + variation(from, to, salt);
  if (category === 'reach') cost += (degree >= 5 ? 30 : -22) + (1 - moisture) * 34 + (1 - bio) * 24;
  else if (category === 'metabolism') cost += (1 - bio) * 125 + (1 - fed) * 95 + strain * 28;
  else if (category === 'resilience') cost += (1 - strain) * 52 + (strain > .82 ? 82 : 0) + (1 - bio) * 42;
  else if (category === 'transport') cost += (5 - degree) * 28 + (1 - bio) * 76 - Math.min(28, degree * 7);
  else if (category === 'ecology') cost += (1 - moisture) * 72 + (1 - forest) * 38
    + Math.max(0, altitude - .72) * 90 - river * 36 - nutrient * 24;
  else cost += (1 - bio) * 30 + strain * 18 - degree * 5;
  if (degree <= 1 && category !== 'reach') cost += 48;
  return Math.max(42, Math.min(360, Math.round(cost)));
}

function livingDegree(topo, alive, cell) {
  let degree = 0;
  for (let o = topo.nodeStart[cell]; o < topo.nodeStart[cell + 1]; o++) degree += alive[topo.nodeNeighbors[o]] === 1;
  return degree;
}
function variation(a, b, salt) {
  let x = (Math.imul(a + 1, 0x9e3779b1) ^ Math.imul(b + 7, 0x85ebca6b) ^ salt) >>> 0;
  x ^= x >>> 16; x = Math.imul(x, 0x7feb352d); x ^= x >>> 15;
  return (x >>> 0) % 37;
}
function clamp(value) { return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)); }
function result(arrivals, originCell, category, reached) {
  reached.sort((a, b) => a - b); const affectedCount = reached.length;
  return { version: ADAPTATION_ARRIVAL_VERSION, arrivals, originCell, category,
    affectedCount, minArrival: affectedCount ? reached[0] : 0,
    medianArrival: affectedCount ? reached[Math.floor(affectedCount / 2)] : 0,
    maxArrival: affectedCount ? reached.at(-1) : 0 };
}
