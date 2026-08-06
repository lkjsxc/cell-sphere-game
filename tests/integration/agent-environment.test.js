/** Production campaign actions, exact level transactions, frontier, and replay. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAgentEnvironment } from '../../src/agent/environment.js';
import { defaultAgentSave } from '../../src/agent/schema.js';

const RESULT_KEYS=['archetype','builds','cause','crises','echoes','environmentLevel','habitats','highestEnvironmentLevel',
  'peakConnectedShare','peakReach','pressure','rank','reach','resources','score','scoreModelVersion','stateHash',
  'survivalSeconds','sustainedReach','terminalCause','trophiesAwarded','worldOrdinal','worldPotential','worldmaking'];

test('all fair action shapes use production exact transactions and frontier authority', {timeout:30_000},()=>{
 const env=createAgentEnvironment(defaultAgentSave(77));
 assert.equal(env.act({type:'observe'}).accepted,true);assert.equal(env.act({type:'wat'}).reason,'unknown-action');
 assert.equal(env.act({type:'buy-evolution-level',cellId:'not-a-cell'}).reason,'unknown-cell');
 const initial=env.observe();assert.equal(env.act({type:'buy-skill',skillId:initial.availableEvolutionCells[0].id,expectedLevel:'0',
  expectedRevision:initial.metaRevision}).reason,'insufficient-echoes');
 assert.equal(env.act({type:'set-goal',goal:'not-public'}).reason,'unknown-goal');
 assert.equal(env.act({type:'set-goal',goal:'freshwater'}).accepted,true);
 const completed=run(env);assert.equal(completed.accepted,true);assert.equal(completed.reason,'world-completed');
 assert.deepEqual(Object.keys(completed.result).sort(),RESULT_KEYS.slice().sort());assert.ok(BigInt(completed.result.score)>0n);
 assert.equal(completed.result.environmentLevel,'0');assert.ok(completed.result.stateHash);
 const after=env.exportSave();assert.equal(after.meta.runs,'1');assert.equal(after.worldOrdinal,'2');
 assert.equal(after.history.worlds.length,1);assert.equal(after.meta.resultKeys.length,1);
 assert.equal(after.meta.totalEchoes,completed.result.echoes);assert.equal(after.history.worlds[0].score,completed.result.score);
 const option=env.observe().availableEvolutionCells.find((cell)=>cell.affordable);assert.ok(option,'first result should finance a reachable cell');
 const bought=env.act({type:'buy-evolution-level',cellId:option.id,expectedLevel:option.currentLevel,expectedRevision:env.observe().metaRevision});
 assert.equal(bought.accepted,true);assert.equal(bought.reason,'evolution-level-purchased');
 assert.equal(env.exportSave().history.evolution.length,1);assert.equal(bought.purchase.newLevel,'1');
 const repeat=env.act({type:'buy-evolution-level',cellId:option.id});
 assert.equal(repeat.reason,'missing-precondition');assert.equal(env.exportSave().history.evolution.length,1);
 assert.equal(env.act({type:'inspect-last-result'}).accepted,true);assert.equal(env.act({type:'inspect-builds'}).accepted,true);
 assert.equal(env.act({type:'export'}).save.schema,2);
 assert.equal(env.act({type:'reset',seed:-1}).reason,'invalid-seed');assert.equal(env.act({type:'reset',seed:77}).accepted,true);
 assert.equal(env.exportSave().meta.runs,'0');assert.equal(env.observe().lastResult,null);
});

test('recommended advancement, retry, and no-skip Environment actions share frontier authority',{timeout:30_000},()=>{
 const env=createAgentEnvironment(defaultAgentSave(404));
 const one=run(env),two=run(env);assert.equal(one.result.environmentLevel,'0');assert.equal(two.result.environmentLevel,'0');
 assert.equal(env.observe().environmentLevel,'1');const skipped=run(env,{mode:'select',environmentLevel:'2'});
 assert.equal(skipped.accepted,false);assert.equal(skipped.reason,'environment-level-locked');
 const retry=run(env,{type:'retry-environment-level',environmentLevel:'0'});assert.equal(retry.accepted,true);assert.equal(retry.result.environmentLevel,'0');
 assert.equal(env.observe().highestEnvironmentLevel,'1');const advanced=run(env);assert.equal(advanced.result.environmentLevel,'1');
 assert.equal(env.observe().highestEnvironmentLevel,'2');assert.equal(env.exportSave().meta.runs,'4');
});

test('same reset seed and fair actions replay to identical result and campaign hashes', {timeout:30_000},()=>{
 const a=createAgentEnvironment(),b=createAgentEnvironment();for(const env of[a,b]){assert.equal(env.act({type:'reset',seed:991}).accepted,true);assert.equal(env.act({type:'set-goal',goal:'balanced'}).accepted,true)}
 const first=run(a),second=run(b);assert.equal(first.accepted,true);assert.equal(second.accepted,true);
 assert.deepEqual(second.result,first.result);assert.equal(second.hash,first.hash);assert.deepEqual(b.exportSave(),a.exportSave());
 assert.equal(a.exportSave().meta.resultKeys.length,1);assert.equal(a.exportSave().history.worlds.length,1);
 assert.equal(JSON.stringify(first).includes('replay'),false);assert.equal(JSON.stringify(first).includes('diagnostics'),false);
});
function run(env,extra={}){const observation=env.observe();return env.act({type:'run-world',expectedRevision:observation.metaRevision,
 expectedWorldOrdinal:observation.worldOrdinal,...extra})}
