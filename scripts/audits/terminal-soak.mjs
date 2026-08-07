#!/usr/bin/env node
/** Parallel production terminal + result/persistence/history/memory soak. */
import {mkdirSync,writeFileSync} from 'node:fs';
import {cpus} from 'node:os';
import {isMainThread,parentPort,workerData,Worker} from 'node:worker_threads';
import {performance} from 'node:perf_hooks';
import {createAgentEnvironment} from '../../src/agent/environment.js';
import {defaultAgentSave} from '../../src/agent/schema.js';
import {applyRunResult} from '../../src/interface/policies/run-result.js';
import {serializeHistory} from '../../src/platform/history.js';

if(!isMainThread)parentPort.postMessage(executeRange(workerData.start,workerData.count));
else{
 const count=intArg('--count=',10000,1,100000),concurrency=intArg('--concurrency=',Math.min(8,cpus().length),1,32);
 const started=performance.now(),ranges=split(count,concurrency),rows=await Promise.all(ranges.map((range)=>runWorker(range)));
 const total=rows.reduce((sum,row)=>sum+row.worlds,0),tickCounts=rows.flatMap((row)=>row.tickCounts);
 const report={schema:3,model:'within-world-v2',productionSimulation:true,productionPersistence:true,worlds:total,concurrency:ranges.length,
  ticks:{min:Math.min(...tickCounts),max:Math.max(...tickCounts),average:Math.round(tickCounts.reduce((a,b)=>a+b,0)/total)},
  maxHeapUsedMB:Number(Math.max(...rows.map((row)=>row.maxHeapUsedMB)).toFixed(2)),historyEntriesMax:Math.max(...rows.map((row)=>row.historyEntries)),
  historyBytesMax:Math.max(...rows.map((row)=>row.historyBytes)),receiptKeysMax:Math.max(...rows.map((row)=>row.receiptKeys)),
  duplicateTransactionsRejected:rows.reduce((sum,row)=>sum+row.duplicatesRejected,0),
  uniqueCampaignSeeds:new Set(rows.map((row)=>row.campaignSeed)).size,uniqueRunSeedsWithinWorkers:rows.reduce((sum,row)=>sum+row.uniqueRunSeeds,0),elapsedMs:Number((performance.now()-started).toFixed(1)),
  valid:total===count&&new Set(rows.map((row)=>row.campaignSeed)).size===rows.length&&rows.every((row)=>row.valid)};
 mkdirSync('reports',{recursive:true});writeFileSync(`reports/terminal-soak-${count}.json`,`${JSON.stringify(report,null,2)}\n`);
 if(count>=10000)writeFileSync('reports/terminal-soak.json',`${JSON.stringify(report,null,2)}\n`);
 console.log(JSON.stringify(report,null,2));if(!report.valid)process.exitCode=1;
}

function executeRange(start,count){
 const campaignSeed=((0x5f3759df+start*2654435761)>>>0)%0x40000000,env=createAgentEnvironment(defaultAgentSave(campaignSeed));
 let maxHeap=0,duplicatesRejected=0,valid=true;const tickCounts=[],runSeeds=new Set();
 for(let offset=0;offset<count;offset++){
  const observation=env.observe(),response=env.act({type:'run-world',expectedRevision:observation.metaRevision,expectedWorldOrdinal:observation.worldOrdinal,budgetTicks:10000}),save=env.exportSave(),record=save.history.worlds.at(-1);tickCounts.push(record?.tick??0);runSeeds.add(record?.seed);
  valid&&=response.accepted&&response.reason==='world-completed'&&record?.startEnvironmentLevel==='0'&&record?.peakEnvironmentLevel!==undefined&&save.history.worlds.length<=32&&save.meta.resultKeys.length<=16;
  const duplicate=applyRunResult(save.meta,save.history,{resultTransactionKey:record.resultTransactionKey,worldOrdinal:record.worldOrdinal},32,new Set(save.meta.resultKeys));
  duplicatesRejected+=Number(!duplicate.applied);valid&&=!duplicate.applied;
  if(offset%25===0)maxHeap=Math.max(maxHeap,process.memoryUsage().heapUsed/1048576);
 }
 const save=env.exportSave(),encoded=serializeHistory(save.history);valid&&=encoded.length<=700000&&save.meta.runs===String(count);
 return{worlds:count,tickCounts,maxHeapUsedMB:maxHeap,historyEntries:save.history.worlds.length,historyBytes:encoded.length,
  receiptKeys:save.meta.resultKeys.length,duplicatesRejected,campaignSeed,uniqueRunSeeds:runSeeds.size,valid};
}
function runWorker(range){return new Promise((resolve,reject)=>{const worker=new Worker(new URL(import.meta.url),{workerData:range});worker.once('message',resolve);worker.once('error',reject);worker.once('exit',(code)=>{if(code)reject(new Error(`terminal soak worker exited ${code}`))})})}
function split(count,limit){const workers=Math.min(count,limit),base=Math.floor(count/workers),extra=count%workers;let start=0;return Array.from({length:workers},(_,index)=>{const size=base+Number(index<extra),row={start,count:size};start+=size;return row})}
function intArg(prefix,fallback,min,max){const raw=process.argv.find((arg)=>arg.startsWith(prefix))?.slice(prefix.length),value=Number(raw);return Number.isInteger(value)?Math.max(min,Math.min(max,value)):fallback}
