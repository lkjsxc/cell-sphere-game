/** Fixed-field domain seeds and bounded connected macro-region construction. */
import { WATER } from '../../world/constants.js';
import { EVOLUTION_DOMAINS } from './catalog.js';
import { assignDomainVoronoi, balanceConnectedPartition } from './layout-partition-core.js';
import { componentCounts, domainMeanTier, graphDistances, isGreenLand,
  sphericalDistanceFields } from './layout-metrics.js';

const UNASSIGNED = 0xff;
const DOMAIN_INDEX = new Map(EVOLUTION_DOMAINS.map((domain, index) => [domain, index]));
// Fixed version-2 power offsets seed a compact simultaneous partition. Exact
// catalog capacities are then closed through bounded topology-frontier moves.
const DOMAIN_DISTANCE_OFFSETS = Object.freeze([
  -0.4921875, -0.583984375, 0.064453125, 0, 0.203125, -0.41015625, 0.046875,
]);

export function buildDomainPartition(input) {
  const {
    topology, substrate, archetypes, rootCell, rootDistance, maxRootDistance,
    domainCapacity, suitability, work,
  } = input;
  const ownerByCell = new Uint8Array(topology.nodeCount).fill(UNASSIGNED);
  const unassigned = new Uint8Array(topology.nodeCount).fill(1);
  const protectedMask = new Uint8Array(topology.nodeCount);
  const size = new Uint16Array(EVOLUTION_DOMAINS.length);
  const seeds = new Uint16Array(EVOLUTION_DOMAINS.length);
  const seedDistance = Array(EVOLUTION_DOMAINS.length);
  const regionalSuitability = createRegionalSuitabilityScorer(topology, suitability, domainCapacity, work);
  const foundation = DOMAIN_INDEX.get('Foundation');

  // The launch basin is the compact area required by the six exact tier-1
  // regions around a hexagonal root. Its 597 cells remain below Foundation's
  // retained capacity, leaving the shared frontier growth to close the basin.
  let launchCells = 0;
  for (let cell = 0; cell < topology.nodeCount; cell++) if (rootDistance[cell] <= 14) {
    ownerByCell[cell] = foundation; unassigned[cell] = 0; launchCells++;
    protectedMask[cell] = 1;
  }
  if (launchCells !== 597 || launchCells >= domainCapacity[foundation]) {
    throw new Error('Evolution Foundation launch basin is incompatible with the maintained topology');
  }
  seeds[foundation] = rootCell;
  seedDistance[foundation] = graphDistances(topology, rootCell, work);

  const seedOrder = ['Marine', 'Fertility', 'Freshwater', 'Scarcity', 'Luminous', 'Cryogenic'];
  for (const domain of seedOrder) {
    const owner = DOMAIN_INDEX.get(domain); let selected = -1; let selectedScore = -Infinity;
    const meanTier = domainMeanTier(archetypes, domain);
    const targetDistance = maxRootDistance * Math.min(.88, Math.max(.28, meanTier / 6));
    for (let cell = 0; cell < topology.nodeCount; cell++) {
      work.seedChecks++;
      if (!unassigned[cell] || !isDomainSeedCandidate(domain, substrate, cell)) continue;
      let separation = topology.nodeCount;
      for (const distances of seedDistance) if (distances) separation = Math.min(separation, distances[cell]);
      const tierFit = maxRootDistance - Math.abs(rootDistance[cell] - targetDistance);
      const separationWeight = domain === 'Fertility' ? 8_000
        : domain === 'Scarcity' ? 16_000 : 24_000;
      const score = Math.round(regionalSuitability(owner, cell) * 1_000_000
        + suitability[owner][cell] * (domain === 'Scarcity' ? 100_000 : 20_000))
        + separation * separationWeight + Math.round(tierFit * 2_000);
      if (score > selectedScore || (score === selectedScore && cell < selected)) {
        selected = cell; selectedScore = score;
      }
    }
    if (selected < 0) throw new Error(`Evolution ${domain} domain lacks a seed`);
    seeds[owner] = selected; ownerByCell[selected] = owner; unassigned[selected] = 0;
    seedDistance[owner] = graphDistances(topology, selected, work);
  }

  // Fertility is the smallest land-led domain. Reserve its exact compact core
  // before the spherical partition so capacity pressure from the larger water
  // domains cannot turn a strong green seed into an ocean-heavy sliver.
  const fertility = DOMAIN_INDEX.get('Fertility');
  growProtectedSeedRegion({ topology, substrate, ownerByCell, unassigned,
    protectedMask, owner: fertility, seed: seeds[fertility], capacity: domainCapacity[fertility],
    suitability: suitability[fertility], rootDistance, seedDistance: seedDistance[fertility],
    label: 'Fertility', work });
  const calibrated = assignDomainVoronoi({ topology,
    metricByOwner: sphericalDistanceFields(topology, seeds), seeds, domainCapacity,
    fixedOwnerByCell: ownerByCell, weight: Float64Array.from(DOMAIN_DISTANCE_OFFSETS), work });
  if (!calibrated.valid) throw new Error('Evolution domain power partition lost a domain seed');
  ownerByCell.set(calibrated.ownerByCell); size.set(calibrated.count);
  work.domainWeights = DOMAIN_DISTANCE_OFFSETS;
  work.domainSeeds = Object.freeze(Array.from(seeds));
  work.domainVoronoiCounts = Object.freeze(Array.from(size));
  work.domainVoronoiComponents = Object.freeze(Array.from(
    componentCounts(topology, ownerByCell, EVOLUTION_DOMAINS.length),
  ));
  balanceConnectedPartition({ topology, ownerByCell, size, capacity: domainCapacity,
    seeds, distanceByOwner: seedDistance, protectedMask, work, label: 'domains' });
  for (let owner = 0; owner < EVOLUTION_DOMAINS.length; owner++) {
    if (size[owner] !== domainCapacity[owner]) throw new Error(`Evolution ${EVOLUTION_DOMAINS[owner]} domain missed its capacity`);
  }
  return ownerByCell;
}

