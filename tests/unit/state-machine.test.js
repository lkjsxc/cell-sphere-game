/** Risk protected: primary-screen wiring fails loudly rather than drifting. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
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

test('production interface excludes rejected modal controls and copy', () => {
  const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
  for (const text of ['AUTO: RANDOM', 'Previous landmark', 'Next landmark', 'The world remembers its paths.']) {
    assert.equal(html.includes(text), false, text);
  }
  assert.equal(html.includes('id="adaptation-mode"'), false); assert.equal(html.includes('<dialog id="history-dialog"'), false);
  for (const obsolete of ['>Memory<', 'Memory cell', 'Remembered', 'Atlas list', 'memory-list-button', 'memory-list-dialog']) assert.equal(html.includes(obsolete), false, obsolete);
  for (const current of ['Evolution Globe', 'PERMANENT SKILL TREE', 'Shape what every future world inherits.', 'AUTO · RANDOM', 'Leave this world?']) assert.equal(html.includes(current), true, current);
  assert.equal(/id="pause-button"[^>]*>Pause</.test(html), false);
  const dir = new URL('../../src/interface/', import.meta.url);
  const source = readdirSync(dir).filter((name) => name.endsWith('.js'))
    .map((name) => readFileSync(new URL(name, dir), 'utf8')).join('\n');
  assert.equal(source.includes('showModal()'), false);
});
