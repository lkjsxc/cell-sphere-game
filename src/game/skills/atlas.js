/** Stable six-territory embedding across every level-3 Evolution Globe cell. */
import { hashStringU32, hexU32 } from '../../core/hash.js';
import { createTopology } from '../../world/icosphere.js';

export const MEMORY_ATLAS_LEVEL = 3;
export const MEMORY_BRANCH_SIZE = 107;
const BRANCH_KEYS = Object.freeze(['reach', 'flow', 'reserve', 'ecology', 'perception', 'continuity']);
const AXES = Object.freeze([
  Object.freeze([1, 0, 0]), Object.freeze([-1, 0, 0]),
  Object.freeze([0, 1, 0]), Object.freeze([0, -1, 0]),
  Object.freeze([0, 0, 1]), Object.freeze([0, 0, -1]),
]);

function buildAtlas(topo) {
  const owner = new Int8Array(topo.nodeCount); const score = new Float32Array(topo.nodeCount);
  for (let cell = 0; cell < topo.nodeCount; cell++) {
    let best = 0; let bestScore = -2;
    for (let branch = 0; branch < AXES.length; branch++) {
      const axis = AXES[branch]; const at = cell * 3;
      const value = topo.positions[at] * axis[0] + topo.positions[at + 1] * axis[1] + topo.positions[at + 2] * axis[2];
      if (value > bestScore) { best = branch; bestScore = value; }
    }
    owner[cell] = best; score[cell] = bestScore;
  }
  const cells = []; const parents = [];
  for (let branch = 0; branch < AXES.length; branch++) {
    const territory = Array.from({ length: topo.nodeCount }, (_, cell) => cell).filter((cell) => owner[cell] === branch);
    territory.sort((a, b) => score[b] - score[a] || a - b);
    const allowed = new Set(territory); const local = new Map([[territory[0], 0]]); const queue = [territory[0]];
    const branchParents = [-1];
    for (let head = 0; head < queue.length; head++) {
      const from = queue[head]; const neighbors = Array.from(topo.nodeNeighbors.slice(topo.nodeStart[from], topo.nodeStart[from + 1]));
      neighbors.sort((a, b) => score[b] - score[a] || a - b);
      for (const next of neighbors) if (allowed.has(next) && !local.has(next)) {
        local.set(next, queue.length); queue.push(next); branchParents.push(head);
      }
    }
    if (queue.length !== MEMORY_BRANCH_SIZE) throw new Error(`invalid Evolution territory ${branch}: ${queue.length}`);
    cells.push(...queue); parents.push(...branchParents);
  }
  return { cells: Object.freeze(cells), parents: Object.freeze(parents) };
}

const BUILT = buildAtlas(createTopology(MEMORY_ATLAS_LEVEL));
export const MEMORY_ATLAS_CELLS = BUILT.cells;
const MEMORY_LAYOUT_PARENT_INDEXES = BUILT.parents;
export const MEMORY_ATLAS_HASH = hexU32(hashStringU32(MEMORY_ATLAS_CELLS.join(',')));

export function memoryAtlasCell(branch, index) {
  const branchIndex = BRANCH_KEYS.indexOf(branch);
  if (branchIndex < 0 || !Number.isInteger(index) || index < 0 || index >= MEMORY_BRANCH_SIZE)
    throw new Error(`invalid Evolution Globe address: ${branch}/${index}`);
  return MEMORY_ATLAS_CELLS[branchIndex * MEMORY_BRANCH_SIZE + index];
}

export function createMemoryReverseMap(cells = MEMORY_ATLAS_CELLS) {
  const reverse = new Int16Array(642).fill(-1);
  cells.forEach((cell, index) => { if (cell >= 0 && cell < reverse.length && reverse[cell] < 0) reverse[cell] = index; });
  return reverse;
}
export const MEMORY_ATLAS_REVERSE = createMemoryReverseMap();

function atlasLayoutRelations(cells = MEMORY_ATLAS_CELLS, parents = MEMORY_LAYOUT_PARENT_INDEXES) {
  const relations = [];
  for (let branch = 0; branch < 6; branch++) for (let index = 1; index < MEMORY_BRANCH_SIZE; index++) {
    const offset = branch * MEMORY_BRANCH_SIZE;
    relations.push([cells[offset + parents[offset + index]], cells[offset + index]]);
  }
  return relations;
}

export function validateAtlasMapping(cells = MEMORY_ATLAS_CELLS, topo = createTopology(MEMORY_ATLAS_LEVEL)) {
  const errors = []; const seen = new Set();
  if (topo.levels !== 3 || topo.nodeCount !== 642) errors.push('Evolution Globe topology must have 642 level-3 cells');
  if (cells.length !== topo.nodeCount) errors.push(`mapping count: ${cells.length}`);
  cells.forEach((cell, index) => {
    if (!Number.isInteger(cell) || cell < 0 || cell >= topo.nodeCount) errors.push(`invalid mapped cell: ${index}`);
    else if (seen.has(cell)) errors.push(`duplicate mapped cell: ${cell}`);
    seen.add(cell);
  });
  for (const [from, to] of atlasLayoutRelations(cells)) if (!adjacent(topo, from, to)) errors.push(`nonadjacent layout step: ${from}->${to}`);
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors), cells: cells.length,
    unique: seen.size, layoutRelations: atlasLayoutRelations(cells).length,
    hash: hexU32(hashStringU32(Array.from(cells).join(','))) });
}

/** Deterministic reconstruction diagnostic for saves, tests, and release evidence. */
export function generateMemoryAtlas(topo = createTopology(MEMORY_ATLAS_LEVEL)) {
  const generated = buildAtlas(topo); const mapping = generated.cells;
  return Object.freeze({ solved: true, visits: topo.nodeCount, mapping, report: validateAtlasMapping(mapping, topo) });
}

function adjacent(topo, a, b) {
  if (!Number.isInteger(a) || !Number.isInteger(b)) return false;
  for (let offset = topo.nodeStart[a]; offset < topo.nodeStart[a + 1]; offset++) if (topo.nodeNeighbors[offset] === b) return true;
  return false;
}
