/** Connected exact-capacity archetype subdivision inside fixed domain regions. */
import { EVOLUTION_DOMAINS } from './catalog.js';
import { balanceConnectedPartition } from './layout-partition-core.js';
import { graphDistancesInMask, median, normalize3, outsideNeighbors } from './layout-metrics.js';

const UNASSIGNED = 0xff;
const DOMAIN_INDEX = new Map(EVOLUTION_DOMAINS.map((domain, index) => [domain, index]));

export function buildArchetypePartition(input) {
  const {
    topology, archetypes, rootArchetype, rootCell, rootRing, rootDistance,
    domainByCell, archetypeQuota, work,
  } = input;
  const archetypeByCell = new Uint8Array(topology.nodeCount).fill(UNASSIGNED);
  for (const domain of EVOLUTION_DOMAINS) {
    const domainIndex = DOMAIN_INDEX.get(domain);
    const indexes = archetypes.map((archetype, index) => ({ archetype, index }))
      .filter(({ archetype }) => archetype.domain === domain)
      .sort((left, right) => left.archetype.tier - right.archetype.tier || left.index - right.index);
    const remaining = new Uint8Array(topology.nodeCount); let remainingCount = 0;
    for (let cell = 0; cell < topology.nodeCount; cell++) if (domainByCell[cell] === domainIndex) {
      remaining[cell] = 1; remainingCount++;
    }
    if (domain === 'Foundation') {
      archetypeByCell[rootCell] = rootArchetype; remaining[rootCell] = 0; remainingCount--;
      assertConnectedMask(topology, remaining, remainingCount, work, 'Foundation without root');
    }
    const currentIndexes = indexes.filter(({ index }) => index !== rootArchetype);
    if (domain === 'Foundation') {
      const firstTier = currentIndexes.filter(({ archetype }) => archetype.tier === 1);
      if (firstTier.length !== rootRing.length) throw new Error('green root ring lacks six distinct tier-1 Foundation archetypes');
      remainingCount = carveRootRingRegions({ topology, remaining, remainingCount, rootCell, rootRing,
        firstTier, archetypeQuota, rootDistance, archetypeByCell, work });
      const outerIndexes = currentIndexes.filter(({ archetype }) => archetype.tier !== 1);
      growDomainArchetypeRegions({ topology, remaining, currentIndexes: outerIndexes,
        archetypeQuota, rootDistance, archetypeByCell, work });
    } else {
      partitionDomainRegions({ topology, remaining, remainingCount, currentIndexes,
        archetypeQuota, rootDistance, archetypeByCell, work });
    }
  }
  return archetypeByCell;
}

function growDomainArchetypeRegions(input) {
  const {
    topology, remaining, currentIndexes, archetypeQuota,
    rootDistance, archetypeByCell, work,
  } = input;
  const ownerByCell = new Uint8Array(topology.nodeCount).fill(UNASSIGNED);
  const domainMask = remaining.slice(); const seedSelected = new Uint8Array(topology.nodeCount);
  const seedDistance = []; const seeds = []; const size = new Uint16Array(currentIndexes.length);
  const capacity = Uint16Array.from(currentIndexes, ({ index }) => archetypeQuota[index]);
  const rootValues = [];
  for (let cell = 0; cell < topology.nodeCount; cell++) if (remaining[cell]) rootValues.push(rootDistance[cell]);
  rootValues.sort((left, right) => left - right);
  for (let owner = 0; owner < currentIndexes.length; owner++) {
    const { archetype } = currentIndexes[owner];
    const quantile = Math.min(.92, Math.max(.08, (archetype.tier - .5) / 6));
    const target = rootValues[Math.floor((rootValues.length - 1) * quantile)];
    let selected = -1; let selectedScore = -Infinity;
    for (let cell = 0; cell < topology.nodeCount; cell++) {
      if (!domainMask[cell] || seedSelected[cell]) continue;
      let separation = topology.nodeCount;
      for (const distances of seedDistance) separation = Math.min(separation, distances[cell]);
      if (!seedDistance.length) separation = 0;
      const score = separation * 1_000_000 - Math.abs(rootDistance[cell] - target) * 18_000
        + outsideNeighbors(topology, remaining, cell) * 8_000;
      if (score > selectedScore || (score === selectedScore && cell < selected)) { selected = cell; selectedScore = score; }
    }
    if (selected < 0) throw new Error(`Evolution ${archetype.domain} lacks an archetype seed`);
    seeds.push(selected); seedDistance.push(graphDistancesInMask(topology, selected, domainMask, work));
    seedSelected[selected] = 1;
  }
  for (let cell = 0; cell < topology.nodeCount; cell++) {
    if (!domainMask[cell]) continue;
    let owner = 0;
    for (let candidate = 1; candidate < currentIndexes.length; candidate++) {
      if (seedDistance[candidate][cell] < seedDistance[owner][cell]
        || (seedDistance[candidate][cell] === seedDistance[owner][cell] && candidate < owner)) owner = candidate;
    }
    ownerByCell[cell] = owner; size[owner]++;
  }
  balanceConnectedPartition({ topology, ownerByCell, size, capacity, seeds, distanceByOwner: seedDistance, work,
    label: currentIndexes[0].archetype.domain });
  for (let owner = 0; owner < currentIndexes.length; owner++) {
    if (size[owner] !== capacity[owner]) throw new Error('Evolution archetype growth missed its capacity');
  }
  const groups = Array.from({ length: currentIndexes.length }, () => []);
  for (let cell = 0; cell < topology.nodeCount; cell++) if (domainMask[cell]) groups[ownerByCell[cell]].push(cell);
  const assignments = matchGroupsByCapacity(groups, currentIndexes, archetypeQuota, rootDistance);
  for (const { group, archetype } of assignments) for (const cell of group) archetypeByCell[cell] = archetype.index;
}

