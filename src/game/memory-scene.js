/** Direct cellular projection for the dedicated level-3 Memory atlas. */
export const MEMORY_STATUS = Object.freeze({
  EMPTY: 0, LOCKED: 1, UNAFFORDABLE: 2, AFFORDABLE: 3, OWNED: 4,
  SELECTED_LOCKED: 5, SELECTED_UNAFFORDABLE: 6, SELECTED_AFFORDABLE: 7, SELECTED_OWNED: 8,
});
const KINDS = Object.freeze({ micro: 1, conditional: 2, unlock: 3, keystone: 4, connector: 5, capstone: 6 });
const BRANCHES = Object.freeze({ Reach: 1, Flow: 2, Reserve: 3, Ecology: 4, Perception: 5, Continuity: 6 });

export function createMemoryFields(topo) {
  const floats = () => new Float32Array(topo.nodeCount);
  const baseNutrient = floats(); const baseMoisture = floats(); const baseTemp = floats(); const altitude = floats();
  baseNutrient.fill(0.22); baseMoisture.fill(0.18); baseTemp.fill(0.35); altitude.fill(0.43);
  return Object.freeze({ baseNutrient, baseMoisture, baseTemp, altitude,
    biomeId: new Uint8Array(topo.nodeCount).fill(9), forestDensity: floats(), riverStrength: floats(),
    ridgeStrength: floats(), landMask: new Uint8Array(topo.nodeCount).fill(1), drainTo: new Int16Array(topo.nodeCount).fill(-1),
    landmarks: Object.freeze([]), sources: Object.freeze([0]) });
}

export function renderMemorySnapshot(topo, meta, scene, emphasizedIds = []) {
  if (topo.levels !== 3 || topo.nodeCount !== 642) throw new Error('Memory requires the level-3 atlas topology');
  const count = topo.nodeCount; const status = new Uint8Array(count); const branch = new Uint8Array(count);
  const tier = new Uint8Array(count); const kind = new Uint8Array(count); const imprintWeight = new Float32Array(count);
  const nodeIndex = new Int16Array(count).fill(-1); const emphasis = new Uint8Array(count);
  const emphasized = new Set(emphasizedIds); const focusCells = [];
  scene.nodes.forEach((node, index) => {
    const selected = node.id === scene.selectedId;
    status[node.cell] = statusFor(node, selected); branch[node.cell] = BRANCHES[node.branch];
    tier[node.cell] = node.tier; kind[node.cell] = KINDS[node.kind]; nodeIndex[node.cell] = index;
    if (emphasized.has(node.id)) emphasis[node.cell] = 1;
    if (node.owned || (node.reachable && node.affordable)) focusCells.push(node.cell);
  });
  for (let imprint = 0; imprint < (meta.imprints?.length ?? 0); imprint++) {
    const weight = 0.25 + 0.65 * ((imprint + 1) / Math.max(1, meta.imprints.length));
    for (const cell of meta.imprints[imprint].cells ?? []) if (cell >= 0 && cell < count)
      imprintWeight[cell] = Math.max(imprintWeight[cell], weight);
  }
  const snapshot = Object.freeze({
    tick: scene.nodes.filter((node) => node.owned).length * 16 + (scene.selectedId ? 1 : 0),
    entropy: 0.30, status: 'memory', events: [], memoryStatus: status, memoryBranch: branch,
    memoryTier: tier, memoryKind: kind, memoryImprintWeight: imprintWeight,
    memoryNodeIndex: nodeIndex, memoryEmphasis: emphasis, memoryScene: scene, nodeStates: scene.nodes,
    metrics: Object.freeze({ coverage: scene.nodes.filter((node) => node.owned).length / 108,
      score: 0, pendingAdaptations: 0 }), focus: focusDirection(topo, focusCells),
  });
  return snapshot;
}

function statusFor(node, selected) {
  if (node.owned) return selected ? MEMORY_STATUS.SELECTED_OWNED : MEMORY_STATUS.OWNED;
  if (node.locked) return selected ? MEMORY_STATUS.SELECTED_LOCKED : MEMORY_STATUS.LOCKED;
  if (node.affordable) return selected ? MEMORY_STATUS.SELECTED_AFFORDABLE : MEMORY_STATUS.AFFORDABLE;
  return selected ? MEMORY_STATUS.SELECTED_UNAFFORDABLE : MEMORY_STATUS.UNAFFORDABLE;
}
function focusDirection(topo, cells) {
  const use = cells.length ? cells : [58, 16, 24, 152, 27, 18]; const focus = [0, 0, 0];
  for (const cell of use) for (let axis = 0; axis < 3; axis++) focus[axis] += topo.positions[cell * 3 + axis];
  const length = Math.hypot(...focus); return length ? focus.map((value) => value / length) : [0, 0, 1];
}
