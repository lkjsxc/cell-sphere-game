/** Stable coastal outlets: one per land component plus separated low coasts. */
export function chooseDrainageOutlets(topo, terrain, target = 14) {
  const n = topo.nodeCount; const coastal = [];
  for (let cell = 0; cell < n; cell++) if (terrain.landMask[cell]) {
    for (let offset = topo.nodeStart[cell]; offset < topo.nodeStart[cell + 1]; offset++) if (!terrain.landMask[topo.nodeNeighbors[offset]]) {
      coastal.push(cell); break;
    }
  }
  coastal.sort((a, b) => terrain.baseElevation[a] - terrain.baseElevation[b] || a - b);
  const selected = new Set(); const seen = new Uint8Array(n); const queue = new Int32Array(n);
  for (let root = 0; root < n; root++) if (terrain.landMask[root] && !seen[root]) {
    let head = 0; let tail = 1; queue[0] = root; seen[root] = 1; let outlet = -1;
    while (head < tail) { const cell = queue[head++]; if (isCoast(topo, terrain.landMask, cell)
        && (outlet < 0 || terrain.baseElevation[cell] < terrain.baseElevation[outlet])) outlet = cell;
      for (let offset = topo.nodeStart[cell]; offset < topo.nodeStart[cell + 1]; offset++) { const next = topo.nodeNeighbors[offset];
        if (terrain.landMask[next] && !seen[next]) { seen[next] = 1; queue[tail++] = next; } } }
    if (outlet >= 0) selected.add(outlet);
  }
  for (const cell of coastal) { if (selected.size >= target) break;
    if ([...selected].every((other) => dot(topo.positions, cell, other) < .965)) selected.add(cell); }
  for (const cell of coastal) { if (selected.size >= target) break; selected.add(cell); }
  const mask = new Uint8Array(n); for (const cell of selected) mask[cell] = 1; return mask;
}
function isCoast(topo, land, cell) { for (let offset = topo.nodeStart[cell]; offset < topo.nodeStart[cell + 1]; offset++) if (!land[topo.nodeNeighbors[offset]]) return true; return false; }
function dot(positions, a, b) { const ai = a * 3; const bi = b * 3;
  return positions[ai] * positions[bi] + positions[ai + 1] * positions[bi + 1] + positions[ai + 2] * positions[bi + 2]; }
