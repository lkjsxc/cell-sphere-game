/** Risk protected: simulation invariant violations (NaN, negative mass,
 *  inconsistent counters) would corrupt every run silently. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RunController } from '../../src/simulation/simulator.js';
import { BALANCE as B } from '../../src/game/balance.js';
import { cardById } from '../../src/game/adaptations.js';

function makeRun(seed = 4242, strainId = 'pioneer') {
  const rc = new RunController({ seed, strainId }, (m) => {
    if (m.t === 'draft') rc.decide(m.options[0]);
  });
  rc.start();
  return rc;
}

test('500 ticks preserve all invariants', () => {
  const rc = makeRun();
  rc.advance(500);
  const s = rc.state;

  let aliveSum = 0;
  for (let i = 0; i < s.topo.nodeCount; i++) {
    assert.ok(!Number.isNaN(s.biomass[i]), `biomass NaN at ${i}`);
    assert.ok(s.biomass[i] >= 0, `negative biomass at ${i}`);
    assert.ok(!Number.isNaN(s.energy[i]), `energy NaN at ${i}`);
    assert.ok(!Number.isNaN(s.nutrient[i]), `nutrient NaN at ${i}`);
    assert.ok(s.nutrient[i] >= 0 && s.nutrient[i] <= 1, `nutrient bounds at ${i}`);
    assert.ok(!Number.isNaN(s.stress[i]), `stress NaN at ${i}`);
    assert.ok(s.stress[i] >= 0 && s.stress[i] <= 1, `stress bounds at ${i}`);
    assert.ok(s.alive[i] === 0 || s.alive[i] === 1, `alive flag at ${i}`);
    aliveSum += s.alive[i];
  }
  assert.equal(s.aliveCount, aliveSum, 'aliveCount drifted from alive[]');

  for (let e = 0; e < s.topo.edgeCount; e++) {
    assert.ok(!Number.isNaN(s.conductance[e]), `conductance NaN at ${e}`);
    assert.ok(s.conductance[e] >= 0 && s.conductance[e] <= B.COND_MAX, `conductance bounds at ${e}`);
    assert.ok(s.edgeActive[e] === 0 || s.edgeActive[e] === 1, `edgeActive at ${e}`);
  }
  assert.ok(s.aliveCount > 10, 'network failed to grow');
});

test('growth actually expands from the seed', () => {
  const rc = makeRun(7);
  rc.advance(100); // 10 game seconds of germination
  assert.ok(rc.state.aliveCount > 5, `only ${rc.state.aliveCount} alive after 10s`);
  assert.ok(rc.state.coverage > 0.002);
});

test('signals decay and charges regenerate', () => {
  const rc = makeRun();
  rc.advance(50);
  const s = rc.state;
  const chargesBefore = s.signalCharges;
  assert.ok(rc.placeSignal(s.topo.nodeCount >> 1));
  assert.equal(s.signalCharges, chargesBefore - 1);

  let maxSignal = 0;
  for (let i = 0; i < s.topo.nodeCount; i++) maxSignal = Math.max(maxSignal, s.signal[i]);
  assert.ok(maxSignal > 0.5, 'signal field not applied');

  const before = maxSignal;
  rc.advance(10);
  let after = 0;
  for (let i = 0; i < s.topo.nodeCount; i++) after = Math.max(after, s.signal[i]);
  assert.ok(after < before, 'signal did not decay');

  // Charge regen over SIGNAL_REGEN_TICKS.
  s.signalRegenAcc = B.SIGNAL_REGEN_TICKS - 5;
  const c0 = s.signalCharges;
  rc.advance(10);
  assert.equal(s.signalCharges, Math.min(c0 + 1, B.SIGNAL_CHARGES + s.traits.signalCharges));
});

test('draft pauses simulation until decision', () => {
  const rc = new RunController({ seed: 4242 }, () => {});
  rc.start();
  rc.advance(B.DRAFT_TICKS[0] + 5);
  const s = rc.state;
  assert.equal(s.status, 'draft');
  assert.ok(s.pendingDraft);
  assert.equal(s.pendingDraft.options.length, B.DRAFT_OPTIONS);

  const tickAtDraft = s.tick;
  rc.advance(100); // must not progress
  assert.equal(s.tick, tickAtDraft, 'ticks advanced during draft');

  const traitsBefore = s.traits.reach;
  rc.decide(s.pendingDraft.options[0]);
  assert.equal(s.status, 'running');
  assert.equal(s.ownedCards.length, 1);
  const card = cardById(s.ownedCards[0]);
  assert.ok(card);
  void traitsBefore;

  assert.throws(() => rc.decide('long-filaments'), /no pending draft|invalid option/);
});

test('extinction happens with a cause and stable summary', () => {
  const rc = makeRun(31337);
  let guard = 0;
  while (rc.state.status !== 'extinct' && guard++ < 5000) rc.advance(50);
  assert.equal(rc.state.status, 'extinct');
  const res = rc.buildResult();
  assert.ok(res.tick > 2000, `run too short: ${res.tick}`);
  assert.ok(res.tick <= 4200, `run too long: ${res.tick}`);
  assert.ok(typeof res.cause === 'string' && res.cause.length > 0);
  assert.match(res.hash, /^[0-9a-f]{8}$/);
  assert.ok(res.replay.length > 0);
});
