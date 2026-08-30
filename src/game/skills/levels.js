/** Canonical sparse exact levels keyed by stable Evolution cell index. */
import {
  addProgressionIntegers, normalizeProgressionInteger, parseProgressionInteger,
  progressionIntegerMagnitude,
} from '../../core/progression-integer.js';

export const EVOLUTION_LEVEL_VECTOR_VERSION = 3;
export const EVOLUTION_LEVEL_DOCUMENT_DIGIT_LIMIT = 1024;
export const EVOLUTION_LEVEL_ENTRY_LIMIT = 2_562;

export function normalizeEvolutionLevelVector(meta, cellCount = EVOLUTION_LEVEL_ENTRY_LIMIT) {
  const source = meta?.evolutionLevels;
  if (!Array.isArray(source) || source.length > Math.min(cellCount, EVOLUTION_LEVEL_ENTRY_LIMIT)) return EMPTY;
  const levels = new Map();
  try {
    for (const candidate of source) {
      if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)
        || Object.keys(candidate).some((key) => key !== 'cell' && key !== 'level')
        || !Number.isInteger(candidate.cell) || candidate.cell < 0 || candidate.cell >= cellCount
        || levels.has(candidate.cell)) return EMPTY;
      const level = parseEvolutionLevel(candidate.level);
      if (level === '0') return EMPTY;
      levels.set(candidate.cell, level);
    }
  } catch { return EMPTY; }
  return Object.freeze([...levels].sort((left, right) => left[0] - right[0])
    .map(([cell, level]) => Object.freeze({ cell, level })));
}

export function levelMapFromVector(vector) {
  return new Map(vector.map((entry) => [entry.cell, entry.level]));
}

export function levelFromVector(vector, cell) {
  let low = 0; let high = vector.length - 1;
  while (low <= high) {
    const middle = (low + high) >>> 1; const candidate = vector[middle];
    if (candidate.cell === cell) return candidate.level;
    if (candidate.cell < cell) low = middle + 1; else high = middle - 1;
  }
  return '0';
}

export function ownedCellsFromVector(vector) {
  return Object.freeze(vector.map((entry) => entry.cell));
}

export function canonicalLevelVectorKey(vector) {
  return `evolution-cell-levels:v${EVOLUTION_LEVEL_VECTOR_VERSION}|${vector.map(({ cell, level }) => `${cell}=${level.length}:${level}`).join('|')}`;
}

export function replaceEvolutionLevel(vector, cellCount, cell, level) {
  if (!Number.isInteger(cell) || cell < 0 || cell >= cellCount) throw new RangeError('unknown Evolution cell');
  const next = parseEvolutionLevel(level); const source = new Map(vector.map((entry) => [entry.cell, entry.level]));
  if (next === '0') source.delete(cell); else source.set(cell, next);
  return Object.freeze([...source].sort((left, right) => left[0] - right[0])
    .map(([entryCell, entryLevel]) => Object.freeze({ cell: entryCell, level: entryLevel })));
}

export function aggregateArchetypeRanks(vector, archetypeByCell, archetypeIds) {
  const totals = Array.from({ length: archetypeIds.length }, () => '0');
  for (const entry of vector) {
    const archetype = archetypeByCell[entry.cell];
    if (!Number.isInteger(archetype) || archetype < 0 || archetype >= totals.length) throw new RangeError('unknown Evolution archetype');
    totals[archetype] = addProgressionIntegers(totals[archetype], entry.level);
  }
  const ranks = archetypeIds.flatMap((id, index) => totals[index] === '0' ? [] : [Object.freeze({ id, level: totals[index] })]);
  return Object.freeze({ ranks: Object.freeze(ranks), totals: Object.freeze(totals),
    canonicalKey: canonicalAggregateRankKey(ranks) });
}

export function canonicalAggregateRankKey(ranks) {
  return `evolution-archetype-ranks:v1|${ranks.map(({ id, level }) => `${id.length}:${id}=${level.length}:${level}`).join('|')}`;
}

export function totalEvolutionLevels(vector) {
  let total = '0';
  for (const entry of vector) total = addProgressionIntegers(total, normalizeProgressionInteger(entry.level, '0'));
  return total;
}

/** Bounded refinement without parsing enormous values as JavaScript numbers. */
export function boundedEvolutionLevelRefinement(level) {
  const exact = parseEvolutionLevel(level); if (exact === '0' || exact === '1') return 0;
  const magnitude = progressionIntegerMagnitude(exact, 6); const leading = magnitude.mantissa / magnitude.mantissaScale;
  const logarithm = magnitude.exponent10 * Math.LN10 + Math.log(leading);
  return Math.max(0, Math.min(1, 1 - Math.exp(-logarithm / 6)));
}

export function normalizedMetaRevision(meta) { return normalizeProgressionInteger(meta?.revision, '0'); }

function parseEvolutionLevel(value) {
  const exact = parseProgressionInteger(value);
  if (exact.length > EVOLUTION_LEVEL_DOCUMENT_DIGIT_LIMIT) throw new RangeError('Evolution level document field is too wide');
  return exact;
}

const EMPTY = Object.freeze([]);
