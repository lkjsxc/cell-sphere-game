/** Exact monotone target-rank cost law for one authored Evolution archetype. */
import { addProgressionIntegers, multiplyProgressionIntegers,
  parseProgressionInteger, subtractProgressionIntegers } from '../../core/progression-integer.js';

export const EVOLUTION_COST_VERSION = 2;

/** Target aggregate rank n costs base*n² plus a smaller authored continuation term. */
export function evolutionCostForTargetLevel(archetype, targetLevel) {
  if (!archetype) return null;
  const n = parseProgressionInteger(targetLevel);
  if (n === '0') throw new RangeError('Evolution target rank must be positive');
  const square = multiplyProgressionIntegers(n, n); const prior = subtractProgressionIntegers(n, '1');
  const base = multiplyProgressionIntegers(String(archetype.cost), square);
  const continuation = multiplyProgressionIntegers(String(archetype.refinementCost ?? 1), multiplyProgressionIntegers(n, prior));
  return addProgressionIntegers(base, continuation);
}
