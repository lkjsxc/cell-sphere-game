/** Production-backed fair campaign environment for autonomous worlds. */
import { RunController } from '../simulation/simulator.js';
import { applyRunResult } from '../interface/policies/run-result.js';
import { appendEvolutionEvent, appendTrophyEvents, validateHistory } from '../platform/history.js';
import { validateMeta } from '../platform/storage.js';
import { reconcileTrophies } from '../game/trophies/evaluator.js';
import { compileEvolution, evolutionCellState, getMemoryNode, purchaseEvolutionLevel } from '../game/skills/index.js';
import { ENVIRONMENT_SCHEDULE_HASH } from '../game/environment-level.js';
import { incrementProgressionInteger, isCanonicalProgressionInteger, maxProgressionInteger,
  normalizeProgressionInteger } from '../core/progression-integer.js';
import { boundedTransactionKey, hashStringU32 } from '../core/hash.js';
import { buildAgentObservation, publicEnvironmentPressure } from './observation.js';
import { AGENT_GOALS, defaultAgentSave, exportAgentSave, validateAgentSave } from './schema.js';

const GOALS = new Set(AGENT_GOALS);
const SEED_LIMIT = 0x100000000;
/** External API chunk/budget guard, never simulation terminal authority. */
export const MAX_AGENT_ADVANCE_TICKS = 10_000;
export const MAX_AGENT_RUN_BUDGET_TICKS = 1_000_000;

