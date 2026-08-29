import { test } from 'node:test';import assert from 'node:assert/strict';
import { STORAGE_KEYS } from '../../src/core/identity.js';import { defaultMeta } from '../../src/platform/storage.js';
import { appendEvolutionEvent, defaultHistory } from '../../src/platform/history.js';
import { recoverRunTransaction, saveProgressionTransaction, saveRunTransaction } from '../../src/platform/run-transaction-store.js';
import {applyRunResult} from '../../src/interface/policies/run-result.js';
import { scoreResult } from '../../src/game/scoring.js';
import { RunController } from '../../src/simulation/simulator.js';
function memoryStorage(){const values=new Map();return{fail:null,getItem:key=>values.get(key)??null,setItem(key,value){if(key===this.fail)throw new Error('quota');values.set(key,String(value))},removeItem:key=>values.delete(key),values};}
function committed(){const key='world:7:7:77:7:4:abcdef12';const meta={...defaultMeta(),runs:'7',resultKeys:[key],totalEchoes:'50',echoBalance:'20'};
 const history={...defaultHistory(),worlds:[{id:'7-77-proof',seed:77,tick:2700,score:'10000',rank:'Rooted',cause:'resource-exhaustion',echo:'14',hash:'abcdef',archetype:'Living World',inoculationCell:4,environmentModelVersion:2,startEnvironmentLevel:'0',events:[]}]};return{key,meta,history};}
test('completed reward and History recover as one crash-safe transaction',()=>{const storage=memoryStorage(),value=committed();storage.fail=STORAGE_KEYS.history;
 assert.equal(saveRunTransaction(value.meta,value.history,storage),false);assert.ok(storage.getItem(STORAGE_KEYS.resultTransaction));
 storage.fail=null;const recovered=recoverRunTransaction(storage);assert.equal(recovered.key,value.key);assert.equal(recovered.kind,'run');assert.equal(recovered.persisted,true);
 assert.equal(recovered.meta.runs,'7');assert.equal(recovered.history.worlds.length,1);assert.equal(storage.getItem(STORAGE_KEYS.resultTransaction),null);
 assert.equal(JSON.parse(storage.getItem(STORAGE_KEYS.meta)).runs,'7');assert.equal(JSON.parse(storage.getItem(STORAGE_KEYS.history)).worlds.length,1);});
test('successful bundle commit clears recovery journal only after both verified mirrors',()=>{const storage=memoryStorage(),value=committed();
 assert.equal(saveRunTransaction(value.meta,value.history,storage),true);assert.equal(storage.getItem(STORAGE_KEYS.resultTransaction),null);
 assert.equal(recoverRunTransaction(storage),null);});
test('current WAL schema validates current documents', () => {
 const storage=memoryStorage(),key='current-wal',meta={...defaultMeta(),resultKeys:[key]},history=defaultHistory();
 storage.setItem(STORAGE_KEYS.resultTransaction, JSON.stringify({schema:5,kind:'run',key,meta,history}));
 const recovered=recoverRunTransaction(storage);assert.equal(recovered.kind,'run');assert.equal(recovered.key,key);
 assert.equal(recovered.meta.schema,15);assert.equal(recovered.history.schema,10);
});
test('Evolution level, exact debit, and History recover from the same WAL',()=>{const storage=memoryStorage();const key='evolution:0:cell:0:1';
 const meta={...defaultMeta(),revision:'1',echoBalance:'92',evolutionLevels:[{id:'first-division',level:'1'}],evolutionTransactionKeys:[key]};
 const evidence={transactionKey:key,nodeId:'first-division',oldLevel:'0',newLevel:'1',cost:'8',balanceBefore:'100',balanceAfter:'92',run:'0'};
 const history=appendEvolutionEvent(defaultHistory(),evidence);assert.equal(appendEvolutionEvent(history,evidence).evolution.length,1);
 storage.fail=STORAGE_KEYS.history;assert.equal(saveProgressionTransaction(meta,history,{kind:'evolution',key},storage),false);
 storage.fail=null;const recovered=recoverRunTransaction(storage);assert.equal(recovered.kind,'evolution');assert.equal(recovered.meta.echoBalance,'92');
 assert.deepEqual(recovered.history.evolution[0],history.evolution[0]);});
