/** Deterministic substrate-guided connected regions on the maintained sphere. */
import { fnv1aBytes, hexU32 } from '../../core/hash.js';
import { EVOLUTION_ARCHETYPES, EVOLUTION_DOMAINS } from './catalog.js';
import { EVOLUTION_SUBSTRATE } from './substrate.js';
import { EVOLUTION_TOPOLOGY, EVOLUTION_TOPOLOGY_LEVEL } from './topology.js';
import { buildDomainPartition } from './layout-domain-partition.js';
import { buildArchetypePartition } from './layout-archetype-partition.js';
import {
  EVOLUTION_REGION_EDGE, buildDomainSuitability, buildMemberships, capacitiesByDomain,
  classifyRegionEdges, compareRootFields, componentCounts, graphDistances, isGreenLand,
  maximum, neighborsOf, quotas, rootDetails, substrateFitDiagnostics, tierMedians,
  validateInputs, validateSubstrate,
} from './layout-metrics.js';

export { EVOLUTION_TOPOLOGY, EVOLUTION_TOPOLOGY_LEVEL } from './topology.js';
export { EVOLUTION_REGION_EDGE } from './layout-metrics.js';

export const EVOLUTION_LAYOUT_VERSION = 2;
const MAX_CONSTRUCTION_VISITS = 80_000_000;
const MIN_SUBSTRATE_MARGIN = 0.005;

export const EVOLUTION_LAYOUT = createEvolutionCellLayout(
  EVOLUTION_TOPOLOGY, EVOLUTION_ARCHETYPES, EVOLUTION_SUBSTRATE,
);
export const EVOLUTION_ROOT_CELL = EVOLUTION_LAYOUT.rootCell;

/**
 * Build calibrated connected domain macro-regions, then split each domain into
 * deterministic connected exact-capacity archetype regions. All searches and
 * capacity transfers are bounded; no runtime randomness or persisted owner map
 * participates in the result.
 */
export function createEvolutionCellLayout(
  topology,
  archetypes = EVOLUTION_ARCHETYPES,
  substrate = EVOLUTION_SUBSTRATE,
) {
  validateInputs(topology, archetypes, substrate);
  const work = { frontierScans: 0, connectivityVisits: 0, connectivityChecks: 0, seedChecks: 0 };
  const rootArchetype = archetypes.findIndex((archetype) => archetype.kind === 'root');
  const rootCell = selectEvolutionRootCell(topology, substrate);
  const rootDistance = graphDistances(topology, rootCell, work);
  const maxRootDistance = maximum(rootDistance);
  const rootRing = neighborsOf(topology, rootCell).sort((left, right) => left - right);
  const archetypeQuota = quotas(topology.nodeCount - 1, archetypes.length, rootArchetype);
  archetypeQuota[rootArchetype] = 1;
  const domainCapacity = capacitiesByDomain(archetypes, archetypeQuota);
  const suitability = buildDomainSuitability(topology, substrate);

  const domainByCell = buildDomainPartition({
    topology, substrate, archetypes, rootCell, rootDistance, maxRootDistance,
    domainCapacity, suitability, work,
  });
  const archetypeByCell = buildArchetypePartition({
    topology, archetypes, rootArchetype, rootCell, rootRing, rootDistance,
    domainByCell, archetypeQuota, work,
  });
  const membership = buildMemberships(archetypeByCell, archetypes.length);
  const domainMembership = buildMemberships(domainByCell, EVOLUTION_DOMAINS.length);
  const edgeStructure = classifyRegionEdges(topology, archetypes, archetypeByCell);
  const diagnostics = validateEvolutionCellLayout({
    topology, substrate, archetypes, rootArchetype, rootCell, archetypeByCell,
    archetypeCountByIndex: membership.count, rootRing, rootDistance, domainByCell,
    domainCapacity, suitability, edgeStructure, work,
  });
  return Object.freeze({
    version: EVOLUTION_LAYOUT_VERSION, topology, substrate, archetypes, rootCell, rootArchetype,
    archetypeByCell, archetypeCountByIndex: membership.count,
    archetypeStart: membership.start, cellsByArchetype: membership.cells,
    domainByCell, domainCountByIndex: domainMembership.count,
    domainStart: domainMembership.start, cellsByDomain: domainMembership.cells,
    rootDistance, rootRing: Object.freeze(rootRing), edgeStructure, diagnostics,
  });
}

