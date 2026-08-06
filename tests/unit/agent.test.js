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
  assert.equal(observation.availableEvolutionCells.length, 6); assert.equal(observation.evolutionCells.length, 252);
  for (const cell of observation.evolutionCells) {
    assert.deepEqual(sorted(Object.keys(cell)), sorted(PUBLIC_CELL_KEYS));
    assert.deepEqual(sorted(Object.keys(cell.gameplay)), ['after', 'before', 'summary', 'unlocks']);
    assert.deepEqual(sorted(Object.keys(cell.evolutionPower)), ['after', 'before', 'delta']);
    assert.deepEqual(sorted(Object.keys(cell.worldPotential)), ['after', 'before', 'delta']);
    assert.match(cell.currentLevel, /^\d+$/); assert.match(cell.nextCost, /^\d+$/);
  }
  assert.ok(observation.availableEvolutionCells.some((cell) => cell.buildProgress.some((build) => build.progress > 0)));
  assert.equal(Object.keys(observation.nextWorldPressure.dimensions).length, 6);
  rejectPrivateKeys(observation);
});

test('agent save schema validates exact browser subdocuments and hashes canonical state', () => {
  const clean = exportAgentSave(defaultAgentSave(123));
  assert.equal(clean.schema, AGENT_SAVE_SCHEMA); assert.equal(clean.campaignSeed, 123);
  assert.equal(clean.worldOrdinal, '1'); assert.equal(clean.stateHash, hashAgentSave(clean));
  const repaired = validateAgentSave({ ...clean, campaignSeed:-2, goal:'secret-goal',
    worldOrdinal:'999', meta:{ ...clean.meta, echoBalance:'-5' }, history:{ worlds:'bad' } });
  assert.equal(repaired.campaignSeed, 0); assert.equal(repaired.goal, 'balanced');
  assert.equal(repaired.worldOrdinal,'1');assert.equal(repaired.meta.echoBalance,'0');
  const retried=validateAgentSave({...clean,meta:{...clean.meta,runs:'2',worldSeedIndex:'7'}});
  assert.equal(retried.worldOrdinal,'8','agent persistence uses the attempt cursor after retries');
  assert.deepEqual(repaired.history.worlds, []); assert.equal(repaired.history.schema, 6);
});

test('build-goal policy prioritizes visible recipe progress', () => {
  const cell = (id, affinity, buildProgress=[]) => ({ id, name:id, affinity, tags:[], kind:'root',
    currentLevel:'0', nextLevel:'1', nextCost:'10', owned:false, reachable:true, affordable:true, reason:'ready',
    gameplay:{ summary:'effect', unlocks:[] }, worldPotential:{ delta:'3000' }, buildProgress });
  const observation = { metaRevision:'0', availableEvolutionCells:[cell('generic','Scarcity'), cell('recipe','Fertility',[
    { id:'wasteland-reclaimer', progress:.75, active:false }])] };
  assert.equal(choosePolicyAction(observation,'scarcity').action.cellId,'recipe');
});

test('every deterministic policy chooses a legal fair action deterministically', () => {
  const save=defaultAgentSave(); const observation=createAgentEnvironment({ ...save, meta:{ ...save.meta, echoBalance:'1000' } }).observe();
  for (const policy of AGENT_POLICIES) {
    const copy=JSON.parse(JSON.stringify(observation)); const decision=choosePolicyAction(copy,policy);
    assert.equal(decision.policy,policy); assert.match(decision.rationale,/Unlocked|Upgraded|Ran|declined|Retried/);
    if(decision.action.type==='buy-evolution-level') assert.ok(observation.availableEvolutionCells.some((cell)=>
      cell.id===decision.action.cellId&&cell.reason==='ready'&&cell.affordable));
    else assert.ok(['run-world','retry-environment-level'].includes(decision.action.type));
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
