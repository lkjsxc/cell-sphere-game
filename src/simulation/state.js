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
import { environmentScheduleAtTick } from '../game/environment-level.js';
import { createEnvironmentExposure, flushEnvironmentExposure, sampleEnvironmentExposure } from '../game/environment-exposure.js';
import { compileChallengeProfile, interpolateEnvironmentCoefficients } from './challenge-profile.js';
import { compareProgressionIntegers, incrementProgressionInteger, maxProgressionInteger, normalizeProgressionInteger } from '../core/progression-integer.js';
import { REPLAY_VERSION, recordHistory } from './replay.js';
import { birthCell, killCell } from './lifecycle/cell-lifecycle.js';
import { createReachLedger, REACH_CAUSE } from './lifecycle/reach-ledger.js';
import { createTrophyProof } from './trophy-proof.js';
import { createResourceAuthority, freshwaterSupportAt, installResourceState } from './resource-ecology.js';
import { createWorldmakingState } from './worldmaking.js';
import { createReachGoalState } from './lifecycle/reach-goal.js';
import { createScoreMerit } from '../game/scoring.js';
import { ecologicalAccess } from './lifecycle/ecological-access.js';

const STREAM = Object.freeze({
  world: 0x51ab3d71,
  growth: 0x9e3779b9,
  inoculation: 0x1a0c01a7,
});

