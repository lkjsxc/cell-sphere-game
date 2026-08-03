/** Independent pause ownership; every owner change refreshes semantics. */
export function pauseLabel(reasons) {
  if (reasons.has('worker-failed')) return 'World time unavailable because the simulation stopped';
  if (reasons.has('new-world')) return 'World time paused while confirmation is open';
  if (reasons.has('panel')) return 'World time paused while a panel is open';
  if (reasons.has('hidden')) return 'World time paused while this page is hidden';
  return reasons.has('manual') ? 'Resume world time' : 'Pause world time';
}
export function createPauseControl(onChange = () => {}) {
  const reasons = new Set();
  const notify = () => onChange(reasons.size > 0, new Set(reasons));
  return {
    set(reason, active) { const changed = active ? !reasons.has(reason) : reasons.has(reason);
      if (!changed) return; if (active) reasons.add(reason); else reasons.delete(reason); notify(); },
    has: (reason) => reasons.has(reason),
    get paused() { return reasons.size > 0; },
    values: () => new Set(reasons),
    clear() { if (!reasons.size) return; reasons.clear(); notify(); },
  };
}
