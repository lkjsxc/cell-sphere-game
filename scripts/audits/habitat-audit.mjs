#!/usr/bin/env node
/** Production habitat lock, unlock, occupancy, and marine-bounds audit. */
import { mkdirSync, writeFileSync } from 'node:fs';import { RunController } from '../../src/simulation/simulator.js';
import { compileMemory, MEMORY_NODES, MEMORY_NODE_IDS } from '../../src/game/skills/index.js';import { BIOME } from '../../src/world/constants.js';
const count=Number(process.argv.find((arg)=>arg.startsWith('--count='))?.split('=')[1]??60);const fresh=compileMemory({memoryNodes:[]}),full=compileMemory({memoryNodes:MEMORY_NODE_IDS});
const keys=['LAKE_ACCESS','TUNDRA_ACCESS','SNOW_ICE_ACCESS','SHALLOW_OCEAN_EDGE_ACCESS','SHALLOW_OCEAN_ACCESS','DEEP_OCEAN_ACCESS'];
const unlockIds=Object.fromEntries(keys.map((key)=>[key,MEMORY_NODES.find((node)=>node.effect.type==='unlock'&&node.effect.key===key)?.id]));
const configs={fresh,full};for(const [key,id] of Object.entries(unlockIds)) { const ids=[id];
 if(key==='SNOW_ICE_ACCESS')ids.unshift(unlockIds.TUNDRA_ACCESS);if(key==='SHALLOW_OCEAN_ACCESS')ids.unshift(unlockIds.SHALLOW_OCEAN_EDGE_ACCESS);
 if(key==='DEEP_OCEAN_ACCESS')ids.unshift(unlockIds.SHALLOW_OCEAN_EDGE_ACCESS,unlockIds.SHALLOW_OCEAN_ACCESS);configs[key]=compileMemory({memoryNodes:ids}); }
const rows=Object.fromEntries(Object.keys(configs).map((key)=>[key,[]]));let uniqueOccupancyViolations=0;for(const [label,memory] of Object.entries(configs))for(let index=0;index<count;index++){
 const rc=new RunController({seed:0x510000+index,worldOrdinal:8,worldPotential:memory.worldPotential,evolutionPower:memory.evolutionPower,
  potentialVersion:memory.potentialVersion,memoryEffects:memory.effects,memoryConditionals:memory.conditionals,
  memoryUnlocks:memory.unlocks,habitatCapabilities:memory.habitatCapabilities,activeBuilds:memory.activeBuilds,buildEffects:memory.buildEffects});rc.start();rc.advance(4000);const r=rc.buildResult(),o=r.habitatOccupancy,total=o.reduce((a,b)=>a+b,0);
 if(total>rc.state.topo.nodeCount)uniqueOccupancyViolations++;
 rows[label].push({lake:o[BIOME.LAKE],tundra:o[BIOME.TUNDRA],snowIce:o[BIOME.SNOW_ICE],shallow:o[BIOME.SHALLOW_OCEAN],deep:o[BIOME.DEEP_OCEAN],
  marineShare:total?(o[BIOME.SHALLOW_OCEAN]+o[BIOME.DEEP_OCEAN])/total:0,peak:r.peakCoverage,blocked:rc.state.habitatBlocked.reduce((a,b)=>a+b,0)});}
const gated=['lake','tundra','snowIce','shallow','deep'];const report={worldsPerConfiguration:count,unlockIds,uniqueOccupancyViolations,configurations:Object.fromEntries(Object.entries(rows).map(([label,values])=>[label,
 Object.fromEntries([...gated,'marineShare','peak','blocked'].map((key)=>[key,dist(values.map((row)=>row[key]))]))])),valid:false};
report.valid=!uniqueOccupancyViolations&&Object.values(unlockIds).every(Boolean)&&gated.every((key)=>report.configurations.fresh[key].max===0)&&report.configurations.fresh.blocked.median>0
 &&gated.every((key)=>report.configurations.full[key].median>0)&&report.configurations.full.marineShare.median<.7&&report.configurations.full.peak.median<=1
 &&report.configurations.LAKE_ACCESS.lake.max>0&&report.configurations.TUNDRA_ACCESS.tundra.max>0&&report.configurations.SNOW_ICE_ACCESS.snowIce.max>0
 &&report.configurations.SHALLOW_OCEAN_ACCESS.shallow.max>0&&report.configurations.DEEP_OCEAN_ACCESS.deep.max>0;
mkdirSync('reports',{recursive:true});writeFileSync('reports/habitat-audit.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(!report.valid)process.exitCode=1;
function dist(values){const a=values.slice().sort((x,y)=>x-y),at=(p)=>round(a[Math.floor((a.length-1)*p)]);return{min:round(a[0]),p25:at(.25),median:at(.5),p75:at(.75),p95:at(.95),max:round(a.at(-1))}}
function round(value){return Number(value.toFixed(5))}
