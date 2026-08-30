#!/usr/bin/env node
/** Deterministic production-backed fair-agent training/holdout tournament runner. */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { AGENT_POLICIES } from '../src/agent/policies.js';
import { compareProgressionIntegers } from '../src/core/progression-integer.js';
const exec=promisify(execFile),TRAINING=Object.freeze([104729,130363,155921,196613]),HOLDOUT=Object.freeze([1000003,1000033,1000037,1000039]);
const holdout=process.argv.includes('--holdout'),smoke=process.argv.includes('--smoke');
const worlds=integerOption('--worlds',smoke?5:6,1,30),concurrency=integerOption('--concurrency',Math.min(4,globalThis.navigator?.hardwareConcurrency??4),1,8);
const requestedPolicies=stringOption('--policies')?.split(',').filter(Boolean)??null;
const invalidPolicies=requestedPolicies?.filter((id)=>!AGENT_POLICIES.includes(id))??[];
const policies=[...new Set(requestedPolicies?.filter((id)=>AGENT_POLICIES.includes(id))??(smoke?['balanced','breadth-first','depth-first','sustainability','luminous','weak']:AGENT_POLICIES))];
const cohort=(holdout?HOLDOUT:TRAINING).slice(0,smoke?2:4),tasks=[];
for(const policy of policies)for(const seed of cohort)tasks.push({index:tasks.length,policy,seed,worlds});
const started=performance.now(),results=await parallelMap(tasks,concurrency,runTask),failures=results.filter((row)=>!row.ok);
const deterministicChecks=[];for(const task of tasks.filter((task)=>task.seed===cohort[0])){const rerun=await runTask(task),original=results[task.index];
 deterministicChecks.push({policy:task.policy,seed:task.seed,ok:rerun.ok&&original.ok&&rerun.summary.stateHash===original.summary.stateHash})}
const summaries=results.filter((row)=>row.ok).map((row)=>row.summary),policySummary={};
for(const policy of policies){const rows=summaries.filter((row)=>row.policy===policy),domains={};
 for(const domain of ['Fertility','Freshwater','Scarcity','Cryogenic','Marine','Luminous'])domains[domain]=dist(rows.map((row)=>row.finalDomains.find((entry)=>entry.domain===domain)?.ownedCells??0));
 policySummary[policy]={campaigns:rows.length,worlds:rows.reduce((sum,row)=>sum+row.worlds,0),purchases:dist(rows.map((row)=>row.purchases)),
  ownedCells:dist(rows.map((row)=>row.finalEvolutionCellCount)),echoBalance:exactDist(rows.map((row)=>row.finalEchoBalance)),
  bestScore:exactDist(rows.map((row)=>row.bestScore)),domains, terminalCauses:counts(rows.map((row)=>row.lastResult.cause)),
  poweredCampaigns:rows.filter((row)=>row.lastResult.worldmaking.everPoweredCells>0).length}}
const comparePath=stringOption('--compare'),comparison=comparePath&&existsSync(comparePath)?compare(JSON.parse(readFileSync(comparePath,'utf8')),policySummary):null;
const nonWeak=summaries.filter((row)=>row.policy!=='weak'),traceBounded=summaries.every((row)=>row.trace.length<=12),specialists={
 fertility:'Fertility',freshwater:'Freshwater',scarcity:'Scarcity',cryogenic:'Cryogenic',marine:'Marine',luminous:'Luminous'};
const specialistValid=Object.entries(specialists).filter(([policy])=>policies.includes(policy)).every(([policy,domain])=>{
 const target=policySummary[policy].domains[domain].median,others=Object.entries(policySummary[policy].domains).filter(([name])=>name!==domain).map(([,row])=>row.median);
 return target>0&&target>=Math.max(...others)});
