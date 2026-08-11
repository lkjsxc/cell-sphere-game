/** Canonical sparse exact-level authority for the current authored Evolution catalog. */
import {
  compareProgressionIntegers, normalizeProgressionInteger, parseProgressionInteger,
  progressionIntegerMagnitude,
} from '../../core/progression-integer.js';

export const EVOLUTION_LEVEL_VECTOR_VERSION = 2;
export const EVOLUTION_LEVEL_DOCUMENT_DIGIT_LIMIT = 1024;

export function normalizeEvolutionLevelVector(meta, orderedIds) {
  const recognized = new Set(orderedIds); const levels = new Map();
  if (Array.isArray(meta?.evolutionLevels)) for (const candidate of meta.evolutionLevels) {
    if (!candidate || !recognized.has(candidate.id)) continue;
    let level; try { level = parseEvolutionLevel(candidate.level); } catch { continue; }
    if (level === '0') continue;
    const old = levels.get(candidate.id); if (!old || compareProgressionIntegers(level, old) > 0) levels.set(candidate.id, level);
  }
  return Object.freeze(orderedIds.filter((id) => levels.has(id)).map((id) => Object.freeze({ id, level: levels.get(id) })));
}
export function levelMapFromVector(vector) { return new Map(vector.map((entry) => [entry.id, entry.level])); }
export function levelFromVector(vector, id) { return vector.find((entry) => entry.id === id)?.level ?? '0'; }
export function ownedIdsFromVector(vector) { return Object.freeze(vector.map((entry) => entry.id)); }
export function canonicalLevelVectorKey(vector) {
  return `evolution-levels:v${EVOLUTION_LEVEL_VECTOR_VERSION}|${vector.map(({ id, level }) => `${id.length}:${id}=${level.length}:${level}`).join('|')}`;
}
export function replaceEvolutionLevel(vector, orderedIds, id, level) {
  const next = parseEvolutionLevel(level); const source = new Map(vector.map((entry) => [entry.id, entry.level]));
  if (next === '0') source.delete(id); else source.set(id, next);
  return Object.freeze(orderedIds.filter((candidate) => source.has(candidate)).map((candidate) => Object.freeze({ id: candidate, level: source.get(candidate) })));
}
/** Bounded level continuation without parsing enormous values as JavaScript numbers. */
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
