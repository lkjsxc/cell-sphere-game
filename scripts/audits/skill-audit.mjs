#!/usr/bin/env node
/** Production-backed unlimited Evolution topology, economy, migration, and compiler audit. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { createGeodesicTopology } from '../../src/world/icosphere.js';
import { BUILD_RECIPES, EVOLUTION_COMPILER_VERSIONS, MEMORY_NODES, MEMORY_NODE_IDS,
  availableMemoryNodes, compileEvolution, evolutionCompileCacheDiagnostics, evolutionCostForTargetLevel, evolutionLevel,
  normalizeEvolutionLevels, purchaseEvolutionLevel, validateMemoryGraph } from '../../src/game/skills/index.js';
import { validateAtlasMapping } from '../../src/game/skills/atlas.js';
import { LEGACY_MEMORY_MANIFEST } from '../../src/game/skills/legacy-v4-manifest.js';
import { defaultMeta, validateMeta } from '../../src/platform/storage.js';

const started=performance.now(),topo=createGeodesicTopology(5),graph=validateMemoryGraph(),atlas=validateAtlasMapping();
let meta={...defaultMeta(),echoBalance:'1000000'},spent=0n,guard=0;
while(normalizeEvolutionLevels(meta).length<MEMORY_NODES.length&&guard++<300){
 const node=availableMemoryNodes(meta).find((item)=>item.currentLevel==='0');
 if(!node)throw new Error(`legal breadth traversal stopped at ${normalizeEvolutionLevels(meta).length}`);
 const tx=purchaseEvolutionLevel(meta,node.id,{expectedLevel:'0',expectedRevision:meta.revision,transactionKey:`audit-breadth-${guard}`});
 if(!tx.ok)throw new Error(`purchase rejected: ${node.id} (${tx.reason})`);spent+=BigInt(tx.spent);meta=tx.meta;
}
const breadth=compileEvolution(meta),root=MEMORY_NODES.find((node)=>node.kind==='root');
let repeatMeta={...meta,echoBalance:'999999999999999999999999999999999999999999'};
const repeatLevels=[];
for(let i=0;i<9;i++){
 const before=evolutionLevel(repeatMeta,root.id),tx=purchaseEvolutionLevel(repeatMeta,root.id,{expectedLevel:before,expectedRevision:repeatMeta.revision,transactionKey:`audit-depth-${i}`});
 if(!tx.ok)throw new Error(`repeat purchase rejected at ${before}: ${tx.reason}`);repeatLevels.push({old:tx.oldLevel,next:tx.newLevel,cost:tx.spent});repeatMeta=tx.meta;
}
const hugeLevel=`1${'0'.repeat(256)}`;
const extremeMeta={...defaultMeta(),evolutionLevels:[{id:root.id,level:hugeLevel}]};
const compileAt=performance.now(),extreme=compileEvolution(extremeMeta),extremeCompileMs=performance.now()-compileAt;
const sampledTargets=['1','2','3','10','1000000',hugeLevel];
const sampledCosts=sampledTargets.map((level)=>({level,cost:evolutionCostForTargetLevel(root,level)}));
const monotone=sampledCosts.every((row,index)=>index===0||BigInt(row.cost)>BigInt(sampledCosts[index-1].cost));
const migrated=validateMeta({schema:8,memoryGraphVersion:4,memoryNodes:LEGACY_MEMORY_MANIFEST.map((row)=>row.oldId),echoBalance:17});
const migrationStable=validateMeta(JSON.parse(JSON.stringify(migrated)));
const degreeCounts=Object.fromEntries([...new Set(topo.degree)].map((degree)=>[degree,[...topo.degree].filter((value)=>value===degree).length]));
const effectsFinite=Object.values(extreme.effects).every((value)=>Number.isFinite(value)&&value>0&&value<10);
const report={
 versions:EVOLUTION_COMPILER_VERSIONS,
 topology:{frequency:5,cells:topo.nodeCount,boundaries:topo.edgeCount,pentagons:degreeCounts[5]??0,hexagons:degreeCounts[6]??0,atlasValid:atlas.valid,graphValid:graph.valid},
 levelOne:{cells:normalizeEvolutionLevels(meta).length,spent:String(spent),worldPotential:breadth.worldPotential,evolutionPower:breadth.evolutionPower,builds:breadth.activeBuilds.length},
 repeat:{cellId:root.id,finalLevel:evolutionLevel(repeatMeta,root.id),purchases:repeatLevels,costsMonotone:repeatLevels.every((row,index)=>index===0||BigInt(row.cost)>BigInt(repeatLevels[index-1].cost))},
 directExtreme:{digits:hugeLevel.length,compileMs:Number(extremeCompileMs.toFixed(3)),worldPotentialDigits:extreme.worldPotential.length,evolutionDepthDigits:extreme.evolutionDepth.length,effectsFinite,cache:evolutionCompileCacheDiagnostics()},
 costSamples:sampledCosts,costSamplesMonotone:monotone,
 builds:{recipes:BUILD_RECIPES.length,activeAtBreadth:breadth.activeBuilds.map((build)=>build.id),distinctSignatures:new Set(BUILD_RECIPES.map((build)=>JSON.stringify([build.mechanicalEffects,build.capabilities,build.transformations]))).size},
 migration:{legacyEntries:LEGACY_MEMORY_MANIFEST.length,migratedCells:migrated.evolutionLevels.length,allLevelOne:migrated.evolutionLevels.every((entry)=>entry.level==='1'),balance:migrated.echoBalance,idempotent:JSON.stringify(migrationStable)===JSON.stringify(migrated)},
 elapsedMs:Number((performance.now()-started).toFixed(1)),valid:false,
};
report.valid=report.topology.cells===252&&report.topology.boundaries===750&&report.topology.pentagons===12&&report.topology.hexagons===240
 &&report.topology.atlasValid&&report.topology.graphValid&&report.levelOne.cells===252&&report.levelOne.spent==='17820'
 &&report.levelOne.worldPotential==='1200000'&&report.repeat.finalLevel==='10'&&report.repeat.costsMonotone
 &&report.directExtreme.effectsFinite&&report.directExtreme.compileMs<100&&report.directExtreme.cache.bytes<=report.directExtreme.cache.byteLimit&&report.costSamplesMonotone
 &&report.builds.recipes>=16&&report.migration.migratedCells===252&&report.migration.allLevelOne&&report.migration.idempotent;
mkdirSync(new URL('../../reports',import.meta.url).pathname,{recursive:true});
writeFileSync(new URL('../../reports/evolution-level-audit.json',import.meta.url),JSON.stringify(report,null,2));
writeFileSync(new URL('../../reports/skill-audit.json',import.meta.url),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));if(!report.valid)process.exitCode=1;