const distinctDomains=new Set(summaries.flatMap((row)=>row.finalDomains.filter((entry)=>entry.ownedCells>0).map((entry)=>entry.domain))).size,diversityValid=smoke||distinctDomains>=4;
const expectedTasks=policies.length*cohort.length;
const valid=!invalidPolicies.length&&policies.length>0&&tasks.length===expectedTasks&&results.length===expectedTasks&&!failures.length
 &&deterministicChecks.length===policies.length&&deterministicChecks.every((row)=>row.ok)&&traceBounded&&specialistValid&&diversityValid
 &&nonWeak.every((row)=>row.worlds===worlds&&row.purchases>0)&&new Set(TRAINING).size===TRAINING.length&&HOLDOUT.every((seed)=>!TRAINING.includes(seed));
const report={schema:1,cohort:holdout?'holdout':'training',productionAuthority:true,fairObservation:true,seeds:cohort,
 untouchedHoldoutSeeds:holdout?HOLDOUT:undefined,trainingSeeds:TRAINING,policies,invalidPolicies,worldsPerCampaign:worlds,concurrency,expectedTasks,
 taskOrder:tasks.map(({policy,seed})=>`${policy}:${seed}`),policySummary,deterministicChecks,
 invariants:{traceBounded,specialistValid,distinctDomains,diversityValid,trainingHoldoutDisjoint:HOLDOUT.every((seed)=>!TRAINING.includes(seed))},
 comparison,failures:failures.map((row)=>({policy:row.task.policy,seed:row.task.seed,error:row.error,reproduction:`node scripts/agent-play.mjs campaign --worlds ${worlds} --seed ${row.task.seed} --policies ${row.task.policy}`})),
 elapsedMs:Number((performance.now()-started).toFixed(1)),valid};
mkdirSync('reports',{recursive:true});const path=`reports/agent-tournament-${holdout?'holdout':'training'}${smoke?'-smoke':''}.json`;
writeFileSync(path,`${JSON.stringify(report,null,2)}\n`);console.log(JSON.stringify(report,null,2));if(!valid)process.exitCode=1;

async function runTask(task){try{const {stdout}=await exec(process.execPath,['scripts/agent-play.mjs','campaign','--worlds',String(task.worlds),'--seed',String(task.seed),'--policies',task.policy],{maxBuffer:4*1024*1024,timeout:180000});
 const parsed=JSON.parse(stdout),summary=parsed.policies?.[0];if(!summary||summary.policy!==task.policy)throw new Error('malformed campaign report');return{ok:true,task,summary}}
 catch(error){return{ok:false,task,error:String(error.stderr||error.message).slice(0,1000)}}}
async function parallelMap(values,limit,fn){const out=new Array(values.length);let cursor=0;await Promise.all(Array.from({length:Math.min(limit,values.length)},async()=>{while(true){const index=cursor++;if(index>=values.length)return;out[index]=await fn(values[index])}}));return out}
function compare(previous,current){const prior=previous.policySummary??{};return Object.fromEntries(Object.entries(current).map(([policy,row])=>[policy,prior[policy]?{
 bestScoreChanged:row.bestScore.median!==prior[policy].bestScore.median,purchasesMedianDelta:row.purchases.median-prior[policy].purchases.median}:null]))}
function exactDist(values){if(!values.length)return{min:null,median:null,p90:null,max:null};const rows=values.map(String).sort(compareProgressionIntegers),at=(p)=>rows[Math.floor((rows.length-1)*p)];return{min:rows[0],median:at(.5),p90:at(.9),max:rows.at(-1)}}
function dist(values){if(!values.length)return{min:null,median:null,p90:null,max:null};const rows=values.slice().sort((a,b)=>a-b),at=(p)=>rows[Math.floor((rows.length-1)*p)];return{min:rows[0],median:at(.5),p90:at(.9),max:rows.at(-1)}}
function counts(values){const out={};for(const value of values)out[value]=(out[value]??0)+1;return out}
function stringOption(name){const at=process.argv.indexOf(name);return at<0?null:process.argv[at+1]}
function integerOption(name,fallback,min,max){const raw=stringOption(name);if(raw===null)return fallback;const value=Number(raw);return Number.isInteger(value)?Math.max(min,Math.min(max,value)):fallback}
