/**
 * Snapshot construction for the renderer. Copies only what rendering needs;
 * the copies are transferable over the worker channel.
 */

/**
 * @param {object} state
 * @returns {object} snapshot with fresh typed-array copies + scalar metrics
 */
export function buildSnapshot(state) {
  return {
    tick: state.tick,
    entropy: state.entropy,
    status: state.status,
    biomass: state.biomass.slice(),
    stress: state.stress.slice(),
    signal: state.signal.slice(),
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
      signalCharges: state.signalCharges,
      vitality: vitality(state),
    },
    signals: state.activeSignals.map((s) => ({ node: s.node, untilTick: s.untilTick })),
    events: state.events
      .filter((ev) => ev.announced & 2 && state.tick <= ev.endTick)
      .map((ev) => ({ family: ev.family, center: ev.center, radiusDot: ev.radiusDot,
        kind: ev.kind, intensity: ev.intensity })),
  };
}

/** Vitality: 0..1 composite of energy health and low stress (HUD metric). */
function vitality(state) {
  if (state.aliveCount === 0) return 0;
  let energySum = 0;
  let stressSum = 0;
  const { alive, energy, stress } = state;
  for (let i = 0; i < state.topo.nodeCount; i++) {
    if (alive[i] !== 1) continue;
    energySum += Math.min(1, Math.max(0, energy[i] / 2));
    stressSum += stress[i];
  }
  const n = state.aliveCount;
  return Math.max(0, Math.min(1, (energySum / n) * 0.6 + (1 - stressSum / n) * 0.4));
}

/** List of transferable buffers inside a snapshot. */
export function snapshotTransfers(snap) {
  return [
    snap.biomass.buffer, snap.stress.buffer, snap.signal.buffer,
    snap.nutrient.buffer, snap.alive.buffer, snap.conductance.buffer,
    snap.flux.buffer, snap.edgeActive.buffer,
  ];
}