function partitionDomainRegions(input) {
  const {
    topology, remaining, remainingCount, currentIndexes, archetypeQuota,
    rootDistance, archetypeByCell, work,
  } = input;
  if (currentIndexes.length < 2) throw new Error('Evolution domain lacks enough archetypes for a regional partition');
  const cells = []; const centerSum = [0, 0, 0];
  for (let cell = 0; cell < topology.nodeCount; cell++) if (remaining[cell]) {
    cells.push(cell); for (let axis = 0; axis < 3; axis++) centerSum[axis] += topology.positions[cell * 3 + axis];
  }
  if (cells.length !== remainingCount) throw new Error('Evolution domain mask count mismatch');
  const center = normalize3(centerSum); let referenceCell = cells[0];
  for (const cell of cells) if (rootDistance[cell] < rootDistance[referenceCell]
    || (rootDistance[cell] === rootDistance[referenceCell] && cell < referenceCell)) referenceCell = cell;
  const reference = topology.positions.subarray(referenceCell * 3, referenceCell * 3 + 3);
  let projection = reference[0] * center[0] + reference[1] * center[1] + reference[2] * center[2];
  let axisU = [reference[0] - center[0] * projection,
    reference[1] - center[1] * projection, reference[2] - center[2] * projection];
  if (Math.hypot(...axisU) < 1e-8) {
    const alternate = topology.positions.subarray(cells.at(-1) * 3, cells.at(-1) * 3 + 3);
    projection = alternate[0] * center[0] + alternate[1] * center[1] + alternate[2] * center[2];
    axisU = [alternate[0] - center[0] * projection,
      alternate[1] - center[1] * projection, alternate[2] - center[2] * projection];
  }
  axisU = normalize3(axisU);
  const axisV = normalize3([center[1] * axisU[2] - center[2] * axisU[1],
    center[2] * axisU[0] - center[0] * axisU[2], center[0] * axisU[1] - center[1] * axisU[0]]);
  const ordered = cells.map((cell) => {
    const at = cell * 3; const u = topology.positions[at] * axisU[0]
      + topology.positions[at + 1] * axisU[1] + topology.positions[at + 2] * axisU[2];
    const v = topology.positions[at] * axisV[0]
      + topology.positions[at + 1] * axisV[1] + topology.positions[at + 2] * axisV[2];
    return { cell, angle: Math.atan2(v, u) };
  }).sort((left, right) => left.angle - right.angle || rootDistance[left.cell] - rootDistance[right.cell] || left.cell - right.cell);

  let selected = null; let selectedScore = -Infinity;
  for (let offset = 0; offset < ordered.length; offset++) {
    let cursor = offset; const groups = [];
    for (const { index } of currentIndexes) {
      const group = [];
      for (let count = 0; count < archetypeQuota[index]; count++) group.push(ordered[cursor++ % ordered.length].cell);
      groups.push(group);
    }
    if (!groups.every((group) => cellsConnected(topology, group, work))) continue;
    const assignments = matchGroupsByCapacity(groups, currentIndexes, archetypeQuota, rootDistance);
    const score = assignments.reduce((sum, { group, archetype }) =>
      sum + archetype.archetype.tier * median(group.map((cell) => rootDistance[cell])), 0);
    if (score > selectedScore) { selected = assignments; selectedScore = score; }
  }
  if (!selected) throw new Error(`Evolution ${currentIndexes[0].archetype.domain} has no connected exact-capacity rotation`);
  for (const { group, archetype } of selected) for (const cell of group) archetypeByCell[cell] = archetype.index;
}

function matchGroupsByCapacity(groups, archetypes, archetypeQuota, rootDistance) {
  const result = [];
  for (const capacity of [...new Set(archetypes.map(({ index }) => archetypeQuota[index]))]) {
    const matchingGroups = groups.filter((group) => group.length === capacity)
      .sort((left, right) => median(left.map((cell) => rootDistance[cell]))
        - median(right.map((cell) => rootDistance[cell])) || Math.min(...left) - Math.min(...right));
    const matchingArchetypes = archetypes.filter(({ index }) => archetypeQuota[index] === capacity)
      .sort((left, right) => left.archetype.tier - right.archetype.tier || left.index - right.index);
    for (let index = 0; index < matchingGroups.length; index++) {
      result.push({ group: matchingGroups[index], archetype: matchingArchetypes[index] });
    }
  }
  return result;
}

