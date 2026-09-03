/** Bounded keyboard targets for the exact-cell Evolution sphere. */
const COMMAND_BY_KEY = Object.freeze({
  ArrowLeft: 'previous-cell',
  ArrowRight: 'next-cell',
  Home: 'root-cell',
  PageUp: 'previous-ready',
  PageDown: 'next-ready',
});

export const EVOLUTION_NAVIGATION_SHORTCUTS = Object.freeze(Object.keys(COMMAND_BY_KEY));

export function evolutionNavigationCommand(event) {
  if (!event || event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return null;
  return COMMAND_BY_KEY[event.key] ?? null;
}

export function evolutionNavigationTarget(command, inputs) {
  const nodeCount = validNodeCount(inputs?.nodeCount); if (!nodeCount) return null;
  const selected = validCell(inputs?.selectedCell, nodeCount) ? inputs.selectedCell : null;
  if (command === 'previous-cell') return selected === null ? nodeCount - 1 : (selected - 1 + nodeCount) % nodeCount;
  if (command === 'next-cell') return selected === null ? 0 : (selected + 1) % nodeCount;
  if (command === 'root-cell') return validCell(inputs?.rootCell, nodeCount) ? inputs.rootCell : null;
  if (command !== 'previous-ready' && command !== 'next-ready') return null;
  const candidates = readyCandidates(inputs?.readyCells, inputs?.owned, nodeCount);
  if (!candidates.length) return null;
  if (command === 'next-ready') return candidates.find((cell) => selected === null || cell > selected) ?? candidates[0];
  for (let index = candidates.length - 1; index >= 0; index--) {
    if (selected === null || candidates[index] < selected) return candidates[index];
  }
  return candidates.at(-1);
}

export function isReadyEvolutionNavigation(command) {
  return command === 'previous-ready' || command === 'next-ready';
}

function readyCandidates(values, owned, nodeCount) {
  if (!values || typeof values[Symbol.iterator] !== 'function') return [];
  const seen = new Uint8Array(nodeCount); const unowned = []; const refinements = []; let inspected = 0;
  // Production ready sets contain at most one entry per exact cell. Keep the
  // presentation boundary finite even if an untrusted caller supplies more.
  for (const cell of values) {
    if (inspected++ >= nodeCount) break;
    if (!validCell(cell, nodeCount) || seen[cell]) continue;
    seen[cell] = 1; (owned?.[cell] === 1 ? refinements : unowned).push(cell);
  }
  const selected = unowned.length ? unowned : refinements; selected.sort((left, right) => left - right); return selected;
}

function validNodeCount(value) { return Number.isSafeInteger(value) && value > 0 ? value : null; }
function validCell(value, nodeCount) { return Number.isSafeInteger(value) && value >= 0 && value < nodeCount; }
