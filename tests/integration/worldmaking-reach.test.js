/** Production-backed late-build transformations and exact REACH 100 authority. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RunController } from '../../src/simulation/simulator.js';
import { compileMemory, MEMORY_NODE_IDS } from '../../src/game/skills/index.js';
import { REACH_100_REQUIRED_TICKS } from '../../src/simulation/lifecycle/reach-goal.js';

const full = compileMemory({ memoryNodes: MEMORY_NODE_IDS }); const fresh = compileMemory({ memoryNodes: [] });

test('full production build can sustain exact REACH 100 and still becomes extinct', { timeout: 20_000 }, () => {
  const controller = run(2693800525, full, 20); const result = controller.buildResult();
  assert.equal(result.reach100.achieved, true); assert.equal(result.reach100.requiredTicks, REACH_100_REQUIRED_TICKS);
  assert.equal(result.peakCoverage, 1); assert.ok(result.reach100.achievedTick > 0);
  assert.equal(controller.state.status, 'extinct'); assert.ok(result.tick > result.reach100.achievedTick);
  assert.ok(result.score <= 1_100_000); assert.ok(result.activeBuilds.includes('world-gardener'));
});

test('whole-cell transformations and electricity require production builds', { timeout: 30_000 }, () => {
  const developed = run(9099, full, 20).buildResult(); const untouched = run(9099, fresh, 1).buildResult();
  assert.ok(developed.transformedCells > 0); assert.ok(developed.reclaimedCells > 0);
  assert.ok(developed.glacialLakeCells > 0); assert.ok(developed.maritimeForestCells > 0);
  assert.ok(developed.everPoweredCells > 0); assert.ok(developed.poweredCellSeconds > 0);
  assert.ok(developed.glacialLakeCells <= 24); assert.ok(developed.maritimeForestCells <= 24);
  assert.equal(untouched.transformedCells, 0); assert.equal(untouched.everPoweredCells, 0);
  assert.ok(Math.abs(developed.resourceConservationError) < 1e-4);
});

function run(seed, memory, worldOrdinal) { const controller = new RunController({ seed, worldOrdinal,
  worldPotential: memory.worldPotential, evolutionPower: memory.evolutionPower, potentialVersion: memory.potentialVersion,
  memoryEffects: memory.effects, memoryConditionals: memory.conditionals, memoryUnlocks: memory.unlocks,
  habitatCapabilities: memory.habitatCapabilities, activeBuilds: memory.activeBuilds, buildEffects: memory.buildEffects });
  controller.start(); controller.advance(4000); return controller; }
