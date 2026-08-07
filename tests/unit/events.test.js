/** Bounded rolling whole-cell event director coverage. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../../src/core/prng.js';
import { createTopology } from '../../src/world/icosphere.js';
import { createFields } from '../../src/world/fields.js';
import { advanceEventDirector, computeEventField, EVENT_UNREACHABLE, installEventDirectorProfile,
  MAX_EVENT_DIRECTOR_EVENTS, reclaimEndedEvents, telegraphLead } from '../../src/simulation/events.js';
import { RunController } from '../../src/simulation/simulator.js';
import { baseTraits } from '../../src/game/strains.js';
import { compileChallengeProfile } from '../../src/simulation/challenge-profile.js';

const topo = createTopology(4);

function directorAt(seed, ticks = 1200, worldOrdinal = '3') {
  const messages = []; const run = new RunController({ seed, worldOrdinal }, (message) => messages.push(message));
  run.start(); run.advance(ticks); run.testMessages = messages; return run;
}

test('Environment profiles compile direct bounded event parameters', () => {
  const profiles = ['0', '1', '2', '3', '4', '1000'].map((environmentLevel) => compileChallengeProfile({ environmentLevel }));
  assert.deepEqual(profiles.slice(0, 2).map((profile) => profile.events.count), [0, 1]);
  for (let index = 1; index < profiles.length; index++) {
    assert.ok(profiles[index].dimensions.events.pressure >= profiles[index - 1].dimensions.events.pressure);
    assert.ok(profiles[index].events.count >= profiles[index - 1].events.count);
    assert.ok(profiles[index].events.count <= MAX_EVENT_DIRECTOR_EVENTS);
    assert.ok(profiles[index].events.cadenceTicks >= 180);
  }
});

test('rolling candidates are deterministic per seed and do not expose a static full-run schedule', () => {
  const a = directorAt(999); const b = directorAt(999);
  assert.equal(a.state.events.length, b.state.events.length); assert.ok(a.state.events.length > 0);
  for (let i = 0; i < a.state.events.length; i++) {
    const left = a.state.events[i]; const right = b.state.events[i];
    assert.equal(left.id, right.id); assert.equal(left.family, right.family); assert.equal(left.startTick, right.startTick);
    assert.equal(left.center, right.center); assert.deepEqual(left.nodes, right.nodes); assert.deepEqual(left.arrivalCost, right.arrivalCost);
    assert.ok(left.startTick - 1200 >= 100, 'minimum telegraph was bypassed');
  }
});

test('summary cadence cannot shorten the player-visible minimum telegraph', () => {
  const run = directorAt(999); const event = run.state.events[0]; assert.ok(event);
  while (!run.testMessages.some((message) => message.t === 'event' && message.phase === 'telegraph') && run.state.status !== 'extinct') run.advance(1);
  const telegraph = run.testMessages.find((message) => message.t === 'event' && message.phase === 'telegraph');
  assert.ok(telegraph, 'event expired without a visible telegraph');
  assert.ok(event.startTick - telegraph.tick >= 100, `visible lead ${event.startTick - telegraph.tick}`);
});

test('different seeds derive different rolling candidates', () => {
  const a = directorAt(1); const b = directorAt(2);
  assert.notDeepEqual(a.state.events.map((event) => [event.family, event.startTick, event.center]),
    b.state.events.map((event) => [event.family, event.startTick, event.center]));
});

test('director stays bounded, whole-cell, and reclaims expired geometry', () => {
  for (const seed of [1, 2, 3, 100, 777]) {
    const run = directorAt(seed); let priorFamily = null; const seen = new Set();
    for (let step = 0; step < 35 && run.state.status !== 'extinct'; step++) {
      run.advance(100); const events = run.state.events;
      assert.ok(events.length <= MAX_EVENT_DIRECTOR_EVENTS);
      assert.ok(run.state.eventDirector.recent.length <= 8);
      for (const event of events) {
        if (!seen.has(event.id)) {
          if (priorFamily !== null) assert.notEqual(event.family, priorFamily, 'immediate family repeat');
          priorFamily = event.family; seen.add(event.id);
        }
        assert.ok(event.startTick < event.peakTick && event.peakTick < event.endTick);
        assert.ok(event.nodes.length > 50, `tiny footprint ${event.nodes.length}`);
        assert.equal(event.fieldVersion, 2); assert.equal(event.arrivalTicks.length, event.nodes.length);
        assert.ok(event.intensity > .5 && event.intensity < 2);
        for (let k = 0; k < event.nodes.length; k++) assert.ok(event.falloff[k] > 0 && event.falloff[k] <= 1);
      }
    }
  }
});

test('high-level director fills only its fixed capacity then reclaims full geometry', () => {
  const run = new RunController({ seed: 901, worldOrdinal: '3' }); const state = run.state;
  state.currentEnvironmentProfile = compileChallengeProfile({ environmentLevel: '64' });
  state.nextEnvironmentProfile = compileChallengeProfile({ environmentLevel: '65' });
  state.tick = 30_000; installEventDirectorProfile(state, state.currentEnvironmentProfile);
  for (let index = 0; index < MAX_EVENT_DIRECTOR_EVENTS + 2; index++) {
    advanceEventDirector(state); state.tick = Math.max(state.tick + 1, state.eventDirector.nextCandidateTick);
  }
  assert.equal(state.events.length, MAX_EVENT_DIRECTOR_EVENTS);
  assert.equal(advanceEventDirector(state), false);
  for (const event of state.events) event.announced |= 4;
  state.tick = Math.max(...state.events.map((event) => event.endTick)) + 1;
  assert.equal(reclaimEndedEvents(state), MAX_EVENT_DIRECTOR_EVENTS);
  assert.equal(state.events.length, 0); assert.ok(state.eventDirector.recent.length <= 8);
});

test('onboarding suppresses only harmful candidates, not Level transitions', () => {
  const first = directorAt(1, 1200, '1'); const third = directorAt(1, 1200, '3');
  assert.equal(first.state.currentEnvironmentLevel, '1'); assert.equal(third.state.currentEnvironmentLevel, '1');
  assert.equal(first.state.events.length, 0); assert.equal(third.state.events.length, 1);
  assert.ok(['drought', 'heat', 'freeze'].includes(third.state.events[0].family));
});

test('land-bound graph fields stop at ocean and terrain breaks radial symmetry', () => {
  const fields = createFields(createRng(91), topo); let asymmetric = null;
  for (let center = 0; center < topo.nodeCount && !asymmetric; center++) if (fields.landMask[center]) {
    const field = computeEventField(topo, fields, 'drought', center, 420, 3); const costs = [];
    for (let offset = topo.nodeStart[center]; offset < topo.nodeStart[center + 1]; offset++) {
      const next = topo.nodeNeighbors[offset]; if (field.arrivalCost[next] !== EVENT_UNREACHABLE) costs.push(field.arrivalCost[next]);
    }
    if (new Set(costs).size > 1) asymmetric = { center, field };
  }
  assert.ok(asymmetric, 'equal-radius neighbors never reflected terrain costs');
  assert.ok([...asymmetric.field.nodes].every((cell) => fields.landMask[cell] === 1), 'drought crossed ocean');
  for (const cell of asymmetric.field.nodes) if (cell !== asymmetric.center) {
    const parent = asymmetric.field.predecessor[cell]; assert.ok(parent >= 0); assert.ok(asymmetric.field.arrivalCost[parent] < asymmetric.field.arrivalCost[cell]);
  }
});

test('telegraph lead extends with distributed sensing', () => {
  const t = baseTraits(); assert.equal(telegraphLead(t), 100); t.distributedSensing = 1; assert.equal(telegraphLead(t), 200);
});
