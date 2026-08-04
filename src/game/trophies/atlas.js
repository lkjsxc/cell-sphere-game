/** Stable 96-address Trophy Sphere embedding on a level-2 icosphere. */
import { hashStringU32, hexU32 } from '../../core/hash.js';
import { createTopology } from '../../world/icosphere.js';

export const TROPHY_ATLAS_LEVEL = 2;
export const TROPHY_FAMILY_SIZE = 16;
export const TROPHY_FAMILIES = Object.freeze(['reach', 'form', 'endurance', 'habitat', 'evolution', 'mastery']);
const AXES = Object.freeze([[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].map(Object.freeze));

function build(topo) {
  const owner = new Int8Array(topo.nodeCount); const score = new Float32Array(topo.nodeCount);
  for (let cell = 0; cell < topo.nodeCount; cell++) {
    let best = 0; let bestScore = -2;
    for (let family = 0; family < 6; family++) { const at = cell * 3; const axis = AXES[family];
      const value = topo.positions[at] * axis[0] + topo.positions[at + 1] * axis[1] + topo.positions[at + 2] * axis[2];
      if (value > bestScore) { best = family; bestScore = value; }
    }
    owner[cell] = best; score[cell] = bestScore;
  }
  const cells = [];
  for (let family = 0; family < 6; family++) {
    const territory = Array.from({ length: topo.nodeCount }, (_, cell) => cell).filter((cell) => owner[cell] === family);
    territory.sort((a, b) => score[b] - score[a] || a - b); const allowed = new Set(territory); const seen = new Set([territory[0]]); const queue = [territory[0]];
    for (let head = 0; head < queue.length; head++) { const from = queue[head]; const neighbors = Array.from(topo.nodeNeighbors.slice(topo.nodeStart[from], topo.nodeStart[from + 1]));
      neighbors.sort((a, b) => score[b] - score[a] || a - b); for (const next of neighbors) if (allowed.has(next) && !seen.has(next)) { seen.add(next); queue.push(next); }
    }
    if (queue.length !== 27) throw new Error(`invalid Trophy territory ${family}: ${queue.length}`); cells.push(...queue.slice(0, 16));
  }
  return Object.freeze(cells);
}
export const TROPHY_ATLAS_CELLS = build(createTopology(TROPHY_ATLAS_LEVEL));
export const TROPHY_ATLAS_HASH = hexU32(hashStringU32(TROPHY_ATLAS_CELLS.join(',')));
export function createTrophyReverseMap(cells = TROPHY_ATLAS_CELLS) { const reverse = new Int16Array(162).fill(-1);
  cells.forEach((cell, index) => { if (cell >= 0 && cell < reverse.length && reverse[cell] < 0) reverse[cell] = index; }); return reverse; }
export const TROPHY_ATLAS_REVERSE = createTrophyReverseMap();

export function validateTrophyAtlas(cells = TROPHY_ATLAS_CELLS, topo = createTopology(TROPHY_ATLAS_LEVEL)) {
  const errors = []; const seen = new Set();
  if (topo.levels !== 2 || topo.nodeCount !== 162) errors.push('Trophy Sphere must use 162 level-2 cells');
  if (cells.length !== 96) errors.push(`trophy mapping count: ${cells.length}`);
  cells.forEach((cell, index) => { if (!Number.isInteger(cell) || cell < 0 || cell >= topo.nodeCount) errors.push(`invalid trophy cell: ${index}`);
    else if (seen.has(cell)) errors.push(`duplicate trophy cell: ${cell}`); seen.add(cell); });
  for (let family = 0; family < 6; family++) { const allowed = new Set(cells.slice(family * 16, family * 16 + 16));
    if (connected(topo, cells[family * 16], allowed) !== 16) errors.push(`disconnected trophy family: ${TROPHY_FAMILIES[family]}`); }
  return Object.freeze({ valid: !errors.length, errors: Object.freeze(errors), cells: cells.length, unique: seen.size,
    neutral: topo.nodeCount - seen.size, hash: hexU32(hashStringU32(Array.from(cells).join(','))) });
}
function connected(topo, root, allowed) { const seen = new Set([root]); const queue = [root];
  for (const cell of queue) for (let offset = topo.nodeStart[cell]; offset < topo.nodeStart[cell + 1]; offset++) { const next = topo.nodeNeighbors[offset];
    if (allowed.has(next) && !seen.has(next)) { seen.add(next); queue.push(next); } } return seen.size; }
