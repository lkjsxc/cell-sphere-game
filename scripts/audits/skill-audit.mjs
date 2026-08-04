#!/usr/bin/env node
/** Production-backed 252-Skill topology, economy, effect, and migration audit. */
import { mkdirSync, writeFileSync } from 'node:fs'; import { performance } from 'node:perf_hooks';
import { createGeodesicTopology } from '../../src/world/icosphere.js';
import { AFFINITY_METADATA_HASH, BUILD_RECIPES, EVOLUTION_CONTENT_HASH, MEMORY_NODES, MEMORY_NODE_IDS,
  WORLD_POTENTIAL_ANCHORS, availableMemoryNodes, compileMemory, memoryPurchasePreview,
  purchaseMemory, validateMemoryGraph } from '../../src/game/skills/index.js';
import { MEMORY_ATLAS_HASH, validateAtlasMapping } from '../../src/game/skills/atlas.js';
import { LEGACY_MEMORY_MANIFEST, LEGACY_MEMORY_MAPPING_HASH, LEGACY_MEMORY_SOURCE_HASH } from '../../src/game/skills/legacy-v4-manifest.js';
import { defaultMeta, validateMeta } from '../../src/platform/storage.js'; import { echoesFor } from '../../src/game/scoring.js';
const started = performance.now(); const topo = createGeodesicTopology(5); const graph = validateMemoryGraph(); const atlas = validateAtlasMapping();
let meta = { ...defaultMeta(), echoBalance: 1_000_000 }; let spent = 0; const impacts = []; const impactById = new Map(); const powerGains = []; const potentialDeltas = [];
while (meta.memoryNodes.length < MEMORY_NODES.length) {
  const node = availableMemoryNodes(meta)[0]; if (!node) throw new Error(`legal traversal stopped at ${meta.memoryNodes.length}`);
  const preview = memoryPurchasePreview(meta, node.id); const relative = preview.changes.map((change) => Math.abs(change.after - change.before) / Math.max(.000001, Math.abs(change.before)));
  const declared = ['conditional'].includes(node.effect.type) ? Math.abs(node.effect.value - 1)
    : node.effect.type === 'scalar' && node.effect.operation === 'add' ? Math.abs(node.effect.value) : 0;
  const impact = relative.length ? Math.max(...relative) : node.effect.type === 'unlock' ? null : declared;
  impacts.push(impact); impactById.set(node.id, impact); powerGains.push(preview.powerGain); potentialDeltas.push(preview.potentialDelta);
  const transaction = purchaseMemory(meta, node.id); if (!transaction.ok) throw new Error(`purchase rejected: ${node.id}`); spent += transaction.spent; meta = transaction.meta;
}
const costs = MEMORY_NODES.map((node) => node.cost).sort((a,b)=>a-b); const numericImpacts = impacts.filter(Number.isFinite).sort((a,b)=>a-b);
const potential = potentialDeltas.slice().sort((a,b)=>a-b); const degreeCounts = Object.fromEntries([...new Set(topo.degree)].map((d)=>[d,[...topo.degree].filter((v)=>v===d).length]));
const fullLegacy = validateMeta({ schema:8, memoryGraphVersion:4, memoryNodes:LEGACY_MEMORY_MANIFEST.map((row)=>row.oldId), echoBalance:17 });
const repeatedLegacy = validateMeta(fullLegacy); const firstWorldEchoes = echoesFor(10000); let early = { ...defaultMeta(), echoBalance:firstWorldEchoes }; let firstWorldPurchases = 0;
while (availableMemoryNodes(early).length) { const tx=purchaseMemory(early,availableMemoryNodes(early)[0].id); if(!tx.ok)break;early=tx.meta;firstWorldPurchases++; }
const unlocked = compileMemory({ memoryNodes: MEMORY_NODE_IDS }); const belowMinimum = MEMORY_NODES.filter((node) => impactById.get(node.id) != null && impactById.get(node.id) < .0005 && node.effect.type !== 'unlock').map((node)=>node.id);
const report = { elapsedMs:Number((performance.now()-started).toFixed(1)), topology:{frequency:5,cells:topo.nodeCount,edges:topo.edgeCount,faces:topo.triCount,
  degree:degreeCounts,atlasHash:MEMORY_ATLAS_HASH,atlasValid:atlas.valid}, graph:{version:5,valid:graph.valid,errors:graph.errors,composition:graph.composition,
  branches:graph.branchCounts,reachable:graph.reachable}, economy:{totalCost:spent,cost:{min:costs[0],p25:q(costs,.25),median:q(costs,.5),p75:q(costs,.75),p95:q(costs,.95),max:costs.at(-1)},
  firstWorldEchoes,firstWorldPurchases,modeledCompletionHoursAt50EchoesPerWorld:Number((spent/50*300/3600).toFixed(1))},
  effects:{effectHash:graph.effectHash,impactFraction:{min:numericImpacts[0],p25:q(numericImpacts,.25),median:q(numericImpacts,.5),p75:q(numericImpacts,.75),max:numericImpacts.at(-1)},
    belowMinimum,finite:Object.values(unlocked.effects).every((value)=>Number.isFinite(value)&&value>0&&value<10),resonanceCurves:unlocked.resonanceCurves.length},
  content:{version:graph.contentVersion,affinityHash:AFFINITY_METADATA_HASH,contentHash:EVOLUTION_CONTENT_HASH,
    affinities:graph.branchCounts,nodesWithCompleteMetadata:MEMORY_NODES.filter((node)=>node.affinity&&node.secondaryTags.length&&node.tradeoff&&node.buildContributions.length).length},
  potential:{version:unlocked.potentialVersion,fresh:16000,fullPower:unlocked.evolutionPower,full:unlocked.worldPotential,anchors:WORLD_POTENTIAL_ANCHORS,
    firstRoot:memoryPurchasePreview({memoryNodes:[]},MEMORY_NODES.find((node)=>node.kind==='root').id),powerGain:{min:Math.min(...powerGains),max:Math.max(...powerGains)},
    gain:{min:potential[0],median:q(potential,.5),p95:q(potential,.95),max:potential.at(-1)}},
  builds:{recipes:BUILD_RECIPES.length,activeAtFull:unlocked.activeBuilds.map((build)=>build.id),capabilities:unlocked.buildCapabilities,
    transformations:unlocked.transformations,distinctSignatures:new Set(BUILD_RECIPES.map((build)=>JSON.stringify([build.mechanicalEffects,build.capabilities,build.transformations]))).size},
  habitats:unlocked.habitatCapabilities,migration:{entries:LEGACY_MEMORY_MANIFEST.length,sourceHash:LEGACY_MEMORY_SOURCE_HASH,mappingHash:LEGACY_MEMORY_MAPPING_HASH,
    targets:new Set(LEGACY_MEMORY_MANIFEST.map((row)=>row.targetId)).size,fullOwned:fullLegacy.memoryNodes.length,legacyOwned:fullLegacy.legacyMemoryNodes.length,
    refund:fullLegacy.echoBalance-17,idempotentBalance:repeatedLegacy.echoBalance}, valid:graph.valid&&atlas.valid&&spent===17820&&belowMinimum.length===0
    &&unlocked.evolutionPower===384&&unlocked.worldPotential===1200000&&unlocked.activeBuilds.length===16
    &&fullLegacy.memoryNodes.length===252&&repeatedLegacy.echoBalance===fullLegacy.echoBalance };
mkdirSync(new URL('../../reports',import.meta.url).pathname,{recursive:true});writeFileSync(new URL('../../reports/skill-audit.json',import.meta.url),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));if(!report.valid)process.exitCode=1;
function q(values,p){return values[Math.min(values.length-1,Math.floor((values.length-1)*p))]}
