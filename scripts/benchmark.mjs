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

const { result, ticks, ms } = runHeadless(
  { RunController },
  { seed: SEED, strainId: 'pioneer' },
  'balanced',
  { signals: true },
);

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
  ticksPerSecond,
  extinctionTick: result.tick,
  cause: result.cause,
  peakCoverage: Number(result.peakCoverage.toFixed(4)),
  hash: result.hash,
  heapUsedMB: Math.round(process.memoryUsage().heapUsed / 1e6),
};

// Regression gate: a healthy desktop should sustain >= 3000 ticks/s headless.
// (Mobile targets are documented separately; CI runs on GitHub runners.)
const MIN_TICKS_PER_SECOND = 3000;
const ok = ticksPerSecond >= MIN_TICKS_PER_SECOND;

console.log(JSON.stringify(checkpoint, null, 2));
console.error(
  `benchmark: ${ticks} ticks in ${Math.round(ms)} ms`
  + ` = ${ticksPerSecond} ticks/s (min ${MIN_TICKS_PER_SECOND})`
  + ` | hash ${result.hash} | ${ok ? 'OK' : 'REGRESSED'}`,
);
process.exit(ok ? 0 : 1);
