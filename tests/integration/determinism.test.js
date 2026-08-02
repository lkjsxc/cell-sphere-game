/** GOLDEN-CLASS: production authority determinism and passive-decision replay. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RunController } from '../../src/simulation/simulator.js';
import { REPLAY, REPLAY_VERSION } from '../../src/simulation/replay.js';
import { BALANCE as B } from '../../src/game/balance.js';
import { scoreResult } from '../../src/game/scoring.js';
import { compileMemory, MEMORY_NODES } from '../../src/game/memory.js';
import { appendWorld, loadHistory, normalizeHistoryEvents, saveHistory, serializeHistory } from '../../src/platform/history.js';
import { AdaptationPropagation } from '../../src/rendering/adaptation-propagation.js';

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

function runOrigins(seed, chunk, visual = false) {
  const events = []; let wave; let controller;
  controller = new RunController({ seed }, (message) => {
    if (message.t !== 'adaptation-selected') return;
    events.push({ originCell: message.originCell, category: message.category,
      component: message.affectedComponentId, living: controller.state.alive[message.originCell] });
    if (visual) wave.enqueue(message, controller.state.alive, controller.state.tick * 100, false);
  });
  wave = new AdaptationPropagation(controller.state.topo); controller.start();
  while (controller.state.status !== 'extinct') { controller.advance(chunk); if (visual) wave.frame(controller.state.tick * 100); }
  return { events, result: controller.buildResult() };
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

test('Adaptation origins are living, deterministic across chunks, and visual queries are neutral', () => {
  const reference = runOrigins(24680, 1); const chunked = runOrigins(24680, 32);
  assert.deepEqual(chunked.events, reference.events); assert.ok(reference.events.length > 0);
  assert.ok(reference.events.every((event) => event.living === 1 && event.originCell >= 0
    && event.component >= 0 && ['reach', 'metabolism', 'resilience', 'transport', 'ecology', 'perception'].includes(event.category)));
  const viewed = runOrigins(24680, 7, true);
  assert.deepEqual(semanticResult(viewed.result), semanticResult(reference.result));
  assert.deepEqual(scoreResult(viewed.result), scoreResult(reference.result));
  assert.deepEqual(viewed.result.imprint, reference.result.imprint);
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

test('hundreds of inspections and snapshot views are observationally neutral', () => {
  const config = { seed: 1357911, strainId: 'pioneer' };
  const quiet = runFull(config, 17); const controller = new RunController(config); controller.start();
  let views = 0;
  while (controller.state.status !== 'extinct') {
    controller.advance(17); controller.snapshot();
    for (let i = 0; i < 3; i++) { controller.inspectCell((views * 97 + i * 31) % controller.state.topo.nodeCount); views++; }
  }
  const observed = controller.buildResult(); assert.ok(views > 500);
  assert.deepEqual(semanticResult(observed), semanticResult(quiet));
  assert.deepEqual(scoreResult(observed), scoreResult(quiet));
  assert.deepEqual(observed.history, quiet.history); assert.deepEqual(observed.imprint, quiet.imprint);
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

test('owned conditional Memory compiles once and changes only its named future condition', () => {
  const owned = MEMORY_NODES.filter((node) => node.branch === 'Reach').slice(0, 9).map((node) => node.id);
  const memory = compileMemory({ memoryNodes: owned });
  const controller = new RunController({ seed: 9182, memoryEffects: memory.effects,
    memoryConditionals: memory.conditionals, memoryUnlocks: memory.unlocks });
  controller.start(); controller.advance(1);
  assert.equal(memory.conditionals.some((effect) => effect.trigger === 'coverage-below-25'), true);
  assert.ok(controller.state.activeTraits.reach > controller.state.traits.reach);
  assert.equal(controller.state.activeTraits.maintenance, controller.state.traits.maintenance);
});

test('semantic History validates, prunes, serializes, and survives storage failure', () => {
  const result = runFull({ seed: 443322 }); const score = scoreResult(result);
  const events = normalizeHistoryEvents(result.history);
  assert.ok(events.length > 5 && events.length <= 80);
  for (let i = 1; i < events.length; i++) { assert.ok(events[i].seq > events[i - 1].seq); assert.ok(events[i].tick >= events[i - 1].tick); }
  let archive = { schema: 1, worlds: [], memory: [] };
  for (let run = 1; run <= 35; run++) archive = appendWorld(archive, { ...result, seed: run }, score, run, 24);
  assert.equal(archive.worlds.length, 24); assert.ok(serializeHistory(archive).length < 700000);
  globalThis.localStorage = { getItem: () => '{broken', setItem: () => {} };
  try { assert.deepEqual(loadHistory(), { schema: 1, worlds: [], memory: [] });
    globalThis.localStorage.setItem = () => { throw new Error('quota'); }; assert.equal(saveHistory(archive), false); }
  finally { delete globalThis.localStorage; }
});

function eventShape(event) {
  return [event.id, event.family, event.startTick, event.endTick, event.center, event.intensity];
}
