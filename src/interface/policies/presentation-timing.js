/** Central UI-only timing policy. Simulation, Auto Next, camera, and watchdog clocks are excluded. */
export const PRESENTATION_DURATION = Object.freeze({
  toast: 2700, trophy: 4200, important: 4500,
});

/** Deterministic FIFO presentation queue with duplicate suppression and hold leases. */
export function createTimedPresentationQueue(options = {}) {
  const now = options.now ?? (() => performance.now()); const setTimer = options.setTimer ?? setTimeout;
  const clearTimer = options.clearTimer ?? clearTimeout; const duration = options.duration ?? PRESENTATION_DURATION.important;
  const keyOf = options.keyOf ?? ((item) => String(item)); const pending = []; const holds = new Set();
  let current = null; let timer = 0; let deadline = 0; let expired = false; let generation = 0;
  function enqueue(items) { const incoming = Array.isArray(items) ? items : [items]; const known = new Set([current, ...pending].filter(Boolean).map(keyOf));
    for (const item of incoming) { const key = keyOf(item); if (!known.has(key)) { known.add(key); pending.push(item); } }
    if (!current) advance(); return snapshot(); }
  function advance() { clearTimer(timer); timer = 0; expired = false; current = pending.shift() ?? null; generation++;
    if (!current) return options.onIdle?.(); deadline = now() + duration; options.onShow?.(current, snapshot()); schedule(); }
  function schedule() { clearTimer(timer); const token = generation; timer = setTimer(() => {
      if (token !== generation || !current) return; timer = 0; if (holds.size) expired = true; else acknowledge('elapsed');
    }, Math.max(0, deadline - now())); }
  function acknowledge(reason = 'acknowledged') { if (!current) return false; const item = current; generation++; clearTimer(timer); timer = 0;
    current = null; expired = false; options.onAcknowledge?.(item, reason); options.onHide?.(item, reason); advance(); return true; }
  function hold(reason, active) { if (active) holds.add(reason); else holds.delete(reason);
    if (!holds.size && current) { if (expired || now() >= deadline) acknowledge('hold-released'); else schedule(); } return holds.size; }
  function clear(reason = 'cleared') { generation++; clearTimer(timer); timer = 0; const item = current; current = null; pending.length = 0; holds.clear(); expired = false;
    if (item) options.onHide?.(item, reason); options.onIdle?.(); }
  function snapshot() { return Object.freeze({ current, pending: Object.freeze(pending.slice()), unread: pending.length + (current ? 1 : 0), held: holds.size > 0, deadline }); }
  return { enqueue, acknowledge, hold, clear, snapshot, get current() { return current; }, get length() { return pending.length + (current ? 1 : 0); } };
}
