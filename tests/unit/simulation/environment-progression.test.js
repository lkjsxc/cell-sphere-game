import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RunController } from '../../../src/simulation/simulator.js';
import { beginTerminalCollapse, updateEnvironmentProgression } from '../../../src/simulation/state.js';
import { compileChallengeProfile } from '../../../src/simulation/challenge-profile.js';
import {
  createEnvironmentExposure, environmentExposureSummary, sampleEnvironmentExposure,
} from '../../../src/game/environment-exposure.js';

test('new run authority ignores a selected static level/profile and keeps the Level-0 resource baseline', () => {
  const staticProfile = compileChallengeProfile({ environmentLevel: '999999' });
  const normal = new RunController({ seed: 7101, worldOrdinal: '3' });
  const imported = new RunController({ seed: 7101, worldOrdinal: '3', environmentLevel: '999999', challengeProfile: staticProfile });
  for (const state of [normal.state, imported.state]) {
    assert.equal(state.currentEnvironmentLevel, '0'); assert.equal(state.peakEnvironmentLevel, '0');
    assert.equal(state.environmentLevelStartTick, '0'); assert.equal(state.environmentTransitionCount, '0');
    assert.equal(state.currentEnvironmentProfile.environmentLevel, '0');
  }
  assert.deepEqual(imported.state.initialResourceReserve, normal.state.initialResourceReserve);
  assert.deepEqual(imported.state.nutrient, normal.state.nutrient);
});

test('schedule transitions install current/next profiles once before ecology consumers', () => {
  const messages = []; const run = new RunController({ seed: 7102, worldOrdinal: '3' }, (message) => messages.push(message));
  run.start(); run.advance(1199);
  assert.equal(run.state.currentEnvironmentLevel, '0'); assert.equal(run.state.environmentTransitionCount, '0');
  run.advance(1);
  assert.equal(run.state.currentEnvironmentLevel, '1'); assert.equal(run.state.peakEnvironmentLevel, '1');
  assert.equal(run.state.environmentTransitionCount, '1');
  assert.equal(run.state.currentEnvironmentProfile.environmentLevel, '1');
  assert.equal(run.state.nextEnvironmentProfile.environmentLevel, '2');
  assert.equal(run.state.environmentLevelStartTick, '1200'); assert.equal(run.state.nextEnvironmentLevelTick, '1800');
  assert.equal(messages.filter((message) => message.t === 'environment-transition').length, 1);
  run.advance(1); assert.equal(run.state.environmentTransitionCount, '1');
});

test('snapshots and results expose the authoritative interpolated pressure summary', () => {
  const run = new RunController({ seed: 7105, worldOrdinal: '3' }); run.start(); run.advance(600);
  const snapshot = run.snapshot(); const pressure = snapshot.environmentPressureSummary;
  assert.equal(pressure.level, '0'); assert.equal(pressure.nextLevel, '1');
  assert.equal(pressure.interpolationQ, run.state.environmentLevelProgressQ);
  assert.equal(pressure.profileHash, run.state.currentEnvironmentProfileHash);
  assert.equal(pressure.nextProfileHash, run.state.nextEnvironmentProfile.hash);
  assert.deepEqual(pressure.effectiveCoefficients, run.state.environmentCoefficients);
  assert.deepEqual(run.buildResult().environmentPressureSummary, pressure);
});

test('public schedule is build-independent while relevant defense changes only effective pressure', () => {
  const weak = new RunController({ seed: 7103, worldOrdinal: '3' });
  const strong = new RunController({ seed: 7103, worldOrdinal: '3', evolutionDefense: { affinityDefense: {
    Fertility: '1000000', Freshwater: '1000000', Scarcity: '1000000', Cryogenic: '1000000', Marine: '1000000', Luminous: '1000000',
  } } });
  weak.start(); strong.start();
  weak.state.tick = 1800; strong.state.tick = 1800; updateEnvironmentProgression(weak.state); updateEnvironmentProgression(strong.state);
  assert.equal(weak.state.currentEnvironmentLevel, '2'); assert.equal(strong.state.currentEnvironmentLevel, '2');
  assert.equal(weak.state.environmentLevelStartTick, strong.state.environmentLevelStartTick);
  assert.ok(strong.state.currentEnvironmentProfile.score.pressure <= weak.state.currentEnvironmentProfile.score.pressure);
});

