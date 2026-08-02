/**
 * Compress one run into a bounded, connected Memory Globe filament.
 * Conductance survives edge deactivation, so it truthfully records which
 * routes carried and reinforced flow before terminal extinction.
 */
const MAX_EDGES = 28;

/** @param {object} state */
export function deriveImprint(state) {
  const { topo, edgePeak, seed } = state;
  let strongest = -1;
  for (let edge = 0; edge < topo.edgeCount; edge++) {
    if (edgePeak[edge] <= 0) continue;
    if (strongest < 0 || edgePeak[edge] > edgePeak[strongest]) strongest = edge;
  }
  if (strongest < 0) return Object.freeze({ kind: 'strongest-corridor', seed, edges: Object.freeze([]) });

  const usedEdges = new Uint8Array(topo.edgeCount);
  const usedCells = new Uint8Array(topo.nodeCount);
  const sides = [[], []];
  const ends = [topo.edgeA[strongest], topo.edgeB[strongest]];
  const stopped = [false, false];
  usedEdges[strongest] = 1;
  usedCells[ends[0]] = 1; usedCells[ends[1]] = 1;

  while (1 + sides[0].length + sides[1].length < MAX_EDGES) {
    let extended = false;
    for (let side = 0; side < 2; side++) {
      if (stopped[side] || 1 + sides[0].length + sides[1].length >= MAX_EDGES) continue;
      const next = strongestUnusedEdge(state, ends[side], usedEdges, usedCells);
      if (next < 0) { stopped[side] = true; continue; }
      usedEdges[next] = 1; sides[side].push(next); extended = true;
      const a = topo.edgeA[next]; const b = topo.edgeB[next];
      ends[side] = a === ends[side] ? b : a;
      usedCells[ends[side]] = 1;
    }
    if (!extended) break;
  }

  const edges = [...sides[0].reverse(), strongest, ...sides[1]];
  return Object.freeze({ kind: 'strongest-corridor', seed, edges: Object.freeze(edges) });
}

function strongestUnusedEdge(state, cell, usedEdges, usedCells) {
  const { topo, edgePeak } = state;
  let best = -1;
  for (let offset = topo.nodeStart[cell]; offset < topo.nodeStart[cell + 1]; offset++) {
    const edge = topo.nodeEdges[offset];
    if (usedEdges[edge] || edgePeak[edge] <= 0) continue;
    const neighbor = topo.nodeNeighbors[offset];
    if (usedCells[neighbor]) continue;
    if (best < 0 || edgePeak[edge] > edgePeak[best]
      || (edgePeak[edge] === edgePeak[best] && edge < best)) best = edge;
  }
  return best;
}
