import { test } from 'node:test';import assert from 'node:assert/strict';
import { STORAGE_KEYS } from '../../src/core/identity.js';import { defaultMeta } from '../../src/platform/storage.js';
import { defaultHistory } from '../../src/platform/history.js';import { recoverRunTransaction, saveRunTransaction } from '../../src/platform/run-transaction-store.js';
import { applyRunResult } from '../../src/interface/policies/run-result.js';
function memoryStorage(){const values=new Map();return{fail:null,getItem:key=>values.get(key)??null,setItem(key,value){if(key===this.fail)throw new Error('quota');values.set(key,value)},removeItem:key=>values.delete(key),values};}
function committed(){const key='world:7:7:77:7';const meta={...defaultMeta(),runs:7,resultKeys:[key],totalEchoes:50,echoBalance:20};
 const history={...defaultHistory(),worlds:[{id:'7-77-proof',seed:77,tick:2700,score:10000,rank:'Rooted',cause:'resource-exhaustion',echo:14,hash:'abcdef',archetype:'Living World',inoculationCell:4,events:[]}]};return{key,meta,history};}
test('completed reward and History recover as one crash-safe transaction',()=>{const storage=memoryStorage(),value=committed();storage.fail=STORAGE_KEYS.history;
 assert.equal(saveRunTransaction(value.meta,value.history,24,storage),false);assert.ok(storage.getItem(STORAGE_KEYS.resultTransaction));
 storage.fail=null;const recovered=recoverRunTransaction(24,storage);assert.equal(recovered.key,value.key);assert.equal(recovered.persisted,true);
 assert.equal(recovered.meta.runs,7);assert.equal(recovered.history.worlds.length,1);assert.equal(storage.getItem(STORAGE_KEYS.resultTransaction),null);
 assert.equal(JSON.parse(storage.getItem(STORAGE_KEYS.meta)).runs,7);assert.equal(JSON.parse(storage.getItem(STORAGE_KEYS.history)).worlds.length,1);});
test('successful bundle commit clears recovery journal only after both verified mirrors',()=>{const storage=memoryStorage(),value=committed();
 assert.equal(saveRunTransaction(value.meta,value.history,24,storage),true);assert.equal(storage.getItem(STORAGE_KEYS.resultTransaction),null);
 assert.equal(recoverRunTransaction(24,storage),null);});
test('monotonic world ordinal rejects an old result after bounded receipt eviction',()=>{const meta={...defaultMeta(),runs:300,resultKeys:[]};
 const tx=applyRunResult(meta,defaultHistory(),{worldOrdinal:42,resultTransactionKey:'old-evicted-world'},24,new Set());assert.equal(tx.applied,false);});
