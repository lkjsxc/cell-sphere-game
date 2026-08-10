/** Exact levelled Evolution progression, effects, potential, and mastery. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashStringU32, hexU32 } from '../../src/core/hash.js';
import {
  BUILD_MASTERY_VERSION, BUILD_RECIPES, EVOLUTION_COST_VERSION, EVOLUTION_EFFECT_VERSION,
  EVOLUTION_LEVEL_VECTOR_VERSION, EVOLUTION_LEVEL_DOCUMENT_DIGIT_LIMIT, MEMORY_NODES, MEMORY_NODE_IDS, MEMORY_ROOT_IDS,
  WORLD_POTENTIAL_VERSION, availableMemoryNodes, canonicalEvolutionKey, compileEvolution,
  evolutionAffinitySummaries, evolutionCellState, evolutionCompileCacheDiagnostics,
  evolutionCostForTargetLevel, evolutionLevel, evolutionLevelVectorHash, nextEvolutionCost, normalizeEvolutionLevels,
  ownedEvolutionIds, previewEvolutionLevel, purchaseEvolutionLevel, resetEvolutionCompileCache,
  worldPotentialForBreadthAndDepth,
} from '../../src/game/skills/index.js';

const levels = (entries) => ({ evolutionLevels: entries, echoBalance: '0', revision: '0' });
const fullLevelOne = () => MEMORY_NODE_IDS.map((id) => ({ id, level: '1' }));
const digest = (value) => hexU32(hashStringU32(JSON.stringify(value)));

test('canonical sparse vectors normalize order, duplicates, zero, and unknowns', () => {
  const a = MEMORY_NODE_IDS[0]; const b = MEMORY_NODE_IDS[1];
  const normalized = normalizeEvolutionLevels({ evolutionLevels: [
    { id:b, level:'0002' }, { id:a, level:'2' }, { id:b, level:'3' },
    { id:a, level:'7' }, { id:'unknown-cell', level:'9' }, { id:MEMORY_NODE_IDS[2], level:'0' },
  ] });
  assert.deepEqual(normalized, [{ id:a, level:'7' }, { id:b, level:'3' }]);
  assert.equal(Object.isFrozen(normalized), true); assert.ok(normalized.every(Object.isFrozen));
  assert.deepEqual(normalizeEvolutionLevels({ retiredOwnership:[b, a, b, 'unknown-cell'] }), []);
  assert.deepEqual(normalizeEvolutionLevels({ evolutionLevels:[], retiredOwnership:[a] }), []);
  assert.deepEqual(ownedEvolutionIds({ evolutionLevels:[{ id:b, level:'1' }, { id:a, level:'2' }] }), [a,b]);
  assert.equal(canonicalEvolutionKey({ evolutionLevels:[{ id:b, level:'1' }, { id:a, level:'2' }] }),
    canonicalEvolutionKey({ evolutionLevels:[{ id:a, level:'2' }, { id:b, level:'1' }] }));
  assert.match(canonicalEvolutionKey({ evolutionLevels:[{ id:a, level:'2' }] }), /^evolution-levels:v1\|/);
  assert.equal(evolutionLevelVectorHash({ evolutionLevels:[{ id:b, level:'1' }, { id:a, level:'2' }] }),
    evolutionLevelVectorHash({ evolutionLevels:[{ id:a, level:'2' }, { id:b, level:'1' }] }));
  assert.deepEqual([EVOLUTION_LEVEL_VECTOR_VERSION, EVOLUTION_COST_VERSION, EVOLUTION_EFFECT_VERSION,
    BUILD_MASTERY_VERSION, WORLD_POTENTIAL_VERSION], [1,1,2,1,3]);
});

test('level 0, 1, 2, and thousand-digit levels remain exact without full Number conversion', () => {
  const id = MEMORY_NODE_IDS[0]; const huge = `9${'8'.repeat(999)}`;
  assert.equal(evolutionLevel({}, id), '0');
  assert.equal(evolutionLevel(levels([{ id, level:'1' }]), id), '1');
  assert.equal(evolutionLevel(levels([{ id, level:'2' }]), id), '2');
  assert.equal(evolutionLevel(levels([{ id, level:huge }]), id), huge);
  assert.equal(normalizeEvolutionLevels(levels([{ id, level:huge }]))[0].level.length, 1000);
});

test('document-width guard accepts the largest compilable level and rejects malformed wider input',()=>{
  const id=MEMORY_NODE_IDS[0],largest='9'.repeat(EVOLUTION_LEVEL_DOCUMENT_DIGIT_LIMIT),tooWide='9'.repeat(EVOLUTION_LEVEL_DOCUMENT_DIGIT_LIMIT+1);
  const compiled=compileEvolution({evolutionLevels:[{id,level:largest}]});
  assert.equal(compiled.totalEvolutionLevels,largest);assert.ok(compiled.worldPotential.length<=4096);
  assert.deepEqual(normalizeEvolutionLevels({evolutionLevels:[{id,level:tooWide}]}),[]);
});

test('direct exact cost is authored base*n^2 + power*n*(n-1), including above 2^53', () => {
  const node = MEMORY_NODES[0];
  assert.equal(evolutionCostForTargetLevel(node, '1'), String(node.cost));
  assert.equal(evolutionCostForTargetLevel(node, '2'), String(BigInt(node.cost) * 4n + BigInt(node.evolutionPower) * 2n));
  const n = 100_000_000n;
  const expected = BigInt(node.cost) * n * n + BigInt(node.evolutionPower) * n * (n - 1n);
  assert.ok(expected > BigInt(Number.MAX_SAFE_INTEGER));
  assert.equal(evolutionCostForTargetLevel(node, String(n)), String(expected));
  assert.equal(nextEvolutionCost(levels([{ id:node.id, level:String(n - 1n) }]), node.id), String(expected));
});

test('first unlock requires a root bootstrap or direct adjacency; owned cells are repeat-ready', () => {
  const root = MEMORY_NODES.find((node) => node.id === MEMORY_ROOT_IDS[0]);
  const nonRoot = MEMORY_NODES.find((node) => !MEMORY_ROOT_IDS.includes(node.id));
  assert.equal(evolutionCellState({ echoBalance:'100000' }, root.id, root.id).reason, 'ready');
  assert.equal(evolutionCellState({ echoBalance:'100000' }, nonRoot.id, nonRoot.id).reason, 'adjacency-required');
  const first=purchaseEvolutionLevel({echoBalance:'100000',revision:'0'},root.id,
    {expectedLevel:'0',expectedRevision:'0',transactionKey:'first-root'});
  assert.equal(first.ok, true); assert.equal(first.newLevel, '1');
  const adjacent = availableMemoryNodes(first.meta).find((state) => state.currentLevel === '0');
  assert.ok(adjacent); assert.equal(adjacent.adjacencyMet, true);
  const repeat = evolutionCellState(first.meta, root.id, root.id);
  assert.equal(repeat.owned, true); assert.equal(repeat.reachable, true); assert.equal(repeat.nextLevel, '2');
  assert.equal(repeat.reason, 'ready'); assert.equal(repeat.selectedReady, true);
});

test('one purchase changes one level, exact-debits, and canonicalizes revision', () => {
  const node = MEMORY_NODES[0]; const target = 100_000_000n; const oldLevel = String(target - 1n);
  const cost = evolutionCostForTargetLevel(node, String(target)); const balance = String(BigInt(cost) + 17n);
  const meta = { evolutionLevels:[{ id:node.id, level:oldLevel }], echoBalance:balance, revision:7 };
  const tx = purchaseEvolutionLevel(meta, node.id, { expectedLevel:oldLevel, expectedRevision:'7', transactionKey:'huge-1' });
  assert.equal(tx.ok, true); assert.equal(tx.reason, 'ready'); assert.equal(tx.oldLevel, oldLevel);
  assert.equal(tx.newLevel, String(target)); assert.equal(tx.spent, cost);
  assert.equal(tx.balanceBefore, balance); assert.equal(tx.balanceAfter, '17');
  assert.equal(tx.meta.echoBalance, '17'); assert.equal(tx.meta.revision, '8');
  assert.equal(evolutionLevel(tx.meta, node.id), String(target));
  assert.deepEqual(tx.meta.evolutionTransactionKeys, ['huge-1']);
  assert.deepEqual(tx.compilerVersions, { levels:1, cost:1, effects:2, mastery:1, potential:3 });
});

test('document security boundary rejects an unrepresentable successor without charging or throwing',()=>{
 const node=MEMORY_NODES[0],level='9'.repeat(1019),meta={evolutionLevels:[{id:node.id,level}],echoBalance:'9'.repeat(3000),revision:'0'};
 const state=evolutionCellState(meta,node.id,node.id);assert.equal(state.reason,'progression-security-boundary');
 assert.equal(state.nextLevel,null);assert.equal(state.nextCost,null);assert.equal(nextEvolutionCost(meta,node.id),null);
 assert.equal(previewEvolutionLevel(meta,node.id),null);assert.equal(availableMemoryNodes(meta).some((entry)=>entry.id===node.id),false);
 const tx=purchaseEvolutionLevel(meta,node.id,{expectedLevel:level,expectedRevision:'0',transactionKey:'boundary-upgrade'});
 assert.equal(tx.ok,false);assert.equal(tx.reason,'progression-security-boundary');assert.equal(tx.balanceAfter,meta.echoBalance);
});

test('stale and duplicate commands are idempotent and 32 transaction receipts stay bounded', () => {
  const root = MEMORY_ROOT_IDS[0]; const meta = { echoBalance:'100000', revision:'4',
    evolutionTransactionKeys:Array.from({ length:32 }, (_, index) => `old-${index}`) };
  assert.equal(purchaseEvolutionLevel(meta,root,{transactionKey:'missing'}).reason,'missing-precondition');
  assert.equal(purchaseEvolutionLevel(meta,root,{expectedLevel:'0',expectedRevision:'4',transactionKey:'x'.repeat(129)}).reason,'invalid-transaction-key');
  const staleLevel = purchaseEvolutionLevel(meta, root, { expectedLevel:'1', expectedRevision:'4', transactionKey:'stale-l' });
  assert.equal(staleLevel.reason, 'stale-level'); assert.equal(staleLevel.balanceAfter, '100000');
  const staleRevision = purchaseEvolutionLevel(meta, root, { expectedLevel:'0', expectedRevision:'3', transactionKey:'stale-r' });
  assert.equal(staleRevision.reason, 'stale-revision'); assert.equal(staleRevision.balanceAfter, '100000');
  const bought = purchaseEvolutionLevel(meta, root, { expectedLevel:'0', expectedRevision:'4', transactionKey:'new-key' });
  assert.equal(bought.ok, true); assert.equal(bought.meta.evolutionTransactionKeys.length, 32);
  assert.equal(bought.meta.evolutionTransactionKeys.at(-1), 'new-key');
  const duplicate = purchaseEvolutionLevel(bought.meta, root, { expectedLevel:'0', expectedRevision:'4', transactionKey:'new-key' });
  assert.equal(duplicate.reason, 'duplicate-transaction'); assert.equal(duplicate.balanceAfter, bought.meta.echoBalance);
  assert.equal(duplicate.meta, bought.meta);
  assert.equal(purchaseEvolutionLevel(meta, 'not-a-cell').reason, 'unknown-cell');
});

test('World Potential v3 preserves breadth anchors and applies its exact unlimited depth polynomial', () => {
  assert.equal(worldPotentialForBreadthAndDepth(0, '0'), '16000');
  assert.equal(worldPotentialForBreadthAndDepth(1, '0'), '19000');
  assert.equal(worldPotentialForBreadthAndDepth(384, '0'), '1200000');
  const d = 12345678901234567890n;
  const expected = 1200000n + 1000n*d + 8n*d*d + d**4n/1000000n;
  assert.equal(worldPotentialForBreadthAndDepth(384, String(d)), String(expected));
  assert.ok(BigInt(worldPotentialForBreadthAndDepth(384, String(d + 1n))) > expected);
});

test('all level-one effects, conditions, unlocks, resonance, habitats, and Builds retain v1 behavior', () => {
  const full = compileEvolution(levels(fullLevelOne()));
  assert.equal(full.breadthPower, 384); assert.equal(full.evolutionPower, 384);
  assert.equal(full.worldPotential, '1200000'); assert.equal(full.evolutionDepth, '0');
  assert.equal(full.activeBuilds.length, 16); assert.equal(BUILD_RECIPES.length, 16);
  assert.deepEqual(Object.fromEntries(['effects','conditionals','unlocks','resonanceCurves','habitatCapabilities',
    'buildEffects','buildCapabilities','transformations'].map((key) => [key,digest(full[key])])), {
    effects:'fd1978fc', conditionals:'abeb9c5f', unlocks:'a2253633', resonanceCurves:'73457525',
    habitatCapabilities:'ca69b790', buildEffects:'3f9404ab', buildCapabilities:'ff1a7d6d', transformations:'9c2d69e1',
  });
  assert.equal(digest(full.activeBuilds.map((build) => build.id)), 'f024d0fd');
  assert.equal(digest(full.activeBuilds.map((build) => build.mechanicalEffects)), '00703d2b');
  assert.ok(full.activeBuilds.every((build) => build.masteryRank === '1' && build.masteryRefinement === 0));
  const canonical = compileEvolution({ evolutionLevels:fullLevelOne() });
  assert.deepEqual({ effects:canonical.effects, conditionals:canonical.conditionals, unlocks:canonical.unlocks,
    resonance:canonical.resonanceCurves, builds:canonical.buildEffects, potential:canonical.worldPotential },
  { effects:full.effects, conditionals:full.conditionals, unlocks:full.unlocks,
    resonance:full.resonanceCurves, builds:full.buildEffects, potential:full.worldPotential });
});

test('level continuations and thousand-digit direct compilation are monotone, bounded, and finite', () => {
  const id = MEMORY_NODE_IDS[0]; const huge = `9${'8'.repeat(999)}`;
  const one = compileEvolution(levels([{ id, level:'1' }]));
  const two = compileEvolution(levels([{ id, level:'2' }]));
  const giant = compileEvolution(levels([{ id, level:huge }]));
  assert.ok(BigInt(two.worldPotential) > BigInt(one.worldPotential));
  assert.ok(BigInt(giant.worldPotential) > BigInt(two.worldPotential));
  assert.ok(giant.worldPotential.length > 3000);
  for (const value of [...Object.values(giant.effects), ...Object.values(giant.buildEffects)])
    assert.ok(Number.isFinite(value) && value >= 0.5 && value <= 2);
  assert.equal(giant.totalEvolutionLevels,huge);assert.equal(JSON.stringify(giant).includes('null'),false);
  const allHuge=compileEvolution(levels(MEMORY_NODE_IDS.map((cellId)=>({id:cellId,level:huge}))));
  assert.ok(allHuge.worldPotential.length>=3990&&allHuge.worldPotential.length<=4096);
  const cache=evolutionCompileCacheDiagnostics();assert.ok(cache.bytes<=cache.byteLimit);
  const preview = previewEvolutionLevel(levels([{ id, level:'1' }]), id);
  assert.equal(preview.oldLevel, '1'); assert.equal(preview.newLevel, '2');
  assert.ok(BigInt(preview.potentialAfter) > BigInt(preview.potentialBefore));
});

test('Build mastery is unlimited but protected by each distinct ingredient breadth requirement', () => {
  const rich = BUILD_RECIPES.find((build) => build.id === 'rich-rush');
  const oneFertility = MEMORY_NODES.find((node) => node.affinity === 'Fertility');
  const oneHigh = compileEvolution(levels([{ id:oneFertility.id, level:'999999999999999999999' }]));
  assert.equal(oneHigh.activeBuilds.some((build) => build.id === rich.id), false);
  const breadthWithOneHigh = fullLevelOne().map((entry) => entry.id === oneFertility.id
    ? { ...entry, level:'999999999999999999999' } : entry);
  const protectedBuild = compileEvolution(levels(breadthWithOneHigh)).activeBuilds.find((build) => build.id === rich.id);
  assert.equal(protectedBuild.masteryRank, '1');
  const unlimitedRank = '123456789012345678901234567890';
  const deep = compileEvolution(levels(MEMORY_NODE_IDS.map((id) => ({ id, level:unlimitedRank }))));
  assert.ok(deep.activeBuilds.every((build) => build.masteryRank === unlimitedRank));
  assert.ok(deep.activeBuilds.every((build) => build.nextMasteryRank === String(BigInt(unlimitedRank) + 1n)));
  assert.equal(new Set(deep.activeBuilds.map((build) => JSON.stringify(build.mechanicalEffects))).size, 16);
});

test('affinity summaries expose exact breadth, levels, weighted depth, defense, and minimum', () => {
  const first = MEMORY_NODES.find((node) => node.affinity === 'Fertility');
  const second = MEMORY_NODES.find((node) => node.affinity === 'Fertility' && node.id !== first.id);
  const summary = evolutionAffinitySummaries(levels([{ id:first.id, level:'5' }, { id:second.id, level:'2' }]))
    .find((entry) => entry.affinity === 'Fertility');
  assert.equal(summary.breadth, 2); assert.equal(summary.totalLevels, '7');
  assert.equal(summary.excessDepth, '5'); assert.equal(summary.minimumOwnedLevel, '2');
  const expectedDepth = BigInt(first.evolutionPower) * 4n + BigInt(second.evolutionPower);
  assert.equal(summary.depth, String(expectedDepth));
  assert.equal(summary.defenseRating, String(BigInt(summary.breadthPower) + expectedDepth));
});

test('compile cache is complete-keyed, bounded to 512 entries, and auditable', () => {
  resetEvolutionCompileCache(); const id = MEMORY_NODE_IDS[0];
  const first = compileEvolution(levels([{ id, level:'1' }]));
  assert.equal(compileEvolution(levels([{ id, level:'1' }])), first);
  for (let level = 2; level <= 530; level++) compileEvolution(levels([{ id, level:String(level) }]));
  const report = evolutionCompileCacheDiagnostics();
  assert.equal(report.limit,512);assert.equal(report.size,512);assert.ok(report.bytes<=report.byteLimit);
  assert.ok(report.hits>=1);assert.ok(report.evictions>=18);
});
