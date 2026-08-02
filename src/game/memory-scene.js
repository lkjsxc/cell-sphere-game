/** Project the stable Memory graph onto a compatible spherical topology. */
export function renderMemorySnapshot(topo, meta, scene) {
  const snapshot = {
    tick: scene.nodes.filter((node) => node.owned).length + (meta.imprints?.length ?? 0),
    entropy: 0.34, status: 'memory', biomass: new Float32Array(topo.nodeCount),
    stress: new Float32Array(topo.nodeCount), alive: new Uint8Array(topo.nodeCount),
    conductance: new Float32Array(topo.edgeCount), flux: new Float32Array(topo.edgeCount),
    edgeActive: new Uint8Array(topo.edgeCount), events: [],
    metrics: { coverage: 0, score: 0, pendingAdaptations: 0 },
    memoryScene: scene, nodeStates: scene.nodes,
  };
  const byId = new Map(scene.nodes.map((node) => [node.id, node]));
  for (const node of scene.nodes) {
    const cell = projectCell(node.cell, topo.nodeCount);
    snapshot.alive[cell] = 1;
    snapshot.biomass[cell] = node.owned ? 1.20 : node.reachable ? 0.76 : 0.22;
    snapshot.stress[cell] = node.owned ? 0 : node.reachable ? 0.18 : 0.72;
    if (!node.owned) continue;
    if (!node.requires.length) tracePath(topo, 12 % topo.nodeCount, cell, snapshot, node.tier);
    for (const required of node.requires) {
      const parent = byId.get(required);
      if (parent) tracePath(topo, projectCell(parent.cell, topo.nodeCount), cell, snapshot, node.tier);
    }
  }
  snapshot.focus = applyImprints(topo, meta.imprints ?? [], snapshot);
  snapshot.metrics.coverage = snapshot.alive.reduce((sum, value) => sum + value, 0) / topo.nodeCount;
  return snapshot;
}

function projectCell(cell, count) { return count === 2562 ? cell : cell % count; }

function applyImprints(topo, imprints, snapshot) {
  const focus = [0, 0, 0];
  for (let index = 0; index < imprints.length; index++) {
    for (const edge of imprints[index].edges ?? []) {
      if (edge < 0 || edge >= topo.edgeCount) continue;
      const a = topo.edgeA[edge]; const b = topo.edgeB[edge];
      paintEdge(snapshot, edge, a, b, 1.25 + index * 0.04, 0.28);
      if (index === imprints.length - 1) for (let axis = 0; axis < 3; axis++)
        focus[axis] += topo.positions[a * 3 + axis] + topo.positions[b * 3 + axis];
    }
  }
  const length = Math.hypot(...focus);
  return length > 0 ? focus.map((value) => value / length) : null;
}

function tracePath(topo, root, target, snapshot, tier) {
  const previousNode = new Int32Array(topo.nodeCount).fill(-1);
  const previousEdge = new Int32Array(topo.nodeCount).fill(-1);
  const queue = new Uint16Array(topo.nodeCount);
  let head = 0; let tail = 1; queue[0] = root; previousNode[root] = root;
  while (head < tail && previousNode[target] < 0) {
    const cell = queue[head++];
    for (let offset = topo.nodeStart[cell]; offset < topo.nodeStart[cell + 1]; offset++) {
      const next = topo.nodeNeighbors[offset];
      if (previousNode[next] >= 0) continue;
      previousNode[next] = cell; previousEdge[next] = topo.nodeEdges[offset]; queue[tail++] = next;
    }
  }
  for (let cell = target; cell !== root && previousNode[cell] >= 0; cell = previousNode[cell]) {
    const edge = previousEdge[cell]; const parent = previousNode[cell];
    paintEdge(snapshot, edge, cell, parent, 0.68 + tier * 0.035, 0.18);
  }
}

function paintEdge(snapshot, edge, a, b, conductance, flux) {
  snapshot.edgeActive[edge] = 1;
  snapshot.conductance[edge] = Math.max(snapshot.conductance[edge], conductance);
  snapshot.flux[edge] = Math.max(snapshot.flux[edge], flux);
  snapshot.alive[a] = 1; snapshot.alive[b] = 1;
  snapshot.biomass[a] = Math.max(snapshot.biomass[a], 0.62);
  snapshot.biomass[b] = Math.max(snapshot.biomass[b], 0.62);
}
