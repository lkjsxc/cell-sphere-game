import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RunController } from '../../../src/simulation/simulator.js';
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

test('public schedule is build-independent while relevant defense changes only effective pressure', () => {
  const weak = new RunController({ seed: 7103, worldOrdinal: '3' });
  const strong = new RunController({ seed: 7103, worldOrdinal: '3', evolutionDefense: { affinityDefense: {
    Fertility: '1000000', Freshwater: '1000000', Scarcity: '1000000', Cryogenic: '1000000', Marine: '1000000', Luminous: '1000000',
  } } });
  weak.start(); strong.start(); weak.advance(1800); strong.advance(1800);
  assert.equal(weak.state.currentEnvironmentLevel, '2'); assert.equal(strong.state.currentEnvironmentLevel, '2');
  assert.equal(weak.state.environmentLevelStartTick, strong.state.environmentLevelStartTick);
  assert.ok(strong.state.currentEnvironmentProfile.score.pressure <= weak.state.currentEnvironmentProfile.score.pressure);
});

test('onboarding leaves clock intact and the rolling event director stays bounded/reclaims evidence', () => {
  const protectedRun = new RunController({ seed: 7104, worldOrdinal: '1' });
  const activeRun = new RunController({ seed: 7104, worldOrdinal: '3' });
  protectedRun.start(); activeRun.start(); protectedRun.advance(1200); activeRun.advance(1200);
  assert.equal(protectedRun.state.currentEnvironmentLevel, '1'); assert.equal(activeRun.state.currentEnvironmentLevel, '1');
  assert.equal(protectedRun.state.events.length, 0); assert.ok(activeRun.state.events.length <= 6);
  for (let step = 0; step < 30 && activeRun.state.status !== 'extinct'; step++) {
    activeRun.advance(100);
    assert.ok(activeRun.state.events.length <= 6);
    assert.ok(activeRun.state.eventDirector.recent.length <= 8);
  }
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
  const prior = new RunController({ seed: 7105, worldOrdinal: '3' }); prior.start(); prior.advance(2400);
  assert.ok(BigInt(prior.state.peakEnvironmentLevel) >= 3n);
  const next = new RunController({ seed: 7106, worldOrdinal: '4' });
  assert.equal(next.state.currentEnvironmentLevel, '0'); assert.equal(next.state.peakEnvironmentLevel, '0');
  assert.equal(next.state.environmentTransitionCount, '0'); assert.equal(next.state.environmentExposure.totalTicks, '0');
});
