/** Fixed cause vocabulary and bounded rolling/full-run Reach accounting. */
import { requiredHabitatCapability } from '../habitats.js';
import { FRESH_RESOURCE_FLOOR } from './ecological-access.js';
export const REACH_WINDOW_SECONDS = 15; export const REACH_SAMPLE_CAP = 8;
export const REACH_CAUSE = Object.freeze({ NONE: 0, INOCULATION: 1, EXPANSION: 2, REGROWTH: 3,
  RECONNECTION: 4, BLOOM: 5, CRISIS_GROWTH: 6, SKILL_RECOVERY: 7,
  RESOURCE_EXHAUSTION: 8, MAINTENANCE: 9, HEAT: 10, COLD: 11, DROUGHT: 12, TOXIN: 13, BLIGHT: 14,
  FRAGMENTATION: 15, COLLAPSE: 16, REPAIR: 17 });
const NAMES = Object.freeze(['none', 'inoculation', 'frontier expansion', 'regrowth', 'reconnection growth',
  'nutrient bloom', 'crisis-triggered growth', 'skill-enabled recovery', 'local resource exhaustion',
  'maintenance starvation', 'heat stress', 'cold stress', 'drought', 'toxicity', 'blight',
  'fragmentation loss', 'terminal collapse', 'liveness repair']); const CAUSE_COUNT = NAMES.length;
const LOSS_START = REACH_CAUSE.RESOURCE_EXHAUSTION;
export function createReachLedger() {
  const stamps = new Int32Array(REACH_WINDOW_SECONDS); stamps.fill(-1);
  return { version: 1, stamps, buckets: new Uint16Array(REACH_WINDOW_SECONDS * CAUSE_COUNT),
    totals: new Uint32Array(CAUSE_COUNT), sampleCells: new Uint16Array(CAUSE_COUNT * REACH_SAMPLE_CAP),
    sampleSeconds: new Uint32Array(CAUSE_COUNT * REACH_SAMPLE_CAP), sampleCursor: new Uint8Array(CAUSE_COUNT),
    turningPoint: { second: 0, net: 0 } };
}
export function recordReachTransition(state, cell, cause) {
  if (!Number.isInteger(cause) || cause <= 0 || cause >= CAUSE_COUNT) throw new Error(`invalid Reach cause: ${cause}`);
  const ledger = state.reach; const second = Math.floor(state.tick / 10); const slot = second % REACH_WINDOW_SECONDS;
  if (ledger.stamps[slot] !== second) { if (ledger.stamps[slot] >= 0) considerTurningPoint(ledger, slot);
    ledger.stamps[slot] = second; ledger.buckets.fill(0, slot * CAUSE_COUNT, (slot + 1) * CAUSE_COUNT); }
  const bucket = slot * CAUSE_COUNT + cause; ledger.buckets[bucket] = Math.min(0xffff, ledger.buckets[bucket] + 1); ledger.totals[cause]++;
  const sample = cause * REACH_SAMPLE_CAP + ledger.sampleCursor[cause]++ % REACH_SAMPLE_CAP;
  ledger.sampleCells[sample] = cell; ledger.sampleSeconds[sample] = second;
}
export function buildReachSummary(state) {
  const ledger = state.reach; const second = Math.floor(state.tick / 10); const counts = new Uint32Array(CAUSE_COUNT);
  for (let slot = 0; slot < REACH_WINDOW_SECONDS; slot++) if (ledger.stamps[slot] >= second - REACH_WINDOW_SECONDS + 1) {
    const base = slot * CAUSE_COUNT; for (let cause = 1; cause < CAUSE_COUNT; cause++) counts[cause] += ledger.buckets[base + cause]; }
  const gains = total(counts, 1, LOSS_START); const losses = total(counts, LOSS_START, CAUSE_COUNT); const conditions = reachConditions(state);
  return { version: 1, windowSeconds: REACH_WINDOW_SECONDS, current: state.aliveCount, gained: gains, lost: losses,
    net: gains - losses, windowStartLiving: state.aliveCount - gains + losses,
    positive: factors(ledger, counts, 1, LOSS_START, second), negative: factors(ledger, counts, LOSS_START, CAUSE_COUNT, second), ...conditions };
}
export function buildReachResult(state) {
  const ledger = state.reach; for (let slot = 0; slot < REACH_WINDOW_SECONDS; slot++) if (ledger.stamps[slot] >= 0) considerTurningPoint(ledger, slot);
  const gains = total(ledger.totals, 1, LOSS_START); const losses = total(ledger.totals, LOSS_START, CAUSE_COUNT);
  return { version: 1, gained: gains, lost: losses, net: gains - losses,
    positive: fullFactors(ledger.totals, 1, LOSS_START), negative: fullFactors(ledger.totals, LOSS_START, CAUSE_COUNT),
    turningPoint: { ...ledger.turningPoint } };
}
function reachConditions(state) {
  let living = 0; let energy = 0; let deficit = 0; let nutrient = 0; let moisture = 0; let suitableTemp = 0;
  let freshwaterForest = 0; let heat = 0; let cold = 0; let dry = 0; let toxin = 0;
  let capabilityAccessible = 0; let capabilityLiving = 0; let resourceBlockedCells = 0; let habitatBlockedCells = 0;
  for (let cell = 0; cell < state.topo.nodeCount; cell++) {
    const capability = state.fields?.biomeId ? requiredHabitatCapability(state.fields, cell, state.effectiveBiome?.[cell]) : null;
    const capabilities = state.habitatCapabilitySet ?? EMPTY_SET;
    const habitatOk = !capability || capabilities.has(capability)
      || capability === 'SHALLOW_OCEAN_ACCESS' && capabilities.has('SHALLOW_OCEAN_EDGE_ACCESS');
    if (habitatOk) { capabilityAccessible++; if (state.alive[cell]) capabilityLiving++; } else habitatBlockedCells++;
    if ((state.resourceRichness?.[cell] ?? 0) < FRESH_RESOURCE_FLOOR) resourceBlockedCells++;
  }
  for (let cell = 0; cell < state.topo.nodeCount; cell++) if (state.alive[cell]) { living++; const e = state.energy[cell]; energy += Math.max(0, e); deficit += Math.max(0, -e);
    nutrient += state.nutrient[cell]; moisture += state.moisture[cell]; suitableTemp += 1 - Math.min(1, Math.abs(state.temperature[cell] - .6) * 2);
    freshwaterForest += Math.max(state.fields.freshwaterInfluence[cell], state.fields.forestDensity[cell]); heat += Math.max(0, state.temperature[cell] - .75) * 4;
    cold += Math.max(0, .25 - state.temperature[cell]) * 4; dry += Math.max(0, .25 - state.moisture[cell]) * 4; toxin += state.toxicity[cell]; }
  const divisor = Math.max(1, living); const activeCrisis = state.events.some((event) => state.tick >= event.startTick && state.tick <= event.endTick) ? 1 : 0;
  const support = Math.min(1, (state.memoryConditionals.length + state.memoryUnlocks.length) / 8);
  const positiveConditions = conditionList([['energy-surplus', 'energy surplus', energy / divisor / 3], ['available-frontier', 'available frontier', state.liveness.activeFrontierCount / divisor],
    ['rich-niche-access', 'Rich niche access', nutrient / divisor], ['resource-floor', 'Resource floor', 1 - resourceBlockedCells / state.topo.nodeCount],
    ['reclamation-access', 'Reclamation access', state.activeBuildIdSet?.has('wasteland-reclaimer') ? 1 : 0],
    ['freshwater-frontier', 'Freshwater-supported frontier', freshwaterForest / divisor],
    ['accessible-nutrients', 'accessible nutrients', nutrient / divisor], ['suitable-moisture', 'suitable moisture', moisture / divisor],
    ['favorable-temperature', 'favorable temperature', suitableTemp / divisor], ['freshwater-ecology', 'lake, shore, and forest affinity', freshwaterForest / divisor], ['inherited-support', 'Evolution support', support]]);
  const negativeConditions = conditionList([['entropy', 'entropy', state.entropy], ['maintenance-burden', 'maintenance burden', deficit / divisor],
    ['heat-stress', 'heat stress', heat / divisor], ['cold-stress', 'cold stress', cold / divisor], ['drought-stress', 'drought stress', dry / divisor],
    ['toxicity', 'toxicity', toxin / divisor], ['crisis-pressure', 'active crisis pressure', activeCrisis], ['fragmentation', 'fragmentation', 1 - state.connectedShare]]);
  return { positiveConditions, negativeConditions,
    exactLivingCount: state.aliveCount, totalWorldCells: state.topo.nodeCount,
    accessibleHabitatReach: capabilityAccessible ? capabilityLiving / capabilityAccessible : 0,
    blockedCells: Object.freeze({ habitatCapability: habitatBlockedCells, resourceFloor: resourceBlockedCells,
      depleted: state.resourceDepletedCells ?? 0 }) };
}
function factors(ledger, counts, start, end, second) { return fullFactors(counts, start, end).slice(0, 5).map((factor) => ({ ...factor,
  samples: recentSamples(ledger, factor.cause, second) })); }