/** @param {Object} cfg run configuration */
export function createRunState(cfg) {
  const seed = cfg.seed >>> 0;
  const worldOrdinal = normalizeProgressionInteger(cfg.worldOrdinal, '1') === '0'
    ? '1' : normalizeProgressionInteger(cfg.worldOrdinal, '1');
  // A new authority always starts from the Level-0 world baseline. Any static
  // selected profile in an old envelope is intentionally ignored.
  const initialEnvironmentSchedule = environmentScheduleAtTick('0');
  const environmentEvolutionDefense = cfg.evolutionDefense && typeof cfg.evolutionDefense === 'object'
    ? cfg.evolutionDefense : {};
  const currentEnvironmentProfile = compileChallengeProfile({ environmentLevel: '0', evolution: environmentEvolutionDefense });
  const nextEnvironmentProfile = compileChallengeProfile({ environmentLevel: '1', evolution: environmentEvolutionDefense });
  const topo = createTopology(4);
  const fields = createFields(createRng(seed ^ STREAM.world), topo);
  const simRng = createRng(seed ^ STREAM.growth);
  const inoculationRng = createRng(seed ^ STREAM.inoculation);
  const N = topo.nodeCount;
  const E = topo.edgeCount;
  const traits = traitsFor(cfg.strainId ?? 'pioneer', cfg.memoryEffects ?? {});
  const habitatCapabilities = Array.isArray(cfg.habitatCapabilities) ? [...new Set(cfg.habitatCapabilities)] : [];
  // Resource stock is immutable Level-0 world-start data, never live pressure.
  const resource = createResourceAuthority(fields, 1);
  const ecology = normalizeEcology(cfg.ecology);
  const worldmakingCapabilities = normalizeWorldmakingCapabilities(cfg.worldmaking);
  const luminous = normalizeLuminous(cfg.luminous);
  const worldmaking = createWorldmakingState(fields);

  const state = {
    topo, fields, traits, activeTraits: { ...traits }, ecology, worldmakingCapabilities, luminous,
    habitatCapabilities, habitatCapabilitySet: new Set(habitatCapabilities),
    worldOrdinal,
    environmentModelVersion: initialEnvironmentSchedule.environmentModelVersion,
    environmentScheduleVersion: initialEnvironmentSchedule.environmentScheduleVersion,
    environmentScheduleHash: initialEnvironmentSchedule.environmentScheduleHash,
    currentEnvironmentLevel: initialEnvironmentSchedule.currentEnvironmentLevel,
    peakEnvironmentLevel: initialEnvironmentSchedule.currentEnvironmentLevel,
    environmentLevelStartTick: initialEnvironmentSchedule.environmentLevelStartTick,
    nextEnvironmentLevelTick: initialEnvironmentSchedule.nextEnvironmentLevelTick,
    environmentLevelProgressQ: initialEnvironmentSchedule.environmentLevelProgressQ,
    environmentTransitionCount: '0',
    environmentExposure: createEnvironmentExposure(initialEnvironmentSchedule.currentEnvironmentLevel),
    recentEnvironmentTransitions: [],
    environmentEvolutionDefense,
    currentEnvironmentProfile, nextEnvironmentProfile,
    currentEnvironmentProfileHash: currentEnvironmentProfile.hash,
    currentEnvironmentProfileVersion: currentEnvironmentProfile.version,
    environmentCoefficients: interpolateEnvironmentCoefficients(
      currentEnvironmentProfile, nextEnvironmentProfile, initialEnvironmentSchedule.environmentLevelProgressQ,
    ),
    challenge: cfg.challenge ?? null, seed, runId: Number.isInteger(cfg.runId) ? cfg.runId : 0,
    simRng, inoculationRng,
    tick: 0, entropy: 0, status: 'idle', extinction: null,
    terminalCollapseStart: -1, terminalDeadline: -1, terminalCause: null,
    strictInvariants: cfg.strictInvariants === true,
    diagnostics: { livenessRepairs: 0, nonFiniteRepairs: 0 },

    biomass: new Float32Array(N), energy: new Float32Array(N),
    moisture: fields.baseMoisture.slice(),
    temperature: fields.baseTemp.slice(), toxicity: new Float32Array(N),
    stress: new Float32Array(N), alive: new Uint8Array(N), reachDamageCause: new Uint8Array(N),

    conductance: new Float32Array(E), edgePeak: new Float32Array(E),
    flux: new Float32Array(E), edgeAge: new Uint16Array(E), edgeActive: new Uint8Array(E),

    pressure: new Float32Array(N), nextEnergy: new Float32Array(N),
    expansions: new Uint8Array(N), bfsVisited: new Uint8Array(N), bfsQueue: new Uint32Array(N),

    entropyLut: buildEntropyLut(currentEnvironmentProfile), seasonLut: buildSeasonLut(),
    nodeSeasonOffset: buildNodeSeasonOffsets(topo),
    trophyProof: createTrophyProof(topo, fields),

    habitatBlocked: new Uint16Array(N), resourceBlocked: new Uint16Array(N),
    habitatVisited: new Uint8Array(N), habitatOccupancy: new Uint32Array(14),

    aliveCount: 0, coverage: 0, peakCoverage: 0, peakLandOccupancy: 0,
    landCellCount: sumMask(fields.landMask), sustainedSum: 0,
    liveness: { livingCount: 1, totalBiomass: 1.2, maxBiomass: 1.2,
      viableEnergyCount: 1, activeFrontierCount: 1, validGrowthCandidateCount: 1,
      unchangedTicks: 0, previousLivingCount: 1, previousBiomass: 1.2 },
    sustainedSamples: 0, connectedShare: 0, peakConnectedShare: 0,
    minConnectedWhileMajority: 1, largestComponent: 0,
    totalUptake: 0, totalMaintenance: 0, stressBurdenSum: 0, stressBurdenSamples: 0, phenotypes: [],
    everColonized: new Uint8Array(N), scoreMerit: createScoreMerit(),
    causes: { 'resource-exhaustion': 0, 'maintenance-starvation': 0, fragmentation: 0,
      heat: 0, cold: 0, drought: 0, toxin: 0, collapse: 0 }, reach: createReachLedger(),

    phaseIndex: -1, coverageMilestoneIndex: 0, loopMilestone: false, geographySeen: 0,
    wasFragmented: false, reconnectedUntil: -1,
    replayVersion: REPLAY_VERSION, replay: [], history: [],
    ...worldmaking, ...createReachGoalState(),
  };
  installResourceState(state, resource);
  state.initialResourceStock = resource.initialStock;

  const start = cfg.inoculate ?? selectInoculation(fields, inoculationRng, resource);
  if (!Number.isInteger(start) || start < 0 || start >= N) throw new Error(`invalid inoculation cell: ${start}`);
  state.inoculationCell = start;
  state.inoculationFreshwaterSupport = freshwaterSupportAt(state, start);
  // Founder water makes the initial rich niche legible, not a hidden long-life subsidy.
  state.initialFounderFreshwaterReserve = state.inoculationFreshwaterSupport * 120;
  state.founderFreshwaterReserve = state.initialFounderFreshwaterReserve;
  state.initialResourceStock += state.initialFounderFreshwaterReserve;
  birthCell(state, start, REACH_CAUSE.INOCULATION);
  state.biomass[start] = Math.fround(1.2);
  state.energy[start] = Math.fround(3.0);
  state.coverage = 1 / N;
  recordHistory(state, 'run-created');
  recordHistory(state, 'inoculation', { cell: start });
  return state;
}

