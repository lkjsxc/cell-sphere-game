/** Risk protected: primary-screen wiring fails loudly rather than drifting. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createStateMachine } from '../../src/core/state-machine.js';
import { classifySurfaceTarget } from '../../src/interface/policies/surface-coordinator.js';
import { createAppState } from '../../src/interface/app-state.js';
import { isPrimaryPointer, isTapGesture } from '../../src/interface/globe-input.js';

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

test('world authority and selected scene are orthogonal', () => {
  const app = createAppState(); assert.equal(app.phase, 'idle'); assert.equal(app.scene, 'home');
  app.select('trophies'); assert.equal(app.phase, 'idle'); assert.equal(app.scene, 'trophies');
  app.send('begin'); app.send('ready'); app.select('evolution'); assert.equal(app.phase, 'running'); assert.equal(app.scene, 'evolution');
  app.select('home'); assert.equal(app.phase, 'running'); app.send('extinct'); assert.equal(app.phase, 'result'); assert.equal(app.scene, 'home');
  app.select('world'); assert.equal(app.phase, 'result'); assert.equal(app.scene, 'world');
  assert.throws(() => app.select('memory'), /unknown scene/);
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

test('globe gesture classification uses cumulative travel and primary mouse input', () => {
  assert.equal(isPrimaryPointer({ pointerType: 'mouse', button: 0 }), true);
  assert.equal(isPrimaryPointer({ pointerType: 'mouse', button: 2 }), false); assert.equal(isPrimaryPointer({ pointerType: 'touch', button: 0 }), true);
  assert.equal(isTapGesture({ travel: 12 }, 520, false), true); assert.equal(isTapGesture({ travel: 12.01 }, 100, false), false);
  assert.equal(isTapGesture({ travel: 2 }, 521, false), false); assert.equal(isTapGesture({ travel: 2 }, 100, true), false);
});

test('surface targets preserve native controls and canvas while isolating empty chrome', () => {
  const surface = {}; const trigger = {}; const child = {};
  const match = (accepted) => ({ matches: (selector) => accepted.some((value) => selector.includes(value)) });
  assert.equal(classifySurfaceTarget([child, surface], surface, [trigger]), 'inside');
  assert.equal(classifySurfaceTarget([child, trigger], surface, [trigger]), 'current-trigger');
  assert.equal(classifySurfaceTarget([match(['data-surface-trigger'])], surface, [trigger]), 'control');
  assert.equal(classifySurfaceTarget([match(['button'])], surface, [trigger]), 'control');
  assert.equal(classifySurfaceTarget([match(['canvas'])], surface, [trigger]), 'canvas');
  assert.equal(classifySurfaceTarget([child], surface, [trigger]), 'empty');
});

test('production interface excludes rejected modal controls and copy', () => {
  const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
  for (const text of ['AUTO: RANDOM', 'Previous landmark', 'Next landmark', 'The world remembers its paths.']) {
    assert.equal(html.includes(text), false, text);
  }
  assert.equal(html.includes('id="adaptation-mode"'), false); assert.equal(html.includes('<dialog id="history-dialog"'), false);
  for (const obsolete of ['>Memory<', 'Memory cell', 'Remembered', 'Atlas list', 'memory-list-button', 'memory-list-dialog']) assert.equal(html.includes(obsolete), false, obsolete);
  for (const current of ['Evolution Globe', 'PERMANENT SKILL TREE', 'Shape what every future world inherits.', 'Leave this world?', 'Event Log']) assert.equal(html.includes(current), true, current);
  for (const removed of ['adaptations-button', 'adaptations-dialog', 'adaptationMode', 'result-adaptations']) assert.equal(html.includes(removed), false, removed);
  assert.equal(/id="pause-button"[^>]*>Pause</.test(html), false);
  assert.equal((html.match(/role="tab"/g) ?? []).length, 4); assert.equal(html.includes('NETWORK SCORE'), false);
  assert.equal(html.includes('id="result-screen"'), false); assert.equal(html.includes('id="context-shell"'), true);
  const dir = new URL('../../src/interface/', import.meta.url);
  const source = readdirSync(dir).filter((name) => name.endsWith('.js'))
    .map((name) => readFileSync(new URL(name, dir), 'utf8')).join('\n');
  assert.equal(source.includes('showModal()'), false);
});