function fullFactors(counts, start, end) { const out = []; for (let cause = start; cause < end; cause++) if (counts[cause]) out.push({ cause, id: NAMES[cause].replaceAll(' ', '-'), label: NAMES[cause], count: counts[cause] });
  return out.sort((a, b) => b.count - a.count || a.cause - b.cause); }
function recentSamples(ledger, cause, second) { const out = []; const base = cause * REACH_SAMPLE_CAP;
  for (let index = 0; index < REACH_SAMPLE_CAP; index++) if (ledger.sampleSeconds[base + index] >= second - REACH_WINDOW_SECONDS + 1) out.push(ledger.sampleCells[base + index]);
  return [...new Set(out)].slice(0, REACH_SAMPLE_CAP); }
function conditionList(entries) { return entries.map(([id, label, score]) => ({ id, label, score: finite01(score) })).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).slice(0, 5); }
function considerTurningPoint(ledger, slot) { const base = slot * CAUSE_COUNT; const net = total(ledger.buckets, base + 1, base + LOSS_START) - total(ledger.buckets, base + LOSS_START, base + CAUSE_COUNT);
  if (Math.abs(net) > Math.abs(ledger.turningPoint.net)) ledger.turningPoint = { second: ledger.stamps[slot], net }; }
function total(values, start, end) { let sum = 0; for (let index = start; index < end; index++) sum += values[index]; return sum; }
function finite01(value) { return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)); }
const EMPTY_SET = new Set();
