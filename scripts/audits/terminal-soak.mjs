#!/usr/bin/env node
/** Deep deterministic terminal-completion soak using production authority. */
import { performance } from 'node:perf_hooks';
import { BALANCE as B } from '../../src/game/balance.js';
import { RunController } from '../../src/simulation/simulator.js';

const count = Number(process.argv.find((arg) => arg.startsWith('--count='))?.split('=')[1] ?? 1000);
if (!Number.isInteger(count) || count < 1 || count > 100_000) throw new Error('count must be 1..100000');
const started = performance.now(); const causes = {}; const terminals = {}; const ticks = [];
let duplicates = 0; let invalid = 0; let repairs = 0;
for (let index = 0; index < count; index++) {
  const events = [];
  const run = new RunController({ seed: (0x5f3759df + index * 2654435761) >>> 0,
    worldOrdinal: index % 12 + 1, worldPotential: 16000 }, (message) => { if (message.t === 'extinct') events.push(message); });
  run.start();
  while (run.state.status !== 'extinct') run.advance(64);
  const result = run.buildResult(); const exact = run.state.alive.reduce((sum, value) => sum + value, 0);
  duplicates += Math.max(0, events.length - 1); repairs += result.diagnostics.livenessRepairs;
  if (events.length !== 1 || exact !== 0 || result.finalLivingCount !== 0
      || result.tick > B.RUN_HARD_MAX_TICKS || !/^[0-9a-f]{8}$/i.test(result.hash)) invalid++;
  causes[result.cause] = (causes[result.cause] ?? 0) + 1;
  terminals[result.terminalCause] = (terminals[result.terminalCause] ?? 0) + 1;
  ticks.push(result.tick);
}
ticks.sort((a, b) => a - b);
const report = {
  worlds: count, elapsedMs: Number((performance.now() - started).toFixed(1)), invalid,
  duplicateTerminalMessages: duplicates, livenessRepairs: repairs,
  ticks: { min: ticks[0], median: ticks[Math.floor(count / 2)], p95: ticks[Math.floor(count * .95)], max: ticks.at(-1) },
  causes, terminalCauses: terminals,
};
console.log(JSON.stringify(report, null, 2));
if (invalid || duplicates) process.exitCode = 1;
