#!/usr/bin/env node
/**
 * Authoritative verification gate: runs every fast local check in order and
 * reports a summary. Exits non-zero if any gate fails.
 *
 * Gates:
 *   1. check:structure     repository legibility rules
 *   2. audit:identity      canonical source/package/browser/storage identity
 *   3. audit:cell-visuals  rejects sub-cell production geography
 *   4. showcase:check      generated title data matches production sources
 *   5. test:unit           node:test unit suites
 *   6. test:integration    deterministic golden + speed-invariance suites
 *   7. endless audits      exact numbers, Environment, Evolution, and Luminous
 *   8. ecology audits      resources, freshwater, SCORE, transformations, REACH 100
 *   9. audit:lakes         500-seed whole-cell lake distribution
 *  10. agent tournament    fair production-backed deterministic smoke cohort
 *  11. balance:smoke       bounded headless balance simulation
 *  12. benchmark           fresh/deep/extreme performance checkpoint
 *  13. check:links         static asset/import/deployment path checks
 *
 * Browser tests (scripts/browser-test.mjs) need Chrome and are run
 * separately via `npm run test:browser`.
 */
import { spawnSync } from 'node:child_process';

const gates = [
  ['check:structure', 'node scripts/check-structure.mjs'],
  ['audit:identity', 'node scripts/audits/identity-audit.mjs'],
  ['audit:cell-visuals', 'node scripts/audits/cell-visual-audit.mjs'],
  ['audit:adaptations', 'node scripts/audits/adaptation-removal-audit.mjs'],
  ['audit:evolution-levels', 'node scripts/audits/skill-audit.mjs'],
  ['audit:progression-numbers', 'node scripts/audits/progression-number-audit.mjs'],
  ['audit:environment-levels', 'node scripts/audits/environment-level-audit.mjs --smoke'],
  ['audit:no-disaster', 'node scripts/audits/no-disaster-audit.mjs --count=70'],
  ['audit:habitats', 'node scripts/audits/habitat-audit.mjs --count=12'],
  ['audit:trophies', 'node scripts/audits/trophy-audit.mjs'],
  ['audit:campaign:smoke', 'node scripts/audits/campaign-audit.mjs --smoke'],
  ['audit:resources:smoke', 'node scripts/audits/resource-audit.mjs --count=24'],
  ['audit:freshwater:smoke', 'node scripts/audits/freshwater-audit.mjs --count=24'],
  ['audit:score-trace:smoke', 'node scripts/audits/score-trace-audit.mjs --count=24'],
  ['audit:transformations:smoke', 'node scripts/audits/transformation-audit.mjs --count=12'],
  ['audit:luminous', 'node scripts/audits/luminous-audit.mjs'],
  ['audit:reach100', 'node scripts/audits/reach100-audit.mjs --count=100'],
  ['agent:tournament:smoke', 'node scripts/agent-tournament.mjs --smoke > /dev/null'],
  ['showcase:check', 'node scripts/generate-title-showcase.mjs --check'],
  ['test:unit', 'node --test tests/unit/*.test.js tests/unit/presentation/*.test.js tests/unit/simulation/*.test.js'],
  ['test:integration', 'node --test tests/integration/*.test.js'],
  ['audit:lakes', 'node scripts/audits/lake-audit.mjs --count=500'],
  ['balance:smoke', 'node scripts/balance.mjs --smoke'],
  ['terminal:smoke', 'node scripts/audits/terminal-soak.mjs --count=100 > /dev/null'],
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