export function selectEvolutionRootCell(topology, substrate) {
  validateSubstrate(topology, substrate);
  let selected = -1; let selectedComplete = false; let selectedGreenNeighbors = -1;
  for (let cell = 0; cell < topology.nodeCount; cell++) {
    if (!isGreenLand(substrate, cell)) continue;
    let greenNeighbors = 0;
    for (let offset = topology.nodeStart[cell]; offset < topology.nodeStart[cell + 1]; offset++) {
      if (isGreenLand(substrate, topology.nodeNeighbors[offset])) greenNeighbors++;
    }
    const complete = greenNeighbors === topology.degree[cell];
    if (selected < 0
      || Number(complete) > Number(selectedComplete)
      || (complete === selectedComplete && (greenNeighbors > selectedGreenNeighbors
        || (greenNeighbors === selectedGreenNeighbors && compareRootFields(substrate, cell, selected) < 0)))) {
      selected = cell; selectedComplete = complete; selectedGreenNeighbors = greenNeighbors;
    }
  }
  if (selected < 0) throw new Error('Evolution substrate has no favorable green root candidate');
  return selected;
}

export function validateEvolutionCellLayout(layout) {
  const {
    topology, substrate, archetypes, rootArchetype, rootCell, archetypeByCell,
    archetypeCountByIndex, rootRing, rootDistance, domainByCell, domainCapacity,
    suitability, edgeStructure,
  } = layout;
  const validatedDomainCapacity = domainCapacity ?? capacitiesByDomain(archetypes, archetypeCountByIndex);
  const validatedSuitability = suitability ?? buildDomainSuitability(topology, substrate);
  const work = layout.work ?? layout.diagnostics?.construction ?? {};
  const errors = [];
  if (archetypeByCell.length !== topology.nodeCount) errors.push('incomplete cell assignment');
  if (archetypeCountByIndex.length !== archetypes.length) errors.push('incomplete archetype counts');
  if (domainByCell.length !== topology.nodeCount) errors.push('incomplete domain assignment');
  if (edgeStructure.length !== topology.edgeCount) errors.push('incomplete region-edge assignment');

  const observedCounts = new Uint16Array(archetypes.length);
  let assignmentsValid = archetypeByCell.length === topology.nodeCount;
  if (assignmentsValid) for (let cell = 0; cell < topology.nodeCount; cell++) {
    const archetype = archetypeByCell[cell]; const domain = domainByCell[cell];
    if (!Number.isInteger(archetype) || archetype < 0 || archetype >= archetypes.length
      || domain !== EVOLUTION_DOMAINS.indexOf(archetypes[archetype].domain)) {
      assignmentsValid = false; break;
    }
    observedCounts[archetype]++;
  }
  if (!assignmentsValid) throw new Error('invalid Evolution cell layout: invalid cell assignment');
  for (let index = 0; index < archetypes.length; index++) {
    if (archetypeCountByIndex[index] !== observedCounts[index]) errors.push(`archetype ${index} count mismatch`);
  }

  const rootCount = observedCounts[rootArchetype] ?? 0;
  if (rootCell !== selectEvolutionRootCell(topology, substrate)
    || rootCount !== 1 || archetypeByCell[rootCell] !== rootArchetype) errors.push('invalid green root assignment');
  const rootDiagnostic = rootDetails(topology, substrate, rootCell);
  if (!rootDiagnostic.land || !rootDiagnostic.greenBiome) errors.push('root is not favorable green land');
  const ringArchetypes = rootRing.map((cell) => archetypeByCell[cell]);
  if (ringArchetypes.some((index) => archetypes[index]?.domain !== 'Foundation'
    || archetypes[index]?.tier !== 1)) errors.push('root ring is not tier-1 Foundation');
  if (new Set(ringArchetypes).size !== ringArchetypes.length) errors.push('root ring repeats an archetype');

  const expectedQuota = quotas(topology.nodeCount - 1, archetypes.length, rootArchetype);
  expectedQuota[rootArchetype] = 1;
  let minNonRootCount = Infinity; let maxNonRootCount = 0;
  for (let index = 0; index < archetypes.length; index++) {
    if (observedCounts[index] !== expectedQuota[index]) errors.push(`archetype ${archetypes[index].id} quota mismatch`);
    if (index !== rootArchetype) {
      minNonRootCount = Math.min(minNonRootCount, observedCounts[index]);
      maxNonRootCount = Math.max(maxNonRootCount, observedCounts[index]);
    }
  }

  const componentCount = componentCounts(topology, archetypeByCell, archetypes.length);
  for (let index = 0; index < archetypes.length; index++) {
    if (componentCount[index] !== 1) errors.push(`archetype ${archetypes[index].id} has ${componentCount[index]} components`);
  }
  const domainComponentCount = componentCounts(topology, domainByCell, EVOLUTION_DOMAINS.length);
  for (let index = 0; index < EVOLUTION_DOMAINS.length; index++) {
    if (domainComponentCount[index] !== 1) errors.push(`domain ${EVOLUTION_DOMAINS[index]} has ${domainComponentCount[index]} components`);
  }

  if (rootDistance?.length !== topology.nodeCount) errors.push('incomplete root distances');
  const tierMedianRootDistance = tierMedians(archetypes, archetypeByCell, rootDistance);
  for (let tier = 2; tier <= 5; tier++) {
    if (!(tierMedianRootDistance[tier] > tierMedianRootDistance[tier - 1])) errors.push(`tier ${tier} median root distance does not increase`);
  }

  const substrateFit = substrateFitDiagnostics({ topology, substrate, domainByCell,
    domainCapacity: validatedDomainCapacity, suitability: validatedSuitability });
  for (const domain of EVOLUTION_DOMAINS) {
    if (!(substrateFit.byDomain[domain].suitabilityMargin > MIN_SUBSTRATE_MARGIN)) {
      errors.push(`${domain} substrate fit ${substrateFit.byDomain[domain].suitabilityMargin} is not above global`);
    }
  }
  if (!(substrateFit.byDomain.Marine.waterFraction > substrateFit.nonMarineWaterFraction)) errors.push('Marine water fit failed');
  if (!(substrateFit.byDomain.Freshwater.freshwaterInfluence > substrateFit.global.freshwaterInfluence)) errors.push('Freshwater fit failed');
  if (!(substrateFit.byDomain.Cryogenic.temperature < substrateFit.global.temperature)) errors.push('Cryogenic fit failed');
  if (!(substrateFit.byDomain.Scarcity.moisture < substrateFit.global.moisture
    || substrateFit.byDomain.Scarcity.growthSuitability < substrateFit.global.growthSuitability)) errors.push('Scarcity fit failed');
  if (!(substrateFit.byDomain.Fertility.greenFraction > substrateFit.global.greenFraction
    && substrateFit.byDomain.Fertility.growthSuitability > substrateFit.global.growthSuitability
    && substrateFit.byDomain.Fertility.waterFraction < substrateFit.global.waterFraction)) errors.push('Fertility fit failed');

  const constructionVisits = Number(work.frontierScans ?? 0) + Number(work.connectivityVisits ?? 0)
    + Number(work.regionalVisits ?? 0) + Number(work.voronoiVisits ?? 0) + Number(work.boundaryScans ?? 0);
  if (!Number.isSafeInteger(constructionVisits) || constructionVisits > MAX_CONSTRUCTION_VISITS) errors.push('layout construction work exceeded bound');
  const digest = hexU32(fnv1aBytes(archetypeByCell)); const edgeDigest = hexU32(fnv1aBytes(edgeStructure));
  if (errors.length) throw new Error(`invalid Evolution cell layout: ${errors.join('; ')}`);
  return Object.freeze({ valid: true, layoutVersion: EVOLUTION_LAYOUT_VERSION,
    topologyLevel: topology.levels, cells: topology.nodeCount, edges: topology.edgeCount,
    archetypes: archetypes.length, rootCount, rootCell, root: rootDiagnostic,
    minNonRootCount, maxNonRootCount, digest, edgeDigest, componentCount, domainComponentCount,
    tierMedianRootDistance, substrateFit,
    construction: Object.freeze({ ...work, visits: constructionVisits, budget: MAX_CONSTRUCTION_VISITS }) });
}