function growProtectedSeedRegion({
  topology, substrate, ownerByCell, unassigned, protectedMask, owner, seed, capacity,
  suitability, rootDistance, seedDistance, label, work,
}) {
  protectedMask[seed] = 1; let size = 1;
  const targetRootDistance = rootDistance[seed] + 3;
  while (size < capacity) {
    let selected = -1; let selectedScore = -Infinity;
    for (let cell = 0; cell < topology.nodeCount; cell++) {
      work.frontierScans++; if (!unassigned[cell]) continue;
      let regionNeighbors = 0;
      for (let offset = topology.nodeStart[cell]; offset < topology.nodeStart[cell + 1]; offset++) {
        if (ownerByCell[topology.nodeNeighbors[offset]] === owner) regionNeighbors++;
      }
      if (!regionNeighbors) continue;
      const score = Math.round(suitability[cell] * 1_000_000)
        + substrate.landMask[cell] * 100_000 + regionNeighbors * 55_000
        - seedDistance[cell] * 14_000 - Math.abs(rootDistance[cell] - targetRootDistance) * 1_000;
      if (score > selectedScore || (score === selectedScore && cell < selected)) {
        selected = cell; selectedScore = score;
      }
    }
    if (selected < 0) throw new Error(`Evolution ${label} core cannot reach its capacity`);
    ownerByCell[selected] = owner; unassigned[selected] = 0; protectedMask[selected] = 1; size++;
  }
  work[`protected${label}Cells`] = size;
}

function isDomainSeedCandidate(domain, fields, cell) {
  if (domain === 'Marine') return fields.waterClass[cell] === WATER.DEEP_OCEAN
    || fields.waterClass[cell] === WATER.SHALLOW_OCEAN;
  if (domain === 'Fertility') return isGreenLand(fields, cell);
  if (domain === 'Freshwater') return fields.freshwaterInfluence[cell] > 0
    || fields.waterClass[cell] === WATER.LAKE || fields.lakeShore[cell] === 1;
  return fields.landMask[cell] === 1;
}

function createRegionalSuitabilityScorer(topology, suitability, capacity, work) {
  const seen = new Uint32Array(topology.nodeCount); const queue = new Uint16Array(topology.nodeCount);
  let generation = 0;
  return (domain, root) => {
    generation++; let head = 0; let tail = 0; let count = 0; let total = 0;
    queue[tail++] = root; seen[root] = generation;
    while (head < tail && count < capacity[domain]) {
      const cell = queue[head++]; count++; total += suitability[domain][cell];
      work.regionalVisits = (work.regionalVisits ?? 0) + 1;
      for (let offset = topology.nodeStart[cell]; offset < topology.nodeStart[cell + 1]; offset++) {
        const next = topology.nodeNeighbors[offset];
        if (seen[next] !== generation) { seen[next] = generation; queue[tail++] = next; }
      }
    }
    return total / count;
  };
}
