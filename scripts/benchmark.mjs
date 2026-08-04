#!/usr/bin/env node
/**
 * Performance checkpoint: exactly one full run (fixed seed, balanced pilot)
 * measuring tick throughput and emitting a JSON checkpoint. Used by CI as a
 * regression gate with generous thresholds.
 *
 * Output: JSON on stdout; human summary on stderr.
 */
import { RunController } from '../src/simulation/simulator.js';
import { runHeadless } from './pilot.mjs';
import { cpus } from 'node:os';

const SEED = 20260731;

const samples = Array.from({ length: 3 }, () => runHeadless(
  { RunController },
  { seed: SEED, strainId: 'pioneer' },
  'balanced',
));
if (!samples.every((sample) => sample.result.hash === samples[0].result.hash && sample.ticks === samples[0].ticks))
  throw new Error('benchmark samples diverged');
const ordered = samples.slice().sort((a, b) => a.ms - b.ms); const { result, ticks, ms } = ordered[1];
const ticksPerSecond = Math.round(ticks / (ms / 1000));
const checkpoint = {
  date: new Date().toISOString().slice(0, 10),
  node: process.version,
  platform: process.platform,
  arch: process.arch,
  cpus: cpus().length,
  seed: SEED,
  ticks,
  elapsedMs: Math.round(ms),
  samplesMs: samples.map((sample) => Math.round(sample.ms)),
  ticksPerSecond,
  extinctionTick: result.tick,
  cause: result.cause,
  peakCoverage: Number(result.peakCoverage.toFixed(4)),
  hash: result.hash,
  heapUsedMB: Math.round(process.memoryUsage().heapUsed / 1e6),
};

// Regression gate: median of three deterministic samples limits runner jitter.
// A healthy desktop/CI runner should sustain >= 3000 ticks/s headless.
const MIN_TICKS_PER_SECOND = 3000;
const ok = ticksPerSecond >= MIN_TICKS_PER_SECOND;

console.log(JSON.stringify(checkpoint, null, 2));
console.error(
  `benchmark: ${ticks} ticks in ${Math.round(ms)} ms`
  + ` = ${ticksPerSecond} ticks/s (min ${MIN_TICKS_PER_SECOND})`
  + ` | hash ${result.hash} | ${ok ? 'OK' : 'REGRESSED'}`,
);
process.exit(ok ? 0 : 1);
