#!/usr/bin/env node
/**
 * Authoritative verification gate: runs every fast local check in order and
 * reports a summary. Exits non-zero if any gate fails.
 *
 * Gates:
 *   1. check:structure     repository legibility rules
 *   2. audit:cell-visuals  rejects sub-cell production geography
 *   3. showcase:check      generated title data matches production sources
 *   4. test:unit           node:test unit suites
 *   5. test:integration    deterministic golden + speed-invariance suites
 *   6. audit:lakes         500-seed whole-cell lake distribution
 *   7. balance:smoke       bounded headless balance simulation
 *   8. benchmark           performance checkpoint
 *   9. check:links         static asset/import/deployment path checks
 *
 * Browser tests (scripts/browser-test.mjs) need Chrome and are run
 * separately via `npm run test:browser`.
 */
import { spawnSync } from 'node:child_process';

const gates = [
  ['check:structure', 'node scripts/check-structure.mjs'],
  ['audit:cell-visuals', 'node scripts/audits/cell-visual-audit.mjs'],
  ['showcase:check', 'node scripts/generate-title-showcase.mjs --check'],
  ['test:unit', 'node --test tests/unit/*.test.js tests/unit/simulation/*.test.js'],
  ['test:integration', 'node --test tests/integration/*.test.js'],
  ['audit:lakes', 'node scripts/audits/lake-audit.mjs --count=500'],
  ['balance:smoke', 'node scripts/balance.mjs --smoke'],
  ['benchmark', 'node scripts/benchmark.mjs'],
  ['check:links', 'node scripts/check-links.mjs'],
];

const results = [];
let failed = false;
for (const [name, command] of gates) {
  const started = performance.now();
  const res = spawnSync(command, { shell: true, stdio: 'inherit' });
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