function cellsConnected(topology, cells, work) {
  const mask = new Uint8Array(topology.nodeCount); for (const cell of cells) mask[cell] = 1;
  const queue = new Uint16Array(cells.length); let head = 0; let tail = 0;
  queue[tail++] = cells[0]; mask[cells[0]] = 2;
  while (head < tail) {
    const cell = queue[head++]; work.connectivityVisits++;
    for (let offset = topology.nodeStart[cell]; offset < topology.nodeStart[cell + 1]; offset++) {
      const next = topology.nodeNeighbors[offset];
      if (mask[next] === 1) { mask[next] = 2; queue[tail++] = next; }
    }
  }
  return tail === cells.length;
}

function carveRootRingRegions(input) {
  const {
    topology, remaining, rootCell, rootRing, firstTier, archetypeQuota, rootDistance, archetypeByCell, work,
  } = input;
  let remainingCount = input.remainingCount;
  const ownerByCell = new Uint8Array(topology.nodeCount).fill(UNASSIGNED);
  const cellsByOwner = Array.from({ length: firstTier.length }, () => []);
  const distanceByOwner = rootRing.map((cell) => graphDistancesInMask(topology, cell, remaining, work));
  const rootPosition = topology.positions.subarray(rootCell * 3, rootCell * 3 + 3);
  const sectorDirection = rootRing.map((cell) => {
    const at = cell * 3; const dot = topology.positions[at] * rootPosition[0]
      + topology.positions[at + 1] * rootPosition[1] + topology.positions[at + 2] * rootPosition[2];
    const direction = [topology.positions[at] - rootPosition[0] * dot,
      topology.positions[at + 1] - rootPosition[1] * dot, topology.positions[at + 2] - rootPosition[2] * dot];
    const length = Math.hypot(...direction); return direction.map((value) => value / length);
  });
  for (let cell = 0; cell < topology.nodeCount; cell++) if (remaining[cell]) {
    const at = cell * 3; let selectedOwner = 0; let selectedScore = -Infinity;
    for (let owner = 0; owner < firstTier.length; owner++) {
      const direction = sectorDirection[owner]; const score = topology.positions[at] * direction[0]
        + topology.positions[at + 1] * direction[1] + topology.positions[at + 2] * direction[2];
      if (score > selectedScore) { selectedOwner = owner; selectedScore = score; }
    }
    ownerByCell[cell] = selectedOwner; cellsByOwner[selectedOwner].push(cell);
  }
  for (let owner = 0; owner < firstTier.length; owner++) {
    const cell = rootRing[owner]; const archetype = firstTier[owner].index;
    if (!remaining[cell]) throw new Error('root-ring seed left Foundation');
    if (ownerByCell[cell] !== owner) throw new Error('root-ring Voronoi seed lost its own region');
    if (cellsByOwner[owner].length < archetypeQuota[archetype]) {
      throw new Error(`Foundation sector ${owner} has only ${cellsByOwner[owner].length} cells`);
    }
    cellsByOwner[owner].sort((left, right) => rootDistance[left] - rootDistance[right]
      || distanceByOwner[owner][left] - distanceByOwner[owner][right] || left - right);
    for (let index = 0; index < archetypeQuota[archetype]; index++) {
      const selected = cellsByOwner[owner][index]; remaining[selected] = 0; remainingCount--;
      archetypeByCell[selected] = archetype;
    }
  }
  const sectorRadii = cellsByOwner.map((cells) => [10, 11, 12].map((radius) => cells.filter((cell) => rootDistance[cell] <= radius).length));
  assertConnectedMask(topology, remaining, remainingCount, work, `Foundation after tier-1 regions ${JSON.stringify(sectorRadii)}`);
  return remainingCount;
}

function assertConnectedMask(topology, mask, count, work, label) {
  if (count <= 0) throw new Error(`${label} is empty`);
  let start = 0; while (start < topology.nodeCount && !mask[start]) start++;
  const seen = new Uint8Array(topology.nodeCount); const queue = new Uint16Array(topology.nodeCount);
  let head = 0; let tail = 0; queue[tail++] = start; seen[start] = 1;
  while (head < tail) {
    const cell = queue[head++]; work.connectivityVisits++;
    for (let offset = topology.nodeStart[cell]; offset < topology.nodeStart[cell + 1]; offset++) {
      const next = topology.nodeNeighbors[offset];
      if (mask[next] && !seen[next]) { seen[next] = 1; queue[tail++] = next; }
    }
  }
  if (tail !== count) throw new Error(`${label} is disconnected (${tail} of ${count})`);
}
