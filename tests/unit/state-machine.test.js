/** Risk protected: screen wiring bugs must fail loudly, not silently no-op. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStateMachine } from '../../src/core/state-machine.js';

const def = {
  initial: 'title',
  transitions: {
    title: { START: 'strain' },
    strain: { INOCULATE: 'running', BACK: 'title' },
    running: { DRAFT: 'draft', PAUSE: 'paused', EXTINCT: 'result' },
    draft: { DECIDE: 'running' },
    paused: { RESUME: 'running' },
    result: { RESTART: 'strain', HOME: 'title' },
  },
};

test('legal transitions move state', () => {
  const sm = createStateMachine(def);
  assert.equal(sm.state, 'title');
  sm.send('START');
  assert.equal(sm.state, 'strain');
  sm.send('INOCULATE');
  assert.equal(sm.state, 'running');
  sm.send('EXTINCT');
  assert.equal(sm.state, 'result');
});

test('illegal transitions throw', () => {
  const sm = createStateMachine(def);
  assert.throws(() => sm.send('EXTINCT'), /illegal transition/);
  assert.equal(sm.state, 'title');
});

test('can() reports availability without moving', () => {
  const sm = createStateMachine(def);
  assert.equal(sm.can('START'), true);
  assert.equal(sm.can('DRAFT'), false);
  assert.equal(sm.state, 'title');
});

test('onTransition hook observes moves', () => {
  const seen = [];
  const sm = createStateMachine({ ...def, onTransition: (f, e, t) => seen.push([f, e, t]) });
  sm.send('START');
  assert.deepEqual(seen, [['title', 'START', 'strain']]);
});
