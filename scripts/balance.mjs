#!/usr/bin/env node
/** Paired-seed production Ecology balance audit: fresh fragility and causal Evolution improvement. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { RunController } from '../src/simulation/simulator.js';
import { compileEvolution, evolutionRunConfiguration } from '../src/game/skills/index.js';
import { compareProgressionIntegers } from '../src/core/progression-integer.js';
import { scoreResult } from '../src/game/scoring.js';

const args = process.argv.slice(2); const smoke = args.includes('--smoke'); const strict = args.includes('--strict'); const holdout = args.includes('--holdout');
const runsIndex = args.indexOf('--runs'); const count = runsIndex >= 0 ? Number(args[runsIndex + 1]) : smoke ? 8 : 48;
if (!Number.isInteger(count) || count < 2 || count > 500) throw new Error('--runs must be 2..500');
const developmentSeeds = Object.freeze([1009, 2017, 3023, 4051, 5099, 6011, 7103, 8111, 9127, 10103, 11117, 12119]);
const holdoutSeeds = Object.freeze([13007, 14009, 15013, 16001, 17011, 18013, 19009, 20011, 21001, 22003, 23009, 24007]);
const source = holdout ? holdoutSeeds : developmentSeeds; const seeds = Array.from({ length: count }, (_, index) => source[index % source.length] + Math.floor(index / source.length) * 0x9e3779);
const fixtureIds = Object.freeze({
  fresh: [], foundation: ['first-division', 'frugal-membrane'],
  scarcity: ['first-division', 'frugal-membrane', 'scarcity-patience', 'recycling-matrix', 'deep-reserve'],
  luminous: ['first-division', 'reliable-budding', 'bioelectric-spark'],
  mature: ['first-division', 'reliable-budding', 'nutrient-uptake', 'frugal-membrane', 'energy-reserve', 'local-repair',
    'scarcity-patience', 'recycling-matrix', 'lake-crossing', 'tidal-tolerance', 'bioelectric-spark', 'light-retention',
    'powered-transport', 'luminous-recovery', 'luminous-canopy', 'deep-current', 'luminous-crown', 'glacial-basins',
    'coastal-succession', 'marine-bridge', 'world-shaper'],
});
const fixtures = Object.fromEntries(Object.entries(fixtureIds).map(([name, ids]) => [name, compileEvolution({ evolutionLevels: ids.map((id) => ({ id, level: '1' })) })]));
const started = performance.now(); const rows = Object.fromEntries(Object.keys(fixtures).map((name) => [name, []]));
for (const seed of seeds) for (const [name, evolution] of Object.entries(fixtures)) rows[name].push(run(seed, evolution));
const summary = Object.fromEntries(Object.entries(rows).map(([name, values]) => [name, summarize(values, rows.fresh)]));
const fresh = summary.fresh; const upgraded = Object.entries(summary).filter(([name]) => name !== 'fresh');
const validity = {
  allComplete: Object.values(rows).every((values) => values.every((row) => row.complete && row.finite)),
  freshFragile: fresh.lifetime.median > 0 && fresh.lifetime.median <= 180 && fresh.peakReach.median < .08 && compareProgressionIntegers(fresh.environment.median, '2') < 0,
  foundationImproves: summary.foundation.paired.lifetimeWins >= .50 && summary.foundation.lifetime.median >= fresh.lifetime.median,
  luminousFirstVisible: rows.luminous.some((row) => row.everPoweredCells > 0 && row.poweredCellSeconds > 0),
  matureEcologyExpressive: rows.mature.some((row) => row.transformedCells > 0) && rows.mature.some((row) => row.everPoweredCells > 0),
  noImmortality: Object.values(rows).every((values) => values.every((row) => row.complete)),
};
const report = { schema: 2, mode: smoke ? 'smoke' : 'deep', seedSet: holdout ? 'holdout' : 'development', seeds, fixtureIds,
  rule: { scoreModel: 6, ecology: 'direct-authored', luminous: 'whole-cell-authority' }, summaries: summary, invariants: validity,
  elapsedMs: Number((performance.now() - started).toFixed(1)), valid: Object.values(validity).every(Boolean) };
if (strict) report.valid &&= upgraded.every(([, value]) => value.lifetime.median >= fresh.lifetime.median && value.paired.lifetimeWins >= .45);
mkdirSync('reports', { recursive: true }); const suffix = `${smoke ? 'smoke' : 'full'}${holdout ? '-holdout' : ''}`;
writeFileSync(`reports/balance-${suffix}.json`, `${JSON.stringify(report, null, 2)}\n`); console.log(markdown(report)); if (!report.valid) process.exitCode = 1;
function run(seed, evolution) { const controller = new RunController({ seed: seed >>> 0, worldOrdinal: '1', ...evolutionRunConfiguration(evolution) }); controller.start();
  while (controller.state.status !== 'extinct' && controller.state.tick < 20_000) controller.advance(64);
  const result = controller.buildResult(); const score = scoreResult(result); const complete = controller.state.status === 'extinct';
  return { seed, complete, finite: Number.isFinite(result.survivalSeconds) && Number.isFinite(result.peakCoverage), lifetime: result.survivalSeconds,
    peakReach: result.peakCoverage, environment: result.peakEnvironmentLevel, cause: result.cause, score: score.total, echoes: score.echoes,
    habitatOccupancy: result.habitatOccupancy, everPoweredCells: result.everPoweredCells, poweredCellSeconds: result.poweredCellSeconds,
    transformedCells: result.transformedCells, luminousDevelopment: result.luminousDevelopment };
}
function summarize(values, freshRows) { const paired = values.map((row, index) => ({ row, fresh: freshRows[index] }));
  return { runs: values.length, lifetime: distribution(values.map((row) => row.lifetime)), peakReach: distribution(values.map((row) => row.peakReach)),
    environment: exactDistribution(values.map((row) => row.environment)), score: exactDistribution(values.map((row) => row.score)), echoes: exactDistribution(values.map((row) => row.echoes)),
    causes: counts(values.map((row) => row.cause)), habitatOccupancy: values[0].habitatOccupancy.map((_, index) => distribution(values.map((row) => row.habitatOccupancy[index]))),
    powered: { worlds: values.filter((row) => row.everPoweredCells > 0).length, everPoweredCells: distribution(values.map((row) => row.everPoweredCells)),
      poweredCellSeconds: distribution(values.map((row) => row.poweredCellSeconds)) }, transformedCells: distribution(values.map((row) => row.transformedCells)),
    paired: { lifetimeWins: paired.filter(({ row, fresh }) => row.lifetime > fresh.lifetime).length / values.length,
      peakReachWins: paired.filter(({ row, fresh }) => row.peakReach > fresh.peakReach).length / values.length,
      environmentWins: paired.filter(({ row, fresh }) => compareProgressionIntegers(row.environment, fresh.environment) > 0).length / values.length } };
}
function distribution(values) { const sorted = values.slice().sort((a, b) => a - b); const at = (p) => round(sorted[Math.floor((sorted.length - 1) * p)]); return { min: round(sorted[0]), p25: at(.25), median: at(.5), p75: at(.75), max: round(sorted.at(-1)) }; }
function exactDistribution(values) { const sorted = values.map(String).sort(compareProgressionIntegers); const at = (p) => sorted[Math.floor((sorted.length - 1) * p)]; return { min: sorted[0], p25: at(.25), median: at(.5), p75: at(.75), max: sorted.at(-1) }; }
function counts(values) { const output = {}; for (const value of values) output[value] = (output[value] ?? 0) + 1; return output; }
function round(value) { return Number((Number.isFinite(value) ? value : 0).toFixed(5)); }
function markdown(report) { const lines = [`# Balance ${report.mode} (${report.seedSet})`, '', '| fixture | median seconds | p25–p75 | peak reach | env | paired lifetime wins | powered worlds |', '|---|---:|---:|---:|---:|---:|---:|'];
  for (const [name, value] of Object.entries(report.summaries)) lines.push(`| ${name} | ${value.lifetime.median} | ${value.lifetime.p25}–${value.lifetime.p75} | ${value.peakReach.median} | ${value.environment.median} | ${value.paired.lifetimeWins} | ${value.powered.worlds} |`);
  return lines.join('\n'); }
