#!/usr/bin/env node
/** Direct Environment compiler and matched-seed production monotonicity audit. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { RunController } from '../../src/simulation/simulator.js';
import { compileChallengeProfile, MAX_EVENTS_PER_WORLD, MIN_TELEGRAPH_TICKS } from '../../src/simulation/challenge-profile.js';
import { MEMORY_NODE_IDS, compileEvolution } from '../../src/game/skills/index.js';
import { scoreResult } from '../../src/game/scoring.js';
import { multiplyProgressionIntegers } from '../../src/core/progression-integer.js';

const smoke=process.argv.includes('--smoke'),seeds=smoke?6:16,levels=['0','1','2','4','8','32'];
const started=performance.now(),fresh=compileEvolution({});
const breadth=compileEvolution({evolutionLevels:MEMORY_NODE_IDS.map((id)=>({id,level:'1'}))});
const deep=compileEvolution({evolutionLevels:MEMORY_NODE_IDS.map((id)=>({id,level:'10'}))});
const huge=`1${'0'.repeat(512)}`,compilerLevels=[...levels,'1000000',huge],compiler=[];
for(const level of compilerLevels){const at=performance.now(),profile=compileChallengeProfile({environmentLevel:level,evolution:fresh});compiler.push(profileRow(profile,performance.now()-at))}
const cohorts=[],cohortRuns=[];
for(const level of levels){const profile=compileChallengeProfile({environmentLevel:level,evolution:fresh}),runs=[];
 for(let index=0;index<seeds;index++)runs.push(runWorld(0x710000+index,profile,fresh));
 cohortRuns.push(runs);cohorts.push({level,pressure:profile.score.pressure,events:profile.events.count,peakReach:mean(runs.map((row)=>row.peakReach)),
   survivalSeconds:mean(runs.map((row)=>row.survivalSeconds)),score:mean(runs.map((row)=>exactToSafe(row.score))),
   environmentBonusRate:mean(runs.map((row)=>row.environmentBonusRate)),causes:counts(runs.map((row)=>row.cause)),maxTicks:Math.max(...runs.map((row)=>row.tick))});
}
const profileComparisons=['8','32','1000000'].map((level)=>{const matched=uniformEvolution(level),overpowered=uniformEvolution(multiplyProgressionIntegers(level,'2'));
 return{level,fresh:profileSummary(compileChallengeProfile({environmentLevel:level,evolution:fresh})),
  breadth:profileSummary(compileChallengeProfile({environmentLevel:level,evolution:breadth})),deep:profileSummary(compileChallengeProfile({environmentLevel:level,evolution:deep})),
  matched:profileSummary(compileChallengeProfile({environmentLevel:level,evolution:matched})),
  overpowered:profileSummary(compileChallengeProfile({environmentLevel:level,evolution:overpowered}))}});
const pressureMonotone=compiler.every((row,index)=>index===0||row.pressure+1e-9>=compiler[index-1].pressure);
const pairedTransitions=cohorts.slice(1).map((row,index)=>{const deltas=cohortRuns[index+1].map((run,seedIndex)=>run.peakReach-cohortRuns[index][seedIndex].peakReach);
 return{from:cohorts[index].level,to:row.level,meanDelta:mean(deltas),easierSeeds:deltas.filter((value)=>value>0.0025).length,worseSeeds:deltas.filter((value)=>value<-.0025).length}});
const peakMonotone=pairedTransitions.every((row)=>row.meanDelta<=0.0025);
const bounded=compiler.every((row)=>row.finite&&row.events<=MAX_EVENTS_PER_WORLD&&row.telegraphTicks>=MIN_TELEGRAPH_TICKS&&row.compileMs<50);
const defenseHelps=profileComparisons.every((row)=>row.deep.pressure<=row.breadth.pressure&&row.breadth.pressure<=row.fresh.pressure
  &&row.matched.pressure===0&&row.overpowered.pressure===0);
const noInstantFarm=cohorts.every((row)=>row.environmentBonusRate<=0.2)&&cohorts.at(-1).score<cohorts[0].score;
const terminalBounded=cohorts.every((row)=>row.maxTicks<=3620),runFinite=cohortRuns.flat().every((row)=>
 [row.peakReach,row.survivalSeconds,row.tick,row.environmentBonusRate].every(Number.isFinite)&&/^\d+$/.test(row.score));
const report={schema:2,mode:smoke?'smoke':'full',seedsPerLevel:seeds,levels,compiler,cohorts,pairedTransitions,profileComparisons,
 invariants:{pressureMonotone,matchedSeedMeanPeakReachNoEasier:peakMonotone,bounded,runFinite,defenseHelps,noInstantFarm,terminalBounded},
 elapsedMs:Number((performance.now()-started).toFixed(1)),valid:pressureMonotone&&peakMonotone&&bounded&&runFinite&&defenseHelps&&noInstantFarm&&terminalBounded};
mkdirSync('reports',{recursive:true});writeFileSync(`reports/environment-level-audit-${smoke?'smoke':'full'}.json`,`${JSON.stringify(report,null,2)}\n`);
console.log(JSON.stringify(report,null,2));if(!report.valid)process.exitCode=1;

function uniformEvolution(level){return compileEvolution({evolutionLevels:MEMORY_NODE_IDS.map((id)=>({id,level}))})}
function runWorld(seed,profile,evolution){const controller=new RunController({seed,worldOrdinal:'20',environmentLevel:profile.environmentLevel,challengeProfile:profile,
 worldPotential:evolution.worldPotential,evolutionPower:evolution.evolutionPower,evolutionDepth:evolution.evolutionDepth,potentialVersion:evolution.potentialVersion,
 memoryEffects:evolution.effects,memoryConditionals:evolution.conditionals,memoryUnlocks:evolution.unlocks,habitatCapabilities:evolution.habitatCapabilities,
 activeBuilds:evolution.activeBuilds,buildEffects:evolution.buildEffects,electricityMastery:evolution.electricityMastery});
 controller.start();controller.advance(4000);const result=controller.buildResult(),score=scoreResult(result);return{peakReach:result.peakCoverage,survivalSeconds:result.survivalSeconds,
 tick:result.tick,cause:result.cause,score:score.total,environmentBonusRate:score.environmentCredit.bonus}}
function profileRow(profile,compileMs){return{level:profile.environmentLevel,ratingDigits:profile.publicRating.length,pressure:profile.score.pressure,
 events:profile.events.count,telegraphTicks:profile.events.telegraphTicks,compileMs:Number(compileMs.toFixed(3)),hash:profile.hash,
 finite:[...Object.values(profile.coefficients),...Object.values(profile.events),profile.score.pressure].every(Number.isFinite)}}
function profileSummary(profile){return{pressure:profile.score.pressure,events:profile.events.count,hash:profile.hash,
 netRatings:Object.fromEntries(Object.entries(profile.dimensions).map(([key,value])=>[key,value.netRating]))}}
function mean(values){return Number((values.reduce((sum,value)=>sum+value,0)/Math.max(1,values.length)).toFixed(6))}
function exactToSafe(value){const text=String(value);if(!/^\d{1,15}$/.test(text))throw new Error(`SCORE report projection out of range: ${text.slice(0,24)}`);return Number(text)}
function counts(values){const out={};for(const value of values)out[value]=(out[value]??0)+1;return out}