export function createAgentEnvironment(raw = defaultAgentSave()) {
  let state = validateAgentSave(raw);
  let activeWorld = null;

  function observe() { return buildAgentObservation(state, activeCheckpoint()); }
  function save() { return exportAgentSave(state); }
  function respond(accepted, reason, extra = {}) {
    return Object.freeze({ accepted, reason, observation: observe(), ...extra, hash: save().stateHash });
  }

  function buy(action) {
    // A World's compiled Evolution is immutable for its entire authoritative run.
    if (activeWorld) return respond(false, 'world-active');
    const cellId = action.cellId;
    const node = getMemoryNode(cellId);
    if (!node) return respond(false, 'unknown-cell');
    if (!isCanonicalProgressionInteger(action.expectedLevel) || !isCanonicalProgressionInteger(action.expectedRevision)) {
      return respond(false, 'missing-precondition');
    }
    const status = evolutionCellState(state.meta, node);
    if (!status.reachable) return respond(false, 'adjacency-required');
    if (!status.affordable) return respond(false, 'insufficient-echoes');
    if (action.transactionKey !== undefined && !(typeof action.transactionKey === 'string'
      && action.transactionKey.length > 0 && action.transactionKey.length <= 128)) return respond(false, 'invalid-transaction-key');
    const transactionKey = action.transactionKey
      ?? agentEvolutionTransactionKey(action.expectedRevision, cellId, action.expectedLevel, status.nextLevel);
    const purchase = purchaseEvolutionLevel(state.meta, cellId, {
      transactionKey, expectedLevel: action.expectedLevel, expectedRevision: action.expectedRevision,
    });
    if (!purchase.ok) return respond(false, purchase.reason);
    const recognition = reconcileTrophies(purchase.meta, state.history);
    let history = appendEvolutionEvent(state.history, {
      transactionKey, nodeId: cellId, oldLevel: purchase.oldLevel, newLevel: purchase.newLevel, cost: purchase.cost,
      balanceBefore: purchase.balanceBefore, balanceAfter: purchase.balanceAfter, run: recognition.meta.runs,
      bestEnvironmentLevelReached: recognition.meta.bestEnvironmentLevelReached,
      compilerVersions: purchase.compilerVersions,
    });
    history = appendTrophyEvents(history, recognition.awardedIds);
    state = validateAgentSave({ ...state, meta: validateMeta(recognition.meta), history: validateHistory(history) });
    return respond(true, 'evolution-level-purchased', { purchase: Object.freeze({ cellId,
      oldLevel: purchase.oldLevel, newLevel: purchase.newLevel, cost: purchase.cost,
      balanceAfter: purchase.balanceAfter, transactionKey, trophiesAwarded: recognition.awardedIds }) });
  }

  function createActiveWorld(action = {}) {
    if (activeWorld) return { ok: false, reason: 'world-already-active' };
    if (!isCanonicalProgressionInteger(action.expectedRevision) || !isCanonicalProgressionInteger(action.expectedWorldOrdinal)) {
      return { ok: false, reason: 'missing-precondition' };
    }
    if (action.mode !== undefined || action.environmentLevel !== undefined) {
      return { ok: false, reason: 'static-environment-actions-retired' };
    }
    const meta = state.meta;
    const expectedOrdinal = incrementProgressionInteger(maxProgressionInteger(meta.runs, meta.worldSeedIndex));
    if (action.expectedRevision !== meta.revision || action.expectedWorldOrdinal !== expectedOrdinal) {
      return { ok: false, reason: 'stale-run-precondition' };
    }
    const seedIndex = maxProgressionInteger(meta.runs, meta.worldSeedIndex);
    const seed = hashStringU32(`agent-world-v3|${state.campaignSeed}|${seedIndex}`) % SEED_LIMIT;
    const worldOrdinal = incrementProgressionInteger(seedIndex);
    const evolution = compileEvolution(meta);
    const run = new RunController({
      seed, runId: 1, strainId: 'pioneer', worldOrdinal,
      evolutionDefense: { affinityDefense: evolution.affinityDefense, pressureDefense: evolution.pressureDefense },
      memoryEffects: evolution.effects, habitatCapabilities: evolution.habitatCapabilities,
      ecology: evolution.ecology, worldmaking: evolution.worldmaking, luminous: evolution.luminous,
    });
    run.start();
    activeWorld = { run, seedIndex, seed, worldOrdinal };
    return { ok: true };
  }

  function startWorld(action = {}) {
    const created = createActiveWorld(action);
    return created.ok ? respond(true, 'world-started', { checkpoint: activeCheckpoint() }) : respond(false, created.reason);
  }

  function advanceWorld(action = {}) {
    if (!activeWorld) return respond(false, 'no-active-world');
    const ticks = boundedTicks(action.ticks ?? action.chunkTicks, MAX_AGENT_ADVANCE_TICKS);
    if (ticks === null) return respond(false, 'invalid-advance-ticks');
    activeWorld.run.advance(ticks);
    if (activeWorld.run.state.status === 'extinct') return settleActiveWorld();
    return respond(true, 'world-advanced', { checkpoint: activeCheckpoint() });
  }

  function continueWorld(action = {}) {
    if (!activeWorld) return respond(false, 'no-active-world');
    const budget = boundedTicks(action.budgetTicks, MAX_AGENT_RUN_BUDGET_TICKS);
    if (budget === null) return respond(false, 'invalid-run-budget');
    let remaining = budget;
    while (activeWorld && activeWorld.run.state.status !== 'extinct' && remaining > 0) {
      const chunk = Math.min(MAX_AGENT_ADVANCE_TICKS, remaining);
      activeWorld.run.advance(chunk);
      remaining -= chunk;
    }
    if (activeWorld?.run.state.status === 'extinct') return settleActiveWorld();
    return respond(true, 'incomplete-budget', { checkpoint: activeCheckpoint(), budgetTicks: budget, remainingTicks: remaining });
  }

  function runWorld(action = {}) {
    const created = createActiveWorld(action);
    if (!created.ok) return respond(false, created.reason);
    const budgetTicks = action.budgetTicks ?? MAX_AGENT_ADVANCE_TICKS;
    return continueWorld({ budgetTicks });
  }

  function settleActiveWorld() {
    if (!activeWorld || activeWorld.run.state.status !== 'extinct') return respond(false, 'world-not-terminal');
    const { run, seedIndex, seed, worldOrdinal } = activeWorld;
    const rawResult = run.buildResult();
    const identified = { ...rawResult, resultTransactionKey: agentResultTransactionKey(
      worldOrdinal, seed, rawResult.environmentScheduleHash, rawResult.currentEnvironmentProfileHash,
      rawResult.hash, rawResult.tick,
    ) };
    const cursorMeta = { ...state.meta, worldSeedIndex: incrementProgressionInteger(seedIndex),
      revision: incrementProgressionInteger(state.meta.revision) };
    const transaction = applyRunResult(cursorMeta, state.history, identified,
      new Set(state.meta.resultKeys ?? []));
    if (!transaction.applied) return respond(false, transaction.reason ?? 'result-not-applied');
    const result = curateResult(identified, transaction);
    activeWorld = null;
    state = validateAgentSave({ ...state, meta: transaction.meta, history: transaction.archive, lastResult: result });
    return respond(true, 'world-completed', { result: state.lastResult });
  }

  function setGoal(goal) {
    if (!GOALS.has(goal)) return respond(false, 'unknown-goal');
    state = validateAgentSave({ ...state, goal });
    return respond(true, 'goal-set');
  }
  function reset(seed) {
    if (!Number.isInteger(seed) || seed < 0 || seed >= SEED_LIMIT) return respond(false, 'invalid-seed');
    activeWorld = null;
    state = defaultAgentSave(seed);
    return respond(true, 'campaign-reset');
  }
  function act(action) {
    if (!action || typeof action !== 'object' || typeof action.type !== 'string') return respond(false, 'invalid-action');
    if (action.type === 'observe') return respond(true, 'observed');
    if (action.type === 'buy-evolution-level') return buy(action);
    if (action.type === 'start-world') return startWorld(action);
    if (action.type === 'advance-world') return advanceWorld(action);
    if (action.type === 'continue-world') return continueWorld(action);
    if (action.type === 'run-world') return runWorld(action);
    if (action.type === 'retry-environment-level' || action.type === 'select-environment-level') {
      return respond(false, 'static-environment-actions-retired');
    }
    if (action.type === 'inspect-last-result') return respond(true, 'last-result-inspected', { result: state.lastResult });
    if (action.type === 'inspect-evolution') return respond(true, 'evolution-inspected', {
      cells: observe().evolutionCells });
    if (action.type === 'export') return respond(true, 'save-exported', { save: save() });
    if (action.type === 'set-goal') return setGoal(action.goal);
    if (action.type === 'reset') return reset(action.seed);
    return respond(false, 'unknown-action');
  }
  function activeCheckpoint() {
    if (!activeWorld) return null;
    const snapshot = activeWorld.run.snapshot();
    return Object.freeze({ worldOrdinal: activeWorld.worldOrdinal, tick: snapshot.tick, status: snapshot.status,
      currentEnvironmentLevel: snapshot.currentEnvironmentLevel, peakEnvironmentLevel: snapshot.peakEnvironmentLevel,
      environmentScheduleVersion: snapshot.environmentScheduleVersion,
      environmentProfileVersion: snapshot.environmentProfileVersion,
      environmentLevelStartTick: snapshot.environmentLevelStartTick,
      nextEnvironmentLevelTick: snapshot.nextEnvironmentLevelTick,
      environmentLevelProgressQ: snapshot.environmentLevelProgressQ,
      environmentPressureSummary: snapshot.environmentPressureSummary,
      environmentExposure: snapshot.environmentExposure,
      resources: Object.freeze({ reserveFraction: snapshot.metrics.resourceReserveFraction,
        depletedCells: snapshot.metrics.resourceDepletedCells, recoveredCells: snapshot.metrics.resourceRecoveredCells }),
      reach: snapshot.reach, luminous: Object.freeze({ electrifiedCells: snapshot.metrics.electrifiedCells,
        development: snapshot.metrics.luminousDevelopment ?? snapshot.luminousDevelopment ?? 0 }),
    });
  }
  return Object.freeze({ observe, act, exportSave: save });
}

