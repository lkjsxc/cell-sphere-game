/** Local resource authority, access, presentation, and conservation contracts. */
import { test } from 'node:test'; import assert from 'node:assert/strict';
import { RunController } from '../../../src/simulation/simulator.js';
import { runGrowth } from '../../../src/simulation/lifecycle/growth.js';
import { resourceConservation, resourceRichnessAt, RESOURCE_STATE, updateResourceEcology } from '../../../src/simulation/resource-ecology.js';

function run(seed = 42, cfg = {}) { const c = new RunController({ seed, worldOrdinal: 1, worldPotential: 16000, ...cfg }); c.start(); return c; }

test('immutable per-cell baselines survive local consumption', () => {
  const c = run(); const available = c.state.initialAvailableNutrient.slice(); const reserve = c.state.initialResourceReserve.slice();
  c.advance(600); assert.deepEqual(c.state.initialAvailableNutrient, available); assert.deepEqual(c.state.initialResourceReserve, reserve);
  assert.notDeepEqual(c.state.nutrient, available); assert.notDeepEqual(c.state.resourceReserve, reserve);
});

test('richness is local and global time alone cannot recolor a cell', () => {
  const s = run(7).state; const cell = s.inoculationCell; const before = resourceRichnessAt(s, cell);
  s.tick += 1000; s.entropy = 1; assert.equal(resourceRichnessAt(s, cell), before);
  s.nutrient[cell] = 0; s.resourceReserve[cell] = 0; assert.ok(resourceRichnessAt(s, cell) < before);
});

test('naturally poor and once-rich exhausted cells have distinct stable states', () => {
  const s = run(99).state; let rich = -1; let barren = -1;
  for (let cell = 0; cell < s.topo.nodeCount; cell++) {
    if (rich < 0 && s.initialResourceRichness[cell] >= .72) rich = cell;
    if (barren < 0 && s.initialResourceRichness[cell] < .28) barren = cell;
  }
  assert.ok(rich >= 0 && barren >= 0); s.nutrient[rich] = 0; s.resourceReserve[rich] = 0;
  updateResourceEcology(s); assert.equal(s.resourceState[rich], RESOURCE_STATE.EXHAUSTED);
  assert.equal(s.resourceState[barren], RESOURCE_STATE.POOR);
});

test('resource-inaccessible frontier is rejected before growth RNG', () => {
  const s = run(101).state; const source = s.inoculationCell; s.energy[source] = 20;
  for (let offset = s.topo.nodeStart[source]; offset < s.topo.nodeStart[source + 1]; offset++) {
    const target = s.topo.nodeNeighbors[offset]; s.nutrient[target] = 0; s.resourceReserve[target] = 0;
  }
  updateResourceEcology(s); const before = s.simRng.state(); runGrowth(s);
  assert.deepEqual(s.simRng.state(), before); assert.ok(s.resourceBlocked.some(Boolean));
});

test('full runs reconcile finite stock and pack five bounded ecology bytes', () => {
  const c = run(31337); c.advance(5000); const proof = resourceConservation(c.state); const snapshot = c.snapshot();
  assert.ok(Math.abs(proof.error) < 1e-6, JSON.stringify(proof));
  for (const key of ['resourceRichnessQ', 'reserveFractionQ', 'resourceState', 'transformationState', 'electricityQ']) {
    assert.equal(snapshot[key].length, c.state.topo.nodeCount); assert.ok(snapshot[key] instanceof Uint8Array);
  }
});

test('inoculation selects a fertile connected-niche candidate', () => {
  for (let seed = 1; seed <= 20; seed++) { const s = run(seed).state;
    assert.ok(s.initialResourceRichness[s.inoculationCell] >= .56, `${seed}: ${s.initialResourceRichness[s.inoculationCell]}`); }
});
