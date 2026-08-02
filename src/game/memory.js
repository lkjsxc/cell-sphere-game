/** Permanent Memory Globe progression and its compact spherical visual state. */
const ADDITIVE = new Set(['signalCharges']);

export const MEMORY_NODES = Object.freeze([
  node('first-trace', 2, [], 'First Trace', '最初の痕跡',
    'Carry one extra Signal into every world.', 'Signalを1つ多く次の世界へ持ち込む。', { signalCharges: 1 }),
  node('deep-reserve', 5, ['first-trace'], 'Deep Reserve', '深層貯蔵',
    'Begin with a larger energy ceiling.', 'エネルギーの上限が少し広がる。', { energyCap: 1.08 }),
  node('remembered-reach', 5, ['first-trace'], 'Remembered Reach', '記憶された到達',
    'Frontiers recognize promising ground sooner.', '前線が有望な土地を早く見つける。', { reach: 1.06 }),
  node('flow-imprint', 8, ['deep-reserve'], 'Flow Imprint', '流れの刻印',
    'Useful routes carry more between cells.', '役立つ経路の輸送力が高まる。', { conductance: 1.08 }),
  node('scar-wisdom', 8, ['remembered-reach'], 'Scar Wisdom', '傷跡の知恵',
    'Past crises temper future tissue.', '過去の危機が次の組織を強くする。', { stressResist: 1.08 }),
  node('continuity', 12, ['flow-imprint', 'scar-wisdom'], 'Continuity', '連続性',
    'Memory lowers the cost of staying connected.', '記憶が結合を保つ負担を軽くする。', { maintenance: 0.96 }),
]);

const BY_ID = new Map(MEMORY_NODES.map((value) => [value.id, value]));

function node(id, cost, requires, nameEn, nameJa, effectEn, effectJa, effects) {
  return Object.freeze({ id, cost, requires: Object.freeze(requires), nameEn, nameJa,
    effectEn, effectJa, effects: Object.freeze(effects) });
}

export function canPurchaseMemory(meta, id) {
  const target = BY_ID.get(id);
  if (!target || meta.memoryNodes.includes(id) || meta.echoBalance < target.cost) return false;
  return target.requires.every((required) => meta.memoryNodes.includes(required));
}

export function purchaseMemory(meta, id) {
  if (!canPurchaseMemory(meta, id)) return { ok: false, meta };
  const target = BY_ID.get(id);
  return {
    ok: true,
    node: target,
    meta: { ...meta, echoBalance: meta.echoBalance - target.cost,
      memoryNodes: [...meta.memoryNodes, id] },
  };
}

export function memoryEffects(meta) {
  const effects = {};
  for (const id of meta.memoryNodes) {
    const value = BY_ID.get(id);
    if (!value) continue;
    for (const [key, amount] of Object.entries(value.effects)) {
      if (ADDITIVE.has(key)) effects[key] = (effects[key] ?? 0) + amount;
      else effects[key] = (effects[key] ?? 1) * amount;
    }
  }
  return effects;
}

export function campaignResolved(meta) {
  return meta.memoryNodes.includes('continuity');
}

/** Build a bounded fossil snapshot; no run arrays are persisted. */
export function buildMemorySnapshot(topo, meta) {
  const snapshot = {
    tick: meta.memoryNodes.length, entropy: 0.74, status: 'memory',
    biomass: new Float32Array(topo.nodeCount),
    stress: new Float32Array(topo.nodeCount),
    alive: new Uint8Array(topo.nodeCount),
    conductance: new Float32Array(topo.edgeCount),
    flux: new Float32Array(topo.edgeCount),
    edgeActive: new Uint8Array(topo.edgeCount),
    events: [], signals: [], metrics: { coverage: 0, signalCharges: 0, signalMax: 0, score: 0 },
  };
  const roots = [7, 8, 1, 6, 0, 11];
  const targets = [105, 401, 1557, 1562, 1635, 402];
  for (let index = 0; index < meta.memoryNodes.length; index++) {
    const root = roots[index % roots.length] % topo.nodeCount;
    const target = targets[index % targets.length] % topo.nodeCount;
    tracePath(topo, root, target, snapshot, index);
  }
  snapshot.metrics.coverage = snapshot.alive.reduce((sum, value) => sum + value, 0) / topo.nodeCount;
  return snapshot;
}

function tracePath(topo, root, target, snapshot, variant) {
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
  let cell = target;
  while (cell !== root && previousNode[cell] >= 0) {
    const edge = previousEdge[cell];
    snapshot.edgeActive[edge] = 1;
    snapshot.conductance[edge] = 0.72 + variant * 0.08;
    snapshot.flux[edge] = 0.18;
    snapshot.alive[cell] = 1; snapshot.biomass[cell] = 0.62;
    cell = previousNode[cell];
  }
  snapshot.alive[root] = 1; snapshot.biomass[root] = 0.72;
}
