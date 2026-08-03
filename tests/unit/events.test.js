/** Risk protected: event schedules must be deterministic (shared seeds) and
 *  readable (no family streaks, telegraphed, bounded footprints). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../../src/core/prng.js';
import { createTopology } from '../../src/world/icosphere.js';
import { createFields } from '../../src/world/fields.js';
import { computeEventField, EVENT_UNREACHABLE, scheduleEvents, telegraphLead } from '../../src/simulation/events.js';
import { baseTraits } from '../../src/game/strains.js';

const topo = createTopology(4);

function scheduleFor(seed) {
  const fields = createFields(createRng(seed ^ 0x51ab3d71), topo);
  return scheduleEvents(createRng(seed ^ 0x9e3779b9), topo, fields, null);
}

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
  const same = a.filter((ev, i) => b[i] && b[i].family === ev.family).length;
  assert.ok(same < a.length, 'schedules identical across seeds');
});

test('no immediate family repeats; sorted; well-formed', () => {
  for (const seed of [1, 2, 3, 100, 777]) {
    const events = scheduleFor(seed);
    assert.ok(events.length >= 6 && events.length <= 8, `count ${events.length}`);
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

test('positive events are present sometimes but not dominant', () => {
  let blooms = 0;
  let total = 0;
  for (let seed = 1; seed <= 40; seed++) {
    for (const ev of scheduleFor(seed)) {
      total++;
      if (!ev.crisis) blooms++;
    }
  }
  assert.ok(blooms > 0, 'no positive events in 40 seeds');
  assert.ok(blooms / total < 0.3, `too many positive events: ${blooms}/${total}`);
});

test('telegraph lead extends with distributed sensing', () => {
  const t = baseTraits();
  assert.equal(telegraphLead(t), 100);
  t.distributedSensing = 1;
  assert.equal(telegraphLead(t), 200);
});
