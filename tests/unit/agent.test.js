/** Fair observation allowlist, exact save validation, and observation-only policies. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAgentEnvironment } from '../../src/agent/environment.js';
import { AGENT_POLICIES, choosePolicyAction } from '../../src/agent/policies.js';
import { EVOLUTION_AGENT_CANDIDATE_LIMIT, OBSERVATION_KEYS, PUBLIC_CELL_KEYS } from '../../src/agent/observation.js';
import { AGENT_SAVE_SCHEMA, defaultAgentSave, exportAgentSave, hashAgentSave, validateAgentSave } from '../../src/agent/schema.js';
import { EVOLUTION_ROOT_CELL } from '../../src/game/skills/index.js';

const sorted = (values) => [...values].sort();

test('fair observation uses explicit nested public allowlists and no hidden authority', () => {
  const observation = createAgentEnvironment().observe();
  assert.deepEqual(sorted(Object.keys(observation)), sorted(OBSERVATION_KEYS));
  assert.equal('campaignSeed' in observation, false); assert.equal('futureSeed' in observation, false);
  assert.equal(observation.availableEvolutionCells.length, 1); assert.equal(observation.evolutionCells.length, 1);
  assert.equal(observation.evolutionSummary.topologyCells, 2562); assert.equal(observation.evolutionSummary.candidateLimit, 224);
  for (const cell of observation.evolutionCells) {
    assert.deepEqual(sorted(Object.keys(cell)), sorted(PUBLIC_CELL_KEYS));
    assert.deepEqual(sorted(Object.keys(cell.gameplay)), ['after', 'before', 'unlocks']);
    assert.deepEqual(sorted(Object.keys(cell.domainDistance)), sorted(['Foundation', 'Fertility', 'Freshwater', 'Scarcity', 'Cryogenic', 'Marine', 'Luminous']));
    assert.equal(cell.domainDistance.Foundation, 0); assert.equal(cell.domainDistance.Luminous > 0, true);
    assert.match(cell.localLevel, /^\d+$/); assert.match(cell.aggregateRank, /^\d+$/); assert.match(cell.nextCost, /^\d+$/);
    assert.equal('predictiveMultiplier' in cell, false); assert.equal('unpublishedState' in cell, false);
  }
  assert.equal(observation.availableEvolutionCells[0].cell, EVOLUTION_ROOT_CELL);
  assert.equal(observation.availableEvolutionCells[0].archetypeId, 'first-division');
  assert.equal(observation.environmentSchedule.idleStartEnvironmentLevel, '0');
  assert.equal(observation.activeWorld, null);
  assert.equal(observation.bestEnvironmentLevelReached, '0');
  rejectPrivateKeys(observation);
});

test('agent save schema validates exact browser subdocuments and hashes canonical state', () => {
  const clean = exportAgentSave(defaultAgentSave(123));
  assert.equal(clean.schema, AGENT_SAVE_SCHEMA); assert.equal(clean.campaignSeed, 123);
  assert.equal(clean.worldOrdinal, '1'); assert.equal(clean.stateHash, hashAgentSave(clean));
  const preserved = validateAgentSave({ ...clean, meta: { ...clean.meta, runs: '2', worldSeedIndex: '2' }, lastResult: {
    resultSchemaVersion: 9, worldOrdinal: '2', startEnvironmentLevel: '0', finalEnvironmentLevel: '2',
    peakEnvironmentLevel: '2', environmentProfileVersion: 4, score: '10', pressure: { profileVersion: 4,
      level: '2', pressure: .5, dimensions: { scarcity: { environmentRating: '2000', pressure: .5 } } },
  } });
  assert.equal(preserved.schema, 7); assert.equal(preserved.meta.runs, '2'); assert.equal(preserved.history.schema, 10);
  assert.equal(preserved.lastResult.pressure.detailAvailable, false);
  assert.deepEqual(preserved.lastResult.pressure.dimensions, {});
  const repaired = validateAgentSave({ ...clean, campaignSeed:-2, goal:'secret-goal',
    worldOrdinal:'999', meta:{ ...clean.meta, echoBalance:'-5' }, history:{ worlds:'bad' } });
  assert.equal(repaired.campaignSeed, 0); assert.equal(repaired.goal, 'balanced');
  assert.equal(repaired.worldOrdinal,'1');assert.equal(repaired.meta.echoBalance,'0');
  const retried=validateAgentSave({...clean,meta:{...clean.meta,runs:'2',worldSeedIndex:'7'}});
  assert.equal(retried.worldOrdinal,'8','agent persistence uses the attempt cursor after retries');
  assert.deepEqual(repaired.history.worlds, []); assert.equal(repaired.history.schema, 10);
});

test('domain policy prioritizes visible direct ecological effects', () => {
  const cell = (index, id, domain, summary) => ({ cell: index, archetypeId: id, name: id, domain, kind: 'specialization',
    localLevel: '0', nextLocalLevel: '1', aggregateRank: '0', nextAggregateRank: '1', nextCost: '10', rootDistance: 2,
    domainDistance: { Foundation: 1, Fertility: 1, Freshwater: 1, Scarcity: domain === 'Scarcity' ? 0 : 2,
      Cryogenic: 2, Marine: 2, Luminous: 2 },
    owned: false, reachable: true, affordable: true, reason: 'ready', summary, gameplay: { after: summary, unlocks: [] } });
  const observation = { metaRevision: '0', availableEvolutionCells: [cell(7, 'generic', 'Fertility', 'reliable budding'),
    cell(9, 'recycling', 'Scarcity', 'recycling delays depletion')] };
  assert.equal(choosePolicyAction(observation, 'scarcity').action.cell, 9);
});

test('specialist policy follows bounded public hop evidence toward its domain', () => {
  const cell = (index, luminousDistance) => ({ cell: index, name: `cell-${index}`, domain: 'Foundation', kind: 'specialization',
    localLevel: '0', aggregateRank: '0', nextLocalLevel: '1', nextAggregateRank: '1', nextCost: '10', rootDistance: 1,
    domainDistance: { Foundation: 0, Fertility: 2, Freshwater: 2, Scarcity: 2, Cryogenic: 2, Marine: 2, Luminous: luminousDistance },
    owned: false, reachable: true, affordable: true, reason: 'ready', summary: 'foundation route', gameplay: { after: '', unlocks: [] } });
  const observation = { metaRevision: '0', availableEvolutionCells: [cell(5, 2), cell(8, 1)] };
  assert.equal(choosePolicyAction(observation, 'luminous').action.cell, 8);
});

test('every deterministic policy chooses a legal fair action deterministically', () => {
  const save=defaultAgentSave(); const observation=createAgentEnvironment({ ...save, meta:{ ...save.meta, echoBalance:'1000' } }).observe();
  for (const policy of AGENT_POLICIES) {
    const copy=JSON.parse(JSON.stringify(observation)); const decision=choosePolicyAction(copy,policy);
    assert.equal(decision.policy,policy); assert.match(decision.rationale,/Established|Strengthened|Started|declined/);
    if(decision.action.type==='buy-evolution-level') assert.ok(observation.availableEvolutionCells.some((cell)=>
      cell.cell===decision.action.cell&&cell.reason==='ready'&&cell.affordable));
    else { assert.equal(decision.action.type, 'run-world'); assert.equal(decision.action.budgetTicks, 10_000); }
    assert.deepEqual(choosePolicyAction(observation,policy),decision);
  }
});

test('mature agent observations remain bounded and use compact archetype representatives', () => {
  const save = defaultAgentSave(); const evolutionLevels = Array.from({ length: 2562 }, (_, cell) => ({ cell, level: '1' }));
  const observation = createAgentEnvironment({ ...save, meta: { ...save.meta, echoBalance: `1${'0'.repeat(100)}`, evolutionLevels } }).observe();
  assert.ok(observation.evolutionCells.length <= EVOLUTION_AGENT_CANDIDATE_LIMIT);
  assert.equal(observation.evolutionCells.length, 42); assert.equal(observation.evolutionSummary.ownedCells, 2562);
  assert.equal(observation.evolutionSummary.candidatesTruncated, true);
});

function rejectPrivateKeys(value,path='observation') {
  if(!value||typeof value!=='object')return;
  for(const [key,child] of Object.entries(value)) {
    assert.doesNotMatch(key,/campaignSeed|futureSeed|futureSchedule|rng|replay|diagnostic|rawState|fieldArray/i,
      `private key at ${path}.${key}`); rejectPrivateKeys(child,`${path}.${key}`);
  }
}
