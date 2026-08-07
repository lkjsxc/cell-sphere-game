/** Deterministic terrain-aware graph event scheduling and cell fields. */
import { BALANCE as B } from '../game/balance.js';
import { EVENT_FAMILIES } from '../game/events-content.js';
import { GRAPH_UNREACHABLE, weightedGraphField } from '../core/graph-field.js';
import { smootherstep } from '../core/math.js';
import { incrementProgressionInteger, normalizeProgressionInteger } from '../core/progression-integer.js';
import { hashStringU32 } from '../core/hash.js';
export const EVENT_FIELD_VERSION = 2; export const EVENT_UNREACHABLE = 0xffff;
// v3 reserves summary-cadence slack for the visible telegraph contract.
export const EVENT_DIRECTOR_VERSION = 3;
export const MAX_EVENT_DIRECTOR_EVENTS = 6;
export const MAX_EVENT_DIRECTOR_RECENT = 8;
const LAND_BOUND = new Set(['drought', 'bloom', 'blight']); const MAX_ARRIVAL_TICKS = 15;

/**
 * Fixed-capacity rolling event authority. Candidate identity advances as an
 * exact scalar while event geometry is reclaimed when it expires.
 */
export function createEventDirector({ rng, topo, fields, onboarding = null } = {}) {
  if (!rng || !topo || !fields) throw new Error('event director requires deterministic rng, topology, and fields');
  return {
    version: EVENT_DIRECTOR_VERSION,
    rng, topo, fields,
    events: [], recent: [], nextEventId: '0', lastFamily: '',
    nextCandidateTick: 0,
    onboarding: Object.freeze({ version: Number.isInteger(onboarding?.version) ? onboarding.version : 1,
      harmfulEventsDisabled: onboarding?.harmfulEventsDisabled === true }),
  };
}

/** Install a transition-compiled profile without precomputing a whole-world list. */
export function installEventDirectorProfile(state, profile) {
  const director = state.eventDirector;
  if (!director) return false;
  director.profile = profile;
  const enabled = director.onboarding?.harmfulEventsDisabled !== true && eventCapacity(profile) > 0;
  if (!enabled) return false;
  // A new public level becomes eligible immediately, but always retains a
  // minimum telegraph before its first possible effect.
  director.nextCandidateTick = Math.min(director.nextCandidateTick, state.tick);
  return true;
}

/** Called before environment consumers on every authoritative tick. */
export function advanceEventDirector(state) {
  const director = state.eventDirector;
  if (!director || director.onboarding?.harmfulEventsDisabled === true) return false;
  const profile = state.currentEnvironmentProfile;
  const capacity = Math.min(MAX_EVENT_DIRECTOR_EVENTS, eventCapacity(profile));
  if (capacity <= 0 || director.events.length >= capacity || state.tick < director.nextCandidateTick) return false;
  const event = buildRollingEvent(state, director, profile);
  director.events.push(event);
  const cadence = Math.max(1, Math.round(profile?.events?.cadenceTicks ?? 840));
  director.nextCandidateTick = event.startTick + cadence;
  return true;
}

/** Reclaim expired geometry after its semantic end has been announced. */
export function reclaimEndedEvents(state) {
  const director = state.eventDirector;
  if (!director) return 0;
  let removed = 0;
  for (let index = director.events.length - 1; index >= 0; index--) {
    const event = director.events[index];
    if (state.tick <= event.endTick || !(event.announced & 4)) continue;
    director.recent.push(Object.freeze({ id: event.id, family: event.family, center: event.center,
      startTick: event.startTick, endTick: event.endTick, intensity: event.intensity }));
    if (director.recent.length > MAX_EVENT_DIRECTOR_RECENT) director.recent.splice(0, director.recent.length - MAX_EVENT_DIRECTOR_RECENT);
    director.events.splice(index, 1);
    removed++;
  }
  return removed;
}

export function eventDirectorSummary(state) {
  const director = state.eventDirector;
  if (!director) return Object.freeze({ version: EVENT_DIRECTOR_VERSION, activeCount: 0, futureCount: 0, recentCount: 0,
    harmfulEventsDisabled: false });
  let activeCount = 0; let futureCount = 0;
  for (const event of director.events) {
    if (state.tick < event.startTick) futureCount++; else if (state.tick <= event.endTick) activeCount++;
  }
  return Object.freeze({ version: director.version, activeCount, futureCount, recentCount: director.recent.length,
    harmfulEventsDisabled: director.onboarding?.harmfulEventsDisabled === true });
}

