#!/usr/bin/env node
/** Authoritative Luminous charge, mastery, decay, and renderer parity audit. */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { RunController } from '../../src/simulation/simulator.js';
import { MEMORY_NODES, MEMORY_NODE_IDS, compileEvolution } from '../../src/game/skills/index.js';

const breadthLevels=MEMORY_NODE_IDS.map((id)=>({id,level:'1'}));
const deepLevels=MEMORY_NODES.map((node)=>({id:node.id,level:node.affinity==='Luminous'?'20':'1'}));
const configs={fresh:compileEvolution({}),breadth:compileEvolution({evolutionLevels:breadthLevels}),deep:compileEvolution({evolutionLevels:deepLevels})};
const rows={};for(const [name,evolution] of Object.entries(configs))rows[name]=run(name,evolution,9099);
const repeat=run('deep-repeat',configs.deep,9099);
const shader=readFileSync(new URL('../../src/rendering/shaders.js',import.meta.url),'utf8');
const canvas=readFileSync(new URL('../../src/rendering/fallback2d.js',import.meta.url),'utf8');
const authority=readFileSync(new URL('../../src/simulation/worldmaking.js',import.meta.url),'utf8');
const rendererSourceContract={webglChargeGate:/float chargeLight = pow\(powered/.test(shader),webglNightBoost:/\(1\.0 - night\) \* 0\.54/.test(shader),
 webglDevelopment:/uElectricityDevelopment/.test(shader),canvasChargeGate:/if \(powered > 0\)/.test(canvas),canvasNightBoost:/night\*\.38/.test(canvas),
 canvasDevelopment:/electricityDevelopment/.test(canvas),wireGeometry:/(?:wire|cable|powerline)(?:Geometry|Path|Vertex)/i.test(`${shader}\n${canvas}\n${authority}`),
 webglNightToDayRatio:Number(((.22+.54)/.22).toFixed(3)),canvasNightToDayRatio:Number(((.24+.38)/.24).toFixed(3))};
const invariants={freshHasNoFalseLight:rows.fresh.mid.poweredCells===0&&rows.fresh.mid.chargeSum===0,
 levelOneProducesCharge:rows.breadth.mid.poweredCells>50&&rows.breadth.terminal.everPoweredCells>0,
 deepMasteryStronger:rows.deep.mastery.development>rows.breadth.mastery.development&&rows.deep.mid.chargeSum>rows.breadth.mid.chargeSum,
 liveChargeDecayObserved:rows.breadth.liveDecayCells>0&&rows.deep.liveDecayCells>0,
 extinctionClearsLiveCharge:rows.breadth.terminal.finalElectrifiedCells===0&&rows.deep.terminal.finalElectrifiedCells===0,
 deterministic:rows.deep.hash===repeat.hash&&JSON.stringify(rows.deep.mid)===JSON.stringify(repeat.mid),
 rendererSourceContract:['webglChargeGate','webglNightBoost','webglDevelopment','canvasChargeGate','canvasNightBoost','canvasDevelopment']
  .every((key)=>rendererSourceContract[key]===true),
 wholeCellNoWires:!rendererSourceContract.wireGeometry};
const report={schema:2,seed:9099,configs:rows,rendererSourceContract,
 browserVisualGate:'test:browser:file + test:browser:canvas use identity-bound production day/night/terminal snapshots',
 invariants,valid:Object.values(invariants).every(Boolean)};
mkdirSync('reports',{recursive:true});writeFileSync('reports/luminous-audit.json',`${JSON.stringify(report,null,2)}\n`);
console.log(JSON.stringify(report,null,2));if(!report.valid)process.exitCode=1;

function run(label,evolution,seed){const controller=new RunController({seed,worldOrdinal:'20',environmentLevel:'0',worldPotential:evolution.worldPotential,
 evolutionPower:evolution.evolutionPower,evolutionDepth:evolution.evolutionDepth,potentialVersion:evolution.potentialVersion,
 memoryEffects:evolution.effects,memoryConditionals:evolution.conditionals,memoryUnlocks:evolution.unlocks,habitatCapabilities:evolution.habitatCapabilities,
 activeBuilds:evolution.activeBuilds,buildEffects:evolution.buildEffects,electricityMastery:evolution.electricityMastery});
 controller.start();let liveDecayCells=0,previous=Uint8Array.from(controller.state.electricityQ);
 for(let tick=0;tick<300;tick++){controller.advance(1);for(let cell=0;cell<previous.length;cell++)if(previous[cell]>controller.state.electricityQ[cell]&&controller.state.alive[cell])liveDecayCells++;previous.set(controller.state.electricityQ)}
 const snapshot=controller.snapshot(),charge=[...snapshot.electricityQ],mid={tick:snapshot.tick,
 poweredCells:charge.filter(Boolean).length,chargeSum:charge.reduce((sum,value)=>sum+value,0),peakCharge:Math.max(...charge),alive:snapshot.metrics.aliveCount,
 development:snapshot.electricityDevelopment};while(controller.state.status!=='extinct'){previous.set(controller.state.electricityQ);controller.advance(1);
  for(let cell=0;cell<previous.length;cell++)if(previous[cell]>controller.state.electricityQ[cell]&&controller.state.alive[cell])liveDecayCells++}
 const result=controller.buildResult();return{label,worldPotential:evolution.worldPotential,
 mastery:evolution.electricityMastery,mid,terminal:{tick:result.tick,cause:result.cause,electrifiedCells:result.electrifiedCells,
 finalElectrifiedCells:result.finalElectrifiedCells,everPoweredCells:result.everPoweredCells,poweredCellSeconds:result.poweredCellSeconds},liveDecayCells,hash:result.hash}}
