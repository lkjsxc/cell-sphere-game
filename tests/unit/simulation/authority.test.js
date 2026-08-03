/** Authoritative state, passive evolution, observation, and history invariants. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RunController } from '../../../src/simulation/simulator.js';
import { selectInoculation } from '../../../src/simulation/state.js';
import { offerAdaptation } from '../../../src/simulation/summary.js';
import { finalStateHash, recordHistory } from '../../../src/simulation/replay.js';
import { BALANCE as B } from '../../../src/game/balance.js';
import { createRng } from '../../../src/core/prng.js';
import { LIFE_STATE } from '../../../src/core/life-state.js';
import { snapshotTransfers } from '../../../src/simulation/snapshot.js';
import { executeAdaptationSelection } from '../../../src/simulation/protocol/adaptation-command.js';

function run(seed = 4242, mode = 'random', emit = () => {}) {
  const controller = new RunController({ seed, adaptationMode: mode }, emit);
  controller.start();
  return controller;
}

function finish(controller) {
  let guard = 0;
  while (controller.state.status !== 'extinct' && guard++ < 5000) controller.advance(40);
  assert.equal(controller.state.status, 'extinct');
  return controller.buildResult();
}

test('500 ticks preserve typed-array invariants and growth', () => {
  const controller = run();
  controller.advance(500);
  const state = controller.state;
  let alive = 0;
  for (let i = 0; i < state.topo.nodeCount; i++) {
    for (const value of [state.biomass[i], state.energy[i], state.nutrient[i], state.stress[i]]) {
      assert.ok(Number.isFinite(value));
    }
    assert.ok(state.biomass[i] >= 0 && state.nutrient[i] >= 0 && state.nutrient[i] <= 1);
    assert.ok(state.stress[i] >= 0 && state.stress[i] <= 1);
    alive += state.alive[i];
  }
  assert.equal(state.aliveCount, alive);
  assert.ok(alive > 10);
  for (let edge = 0; edge < state.topo.edgeCount; edge++) {
    assert.ok(state.conductance[edge] >= 0 && state.conductance[edge] <= B.COND_MAX);
    assert.ok(state.edgePeak[edge] >= state.conductance[edge]);
  }
});

test('presentation snapshots omit route authority and expose compact cell semantics', () => {
  const controller = run();
  const state = controller.state;
  assert.equal(controller.placeSignal, undefined);
  for (const key of Object.keys(state)) assert.doesNotMatch(key, /signal|draft/i);
  for (const key of Object.keys(B)) assert.doesNotMatch(key, /signal|draft/i);
  const snapshot = controller.snapshot();
  for (const key of Object.keys(snapshot)) assert.doesNotMatch(key, /signal|edgeActive|conductance|flux|nutrient/i);
  assert.ok(state.edgeActive instanceof Uint8Array && state.conductance instanceof Float32Array);
  assert.equal(snapshot.lifeState.length, state.topo.nodeCount);
  assert.equal(snapshot.lifeState[state.inoculationCell], LIFE_STATE.FRONTIER);
  const transfers = snapshotTransfers(snapshot);
  assert.deepEqual(transfers, [snapshot.biomass.buffer, snapshot.stress.buffer,
    snapshot.alive.buffer, snapshot.lifeState.buffer, snapshot.eventStrength.buffer, snapshot.eventFamily.buffer]);
  assert.equal(transfers.reduce((sum, buffer) => sum + buffer.byteLength, 0), state.topo.nodeCount * 12);
  assert.ok(['idle', 'running', 'extinct'].includes(state.status));
});

test('manual offers remain pending while ticks continue', () => {
  const messages = [];
  const controller = run(8, 'manual', (message) => messages.push(message.t));
  controller.advance(B.ADAPTATION_OFFER_TICKS[0] + 25);
  assert.equal(controller.state.tick, 475);
  assert.equal(controller.state.status, 'running');
  assert.equal(controller.state.adaptationOffers[0].resolvedTick, null);
  controller.advance(100);
  assert.equal(controller.state.tick, 575);
  assert.ok(messages.includes('adaptation-offered'));
  const snapshot = controller.snapshot();
  assert.equal(snapshot.pendingAdaptations, 1);
  assert.equal(snapshot.adaptationMode, 'manual');
});

test('random offers emit offered then selected and apply at offer tick', () => {
  const messages = [];
  const controller = run(9, 'random', (message) => messages.push(message));
  controller.advance(450);
  const relevant = messages.filter((message) => message.t.startsWith('adaptation-'));
  assert.deepEqual(relevant.map((message) => message.t), ['adaptation-offered', 'adaptation-selected']);
  const offer = controller.state.adaptationOffers[0];
  assert.equal(offer.offerTick, 450);
  assert.equal(offer.resolvedTick, 450);
  assert.equal(offer.selectionMode, 'random');
  assert.equal(controller.state.ownedCards.length, 1);
});

test('manual selection validates offer/card and applies exactly once', () => {
  const controller = run(10, 'manual');
  controller.advance(450);
  const offer = controller.state.adaptationOffers[0];
  assert.throws(() => controller.chooseAdaptation(99, offer.options[0]), /unknown/);
  assert.throws(() => controller.chooseAdaptation(offer.id, 'not-a-card'), /not in/);
  assert.equal(controller.chooseAdaptation(offer.id, offer.options[1]), true);
  assert.equal(offer.resolvedTick, 450);
  assert.throws(() => controller.chooseAdaptation(offer.id, offer.options[1]), /already resolved/);
  assert.equal(controller.state.ownedCards.length, 1);
});

test('stale Manual intent is rejected with the current authoritative offer', () => {
  const controller = run(10, 'manual'); controller.advance(450); const offer = controller.state.adaptationOffers[0]; controller.state.adaptationMode = 'random';
  const rejected = executeAdaptationSelection(controller, { t: 'choose-adaptation', protocolVersion: 2, runId: 1, commandId: 9,
    offerId: offer.id, offerVersion: offer.offerVersion, cardId: offer.options[0] }, 1);
  assert.equal(rejected.reason, 'mode-not-manual'); assert.equal(rejected.currentOffer.id, offer.id);
});

test('mode toggles drain pending FIFO at no more than one per tick', () => {
  const controller = run(11, 'manual');
  controller.advance(1360);
  assert.equal(controller.state.adaptationOffers.filter((offer) => offer.resolvedTick == null).length, 3);
  assert.throws(() => controller.setAdaptationMode('auto'), /invalid/);
  assert.equal(controller.setAdaptationMode('random'), true);
  assert.equal(controller.state.adaptationOffers.filter((offer) => offer.resolvedTick != null).length, 1);
  assert.equal(controller.resolveNextRandomOffer(), false);
  controller.advance(1);
  assert.equal(controller.state.adaptationOffers.filter((offer) => offer.resolvedTick != null).length, 2);
  controller.setAdaptationMode('manual');
  controller.advance(1);
  assert.equal(controller.state.adaptationOffers.filter((offer) => offer.resolvedTick != null).length, 2);
});

test('offer queue is bounded at eight fixed records', () => {
  const controller = new RunController({ seed: 12, adaptationMode: 'manual' });
  for (let i = 0; i < 10; i++) {
    controller.state.tick = i;
    offerAdaptation(controller.state, () => {}, 'test');
  }
  assert.equal(controller.state.adaptationOffers.length, B.ADAPTATION_QUEUE_CAP);
  for (const offer of controller.state.adaptationOffers) {
    assert.equal(offer.options.length, 3);
    assert.ok(Object.isFrozen(offer.options));
  }
});

test('manual extinction preserves unresolved offers and semantic history', () => {
  const result = finish(run(31337, 'manual'));
  assert.ok(result.offers.length > 0);
  assert.ok(result.offers.every((offer) => offer.resolvedTick == null));
  assert.equal(result.history.at(-1).type, 'run-extinct');
  assert.ok(result.history.some((event) => event.type === 'adaptation-unresolved'));
  assert.ok(result.history.some((event) => event.type === 'event-telegraph'));
  assert.ok(result.history.length <= 80);
});

test('inspection and result/snapshot queries do not mutate authority or RNG', () => {
  const controller = run(14, 'manual');
  controller.advance(100);
  const state = controller.state;
  const before = {
    rng: [state.simRng, state.eventRng, state.contentRng, state.decisionRng, state.inoculationRng]
      .map((rng) => rng.state()),
    replay: JSON.stringify(state.replay), history: JSON.stringify(state.history),
    biomass: state.biomass.slice(),
  };
  const cell = controller.inspectCell(state.inoculationCell);
  assert.equal(cell.node, state.inoculationCell);
  controller.snapshot();
  controller.buildResult();
  assert.deepEqual(state.biomass, before.biomass);
  assert.deepEqual([state.simRng, state.eventRng, state.contentRng, state.decisionRng, state.inoculationRng]
    .map((rng) => rng.state()), before.rng);
  assert.equal(JSON.stringify(state.replay), before.replay);
  assert.equal(JSON.stringify(state.history), before.history);
  assert.throws(() => controller.inspectCell(-1), /invalid cell/);
});

test('inoculation is seeded, varied, and prefers future land metadata', () => {
  const cells = new Set(Array.from({ length: 16 }, (_, seed) =>
    new RunController({ seed }).state.inoculationCell));
  assert.ok(cells.size > 1);
  const fields = {
    baseNutrient: Float32Array.of(1, 0.8, 0.7), baseTemp: Float32Array.of(0.6, 0.6, 0.6),
    baseMoisture: Float32Array.of(0.55, 0.55, 0.55), sources: [0, 1], landMask: Uint8Array.of(0, 1, 1),
  };
  assert.equal(selectInoculation(fields, createRng(1)), 1);
});

test('history cap coalesces deterministically and reserves extinction', () => {
  const state = { tick: 0, history: [] };
  for (let i = 0; i < 100; i++) { state.tick = i; recordHistory(state, `event-${i}`); }
  recordHistory(state, 'run-extinct', { cause: 'test' });
  assert.equal(state.history.length, 80);
  assert.equal(state.history.at(-1).type, 'run-extinct');
});

test('final hash folds owned decisions', () => {
  const controller = run(15);
  controller.advance(450);
  const before = finalStateHash(controller.state);
  controller.state.ownedCards.push('long-filaments');
  assert.notEqual(finalStateHash(controller.state), before);
});
