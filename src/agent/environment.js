/** Production-backed fair campaign environment for autonomous worlds. */
import { RunController } from '../simulation/simulator.js';
import { seedForRun } from '../interface/app-data.js';
import { applyRunResult } from '../interface/policies/run-result.js';
import { appendMemoryEvent, appendTrophyEvents, validateHistory } from '../platform/history.js';
import { validateMeta } from '../platform/storage.js';
import { reconcileTrophies } from '../game/trophies/evaluator.js';
import { compileMemory, getMemoryNode, memoryNodeState, purchaseMemory } from '../game/skills/index.js';
import { buildAgentObservation } from './observation.js';
import { AGENT_GOALS, defaultAgentSave, exportAgentSave, validateAgentSave } from './schema.js';

const GOALS = new Set(AGENT_GOALS); const SEED_LIMIT = 0x40000000; const RETENTION = 32;
const MAX_RUN_TICKS = 10_000;

export function createAgentEnvironment(raw = defaultAgentSave()) {
  let state = validateAgentSave(raw);

  function observe() { return buildAgentObservation(state); }
  function save() { return exportAgentSave(state); }
  function respond(accepted, reason, extra = {}) {
    return Object.freeze({ accepted, reason, observation: observe(), ...extra, hash: save().stateHash });
  }
  function buy(skillId) {
    const node = getMemoryNode(skillId); if (!node) return respond(false, 'unknown-skill');
    const status = memoryNodeState(state.meta, node);
    if (status.owned) return respond(false, 'already-owned');
    if (!status.reachable) return respond(false, 'not-reachable');
    if (!status.affordable) return respond(false, 'insufficient-echoes');
    const purchase = purchaseMemory(state.meta, skillId);
    if (!purchase.ok) return respond(false, 'purchase-rejected');
    const recognition = reconcileTrophies(purchase.meta, state.history);
    let history = appendMemoryEvent(state.history, skillId, purchase.spent,
      recognition.meta.echoBalance, recognition.meta.runs);
    history = appendTrophyEvents(history, recognition.awardedIds);
    state = validateAgentSave({ ...state, meta: validateMeta(recognition.meta),
      history: validateHistory(history, RETENTION) });
    return respond(true, 'skill-purchased', { purchase: Object.freeze({ skillId,
      cost: purchase.spent, trophiesAwarded: recognition.awardedIds }) });
  }
  function runWorld() {
    const meta = state.meta; const memory = compileMemory(meta);
    const seedIndex = Math.max(meta.runs, meta.worldSeedIndex ?? meta.runs);
    const seed = (seedForRun(seedIndex, '') + state.campaignSeed) % SEED_LIMIT;
    const worldOrdinal = meta.runs + 1; const run = new RunController({ seed,
      runId: worldOrdinal, strainId: 'pioneer', worldOrdinal,
      worldPotential: memory.worldPotential, potentialVersion: memory.potentialVersion,
      memoryEffects: memory.effects, memoryConditionals: memory.conditionals,
      memoryUnlocks: memory.unlocks, habitatCapabilities: memory.habitatCapabilities });
    run.start(); let ticks = 0;
    while (run.state.status !== 'extinct' && ticks < MAX_RUN_TICKS) ticks += run.advance(100);
    if (run.state.status !== 'extinct') return respond(false, 'world-did-not-terminate');
    const rawResult = run.buildResult();
    const identified = { ...rawResult,
      resultTransactionKey: `agent:${worldOrdinal}:${seed}:${rawResult.hash}:${rawResult.tick}` };
    const cursorMeta = { ...meta, worldSeedIndex: seedIndex + 1 };
    const transaction = applyRunResult(cursorMeta, state.history, identified, RETENTION,
      new Set(meta.resultKeys ?? []));
    if (!transaction.applied) return respond(false, 'result-already-applied');
    const result = curateResult(identified, transaction);
    state = validateAgentSave({ ...state, meta: transaction.meta,
      history: transaction.archive, lastResult: result });
    return respond(true, 'world-completed', { result: state.lastResult });
  }
  function setGoal(goal) {
    if (!GOALS.has(goal)) return respond(false, 'unknown-goal');
    state = validateAgentSave({ ...state, goal }); return respond(true, 'goal-set');
  }
  function reset(seed) {
    if (!Number.isInteger(seed) || seed < 0 || seed >= SEED_LIMIT) return respond(false, 'invalid-seed');
    state = defaultAgentSave(seed); return respond(true, 'campaign-reset');
  }
  function act(action) {
    if (!action || typeof action !== 'object' || typeof action.type !== 'string')
      return respond(false, 'invalid-action');
    if (action.type === 'observe') return respond(true, 'observed');
    if (action.type === 'buy-skill') return buy(action.skillId);
    if (action.type === 'run-world') return runWorld();
    if (action.type === 'set-goal') return setGoal(action.goal);
    if (action.type === 'reset') return reset(action.seed);
    return respond(false, 'unknown-action');
  }
  return Object.freeze({ observe, act, exportSave: save });
}

function curateResult(result, transaction) {
  const habitats = result.habitatOccupancy ?? [];
  return Object.freeze({ worldOrdinal: result.worldOrdinal, seed: result.seed,
    archetype: result.archetype, survivalSeconds: result.survivalSeconds,
    cause: result.cause, terminalCause: result.terminalCause,
    score: transaction.score.total, scoreModelVersion: transaction.score.modelVersion,
    rank: transaction.score.rank.en, echoes: transaction.score.echoes,
    worldPotential: result.worldPotential, peakReach: result.peakCoverage,
    sustainedReach: result.sustainedCoverage, peakConnectedShare: result.peakConnectedShare,
    crises: Object.freeze({ endured: result.crisesEndured, total: result.crisesTotal }),
    resources: Object.freeze({ initial: result.resourceInitial, final: result.resourceFinal,
      depletedCells: result.resourceDepletedCells }),
    habitats: Object.freeze({ lake: habitats[0] ?? 0, tundra: habitats[1] ?? 0,
      snowIce: habitats[2] ?? 0, shallowOcean: habitats[3] ?? 0, deepOcean: habitats[4] ?? 0 }),
    reach: Object.freeze({ gained: result.reach?.gained ?? 0, lost: result.reach?.lost ?? 0 }),
    stateHash: result.hash, trophiesAwarded: Object.freeze([...transaction.trophyIds]),
  });
}
