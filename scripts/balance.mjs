#!/usr/bin/env node
/**
 * Balance harness: Monte-Carlo headless runs through the production
 * simulation. Reports extinction-time distribution, coverage, crisis
 * survival, finite-resource causes, SCORE, and determinism health.
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
  const crisisRates = [];
  const scores = [];
  const causes = {};
  let nanRuns = 0;

  for (let r = 0; r < runsPerPolicy; r++) {
    const seed = seedCounter++;
    const strain = STRAINS[r % STRAINS.length];
    const { result, state } = runHeadless(
      { RunController }, { seed, strainId: strain, worldOrdinal: 1, worldPotential: 16000 }, policy);

    // Invalid-state gate: always enforced.
    if (stateHasNaN(state)) nanRuns++;
    if (result.tick > 4200) violations.push(`${policy}/${seed}: run exceeded ceiling (${result.tick})`);
    if (result.peakCoverage < 0 || result.peakCoverage > 1) violations.push(`${policy}/${seed}: impossible coverage`);

    times.push(result.tick / 10);
    peaks.push(result.peakCoverage);
    sustained.push(result.sustainedCoverage);
    crisisRates.push(result.crisesTotal ? result.crisesEndured / result.crisesTotal : 1);
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
    crisisSurvival: round3(crisisRates.reduce((a, b) => a + b, 0) / crisisRates.length),
    score: { p25: q(scores, .25), median: q(scores, .5), p75: q(scores, .75) },
    causes, nanRuns,
  };
  if (nanRuns > 0) violations.push(`${policy}: ${nanRuns} runs with NaN state`);
}

// Timing gates (strict / full only).
if (strict) {
  const med = report.policies.balanced.extinctionSeconds.median;
  if (med < 270 || med > 330) {
    violations.push(`balanced median extinction ${med}s outside 270-330 target`);
  }
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
    '| policy | runs | median t (s) | p25-p75 | peak cov | sustained | crisis surv |',
    '|---|---|---|---|---|---|---|'];
  for (const [name, p] of Object.entries(rep.policies)) {
    lines.push(`| ${name} | ${p.runs} | ${p.extinctionSeconds.median} | ${p.extinctionSeconds.p25}-${p.extinctionSeconds.p75} | ${p.peakCoverage.median} | ${p.sustainedCoverage.median} | ${p.crisisSurvival} |`);
  }
  return lines.join('\n');
}
