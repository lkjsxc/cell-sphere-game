#!/usr/bin/env node
/** Deterministic v2 schedule/transition benchmark with production long-world checkpoints. */
import { performance } from 'node:perf_hooks';
import { cpus } from 'node:os';
import { mkdirSync, writeFileSync } from 'node:fs';
import { RunController } from '../src/simulation/simulator.js';
import { runHeadless } from './pilot.mjs';
import { MEMORY_NODES, MEMORY_NODE_IDS, compileEvolution, evolutionCompileCacheDiagnostics, evolutionRunConfiguration,
  resetEvolutionCompileCache } from '../src/game/skills/index.js';
import { compileChallengeProfile } from '../src/simulation/challenge-profile.js';
import { environmentLevelAtTick, environmentTickForLevel } from '../src/game/environment-level.js';

const SEED = 20260731;
// Hosted CI has a materially different shared CPU budget from same-host
// regression measurements. Keep a conservative infrastructure floor there;
// compare release performance against recorded same-host medians instead.
const MIN_TICKS_PER_SECOND = process.env.CI ? 2400 : 3000;
const samples = Array.from({ length: 3 }, () => runHeadless({ RunController }, { seed: SEED, strainId: 'pioneer' }, 'balanced',
  { budgetTicks: 10_000 }));
if (!samples.every((sample) => sample.complete && sample.result?.hash === samples[0].result?.hash && sample.ticks === samples[0].ticks)) {
  throw new Error('benchmark samples diverged or exceeded external budget');
}
const ordered = samples.slice().sort((a, b) => a.ms - b.ms);
const { result, ticks, ms } = ordered[1];
const ticksPerSecond = Math.round(ticks / (ms / 1000));
const breadth = compileEvolution({ evolutionLevels: MEMORY_NODE_IDS.map((id) => ({ id, level: '1' })) });
const deepLuminous = compileEvolution({ evolutionLevels: MEMORY_NODES.map((node) => ({ id: node.id, level: node.domain === 'Luminous' ? '20' : '1' })) });
const fresh = compileEvolution({});
const extremeLevel = `1${'0'.repeat(512)}`;
const profiles = {
  breadth: measureRun(SEED + 1, breadth),
  deepLuminous: measureRun(SEED + 2, deepLuminous),
  fresh: measureRun(SEED + 3, fresh),
  extremeEnvironmentCompiler: measureProfile(extremeLevel, fresh),
};
resetEvolutionCompileCache(); const compileAt = performance.now();
for (let index = 0; index < 1000; index++) compileEvolution({ evolutionLevels: [{ id: MEMORY_NODE_IDS[index % MEMORY_NODE_IDS.length], level: String(index + 1) }] });
const compileCache = { elapsedMs: Number((performance.now() - compileAt).toFixed(2)), ...evolutionCompileCacheDiagnostics() };
const checkpoint = { date: new Date().toISOString().slice(0, 10), node: process.version, platform: process.platform,
  arch: process.arch, cpus: cpus().length, seed: SEED, minTicksPerSecond: MIN_TICKS_PER_SECOND, ticks, elapsedMs: Math.round(ms),
  samplesMs: samples.map((sample) => Math.round(sample.ms)), ticksPerSecond, extinctionTick: result.tick,
  peakEnvironmentLevel: result.peakEnvironmentLevel, cause: result.cause, peakCoverage: Number(result.peakCoverage.toFixed(4)),
  hash: result.hash, profiles, compileCache, heapUsedMB: Math.round(process.memoryUsage().heapUsed / 1e6), valid: false };
checkpoint.valid = ticksPerSecond >= MIN_TICKS_PER_SECOND && Object.values(profiles).every((row) => row.finite && row.complete !== false)
  && compileCache.size <= compileCache.limit && compileCache.bytes <= compileCache.byteLimit && compileCache.elapsedMs < 1000;
mkdirSync('reports', { recursive: true }); writeFileSync('reports/benchmark.json', `${JSON.stringify(checkpoint, null, 2)}\n`);
console.log(JSON.stringify(checkpoint, null, 2));
console.error(`benchmark: ${ticks} ticks in ${Math.round(ms)} ms = ${ticksPerSecond} ticks/s (min ${MIN_TICKS_PER_SECOND}) | hash ${result.hash} | ${checkpoint.valid ? 'OK' : 'REGRESSED'}`);
process.exit(checkpoint.valid ? 0 : 1);

function measureRun(seed, evolution) {
  const heapBefore = process.memoryUsage().heapUsed;
  const controller = new RunController({ seed, worldOrdinal: '20', ...evolutionRunConfiguration(evolution) });
  const at = performance.now(); controller.start(); let remaining = 20_000;
  while (controller.state.status !== 'extinct' && remaining > 0) { controller.advance(Math.min(64, remaining)); remaining -= 64; }
  const elapsed = performance.now() - at; const complete = controller.state.status === 'extinct'; const result = controller.buildResult();
  return { tick: result.tick, peakEnvironmentLevel: result.peakEnvironmentLevel, elapsedMs: Number(elapsed.toFixed(2)),
    ticksPerSecond: Math.round(result.tick / (elapsed / 1000)), heapDeltaMB: Number(((process.memoryUsage().heapUsed - heapBefore) / 1e6).toFixed(2)),
    hash: result.hash, complete, finite: Number.isFinite(result.survivalSeconds) && result.startEnvironmentLevel === '0' };
}
function measureProfile(level, evolution) {
  const at = performance.now(); const profile = compileChallengeProfile({ environmentLevel: level, evolution });
  const tick = environmentTickForLevel(level);
  return { environmentLevelDigits: level.length, tickDigits: tick.length, directInverse: environmentLevelAtTick(tick) === level,
    pressure: profile.score.pressure, elapsedMs: Number((performance.now() - at).toFixed(2)), complete: true,
    finite: Object.values(profile.coefficients).every(Number.isFinite) && Number.isFinite(profile.score.pressure) };
}
