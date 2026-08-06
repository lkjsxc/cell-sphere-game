import {
  addProgressionIntegers,
  compareProgressionIntegers,
  multiplyProgressionIntegers,
  normalizeProgressionInteger,
  parseProgressionInteger,
  progressionIntegerMagnitude,
  subtractProgressionIntegers,
  sumProgressionIntegers,
} from '../../core/progression-integer.js';

/** Canonical sparse Evolution level-vector schema. */
export const EVOLUTION_LEVEL_VECTOR_VERSION = 1;
/** Malformed-document guard chosen so quartic Potential remains within the shared 4,096-digit boundary. */
export const EVOLUTION_LEVEL_DOCUMENT_DIGIT_LIMIT = 1019;

/**
 * Normalize against a caller-supplied stable catalog order. Duplicate entries
 * resolve to their greatest valid level, making normalization input-order
 * independent. A present evolutionLevels array always wins over legacy data.
 */
export function normalizeEvolutionLevelVector(meta, orderedIds) {
  const recognized = new Set(orderedIds);
  const byId = new Map();
  if (Array.isArray(meta?.evolutionLevels)) {
    for (const candidate of meta.evolutionLevels) {
      if (!candidate || !recognized.has(candidate.id)) continue;
      let level;
      try { level = parseEvolutionLevel(candidate.level); } catch { continue; }
      if (level === '0') continue;
      const previous = byId.get(candidate.id);
      if (!previous || compareProgressionIntegers(level, previous) > 0) byId.set(candidate.id, level);
    }
  } else if (Array.isArray(meta?.memoryNodes)) {
    for (const id of meta.memoryNodes) if (recognized.has(id)) byId.set(id, '1');
  }
  return Object.freeze(orderedIds.filter((id) => byId.has(id))
    .map((id) => Object.freeze({ id, level: byId.get(id) })));
}

export function levelMapFromVector(vector) {
  return new Map(vector.map((entry) => [entry.id, entry.level]));
}

export function levelFromVector(vector, id) {
  return vector.find((entry) => entry.id === id)?.level ?? '0';
}

export function ownedIdsFromVector(vector) {
  return Object.freeze(vector.map((entry) => entry.id));
}

/** Complete, collision-unambiguous cache/hash material; no digest is authoritative. */
export function canonicalLevelVectorKey(vector) {
  return `evolution-levels:v${EVOLUTION_LEVEL_VECTOR_VERSION}|${vector
    .map(({ id, level }) => `${id.length}:${id}=${level.length}:${level}`).join('|')}`;
}

/** Return a new stable sparse vector with exactly one recognized level replaced. */
export function replaceEvolutionLevel(vector, orderedIds, id, level) {
  const canonical = parseEvolutionLevel(level);
  const source = new Map(vector.map((entry) => [entry.id, entry.level]));
  if (canonical === '0') source.delete(id); else source.set(id, canonical);
  return Object.freeze(orderedIds.filter((candidate) => source.has(candidate))
    .map((candidate) => Object.freeze({ id: candidate, level: source.get(candidate) })));
}

/**
 * Exact breadth/depth summaries. `depth` is the node-power-weighted excess used
 * by World Potential; total levels and excess depth remain unbounded decimals.
 */
export function summarizeEvolutionLevelVector(vector, nodes, affinityIds) {
  const levels = levelMapFromVector(vector);
  const affinity = affinityIds.map((affinityId) => {
    const owned = nodes.filter((node) => node.affinity === affinityId && levels.has(node.id));
    const values = owned.map((node) => levels.get(node.id));
    const excess = values.map((level) => subtractProgressionIntegers(level, '1'));
    const weightedDepth = owned.map((node, index) => multiplyProgressionIntegers(excess[index], node.evolutionPower));
    const breadthPower = owned.reduce((sum, node) => sum + node.evolutionPower, 0);
    const minimumOwnedLevel = values.reduce((minimum, value) => minimum === null
      || compareProgressionIntegers(value, minimum) < 0 ? value : minimum, null) ?? '0';
    const depth = sumProgressionIntegers(weightedDepth);
    return Object.freeze({ affinity: affinityId, breadth: owned.length, breadthPower,
      totalLevels: sumProgressionIntegers(values), excessDepth: sumProgressionIntegers(excess),
      depth, minimumOwnedLevel,
      defenseRating: addProgressionIntegers(String(breadthPower), depth) });
  });
  const totalLevels = sumProgressionIntegers(vector.map((entry) => entry.level));
  const excessDepth = sumProgressionIntegers(vector.map((entry) => subtractProgressionIntegers(entry.level, '1')));
  const depth = sumProgressionIntegers(affinity.map((entry) => entry.depth));
  const breadthPower = affinity.reduce((sum, entry) => sum + entry.breadthPower, 0);
  const minimumOwnedLevel = vector.reduce((minimum, entry) => minimum === null
    || compareProgressionIntegers(entry.level, minimum) < 0 ? entry.level : minimum, null) ?? '0';
  return Object.freeze({ breadth: vector.length, breadthPower, totalLevels, excessDepth, depth,
    minimumOwnedLevel, evolutionDefenseRating: addProgressionIntegers(String(breadthPower), depth),
    affinities: Object.freeze(affinity) });
}

/**
 * Bounded direct level refinement r(L)=1-exp(-ln(L)/6). The logarithm is
 * reconstructed from decimal digit count and at most six leading digits; the
 * complete (possibly thousand-digit) level is never converted to Number.
 */
export function boundedEvolutionLevelRefinement(level) {
  const canonical = parseEvolutionLevel(level);
  if (canonical === '0' || canonical === '1') return 0;
  const magnitude = progressionIntegerMagnitude(canonical, 6);
  const leading = magnitude.mantissa / magnitude.mantissaScale;
  const naturalLog = magnitude.exponent10 * Math.LN10 + Math.log(leading);
  return Math.max(0, Math.min(1, 1 - Math.exp(-naturalLog / 6)));
}

export function normalizedMetaRevision(meta) {
  return normalizeProgressionInteger(meta?.revision, '0');
}
function parseEvolutionLevel(value) {
  const canonical = parseProgressionInteger(value);
  if (canonical.length > EVOLUTION_LEVEL_DOCUMENT_DIGIT_LIMIT) throw new RangeError('Evolution level document field is too wide');
  return canonical;
}
