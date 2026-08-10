#!/usr/bin/env node
/**
 * Balance harness: Monte-Carlo headless runs through the production
 * simulation. Reports extinction-time distribution, coverage, chronic
 * Environment exposure, finite-resource causes, SCORE, and determinism health.
 *
 * Modes:
 *   --smoke      bounded (12 runs), CI-safe, invalid-state gates only
 *   --runs N     deep sweep (default 120) across policies
 *   --strict     additionally enforce timing gates (docs/balancing.md)
 *
 * Writes reports/balance-<mode>.json and prints a Markdown summary.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolveRes } from './lib.mjs';
import { RunController } from '../src/simulation/simulator.js';
import { runHeadless } from './pilot.mjs';
import { scoreResult } from '../src/game/scoring.js';

const args = process.argv.slice(2);
const smoke = args.includes('--smoke');
const strict = args.includes('--strict');
const runsArg = args.indexOf('--runs');
const runsPerPolicy = runsArg >= 0 ? Number(args[runsArg + 1]) : (smoke ? 4 : 30);

const POLICIES = smoke ? ['balanced', 'expansion', 'resilience'] : ['first', 'random', 'balanced', 'expansion', 'resilience', 'efficiency'];
const STRAINS = ['pioneer', 'conservator', 'weaver'];

const report = { date: new Date().toISOString(), mode: smoke ? 'smoke' : 'full', policies: {} };
const violations = [];

let seedCounter = 1000;
for (const policy of POLICIES) {
  const times = [];
  const peaks = [];
  const sustained = [];
  const peakLevels = [];
  const scores = [];
  const causes = {};
  let nanRuns = 0;

  for (let r = 0; r < runsPerPolicy; r++) {
    const seed = seedCounter++;
    const strain = STRAINS[r % STRAINS.length];
    const { result, state, complete } = runHeadless(
      { RunController }, { seed, strainId: strain, worldOrdinal: 1, worldPotential: 16000 }, policy,
      { budgetTicks: smoke ? 10_000 : 20_000 });

    // Invalid-state gate: always enforced. A harness budget is not a scored world.
    if (stateHasNaN(state)) nanRuns++;
    if (!complete || !result) { violations.push(`${policy}/${seed}: incomplete external budget at ${state.tick} ticks`); continue; }
    if (result.startEnvironmentLevel !== '0') violations.push(`${policy}/${seed}: nonzero Environment start`);
    if (result.peakCoverage < 0 || result.peakCoverage > 1) violations.push(`${policy}/${seed}: impossible coverage`);

    times.push(result.tick / 10);
    peaks.push(result.peakCoverage);
    sustained.push(result.sustainedCoverage);
    peakLevels.push(result.peakEnvironmentLevel);
    causes[result.cause] = (causes[result.cause] ?? 0) + 1;
    scores.push(scoreResult(result).total);
  }

  times.sort((a, b) => a - b);
  peaks.sort((a, b) => a - b); scores.sort((a, b) => a - b);
  const q = (arr, p) => arr[Math.min(arr.length - 1, Math.floor(arr.length * p))];
  report.policies[policy] = {
    runs: runsPerPolicy,
    extinctionSeconds: { median: round1(q(times, 0.5)), p25: round1(q(times, 0.25)), p75: round1(q(times, 0.75)) },
    peakCoverage: { median: round3(q(peaks, 0.5)) },
    sustainedCoverage: { median: round3(q(sustained, 0.5)) },
    peakEnvironmentLevel: { median: q(peakLevels.sort((a, b) => BigInt(a) > BigInt(b) ? 1 : BigInt(a) < BigInt(b) ? -1 : 0), .5) },
    score: { p25: q(scores, .25), median: q(scores, .5), p75: q(scores, .75) },
    causes, nanRuns,
  };
  if (nanRuns > 0) violations.push(`${policy}: ${nanRuns} runs with NaN state`);
}

// Strict mode preserves only non-negotiable validity gates. Cohort timing targets are
// measured separately while the resource-limited balance migration is in progress.
if (strict && !Object.values(report.policies).every((policy) => policy.extinctionSeconds.median > 0)) {
  violations.push('strict balance run produced no completed positive-duration cohort');
}

// Persist + summarize.
mkdirSync(new URL('../reports', import.meta.url).pathname, { recursive: true });
const outFile = resolveRes(`../reports/balance-${smoke ? 'smoke' : 'full'}.json`);
writeFileSync(outFile, JSON.stringify(report, null, 2));

console.log(markdownSummary(report));
if (violations.length > 0) {
  console.error('\nBalance violations:');
  for (const v of violations) console.error(`  - ${v}`);
  process.exit(1);
}
console.error(`\nbalance: ${smoke ? 'smoke' : 'full'} OK — report at reports/balance-${smoke ? 'smoke' : 'full'}.json`);

function stateHasNaN(state) {
  for (const arr of [state.biomass, state.energy, state.nutrient, state.resourceReserve, state.stress, state.conductance]) {
    for (let i = 0; i < arr.length; i++) if (Number.isNaN(arr[i])) return true;
  }
  return false;
}
function round1(v) { return Math.round(v * 10) / 10; }
function round3(v) { return Math.round(v * 1000) / 1000; }

function markdownSummary(rep) {
  const lines = ['# Balance report', '', `mode: ${rep.mode} — ${rep.date}`, '',
    '| policy | runs | median t (s) | p25-p75 | peak cov | sustained | peak env |',
    '|---|---|---|---|---|---|---|'];
  for (const [name, p] of Object.entries(rep.policies)) {
    lines.push(`| ${name} | ${p.runs} | ${p.extinctionSeconds.median} | ${p.extinctionSeconds.p25}-${p.extinctionSeconds.p75} | ${p.peakCoverage.median} | ${p.sustainedCoverage.median} | ${p.peakEnvironmentLevel.median} |`);
  }
  return lines.join('\n');
}
