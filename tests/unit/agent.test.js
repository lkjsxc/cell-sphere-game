/** Fair observation allowlist, exact save validation, and observation-only policies. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAgentEnvironment } from '../../src/agent/environment.js';
import { AGENT_POLICIES, choosePolicyAction } from '../../src/agent/policies.js';
import { OBSERVATION_KEYS, PUBLIC_CELL_KEYS } from '../../src/agent/observation.js';
import { AGENT_SAVE_SCHEMA, defaultAgentSave, exportAgentSave, hashAgentSave, validateAgentSave } from '../../src/agent/schema.js';

const sorted = (values) => [...values].sort();

test('fair observation uses explicit nested public allowlists and no hidden authority', () => {
  const observation = createAgentEnvironment().observe();
  assert.deepEqual(sorted(Object.keys(observation)), sorted(OBSERVATION_KEYS));
  assert.equal('campaignSeed' in observation, false); assert.equal('futureSeed' in observation, false);
  assert.equal(observation.availableEvolutionCells.length, 1); assert.equal(observation.evolutionCells.length, 42);
  for (const cell of observation.evolutionCells) {
    assert.deepEqual(sorted(Object.keys(cell)), sorted(PUBLIC_CELL_KEYS));
    assert.deepEqual(sorted(Object.keys(cell.gameplay)), ['after', 'before', 'unlocks']);
    assert.match(cell.currentLevel, /^\d+$/); assert.match(cell.nextCost, /^\d+$/);
    assert.equal('predictiveMultiplier' in cell, false); assert.equal('unpublishedState' in cell, false);
  }
  assert.equal(observation.availableEvolutionCells[0].id, 'first-division');
  assert.equal(observation.environmentSchedule.idleStartEnvironmentLevel, '0');
  assert.equal(observation.activeWorld, null);
  assert.equal(observation.bestEnvironmentLevelReached, '0');
  rejectPrivateKeys(observation);
});

test('agent save schema validates exact browser subdocuments and hashes canonical state', () => {
  const clean = exportAgentSave(defaultAgentSave(123));
  assert.equal(clean.schema, AGENT_SAVE_SCHEMA); assert.equal(clean.campaignSeed, 123);
  assert.equal(clean.worldOrdinal, '1'); assert.equal(clean.stateHash, hashAgentSave(clean));
  const migrated = validateAgentSave({ ...clean, schema: 3 });
  assert.equal(migrated.schema, 6); assert.equal(migrated.meta.schema, 15); assert.equal(migrated.history.schema, 10);
  const repaired = validateAgentSave({ ...clean, campaignSeed:-2, goal:'secret-goal',
    worldOrdinal:'999', meta:{ ...clean.meta, echoBalance:'-5' }, history:{ worlds:'bad' } });
  assert.equal(repaired.campaignSeed, 0); assert.equal(repaired.goal, 'balanced');
  assert.equal(repaired.worldOrdinal,'1');assert.equal(repaired.meta.echoBalance,'0');
  const retried=validateAgentSave({...clean,meta:{...clean.meta,runs:'2',worldSeedIndex:'7'}});
  assert.equal(retried.worldOrdinal,'8','agent persistence uses the attempt cursor after retries');
  assert.deepEqual(repaired.history.worlds, []); assert.equal(repaired.history.schema, 10);
});

test('domain policy prioritizes visible direct ecological effects', () => {
  const cell = (id, domain, summary) => ({ id, name: id, domain, kind: 'specialization', currentLevel: '0', nextLevel: '1', nextCost: '10',
    owned: false, reachable: true, affordable: true, reason: 'ready', summary, gameplay: { after: summary, unlocks: [] } });
  const observation = { metaRevision: '0', availableEvolutionCells: [cell('generic', 'Fertility', 'reliable budding'), cell('recycling', 'Scarcity', 'recycling delays depletion')] };
  assert.equal(choosePolicyAction(observation, 'scarcity').action.cellId, 'recycling');
});

test('every deterministic policy chooses a legal fair action deterministically', () => {
  const save=defaultAgentSave(); const observation=createAgentEnvironment({ ...save, meta:{ ...save.meta, echoBalance:'1000' } }).observe();
  for (const policy of AGENT_POLICIES) {
    const copy=JSON.parse(JSON.stringify(observation)); const decision=choosePolicyAction(copy,policy);
    assert.equal(decision.policy,policy); assert.match(decision.rationale,/Unlocked|Upgraded|Started|declined/);
    if(decision.action.type==='buy-evolution-level') assert.ok(observation.availableEvolutionCells.some((cell)=>
      cell.id===decision.action.cellId&&cell.reason==='ready'&&cell.affordable));
    else { assert.equal(decision.action.type, 'run-world'); assert.equal(decision.action.budgetTicks, 10_000); }
    assert.deepEqual(choosePolicyAction(observation,policy),decision);
  }
});

function rejectPrivateKeys(value,path='observation') {
  if(!value||typeof value!=='object')return;
  for(const [key,child] of Object.entries(value)) {
    assert.doesNotMatch(key,/campaignSeed|futureSeed|futureSchedule|rng|replay|diagnostic|rawState|fieldArray/i,
      `private key at ${path}.${key}`); rejectPrivateKeys(child,`${path}.${key}`);
  }
}
