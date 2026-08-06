import {
  addProgressionIntegers,
  incrementProgressionInteger,
  multiplyProgressionIntegers,
  parseProgressionInteger,
  subtractProgressionIntegers,
} from '../../core/progression-integer.js';

export const EVOLUTION_COST_VERSION = 1;

/** Exact direct cost for target level n: base*n² + evolutionPower*n*(n-1). */
export function evolutionCostForTargetLevel(node, targetLevel) {
  if (!node) return null;
  const n = parseProgressionInteger(targetLevel);
  if (n === '0') throw new RangeError('Evolution target level must be positive');
  const square = multiplyProgressionIntegers(n, n);
  const prior = subtractProgressionIntegers(n, '1');
  const baseTerm = multiplyProgressionIntegers(String(node.cost), square);
  const powerTerm = multiplyProgressionIntegers(String(node.evolutionPower),
    multiplyProgressionIntegers(n, prior));
  return addProgressionIntegers(baseTerm, powerTerm);
}

export function nextEvolutionCostForNode(node, currentLevel) {
  return evolutionCostForTargetLevel(node, incrementProgressionInteger(currentLevel));
}
