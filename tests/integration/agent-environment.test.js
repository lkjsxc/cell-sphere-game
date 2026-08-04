/** Production RunController campaign actions, exactly-once result, and replay. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAgentEnvironment } from '../../src/agent/environment.js';
import { defaultAgentSave } from '../../src/agent/schema.js';

const RESULT_KEYS = ['archetype', 'cause', 'crises', 'echoes', 'habitats', 'peakConnectedShare',
  'peakReach', 'rank', 'reach', 'resources', 'score', 'scoreModelVersion', 'seed', 'stateHash',
  'survivalSeconds', 'sustainedReach', 'terminalCause', 'trophiesAwarded', 'worldOrdinal', 'worldPotential'];

test('all action shapes use production transactions and completed result applies once', { timeout: 30_000 }, () => {
  const env = createAgentEnvironment(defaultAgentSave(77));
  assert.equal(env.act({ type: 'observe' }).accepted, true);
  assert.equal(env.act({ type: 'wat' }).reason, 'unknown-action');
  assert.equal(env.act({ type: 'buy-skill', skillId: 'not-a-skill' }).reason, 'unknown-skill');
  assert.equal(env.act({ type: 'buy-skill', skillId: env.observe().availableSkills[0].id }).reason,
    'insufficient-echoes');
  assert.equal(env.act({ type: 'set-goal', goal: 'not-public' }).reason, 'unknown-goal');
  assert.equal(env.act({ type: 'set-goal', goal: 'freshwater' }).accepted, true);
  const completed = env.act({ type: 'run-world' });
  assert.equal(completed.accepted, true); assert.equal(completed.reason, 'world-completed');
  assert.deepEqual(Object.keys(completed.result).sort(), RESULT_KEYS.slice().sort());
  assert.ok(completed.result.score > 0); assert.ok(completed.result.stateHash);
  const after = env.exportSave(); assert.equal(after.meta.runs, 1); assert.equal(after.worldOrdinal, 2);
  assert.equal(after.history.worlds.length, 1); assert.equal(after.meta.resultKeys.length, 1);
  assert.equal(after.meta.totalEchoes, completed.result.echoes);
  assert.equal(after.history.worlds[0].score, completed.result.score);
  const option = env.observe().availableSkills.find((skill) => skill.affordable);
  assert.ok(option, 'first result should finance a reachable Skill');
  const bought = env.act({ type: 'buy-skill', skillId: option.id });
  assert.equal(bought.accepted, true); assert.equal(env.exportSave().history.memory.length, 1);
  assert.equal(env.act({ type: 'buy-skill', skillId: option.id }).reason, 'already-owned');
  assert.equal(env.act({ type: 'reset', seed: -1 }).reason, 'invalid-seed');
  assert.equal(env.act({ type: 'reset', seed: 77 }).accepted, true);
  assert.equal(env.exportSave().meta.runs, 0); assert.equal(env.observe().lastResult, null);
});

test('same reset seed and fair actions replay to identical result and campaign hashes', { timeout: 30_000 }, () => {
  const a = createAgentEnvironment(); const b = createAgentEnvironment();
  for (const env of [a, b]) {
    assert.equal(env.act({ type: 'reset', seed: 991 }).accepted, true);
    assert.equal(env.act({ type: 'set-goal', goal: 'balanced' }).accepted, true);
  }
  const first = a.act({ type: 'run-world' }); const second = b.act({ type: 'run-world' });
  assert.equal(first.accepted, true); assert.equal(second.accepted, true);
  assert.deepEqual(second.result, first.result); assert.equal(second.hash, first.hash);
  assert.deepEqual(b.exportSave(), a.exportSave());
  assert.equal(a.exportSave().meta.resultKeys.length, 1);
  assert.equal(a.exportSave().history.worlds.length, 1);
  assert.equal(JSON.stringify(first).includes('replay'), false);
  assert.equal(JSON.stringify(first).includes('diagnostics'), false);
});
