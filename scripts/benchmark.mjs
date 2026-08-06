#!/usr/bin/env node
/** Deterministic fresh gate plus breadth, deep-Luminous, extreme-profile, and compile/cache checkpoints. */
import { performance } from 'node:perf_hooks';
import { cpus } from 'node:os';
import { mkdirSync, writeFileSync } from 'node:fs';
import { RunController } from '../src/simulation/simulator.js';
import { runHeadless } from './pilot.mjs';
import { MEMORY_NODES, MEMORY_NODE_IDS, compileEvolution, evolutionCompileCacheDiagnostics,
  resetEvolutionCompileCache } from '../src/game/skills/index.js';
import { compileChallengeProfile } from '../src/simulation/challenge-profile.js';

const SEED=20260731,MIN_TICKS_PER_SECOND=3000;
const samples=Array.from({length:3},()=>runHeadless({RunController},{seed:SEED,strainId:'pioneer'},'balanced'));
if(!samples.every((sample)=>sample.result.hash===samples[0].result.hash&&sample.ticks===samples[0].ticks))throw new Error('benchmark samples diverged');
const ordered=samples.slice().sort((a,b)=>a.ms-b.ms),{result,ticks,ms}=ordered[1],ticksPerSecond=Math.round(ticks/(ms/1000));
const breadth=compileEvolution({evolutionLevels:MEMORY_NODE_IDS.map((id)=>({id,level:'1'}))});
const deepLuminous=compileEvolution({evolutionLevels:MEMORY_NODES.map((node)=>({id:node.id,level:node.affinity==='Luminous'?'20':'1'}))});
const fresh=compileEvolution({}),extremeLevel=`1${'0'.repeat(512)}`;
const profiles={breadth:measureRun(SEED+1,breadth,compileChallengeProfile({environmentLevel:'0',evolution:breadth})),
 deepLuminous:measureRun(SEED+2,deepLuminous,compileChallengeProfile({environmentLevel:'8',evolution:deepLuminous})),
 extremeEnvironment:measureRun(SEED+3,fresh,compileChallengeProfile({environmentLevel:extremeLevel,evolution:fresh}))};
resetEvolutionCompileCache();const compileAt=performance.now();
for(let index=0;index<1000;index++)compileEvolution({evolutionLevels:[{id:MEMORY_NODE_IDS[index%MEMORY_NODE_IDS.length],level:String(index+1)}]});
const compileCache={elapsedMs:Number((performance.now()-compileAt).toFixed(2)),...evolutionCompileCacheDiagnostics()};
const checkpoint={date:new Date().toISOString().slice(0,10),node:process.version,platform:process.platform,arch:process.arch,cpus:cpus().length,
 seed:SEED,ticks,elapsedMs:Math.round(ms),samplesMs:samples.map((sample)=>Math.round(sample.ms)),ticksPerSecond,
 extinctionTick:result.tick,cause:result.cause,peakCoverage:Number(result.peakCoverage.toFixed(4)),hash:result.hash,
 profiles,compileCache,heapUsedMB:Math.round(process.memoryUsage().heapUsed/1e6),valid:false};
checkpoint.valid=ticksPerSecond>=MIN_TICKS_PER_SECOND&&Object.values(profiles).every((row)=>row.finite&&row.tick<=3620)
 &&compileCache.size<=compileCache.limit&&compileCache.bytes<=compileCache.byteLimit&&compileCache.elapsedMs<1000;
mkdirSync('reports',{recursive:true});writeFileSync('reports/benchmark.json',`${JSON.stringify(checkpoint,null,2)}\n`);
console.log(JSON.stringify(checkpoint,null,2));console.error(`benchmark: ${ticks} ticks in ${Math.round(ms)} ms = ${ticksPerSecond} ticks/s (min ${MIN_TICKS_PER_SECOND}) | hash ${result.hash} | ${checkpoint.valid?'OK':'REGRESSED'}`);
process.exit(checkpoint.valid?0:1);

function measureRun(seed,evolution,profile){const heapBefore=process.memoryUsage().heapUsed,controller=new RunController({seed,worldOrdinal:'20',environmentLevel:profile.environmentLevel,challengeProfile:profile,
 worldPotential:evolution.worldPotential,evolutionPower:evolution.evolutionPower,evolutionDepth:evolution.evolutionDepth,potentialVersion:evolution.potentialVersion,
 memoryEffects:evolution.effects,memoryConditionals:evolution.conditionals,memoryUnlocks:evolution.unlocks,habitatCapabilities:evolution.habitatCapabilities,
 activeBuilds:evolution.activeBuilds,buildEffects:evolution.buildEffects,electricityMastery:evolution.electricityMastery});
 const at=performance.now();controller.start();while(controller.state.status!=='extinct')controller.advance(64);const elapsed=performance.now()-at,result=controller.buildResult();
 return{environmentLevelDigits:profile.environmentLevel.length,pressure:profile.score.pressure,tick:result.tick,elapsedMs:Number(elapsed.toFixed(2)),
  ticksPerSecond:Math.round(result.tick/(elapsed/1000)),heapDeltaMB:Number(((process.memoryUsage().heapUsed-heapBefore)/1e6).toFixed(2)),hash:result.hash,
  finite:Object.values(profile.coefficients).every(Number.isFinite)&&Number.isFinite(result.survivalSeconds)}}
