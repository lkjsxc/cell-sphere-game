/**
 * Run state: all mutable simulation data in preallocated typed arrays.
 * Random streams are isolated by authority concern.
 */
import { traitsFor } from '../game/strains.js';
import { createRng } from '../core/prng.js';
import { createTopology } from '../world/icosphere.js';
import { createFields } from '../world/fields.js';
import { buildEntropyLut, buildSeasonLut, buildNodeSeasonOffsets } from './environment.js';
import { scheduleEvents } from './events.js';
import { recordHistory } from './replay.js';

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
    topo, fields, traits, challenge: cfg.challenge ?? null, seed,
    simRng, eventRng, contentRng, decisionRng, inoculationRng,
    tick: 0, entropy: 0, status: 'idle', extinction: null,

    biomass: new Float32Array(N), energy: new Float32Array(N),
    nutrient: fields.baseNutrient.slice(), moisture: fields.baseMoisture.slice(),
    temperature: fields.baseTemp.slice(), toxicity: new Float32Array(N),
    stress: new Float32Array(N), membrane: new Float32Array(N), alive: new Uint8Array(N),

    conductance: new Float32Array(E), edgePeak: new Float32Array(E),
    flux: new Float32Array(E), edgeAge: new Uint16Array(E), edgeActive: new Uint8Array(E),

    pressure: new Float32Array(N), nextEnergy: new Float32Array(N),
    expansions: new Uint8Array(N), bfsVisited: new Uint8Array(N), bfsQueue: new Uint32Array(N),

    entropyLut: buildEntropyLut(), seasonLut: buildSeasonLut(),
    nodeSeasonOffset: buildNodeSeasonOffsets(topo),
    events: scheduleEvents(eventRng, topo, fields, cfg.challenge ?? null),
    crisesEndured: 0, crisesTotal: 0,

    adaptationMode, adaptationOffers: [], nextOfferIndex: 0,
    lastOffered: [], lastAdaptationResolutionTick: -1, ownedCards: [],

    aliveCount: 0, coverage: 0, peakCoverage: 0, sustainedSum: 0,
    sustainedSamples: 0, connectedShare: 0, peakConnectedShare: 0,
    minConnectedWhileMajority: 1, largestComponent: 0,
    totalUptake: 0, totalMaintenance: 0, phenotypes: [],
    causes: { starvation: 0, heat: 0, cold: 0, drought: 0, toxin: 0, event: 0, collapse: 0 },

    phaseIndex: -1, coverageMilestoneIndex: 0, loopMilestone: false,
    replayVersion: 2, replay: [], history: [],
  };

  const start = cfg.inoculate ?? selectInoculation(fields, inoculationRng);
  if (!Number.isInteger(start) || start < 0 || start >= N) throw new Error(`invalid inoculation cell: ${start}`);
  state.inoculationCell = start;
  state.alive[start] = 1;
  state.biomass[start] = Math.fround(1.2);
  state.energy[start] = Math.fround(3.0);
  state.aliveCount = 1;
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

function isLand(fields, i) {
  if (fields.landMask != null) return Boolean(fields.landMask[i]);
  const biome = fields.biome?.[i];
  if (typeof biome === 'string') return !/^(ocean|water|sea)$/i.test(biome);
  if (typeof biome === 'number') return biome !== 0;
  return biome !== false && biome != null;
}
