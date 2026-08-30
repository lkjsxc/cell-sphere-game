/** Immutable cell-to-archetype weave on the maintained level-4 sphere. */
import { fnv1aBytes, hexU32 } from '../../core/hash.js';
import { createTopology } from '../../world/icosphere.js';
import { EVOLUTION_ARCHETYPES } from './catalog.js';

export const EVOLUTION_LAYOUT_VERSION = 1;
export const EVOLUTION_TOPOLOGY_LEVEL = 4;
export const EVOLUTION_ROOT_CELL = 0;

export const EVOLUTION_TOPOLOGY = createTopology(EVOLUTION_TOPOLOGY_LEVEL);
export const EVOLUTION_LAYOUT = createEvolutionCellLayout(EVOLUTION_TOPOLOGY, EVOLUTION_ARCHETYPES);

export function createEvolutionCellLayout(topology, archetypes = EVOLUTION_ARCHETYPES) {
  validateInputs(topology, archetypes);
  const archetypeCount = archetypes.length;
  const rootArchetype = archetypes.findIndex((archetype) => archetype.kind === 'root');
  if (rootArchetype < 0) throw new Error('Evolution layout requires one root archetype');

  const archetypeByCell = new Uint8Array(topology.nodeCount).fill(0xff);
  const remaining = quotas(topology.nodeCount - 1, archetypeCount, rootArchetype);
  archetypeByCell[EVOLUTION_ROOT_CELL] = rootArchetype;

  const rootRing = Array.from(topology.nodeNeighbors.slice(
    topology.nodeStart[EVOLUTION_ROOT_CELL], topology.nodeStart[EVOLUTION_ROOT_CELL + 1],
  )).sort((left, right) => left - right);
  const foundation = archetypes.map((archetype, index) => ({ archetype, index }))
    .filter(({ archetype, index }) => index !== rootArchetype && archetype.domain === 'Foundation')
    .sort((left, right) => left.archetype.tier - right.archetype.tier || left.index - right.index);
  if (foundation.length < rootRing.length) throw new Error('Evolution root ring lacks distinct Foundation archetypes');
  for (let index = 0; index < rootRing.length; index++) {
    const archetype = foundation[index].index;
    archetypeByCell[rootRing[index]] = archetype;
    remaining[archetype]--;
  }

  const rootDistance = graphDistances(topology, EVOLUTION_ROOT_CELL);
  const maxRootDistance = rootDistance.reduce((maximum, value) => Math.max(maximum, value), 0);
  const cells = Array.from({ length: topology.nodeCount }, (_, cell) => cell)
    .filter((cell) => archetypeByCell[cell] === 0xff)
    .sort((left, right) => rootDistance[left] - rootDistance[right]
      || mix32(left ^ 0x51ab3d71) - mix32(right ^ 0x51ab3d71) || left - right);
  for (const cell of cells) {
    let selected = -1; let selectedScore = -Infinity;
    const desiredTier = 1 + Math.min(5, Math.floor(rootDistance[cell] * 6 / (maxRootDistance + 1)));
    for (let archetype = 0; archetype < archetypeCount; archetype++) {
      if (archetype === rootArchetype || remaining[archetype] <= 0) continue;
      let sameArchetype = 0; let sameDomain = 0;
      for (let offset = topology.nodeStart[cell]; offset < topology.nodeStart[cell + 1]; offset++) {
        const neighborArchetype = archetypeByCell[topology.nodeNeighbors[offset]];
        if (neighborArchetype === 0xff) continue;
        if (neighborArchetype === archetype) sameArchetype++;
        if (archetypes[neighborArchetype]?.domain === archetypes[archetype].domain) sameDomain++;
      }
      const score = remaining[archetype] * 65_536
        - Math.abs(archetypes[archetype].tier - desiredTier) * 2_048
        + sameDomain * 384
        - sameArchetype * 1_000_000_000
        + (mix32(cell ^ Math.imul(archetype + 1, 0x45d9f3b)) & 0xffff);
      if (score > selectedScore || (score === selectedScore && archetype < selected)) {
        selected = archetype; selectedScore = score;
      }
    }
    if (selected < 0) throw new Error(`Evolution cell ${cell} has no archetype candidate`);
    archetypeByCell[cell] = selected; remaining[selected]--;
  }
  if (remaining.some((count) => count !== 0)) throw new Error('Evolution archetype quotas were not exhausted');

  const archetypeCountByIndex = new Uint16Array(archetypeCount);
  for (const archetype of archetypeByCell) archetypeCountByIndex[archetype]++;
  const archetypeStart = new Uint32Array(archetypeCount + 1);
  for (let index = 0; index < archetypeCount; index++) {
    archetypeStart[index + 1] = archetypeStart[index] + archetypeCountByIndex[index];
  }
  const cellsByArchetype = new Uint16Array(topology.nodeCount);
  const cursor = archetypeStart.slice(0, archetypeCount);
  for (let cell = 0; cell < topology.nodeCount; cell++) {
    cellsByArchetype[cursor[archetypeByCell[cell]]++] = cell;
  }
  const diagnostics = validateEvolutionCellLayout({ topology, archetypes, rootArchetype,
    archetypeByCell, archetypeCountByIndex, rootRing, rootDistance });
  return Object.freeze({ version: EVOLUTION_LAYOUT_VERSION, topology, archetypes, rootCell: EVOLUTION_ROOT_CELL,
    rootArchetype, archetypeByCell, archetypeCountByIndex, archetypeStart, cellsByArchetype,
    rootDistance, rootRing: Object.freeze(rootRing), diagnostics });
}

