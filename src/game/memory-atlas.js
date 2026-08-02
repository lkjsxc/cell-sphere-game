/** Stable level-3 embedding for the 108-cell Memory atlas. */
import { hashStringU32, hexU32 } from '../core/hash.js';
import { createTopology } from '../world/icosphere.js';

export const MEMORY_ATLAS_LEVEL = 3;
export const MEMORY_BRANCH_SIZE = 18;
export const MEMORY_PARENT_TEMPLATE = Object.freeze([
  [], [0], [0], [1], [2], [2], [3], [5], [6],
  [7], [7], [9], [8], [9], [10], [12], [15], [16],
].map((parents) => Object.freeze(parents)));
const BRANCH_KEYS = Object.freeze(['reach', 'flow', 'reserve', 'ecology', 'perception', 'continuity']);
const PINNED_RING = Object.freeze([42, 166, 43, 189, 46, 178, 47, 285, 75, 291, 72, 273]);

/** Generated once by generateMemoryAtlas(); frozen to make saves and screenshots stable. */
export const MEMORY_ATLAS_CELLS = Object.freeze([
  58,223,241,218,242,61,219,227,245,17,229,398,162,409,408,42,273,270,
  16,198,211,51,55,230,195,226,168,225,60,403,170,1,404,43,166,169,
  24,327,338,87,90,577,330,575,176,459,123,440,175,460,462,46,189,190,
  152,583,586,580,585,151,345,579,283,35,463,474,173,472,461,47,178,172,
  27,350,363,91,95,573,347,570,286,468,127,466,288,2,467,75,285,287,
  18,246,237,65,62,236,249,233,248,234,64,397,272,396,399,72,291,289,
]);
export const MEMORY_ATLAS_HASH = hexU32(hashStringU32(MEMORY_ATLAS_CELLS.join(',')));

export function memoryAtlasCell(branch, index) {
  const branchIndex = BRANCH_KEYS.indexOf(branch);
  if (branchIndex < 0 || !Number.isInteger(index) || index < 0 || index >= MEMORY_BRANCH_SIZE)
    throw new Error(`invalid Memory atlas address: ${branch}/${index}`);
  return MEMORY_ATLAS_CELLS[branchIndex * MEMORY_BRANCH_SIZE + index];
}

export function createMemoryReverseMap(cells = MEMORY_ATLAS_CELLS) {
  const reverse = new Int16Array(642).fill(-1);
  cells.forEach((cell, index) => { if (cell >= 0 && cell < reverse.length && reverse[cell] < 0) reverse[cell] = index; });
  return reverse;
}
export const MEMORY_ATLAS_REVERSE = createMemoryReverseMap();

export function atlasRelations() {
  const relations = [];
  for (let branch = 0; branch < 6; branch++) for (let index = 0; index < 18; index++) {
    for (const parent of MEMORY_PARENT_TEMPLATE[index]) relations.push([branch * 18 + parent, branch * 18 + index]);
    if (index === 16) relations.push([((branch + 5) % 6) * 18 + 15, branch * 18 + 16]);
  }
  return relations;
}

export function validateAtlasMapping(cells = MEMORY_ATLAS_CELLS, topo = createTopology(MEMORY_ATLAS_LEVEL)) {
  const errors = []; const seen = new Set();
  if (topo.levels !== 3 || topo.nodeCount !== 642) errors.push('atlas topology must be level 3 with 642 cells');
  if (cells.length !== 108) errors.push(`mapping count: ${cells.length}`);
  cells.forEach((cell, index) => {
    if (!Number.isInteger(cell) || cell < 0 || cell >= topo.nodeCount) errors.push(`invalid mapped cell: ${index}`);
    else if (seen.has(cell)) errors.push(`duplicate mapped cell: ${cell}`);
    seen.add(cell);
  });
  for (const [from, to] of atlasRelations()) if (!adjacent(topo, cells[from], cells[to]))
    errors.push(`nonadjacent relation: ${from}->${to}`);
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors),
    cells: cells.length, unique: seen.size, relations: atlasRelations().length,
    hash: hexU32(hashStringU32(Array.from(cells).join(','))) });
}

/** Deterministic MRV/backtracking diagnostic that reproduces the frozen map. */
export function generateMemoryAtlas(topo = createTopology(MEMORY_ATLAS_LEVEL)) {
  const graph = Array.from({ length: 108 }, () => []);
  for (const [a, b] of atlasRelations()) { graph[a].push(b); graph[b].push(a); }
  const neighbors = Array.from({ length: topo.nodeCount }, (_, cell) =>
    Array.from(topo.nodeNeighbors.slice(topo.nodeStart[cell], topo.nodeStart[cell + 1])).sort((a, b) => a - b));
  const cells = new Int16Array(108).fill(-1); const used = new Uint8Array(topo.nodeCount);
  for (let branch = 0; branch < 6; branch++) {
    cells[branch * 18 + 15] = PINNED_RING[branch * 2];
    cells[branch * 18 + 16] = PINNED_RING[(branch * 2 + 11) % 12];
    used[cells[branch * 18 + 15]] = 1; used[cells[branch * 18 + 16]] = 1;
  }
  const distance = graphDistance(neighbors, 12); let visits = 0;
  function domain(variable) {
    const assigned = graph[variable].filter((other) => cells[other] >= 0);
    let values = neighbors[cells[assigned[0]]].filter((cell) => !used[cell]);
    for (let i = 1; i < assigned.length; i++) {
      const allowed = new Set(neighbors[cells[assigned[i]]]); values = values.filter((cell) => allowed.has(cell));
    }
    const keyCell = cells[Math.floor(variable / 18) * 18 + 15]; const key = keyCell * 3;
    return values.filter((cell) => distance[cell] >= 2).sort((a, b) => distance[b] - distance[a]
      || radial(topo.positions, b, key) - radial(topo.positions, a, key) || a - b);
  }
  function solve(left) {
    visits++; if (!left) return true;
    let variable = -1; let values = null;
    for (let index = 0; index < 108; index++) if (cells[index] < 0 && graph[index].some((other) => cells[other] >= 0)) {
      const next = domain(index); if (!next.length) return false;
      if (!values || next.length < values.length || (next.length === values.length && index < variable)) {
        variable = index; values = next; if (next.length === 1) break;
      }
    }
    for (const cell of values ?? []) { cells[variable] = cell; used[cell] = 1;
      if (solve(left - 1)) return true; used[cell] = 0; cells[variable] = -1; }
    return false;
  }
  const solved = solve(96); const mapping = Object.freeze(Array.from(cells));
  return Object.freeze({ solved, visits, mapping, report: validateAtlasMapping(mapping, topo) });
}

function adjacent(topo, a, b) {
  if (!Number.isInteger(a) || !Number.isInteger(b)) return false;
  for (let offset = topo.nodeStart[a]; offset < topo.nodeStart[a + 1]; offset++) if (topo.nodeNeighbors[offset] === b) return true;
  return false;
}
function radial(positions, cell, key) { const at = cell * 3;
  return positions[at] * positions[key] + positions[at + 1] * positions[key + 1] + positions[at + 2] * positions[key + 2]; }
function graphDistance(neighbors, root) { const distance = new Int16Array(neighbors.length).fill(-1); distance[root] = 0; const queue = [root];
  for (const cell of queue) for (const next of neighbors[cell]) if (distance[next] < 0) { distance[next] = distance[cell] + 1; queue.push(next); }
  return distance; }
