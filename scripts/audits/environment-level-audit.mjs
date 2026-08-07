#!/usr/bin/env node
/** Production within-world Environment schedule, profile, and bounded-director audit. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { RunController } from '../../src/simulation/simulator.js';
import { compileChallengeProfile, MAX_EVENTS_PER_WORLD, MIN_TELEGRAPH_TICKS } from '../../src/simulation/challenge-profile.js';
import { MEMORY_NODE_IDS, compileEvolution } from '../../src/game/skills/index.js';
import { scoreResult } from '../../src/game/scoring.js';
import {
  ENVIRONMENT_SCHEDULE_HASH, environmentLevelAtTick, environmentScheduleAtTick, environmentTickForLevel,
} from '../../src/game/environment-level.js';
import { multiplyProgressionIntegers } from '../../src/core/progression-integer.js';

const smoke = process.argv.includes('--smoke');
const seeds = smoke ? 6 : 16;
const externalBudgetTicks = smoke ? 10_000 : 20_000;
const levels = ['0', '1', '2', '4', '8', '32'];
const started = performance.now();
const fresh = compileEvolution({});
const breadth = compileEvolution({ evolutionLevels: MEMORY_NODE_IDS.map((id) => ({ id, level: '1' })) });
const deep = compileEvolution({ evolutionLevels: MEMORY_NODE_IDS.map((id) => ({ id, level: '10' })) });
const huge = `1${'0'.repeat(512)}`;
const compilerLevels = [...levels, '1000000', huge];
const compiler = compilerLevels.map((level) => {
  const at = performance.now();
  const profile = compileChallengeProfile({ environmentLevel: level, evolution: fresh });
  return profileRow(profile, performance.now() - at);
});
const scheduleRows = compilerLevels.map((level) => {
  const tick = environmentTickForLevel(level); const state = environmentScheduleAtTick(tick);
  return { level, tick, inverse: environmentLevelAtTick(tick), nextTick: state.nextEnvironmentLevelTick,
    progressQ: state.environmentLevelProgressQ, hash: state.environmentScheduleHash };
});
const cohortSpecs = [
  ['fresh', fresh], ['breadth-level-1', breadth], ['deep-level-10', deep],
];
const cohorts = cohortSpecs.map(([name, evolution]) => {
  const runs = Array.from({ length: seeds }, (_, index) => runWorld(0x710000 + index, evolution, externalBudgetTicks));
  return { name, runs, summary: summarizeRuns(runs) };
});
const profileComparisons = ['8', '32', '1000000'].map((level) => {
  const matched = uniformEvolution(level); const overpowered = uniformEvolution(multiplyProgressionIntegers(level, '2'));
  return { level, fresh: profileSummary(compileChallengeProfile({ environmentLevel: level, evolution: fresh })),
    breadth: profileSummary(compileChallengeProfile({ environmentLevel: level, evolution: breadth })),
    deep: profileSummary(compileChallengeProfile({ environmentLevel: level, evolution: deep })),
    matched: profileSummary(compileChallengeProfile({ environmentLevel: level, evolution: matched })),
    overpowered: profileSummary(compileChallengeProfile({ environmentLevel: level, evolution: overpowered })) };
});
const pressureMonotone = compiler.every((row, index) => index === 0 || row.pressure + 1e-9 >= compiler[index - 1].pressure);
const scheduleExact = scheduleRows.every((row, index) => row.inverse === row.level && row.progressQ === 0
  && row.hash === ENVIRONMENT_SCHEDULE_HASH && (index === 0 || BigInt(row.tick) > BigInt(scheduleRows[index - 1].tick)));
const defenseHelps = profileComparisons.every((row) => row.deep.pressure <= row.breadth.pressure
  && row.breadth.pressure <= row.fresh.pressure && row.matched.pressure === 0 && row.overpowered.pressure === 0);
const bounded = compiler.every((row) => row.finite && row.events <= MAX_EVENTS_PER_WORLD && row.telegraphTicks >= MIN_TELEGRAPH_TICKS && row.compileMs < 50);
const startsAtZero = cohorts.every((cohort) => cohort.runs.every((row) => row.startEnvironmentLevel === '0'));
const finiteBuildsTerminate = cohorts.every((cohort) => cohort.runs.every((row) => row.status === 'extinct'));
const boundedDirector = cohorts.every((cohort) => cohort.runs.every((row) => row.maxEvents <= MAX_EVENTS_PER_WORLD
  && row.maxRecentEvents <= 8 && row.nonFinite === false));
const strongerReachesFarther = median(cohorts[1].runs.map((row) => row.peakLevel)) >= median(cohorts[0].runs.map((row) => row.peakLevel));
const noInstantFarm = cohorts.every((cohort) => cohort.runs.every((row) => row.environmentBonusRate <= .005 && row.score !== '0'));
const report = {
  schema: 3, model: 'within-world-v2', mode: smoke ? 'smoke' : 'full', seedsPerCohort: seeds,
  externalBudgetTicks, schedule: { hash: ENVIRONMENT_SCHEDULE_HASH, rows: scheduleRows }, compiler,
  cohorts: cohorts.map(({ name, summary }) => ({ name, ...summary })), profileComparisons,
  invariants: { scheduleExact, pressureMonotone, defenseHelps, bounded, startsAtZero,
    finiteBuildsTerminate, boundedDirector, strongerReachesFarther, noInstantFarm },
  elapsedMs: Number((performance.now() - started).toFixed(1)),
};
report.valid = Object.values(report.invariants).every(Boolean);
mkdirSync('reports', { recursive: true });
writeFileSync(`reports/environment-level-audit-${smoke ? 'smoke' : 'full'}.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.valid) process.exitCode = 1;

function uniformEvolution(level) { return compileEvolution({ evolutionLevels: MEMORY_NODE_IDS.map((id) => ({ id, level })) }); }
function runWorld(seed, evolution, budget) {
  const controller = new RunController({ seed, worldOrdinal: '20', worldPotential: evolution.worldPotential,
    evolutionPower: evolution.evolutionPower, evolutionDepth: evolution.evolutionDepth, potentialVersion: evolution.potentialVersion,
    evolutionDefense: { affinityDefense: evolution.affinityDefense, pressureDefense: evolution.pressureDefense },
    memoryEffects: evolution.effects, memoryConditionals: evolution.conditionals, memoryUnlocks: evolution.unlocks,
    habitatCapabilities: evolution.habitatCapabilities, activeBuilds: evolution.activeBuilds,
    buildEffects: evolution.buildEffects, electricityMastery: evolution.electricityMastery });
  controller.start(); let maxEvents = 0; let maxRecentEvents = 0;
  while (controller.state.status !== 'extinct' && controller.state.tick < budget) {
    controller.advance(100);
    maxEvents = Math.max(maxEvents, controller.state.events.length);
    maxRecentEvents = Math.max(maxRecentEvents, controller.state.eventDirector?.recent?.length ?? 0);
  }
  const result = controller.buildResult(); const score = scoreResult(result);
  return { status: controller.state.status, tick: result.tick, startEnvironmentLevel: result.startEnvironmentLevel,
    peakLevel: result.peakEnvironmentLevel, survivalSeconds: result.survivalSeconds, cause: result.cause,
    score: score.total, environmentBonusRate: score.environmentCredit.bonus, maxEvents, maxRecentEvents,
    nonFinite: ![result.peakCoverage, result.survivalSeconds, result.tick, score.environmentCredit.bonus].every(Number.isFinite) };
}
function profileRow(profile, compileMs) { return { level: profile.environmentLevel, ratingDigits: profile.publicRating.length,
  pressure: profile.score.pressure, events: profile.events.count, telegraphTicks: profile.events.telegraphTicks,
  compileMs: Number(compileMs.toFixed(3)), hash: profile.hash,
  finite: [...Object.values(profile.coefficients), ...Object.values(profile.events), profile.score.pressure].every(Number.isFinite) }; }
function profileSummary(profile) { return { pressure: profile.score.pressure, events: profile.events.count, hash: profile.hash,
  netRatings: Object.fromEntries(Object.entries(profile.dimensions).map(([key, value]) => [key, value.netRating])) }; }
function summarizeRuns(runs) { return { runs: runs.length, medianSeconds: median(runs.map((row) => row.survivalSeconds)),
  p25Seconds: percentile(runs.map((row) => row.survivalSeconds), .25), p75Seconds: percentile(runs.map((row) => row.survivalSeconds), .75),
  medianPeakLevel: median(runs.map((row) => row.peakLevel)), causes: counts(runs.map((row) => row.cause)),
  complete: runs.filter((row) => row.status === 'extinct').length }; }
function median(values) { return percentile(values, .5); }
function percentile(values, q) { const sorted = values.slice().sort((a, b) => (typeof a === 'string' ? BigInt(a) > BigInt(b) ? 1 : BigInt(a) < BigInt(b) ? -1 : 0 : a - b));
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * q)))] ?? 0; }
function counts(values) { const out = {}; for (const value of values) out[value] = (out[value] ?? 0) + 1; return out; }