export function validateEvolutionCellLayout(layout) {
  const { topology, archetypes, rootArchetype, archetypeByCell, archetypeCountByIndex,
    rootRing, rootDistance } = layout;
  const errors = [];
  if (archetypeByCell.length !== topology.nodeCount) errors.push('incomplete cell assignment');
  if (archetypeCountByIndex.length !== archetypes.length) errors.push('incomplete archetype counts');
  const observedCounts = new Uint16Array(archetypes.length); let assignmentsValid = archetypeByCell.length === topology.nodeCount;
  if (assignmentsValid) for (let cell = 0; cell < topology.nodeCount; cell++) {
    const archetype = archetypeByCell[cell];
    if (!Number.isInteger(archetype) || archetype < 0 || archetype >= archetypes.length) { assignmentsValid = false; break; }
    observedCounts[archetype]++;
  }
  if (!assignmentsValid) throw new Error('invalid Evolution cell layout: invalid cell assignment');
  if (archetypeCountByIndex.length === archetypes.length) for (let index = 0; index < archetypes.length; index++) {
    if (archetypeCountByIndex[index] !== observedCounts[index]) errors.push(`archetype ${index} count mismatch`);
  }
  const rootCount = observedCounts[rootArchetype] ?? 0;
  if (rootCount !== 1 || archetypeByCell[EVOLUTION_ROOT_CELL] !== rootArchetype) errors.push('invalid root assignment');
  const ringArchetypes = rootRing.map((cell) => archetypeByCell[cell]);
  if (ringArchetypes.some((index) => archetypes[index]?.domain !== 'Foundation')) errors.push('root ring is not Foundation');
  if (new Set(ringArchetypes).size !== ringArchetypes.length) errors.push('root ring repeats an archetype');

  let minNonRootCount = Infinity; let maxNonRootCount = 0;
  const componentCount = new Uint16Array(archetypes.length);
  const largestComponent = new Uint16Array(archetypes.length);
  const seen = new Uint8Array(topology.nodeCount); const queue = new Uint16Array(topology.nodeCount);
  for (let start = 0; start < topology.nodeCount; start++) {
    if (seen[start]) continue;
    const archetype = archetypeByCell[start]; componentCount[archetype]++;
    let head = 0; let tail = 0; queue[tail++] = start; seen[start] = 1;
    while (head < tail) {
      const cell = queue[head++];
      for (let offset = topology.nodeStart[cell]; offset < topology.nodeStart[cell + 1]; offset++) {
        const next = topology.nodeNeighbors[offset];
        if (!seen[next] && archetypeByCell[next] === archetype) { seen[next] = 1; queue[tail++] = next; }
      }
    }
    largestComponent[archetype] = Math.max(largestComponent[archetype], tail);
  }
  for (let index = 0; index < archetypes.length; index++) {
    const count = observedCounts[index];
    if (index === rootArchetype) continue;
    minNonRootCount = Math.min(minNonRootCount, count); maxNonRootCount = Math.max(maxNonRootCount, count);
    if (count < Math.ceil(topology.nodeCount * .01) || count > Math.floor(topology.nodeCount * .04)) {
      errors.push(`archetype ${archetypes[index].id} count ${count} is outside 1–4%`);
    }
    if (largestComponent[index] > 8) errors.push(`archetype ${archetypes[index].id} component exceeds 8`);
  }
  let diverseNeighborhoods = 0;
  for (let cell = 0; cell < topology.nodeCount; cell++) {
    if (cell === EVOLUTION_ROOT_CELL) continue;
    const local = new Set([archetypeByCell[cell]]);
    for (let offset = topology.nodeStart[cell]; offset < topology.nodeStart[cell + 1]; offset++) {
      local.add(archetypeByCell[topology.nodeNeighbors[offset]]);
    }
    if (local.size >= 3) diverseNeighborhoods++;
  }
  const neighborhoodDiversity = diverseNeighborhoods / Math.max(1, topology.nodeCount - 1);
  if (neighborhoodDiversity < .95) errors.push('closed-neighborhood diversity is below 95%');
  if (rootDistance?.length !== topology.nodeCount) errors.push('incomplete root distances');
  const digest = hexU32(fnv1aBytes(archetypeByCell));
  if (errors.length) throw new Error(`invalid Evolution cell layout: ${errors.join('; ')}`);
  return Object.freeze({ valid: true, layoutVersion: EVOLUTION_LAYOUT_VERSION,
    topologyLevel: topology.levels, cells: topology.nodeCount, edges: topology.edgeCount,
    archetypes: archetypes.length, rootCount, minNonRootCount, maxNonRootCount,
    largestComponent: Math.max(...largestComponent), neighborhoodDiversity,
    digest, componentCount, largestComponentByArchetype: largestComponent });
}

