/** Independent pause ownership; one surface can never release another reason. */
export function createPauseControl(onChange = () => {}) {
  const reasons = new Set(); let last = false;
  const notify = () => { const next = reasons.size > 0; if (next !== last) { last = next; onChange(next, new Set(reasons)); } };
  return {
    set(reason, active) { if (active) reasons.add(reason); else reasons.delete(reason); notify(); },
    has: (reason) => reasons.has(reason),
    get paused() { return reasons.size > 0; },
    values: () => new Set(reasons),
    clear() { reasons.clear(); notify(); },
  };
}
