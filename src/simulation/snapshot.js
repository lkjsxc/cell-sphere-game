/** Renderer snapshot construction from canonical authority. */
import { evaluate, metricsFromState } from '../game/scoring.js';
import { writeLifeStates } from '../core/life-state.js';
import { buildEventCellState } from './events.js';
import { buildReachSummary } from './lifecycle/reach-ledger.js';

export function buildSnapshot(state) {
  const lifeState = writeLifeStates(state.topo, state.alive, state.biomass, state.stress,
    new Uint8Array(state.topo.nodeCount)); const eventCells = buildEventCellState(state);
  const scoreProjection = evaluate(metricsFromState(state));
  return {
    tick: state.tick,
    entropy: state.entropy,
    status: state.status,
    adaptationMode: state.adaptationMode,
    pendingAdaptations: state.adaptationOffers.filter((offer) => offer.resolvedTick == null).length,
    biomass: state.biomass.slice(),
    stress: state.stress.slice(),
    alive: state.alive.slice(),
    lifeState,
    eventStrength: eventCells.strength,
    eventFamily: eventCells.family,
    reach: buildReachSummary(state),
    metrics: {
      coverage: state.coverage,
      peakCoverage: state.peakCoverage,
      connectedShare: state.connectedShare,
      aliveCount: state.aliveCount,
      totalLivingBiomass: state.liveness.totalBiomass,
      viableEnergyCells: state.liveness.viableEnergyCount,
      activeFrontierCells: state.liveness.activeFrontierCount,
      terminalCause: state.terminalCause,
      score: scoreProjection.total,
      scoreProjection,
      vitality: vitality(state),
    },
    events: state.events
      .filter((event) => event.announced & 2 && state.tick <= event.endTick)
      .map((event) => ({ id: event.id, family: event.family, center: event.center,
        fieldVersion: event.fieldVersion, kind: event.kind, intensity: event.intensity })),
  };
}

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
    snapshot.lifeState.buffer, snapshot.eventStrength.buffer, snapshot.eventFamily.buffer];
}