test('forged SCORE, schedule evidence, profile hash, and skipped world ordinals cannot mint Echoes',()=>{
 const controller = new RunController({ seed: 20260731, runId: 1, worldOrdinal: '1' }); controller.start();
 while (controller.state.status !== 'extinct') controller.advance(64);
 const base = { ...controller.buildResult(), resultTransactionKey: 'forgery-test' };
 const meta={...defaultMeta(),worldSeedIndex:'0'};
 assert.equal(base.resultSchemaVersion, 9);
 assert.equal(applyRunResult(meta,defaultHistory(),{...base,resultSchemaVersion:6}).reason,'invalid-environment-result');
 assert.equal(applyRunResult(meta,defaultHistory(),{...base,scoreProjection:{...base.scoreProjection,total:`9${'8'.repeat(1000)}`}}).reason,'invalid-authority-result');
 const forged = { ...base, scoreMerit: { ...base.scoreMerit, raw: { ...base.scoreMerit.raw, survival: 999, exploration: 999,
   presence: 999, coherence: 999, stewardship: 999, worldmaking: 999 } } };
 const forgedScore = scoreResult(forged); forged.score = forgedScore.total; forged.scoreProjection = forgedScore;
 forged.scoreMerit = { ...forged.scoreMerit, total: forgedScore.total, quality: forgedScore.quality, environmentBonusQ: Math.round(forgedScore.environmentCredit.bonus * 1_000_000) };
 assert.equal(applyRunResult(meta,defaultHistory(),forged).reason,'invalid-authority-result');
 const cyclic = { ...base, resultTransactionKey: 'cyclic-result' }; cyclic.extra = cyclic;
 let cyclicTransaction;
 assert.doesNotThrow(() => { cyclicTransaction = applyRunResult(meta, defaultHistory(), cyclic); });
 assert.equal(cyclicTransaction.reason, 'invalid-authority-result');
 const deep = { ...base, resultTransactionKey: 'deep-result' }; let nested = deep;
 for (let depth = 0; depth <= 32; depth++) { nested.extra = {}; nested = nested.extra; }
 assert.equal(applyRunResult(meta, defaultHistory(), deep).reason, 'invalid-authority-result');
 assert.equal(applyRunResult(meta,defaultHistory(),{...base,environmentExposure:{...base.environmentExposure,totalTicks:'2999'}}).reason,'invalid-environment-result');
 assert.equal(applyRunResult(meta,defaultHistory(),{...base,peakEnvironmentLevel:'999999'}).reason,'invalid-environment-result');
 assert.equal(applyRunResult(meta,defaultHistory(),{...base,currentEnvironmentProfileHash:'deadbeef'}).reason,'invalid-environment-result');
 const delayed = base.recentEnvironmentTransitions.map((transition, index) => index ? transition
   : { ...transition, tick: String(Number(transition.tick) + 1) });
 assert.equal(applyRunResult(meta,defaultHistory(),{...base,recentEnvironmentTransitions:delayed}).reason,'invalid-environment-result');
 const alteredPressure = base.recentEnvironmentTransitions.map((transition, index) => index ? transition
   : { ...transition, pressure: 0 });
 assert.equal(applyRunResult(meta,defaultHistory(),{...base,recentEnvironmentTransitions:alteredPressure}).reason,'invalid-environment-result');
 assert.equal(applyRunResult(meta,defaultHistory(),{...base,worldOrdinal:'999'}).reason,'unexpected-world-ordinal');
 assert.equal(meta.echoBalance,'0');
});
test('old result schemas are rejected rather than migrated', () => {
  const controller = new RunController({ seed: 17, runId: 1, worldOrdinal: '1' }); controller.start();
  while (controller.state.status !== 'extinct') controller.advance(64);
  const base = controller.buildResult();
  assert.equal(applyRunResult({ ...defaultMeta(), worldSeedIndex: '0' }, defaultHistory(),
    { ...base, resultTransactionKey: 'old-result', resultSchemaVersion: 7 }).reason, 'invalid-environment-result');
});

test('monotonic exact world ordinal rejects an old result after bounded receipt eviction',()=>{const meta={...defaultMeta(),runs:'9007199254740993',resultKeys:[]};
 const tx=applyRunResult(meta,defaultHistory(),{worldOrdinal:'42',resultTransactionKey:'old-evicted-world'},new Set());assert.equal(tx.applied,false);});
