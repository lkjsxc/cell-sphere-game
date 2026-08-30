/** Exact monotonically growing costs for one authored Evolution skill at a time. */
import { addProgressionIntegers, incrementProgressionInteger, multiplyProgressionIntegers,
  parseProgressionInteger, subtractProgressionIntegers } from '../../core/progression-integer.js';

export const EVOLUTION_COST_VERSION = 2;

/** Target level n costs base*n² plus a smaller authored continuation term. */
export function evolutionCostForTargetLevel(node, targetLevel) {
  if (!node) return null;
  const n = parseProgressionInteger(targetLevel);
  if (n === '0') throw new RangeError('Evolution target level must be positive');
  const square = multiplyProgressionIntegers(n, n); const prior = subtractProgressionIntegers(n, '1');
  const base = multiplyProgressionIntegers(String(node.cost), square);
  const continuation = multiplyProgressionIntegers(String(node.refinementCost ?? 1), multiplyProgressionIntegers(n, prior));
  return addProgressionIntegers(base, continuation);
}
export function nextEvolutionCostForNode(node, currentLevel) {
  return evolutionCostForTargetLevel(node, incrementProgressionInteger(currentLevel));
}
