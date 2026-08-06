/** Production-backed fair campaign environment for autonomous worlds. */
import { RunController } from '../simulation/simulator.js';
import { compileChallengeProfile } from '../simulation/challenge-profile.js';
import { applyRunResult } from '../interface/policies/run-result.js';
import { appendEvolutionEvent, appendTrophyEvents, validateHistory } from '../platform/history.js';
import { validateMeta } from '../platform/storage.js';
import { reconcileTrophies } from '../game/trophies/evaluator.js';
import { compileEvolution, evolutionCellState, getMemoryNode, purchaseEvolutionLevel } from '../game/skills/index.js';
import { resolveEnvironmentAttempt } from '../game/environment-level.js';
import {incrementProgressionInteger,isCanonicalProgressionInteger,maxProgressionInteger,
  normalizeProgressionInteger} from '../core/progression-integer.js';
import {boundedTransactionKey,hashStringU32} from '../core/hash.js';
import { buildAgentObservation } from './observation.js';
import { AGENT_GOALS, defaultAgentSave, exportAgentSave, validateAgentSave } from './schema.js';

const GOALS = new Set(AGENT_GOALS); const SEED_LIMIT = 0x40000000; const RETENTION = 32;
const MAX_RUN_TICKS = 10_000;

export function createAgentEnvironment(raw = defaultAgentSave()) {
  let state = validateAgentSave(raw);

  function observe() { return buildAgentObservation(state); }
  function save() { return exportAgentSave(state); }
  function respond(accepted, reason, extra = {}) {
    return Object.freeze({ accepted, reason, observation:observe(), ...extra, hash:save().stateHash });
  }
  function buy(action) {
    const cellId = action.cellId ?? action.skillId; const node = getMemoryNode(cellId);
    if (!node) return respond(false, 'unknown-cell');
    if(!isCanonicalProgressionInteger(action.expectedLevel)||!isCanonicalProgressionInteger(action.expectedRevision))
      return respond(false,'missing-precondition');
    const status=evolutionCellState(state.meta,node);
    if(!status.reachable)return respond(false,'adjacency-required');
    if(!status.affordable)return respond(false,'insufficient-echoes');
    if(action.transactionKey!==undefined&&!(typeof action.transactionKey==='string'&&action.transactionKey.length>0&&action.transactionKey.length<=128))
      return respond(false,'invalid-transaction-key');
    const transactionKey=action.transactionKey??agentEvolutionTransactionKey(action.expectedRevision,cellId,action.expectedLevel,status.nextLevel);
    const purchase=purchaseEvolutionLevel(state.meta,cellId,{transactionKey,
      expectedLevel:action.expectedLevel,expectedRevision:action.expectedRevision});
    if (!purchase.ok) return respond(false, purchase.reason);
    const recognition = reconcileTrophies(purchase.meta, state.history);
    let history = appendEvolutionEvent(state.history, { transactionKey, nodeId:cellId,
      oldLevel:purchase.oldLevel, newLevel:purchase.newLevel, cost:purchase.cost,
      balanceBefore:purchase.balanceBefore, balanceAfter:purchase.balanceAfter,
      run:recognition.meta.runs, environmentLevel:recognition.meta.highestEnvironmentLevel,
      compilerVersions:purchase.compilerVersions });
    history = appendTrophyEvents(history, recognition.awardedIds);
    state = validateAgentSave({ ...state, meta:validateMeta(recognition.meta),
      history:validateHistory(history, RETENTION) });
    return respond(true, 'evolution-level-purchased', { purchase:Object.freeze({ cellId,
      oldLevel:purchase.oldLevel, newLevel:purchase.newLevel, cost:purchase.cost,
      balanceAfter:purchase.balanceAfter, transactionKey, trophiesAwarded:recognition.awardedIds }) });
  }
  function runWorld(action={}){
    const meta=state.meta;
    if(!isCanonicalProgressionInteger(action.expectedRevision)||!isCanonicalProgressionInteger(action.expectedWorldOrdinal))
      return respond(false,'missing-precondition');
    const expectedOrdinal=incrementProgressionInteger(maxProgressionInteger(meta.runs,meta.worldSeedIndex));
    if(action.expectedRevision!==meta.revision||action.expectedWorldOrdinal!==expectedOrdinal)return respond(false,'stale-run-precondition');
    const evolution=compileEvolution(meta);
    const attempt = resolveEnvironmentAttempt(meta, { mode:action.mode ?? 'recommended',
      environmentLevel:action.environmentLevel, lastResult:state.lastResult });
    if (!attempt.ok) return respond(false, attempt.reason);
    const seedIndex=maxProgressionInteger(meta.runs,meta.worldSeedIndex);
    const seed=hashStringU32(`agent-world-v2|${state.campaignSeed}|${seedIndex}`)%SEED_LIMIT;
    const worldOrdinal=incrementProgressionInteger(seedIndex);
    const challengeProfile = compileChallengeProfile({ environmentLevel:attempt.environmentLevel, evolution });
    const run = new RunController({ seed, runId:1, strainId:'pioneer', worldOrdinal,
      environmentLevel:attempt.environmentLevel, challengeProfile,
      worldPotential:evolution.worldPotential, evolutionPower:evolution.evolutionPower,
      evolutionDepth:evolution.evolutionDepth, potentialVersion:evolution.potentialVersion,
      memoryEffects:evolution.effects, memoryConditionals:evolution.conditionals,
      memoryUnlocks:evolution.unlocks, habitatCapabilities:evolution.habitatCapabilities,
      activeBuilds:evolution.activeBuilds, buildEffects:evolution.buildEffects,
      electricityMastery:evolution.electricityMastery });
    run.start(); let ticks = 0;
    while (run.state.status !== 'extinct' && ticks < MAX_RUN_TICKS) ticks += run.advance(100);
    if (run.state.status !== 'extinct') return respond(false, 'world-did-not-terminate');
    const rawResult = run.buildResult();
    const identified={...rawResult,resultTransactionKey:agentResultTransactionKey(worldOrdinal,seed,
      attempt.environmentLevel,challengeProfile.hash,rawResult.hash,rawResult.tick)};
    const cursorMeta = { ...meta, worldSeedIndex:incrementProgressionInteger(seedIndex),
      revision:incrementProgressionInteger(meta.revision) };
    const transaction = applyRunResult(cursorMeta, state.history, identified, RETENTION,
      new Set(meta.resultKeys ?? []));
    if (!transaction.applied) return respond(false, 'result-already-applied');
    const result = curateResult(identified, transaction);
    state = validateAgentSave({ ...state, meta:transaction.meta,
      history:transaction.archive, lastResult:result });
    return respond(true, 'world-completed', { result:state.lastResult });
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
    if (!action || typeof action !== 'object' || typeof action.type !== 'string') return respond(false, 'invalid-action');
    if (action.type === 'observe') return respond(true, 'observed');
    if (action.type === 'buy-evolution-level' || action.type === 'buy-skill') return buy(action);
    if (action.type === 'run-world') return runWorld(action);
    if (action.type === 'retry-environment-level') return runWorld({ ...action, mode:'retry' });
    if (action.type === 'inspect-last-result') return respond(true, 'last-result-inspected', { result:state.lastResult });
    if (action.type === 'inspect-builds') return respond(true, 'builds-inspected', {
      builds:Object.freeze({ active:observe().activeBuilds, near:observe().nearBuilds }) });
    if (action.type === 'export') return respond(true, 'save-exported', { save:save() });
    if (action.type === 'set-goal') return setGoal(action.goal);
    if (action.type === 'reset') return reset(action.seed);
    return respond(false, 'unknown-action');
  }
  return Object.freeze({ observe, act, exportSave:save });
}

