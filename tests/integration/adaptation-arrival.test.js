/** Weighted Adaptation presentation arrival-field contracts. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeAdaptationArrivals, ADAPTATION_ARRIVAL_VERSION,
  ADAPTATION_UNREACHABLE } from '../../src/core/adaptation-arrival.js';
import { createTopology } from '../../src/world/icosphere.js';
import { AdaptationPropagation } from '../../src/rendering/adaptation-propagation.js';
import { RunController } from '../../src/simulation/simulator.js';

function fields(count) {
  return { baseMoisture: new Float32Array(count).fill(.55),
    baseNutrient: new Float32Array(count).fill(.6), forestDensity: new Float32Array(count).fill(.3),
    freshwaterInfluence: new Float32Array(count), altitude: new Float32Array(count).fill(.4) };
}
function state(topo) {
  return { topo, originCell: 0, alive: new Uint8Array(topo.nodeCount).fill(1),
    biomass: new Float32Array(topo.nodeCount).fill(1), stress: new Float32Array(topo.nodeCount),
    energy: new Float32Array(topo.nodeCount).fill(2), fields: fields(topo.nodeCount), salt: 77 };
}
function line() {
  return { nodeCount: 5, edgeCount: 4, nodeStart: Uint32Array.from([0, 1, 3, 5, 7, 8]),
    nodeNeighbors: Uint16Array.from([1, 0, 2, 1, 3, 2, 4, 3]) };
}
function message(result) { return { ...result, arrivalVersion: result.version }; }

test('weighted arrivals are deterministic, distributed, and bounded', () => {
  const input = state(createTopology(2));
  const a = computeAdaptationArrivals({ ...input, category: 'reach' });
  const b = computeAdaptationArrivals({ ...input, category: 'reach' });
  assert.deepEqual(a.arrivals, b.arrivals);
  assert.equal(a.version, ADAPTATION_ARRIVAL_VERSION);
  assert.equal(a.arrivals[0], 0); assert.equal(a.minArrival, 0);
  assert.ok(a.affectedCount >= 12 && a.affectedCount <= Math.ceil(input.topo.nodeCount * .4));
  assert.ok(a.maxArrival <= 1600 && a.medianArrival > 0 && a.medianArrival < a.maxArrival);
  const values = new Set([...a.arrivals].filter((value) => value !== ADAPTATION_UNREACHABLE));
  assert.ok(values.size > 8, `arrival distribution too flat: ${values.size}`);
});

test('dead disconnections remain unreachable and low biomass changes travel time', () => {
  const topo = line(); const input = state(topo); input.alive[3] = 0;
  const blocked = computeAdaptationArrivals({ ...input, category: 'metabolism' });
  assert.equal(blocked.arrivals[0], 0); assert.notEqual(blocked.arrivals[2], ADAPTATION_UNREACHABLE);
  assert.equal(blocked.arrivals[3], ADAPTATION_UNREACHABLE);
  assert.equal(blocked.arrivals[4], ADAPTATION_UNREACHABLE);
  input.alive[3] = 1;
  const healthy = computeAdaptationArrivals({ ...input, category: 'metabolism' });
  input.biomass[1] = .05; input.energy[1] = 0;
  const starved = computeAdaptationArrivals({ ...input, category: 'metabolism' });
  assert.ok(starved.arrivals[1] > healthy.arrivals[1]);
  assert.ok(starved.arrivals[2] > healthy.arrivals[2]);
});

test('all six categories produce distinct state-sensitive paths', () => {
  const input = state(createTopology(2));
  for (let i = 0; i < input.topo.nodeCount; i++) {
    input.biomass[i] = .15 + (i % 9) / 10; input.energy[i] = (i % 7) / 2;
    input.stress[i] = (i % 8) / 9; input.fields.baseMoisture[i] = (i % 11) / 10;
    input.fields.forestDensity[i] = (i % 5) / 4; input.fields.freshwaterInfluence[i] = i % 13 === 0 ? 1 : 0;
  }
  const categories = ['reach', 'metabolism', 'resilience', 'transport', 'ecology', 'perception'];
  const signatures = categories.map((category) => {
    const result = computeAdaptationArrivals({ ...input, category });
    return `${result.affectedCount}:${result.medianArrival}:${result.maxArrival}:${[...result.arrivals].slice(0, 40).join(',')}`;
  });
  assert.equal(new Set(signatures).size, categories.length);
});

test('presentation queue retains two Uint16 fields and releases them', () => {
  const topo = createTopology(1); const input = state(topo);
  const wave = new AdaptationPropagation(topo);
  for (const category of ['reach', 'ecology', 'transport']) {
    wave.enqueue(message(computeAdaptationArrivals({ ...input, category })), 0, false);
  }
  assert.equal(wave.queueLength, 2);
  assert.equal(wave.retainedBytes, topo.nodeCount * 2 * 2);
  const frame = wave.frame(100); assert.ok(frame.timeMs < frame.maxArrival);
  wave.clear(); assert.equal(wave.retainedBytes, 0);
  const reduced = message(computeAdaptationArrivals({ ...input, category: 'perception' }));
  wave.enqueue(reduced, 0, true); assert.equal(wave.frame(0).reduced, true);
  assert.equal(wave.frame(421), null);
});

test('production selection emits a versioned exact-tick arrival field', () => {
  const selected = []; const run = new RunController({ seed: 24680 }, (event) => {
    if (event.t === 'adaptation-selected') selected.push(event);
  });
  run.start(); run.advance(450);
  assert.equal(selected.length, 1); const event = selected[0];
  assert.equal(event.tick, 450); assert.equal(event.arrivalVersion, ADAPTATION_ARRIVAL_VERSION);
  assert.ok(event.arrivals instanceof Uint16Array); assert.equal(event.arrivals.length, run.state.topo.nodeCount);
  assert.equal(event.arrivals[event.originCell], 0); assert.ok(event.affectedCount > 0);
});
