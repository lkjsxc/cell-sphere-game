/** Summary metrics, semantic milestones, and finite-resource evidence. */
import { BIOME, FEATURE } from '../world/fields.js';
import { recordHistory } from './replay.js';
import { sampleTrophyLiving } from './trophy-proof.js';
import { recordScoreSummary } from '../game/scoring.js';
import { sampleEnvironmentExposure } from '../game/environment-exposure.js';

const PHASES = Object.freeze([
  Object.freeze({ tick: 0, id: 'abundance' }),
  Object.freeze({ tick: 600, id: 'competition' }),
  Object.freeze({ tick: 1800, id: 'instability' }),
  Object.freeze({ tick: 3000, id: 'deep-pressure' }),
]);
const COVERAGE_MILESTONES = Object.freeze([0.1, 0.25, 0.5, 0.75]);

/** @param {object} state @param {(msg: object) => void} emit */
export function runSummary(state, emit) {
  const historyStart = state.history.length;
  const coverage = state.aliveCount / state.topo.nodeCount;
  state.coverage = coverage;
  if (coverage > state.peakCoverage) state.peakCoverage = coverage;
  let livingLand = 0; for (let cell = 0; cell < state.topo.nodeCount; cell++)
    if (state.alive[cell] && state.fields.landMask[cell]) livingLand++;
  const landOccupancy = state.landCellCount ? livingLand / state.landCellCount : 0;
  if (landOccupancy > state.peakLandOccupancy) state.peakLandOccupancy = landOccupancy;
  state.sustainedSum += coverage;
  state.sustainedSamples++;
  let stress = 0; for (let cell = 0; cell < state.topo.nodeCount; cell++) if (state.alive[cell]) stress += state.stress[cell];
  state.stressBurdenSum += state.aliveCount ? stress / state.aliveCount : 1;
  state.stressBurdenSamples++;
  if (state.connectedShare > state.peakConnectedShare) state.peakConnectedShare = state.connectedShare;
  if (coverage > 0.5 && state.connectedShare < state.minConnectedWhileMajority) {
    state.minConnectedWhileMajority = state.connectedShare;
  }
  sampleTrophyLiving(state);
  recordMilestones(state);
  recordGeography(state);
  recordMorphology(state);
  recordResourceState(state);
  sampleEnvironmentExposure(state.environmentExposure, {
    throughTick: state.tick,
    pressure: state.currentEnvironmentProfile?.score?.pressure ?? 0,
    quality: state.scoreMerit.quality,
    currentLevel: state.currentEnvironmentLevel,
    peakLevel: state.peakEnvironmentLevel,
    flush: true,
  });
  recordScoreSummary(state);
  if (state.history.length > historyStart) {
    emit({ t: 'history-batch', events: state.history.slice(historyStart).map((event) => ({ ...event })) });
  }
}


function recordMilestones(state) {
  while (state.phaseIndex + 1 < PHASES.length
    && state.tick >= PHASES[state.phaseIndex + 1].tick) {
    state.phaseIndex++;
    recordHistory(state, 'phase', { id: PHASES[state.phaseIndex].id });
  }
  while (state.coverageMilestoneIndex < COVERAGE_MILESTONES.length
    && state.coverage >= COVERAGE_MILESTONES[state.coverageMilestoneIndex]) {
    const value = COVERAGE_MILESTONES[state.coverageMilestoneIndex++];
    recordHistory(state, 'coverage', { value });
  }
  if (!state.loopMilestone && state.aliveCount > 2) {
    let edges = 0;
    for (let i = 0; i < state.edgeActive.length; i++) edges += state.edgeActive[i];
    if (edges >= state.aliveCount) {
      state.loopMilestone = true;
      recordHistory(state, 'network-loop', { edges, cells: state.aliveCount });
    }
  }
}

function recordGeography(state) {
  const checks = [
    [1, 'geo-coast', (i) => state.fields.featureFlags[i] & FEATURE.COAST],
    [2, 'geo-lake', (i) => state.fields.biomeId[i] === BIOME.LAKE],
    [4, 'geo-forest', (i) => state.fields.featureFlags[i] & FEATURE.FOREST],
    [8, 'geo-mountain', (i) => state.fields.biomeId[i] === BIOME.HIGHLAND || state.fields.biomeId[i] === BIOME.MOUNTAIN],
    [16, 'geo-wetland', (i) => state.fields.biomeId[i] === BIOME.WETLAND],
    [32, 'geo-world-knot', (i) => state.topo.degree[i] === 5],
  ];
  for (const [bit, type, predicate] of checks) {
    if (state.geographySeen & bit) continue;
    for (let cell = 0; cell < state.topo.nodeCount; cell++) if (state.alive[cell] && predicate(cell)) {
      state.geographySeen |= bit; recordHistory(state, type, { cell }); break;
    }
  }
}

function recordMorphology(state) {
  const fragmented = state.aliveCount > 8 && state.connectedShare < 0.88;
  if (fragmented && !state.wasFragmented) {
    state.wasFragmented = true;
    recordHistory(state, 'component-split', { value: state.connectedShare });
  } else if (!fragmented && state.wasFragmented && state.connectedShare > 0.95) {
    state.wasFragmented = false; state.reconnectedUntil = state.tick + 200;
    recordHistory(state, 'component-reconnected', { value: state.connectedShare });
  }
}

function recordResourceState(state) {
  const thresholds = [.75, .5, .25, .1]; const index = state.resourceMilestoneIndex ?? 0;
  let remaining = 0; let depleted = 0;
  for (const value of state.resourceReserve) { remaining += value; if (value <= .0001) depleted++; }
  state.resourceDepletedCells = depleted;
  if (index >= thresholds.length) return;
  let initial = 0; for (const value of state.initialResourceReserve) initial += value;
  const fraction = initial > 0 ? remaining / initial : 0;
  if (fraction <= thresholds[index]) {
    state.resourceMilestoneIndex = index + 1;
    recordHistory(state, 'resource-reserve', { value: thresholds[index], cells: depleted });
  }
}
