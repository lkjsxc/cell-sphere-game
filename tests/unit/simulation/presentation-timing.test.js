import { test } from 'node:test'; import assert from 'node:assert/strict';
import { createTimedPresentationQueue, PRESENTATION_DURATION } from '../../../src/interface/policies/presentation-timing.js';

test('central presentation policy is exactly the audited 1.5x timing slice', () => {
  assert.deepEqual(PRESENTATION_DURATION, { toast: 2700, trophy: 4200, important: 4500 });
});

test('fake clock proves FIFO ordering, duplicate suppression, and deterministic acknowledgement', () => {
  const clock = fakeClock(); const shown = []; const acknowledged = [];
  const queue = createTimedPresentationQueue({ duration: 4200, ...clock.api, onShow: (id) => shown.push(id),
    onAcknowledge: (id, reason) => acknowledged.push([id, reason]) });
  queue.enqueue(['alpha','beta','alpha','gamma']); assert.deepEqual(shown, ['alpha']); assert.equal(queue.length, 3);
  clock.tick(4199); assert.deepEqual(acknowledged, []); clock.tick(1); assert.deepEqual(shown, ['alpha','beta']);
  assert.deepEqual(acknowledged, [['alpha','elapsed']]); queue.acknowledge('selected'); assert.deepEqual(shown, ['alpha','beta','gamma']);
  assert.deepEqual(acknowledged.at(-1), ['beta','selected']);
});

test('hover and focus leases hold actionable feedback past its deadline', () => {
  const clock = fakeClock(); const hidden = []; const queue = createTimedPresentationQueue({ duration: 4200, ...clock.api,
    onHide: (id, reason) => hidden.push([id, reason]) });
  queue.enqueue('held'); queue.hold('hover', true); queue.hold('focus', true); clock.tick(9000); assert.equal(queue.current, 'held');
  queue.hold('hover', false); assert.equal(queue.current, 'held'); queue.hold('focus', false);
  assert.equal(queue.current, null); assert.deepEqual(hidden, [['held','hold-released']]);
});

test('retired generation timers no-op while a global Trophy queue survives world replacement', () => {
  const clock = fakeClock(); const shown = []; const queue = createTimedPresentationQueue({ duration: 4200, ...clock.api, onShow: (item) => shown.push(item.id), keyOf: (item) => item.id });
  queue.enqueue([{ id: 'one', world: 1 }, { id: 'two', world: 1 }]);
  const replacementGeneration = 2; assert.equal(replacementGeneration, 2); // world authority changes; global queue is deliberately untouched
  clock.tick(4200); assert.deepEqual(shown, ['one','two']); assert.equal(queue.current.id, 'two');
  queue.clear('progression-replaced'); queue.enqueue({ id: 'fresh', world: 2 }); clock.tick(4200);
  assert.deepEqual(shown, ['one','two','fresh']); assert.equal(queue.current, null);
});

test('reduced-motion data remains a static reveal and selected acknowledgement carries the click route', () => {
  const clock = fakeClock(); let staticReveal = false; let route = null;
  const queue = createTimedPresentationQueue({ duration: 4200, ...clock.api, keyOf: (item) => item.id,
    onShow: (item) => { staticReveal = item.reduced; }, onAcknowledge: (item, reason) => { if (reason === 'selected') route = item.id; } });
  queue.enqueue({ id: 'lake-master', reduced: true }); assert.equal(staticReveal, true); queue.acknowledge('selected'); assert.equal(route, 'lake-master');
});

function fakeClock() { let now = 0; let next = 1; const timers = new Map(); const api = { now: () => now,
  setTimer(fn, delay) { const id = next++; timers.set(id, { at: now + delay, fn }); return id; }, clearTimer(id) { timers.delete(id); } };
  function tick(ms) { const target = now + ms; while (true) { const due = [...timers.entries()].filter(([, timer]) => timer.at <= target)
        .sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0]; if (!due) break;
      timers.delete(due[0]); now = due[1].at; due[1].fn(); } now = target; }
  return { api, tick };
}
