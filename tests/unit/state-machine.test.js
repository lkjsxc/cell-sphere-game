/** Risk protected: primary-screen wiring fails loudly rather than drifting. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createStateMachine } from '../../src/core/state-machine.js';
import { classifySurfaceTarget } from '../../src/interface/policies/surface-coordinator.js';
import { createAppState } from '../../src/interface/app-state.js';
import { bindGlobeInput, inputAnimationTime, isPrimaryPointer, isTapGesture,
  keyboardActivationPoint, normalizedGlobeDrag, projectedGestureRadiusCssPx } from '../../src/interface/globe-input.js';
import { createCamera } from '../../src/rendering/camera.js';
import { projectedSphereDiameter, safeLayout } from '../../src/interface/policies/layout-policy.js';

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

test('pointer timing preserves queued input time and rejects incompatible clocks', () => {
  assert.equal(inputAnimationTime({ timeStamp: 100 }, 800), 100);
  assert.equal(inputAnimationTime({ timeStamp: 1_700_000_000_000 }, 800), 800);
  assert.equal(inputAnimationTime({ timeStamp: NaN }, 800), 800);
});

test('visible-sphere drag geometry is isotropic, finite, and one radius per radian', () => {
  for (const [width, height] of [[320,568],[360,640],[390,844],[430,932],[768,1024],[844,390],[1024,600],[1440,900]]) {
    const layout = safeLayout(width, height, 'world'); const radius = projectedGestureRadiusCssPx(layout.distance, height);
    assert.ok(Math.abs(radius - projectedSphereDiameter(layout.distance, height) / 2) < 1e-12);
    assert.deepEqual(normalizedGlobeDrag(radius, 0, radius), { x: 1, y: 0 });
    assert.deepEqual(normalizedGlobeDrag(0, radius, radius), { x: 0, y: 1 });
  }
  for (const value of [NaN, Infinity, -1, 0]) assert.equal(projectedGestureRadiusCssPx(value, 600), null);
  assert.equal(projectedGestureRadiusCssPx(4.1, 0), null);
  assert.equal(normalizedGlobeDrag(1, 1, 0), null); assert.equal(normalizedGlobeDrag(NaN, 1, 100), null);
});

test('one-pointer drag freezes projected radius and applies the sampled angular delta immediately', () => {
  const originalDocument = globalThis.document; const listeners = new Map(); const captured = new Set();
  let height = 600; const canvas = {
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height }),
    addEventListener: (type, listener) => listeners.set(type, listener), removeEventListener: (type) => listeners.delete(type),
    setPointerCapture: (id) => captured.add(id), releasePointerCapture: (id) => captured.delete(id),
    hasPointerCapture: (id) => captured.has(id), focus() {},
  };
  globalThis.document = { activeElement: canvas };
  const camera = createCamera(); const direct = []; const endings = [];
  const input = bindGlobeInput(canvas, camera, { canInteract: () => true, onTap() {},
    onDirectDelta: (x, y) => direct.push([x, y]), onDirectEnd: (_now, kind) => endings.push(kind) });
  try {
    const startedAt = performance.now(); const initialRadius = projectedGestureRadiusCssPx(camera.dist, height);
    listeners.get('pointerdown')({ pointerType: 'mouse', button: 0, pointerId: 1, clientX: 100, clientY: 100, timeStamp: startedAt });
    assert.equal(input.snapshot().gestureRadiusCssPx, initialRadius);
    height = 300; camera.dist = 2.5;
    listeners.get('pointermove')({ pointerId: 1, clientX: 100 + initialRadius, clientY: 100, timeStamp: startedAt + 20 });
    assert.ok(Math.abs(direct[0][0] - 1) < 1e-12); assert.equal(direct[0][1], 0);
    listeners.get('pointerup')({ pointerId: 1, clientX: 100 + initialRadius, clientY: 100, timeStamp: startedAt + 40 });
    const completed = input.snapshot();
    assert.equal(completed.gestureRadiusCssPx, null); assert.equal(completed.lastGestureKind, 'drag');
    assert.equal(completed.lastGestureRadiusCssPx, initialRadius);
    assert.ok(Math.abs(completed.lastPointerTravelCssPx - initialRadius) < 1e-12);
    assert.ok(Math.abs(completed.lastAngularTravelRadians - 1) < 1e-12);
    assert.deepEqual(endings, ['drag']);

    const nextRadius = projectedGestureRadiusCssPx(camera.dist, height);
    listeners.get('pointerdown')({ pointerType: 'touch', button: 0, pointerId: 2, clientX: 50, clientY: 50, timeStamp: startedAt + 60 });
    assert.equal(input.snapshot().gestureRadiusCssPx, nextRadius); assert.notEqual(nextRadius, initialRadius);
    input.reset(); assert.equal(input.snapshot().pointerCount, 0); assert.equal(input.snapshot().gestureRadiusCssPx, null);
    assert.equal(input.snapshot().lastGestureKind, 'reset');
  } finally {
    input.dispose();
    if (originalDocument === undefined) delete globalThis.document; else globalThis.document = originalDocument;
  }
});

test('detail-shell gesture proxies rotate and zoom without turning a tap into a cell activation', () => {
  const originalDocument = globalThis.document; const canvasListeners = new Map(); const proxyListeners = new Map();
  const pointerTarget = (listeners) => {
    const captured = new Set();
    return { addEventListener: (type, listener) => listeners.set(type, listener), removeEventListener: (type) => listeners.delete(type),
      setPointerCapture: (id) => captured.add(id), releasePointerCapture: (id) => captured.delete(id),
      hasPointerCapture: (id) => captured.has(id), captured };
  };
  const canvas = { ...pointerTarget(canvasListeners), getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
    focusCalls: 0, focus() { this.focusCalls++; } };
  const proxy = pointerTarget(proxyListeners); globalThis.document = { activeElement: proxy };
  const camera = createCamera(); const direct = []; let taps = 0; let wheelPrevented = false; let pointerPreventions = 0;
  const input = bindGlobeInput(canvas, camera, { canInteract: () => true, gestureTargets: [proxy], onTap: () => { taps++; },
    onDirectDelta: (x, y) => direct.push([x, y]) });
  try {
    const startedAt = performance.now(); const down = proxyListeners.get('pointerdown'); const move = proxyListeners.get('pointermove');
    const up = proxyListeners.get('pointerup'); const event = (pointerId, clientX, clientY, timeStamp) =>
      ({ currentTarget: proxy, pointerType: 'mouse', button: 0, pointerId, clientX, clientY, timeStamp,
        preventDefault() { pointerPreventions++; } });
    down(event(1, 100, 100, startedAt)); move(event(1, 170, 118, startedAt + 20)); up(event(1, 170, 118, startedAt + 40));
    assert.equal(direct.length, 1); assert.equal(taps, 0); assert.equal(canvas.focusCalls, 0);
    assert.equal(pointerPreventions, 1); assert.equal(proxy.captured.size, 0);
    const afterDrag = camera.dist;
    proxyListeners.get('wheel')({ deltaY: 180, preventDefault() { wheelPrevented = true; } });
    assert.equal(wheelPrevented, true); assert.notEqual(camera.dist, afterDrag);
    down(event(2, 130, 120, startedAt + 60)); up(event(2, 130, 120, startedAt + 80));
    assert.equal(taps, 0); assert.equal(pointerPreventions, 2); assert.equal(input.snapshot().lastGestureKind, 'tap');
  } finally {
    input.dispose();
    if (originalDocument === undefined) delete globalThis.document; else globalThis.document = originalDocument;
  }
});

test('keyboard globe activation targets the projected sphere center', () => {
  const canvas = { getBoundingClientRect: () => ({ left: 10, top: 20, width: 800, height: 600 }) };
  assert.deepEqual(keyboardActivationPoint(canvas, { offsetX: 0, offsetY: 0 }), [410, 320]);
  const offset = keyboardActivationPoint(canvas, { offsetX: 1 / 3, offsetY: -0.2 });
  assert.ok(Math.abs(offset[0] - (1600 / 3 + 10)) < 1e-10); assert.equal(offset[1], 380);
});

test('surface targets preserve native controls and canvas while isolating empty chrome', () => {
  const surface = {}; const trigger = {}; const child = {};
  const match = (accepted) => ({ matches: (selector) => accepted.some((value) => selector.includes(value)) });
  assert.equal(classifySurfaceTarget([child, surface], surface, [trigger]), 'inside');
  assert.equal(classifySurfaceTarget([child, trigger], surface, [trigger]), 'current-trigger');
  assert.equal(classifySurfaceTarget([match(['data-globe-gesture'])], surface, [trigger]), 'globe-gesture');
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
  for (const current of ['Evolution Globe', 'PERMANENT EVOLUTION', 'Shape what every future world inherits.', 'Environment Level', 'Leave this world?']) assert.equal(html.includes(current), true, current);
  for (const retired of ['Event Log', 'event-log-dialog', 'current-event-button', 'menu-event-log']) assert.equal(html.includes(retired), false, retired);
  for (const removed of ['adaptations-button', 'adaptations-dialog', 'adaptationMode', 'result-adaptations']) assert.equal(html.includes(removed), false, removed);
  assert.equal(/id="pause-button"[^>]*>Pause</.test(html), false);
  assert.equal((html.match(/role="tab"/g) ?? []).length, 4); assert.equal(html.includes('NETWORK SCORE'), false);
  assert.equal(html.includes('id="result-screen"'), false); assert.equal(html.includes('id="context-shell"'), true);
  const dir = new URL('../../src/interface/', import.meta.url);
  const source = readdirSync(dir).filter((name) => name.endsWith('.js'))
    .map((name) => readFileSync(new URL(name, dir), 'utf8')).join('\n');
  assert.equal(source.includes('showModal()'), false);
});
