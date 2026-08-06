import { test } from 'node:test';import assert from 'node:assert/strict';
import { STORAGE_KEYS } from '../../src/core/identity.js';import { defaultMeta } from '../../src/platform/storage.js';
import { appendEvolutionEvent, defaultHistory } from '../../src/platform/history.js';
import { recoverRunTransaction, saveProgressionTransaction, saveRunTransaction } from '../../src/platform/run-transaction-store.js';
import {applyRunResult} from '../../src/interface/policies/run-result.js';
import {evaluate,SCORE_MODEL_VERSION} from '../../src/game/scoring.js';
function memoryStorage(){const values=new Map();return{fail:null,getItem:key=>values.get(key)??null,setItem(key,value){if(key===this.fail)throw new Error('quota');values.set(key,String(value))},removeItem:key=>values.delete(key),values};}
function committed(){const key='world:7:7:77:7:4:abcdef12';const meta={...defaultMeta(),runs:'7',resultKeys:[key],totalEchoes:'50',echoBalance:'20'};
 const history={...defaultHistory(),worlds:[{id:'7-77-proof',seed:77,tick:2700,score:'10000',rank:'Rooted',cause:'resource-exhaustion',echo:'14',hash:'abcdef',archetype:'Living World',inoculationCell:4,events:[]}]};return{key,meta,history};}
test('completed reward and History recover as one crash-safe transaction',()=>{const storage=memoryStorage(),value=committed();storage.fail=STORAGE_KEYS.history;
 assert.equal(saveRunTransaction(value.meta,value.history,24,storage),false);assert.ok(storage.getItem(STORAGE_KEYS.resultTransaction));
 storage.fail=null;const recovered=recoverRunTransaction(24,storage);assert.equal(recovered.key,value.key);assert.equal(recovered.kind,'run');assert.equal(recovered.persisted,true);
 assert.equal(recovered.meta.runs,'7');assert.equal(recovered.history.worlds.length,1);assert.equal(storage.getItem(STORAGE_KEYS.resultTransaction),null);
 assert.equal(JSON.parse(storage.getItem(STORAGE_KEYS.meta)).runs,'7');assert.equal(JSON.parse(storage.getItem(STORAGE_KEYS.history)).worlds.length,1);});
test('successful bundle commit clears recovery journal only after both verified mirrors',()=>{const storage=memoryStorage(),value=committed();
 assert.equal(saveRunTransaction(value.meta,value.history,24,storage),true);assert.equal(storage.getItem(STORAGE_KEYS.resultTransaction),null);
 assert.equal(recoverRunTransaction(24,storage),null);});
test('Evolution level, exact debit, and History recover from the same WAL',()=>{const storage=memoryStorage();const key='evolution:0:cell:0:1';
 const meta={...defaultMeta(),revision:'1',echoBalance:'92',evolutionLevels:[{id:'ecology-tempered-scars',level:'1'}],evolutionTransactionKeys:[key]};
 const evidence={transactionKey:key,nodeId:'ecology-tempered-scars',oldLevel:'0',newLevel:'1',cost:'8',balanceBefore:'100',balanceAfter:'92',run:'0'};
 const history=appendEvolutionEvent(defaultHistory(),evidence);assert.equal(appendEvolutionEvent(history,evidence).evolution.length,1);
 storage.fail=STORAGE_KEYS.history;assert.equal(saveProgressionTransaction(meta,history,{kind:'evolution',key,retention:24},storage),false);
 storage.fail=null;const recovered=recoverRunTransaction(24,storage);assert.equal(recovered.kind,'evolution');assert.equal(recovered.meta.echoBalance,'92');
 assert.deepEqual(recovered.history.evolution[0],history.evolution[0]);});
test('forged SCORE and skipped world ordinals cannot mint Echoes',()=>{const merit={raw:{survival:300,exploration:10,presence:5,coherence:4,stewardship:8,worldmaking:0},lastUpdateTick:3000};
 const score=evaluate({scoreMerit:merit,worldPotential:'16000'}),base={worldOrdinal:'1',worldPotential:'16000',scoreModelVersion:SCORE_MODEL_VERSION,
  score:score.total,scoreProjection:score,scoreMerit:merit,survivalSeconds:300,resultTransactionKey:'forgery-test',environmentLevel:'0',seed:1,tick:3000,hash:'abc'};
 const meta={...defaultMeta(),worldSeedIndex:'1'};
 assert.equal(applyRunResult(meta,defaultHistory(),{...base,scoreProjection:{...score,total:`9${'8'.repeat(1000)}`}},24).reason,'invalid-score-projection');
 assert.equal(applyRunResult({...meta,worldSeedIndex:'999'},defaultHistory(),{...base,worldOrdinal:'999',scoreProjection:{...score,total:`9${'8'.repeat(1000)}`}},24).reason,'invalid-score-projection');
 assert.equal(applyRunResult(meta,defaultHistory(),{...base,worldOrdinal:'999'},24).reason,'unexpected-world-ordinal');
 assert.equal(meta.echoBalance,'0');
});
test('monotonic exact world ordinal rejects an old result after bounded receipt eviction',()=>{const meta={...defaultMeta(),runs:'9007199254740993',resultKeys:[]};
 const tx=applyRunResult(meta,defaultHistory(),{worldOrdinal:'42',resultTransactionKey:'old-evicted-world'},24,new Set());assert.equal(tx.applied,false);});
