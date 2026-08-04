/** Fair observation allowlist, save validation, and observation-only policies. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAgentEnvironment } from '../../src/agent/environment.js';
import { AGENT_POLICIES, choosePolicyAction } from '../../src/agent/policies.js';
import { OBSERVATION_KEYS, PUBLIC_SKILL_KEYS } from '../../src/agent/observation.js';
import { defaultAgentSave, exportAgentSave, hashAgentSave, validateAgentSave } from '../../src/agent/schema.js';

const sorted = (values) => [...values].sort();

test('fair observation uses an explicit public allowlist', () => {
  const observation = createAgentEnvironment().observe();
  assert.deepEqual(sorted(Object.keys(observation)), sorted(OBSERVATION_KEYS));
  assert.equal('campaignSeed' in observation, false); assert.equal('futureSeed' in observation, false);
  assert.equal(observation.availableSkills.length, 6);
  for (const skill of [...observation.ownedSkills, ...observation.availableSkills]) {
    assert.deepEqual(sorted(Object.keys(skill)), sorted(PUBLIC_SKILL_KEYS));
    assert.deepEqual(sorted(Object.keys(skill.gameplay)), ['after', 'before', 'summary', 'unlocks']);
    assert.deepEqual(sorted(Object.keys(skill.evolutionPower)), ['after', 'before', 'delta']);
    assert.deepEqual(sorted(Object.keys(skill.worldPotential)), ['after', 'before', 'delta']);
  }
  assert.ok(observation.availableSkills.some((skill) => skill.buildProgress.some((build) => build.progress > 0)));
  rejectPrivateKeys(observation);
});

test('agent save schema validates browser subdocuments and hashes canonical state', () => {
  const clean = exportAgentSave(defaultAgentSave(123));
  assert.equal(clean.schema, 1); assert.equal(clean.campaignSeed, 123);
  assert.equal(clean.worldOrdinal, 1); assert.equal(clean.stateHash, hashAgentSave(clean));
  const repaired = validateAgentSave({ ...clean, campaignSeed: -2, goal: 'secret-goal',
    worldOrdinal: 999, meta: { ...clean.meta, echoBalance: -5 }, history: { worlds: 'bad' } });
  assert.equal(repaired.campaignSeed, 0); assert.equal(repaired.goal, 'balanced');
  assert.equal(repaired.worldOrdinal, 1); assert.equal(repaired.meta.echoBalance, 0);
  assert.deepEqual(repaired.history.worlds, []);
});

test('build-goal policy prioritizes visible recipe progress', () => {
  const skill = (id, affinity, buildProgress=[]) => ({ id, name:id, affinity, tags:[], kind:'root', cost:10,
    reachable:true, affordable:true, gameplay:{ summary:'effect', unlocks:[] }, buildProgress });
  const observation = { availableSkills: [skill('generic','Scarcity'), skill('recipe','Fertility',[
    { id:'wasteland-reclaimer', progress:.75, active:false }])] };
  assert.equal(choosePolicyAction(observation,'scarcity').action.skillId,'recipe');
});

test('every deterministic policy chooses a legal action from observation only', () => {
  const observation = createAgentEnvironment({ ...defaultAgentSave(), meta: {
    ...defaultAgentSave().meta, echoBalance: 1000 } }).observe();
  for (const policy of AGENT_POLICIES) {
    const decision = choosePolicyAction(JSON.parse(JSON.stringify(observation)), policy);
    assert.equal(decision.policy, policy); assert.match(decision.rationale, /Bought|Ran/);
    assert.equal(decision.action.type, 'buy-skill');
    assert.ok(observation.availableSkills.some((skill) => skill.id === decision.action.skillId
      && skill.reachable && skill.affordable));
    assert.deepEqual(choosePolicyAction(observation, policy), decision);
  }
});

function rejectPrivateKeys(value, path = 'observation') {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    assert.doesNotMatch(key, /campaignSeed|future|schedule|rng|replay|diagnostic|raw|fieldArray/i,
      `private key at ${path}.${key}`);
    rejectPrivateKeys(child, `${path}.${key}`);
  }
}
