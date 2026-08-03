/** Deterministic terrain-aware graph event scheduling and cell fields. */
import { BALANCE as B } from '../game/balance.js';
import { EVENT_FAMILIES } from '../game/events-content.js';
import { GRAPH_UNREACHABLE, weightedGraphField } from '../core/graph-field.js';
import { smootherstep } from '../core/math.js';
export const EVENT_FIELD_VERSION = 2; export const EVENT_UNREACHABLE = 0xffff;
const LAND_BOUND = new Set(['drought', 'bloom', 'blight']); const MAX_ARRIVAL_TICKS = 15;
export function scheduleEvents(rng, topo, fields, challenge) {
  const volatile = challenge?.id === 'volatile'; const count = 6 + rng.intBelow(3) + (volatile ? 3 : 0);
  const intensityMod = (volatile ? 1.35 : 1) * (challenge?.eventIntensity ?? 1);
  const byVuln = Array.from({ length: topo.nodeCount }, (_, cell) => cell)
    .sort((a, b) => fields.eventVuln[b] - fields.eventVuln[a] || a - b).slice(0, 180);
  const events = []; let lastFamily = ''; const windowStart = 700; const windowEnd = 2850;
  const step = (windowEnd - windowStart) / count;
  for (let index = 0; index < count; index++) {
    const family = drawFamily(rng, lastFamily); lastFamily = family.id;
    const startTick = Math.round(windowStart + index * step + rng.range(-.35, .35) * step);
    const peakTick = startTick + 60; const releaseEndTick = peakTick + 60 + rng.intBelow(90) + 90;
    const center = chooseCenter(byVuln, fields, family.id, rng); const travelBudget = 720 + rng.intBelow(241);
    const field = computeEventField(topo, fields, family.id, center, travelBudget, index);
    const maxArrival = field.arrivalTicks.length ? Math.max(...field.arrivalTicks) : 0;
    events.push({ id: index, family: family.id, nameJa: family.nameJa, descJa: family.descJa,
      kind: family.kind, amount: family.amount, crisis: family.crisis, startTick, peakTick,
      releaseEndTick, endTick: releaseEndTick + maxArrival, center, travelBudget,
      intensity: Math.fround(rng.range(.7, 1.15) * intensityMod), ...field, announced: 0 });
  }
  events.sort((a, b) => a.startTick - b.startTick || a.id - b.id); return events;
}
export function computeEventField(topo, fields, family, center, travelBudget = 840, salt = 0) {
  const wind = windVector(topo.positions, center, salt); const landBound = LAND_BOUND.has(family);
  const graph = weightedGraphField({ topo, sources: [center], maxCost: travelBudget,
    passable: (_from, to) => !landBound || fields.landMask[to] === 1,
    edgeCost: (from, to) => eventEdgeCost(topo, fields, family, from, to, wind, salt) });
  const nodes = []; const falloff = []; const arrivalTicks = []; const arrivalCost = new Uint16Array(topo.nodeCount); arrivalCost.fill(EVENT_UNREACHABLE);
  for (let cell = 0; cell < topo.nodeCount; cell++) { const cost = graph.distance[cell]; if (cost === GRAPH_UNREACHABLE) continue;
    nodes.push(cell); arrivalCost[cell] = Math.min(EVENT_UNREACHABLE - 1, cost); arrivalTicks.push(Math.min(MAX_ARRIVAL_TICKS, Math.round(cost * MAX_ARRIVAL_TICKS / travelBudget)));
    const normalized = Math.max(0, 1 - cost / travelBudget); falloff.push(Math.fround(Math.max(.018, normalized * normalized * .42))); }
  return { fieldVersion: EVENT_FIELD_VERSION, nodes: Uint16Array.from(nodes), falloff: Float32Array.from(falloff),
    arrivalCost, arrivalTicks: Uint8Array.from(arrivalTicks), predecessor: graph.predecessor };
}
export function eventEnvelopeAt(tick, event, arrivalTick = 0) {
  const local = tick - arrivalTick; if (local < event.startTick || local > event.releaseEndTick) return 0;
  const rise = event.peakTick - event.startTick; const fall = event.releaseEndTick - event.peakTick;
  const up = rise > 0 ? smootherstep((local - event.startTick) / rise) : 1;
  const down = fall > 0 ? 1 - smootherstep((local - event.peakTick) / fall) : 1; return up * down;
}
export function buildEventCellState(state) {
  const strength = new Uint8Array(state.topo.nodeCount); const family = new Uint8Array(state.topo.nodeCount); const tick = state.tick;
  for (const event of state.events) { const familyIndex = EVENT_FAMILIES.findIndex((item) => item.id === event.family) + 1;
    for (let index = 0; index < event.nodes.length; index++) { const envelope = eventEnvelopeAt(tick, event, event.arrivalTicks[index]);
      const value = Math.min(255, Math.round(255 * event.falloff[index] * event.intensity * envelope)); const cell = event.nodes[index];
      if (value > strength[cell]) { strength[cell] = value; family[cell] = familyIndex; } } }
  return { strength, family };
}
export function telegraphLead(traits) { return traits.distributedSensing ? 200 : 100; }
function drawFamily(rng, lastFamily) { const candidates = EVENT_FAMILIES.filter((family) => family.id !== lastFamily);
  let total = candidates.reduce((sum, family) => sum + family.weight, 0); let roll = rng.float() * total;
  for (const family of candidates) { roll -= family.weight; if (roll <= 0) return family; } return candidates.at(-1); }
