/** Renderer snapshot construction from canonical authority. */
import { evaluate, metricsFromState } from '../game/scoring.js';
import { writeLifeStates } from '../core/life-state.js';
import { buildEventCellState } from './events.js';
import { buildReachSummary } from './lifecycle/reach-ledger.js';
import { packResourcePresentation, resourceConservation } from './resource-ecology.js';
import { reachGoalSummary } from './lifecycle/reach-goal.js';

export function buildSnapshot(state) {
  const lifeState = writeLifeStates(state.topo, state.alive, state.biomass, state.stress,
    new Uint8Array(state.topo.nodeCount)); const eventCells = buildEventCellState(state);
  const resource = packResourcePresentation(state);
  const scoreProjection = evaluate(metricsFromState(state));
  return {
    tick: state.tick,
    entropy: state.entropy,
    status: state.status,
    worldOrdinal: state.worldOrdinal, worldEra: state.worldEra,
    environmentLevel: state.environmentLevel, challengeProfileVersion: state.challengeProfileVersion,
    challengeProfileHash: state.challengeProfileHash, pressureProfile: state.challengeProfile,
    biomass: state.biomass.slice(),
    stress: state.stress.slice(),
    alive: state.alive.slice(),
    lifeState,
    eventStrength: eventCells.strength,
    eventFamily: eventCells.family,
    ...resource,
    transformationState: state.transformationState.slice(),
    electricityQ: state.electricityQ.slice(),
    electricityDevelopment: state.electricityMastery?.visualDevelopment ?? 0,
    reach: { ...buildReachSummary(state), goal: reachGoalSummary(state) },
    metrics: {
      coverage: state.coverage,
      peakCoverage: state.peakCoverage, peakLandOccupancy: state.peakLandOccupancy,
      connectedShare: state.connectedShare,
      aliveCount: state.aliveCount,
      totalLivingBiomass: state.liveness.totalBiomass,
      viableEnergyCells: state.liveness.viableEnergyCount,
      activeFrontierCells: state.liveness.activeFrontierCount,
      terminalCause: state.terminalCause,
      resourceReserveFraction: initialReserve(state) > 0 ? remainingReserve(state) / initialReserve(state) : 0,
      resourceDepletedCells: state.resourceDepletedCells, resourceRecoveredCells: state.resourceRecoveredCells,
      freshwaterSupportedCellSeconds: state.freshwaterSupportedCellTicks / 10,
      transformedCells: state.transformedCells, electrifiedCells: state.electrifiedCells,
      electricityMasteryRating: state.electricityMastery?.rating ?? '0',
      conservationError: resourceConservation(state).error,
      score: state.scoreMerit.total,
      scoreProjection,
      vitality: vitality(state),
    },
    events: state.events
      .filter((event) => event.announced & 2 && state.tick <= event.endTick)
      .map((event) => ({ id: event.id, family: event.family, center: event.center,
        fieldVersion: event.fieldVersion, kind: event.kind, intensity: event.intensity })),
  };
}

function remainingReserve(state) { let total = 0; for (const value of state.resourceReserve) total += value; return total; }
function initialReserve(state) { let total = 0; for (const value of state.initialResourceReserve) total += value; return total; }

function vitality(state) {
  if (state.aliveCount === 0) return 0;
  let energySum = 0;
  let stressSum = 0;
  for (let i = 0; i < state.topo.nodeCount; i++) {
    if (state.alive[i] !== 1) continue;
    energySum += Math.min(1, Math.max(0, state.energy[i] / 2));
    stressSum += state.stress[i];
  }
  const n = state.aliveCount;
  return Math.max(0, Math.min(1, (energySum / n) * 0.6 + (1 - stressSum / n) * 0.4));
}

export function snapshotTransfers(snapshot) {
  return [snapshot.biomass.buffer, snapshot.stress.buffer, snapshot.alive.buffer,
    snapshot.lifeState.buffer, snapshot.eventStrength.buffer, snapshot.eventFamily.buffer,
    snapshot.resourceRichnessQ.buffer, snapshot.reserveFractionQ.buffer, snapshot.resourceState.buffer,
    snapshot.transformationState.buffer, snapshot.electricityQ.buffer];
}
