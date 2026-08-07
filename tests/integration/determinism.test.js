/** GOLDEN-CLASS: production authority determinism without presentation choices. */
import { test } from 'node:test'; import assert from 'node:assert/strict';
import { RunController } from '../../src/simulation/simulator.js';
import { REPLAY, REPLAY_VERSION } from '../../src/simulation/replay.js';
import { scoreResult } from '../../src/game/scoring.js';
import { RUN_PROTOCOL_VERSION, acceptsRunProtocol } from '../../src/core/run-protocol.js';
import { compileMemory, MEMORY_NODES } from '../../src/game/skills/index.js';
import { appendWorld, defaultHistory, loadHistory, normalizeHistoryEvents, saveHistory, serializeHistory } from '../../src/platform/history.js';

function runFull(cfg, chunk = 50) { const controller = new RunController({ worldOrdinal: 1, worldPotential: 16000, ...cfg }); controller.start();
  while (controller.state.status !== 'extinct') controller.advance(chunk); return controller.buildResult(); }
function semantic(result) { return { hash: result.hash, tick: result.tick, cause: result.cause, terminalCause: result.terminalCause,
  inoculationCell: result.inoculationCell, worldOrdinal: result.worldOrdinal,
  worldPotential: result.worldPotential, replay: result.replay, reach: result.reach, lakeProof: result.lakeProof,
  resourceFinal: result.resourceFinal, resourceTransferred: result.resourceTransferred, habitatOccupancy: result.habitatOccupancy } }

test('Worker protocol explicitly rejects missing or stale envelopes',()=>{
  assert.equal(acceptsRunProtocol({protocolVersion:RUN_PROTOCOL_VERSION}),true);
  assert.equal(acceptsRunProtocol({protocolVersion:RUN_PROTOCOL_VERSION-1}),false);assert.equal(acceptsRunProtocol({}),false);
});

test('same start configuration reproduces authority, History, Imprint, and SCORE', () => {
  const config = { seed: 424242, strainId: 'pioneer', worldOrdinal: 3, worldPotential: 111000 };
  const a = runFull(config), b = runFull(config); assert.deepEqual(semantic(a), semantic(b));
  assert.deepEqual(a.history, b.history); assert.deepEqual(a.imprint, b.imprint); assert.deepEqual(scoreResult(a), scoreResult(b));
});

test('different seeds and explicit onboarding worlds produce distinct intentional authority', () => {
  assert.notEqual(runFull({ seed: 1 }).hash, runFull({ seed: 2 }).hash);
  const scarcity = runFull({ seed: 9, worldOrdinal: 1 }); const mature = runFull({ seed: 9, worldOrdinal: 12 });
  assert.notEqual(scarcity.hash, mature.hash); assert.equal(scarcity.crisesTotal, 0); assert.ok(mature.crisesTotal > 0);
});

test('bounded 1x through 256x-equivalent execution chunks are exactly invariant', () => {
  const config = { seed: 987654, strainId: 'conservator', worldOrdinal: 8, worldPotential: 240000 };
  const reference = runFull(config, 1); for (const chunk of [7, 32, 50, 64, 256]) assert.deepEqual(semantic(runFull(config, chunk)), semantic(reference));
});

test('hundreds of inspections and snapshots remain observationally neutral', () => {
  const config = { seed: 1357911, worldOrdinal: 4, worldPotential: 120000 }; const quiet = runFull(config, 17);
  const controller = new RunController(config); controller.start(); let views = 0;
  while (controller.state.status !== 'extinct') { controller.advance(17); controller.snapshot();
    for (let i = 0; i < 3; i++) { controller.inspectCell((views * 97 + i * 31) % controller.state.topo.nodeCount); views++; } }
  const observed = controller.buildResult(); assert.ok(views > 400); assert.deepEqual(semantic(observed), semantic(quiet));
  assert.deepEqual(scoreResult(observed), scoreResult(quiet)); assert.deepEqual(observed.history, quiet.history);
});

test('strain and permanent Evolution remain authoritative start inputs', () => {
  const pioneer = runFull({ seed: 31337, strainId: 'pioneer' }); const weaver = runFull({ seed: 31337, strainId: 'weaver' });
  assert.notEqual(pioneer.hash, weaver.hash);
  const root = MEMORY_NODES[0]; const memory = compileMemory({ memoryNodes: [root.id] });
  const evolved = runFull({ seed: 31337, memoryEffects: memory.effects, memoryConditionals: memory.conditionals,
    memoryUnlocks: memory.unlocks, habitatCapabilities: memory.habitatCapabilities,
    worldPotential: memory.worldPotential, potentialVersion: memory.potentialVersion });
  assert.notEqual(evolved.hash, pioneer.hash); assert.equal(evolved.worldPotential, memory.worldPotential);
});

test('replay schema 7 contains only stable run creation inputs', () => {
  const result = runFull({ seed: 8888 }); assert.equal(result.replayVersion, REPLAY_VERSION); assert.equal(REPLAY_VERSION, 7);
  assert.deepEqual(result.replay.map((entry) => entry[1]), [REPLAY.STRAIN, REPLAY.INOCULATE]);
  assert.ok(result.replay.flat().every(Number.isInteger));
});

test('owned conditional Evolution changes only its declared runtime condition', () => {
  const target = MEMORY_NODES.find((node) => node.effect.trigger === 'coverage-below-25'); const memory = compileMemory({ memoryNodes: [target.id] });
  const controller = new RunController({ seed: 9182, worldPotential: memory.worldPotential,
    memoryEffects: memory.effects, memoryConditionals: memory.conditionals, memoryUnlocks: memory.unlocks });
  controller.start(); controller.advance(1); assert.ok(controller.state.activeTraits.reach > controller.state.traits.reach);
  assert.equal(controller.state.activeTraits.maintenance, controller.state.traits.maintenance);
});

test('semantic History remains bounded, serializable, and corruption-safe', () => {
  const result = runFull({ seed: 443322 }); const score = scoreResult(result); const events = normalizeHistoryEvents(result.history);
  assert.ok(events.length > 5 && events.length <= 80); let archive = defaultHistory();
  for (let run = 1; run <= 35; run++) archive = appendWorld(archive, { ...result, seed: run }, score, run, 24);
  assert.equal(archive.worlds.length, 24); assert.ok(serializeHistory(archive).length < 700000);
  globalThis.localStorage = { getItem: () => '{broken', setItem: () => {} };
  try { assert.deepEqual(loadHistory(), defaultHistory());
    globalThis.localStorage.setItem = () => { throw new Error('quota'); }; assert.equal(saveHistory(archive), false); }
  finally { delete globalThis.localStorage; }
});
