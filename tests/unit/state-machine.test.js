/** Risk protected: primary-screen wiring fails loudly rather than drifting. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStateMachine } from '../../src/core/state-machine.js';

const def = {
  initial: 'title',
  transitions: {
    title: { BEGIN: 'starting' },
    starting: { READY: 'running', FAIL: 'title' },
    running: { EXTINCT: 'result' },
    result: { MEMORY: 'memory', RESTART: 'starting' },
    memory: { RESTART: 'starting' },
  },
};

test('legal transitions move state', () => {
  const sm = createStateMachine(def);
  assert.equal(sm.state, 'title'); sm.send('BEGIN'); assert.equal(sm.state, 'starting');
  sm.send('READY'); assert.equal(sm.state, 'running'); sm.send('EXTINCT'); assert.equal(sm.state, 'result');
});

test('illegal transitions throw', () => {
  const sm = createStateMachine(def);
  assert.throws(() => sm.send('EXTINCT'), /illegal transition/); assert.equal(sm.state, 'title');
});

test('can() reports availability without moving', () => {
  const sm = createStateMachine(def);
  assert.equal(sm.can('BEGIN'), true); assert.equal(sm.can('MEMORY'), false); assert.equal(sm.state, 'title');
});

test('onTransition hook observes moves', () => {
  const seen = [];
  const sm = createStateMachine({ ...def, onTransition: (from, event, to) => seen.push([from, event, to]) });
  sm.send('BEGIN'); assert.deepEqual(seen, [['title', 'BEGIN', 'starting']]);
});
