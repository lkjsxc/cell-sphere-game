/** Deterministic weighted, bounded presentation traversal over living cells. */
import { GRAPH_UNREACHABLE, weightedGraphField } from './graph-field.js';
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
  const field = weightedGraphField({ topo, sources: [origin], maxCost: MAX_TRAVEL_MS, maxSettled: limit,
    passable: (_from, to) => alive[to] === 1, edgeCost: (from, to) => edgeCost(input, from, to, peakBiomass) });
  const reached = [];
  for (let cell = 0; cell < count; cell++) if (field.distance[cell] !== GRAPH_UNREACHABLE) {
    arrivals[cell] = field.distance[cell]; reached.push(field.distance[cell]);
  }
  return result(arrivals, origin, category, reached);
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
