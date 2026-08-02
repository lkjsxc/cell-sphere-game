/** Deterministic healthiest, most central living cell; consumes no random stream. */
export function chooseAdaptationOrigin(state) {
  const { topo, alive, biomass, energy, stress, bfsVisited: seen, bfsQueue: queue } = state;
  seen.fill(0); let bestCell = -1; let bestComponent = -1; let bestScore = -Infinity;
  for (let start = 0; start < topo.nodeCount; start++) {
    if (!alive[start] || seen[start]) continue;
    let head = 0; let tail = 0; let componentId = start; let cx = 0; let cy = 0; let cz = 0;
    queue[tail++] = start; seen[start] = 1;
    while (head < tail) {
      const cell = queue[head++]; componentId = Math.min(componentId, cell); const p = cell * 3;
      cx += topo.positions[p]; cy += topo.positions[p + 1]; cz += topo.positions[p + 2];
      for (let o = topo.nodeStart[cell]; o < topo.nodeStart[cell + 1]; o++) {
        const next = topo.nodeNeighbors[o];
        if (alive[next] && !seen[next]) { seen[next] = 1; queue[tail++] = next; }
      }
    }
    const length = Math.hypot(cx, cy, cz) || 1; cx /= length; cy /= length; cz /= length;
    for (let i = 0; i < tail; i++) {
      const cell = queue[i]; const p = cell * 3; let degree = 0;
      for (let o = topo.nodeStart[cell]; o < topo.nodeStart[cell + 1]; o++) degree += alive[topo.nodeNeighbors[o]];
      const centrality = Math.max(0, (topo.positions[p] * cx + topo.positions[p + 1] * cy + topo.positions[p + 2] * cz + 1) * 0.5);
      const b = Math.max(0, biomass[cell]); const e = Math.max(0, energy[cell]);
      const score = b / (b + 1) * 0.26 + e / (e + 2) * 0.22 + (1 - Math.min(1, stress[cell])) * 0.18
        + centrality * 0.20 + degree / Math.max(1, topo.nodeStart[cell + 1] - topo.nodeStart[cell]) * 0.14;
      if (score > bestScore || (score === bestScore && cell < bestCell)) {
        bestScore = score; bestCell = cell; bestComponent = componentId;
      }
    }
  }
  return { cell: bestCell, componentId: bestComponent };
}
