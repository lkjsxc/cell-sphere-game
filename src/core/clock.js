/**
 * Fixed-step clock. Converts real elapsed time + speed multiplier into an
 * integer number of simulation ticks. The simulation is the source of truth
 * for game time; wall clock only decides how many ticks to run per slice.
 *
 * Speed changes alter tick counts per real-time slice only — never tick
 * contents — so determinism is preserved across speed changes.
 */

/** @param {number} ticksPerSecond canonical simulation rate @returns {Clock} */
export function createClock(ticksPerSecond) {
  return {
    tps: ticksPerSecond,
    accMs: 0, // accumulated game-time milliseconds not yet consumed
  };
}

/**
 * @param {Clock} clock mutated
 * @param {number} dtRealMs real elapsed milliseconds (already clamped by caller)
 * @param {number} speed multiplier (0 = paused)
 * @param {number} maxTicks hard cap for this slice (prevents spiral of death)
 * @returns {number} integer ticks to simulate now
 */
export function advanceClock(clock, dtRealMs, speed, maxTicks) {
  if (speed <= 0 || dtRealMs <= 0) return 0;
  clock.accMs += dtRealMs * speed;
  const msPerTick = 1000 / clock.tps;
  let ticks = Math.floor(clock.accMs / msPerTick);
  if (ticks <= 0) return 0;
  if (ticks > maxTicks) ticks = maxTicks;
  // A bounded caller may yield between slices, but authoritative tick debt is retained.
  clock.accMs -= ticks * msPerTick;
  return ticks;
}

/** @typedef {ReturnType<typeof createClock>} Clock */
