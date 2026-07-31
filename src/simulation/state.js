/**
 * Run state: all mutable simulation data in preallocated typed arrays
 * (structure-of-arrays). No per-cell objects, no hot-path allocation.
 */
import { BALANCE as B } from '../game/balance.js';
import { traitsFor } from '../game/strains.js';
import { createRng } from '../core/prng.js';
import { createTopology } from '../world/icosphere.js';
import { createFields } from '../world/fields.js';
import { buildEntropyLut, buildSeasonLut, buildNodeSeasonOffsets } from './environment.js';
import { scheduleEvents } from './events.js';

/**
 * @param {Object} cfg
 * @param {number} cfg.seed world seed (30-bit)
 * @param {string} [cfg.strainId]
 * @param {object} [cfg.memoryEffects] permanent trait modifiers
 * @param {object|null} [cfg.challenge] challenge modifier or null
 * @param {number|null} [cfg.inoculate] starting node index (null = recommend)
 */
export function createRunState(cfg) {
  const seed = cfg.seed >>> 0;
  const topo = createTopology(4);
  // Independent deterministic streams derived from the world seed.
  const worldRng = createRng(seed ^ 0x51ab3d71);
  const fields = createFields(worldRng, topo);
  const simRng = createRng(seed ^ 0x9e3779b9);
  const contentRng = createRng(seed ^ 0x2545f491);

  const N = topo.nodeCount;
  const E = topo.edgeCount;
  const traits = traitsFor(cfg.strainId ?? 'pioneer', cfg.memoryEffects ?? {});

  const state = {
    topo,
    fields,
    traits,
    challenge: cfg.challenge ?? null,
    seed,
    simRng,
    contentRng,

    tick: 0,
    entropy: 0,
    status: 'idle', // idle | running | draft | extinct
    extinction: null, // {tick, cause}

    // --- per-node dynamic arrays -------------------------------------------
    biomass: new Float32Array(N),
    energy: new Float32Array(N),
    nutrient: fields.baseNutrient.slice(),
    moisture: fields.baseMoisture.slice(),
    temperature: fields.baseTemp.slice(),
    toxicity: new Float32Array(N),
    stress: new Float32Array(N),
    signal: new Float32Array(N),
    membrane: new Float32Array(N), // adaptive-membrane exposure memory
    alive: new Uint8Array(N),

    // --- per-edge dynamic arrays -------------------------------------------
    conductance: new Float32Array(E),
    flux: new Float32Array(E),
    edgeAge: new Uint16Array(E),
    edgeActive: new Uint8Array(E),

    // --- scratch buffers (reused, never reallocated) -------------------------
    pressure: new Float32Array(N),
    nextEnergy: new Float32Array(N),
    expansions: new Uint8Array(N),
    bfsVisited: new Uint8Array(N),
    bfsQueue: new Uint32Array(N),

    // --- signals -------------------------------------------------------------
    signalCharges: B.SIGNAL_CHARGES + traits.signalCharges,
    signalRegenAcc: 0,
    activeSignals: [], // {node, untilTick} for rendering

    // --- environment LUTs ----------------------------------------------------
    entropyLut: buildEntropyLut(),
    seasonLut: buildSeasonLut(),
    nodeSeasonOffset: buildNodeSeasonOffsets(topo),

    // --- events ----------------------------------------------------------------
    events: scheduleEvents(simRng, topo, fields, cfg.challenge ?? null),
    eventCursor: 0, // next event to announce
    crisesEndured: 0,
    crisesTotal: 0,

    // --- drafting ---------------------------------------------------------------
    draftIndex: 0,
    pendingDraft: null, // {options: string[]}
    ownedCards: [],
    rerollsLeft: 0,

    // --- metrics -----------------------------------------------------------------
    aliveCount: 0,
    coverage: 0,
    peakCoverage: 0,
    sustainedSum: 0,
    sustainedSamples: 0,
    connectedShare: 0,
    peakConnectedShare: 0,
    minConnectedWhileMajority: 1,
    largestComponent: 0,
    totalUptake: 0,
    totalMaintenance: 0,
    signalsPlaced: 0,
    signalProductivity: 0,
    phenotypes: [],

    // extinction-cause accumulators
    causes: { starvation: 0, heat: 0, cold: 0, drought: 0, toxin: 0, event: 0, collapse: 0 },

    // replay log: [tick, type, ...args]
    replay: [],
  };

  // Inoculate: the recommended node is the richest source that is also
  // hospitable (no unknowable cold/dry first-run traps).
  const start = cfg.inoculate ?? recommendInoculation(fields);
  state.alive[start] = 1;
  state.biomass[start] = Math.fround(1.2);
  state.energy[start] = Math.fround(3.0);
  state.aliveCount = 1;

  return state;
}

/**
 * Pick the best starting node among the resource sources, scoring nutrient
 * richness against baseline environmental suitability.
 * @param {import('../world/fields.js').Fields} fields
 * @returns {number} node index
 */
function recommendInoculation(fields) {
  let best = fields.sources[0];
  let bestScore = -1;
  for (const s of fields.sources) {
    const tempFit = 1 - Math.abs(fields.baseTemp[s] - 0.6) * 1.6;
    const moistFit = 1 - Math.abs(fields.baseMoisture[s] - 0.55) * 1.2;
    const score = fields.baseNutrient[s] * Math.max(0.2, tempFit) * Math.max(0.2, moistFit);
    if (score > bestScore) { bestScore = score; best = s; }
  }
  return best;
}
