/** Authoritative Reach transitions reconcile and remain fixed-size. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RunController } from '../../../src/simulation/simulator.js';
import { buildReachSummary, createReachLedger, recordReachTransition, REACH_CAUSE,
  REACH_SAMPLE_CAP, REACH_WINDOW_SECONDS } from '../../../src/simulation/lifecycle/reach-ledger.js';

test('completed authority reconciles every direct birth and death exactly once', () => {
  const run = new RunController({ seed: 8080 }); run.start(); let guard = 0;
  while (run.state.status !== 'extinct' && guard++ < 5000) { run.advance(31); const recent = run.snapshot().reach;
    assert.equal(recent.gained - recent.lost, recent.current - recent.windowStartLiving);
    for (const factor of [...recent.positive, ...recent.negative]) assert.ok(factor.samples.length <= REACH_SAMPLE_CAP);
    for (const condition of [...recent.positiveConditions, ...recent.negativeConditions]) assert.ok(Number.isFinite(condition.score)); }
  const result = run.buildResult(); assert.equal(result.finalLivingCount, 0);
  assert.equal(result.reach.gained - result.reach.lost, 0); assert.ok(result.reach.gained > 1 && result.reach.lost > 0);
  assert.ok(result.reach.positive.every((factor) => factor.count > 0)); assert.ok(result.reach.negative.every((factor) => factor.count > 0));
});

test('rolling buckets expire and representative samples stay bounded', () => {
  const state = fixture(); recordReachTransition(state, 0, REACH_CAUSE.INOCULATION);
  assert.equal(buildReachSummary(state).gained, 1); state.tick = (REACH_WINDOW_SECONDS + 1) * 10;
  assert.equal(buildReachSummary(state).gained, 0); state.aliveCount = 0;
  for (let cell = 0; cell < 24; cell++) recordReachTransition(state, cell, REACH_CAUSE.STARVATION);
  const summary = buildReachSummary(state); assert.equal(summary.lost, 24); assert.equal(summary.negative[0].samples.length, REACH_SAMPLE_CAP);
  assert.equal(state.reach.buckets.length, REACH_WINDOW_SECONDS * 19);
});
function fixture() { const count = 32; return { tick: 0, aliveCount: 1, reach: createReachLedger(), topo: { nodeCount: count },
  alive: Uint8Array.from({ length: count }, (_, index) => index === 0 ? 1 : 0), energy: new Float32Array(count), nutrient: new Float32Array(count),
  moisture: new Float32Array(count), temperature: new Float32Array(count), toxicity: new Float32Array(count),
  fields: { riverStrength: new Float32Array(count), forestDensity: new Float32Array(count) }, liveness: { activeFrontierCount: 0 },
  events: [], ownedCards: [], memoryConditionals: [], entropy: 0, connectedShare: 1 }; }
