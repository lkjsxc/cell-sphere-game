/** GOLDEN-CLASS: production authority determinism and passive-decision replay. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RunController } from '../../src/simulation/simulator.js';
import { REPLAY, REPLAY_VERSION } from '../../src/simulation/replay.js';
import { BALANCE as B } from '../../src/game/balance.js';
import { scoreResult } from '../../src/game/scoring.js';

function runFull(cfg, chunk = 50) {
  const controller = new RunController(cfg);
  controller.start();
  let guard = 0;
  while (controller.state.status !== 'extinct' && guard++ < 6000) controller.advance(chunk);
  assert.equal(controller.state.status, 'extinct');
  return controller.buildResult();
}

function runManual(cfg, chunk) {
  const controller = new RunController({ ...cfg, adaptationMode: 'manual' });
  controller.start();
  const resolutionTicks = B.ADAPTATION_OFFER_TICKS.map((tick) => tick + 20);
  let decision = 0;
  let guard = 0;
  while (controller.state.status !== 'extinct' && guard++ < 10000) {
    const target = resolutionTicks[decision];
    if (target != null && controller.state.tick === target) {
      const offer = controller.state.adaptationOffers.find((item) => item.resolvedTick == null);
      controller.chooseAdaptation(offer.id, offer.options[0]);
      decision++;
      continue;
    }
    const distance = target == null ? chunk : Math.max(1, target - controller.state.tick);
    controller.advance(Math.min(chunk, distance));
  }
  assert.equal(controller.state.status, 'extinct');
  return controller.buildResult();
}

function semanticResult(result) {
  return {
    hash: result.hash, tick: result.tick, cause: result.cause,
    inoculationCell: result.inoculationCell, ownedCards: result.ownedCards,
    offers: result.offers, replay: result.replay,
  };
}

test('same seed reproduces hash, inoculation, decisions, history, and score', () => {
  const a = runFull({ seed: 424242, strainId: 'pioneer' });
  const b = runFull({ seed: 424242, strainId: 'pioneer' });
  assert.deepEqual(semanticResult(a), semanticResult(b));
  assert.deepEqual(a.history, b.history);
  assert.deepEqual(a.imprint, b.imprint);
  assert.deepEqual(scoreResult(a), scoreResult(b));
});

test('different seeds diverge in strengthened authority results', () => {
  const a = runFull({ seed: 1 });
  const b = runFull({ seed: 2 });
  assert.notEqual(a.hash, b.hash);
  assert.notDeepEqual(a.replay, b.replay);
});

test('chunk/speed invariance includes passive adaptation log and hash', () => {
  const reference = runFull({ seed: 987654, strainId: 'conservator' }, 50);
  for (const chunk of [1, 7, 32]) {
    const result = runFull({ seed: 987654, strainId: 'conservator' }, chunk);
    assert.deepEqual(semanticResult(result), semanticResult(reference), `chunk ${chunk}`);
  }
});

test('manual delivery at exact authoritative ticks is chunk invariant and replayed', () => {
  const a = runManual({ seed: 55555, strainId: 'weaver' }, 1);
  const b = runManual({ seed: 55555, strainId: 'weaver' }, 37);
  assert.deepEqual(semanticResult(a), semanticResult(b));
  const selected = a.replay.filter((entry) => entry[1] === REPLAY.ADAPTATION_SELECT);
  assert.deepEqual(selected.map((entry) => entry[0]), B.ADAPTATION_OFFER_TICKS.map((tick) => tick + 20));
  assert.deepEqual(a.offers.map((offer) => offer.resolvedTick), selected.map((entry) => entry[0]));
});

test('zero-input default random run completes with every offer selected', () => {
  const result = runFull({ seed: 24680 });
  assert.equal(result.adaptationMode, 'random');
  assert.equal(result.offers.length, B.ADAPTATION_OFFER_TICKS.length);
  assert.ok(result.offers.every((offer) => offer.selectedCardId && offer.selectionMode === 'random'));
  assert.ok(result.offers.every((offer) => offer.offerTick === offer.resolvedTick));
});

test('decision stream and mode changes are isolated from world/event/growth/content', () => {
  const random = new RunController({ seed: 7777, adaptationMode: 'random' });
  const manual = new RunController({ seed: 7777, adaptationMode: 'manual' });
  assert.equal(random.state.inoculationCell, manual.state.inoculationCell);
  assert.deepEqual(random.state.events.map(eventShape), manual.state.events.map(eventShape));
  for (const key of ['simRng', 'eventRng', 'contentRng', 'decisionRng', 'inoculationRng']) {
    assert.deepEqual(random.state[key].state(), manual.state[key].state(), key);
  }
  const streams = ['simRng', 'eventRng', 'contentRng', 'inoculationRng'];
  const before = streams.map((key) => manual.state[key].state());
  manual.setAdaptationMode('random');
  assert.deepEqual(streams.map((key) => manual.state[key].state()), before);
});

test('strain remains authoritative and changes the outcome', () => {
  const pioneer = runFull({ seed: 31337, strainId: 'pioneer' });
  const weaver = runFull({ seed: 31337, strainId: 'weaver' });
  assert.notEqual(pioneer.hash, weaver.hash);
});

test('replay schema 2 distinguishes offers, selections, modes, ids, and ticks', () => {
  const result = runFull({ seed: 8888 });
  assert.equal(result.replayVersion, REPLAY_VERSION);
  const types = new Set(result.replay.map((entry) => entry[1]));
  for (const type of [REPLAY.ADAPTATION_OFFER, REPLAY.ADAPTATION_SELECT, REPLAY.ADAPTATION_MODE]) {
    assert.ok(types.has(type));
  }
  let lastTick = -1;
  for (const entry of result.replay) {
    assert.ok(entry[0] >= lastTick);
    lastTick = entry[0];
    assert.ok(entry.every(Number.isInteger));
  }
  const offers = result.replay.filter((entry) => entry[1] === REPLAY.ADAPTATION_OFFER);
  const selections = result.replay.filter((entry) => entry[1] === REPLAY.ADAPTATION_SELECT);
  assert.ok(offers.every((entry) => entry.length === 6));
  assert.ok(selections.every((entry) => entry[0] === entry[4]));
});

function eventShape(event) {
  return [event.id, event.family, event.startTick, event.endTick, event.center, event.intensity];
}
