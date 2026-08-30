/** Tiny shared helpers for scripts. */
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { EVOLUTION_ARCHETYPES, EVOLUTION_LAYOUT, EVOLUTION_ROOT_CELL,
  EVOLUTION_TOPOLOGY } from '../src/game/skills/index.js';

const here = dirname(fileURLToPath(import.meta.url));

/** Resolve a path relative to the scripts directory. */
export function resolveRes(rel) {
  return resolve(here, rel);
}

/** Deterministic production-layout fixtures for audits; never progression authority. */
export function evolutionRepresentativeLevels(level = '1') {
  const first = new Map();
  for (let cell = 0; cell < EVOLUTION_TOPOLOGY.nodeCount; cell++) {
    const archetype = EVOLUTION_LAYOUT.archetypeByCell[cell]; if (!first.has(archetype)) first.set(archetype, cell);
  }
  return Object.freeze([...first].sort(([left], [right]) => left - right).map(([archetype, cell]) => Object.freeze({
    cell, level: typeof level === 'function' ? String(level(EVOLUTION_ARCHETYPES[archetype])) : String(level),
  })));
}

export function evolutionCellForArchetype(id) {
  const archetype = EVOLUTION_ARCHETYPES.findIndex((entry) => entry.id === id); if (archetype < 0) return null;
  let best = null;
  for (let cell = 0; cell < EVOLUTION_TOPOLOGY.nodeCount; cell++) if (EVOLUTION_LAYOUT.archetypeByCell[cell] === archetype
    && (best === null || EVOLUTION_LAYOUT.rootDistance[cell] < EVOLUTION_LAYOUT.rootDistance[best]
      || (EVOLUTION_LAYOUT.rootDistance[cell] === EVOLUTION_LAYOUT.rootDistance[best] && cell < best))) best = cell;
  return best;
}

export function evolutionPathToArchetype(id) {
  const target = evolutionCellForArchetype(id); if (target === null) return Object.freeze([]);
  const previous = new Int16Array(EVOLUTION_TOPOLOGY.nodeCount).fill(-1); const queue = new Uint16Array(EVOLUTION_TOPOLOGY.nodeCount);
  let head = 0; let tail = 0; previous[EVOLUTION_ROOT_CELL] = EVOLUTION_ROOT_CELL; queue[tail++] = EVOLUTION_ROOT_CELL;
  while (head < tail && previous[target] < 0) {
    const cell = queue[head++];
    for (let offset = EVOLUTION_TOPOLOGY.nodeStart[cell]; offset < EVOLUTION_TOPOLOGY.nodeStart[cell + 1]; offset++) {
      const next = EVOLUTION_TOPOLOGY.nodeNeighbors[offset];
      if (previous[next] < 0) { previous[next] = cell; queue[tail++] = next; }
    }
  }
  const path = []; for (let cell = target; ; cell = previous[cell]) { path.push(cell); if (cell === EVOLUTION_ROOT_CELL) break; }
  return Object.freeze(path.reverse());
}

export function evolutionLevelsForCells(cells, level = '1') {
  return Object.freeze([...new Set(cells)].sort((left, right) => left - right)
    .map((cell) => Object.freeze({ cell, level: String(level) })));
}
