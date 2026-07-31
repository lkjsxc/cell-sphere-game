#!/usr/bin/env node
/**
 * Authoritative verification gate: runs every fast local check in order and
 * reports a summary. Exits non-zero if any gate fails.
 *
 * Gates:
 *   1. check:structure     repository legibility rules
 *   2. test:unit           node:test unit suites
 *   3. test:integration    deterministic golden + speed-invariance suites
 *   4. balance:smoke       bounded headless balance simulation
 *   5. benchmark           3000-tick performance checkpoint
 *   6. check:links         static asset/import/deployment path checks
 *
 * Browser tests (scripts/browser-test.mjs) need Chrome and are run
 * separately via `npm run test:browser`.
 */
import { spawnSync } from 'node:child_process';

const gates = [
  ['check:structure', ['node', 'scripts/check-structure.mjs']],
  ['test:unit', ['node', '--test', 'tests/unit/']],
  ['test:integration', ['node', '--test', 'tests/integration/']],
  ['balance:smoke', ['node', 'scripts/balance.mjs', '--smoke']],
  ['benchmark', ['node', 'scripts/benchmark.mjs']],
  ['check:links', ['node', 'scripts/check-links.mjs']],
];

const results = [];
let failed = false;
for (const [name, cmd] of gates) {
  const started = performance.now();
  const res = spawnSync(cmd[0], cmd.slice(1), { stdio: 'inherit' });
  const ms = Math.round(performance.now() - started);
  const ok = res.status === 0;
  results.push({ name, ok, ms });
  if (!ok) failed = true;
}

console.log('\nverify summary');
for (const r of results) {
  console.log(`  ${r.ok ? 'PASS' : 'FAIL'}  ${r.name}  (${r.ms} ms)`);
}
process.exit(failed ? 1 : 0);
