/** Exact all-authoritative-cell REACH 100% proof, sampled every tick. */
import { recordHistory } from '../replay.js';

export const REACH_100_REQUIRED_TICKS = 25;

export function createReachGoalState() {
  return { reach100Streak: 0, reach100Achieved: false, reach100Tick: 0,
    reach100LivingTicks: 0, reach100CelebrationPending: false };
}

export function updateReachGoal(state) {
  const exact = state.aliveCount === state.topo.nodeCount;
  state.reach100Streak = exact ? state.reach100Streak + 1 : 0;
  if (exact) state.reach100LivingTicks++;
  if (state.reach100Achieved || state.reach100Streak < REACH_100_REQUIRED_TICKS) return false;
  state.reach100Achieved = true; state.reach100Tick = state.tick; state.reach100CelebrationPending = true;
  recordHistory(state, 'reach-100', { valueA: state.topo.nodeCount, valueB: REACH_100_REQUIRED_TICKS });
  return true;
}

export function reachGoalSummary(state) {
  return Object.freeze({ exact: state.aliveCount === state.topo.nodeCount,
    living: state.aliveCount, total: state.topo.nodeCount, streak: state.reach100Streak,
    requiredTicks: REACH_100_REQUIRED_TICKS, achieved: state.reach100Achieved, achievedTick: state.reach100Tick });
}