function boundedTicks(value, ceiling) {
  return Number.isInteger(value) && value > 0 && value <= ceiling ? value : null;
}
function agentResultTransactionKey(worldOrdinal, seed, scheduleHash, profileHash, resultHash, tick) {
  return boundedTransactionKey('agent-result', [worldOrdinal, seed, scheduleHash, profileHash, resultHash, tick]);
}
function agentEvolutionTransactionKey(revision, id, currentLevel, nextLevel) {
  return boundedTransactionKey('agent-evolution', [revision, id, currentLevel, nextLevel]);
}
function curateResult(result, transaction) {
  const habitats = result.habitatOccupancy ?? [];
  return Object.freeze({ resultSchemaVersion: result.resultSchemaVersion, worldOrdinal: result.worldOrdinal,
    startEnvironmentLevel: result.startEnvironmentLevel,
    finalEnvironmentLevel: result.finalEnvironmentLevel, peakEnvironmentLevel: result.peakEnvironmentLevel,
    bestEnvironmentLevelReached: transaction.meta.bestEnvironmentLevelReached,
    environmentScheduleVersion: result.environmentScheduleVersion,
    environmentProfileVersion: result.environmentProfileVersion,
    environmentExposure: result.environmentExposure, timeAtPeakTicks: result.timeAtPeakTicks,
    archetype: result.archetype, survivalSeconds: result.survivalSeconds, cause: result.cause,
    terminalCause: result.terminalCause, score: transaction.score.total, scoreModelVersion: transaction.score.modelVersion,
    rank: transaction.score.rank.en, echoes: transaction.score.echoes,
    pressure: publicEnvironmentPressure(result.environmentPressureSummary), peakReach: result.peakCoverage, sustainedReach: result.sustainedCoverage,
    peakConnectedShare: result.peakConnectedShare,
    resources: Object.freeze({ initial: result.resourceInitial, final: result.resourceFinal,
      depletedCells: result.resourceDepletedCells, recoveredCells: result.resourceRecoveredCells,
      freshwaterSupportedCellSeconds: result.freshwaterSupportedCellSeconds,
      livingTicksByQuintile: Object.freeze([...(result.resourceLivingTicksByQuintile ?? [])]) }),
    habitats: Object.freeze({ lake: habitats[13] ?? 0, tundra: habitats[11] ?? 0,
      snowIce: habitats[12] ?? 0, shallowOcean: habitats[1] ?? 0, deepOcean: habitats[0] ?? 0 }),
    worldmaking: Object.freeze({ transformedCells: result.transformedCells ?? 0,
      glacialLakeCells: result.glacialLakeCells ?? 0, maritimeForestCells: result.maritimeForestCells ?? 0,
      electrifiedCells: result.electrifiedCells ?? 0, finalElectrifiedCells: result.finalElectrifiedCells ?? 0,
      everPoweredCells: result.everPoweredCells ?? 0, poweredCellSeconds: result.poweredCellSeconds ?? 0 }),
    reach: Object.freeze({ gained: result.reach?.gained ?? 0, lost: result.reach?.lost ?? 0,
      peakLandOccupancy: result.peakLandOccupancy ?? 0, reach100: result.reach100?.achieved === true }),
    stateHash: result.hash, trophiesAwarded: Object.freeze([...transaction.trophyIds]),
  });
}
