#!/usr/bin/env node
/** Production-backed early calibration, campaign economy, and breadth-complete SCORE audit. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { createAgentEnvironment } from '../../src/agent/environment.js';
import { choosePolicyAction } from '../../src/agent/policies.js';
import { defaultAgentSave } from '../../src/agent/schema.js';
import { MEMORY_NODE_IDS, compileEvolution } from '../../src/game/skills/index.js';

const smoke=process.argv.includes('--smoke'),freshCount=smoke?12:80,campaignCount=smoke?2:8,strongCount=smoke?6:30;
const policies=['balanced','breadth-first','marginal-value','sustainability','freshwater','scarcity-reclaimer','cryogenic','marine','luminous-infrastructure'];
const started=performance.now();
const fresh=Array.from({length:freshCount},(_,index)=>oneWorld(0x100000+index,[]));
const campaigns={};
for(const policy of policies){const rows=[];for(let cohort=0;cohort<campaignCount;cohort++)rows.push(agentCampaign(0x200000+cohort*97,policy,5));campaigns[policy]=campaignSummary(rows)}
const breadthLevels=MEMORY_NODE_IDS.map((id)=>({id,level:'1'}));
const breadth=Array.from({length:strongCount},(_,index)=>oneWorld(0x300000+index,breadthLevels));
const firstRoot=Array.from({length:strongCount},(_,index)=>oneWorld(0x400000+index,[{id:MEMORY_NODE_IDS[0],level:'1'}]));
const freshSummary=worldSummary(fresh),breadthSummary=worldSummary(breadth),rootSummary=worldSummary(firstRoot),typical=campaigns['marginal-value'];
const valid=freshSummary.score.median>=(smoke?7000:8000)&&freshSummary.score.median<=15000
 &&freshSummary.durationSeconds.median>=270&&freshSummary.durationSeconds.median<=330
 &&freshSummary.events.max===0&&resourceCauseShare(fresh)>=.75
 &&rootSummary.score.median>=10000&&rootSummary.score.median<=20000
 &&typical.potentialAfter3.median>=(smoke?48000:80000)&&typical.potentialAfter3.median<=130000
 &&typical.firstResolutionMinutes.median>=18&&typical.firstResolutionMinutes.median<=24
 &&breadthSummary.score.median>=850000&&breadthSummary.score.median<=1100000
 &&breadthSummary.score.max<=1250000;
const report={schema:2,date:new Date().toISOString(),mode:smoke?'smoke':'full',productionAuthority:true,
 elapsedMs:Number((performance.now()-started).toFixed(1)),fresh:freshSummary,firstRoot:rootSummary,campaigns,
 breadthComplete:{...breadthSummary,worldPotential:compileEvolution({evolutionLevels:breadthLevels}).worldPotential},
 targets:{freshScore:'8,000–15,000 median',firstRootScore:'10,000–20,000 median',freshDuration:'270–330 seconds',
   firstResolution:'18–24 minutes through four worlds',threeWorldPotential:'80,000–130,000',breadthScore:'850,000–1,100,000'},valid};
mkdirSync('reports',{recursive:true});writeFileSync(`reports/campaign-audit-${smoke?'smoke':'full'}.json`,`${JSON.stringify(report,null,2)}\n`);
console.log(JSON.stringify(report,null,2));if(!valid)process.exitCode=1;

function oneWorld(seed,evolutionLevels){
 const save=defaultAgentSave(seed);save.meta.evolutionLevels=evolutionLevels;const env=createAgentEnvironment(save);
 const observation=env.observe(),response=env.act(runAction(observation));if(!response.accepted)throw new Error(response.reason);
 return response.result;
}
function agentCampaign(seed,policy,worldCount){
 const env=createAgentEnvironment(defaultAgentSave(seed));env.act({type:'set-goal',goal:policy});const worlds=[];
 for(let world=0;world<worldCount;world++){
  let response=null;
  for(let decision=0;decision<6;decision++){
   const observation=env.observe(),choice=choosePolicyAction(observation,policy);response=env.act(choice.action);
   if(choice.action.type==='run-world')break;if(!response.accepted)break;
  }
  if(!response?.result)response=env.act(runAction(env.observe()));if(!response.accepted)throw new Error(`${policy}: ${response.reason}`);
  worlds.push({result:response.result,observation:env.observe()});
 }
 return{worlds,save:env.exportSave()};
}
function campaignSummary(rows){
 return{cohorts:rows.length,firstResolutionMinutes:dist(rows.map((row)=>row.worlds.slice(0,4).reduce((sum,item)=>sum+item.result.survivalSeconds,0)/60)),
  potentialAfter3:dist(rows.map((row)=>exactToSafe(row.worlds[2].observation.worldPotential))),
  levelsAfter3:dist(rows.map((row)=>row.worlds[2].observation.evolutionSummary.breadth)),
  depthAfter5:dist(rows.map((row)=>exactToSafe(row.worlds[4].observation.evolutionSummary.totalLevels))),
  environmentAfter5:rows.map((row)=>row.worlds[4].result.environmentLevel),
  scoreWorld3:dist(rows.map((row)=>exactToSafe(row.worlds[2].result.score))),
  scoreWorld5:dist(rows.map((row)=>exactToSafe(row.worlds[4].result.score))),
  finalEchoBalance:dist(rows.map((row)=>exactToSafe(row.save.meta.echoBalance)))};
}
function runAction(observation){return{type:'run-world',expectedRevision:observation.metaRevision,expectedWorldOrdinal:observation.worldOrdinal}}
function worldSummary(rows){return{worlds:rows.length,score:dist(rows.map((row)=>exactToSafe(row.score))),echoes:dist(rows.map((row)=>exactToSafe(row.echoes))),
 durationSeconds:dist(rows.map((row)=>row.survivalSeconds)),peakReach:dist(rows.map((row)=>row.peakReach)),
 events:dist(rows.map((row)=>row.crises?.total??0)),causes:counts(rows.map((row)=>row.cause)),
 environmentLevels:counts(rows.map((row)=>row.environmentLevel))}}
function resourceCauseShare(rows){return rows.filter((row)=>row.cause==='resource-exhaustion'||row.cause==='maintenance-starvation').length/rows.length}
function exactToSafe(value){const text=String(value);if(!/^\d+$/.test(text)||text.length>15)throw new Error(`report projection out of range: ${text.slice(0,24)}`);return Number(text)}
function counts(values){const out={};for(const value of values)out[value]=(out[value]??0)+1;return out}
function dist(values){if(!values.length)return{min:null,p10:null,p25:null,median:null,p75:null,p90:null,max:null};const a=values.slice().sort((x,y)=>x-y),at=(p)=>round(a[Math.floor((a.length-1)*p)]);return{min:round(a[0]),p10:at(.1),p25:at(.25),median:at(.5),p75:at(.75),p90:at(.9),max:round(a.at(-1))}}
function round(value){return Number(Number(value).toFixed(5))}