function agentResultTransactionKey(worldOrdinal,seed,environmentLevel,profileHash,resultHash,tick){
 return boundedTransactionKey('agent-result',[worldOrdinal,seed,environmentLevel,profileHash,resultHash,tick])}
function agentEvolutionTransactionKey(revision,id,currentLevel,nextLevel){
 return boundedTransactionKey('agent-evolution',[revision,id,currentLevel,nextLevel])}
function curateResult(result, transaction) {
  const habitats = result.habitatOccupancy ?? [];
  return Object.freeze({ worldOrdinal:result.worldOrdinal, environmentLevel:result.environmentLevel,
    highestEnvironmentLevel:transaction.meta.highestEnvironmentLevel,archetype:result.archetype, survivalSeconds:result.survivalSeconds,
    cause:result.cause, terminalCause:result.terminalCause,
    score:transaction.score.total, scoreModelVersion:transaction.score.modelVersion,
    rank:transaction.score.rank.en, echoes:transaction.score.echoes,
    worldPotential:result.worldPotential, pressure:publicPressure(result.pressureProfile),
    peakReach:result.peakCoverage, sustainedReach:result.sustainedCoverage,
    peakConnectedShare:result.peakConnectedShare,
    crises:Object.freeze({ endured:result.crisesEndured, total:result.crisesTotal }),
    resources:Object.freeze({ initial:result.resourceInitial, final:result.resourceFinal,
      depletedCells:result.resourceDepletedCells, recoveredCells:result.resourceRecoveredCells,
      freshwaterSupportedCellSeconds:result.freshwaterSupportedCellSeconds,
      livingTicksByQuintile:Object.freeze([...(result.resourceLivingTicksByQuintile ?? [])]) }),
    habitats:Object.freeze({ lake:habitats[13] ?? 0, tundra:habitats[11] ?? 0,
      snowIce:habitats[12] ?? 0, shallowOcean:habitats[1] ?? 0, deepOcean:habitats[0] ?? 0 }),
    builds:Object.freeze([...(result.activeBuilds ?? [])]),
    worldmaking:Object.freeze({ transformedCells:result.transformedCells ?? 0,
      glacialLakeCells:result.glacialLakeCells ?? 0, maritimeForestCells:result.maritimeForestCells ?? 0,
      electrifiedCells:result.electrifiedCells ?? 0, finalElectrifiedCells:result.finalElectrifiedCells ?? 0,
      everPoweredCells:result.everPoweredCells ?? 0, poweredCellSeconds:result.poweredCellSeconds ?? 0 }),
    reach:Object.freeze({ gained:result.reach?.gained ?? 0, lost:result.reach?.lost ?? 0,
      peakLandOccupancy:result.peakLandOccupancy ?? 0, reach100:result.reach100?.achieved === true }),
    stateHash:result.hash, trophiesAwarded:Object.freeze([...transaction.trophyIds]),
  });
}
function publicPressure(profile) { if (!profile) return null;
  return Object.freeze({ version:profile.version, hash:profile.hash,
    dimensions:Object.freeze(Object.fromEntries(Object.entries(profile.dimensions).map(([key, value]) => [key,
      Object.freeze({ environmentRating:value.environmentRating, defenseRating:value.defenseRating, pressure:value.pressure })]))) }); }
