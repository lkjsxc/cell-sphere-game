/**
 * Run state: all mutable simulation data in preallocated typed arrays.
 * Random streams are isolated by authority concern.
 */
import { traitsFor } from '../game/strains.js';
import { BALANCE as B } from '../game/balance.js';
import { createRng } from '../core/prng.js';
import { createTopology } from '../world/icosphere.js';
import { createFields } from '../world/fields.js';
import { buildEntropyLut, buildSeasonLut, buildNodeSeasonOffsets } from './environment.js';
import { scheduleEvents } from './events.js';
import { recordHistory } from './replay.js';
import { birthCell, killCell } from './lifecycle/cell-lifecycle.js';
import { createReachLedger, REACH_CAUSE } from './lifecycle/reach-ledger.js';
import { createTrophyProof } from './trophy-proof.js';

const STREAM = Object.freeze({
  world: 0x51ab3d71,
  growth: 0x9e3779b9,
  event: 0x0e7e17a1,
  content: 0x2545f491,
  decision: 0xd3c1510a,
  inoculation: 0x1a0c01a7,
});

/** @param {Object} cfg run configuration */
export function createRunState(cfg) {
  const seed = cfg.seed >>> 0;
  const adaptationMode = cfg.adaptationMode ?? 'random';
  if (adaptationMode !== 'random' && adaptationMode !== 'manual') {
    throw new Error(`invalid adaptation mode: ${adaptationMode}`);
  }
  const topo = createTopology(4);
  const fields = createFields(createRng(seed ^ STREAM.world), topo);
  const simRng = createRng(seed ^ STREAM.growth);
  const eventRng = createRng(seed ^ STREAM.event);
  const contentRng = createRng(seed ^ STREAM.content);
  const decisionRng = createRng(seed ^ STREAM.decision);
  const inoculationRng = createRng(seed ^ STREAM.inoculation);
  const N = topo.nodeCount;
  const E = topo.edgeCount;
  const traits = traitsFor(cfg.strainId ?? 'pioneer', cfg.memoryEffects ?? {});

  const state = {
    topo, fields, traits, activeTraits: { ...traits },
    memoryConditionals: Array.isArray(cfg.memoryConditionals) ? cfg.memoryConditionals : [],
    memoryUnlocks: Array.isArray(cfg.memoryUnlocks) ? cfg.memoryUnlocks : [],
    challenge: cfg.challenge ?? null, seed, runId: Number.isInteger(cfg.runId) ? cfg.runId : 0,
    simRng, eventRng, contentRng, decisionRng, inoculationRng,
    tick: 0, entropy: 0, status: 'idle', extinction: null,
    terminalCollapseStart: -1, terminalDeadline: -1, terminalCause: null,
    strictInvariants: cfg.strictInvariants === true,
    diagnostics: { livenessRepairs: 0, nonFiniteRepairs: 0 },

    biomass: new Float32Array(N), energy: new Float32Array(N),
    nutrient: fields.baseNutrient.slice(), moisture: fields.baseMoisture.slice(),
    temperature: fields.baseTemp.slice(), toxicity: new Float32Array(N),
    stress: new Float32Array(N), membrane: new Float32Array(N), alive: new Uint8Array(N), reachDamageCause: new Uint8Array(N),

    conductance: new Float32Array(E), edgePeak: new Float32Array(E),
    flux: new Float32Array(E), edgeAge: new Uint16Array(E), edgeActive: new Uint8Array(E),

    pressure: new Float32Array(N), nextEnergy: new Float32Array(N),
    expansions: new Uint8Array(N), bfsVisited: new Uint8Array(N), bfsQueue: new Uint32Array(N),

    entropyLut: buildEntropyLut(), seasonLut: buildSeasonLut(),
    nodeSeasonOffset: buildNodeSeasonOffsets(topo),
    events: scheduleEvents(eventRng, topo, fields, cfg.challenge ?? null),
    crisesEndured: 0, crisesTotal: 0, trophyProof: createTrophyProof(topo, fields),

    adaptationMode, adaptationOffers: [], nextOfferIndex: 0,
    lastOffered: [], lastAdaptationResolutionTick: -1, ownedCards: [],

    aliveCount: 0, coverage: 0, peakCoverage: 0, sustainedSum: 0,
    liveness: { livingCount: 1, totalBiomass: 1.2, maxBiomass: 1.2,
      viableEnergyCount: 1, activeFrontierCount: 1, validGrowthCandidateCount: 1,
      unchangedTicks: 0, previousLivingCount: 1, previousBiomass: 1.2 },
    sustainedSamples: 0, connectedShare: 0, peakConnectedShare: 0,
    minConnectedWhileMajority: 1, largestComponent: 0,
    totalUptake: 0, totalMaintenance: 0, phenotypes: [],
    causes: { starvation: 0, heat: 0, cold: 0, drought: 0, toxin: 0, event: 0, collapse: 0 }, reach: createReachLedger(),

    phaseIndex: -1, coverageMilestoneIndex: 0, loopMilestone: false, geographySeen: 0,
    wasFragmented: false, reconnectedUntil: -1,
    replayVersion: 2, replay: [], history: [],
  };

  const start = cfg.inoculate ?? selectInoculation(fields, inoculationRng);
  if (!Number.isInteger(start) || start < 0 || start >= N) throw new Error(`invalid inoculation cell: ${start}`);
  state.inoculationCell = start;
  birthCell(state, start, REACH_CAUSE.INOCULATION);
  state.biomass[start] = Math.fround(1.2);
  state.energy[start] = Math.fround(3.0);
  state.coverage = 1 / N;
  recordHistory(state, 'run-created');
  recordHistory(state, 'inoculation', { cell: start });
  return state;
}