function quotas(cellCount, archetypeCount, rootArchetype) {
  const result = new Uint16Array(archetypeCount); const nonRoot = archetypeCount - 1;
  const base = Math.floor(cellCount / nonRoot); let extra = cellCount % nonRoot;
  for (let index = 0; index < archetypeCount; index++) if (index !== rootArchetype) {
    result[index] = base + (extra-- > 0 ? 1 : 0);
  }
  return result;
}

function graphDistances(topology, root) {
  const distance = new Uint16Array(topology.nodeCount).fill(0xffff); const queue = new Uint16Array(topology.nodeCount);
  let head = 0; let tail = 0; queue[tail++] = root; distance[root] = 0;
  while (head < tail) {
    const cell = queue[head++];
    for (let offset = topology.nodeStart[cell]; offset < topology.nodeStart[cell + 1]; offset++) {
      const next = topology.nodeNeighbors[offset];
      if (distance[next] === 0xffff) { distance[next] = distance[cell] + 1; queue[tail++] = next; }
    }
  }
  return distance;
}

function mix32(value) {
  let mixed = value >>> 0; mixed = Math.imul(mixed ^ mixed >>> 16, 0x7feb352d);
  mixed = Math.imul(mixed ^ mixed >>> 15, 0x846ca68b); return (mixed ^ mixed >>> 16) >>> 0;
}

function validateInputs(topology, archetypes) {
  if (!topology || topology.levels !== EVOLUTION_TOPOLOGY_LEVEL || topology.nodeCount > 0xffff
    || topology.positions?.length !== topology.nodeCount * 3 || !Array.isArray(archetypes)
    || archetypes.length < 2 || archetypes.length > 255) throw new Error('invalid Evolution cell-layout inputs');
  const roots = archetypes.filter((archetype) => archetype.kind === 'root');
  if (roots.length !== 1 || roots[0].id !== 'first-division') throw new Error('First Division must be the sole Evolution root archetype');
}
