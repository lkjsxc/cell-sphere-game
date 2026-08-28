/** Result continuation presentation is a bounded projection of one authority clock. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  advanceContinuation,
  cancelContinuation,
  completeContinuation,
  continuationPresentation,
  createContinuation,
  createContinuationPresentationCadence,
  DEFAULT_CONTINUATION_DURATION_MS,
  disableContinuation,
  planContinuationPresentation,
  setContinuationHidden,
  startContinuation,
} from '../../../src/interface/policies/continuation.js';

test('counting projection derives monotone bounded progress and exact accessible seconds', () => {
  const state = createContinuation(); const generation = startContinuation(state, 1000, { resultTransactionKey: 'result-a' });
  const start = continuationPresentation(state);
  assert.equal(DEFAULT_CONTINUATION_DURATION_MS, 13_500); assert.equal(state.durationMs, DEFAULT_CONTINUATION_DURATION_MS);
  assert.equal(start.status, 'counting'); assert.equal(start.progress, 0); assert.equal(start.remainingSeconds, 14);
  assert.equal(start.visibleText, 'World cycle continues automatically');
  assert.equal(start.accessibleText, 'Next World starts automatically in 14 seconds. Any interaction cancels it.');
  assert.equal(start.active, true); assert.equal(generation, 1);
  assert.equal(advanceContinuation(state, 4375), false); const quarter = continuationPresentation(state);
  assert.equal(quarter.progress, .25); assert.equal(quarter.remainingSeconds, 11);
  assert.ok(quarter.progress >= start.progress && quarter.progress <= 1);
  assert.equal(advanceContinuation(state, 14_499), false, 'fired before the exact default duration');
  assert.equal(advanceContinuation(state, 14_500), true); const firing = continuationPresentation(state);
  assert.equal(firing.status, 'firing'); assert.equal(firing.progress, 1); assert.equal(firing.firing, true);
  assert.equal(completeContinuation(state, generation), true); assert.equal(continuationPresentation(state).complete, true);
});

test('hidden, cancelled, and disabled states preserve truthful non-color text', () => {
  const state = createContinuation(); startContinuation(state, 0);
  advanceContinuation(state, 2100); const beforeHidden = continuationPresentation(state);
  assert.equal(setContinuationHidden(state, true, 2100), true); const paused = continuationPresentation(state);
  assert.equal(paused.paused, true); assert.equal(paused.progress, beforeHidden.progress);
  assert.match(paused.visibleText, /paused while hidden/); assert.match(paused.accessibleText, /12 seconds remaining/);
  assert.equal(advanceContinuation(state, 30_000), false); assert.equal(continuationPresentation(state).progress, paused.progress);
  assert.equal(setContinuationHidden(state, false, 30_000), true);
  assert.equal(cancelContinuation(state, 'keyboard'), true); const cancelled = continuationPresentation(state);
  assert.equal(cancelled.cancelled, true); assert.match(cancelled.visibleText, /cancelled by interaction/);
  assert.equal(cancelContinuation(state, 'again'), false);

  const off = createContinuation(); disableContinuation(off, { resultTransactionKey: 'result-b' });
  const disabled = continuationPresentation(off);
  assert.equal(disabled.disabled, true); assert.match(disabled.visibleText, /continuation is off/);
  assert.match(disabled.accessibleText, /manually/); assert.equal(disabled.active, false);
});

test('presentation cadence bounds styles near 30 Hz and text near one-second boundaries', () => {
  const authority = createContinuation(); startContinuation(authority, 0);
  const cadence = createContinuationPresentationCadence(); let style = 0; let visible = 0; let accessible = 0;
  for (let now = 0; now <= 1000; now += 10) {
    advanceContinuation(authority, now);
    const plan = planContinuationPresentation(cadence, continuationPresentation(authority), now);
    style += Number(plan.styleChanged); visible += Number(plan.visibleChanged); accessible += Number(plan.accessibleChanged);
  }
  assert.ok(style >= 25 && style <= 31, `style updates ${style}`);
  assert.equal(visible, 1); assert.equal(accessible, 2, 'initial 14 seconds and the 13-second boundary only');
  const stable = planContinuationPresentation(cadence, continuationPresentation(authority), 1001);
  assert.equal(stable.styleChanged, false); assert.equal(stable.visibleChanged, false); assert.equal(stable.accessibleChanged, false);
});

test('projection sanitizes malformed timing without creating another deadline', () => {
  const projection = continuationPresentation({ status: 'counting', durationMs: NaN, remainingMs: Infinity });
  assert.equal(projection.progress, 0); assert.equal(projection.remainingMs, 1); assert.equal(projection.remainingSeconds, 1);
  assert.ok(Number.isFinite(projection.progress)); assert.equal('deadline' in projection, false);
});

test('presentation adds no independent clock or CSS countdown animation', () => {
  const policy = readFileSync(new URL('../../../src/interface/policies/continuation.js', import.meta.url), 'utf8');
  const styles = readFileSync(new URL('../../../styles/shell.css', import.meta.url), 'utf8');
  assert.doesNotMatch(policy, /setTimeout|setInterval|requestAnimationFrame/);
  for (const rule of styles.matchAll(/[^{}]*continuation[^{}]*\{([^{}]*)\}/g)) {
    assert.doesNotMatch(rule[1], /\banimation(?:-\w+)?\s*:/);
  }
});
