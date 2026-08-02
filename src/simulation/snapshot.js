/** Renderer snapshot construction from canonical authority. */
import { liveScore } from '../game/scoring.js';

export function buildSnapshot(state) {
  return {
    tick: state.tick,
    entropy: state.entropy,
    status: state.status,
    adaptationMode: state.adaptationMode,
    pendingAdaptations: state.adaptationOffers.filter((offer) => offer.resolvedTick == null).length,
    biomass: state.biomass.slice(),
    stress: state.stress.slice(),
    nutrient: state.nutrient.slice(),
    alive: state.alive.slice(),
    conductance: state.conductance.slice(),
    flux: state.flux.slice(),
    edgeActive: state.edgeActive.slice(),
    metrics: {
      coverage: state.coverage,
      peakCoverage: state.peakCoverage,
      connectedShare: state.connectedShare,
      aliveCount: state.aliveCount,
      score: liveScore(state),
      vitality: vitality(state),
    },
    events: state.events
      .filter((event) => event.announced & 2 && state.tick <= event.endTick)
      .map((event) => ({ id: event.id, family: event.family, center: event.center,
        radiusDot: event.radiusDot, kind: event.kind, intensity: event.intensity })),
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
  return [snapshot.biomass.buffer, snapshot.stress.buffer, snapshot.nutrient.buffer,
    snapshot.alive.buffer, snapshot.conductance.buffer, snapshot.flux.buffer,
    snapshot.edgeActive.buffer];
}
