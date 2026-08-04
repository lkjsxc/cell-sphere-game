/** Evolution Power v2, affinity content, and visible Build contracts. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BUILD_RECIPES, EVOLUTION_POWER_BY_KIND, FULL_EVOLUTION_POWER, MEMORY_NODES, MEMORY_NODE_IDS,
  MEMORY_ROOT_IDS, WORLD_POTENTIAL_ANCHORS, availableMemoryNodes, compileBuilds, compileMemory,
  memoryPurchasePreview, purchaseMemory, worldPotentialForPower } from '../../src/game/skills/index.js';

test('World Potential v2 has exact monotone anchors and finite bounded interpolation', () => {
  for (const anchor of WORLD_POTENTIAL_ANCHORS) assert.equal(worldPotentialForPower(anchor.power), anchor.potential);
  let previous = 0;
  for (let power = 0; power <= FULL_EVOLUTION_POWER; power++) {
    const potential = worldPotentialForPower(power); assert.ok(Number.isFinite(potential)); assert.ok(potential >= previous); previous = potential;
  }
  assert.equal(worldPotentialForPower(Number.NaN), 16000); assert.equal(worldPotentialForPower(Infinity), 16000);
  assert.equal(worldPotentialForPower(-10), 16000); assert.equal(worldPotentialForPower(9999), 1200000);
  assert.deepEqual(EVOLUTION_POWER_BY_KIND, { root:1, resonance:1, major:2, conditional:2, unlock:3, capability:3, keystone:5, capstone:8 });
});

test('first roots are branch-neutral and cannot increase potential by more than 25%', () => {
  const previews = MEMORY_ROOT_IDS.map((id) => memoryPurchasePreview({ memoryNodes: [] }, id));
  assert.deepEqual(new Set(previews.map((preview) => `${preview.powerAfter}:${preview.potentialAfter}`)), new Set(['1:19000']));
  assert.ok(previews.every((preview) => preview.potentialAfter / preview.potentialBefore <= 1.25));
});

test('legal purchase traversals are monotone and ownership compilation is order-independent', () => {
  for (const select of [(nodes) => nodes[0], (nodes) => nodes.at(-1)]) {
    let meta = { memoryNodes: [], echoBalance: 1_000_000 }; let previousPower = 0; let previousPotential = 16000;
    while (meta.memoryNodes.length < MEMORY_NODES.length) {
      const node = select(availableMemoryNodes(meta)); assert.ok(node); const transaction = purchaseMemory(meta, node.id); assert.equal(transaction.ok, true);
      const compiled = compileMemory(transaction.meta); assert.ok(compiled.evolutionPower > previousPower); assert.ok(compiled.worldPotential >= previousPotential);
      previousPower = compiled.evolutionPower; previousPotential = compiled.worldPotential; meta = transaction.meta;
    }
    assert.equal(previousPower, FULL_EVOLUTION_POWER); assert.equal(previousPotential, 1200000);
  }
  const ownership = MEMORY_NODE_IDS.filter((_, index) => index % 3 === 0);
  const forward = compileMemory({ memoryNodes: ownership }); const reverse = compileMemory({ memoryNodes: [...ownership].reverse() });
  assert.deepEqual({ power:forward.evolutionPower, potential:forward.worldPotential, effects:forward.effects,
    builds:forward.activeBuilds.map((build) => build.id) }, { power:reverse.evolutionPower, potential:reverse.worldPotential,
    effects:reverse.effects, builds:reverse.activeBuilds.map((build) => build.id) });
});

test('all visible Build ingredients exist and compile to distinct mechanical signatures', () => {
  const full = compileBuilds(MEMORY_NODES); assert.equal(BUILD_RECIPES.length, 16); assert.equal(full.activeBuilds.length, 16);
  const affinities = new Set(MEMORY_NODES.map((node) => node.affinity)); const tags = new Set(MEMORY_NODES.flatMap((node) => node.secondaryTags));
  for (const recipe of BUILD_RECIPES) {
    assert.ok(recipe.requiredAffinities.every((part) => affinities.has(part.id)));
    assert.ok(recipe.requiredTags.every((part) => tags.has(part.id)));
    assert.ok(Object.keys(recipe.mechanicalEffects).length > 0); assert.ok(recipe.tradeoffs.length > 0); assert.ok(recipe.habitats.length > 0);
  }
  const signatures = full.activeBuilds.map((build) => JSON.stringify({ effects:build.mechanicalEffects,
    capabilities:build.capabilities, transformations:build.transformations }));
  assert.equal(new Set(signatures).size, BUILD_RECIPES.length);
  assert.ok(Object.values(full.buildEffects).every((value) => Number.isFinite(value) && value >= 0.5 && value <= 2));
});

test('Build progress is visible with exact missing ingredients before activation', () => {
  const fertilityRoot = MEMORY_NODES.find((node) => node.kind === 'root' && node.affinity === 'Fertility');
  const freshwaterRoot = MEMORY_NODES.find((node) => node.kind === 'root' && node.affinity === 'Freshwater');
  const near = compileBuilds([fertilityRoot, freshwaterRoot]); const lakeGarden = near.nearBuilds.find((build) => build.id === 'lake-garden');
  assert.ok(lakeGarden); assert.equal(lakeGarden.progress, 0.75); assert.deepEqual(lakeGarden.missing.map((part) => part.id), ['soil-building']);
  const soil = MEMORY_NODES.find((node) => node.affinity === 'Fertility' && node.secondaryTags.includes('soil-building'));
  const active = compileBuilds([fertilityRoot, freshwaterRoot, soil]).activeBuilds.find((build) => build.id === 'lake-garden');
  assert.ok(active); assert.equal(active.progress, 1); assert.deepEqual(active.missing, []);
});