/** Seeded weighted selection among plausible resource/land candidates. */
export function selectInoculation(fields, rng) {
  const count = fields.baseNutrient.length;
  const sources = Array.from(fields.sources ?? [], Number);
  const hasLand = fields.landMask != null || fields.biome != null;
  let candidates = sources.filter((i) => i >= 0 && i < count && (!hasLand || isLand(fields, i)));
  if (candidates.length === 0 && hasLand) {
    for (let i = 0; i < count; i++) if (isLand(fields, i)) candidates.push(i);
  }
  if (candidates.length === 0) candidates = sources.length ? sources : Array.from({ length: count }, (_, i) => i);

  let best = 0;
  const scores = candidates.map((i) => {
    const tempFit = Math.max(0.2, 1 - Math.abs(fields.baseTemp[i] - 0.6) * 1.6);
    const moistFit = Math.max(0.2, 1 - Math.abs(fields.baseMoisture[i] - 0.55) * 1.2);
    const score = Math.max(0.0001, fields.baseNutrient[i] * tempFit * moistFit);
    if (score > best) best = score;
    return score;
  });
  const plausible = candidates.map((cell, i) => ({ cell, weight: scores[i] }))
    .filter((x) => x.weight >= best * 0.45);
  let total = plausible.reduce((sum, x) => sum + x.weight, 0);
  let roll = rng.float() * total;
  for (const candidate of plausible) {
    roll -= candidate.weight;
    if (roll <= 0) return candidate.cell;
  }
  return plausible[plausible.length - 1].cell;
}

/** Reconcile cheap authoritative liveness metrics after every growth/death tick. */
export function reconcileLiveness(state) {
  const { topo, alive, biomass, energy, stress, edgeActive, flux } = state;
  const l = state.liveness; let count = 0; let total = 0; let max = 0;
  let viable = 0; let frontier = 0; let candidates = 0; let invalid = 0;
  for (let i = 0; i < topo.nodeCount; i++) {
    if (!Number.isFinite(biomass[i])) { invalid++; biomass[i] = 0; }
    if (!Number.isFinite(energy[i])) { invalid++; energy[i] = 0; }
    if (!Number.isFinite(stress[i])) { invalid++; stress[i] = 0; }
    if (alive[i] !== 1) continue;
    if (biomass[i] <= B.BIOMASS_EPS) { killCell(state, i, REACH_CAUSE.REPAIR); invalid++; continue; }
    count++; total += biomass[i]; if (biomass[i] > max) max = biomass[i];
    if (energy[i] > 0) viable++;
    let hasDeadNeighbor = false;
    for (let o = topo.nodeStart[i]; o < topo.nodeStart[i + 1]; o++) {
      if (alive[topo.nodeNeighbors[o]] !== 1) { hasDeadNeighbor = true; break; }
    }
    if (hasDeadNeighbor && energy[i] > 0) frontier++;
    if (hasDeadNeighbor && energy[i] >= B.GROW_COST) candidates++;
  }
  const drift = state.aliveCount !== count;
  if (drift || invalid || state.strictInvariants) for (let e = 0; e < topo.edgeCount; e++) {
    if (edgeActive[e] && (alive[topo.edgeA[e]] !== 1 || alive[topo.edgeB[e]] !== 1)) {
      edgeActive[e] = 0; flux[e] = 0; invalid++;
    }
  }
  if ((drift || invalid) && state.strictInvariants) {
    throw new Error(`liveness invariant divergence: count=${state.aliveCount}/${count}, invalid=${invalid}`);
  }
  if (drift || invalid) state.diagnostics.livenessRepairs++;
  if (invalid) state.diagnostics.nonFiniteRepairs += invalid;
  const changed = count !== l.previousLivingCount || Math.abs(total - l.previousBiomass) > 1e-5;
  l.unchangedTicks = changed ? 0 : l.unchangedTicks + 1;
  Object.assign(l, { livingCount: count, totalBiomass: total, maxBiomass: max,
    viableEnergyCount: viable, activeFrontierCount: frontier,
    validGrowthCandidateCount: candidates, previousLivingCount: count, previousBiomass: total });
  state.aliveCount = count; state.coverage = count / topo.nodeCount;
  return l;
}

/** Return a truthful deterministic reason for entering bounded terminal fade. */
export function terminalCollapseReason(state) {
  if (state.tick >= B.RUN_CEILING_TICKS) return 'hard-maximum';
  const l = state.liveness;
  const spent = l.viableEnergyCount === 0 && l.activeFrontierCount === 0
    && l.validGrowthCandidateCount === 0;
  return spent && l.totalBiomass <= B.TERMINAL_BIOMASS_THRESHOLD
    && l.unchangedTicks >= B.TERMINAL_STALL_TICKS ? 'terminal-stall' : null;
}

export function beginTerminalCollapse(state, reason) {
  if (state.status !== 'running') return false;
  state.status = 'terminal-collapse'; state.terminalCause = reason;
  state.terminalCollapseStart = state.tick;
  state.terminalDeadline = Math.min(B.RUN_HARD_MAX_TICKS,
    state.tick + B.TERMINAL_COLLAPSE_TICKS);
  recordHistory(state, 'terminal-collapse', { id: reason });
  return true;
}

function isLand(fields, i) {
  if (fields.landMask != null) return Boolean(fields.landMask[i]);
  const biome = fields.biome?.[i];
  if (typeof biome === 'string') return !/^(ocean|water|sea)$/i.test(biome);
  if (typeof biome === 'number') return biome !== 0;
  return biome !== false && biome != null;
}
