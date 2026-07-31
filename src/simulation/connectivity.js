/**
 * Connectivity analysis: largest connected living component via BFS over
 * active edges. Amortized — runs every CONNECTIVITY_EVERY ticks.
 */

/** @param {object} state */
export function analyzeConnectivity(state) {
  const { topo } = state;
  const { nodeStart, nodeNeighbors, nodeEdges } = topo;
  const { alive, edgeActive, bfsVisited, bfsQueue } = state;

  bfsVisited.fill(0);
  let largest = 0;

  for (let start = 0; start < topo.nodeCount; start++) {
    if (alive[start] !== 1 || bfsVisited[start] === 1) continue;

    // BFS
    let head = 0;
    let tail = 0;
    bfsQueue[tail++] = start;
    bfsVisited[start] = 1;
    let count = 0;

    while (head < tail) {
      const n = bfsQueue[head++];
      count++;
      const begin = nodeStart[n];
      const end = nodeStart[n + 1];
      for (let o = begin; o < end; o++) {
        const e = nodeEdges[o];
        if (edgeActive[e] !== 1) continue;
        const nb = nodeNeighbors[o];
        if (alive[nb] !== 1 || bfsVisited[nb] === 1) continue;
        bfsVisited[nb] = 1;
        bfsQueue[tail++] = nb;
      }
    }

    if (count > largest) largest = count;
  }

  state.largestComponent = largest;
  state.connectedShare = state.aliveCount > 0 ? largest / state.aliveCount : 0;
}