function eventCapacity(profile) {
  const raw = profile?.events?.maxConcurrent ?? profile?.events?.count ?? 0;
  return Number.isInteger(raw) ? Math.max(0, Math.min(MAX_EVENT_DIRECTOR_EVENTS, raw)) : 0;
}
function buildRollingEvent(state, director, profile) {
  const { rng, topo, fields } = director;
  const id = normalizeProgressionInteger(director.nextEventId, '0');
  director.nextEventId = incrementProgressionInteger(id);
  const level = profile?.environmentLevel ?? '0';
  const familyPool = level === '1'
    ? EVENT_FAMILIES.filter((family) => family.crisis && ['drought', 'heat', 'freeze'].includes(family.id))
    : EVENT_FAMILIES.filter((family) => family.crisis);
  const family = drawFamily(rng, director.lastFamily, familyPool);
  director.lastFamily = family.id;
  const candidates = Array.from({ length: topo.nodeCount }, (_, cell) => cell)
    .sort((a, b) => fields.eventVuln[b] - fields.eventVuln[a] || a - b).slice(0, 180);
  const center = chooseCenter(candidates, fields, family.id, rng);
  const telegraphTicks = Math.max(100, Math.round(profile?.events?.telegraphTicks ?? 100));
  // Telegraph publication is summary-cadenced. Include the worst case until
  // the next summary so a just-missed summary cannot shorten the player-visible
  // warning below the versioned minimum; sensing can require a longer lead.
  const visibleLead = Math.max(telegraphTicks, telegraphLead(state.activeTraits ?? state.traits, profile))
    + B.SUMMARY_EVERY - 1;
  const startTick = state.tick + visibleLead + rng.intBelow(121);
  const peakTick = startTick + 60;
  const releaseEndTick = peakTick + 120 + rng.intBelow(90);
  const footprintScale = Math.max(1, Math.min(1.35, profile?.events?.footprintScale ?? 1));
  const intensityMin = Math.max(.5, Math.min(.72, profile?.events?.intensityMin ?? .5));
  const intensityMax = Math.max(.7, Math.min(1.15, profile?.events?.intensityMax ?? .7));
  const travelBudget = Math.min(1296, Math.round((720 + rng.intBelow(241)) * footprintScale));
  const salt = hashStringU32(`event-director:${id}`);
  const field = computeEventField(topo, fields, family.id, center, travelBudget, salt);
  const maxArrival = field.arrivalTicks.length ? Math.max(...field.arrivalTicks) : 0;
  return { id, family: family.id, nameJa: family.nameJa, descJa: family.descJa, kind: family.kind,
    amount: family.amount, crisis: family.crisis, startTick, peakTick, releaseEndTick,
    endTick: releaseEndTick + maxArrival, center, travelBudget,
    intensity: Math.fround(rng.range(intensityMin, intensityMax)), ...field, announced: 0 };
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
export function telegraphLead(traits, challengeProfile = null) {
  const minimum = Math.max(100, Math.round(challengeProfile?.events?.telegraphTicks ?? 100));
  return traits.distributedSensing ? Math.max(200, minimum) : minimum;
}
function drawFamily(rng, lastFamily, pool = EVENT_FAMILIES) { const candidates = pool.filter((family) => family.id !== lastFamily);
  let total = candidates.reduce((sum, family) => sum + family.weight, 0); let roll = rng.float() * total;
  for (const family of candidates) { roll -= family.weight; if (roll <= 0) return family; } return candidates.at(-1); }
function chooseCenter(candidates, fields, family, rng) { let valid = candidates;
  if (LAND_BOUND.has(family)) valid = valid.filter((cell) => fields.landMask[cell] === 1);
  else if (family === 'ash') valid = valid.filter((cell) => fields.landMask[cell] === 1 && fields.altitude[cell] > .58);
  return (valid.length ? valid : candidates)[rng.intBelow((valid.length ? valid : candidates).length)]; }
function eventEdgeCost(topo, fields, family, from, to, wind, salt) {
  const moisture = fields.baseMoisture[to]; const forest = fields.forestDensity[to];
  const freshwater = fields.freshwaterInfluence[to]; const altitude = fields.altitude[to];
  const ocean = 1 - fields.landMask[to]; const ridge = Math.max(0, altitude - fields.altitude[from]);
  let cost = 68 + variation(from, to, salt); if (family === 'drought') cost = 38 + moisture * 62 + forest * 38 + freshwater * 72 + ridge * 90;
  else if (family === 'bloom') cost = 86 - freshwater * 48 - moisture * 26 - forest * 12 + ridge * 140;
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
