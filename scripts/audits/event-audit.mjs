#!/usr/bin/env node
/** Production event-field geometry and gradual world-era onboarding audit. */
import { mkdirSync, writeFileSync } from 'node:fs'; import { createRng } from '../../src/core/prng.js';
import { scheduleEvents } from '../../src/simulation/events.js'; import { createFields } from '../../src/world/fields.js'; import { createTopology } from '../../src/world/icosphere.js';
const count = Number(process.argv.find((arg)=>arg.startsWith('--count='))?.split('=')[1]??210); const topo=createTopology(4);
const ordinals=[1,2,3,4,5,8,12];const profiles=Object.fromEntries(ordinals.map((ordinal)=>[ordinal,{counts:[],first:[],intensity:[],overlap:0,families:{}}]));
const size={},computeMs=[],arrival=[];let oceanViolations=0,irregular=0,eventTotal=0,determinismViolations=0;
for(let index=0;index<count;index++){const ordinal=ordinals[index%ordinals.length];const seed=Math.imul(index+1,0x9e3779b1)>>>0;
 const fields=createFields(createRng(seed^0x51ab3d71),topo);const rng=()=>createRng(seed^0x0e7e17a1);const started=performance.now();
 const scheduled=scheduleEvents(rng(),topo,fields,null,ordinal);const repeated=scheduleEvents(rng(),topo,fields,null,ordinal);
 if(JSON.stringify(scheduled.map(shape))!==JSON.stringify(repeated.map(shape)))determinismViolations++;
 const profile=profiles[ordinal];profile.counts.push(scheduled.length);if(scheduled.length)profile.first.push(scheduled[0].startTick);
 for(let i=0;i<scheduled.length;i++){const event=scheduled[i];eventTotal++;computeMs.push((performance.now()-started)/Math.max(1,scheduled.length));profile.intensity.push(event.intensity);profile.families[event.family]=(profile.families[event.family]??0)+1;
  if(i&&event.startTick<scheduled[i-1].endTick)profile.overlap++;(size[event.family]??=[]).push(event.nodes.length);arrival.push(Math.max(...event.arrivalTicks));
  if(['drought','bloom','blight'].includes(event.family))for(const cell of event.nodes)oceanViolations+=fields.landMask[cell]?0:1;
  const reached=new Uint8Array(topo.nodeCount);let minDot=1;for(const cell of event.nodes){reached[cell]=1;minDot=Math.min(minDot,dot(topo.positions,event.center,cell));}
  for(let cell=0;cell<topo.nodeCount;cell++)if(!reached[cell]&&dot(topo.positions,event.center,cell)>minDot+.0001){irregular++;break;}
 }}
const era=Object.fromEntries(Object.entries(profiles).map(([ordinal,p])=>[ordinal,{eventCount:distribution(p.counts),firstStartTick:distribution(p.first),intensity:distribution(p.intensity),overlap:p.overlap,families:p.families}]));
const valid=profiles[1].counts.every((n)=>n===0)&&profiles[2].counts.every((n)=>n===0)&&profiles[3].counts.every((n)=>n===1)
 &&profiles[3].first.every((n)=>n>=2100)&&profiles[4].counts.every((n)=>n>=1&&n<=2)&&profiles[8].counts.every((n)=>n>=2&&n<=4)
 &&profiles[12].counts.every((n)=>n>=3&&n<=6)&&!oceanViolations&&!determinismViolations&&irregular>=eventTotal*.8;
const report={worlds:count,events:eventTotal,eras:era,computeMsPerField:distribution(computeMs),maxArrivalTicks:distribution(arrival),
 affectedCells:Object.fromEntries(Object.entries(size).map(([family,values])=>[family,distribution(values)])),oceanViolations,irregularFields:irregular,
 irregularShare:eventTotal?Number((irregular/eventTotal).toFixed(4)):0,determinismViolations,valid};
mkdirSync('reports',{recursive:true});writeFileSync('reports/event-audit.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(!valid)process.exitCode=1;
function shape(event){return[event.family,event.startTick,event.endTick,event.center,event.intensity,event.nodes.length]}
function dot(positions,a,b){const ai=a*3,bi=b*3;return positions[ai]*positions[bi]+positions[ai+1]*positions[bi+1]+positions[ai+2]*positions[bi+2]}
function distribution(values){if(!values.length)return{min:null,median:null,p95:null,max:null,mean:null};const sorted=values.slice().sort((a,b)=>a-b);return{min:round(sorted[0]),median:round(sorted[Math.floor(sorted.length*.5)]),p95:round(sorted[Math.min(sorted.length-1,Math.floor(sorted.length*.95))]),max:round(sorted.at(-1)),mean:round(sorted.reduce((a,b)=>a+b,0)/sorted.length)}}
function round(value){return Number(value.toFixed(4))}
