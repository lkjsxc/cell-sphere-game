/** Risk protected: event schedules must be deterministic (shared seeds) and
 *  readable (no family streaks, telegraphed, bounded footprints). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../../src/core/prng.js';
import { createTopology } from '../../src/world/icosphere.js';
import { createFields } from '../../src/world/fields.js';
import { computeEventField, EVENT_UNREACHABLE, scheduleEvents, telegraphLead } from '../../src/simulation/events.js';
import { baseTraits } from '../../src/game/strains.js';
import { compileChallengeProfile } from '../../src/simulation/challenge-profile.js';

const topo = createTopology(4);

function scheduleFor(seed, environmentLevel = '4') {
  const fields = createFields(createRng(seed ^ 0x51ab3d71), topo);
  const profile = compileChallengeProfile({ environmentLevel });
  return scheduleEvents(createRng(seed ^ 0x0e7e17a1), topo, fields, profile);
}

test('Environment Levels compile directly to monotone bounded event pressure',()=>{
  const profiles = ['0','1','2','3','4','1000'].map((environmentLevel) => compileChallengeProfile({ environmentLevel }));
  assert.deepEqual(profiles.slice(0, 2).map((profile) => profile.events.count), [0, 1]);
  for (let index = 1; index < profiles.length; index++) {
    assert.ok(profiles[index].dimensions.events.pressure >= profiles[index - 1].dimensions.events.pressure);
    assert.ok(profiles[index].events.count >= profiles[index - 1].events.count);
    assert.ok(profiles[index].events.count <= 6);
  }
});

test('schedule is deterministic per seed', () => {
  const a = scheduleFor(999);
  const b = scheduleFor(999);
  assert.equal(a.length, b.length);
  for (let i = 0; i < a.length; i++) {
    assert.equal(a[i].family, b[i].family);
    assert.equal(a[i].startTick, b[i].startTick);
    assert.equal(a[i].center, b[i].center);
    assert.deepEqual(a[i].nodes, b[i].nodes); assert.deepEqual(a[i].arrivalCost, b[i].arrivalCost);
  }
});

test('different seeds differ', () => {
  const a = scheduleFor(1);
  const b = scheduleFor(2);
  assert.notDeepEqual(a.map((event) => [event.family, event.startTick, event.center]),
    b.map((event) => [event.family, event.startTick, event.center]), 'schedules identical across seeds');
});

test('no immediate family repeats; sorted; well-formed', () => {
  for (const seed of [1, 2, 3, 100, 777]) {
    const events = scheduleFor(seed);
    assert.ok(events.length >= 3 && events.length <= 6, `count ${events.length}`);
    for (let i = 0; i < events.length; i++) {
      const ev = events[i];
      if (i > 0) assert.notEqual(ev.family, events[i - 1].family, `streak at ${i}`);
      if (i > 0) assert.ok(ev.startTick >= events[i - 1].startTick, 'unsorted');
      assert.ok(ev.startTick < ev.peakTick && ev.peakTick < ev.endTick);
      assert.ok(ev.nodes.length > 50, `tiny footprint ${ev.nodes.length}`);
      assert.equal('radiusDot' in ev, false); assert.equal(ev.fieldVersion, 2); assert.equal(ev.arrivalTicks.length, ev.nodes.length);
      assert.ok(ev.intensity > 0.5 && ev.intensity < 2);
      for (let k = 0; k < ev.nodes.length; k++) {
        assert.ok(ev.falloff[k] > 0 && ev.falloff[k] <= 1);
      }
    }
  }
});

test('land-bound graph fields stop at ocean and terrain breaks radial symmetry', () => {
  const fields = createFields(createRng(91), topo); let asymmetric = null;
  for (let center = 0; center < topo.nodeCount && !asymmetric; center++) if (fields.landMask[center]) {
    const field = computeEventField(topo, fields, 'drought', center, 420, 3);
    const costs = [];
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

test('protected Level 0 suppresses events and Level 1 is one late mild telegraphed pressure', () => {
  assert.equal(scheduleFor(1, '0').length, 0); assert.equal(scheduleFor(2, '0').length, 0);
  const third = scheduleFor(3, '1'); assert.equal(third.length, 1);
  assert.ok(third[0].startTick >= 2400); assert.ok(third[0].crisis);
  assert.ok(['drought', 'heat', 'freeze'].includes(third[0].family));
  assert.ok(third[0].intensity >= .5 && third[0].intensity <= .7);
});

test('telegraph lead extends with distributed sensing', () => {
  const t = baseTraits();
  assert.equal(telegraphLead(t), 100);
  t.distributedSensing = 1;
  assert.equal(telegraphLead(t), 200);
});