/**
 * Install exact schedule state before environment consumers run. Transition
 * compilation occurs once per threshold; only current/next profiles persist.
 */
export function updateEnvironmentProgression(state) {
  const schedule = environmentScheduleAtTick(state.tick);
  const changed = schedule.currentEnvironmentLevel !== state.currentEnvironmentLevel;
  if (changed) {
    const becameNewPeak = compareProgressionIntegers(schedule.currentEnvironmentLevel, state.peakEnvironmentLevel) > 0;
    sampleEnvironmentExposure(state.environmentExposure, {
      throughTick: state.tick,
      pressure: state.currentEnvironmentProfile?.score?.pressure ?? 0,
      quality: state.scoreMerit?.quality ?? 0,
      currentLevel: state.currentEnvironmentLevel,
      peakLevel: state.peakEnvironmentLevel,
      flush: true,
    });
    state.currentEnvironmentLevel = schedule.currentEnvironmentLevel;
    state.peakEnvironmentLevel = maxProgressionInteger(state.peakEnvironmentLevel, schedule.currentEnvironmentLevel);
    if (becameNewPeak) {
      // Result time-at-peak means time at the final highest public rung, not
      // the sum of earlier temporary peaks.
      state.environmentExposure.timeAtPeakTicks = '0';
      state.environmentExposure.pendingPeakTicks = 0;
    }
    state.environmentTransitionCount = incrementProgressionInteger(state.environmentTransitionCount);
    state.currentEnvironmentProfile = state.nextEnvironmentProfile?.environmentLevel === schedule.currentEnvironmentLevel
      ? state.nextEnvironmentProfile
      : compileChallengeProfile({ environmentLevel: schedule.currentEnvironmentLevel, evolution: state.environmentEvolutionDefense });
    const nextLevel = incrementProgressionInteger(schedule.currentEnvironmentLevel);
    state.nextEnvironmentProfile = compileChallengeProfile({ environmentLevel: nextLevel, evolution: state.environmentEvolutionDefense });
    state.currentEnvironmentProfileHash = state.currentEnvironmentProfile.hash;
    state.currentEnvironmentProfileVersion = state.currentEnvironmentProfile.version;
    const transition = Object.freeze({ level: state.currentEnvironmentLevel, tick: schedule.tick,
      profileHash: state.currentEnvironmentProfile.hash, pressure: state.currentEnvironmentProfile.score.pressure });
    state.recentEnvironmentTransitions.push(transition);
    if (state.recentEnvironmentTransitions.length > 8) state.recentEnvironmentTransitions.shift();
    recordHistory(state, 'environment-transition', { id: state.currentEnvironmentLevel,
      environmentLevel: state.currentEnvironmentLevel, profileHash: state.currentEnvironmentProfile.hash });
  }
  state.environmentLevelStartTick = schedule.environmentLevelStartTick;
  state.nextEnvironmentLevelTick = schedule.nextEnvironmentLevelTick;
  state.environmentLevelProgressQ = schedule.environmentLevelProgressQ;
  state.environmentCoefficients = interpolateEnvironmentCoefficients(
    state.currentEnvironmentProfile, state.nextEnvironmentProfile, schedule.environmentLevelProgressQ,
  );
  return Object.freeze({ changed, schedule, profile: state.currentEnvironmentProfile });
}

/** Flush exact exposure at an authoritative terminal/abandonment boundary. */
export function finalizeEnvironmentProgression(state) {
  sampleEnvironmentExposure(state.environmentExposure, {
    throughTick: state.tick,
    pressure: state.currentEnvironmentProfile?.score?.pressure ?? 0,
    quality: state.scoreMerit?.quality ?? 0,
    currentLevel: state.currentEnvironmentLevel,
    peakLevel: state.peakEnvironmentLevel,
    flush: true,
  });
  return flushEnvironmentExposure(state.environmentExposure);
}