test('chronic pressure leaves no onboarding or gameplay-disaster state', () => {
  const first = new RunController({ seed: 7104, worldOrdinal: '1' });
  const later = new RunController({ seed: 7104, worldOrdinal: '3' });
  first.start(); later.start(); first.advance(1200); later.advance(1200);
  assert.equal(first.state.currentEnvironmentLevel, '1'); assert.equal(later.state.currentEnvironmentLevel, '1');
  for (const state of [first.state, later.state]) {
    for (const key of ['events', 'eventDirector', 'eventRng', 'onboardingEnvironmentModifier']) assert.equal(key in state, false, key);
    assert.ok(Object.values(state.environmentCoefficients).every(Number.isFinite));
  }
});

test('terminal-collapse fade still advances each crossed public boundary and final evidence', () => {
  for (const { boundary, level } of [{ boundary: 1200, level: '1' }, { boundary: 1800, level: '2' }]) {
    const messages = []; const run = new RunController({ seed: 7106, worldOrdinal: '3' }, (message) => messages.push(message));
    run.start();
    if (boundary === 1800) { run.state.tick = 1200; updateEnvironmentProgression(run.state); }
    run.state.tick = boundary - 1; assert.equal(beginTerminalCollapse(run.state, 'terminal-stall'), true);
    run.advance(1);
    assert.equal(run.state.currentEnvironmentLevel, level);
    assert.equal(run.state.environmentTransitionCount, level);
    assert.equal(messages.filter((message) => message.t === 'environment-transition').at(-1)?.environmentLevel, level);
    run.advance(30); const result = run.buildResult();
    assert.equal(result.finalEnvironmentLevel, level); assert.equal(result.environmentTransitionCount, level);
  }
});

test('terminal collapse decays whole-cell charge without resuming Luminous generation', () => {
  const run = new RunController({ seed: 7107, worldOrdinal: '3' }); run.start();
  const state = run.state; const cell = state.inoculationCell;
  state.luminous = { ...state.luminous, enabled: true, retention: .976 };
  state.electricCharge[cell] = 1; state.electricityQ[cell] = 255; state.electrifiedCells = 1;
  const poweredTicks = state.poweredCellTicks;
  assert.equal(beginTerminalCollapse(state, 'terminal-stall'), true);
  run.advance(1);
  assert.ok(state.electricCharge[cell] < 1); assert.ok(state.electricityQ[cell] < 255);
  assert.equal(state.electrifiedCells, 1); assert.equal(state.poweredCellTicks, poweredTicks);
});

test('bounded exposure flushes exact pressure-time and final peak evidence', () => {
  const exposure = createEnvironmentExposure('0');
  sampleEnvironmentExposure(exposure, { throughTick: 120, pressure: .5, quality: .8,
    currentLevel: '1', peakLevel: '1', flush: true });
  const summary = environmentExposureSummary(exposure);
  assert.equal(summary.totalTicks, '120'); assert.equal(summary.pressureTicksQ, '60000000');
  assert.equal(summary.qualityPressureTicksQ, '48000000'); assert.equal(summary.timeAtPeakTicks, '120');
  assert.equal(summary.peakPressureQ, 500000);
});

test('a next world resets Level-0 fields after a prior high peak', () => {
  const prior = new RunController({ seed: 7105, worldOrdinal: '3' }); prior.start();
  // Schedule ownership is independent of whether a fragile ecology has already extinguished.
  prior.state.tick = 2400; updateEnvironmentProgression(prior.state);
  assert.ok(Number(prior.state.peakEnvironmentLevel) >= 3);
  const next = new RunController({ seed: 7106, worldOrdinal: '4' });
  assert.equal(next.state.currentEnvironmentLevel, '0'); assert.equal(next.state.peakEnvironmentLevel, '0');
  assert.equal(next.state.environmentTransitionCount, '0'); assert.equal(next.state.environmentExposure.totalTicks, '0');
});
