/** Compact presentation-only cellular life semantics. */
export const LIFE_STATE = Object.freeze({
  UNOCCUPIED: 0,
  LIVING: 1,
  FRONTIER: 2,
  STRESSED: 3,
  CRITICAL: 4,
  DEAD_REMAINS: 5,
});

/** Write per-cell semantics into a caller-owned Uint8Array. */
export function writeLifeStates(topo, alive, biomass, stress, out) {
  for (let cell = 0; cell < topo.nodeCount; cell++) {
    if (alive[cell] !== 1) {
      out[cell] = biomass[cell] > 0 ? LIFE_STATE.DEAD_REMAINS : LIFE_STATE.UNOCCUPIED;
      continue;
    }
    if (stress[cell] >= 1) {
      out[cell] = LIFE_STATE.CRITICAL;
      continue;
    }
    if (stress[cell] >= 0.62) {
      out[cell] = LIFE_STATE.STRESSED;
      continue;
    }
    let frontier = false;
    for (let offset = topo.nodeStart[cell]; offset < topo.nodeStart[cell + 1]; offset++) {
      if (alive[topo.nodeNeighbors[offset]] !== 1) {
        frontier = true;
        break;
      }
    }
    out[cell] = frontier ? LIFE_STATE.FRONTIER : LIFE_STATE.LIVING;
  }
  return out;
}