/** Seeded weighted selection among plausible resource/land candidates. */
export function selectInoculation(fields, rng, resource = null) {
  const count = fields.baseNutrient.length;
  const sources = Array.from(fields.sources ?? [], Number);
  const hasLand = fields.landMask != null || fields.biome != null;
  const richness = resource?.initialResourceRichness;
  let candidates = sources.filter((i) => i >= 0 && i < count && (!hasLand || isLand(fields, i))
    && (!richness || richness[i] >= .70));
  if (candidates.length === 0 && hasLand) {
    for (let i = 0; i < count; i++) if (isLand(fields, i) && (!richness || richness[i] >= .70)) candidates.push(i);
  }
  if (candidates.length === 0 && hasLand) for (let i = 0; i < count; i++) if (isLand(fields, i)) candidates.push(i);
  if (candidates.length === 0) candidates = sources.length ? sources : Array.from({ length: count }, (_, i) => i);

  let best = 0;
  const scores = candidates.map((i) => {
    const tempFit = Math.max(0.2, 1 - Math.abs(fields.baseTemp[i] - 0.6) * 1.6);
    const moistFit = Math.max(0.2, 1 - Math.abs(fields.baseMoisture[i] - 0.55) * 1.2);
    const fresh = fields.freshwaterInfluence?.[i] ?? 0;
    const score = Math.max(0.0001, (richness?.[i] ?? fields.baseNutrient[i]) * tempFit * moistFit * (1 + fresh * .12));
    if (score > best) best = score;
    return score;
  });
  const plausible = candidates.map((cell, i) => ({ cell, weight: scores[i] }))
    .filter((x) => x.weight >= best * .62);
  let total = plausible.reduce((sum, x) => sum + x.weight, 0);
  let roll = rng.float() * total;
  for (const candidate of plausible) { roll -= candidate.weight; if (roll <= 0) return candidate.cell; }
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
    if (hasDeadNeighbor && energy[i] >= B.GROW_COST) {
      for (let o = topo.nodeStart[i]; o < topo.nodeStart[i + 1]; o++) {
        const target = topo.nodeNeighbors[o];
        if (alive[target] !== 1 && ecologicalAccess(state, i, target).accessible) { candidates++; break; }
      }
    }
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
  // This bounded fade follows a causal ecological stall only; it is not a
  // universal world-duration cap.
  state.terminalDeadline = state.tick + B.TERMINAL_COLLAPSE_TICKS;
  recordHistory(state, 'terminal-collapse', { id: reason });
  return true;
}

function normalizeLuminous(raw) { const value = raw && typeof raw === 'object' ? raw : {};
  const bounded = (input, fallback, min, max) => Number.isFinite(input) ? Math.max(min, Math.min(max, input)) : fallback;
  const enabled = value.enabled === true;
  return Object.freeze({ enabled, rating: normalizeProgressionInteger(value.rating, '0'),
    development: bounded(value.development ?? value.visualDevelopment, 0, 0, 1),
    generationScale: bounded(value.generationScale, 0, 0, 1.7), retention: bounded(value.retention, .976, .976, .996),
    upkeepScale: bounded(value.upkeepScale, 1, .76, 1.25), domainScale: bounded(value.domainScale, 0, 0, 1.5),
    transportScale: bounded(value.transportScale, 0, 0, .45), recoveryScale: bounded(value.recoveryScale, 0, 0, .35),
    visualDevelopment: bounded(value.visualDevelopment, 0, 0, 1) });
}
function normalizeEcology(raw) { const value = raw && typeof raw === 'object' ? raw : {};
  const bounded = (input, max) => Number.isFinite(input) ? Math.max(0, Math.min(max, input)) : 0;
  return Object.freeze({ resourceFloorReduction: bounded(value.resourceFloorReduction, .45), freshwaterSupport: bounded(value.freshwaterSupport, 1),
    marineSupport: bounded(value.marineSupport, 1), recycling: bounded(value.recycling, 1) });
}
function normalizeWorldmakingCapabilities(raw) { const value = raw && typeof raw === 'object' ? raw : {};
  return Object.freeze({ reclamation: value.reclamation === true, cryolake: value.cryolake === true, littoral: value.littoral === true });
}
function sumMask(values) { let total = 0; for (const value of values ?? []) total += value ? 1 : 0; return total; }

function isLand(fields, i) {
  if (fields.landMask != null) return Boolean(fields.landMask[i]);
  const biome = fields.biome?.[i];
  if (typeof biome === 'string') return !/^(ocean|water|sea)$/i.test(biome);
  if (typeof biome === 'number') return biome !== 0;
  return biome !== false && biome != null;
}
