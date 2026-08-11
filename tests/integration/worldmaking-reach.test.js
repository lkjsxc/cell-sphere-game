/** Production-backed direct worldmaking/Luminous authority remains finite and eventually extinct. */
import { test } from 'node:test'; import assert from 'node:assert/strict';
import { RunController } from '../../src/simulation/simulator.js';
import { compileEvolution, evolutionRunConfiguration, MEMORY_NODE_IDS } from '../../src/game/skills/index.js';
const full = compileEvolution({ evolutionLevels: MEMORY_NODE_IDS.map((id) => ({ id, level: '1' })) }); const fresh = compileEvolution({ evolutionLevels: [] });
test('a mature direct Ecology build transforms whole cells, powers real cells, and still goes extinct', { timeout: 20_000 }, () => {
  const controller = run(9099, full, '20'); const result = controller.buildResult();
  assert.equal(controller.state.status, 'extinct'); assert.ok(result.peakCoverage > .1); assert.ok(result.transformedCells > 0); assert.ok(result.reclaimedCells > 0);
  assert.ok(result.glacialLakeCells <= 24); assert.ok(result.maritimeForestCells <= 24); assert.ok(result.everPoweredCells > 0); assert.ok(result.poweredCellSeconds > 0);
  assert.equal(result.luminousEnabled, true); assert.ok(Math.abs(result.resourceConservationError) < 1e-4);
});
test('fresh authority cannot fabricate worldmaking or Luminous charge', { timeout: 20_000 }, () => {
  const untouched = run(9099, fresh, '1').buildResult(); assert.equal(untouched.transformedCells, 0); assert.equal(untouched.everPoweredCells, 0);
  assert.equal(untouched.luminousEnabled, false); assert.equal(untouched.finalElectrifiedCells, 0);
});
function run(seed, evolution, worldOrdinal) { const controller = new RunController({ seed, worldOrdinal, ...evolutionRunConfiguration(evolution) });
  controller.start(); controller.advance(30_000); return controller; }