function chooseCenter(candidates, fields, family, rng) { let valid = candidates;
  if (LAND_BOUND.has(family)) valid = valid.filter((cell) => fields.landMask[cell] === 1);
  else if (family === 'ash') valid = valid.filter((cell) => fields.landMask[cell] === 1 && fields.altitude[cell] > .58);
  return (valid.length ? valid : candidates)[rng.intBelow((valid.length ? valid : candidates).length)]; }
function eventEdgeCost(topo, fields, family, from, to, wind, salt) {
  const moisture = fields.baseMoisture[to]; const forest = fields.forestDensity[to]; const river = fields.riverStrength[to];
  const altitude = fields.altitude[to]; const ocean = 1 - fields.landMask[to]; const ridge = Math.max(0, altitude - fields.altitude[from]);
  let cost = 68 + variation(from, to, salt); if (family === 'drought') cost = 38 + moisture * 62 + forest * 38 + river * 72 + ridge * 90;
  else if (family === 'bloom') cost = 86 - river * 48 - moisture * 26 - forest * 12 + ridge * 140;
  else if (family === 'blight') cost = 58 - forest * 18 - fields.baseNutrient[to] * 14 + ridge * 45;
  else if (family === 'heat') cost += ocean * 34 + Math.max(0, altitude - .65) * 65;
  else if (family === 'freeze') cost += ocean * 18 + Math.max(0, .42 - altitude) * 42;
  else if (family === 'ash') cost += ridge * 80 - directional(topo.positions, from, to, wind) * 640;
  else if (family === 'toxic-rain') cost += ridge * 110 - moisture * 18 - directional(topo.positions, from, to, wind) * 420;
  else if (family === 'solar-flare') cost += Math.abs(topo.positions[to * 3 + 1]) * 24 + altitude * 18;
  return Math.max(22, Math.min(190, Math.round(cost))); }
function windVector(positions, center, salt) { const index = center * 3; const x = positions[index]; const y = positions[index + 1]; const z = positions[index + 2];
  const sign = salt & 1 ? -1 : 1; const vector = [sign * (y - z), sign * (z - x), sign * (x - y)]; const length = Math.hypot(...vector) || 1;
  return vector.map((value) => value / length); }
function directional(positions, from, to, wind) { const a = from * 3; const b = to * 3;
  return (positions[b] - positions[a]) * wind[0] + (positions[b + 1] - positions[a + 1]) * wind[1] + (positions[b + 2] - positions[a + 2]) * wind[2]; }
function variation(a, b, salt) { let value = (Math.imul(a + 1, 0x9e3779b1) ^ Math.imul(b + 7, 0x85ebca6b) ^ salt) >>> 0;
  value ^= value >>> 16; return value % 19; }
