/** Authoritative resource, habitat, observation, and terminal invariants. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RunController } from '../../../src/simulation/simulator.js';
import { selectInoculation } from '../../../src/simulation/state.js';
import { finalStateHash, recordHistory } from '../../../src/simulation/replay.js';
import { BALANCE as B } from '../../../src/game/balance.js';
import { createRng } from '../../../src/core/prng.js';
import { LIFE_STATE } from '../../../src/core/life-state.js';
import { snapshotTransfers } from '../../../src/simulation/snapshot.js';
import { runGrowth } from '../../../src/simulation/lifecycle/growth.js';
import { BIOME } from '../../../src/world/fields.js';

function run(seed = 4242, cfg = {}, emit = () => {}) {
  const controller = new RunController({ seed, worldOrdinal: 1, worldPotential: 16000, ...cfg }, emit);
  controller.start(); return controller;
}
function finish(controller) { controller.advance(B.RUN_HARD_MAX_TICKS + 50); assert.equal(controller.state.status, 'extinct'); return controller.buildResult(); }

test('resource authority remains finite and bounded through growth', () => {
  const controller = run(); controller.advance(500); const state = controller.state; let alive = 0;
  for (let i = 0; i < state.topo.nodeCount; i++) {
    for (const value of [state.biomass[i], state.energy[i], state.nutrient[i], state.resourceReserve[i], state.stress[i]]) assert.ok(Number.isFinite(value));
    assert.ok(state.biomass[i] >= 0 && state.nutrient[i] >= 0 && state.nutrient[i] <= 1);
    assert.ok(state.resourceReserve[i] >= 0 && state.stress[i] >= 0 && state.stress[i] <= 1); alive += state.alive[i];
  }
  assert.equal(state.aliveCount, alive); assert.ok(alive > 10); assert.ok(state.resourceTransferred > 0);
});

test('presentation snapshot remains observational and compact', () => {
  const controller = run(); const state = controller.state; const snapshot = controller.snapshot();
  for (const key of Object.keys(snapshot)) assert.doesNotMatch(key, /edgeActive|conductance|flux|nutrient|resourceReserve/);
  assert.equal(snapshot.lifeState[state.inoculationCell], LIFE_STATE.FRONTIER);
  const transfers = snapshotTransfers(snapshot); assert.deepEqual(transfers, [snapshot.biomass.buffer, snapshot.stress.buffer,
    snapshot.alive.buffer, snapshot.lifeState.buffer, snapshot.eventStrength.buffer, snapshot.eventFamily.buffer,
    snapshot.resourceRichnessQ.buffer, snapshot.reserveFractionQ.buffer, snapshot.resourceState.buffer,
    snapshot.transformationState.buffer, snapshot.electricityQ.buffer]);
  assert.equal(transfers.reduce((sum, buffer) => sum + buffer.byteLength, 0), state.topo.nodeCount * 17);
});

test('fresh worlds have no harmful events and world three schedules one late mild pressure', () => {
  assert.equal(run(8, { worldOrdinal: 1 }).state.events.length, 0);
  assert.equal(run(8, { worldOrdinal: 2 }).state.events.length, 0);
  const events = run(8, { worldOrdinal: 3 }).state.events;
  assert.equal(events.length, 1); assert.equal(events[0].crisis, true); assert.ok(events[0].startTick >= 2100);
  assert.ok(events[0].intensity >= .5 && events[0].intensity <= .7);
});

test('locked habitat rejection happens before growth RNG consumption', () => {
  const controller = run(99); const state = controller.state; const source = state.inoculationCell;
  state.energy[source] = 20;
  for (let offset = state.topo.nodeStart[source]; offset < state.topo.nodeStart[source + 1]; offset++) {
    const target = state.topo.nodeNeighbors[offset]; state.fields.biomeId[target] = BIOME.DEEP_OCEAN;
    state.effectiveBiome[target] = BIOME.DEEP_OCEAN; state.nutrient[target] = 1;
  }
  const before = state.simRng.state(); runGrowth(state); assert.deepEqual(state.simRng.state(), before);
  assert.ok(state.habitatBlocked.some((value) => value > 0));
});

test('terminal snapshot is emitted before the extinction result', () => {
  const messages = []; const controller = run(31337, {}, (message) => messages.push(message)); const result = finish(controller);
  const extinctIndex = messages.findIndex((message) => message.t === 'extinct');
  const terminalIndex = messages.findLastIndex((message, index) => index < extinctIndex && message.t === 'snapshot');
  assert.ok(terminalIndex >= 0 && terminalIndex < extinctIndex); const snapshot = messages[terminalIndex];
  assert.equal(snapshot.status, 'extinct'); assert.equal(snapshot.metrics.aliveCount, 0); assert.equal(snapshot.alive.some(Boolean), false);
  assert.equal(result.finalLivingCount, 0); assert.equal(snapshot.tick, result.tick);
});

test('inspection and result projections do not mutate authority or RNG', () => {
  const controller = run(14); controller.advance(100); const state = controller.state;
  const before = { rng: [state.simRng, state.eventRng, state.inoculationRng].map((rng) => rng.state()),
    replay: JSON.stringify(state.replay), history: JSON.stringify(state.history), biomass: state.biomass.slice() };
  const cell = controller.inspectCell(state.inoculationCell); assert.equal(cell.node, state.inoculationCell);
  controller.snapshot(); controller.buildResult(); assert.deepEqual(state.biomass, before.biomass);
  assert.deepEqual([state.simRng, state.eventRng, state.inoculationRng].map((rng) => rng.state()), before.rng);
  assert.equal(JSON.stringify(state.replay), before.replay); assert.equal(JSON.stringify(state.history), before.history);
});

test('inoculation is seeded, varied, and prefers land metadata', () => {
  const cells = new Set(Array.from({ length: 16 }, (_, seed) => new RunController({ seed }).state.inoculationCell)); assert.ok(cells.size > 1);
  const fields = { baseNutrient: Float32Array.of(1, .8, .7), baseTemp: Float32Array.of(.6, .6, .6),
    baseMoisture: Float32Array.of(.55, .55, .55), sources: [0, 1], landMask: Uint8Array.of(0, 1, 1) };
  assert.equal(selectInoculation(fields, createRng(1)), 1);
});

test('history cap coalesces deterministically and reserves extinction', () => {
  const state = { tick: 0, history: [], topo: { nodeCount: 2562 } };
  for (let i = 0; i < 100; i++) { state.tick = i; recordHistory(state, `event-${i}`); }
  recordHistory(state, 'run-extinct', { cause: 'test' }); assert.equal(state.history.length, 80); assert.equal(state.history.at(-1).type, 'run-extinct');
});

test('final hash folds finite reserves and world era', () => {
  const controller = run(15); controller.advance(100); const before = finalStateHash(controller.state);
  controller.state.resourceReserve[0] = Math.fround(controller.state.resourceReserve[0] + .1);
  assert.notEqual(finalStateHash(controller.state), before);
});
