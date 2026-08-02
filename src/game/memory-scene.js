/** Project the stable Memory graph onto a compatible spherical topology. */
import { writeLifeStates } from '../core/life-state.js';

export function renderMemorySnapshot(topo, meta, scene) {
  const snapshot = {
    tick: scene.nodes.filter((node) => node.owned).length + (meta.imprints?.length ?? 0),
    entropy: 0.34, status: 'memory', biomass: new Float32Array(topo.nodeCount),
    stress: new Float32Array(topo.nodeCount), alive: new Uint8Array(topo.nodeCount),
    lifeState: new Uint8Array(topo.nodeCount), events: [],
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
  writeLifeStates(topo, snapshot.alive, snapshot.biomass, snapshot.stress, snapshot.lifeState);
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
      paintCells(snapshot, a, b, 0.78 + index * 0.03);
      if (index === imprints.length - 1) for (let axis = 0; axis < 3; axis++)
        focus[axis] += topo.positions[a * 3 + axis] + topo.positions[b * 3 + axis];
    }
  }
  const length = Math.hypot(...focus);
  return length > 0 ? focus.map((value) => value / length) : null;
}

function tracePath(topo, root, target, snapshot, tier) {
  const previousNode = new Int32Array(topo.nodeCount).fill(-1);
  const queue = new Uint16Array(topo.nodeCount);
  let head = 0; let tail = 1; queue[0] = root; previousNode[root] = root;
  while (head < tail && previousNode[target] < 0) {
    const cell = queue[head++];
    for (let offset = topo.nodeStart[cell]; offset < topo.nodeStart[cell + 1]; offset++) {
      const next = topo.nodeNeighbors[offset];
      if (previousNode[next] >= 0) continue;
      previousNode[next] = cell; queue[tail++] = next;
    }
  }
  for (let cell = target; cell !== root && previousNode[cell] >= 0; cell = previousNode[cell]) {
    paintCells(snapshot, cell, previousNode[cell], 0.58 + tier * 0.025);
  }
}

function paintCells(snapshot, a, b, biomass) {
  snapshot.alive[a] = 1; snapshot.alive[b] = 1;
  snapshot.biomass[a] = Math.max(snapshot.biomass[a], biomass);
  snapshot.biomass[b] = Math.max(snapshot.biomass[b], biomass);
}
