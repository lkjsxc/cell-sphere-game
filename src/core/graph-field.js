/** Deterministic bounded Dijkstra over canonical CSR adjacency. */
export const GRAPH_UNREACHABLE = 0xffffffff;
export function weightedGraphField(options) {
  const { topo } = options; const count = topo.nodeCount; const maxCost = Math.max(0, options.maxCost ?? GRAPH_UNREACHABLE);
  const distance = new Uint32Array(count); distance.fill(GRAPH_UNREACHABLE);
  const predecessor = new Int32Array(count); predecessor.fill(-1); const settled = new Uint8Array(count);
  const capacity = Math.max(count + 1, topo.edgeCount * 2 + (options.sources?.length ?? 1) + 1);
  const heapCell = new Uint16Array(capacity); const heapCost = new Uint32Array(capacity); let size = 0; let settledCount = 0;
  for (const source of options.sources ?? []) if (Number.isInteger(source) && source >= 0 && source < count && distance[source] !== 0) {
    distance[source] = 0; push(source, 0);
  }
  while (size && settledCount < (options.maxSettled ?? count)) {
    const [cell, cost] = pop(); if (settled[cell] || distance[cell] !== cost || cost > maxCost) continue;
    settled[cell] = 1; settledCount++;
    for (let offset = topo.nodeStart[cell]; offset < topo.nodeStart[cell + 1]; offset++) {
      const next = topo.nodeNeighbors[offset]; if (settled[next] || options.passable && !options.passable(cell, next)) continue;
      const step = Math.max(1, Math.round(options.edgeCost?.(cell, next) ?? 1)); const candidate = cost + step;
      if (candidate > maxCost || candidate >= distance[next]) continue;
      distance[next] = candidate; predecessor[next] = cell; push(next, candidate);
    }
  }
  for (let cell = 0; cell < count; cell++) if (!settled[cell]) { distance[cell] = GRAPH_UNREACHABLE; predecessor[cell] = -1; }
  return { distance, predecessor, settled, settledCount };

  function less(aCost, aCell, bCost, bCell) { return aCost < bCost || aCost === bCost && aCell < bCell; }
  function push(cell, cost) { let index = size++; if (index >= capacity) throw new Error('graph field heap capacity exceeded');
    while (index > 0) { const parent = (index - 1) >> 1; if (!less(cost, cell, heapCost[parent], heapCell[parent])) break;
      heapCell[index] = heapCell[parent]; heapCost[index] = heapCost[parent]; index = parent; }
    heapCell[index] = cell; heapCost[index] = cost;
  }
  function pop() { const cell = heapCell[0]; const cost = heapCost[0]; const nextSize = --size;
    if (nextSize > 0) { const tailCell = heapCell[nextSize]; const tailCost = heapCost[nextSize]; let index = 0;
      while (true) { const left = index * 2 + 1; if (left >= nextSize) break; const right = left + 1;
        const child = right < nextSize && less(heapCost[right], heapCell[right], heapCost[left], heapCell[left]) ? right : left;
        if (!less(heapCost[child], heapCell[child], tailCost, tailCell)) break;
        heapCell[index] = heapCell[child]; heapCost[index] = heapCost[child]; index = child; }
      heapCell[index] = tailCell; heapCost[index] = tailCost; }
    return [cell, cost]; }
}
