/**
 * Per-snapshot instance buffer construction for veins and tips.
 * Writes into preallocated Float32Arrays — no allocation per snapshot.
 */

/**
 * Fill the vein instance buffer from a snapshot.
 * Layout per instance (9 floats): posA(3), posB(3), width, stress, |flux|.
 * @returns {number} instance count
 */
export function buildVeinInstances(topo, snapshot, out, dual = null) {
  const { edgeA, edgeB, positions, edgeCount } = topo;
  const { edgeActive, conductance, flux, stress } = snapshot;
  let n = 0;
  for (let e = 0; e < edgeCount; e++) {
    if (edgeActive[e] !== 1) continue;
    const a = edgeA[e];
    const b = edgeB[e];
    const o = n * 9;
    const ai = dual ? dual.boundaryCornerA[e] * 3 : a * 3;
    const bi = dual ? dual.boundaryCornerB[e] * 3 : b * 3;
    const source = dual ? dual.corners : positions;
    out[o] = source[ai];
    out[o + 1] = source[ai + 1];
    out[o + 2] = source[ai + 2];
    out[o + 3] = source[bi];
    out[o + 4] = source[bi + 1];
    out[o + 5] = source[bi + 2];
    // Width from conductance; stress averaged; flux normalized.
    out[o + 6] = 0.004 + conductance[e] * 0.007;
    out[o + 7] = (stress[a] + stress[b]) * 0.5;
    out[o + 8] = Math.min(1, Math.abs(flux[e]) * 3.0);
    n++;
  }
  return n;
}

/**
 * Fill the tip instance buffer: living frontier nodes (alive with at least
 * one non-living neighbor). Layout per instance (5 floats): pos(3), size, stress.
 * @returns {number} instance count
 */
export function buildTipInstances(topo, snapshot, out) {
  const { nodeStart, nodeNeighbors, positions, nodeCount } = topo;
  const { alive, biomass, stress } = snapshot;
  let n = 0;
  for (let i = 0; i < nodeCount; i++) {
    if (alive[i] !== 1) continue;
    let frontier = false;
    for (let o = nodeStart[i]; o < nodeStart[i + 1]; o++) {
      if (alive[nodeNeighbors[o]] !== 1) { frontier = true; break; }
    }
    if (!frontier) continue;
    const o = n * 5;
    out[o] = positions[i * 3];
    out[o + 1] = positions[i * 3 + 1];
    out[o + 2] = positions[i * 3 + 2];
    out[o + 3] = 0.014 + biomass[i] * 0.012;
    out[o + 4] = stress[i];
    n++;
  }
  return n;
}

/** Event kind -> tint color for the globe shader. */
export const EVENT_TINTS = Object.freeze({
  drought: [0.85, 0.62, 0.30],
  heat: [1.0, 0.42, 0.28],
  freeze: [0.55, 0.75, 1.0],
  'toxic-rain': [0.62, 0.85, 0.35],
  'solar-flare': [1.0, 0.92, 0.6],
  ash: [0.55, 0.5, 0.48],
  bloom: [0.45, 1.0, 0.6],
  blight: [0.85, 0.45, 0.75],
});
