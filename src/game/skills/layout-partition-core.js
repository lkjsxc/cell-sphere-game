/** Bounded connected-capacity transfers shared by domain and archetype partitions. */
const UNASSIGNED = 0xff;

export function assignDomainVoronoi({ topology, metricByOwner, seeds, domainCapacity, fixedOwnerByCell, weight, work }) {
  const ownerByCell = new Uint8Array(topology.nodeCount); const count = new Uint16Array(weight.length);
  let valid = true;
  for (let cell = 0; cell < topology.nodeCount; cell++) {
    let owner = fixedOwnerByCell[cell];
    if (owner === UNASSIGNED) {
      owner = 0;
      for (let candidate = 1; candidate < weight.length; candidate++) {
        const candidateDistance = metricByOwner[candidate][cell] - weight[candidate];
        const ownerDistance = metricByOwner[owner][cell] - weight[owner];
        if (candidateDistance < ownerDistance || (candidateDistance === ownerDistance
          && (domainCapacity[candidate] > domainCapacity[owner]
            || (domainCapacity[candidate] === domainCapacity[owner] && candidate < owner)))) owner = candidate;
      }
    }
    ownerByCell[cell] = owner; count[owner]++; work.voronoiVisits = (work.voronoiVisits ?? 0) + 1;
  }
  for (let owner = 0; owner < weight.length; owner++) if (ownerByCell[seeds[owner]] !== owner) { valid = false; break; }
  let deviation = 0;
  for (let owner = 0; owner < weight.length; owner++) deviation += Math.abs(count[owner] - domainCapacity[owner]);
  return { ownerByCell, count, deviation, valid };
}

export function balanceConnectedPartition({
  topology, ownerByCell, size, capacity, seeds, distanceByOwner, protectedMask = null, work, label,
}) {
  const seedMask = new Uint8Array(topology.nodeCount);
  for (const seed of seeds) seedMask[seed] = 1;
  if (protectedMask) for (let cell = 0; cell < topology.nodeCount; cell++) seedMask[cell] |= protectedMask[cell];
  const maximumTransfers = topology.nodeCount * size.length * 4;
  const startingTransfers = work.transfers ?? 0;
  while (true) {
    let deficit = -1;
    for (let owner = 0; owner < size.length; owner++) if (size[owner] < capacity[owner]
      && (deficit < 0 || capacity[owner] - size[owner] > capacity[deficit] - size[deficit]
        || (capacity[owner] - size[owner] === capacity[deficit] - size[deficit] && owner < deficit))) deficit = owner;
    if (deficit < 0) return;
    if ((work.transfers ?? 0) - startingTransfers >= maximumTransfers) throw new Error(`Evolution ${label} balance exceeded its transfer bound`);
    const path = findTransferPath({ topology, deficit, ownerByCell, size, capacity, seedMask,
      distanceByOwner, work });
    if (!path) throw new Error(`Evolution ${label} cannot route capacity to region ${deficit}; sizes ${Array.from(size)}; capacities ${Array.from(capacity)}`);
    for (let step = 0; step < path.length - 1; step++) {
      const recipient = path[step]; const donor = path[step + 1];
      const cell = selectTransferCell({ topology, recipient, donor, ownerByCell, size, seedMask,
        recipientDistance: distanceByOwner[recipient], work });
      if (cell < 0) throw new Error(`Evolution ${label} capacity path became invalid`);
      ownerByCell[cell] = recipient; size[recipient]++; size[donor]--;
      work.transfers = (work.transfers ?? 0) + 1;
    }
  }
}

function findTransferPath({ topology, deficit, ownerByCell, size, capacity, seedMask, distanceByOwner, work }) {
  const seen = new Uint8Array(size.length); const previous = new Int16Array(size.length).fill(-1);
  const queue = new Uint8Array(size.length); let head = 0; let tail = 0;
  queue[tail++] = deficit; seen[deficit] = 1;
  while (head < tail) {
    const recipient = queue[head++];
    for (let donor = 0; donor < size.length; donor++) {
      if (seen[donor] || selectTransferCell({ topology, recipient, donor, ownerByCell, size, seedMask,
        recipientDistance: distanceByOwner[recipient], work }) < 0) continue;
      seen[donor] = 1; previous[donor] = recipient;
      if (size[donor] > capacity[donor]) {
        const path = [donor]; let at = donor;
        while (at !== deficit) { at = previous[at]; path.push(at); }
        return path.reverse();
      }
      queue[tail++] = donor;
    }
  }
  return null;
}

function selectTransferCell({ topology, recipient, donor, ownerByCell, size, seedMask, recipientDistance, work }) {
  if (recipient === donor || size[donor] <= 1) return -1;
  let selected = -1; let selectedScore = -Infinity;
  for (let cell = 0; cell < topology.nodeCount; cell++) {
    work.frontierScans++;
    if (ownerByCell[cell] !== donor || seedMask[cell]) continue;
    let adjacent = false;
    for (let offset = topology.nodeStart[cell]; offset < topology.nodeStart[cell + 1]; offset++) {
      if (ownerByCell[topology.nodeNeighbors[offset]] === recipient) { adjacent = true; break; }
    }
    if (!adjacent || !regionConnectedAfterRemoval(topology, ownerByCell, donor, cell, size[donor], work)) continue;
    const score = -recipientDistance[cell] * 100_000 - cell;
    if (score > selectedScore || (score === selectedScore && cell < selected)) {
      selected = cell; selectedScore = score;
    }
  }
  return selected;
}

export function regionConnectedAfterRemoval(topology, ownerByCell, owner, removed, count, work) {
  work.connectivityChecks++;
  if (count <= 2) return true;
  let start = -1;
  for (let cell = 0; cell < topology.nodeCount; cell++) {
    if (cell !== removed && ownerByCell[cell] === owner) { start = cell; break; }
  }
  const seen = new Uint8Array(topology.nodeCount); const queue = new Uint16Array(topology.nodeCount);
  let head = 0; let tail = 0; queue[tail++] = start; seen[start] = 1;
  while (head < tail) {
    const cell = queue[head++]; work.connectivityVisits++;
    for (let offset = topology.nodeStart[cell]; offset < topology.nodeStart[cell + 1]; offset++) {
      const next = topology.nodeNeighbors[offset];
      if (next !== removed && ownerByCell[next] === owner && !seen[next]) { seen[next] = 1; queue[tail++] = next; }
    }
  }
  return tail === count - 1;
}
