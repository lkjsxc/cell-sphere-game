/** Production fair-agent actions use the same Level-0 world authority. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAgentEnvironment } from '../../src/agent/environment.js';
import { defaultAgentSave } from '../../src/agent/schema.js';

const REQUIRED_RESULT_KEYS = ['archetype', 'bestEnvironmentLevelReached', 'builds', 'cause', 'echoes',
  'environmentExposure', 'environmentProfileVersion', 'finalEnvironmentLevel', 'peakEnvironmentLevel',
  'pressure', 'rank', 'resources', 'resultSchemaVersion', 'score', 'scoreModelVersion', 'startEnvironmentLevel', 'stateHash', 'survivalSeconds', 'terminalCause',
  'timeAtPeakTicks', 'trophiesAwarded', 'worldOrdinal', 'worldPotential', 'worldmaking'];

test('all fair action shapes use production exact transactions and Level-0 authority', { timeout: 30_000 }, () => {
  const env = createAgentEnvironment(defaultAgentSave(77));
  assert.equal(env.act({ type: 'observe' }).accepted, true);
  assert.equal(env.act({ type: 'wat' }).reason, 'unknown-action');
  assert.equal(env.act({ type: 'buy-evolution-level', cellId: 'not-a-cell' }).reason, 'unknown-cell');
  const initial = env.observe();
  assert.equal(env.act({ type: 'buy-skill', skillId: initial.availableEvolutionCells[0].id, expectedLevel: '0',
    expectedRevision: initial.metaRevision }).reason, 'insufficient-echoes');
  assert.equal(env.act({ type: 'set-goal', goal: 'not-public' }).reason, 'unknown-goal');
  assert.equal(env.act({ type: 'set-goal', goal: 'freshwater' }).accepted, true);
  const completed = run(env);
  assert.equal(completed.accepted, true); assert.equal(completed.reason, 'world-completed');
  for (const key of REQUIRED_RESULT_KEYS) assert.ok(key in completed.result, key);
  assert.ok(BigInt(completed.result.score) > 0n);
  assert.equal(completed.result.startEnvironmentLevel, '0');
  assert.equal(completed.result.resultSchemaVersion, 8); assert.equal(completed.result.environmentProfileVersion, 4);
  assert.equal('eventDirectorVersion' in completed.result, false);
  assert.ok(BigInt(completed.result.peakEnvironmentLevel) >= 1n); assert.ok(completed.result.stateHash);
  const after = env.exportSave(); assert.equal(after.meta.runs, '1'); assert.equal(after.worldOrdinal, '2');
  assert.equal(after.history.worlds.length, 1); assert.equal(after.meta.resultKeys.length, 1);
  assert.equal(after.meta.totalEchoes, completed.result.echoes); assert.equal(after.history.worlds[0].score, completed.result.score);
  const option = env.observe().availableEvolutionCells.find((cell) => cell.affordable);
  assert.ok(option, 'first result should finance a reachable cell');
  const bought = env.act({ type: 'buy-evolution-level', cellId: option.id, expectedLevel: option.currentLevel,
    expectedRevision: env.observe().metaRevision });
  assert.equal(bought.accepted, true); assert.equal(bought.reason, 'evolution-level-purchased');
  assert.equal(env.exportSave().history.evolution.length, 1); assert.equal(bought.purchase.newLevel, '1');
  const repeat = env.act({ type: 'buy-evolution-level', cellId: option.id });
  assert.equal(repeat.reason, 'missing-precondition'); assert.equal(env.exportSave().history.evolution.length, 1);
  assert.equal(env.act({ type: 'inspect-last-result' }).accepted, true); assert.equal(env.act({ type: 'inspect-builds' }).accepted, true);
  assert.equal(env.act({ type: 'export' }).save.schema, 5);
  assert.equal(env.act({ type: 'reset', seed: -1 }).reason, 'invalid-seed'); assert.equal(env.act({ type: 'reset', seed: 77 }).accepted, true);
  assert.equal(env.exportSave().meta.runs, '0'); assert.equal(env.observe().lastResult, null);
});

test('agents cannot select/retry static levels and external budget exhaustion is incomplete and reward-free', { timeout: 30_000 }, () => {
  const env = createAgentEnvironment(defaultAgentSave(404)); const observation = env.observe();
  assert.equal(env.act({ type: 'select-environment-level', expectedRevision: observation.metaRevision,
    expectedWorldOrdinal: observation.worldOrdinal, environmentLevel: '2' }).reason, 'static-environment-actions-retired');
  const started = env.act({ type: 'start-world', expectedRevision: observation.metaRevision,
    expectedWorldOrdinal: observation.worldOrdinal });
  assert.equal(started.reason, 'world-started'); assert.equal(started.observation.schema, 5);
  assert.equal(started.observation.activeWorld.currentEnvironmentLevel, '0');
  const pressure = started.observation.activeWorld.environmentPressureSummary;
  assert.equal(pressure.level, '0'); assert.equal(pressure.nextLevel, '1'); assert.equal(pressure.interpolationQ, 0);
  assert.ok(Number.isFinite(pressure.effectiveCoefficients.renewalScale)); assert.equal('events' in pressure.dimensions, false);
  const incomplete = env.act({ type: 'continue-world', budgetTicks: 1 });
  assert.equal(incomplete.accepted, true); assert.equal(incomplete.reason, 'incomplete-budget');
  assert.equal(env.exportSave().meta.runs, '0'); assert.equal(env.exportSave().meta.echoBalance, '0');
  const terminal = env.act({ type: 'continue-world', budgetTicks: 10_000 });
  assert.equal(terminal.reason, 'world-completed'); assert.equal(terminal.result.startEnvironmentLevel, '0');
  assert.ok(BigInt(terminal.result.peakEnvironmentLevel) >= 1n);
  assert.equal(env.observe().bestEnvironmentLevelReached, terminal.result.peakEnvironmentLevel);
  assert.equal(env.act({ type: 'retry-environment-level' }).reason, 'static-environment-actions-retired');
});

test('same reset seed and fair actions replay to identical result and campaign hashes', { timeout: 30_000 }, () => {
  const a = createAgentEnvironment(); const b = createAgentEnvironment();
  for (const env of [a, b]) {
    assert.equal(env.act({ type: 'reset', seed: 991 }).accepted, true);
    assert.equal(env.act({ type: 'set-goal', goal: 'balanced' }).accepted, true);
  }
  const first = run(a); const second = run(b); assert.equal(first.accepted, true); assert.equal(second.accepted, true);
  assert.deepEqual(second.result, first.result); assert.equal(second.hash, first.hash); assert.deepEqual(b.exportSave(), a.exportSave());
  assert.equal(a.exportSave().meta.resultKeys.length, 1); assert.equal(a.exportSave().history.worlds.length, 1);
  assert.equal(JSON.stringify(first).includes('replay'), false); assert.equal(JSON.stringify(first).includes('diagnostics'), false);
});
function run(env, extra = {}) { const observation = env.observe(); return env.act({ type: 'run-world',
  expectedRevision: observation.metaRevision, expectedWorldOrdinal: observation.worldOrdinal, budgetTicks: 10_000, ...extra }); }
