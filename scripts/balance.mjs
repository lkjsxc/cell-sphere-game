#!/usr/bin/env node
/** Paired-seed production Ecology balance audit: fresh fragility and causal Evolution improvement. */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { dirname } from 'node:path';
import { RunController } from '../src/simulation/simulator.js';
import { compileEvolution, evolutionRunConfiguration } from '../src/game/skills/index.js';
import { compareProgressionIntegers } from '../src/core/progression-integer.js';
import { scoreResult } from '../src/game/scoring.js';
import * as challengeProfile from '../src/simulation/challenge-profile.js';
import { ENVIRONMENT_SCHEDULE_HASH, ENVIRONMENT_SCHEDULE_VERSION } from '../src/game/environment-level.js';
import { multiplyProgressionIntegers } from '../src/core/progression-integer.js';
import { evolutionLevelsForCells, evolutionPathToArchetype } from './lib.mjs';

const { CHALLENGE_PROFILE_VERSION, ENVIRONMENT_RATING_PER_LEVEL,
  compileChallengeProfile, pressureForNetRating } = challengeProfile;
const RESOURCE_YIELD_EFFECT_CAP = challengeProfile.RESOURCE_YIELD_EFFECT_CAP ?? 0;

const args = process.argv.slice(2); const smoke = args.includes('--smoke'); const strict = args.includes('--strict'); const holdout = args.includes('--holdout');
const reportArg = valueAfter('--report'); const compareArg = valueAfter('--compare');
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
const fixtureLevels = Object.freeze(Object.fromEntries(Object.entries(fixtureIds).map(([name, ids]) => [name,
  evolutionLevelsForCells(ids.flatMap((id) => evolutionPathToArchetype(id)))])));
const fixtures = Object.fromEntries(Object.entries(fixtureLevels)
  .map(([name, evolutionLevels]) => [name, compileEvolution({ evolutionLevels })]));
const started = performance.now(); const rows = Object.fromEntries(Object.keys(fixtures).map((name) => [name, []]));
for (const seed of seeds) for (const [name, evolution] of Object.entries(fixtures)) rows[name].push(run(seed, evolution));
const summary = Object.fromEntries(Object.entries(rows).map(([name, values]) => [name, summarize(values, rows.fresh)]));
const fresh = summary.fresh; const upgraded = Object.entries(summary).filter(([name]) => name !== 'fresh');
const validity = {
  allComplete: Object.values(rows).every((values) => values.every((row) => row.complete && row.finite)),
  fixturesCompile: fixtures.fresh.totalEvolutionLevels === '0'
    && Object.entries(fixtures).filter(([name]) => name !== 'fresh').every(([, fixture]) => fixture.totalEvolutionLevels !== '0')
    && new Set(Object.values(fixtures).map((fixture) => fixture.totalEvolutionLevels)).size > 2,
  freshFragile: fresh.lifetime.median > 0 && fresh.lifetime.median <= 180 && fresh.peakReach.median < .08 && compareProgressionIntegers(fresh.environment.median, '2') < 0,
  foundationImproves: summary.foundation.paired.lifetimeWins >= .50 && summary.foundation.lifetime.median >= fresh.lifetime.median,
  luminousFirstVisible: rows.luminous.some((row) => row.everPoweredCells > 0 && row.poweredCellSeconds > 0),
  matureEcologyExpressive: rows.mature.some((row) => row.transformedCells > 0) && rows.mature.some((row) => row.everPoweredCells > 0),
  noImmortality: Object.values(rows).every((values) => values.every((row) => row.complete)),
};
const profileEvidence = profileContract();
const report = { schema: 4, mode: smoke ? 'smoke' : 'deep', seedSet: holdout ? 'holdout' : 'development', seeds, fixtureIds,
  fixtureCells: Object.fromEntries(Object.entries(fixtureLevels).map(([name, levels]) => [name, levels.map((entry) => entry.cell)])),
  command: process.argv.join(' '), runtime: { node: process.version, platform: process.platform, arch: process.arch,
    cpu: cpus()[0]?.model ?? 'unknown', logicalCpus: cpus().length },
  rule: { scoreModel: 6, ecology: 'direct-authored', luminous: 'whole-cell-authority',
    environmentProfileVersion: CHALLENGE_PROFILE_VERSION, resourceYieldEffectCap: RESOURCE_YIELD_EFFECT_CAP,
    environmentScheduleVersion: ENVIRONMENT_SCHEDULE_VERSION, environmentScheduleHash: ENVIRONMENT_SCHEDULE_HASH },
  profileEvidence, summaries: summary, rows, invariants: validity,
  elapsedMs: Number((performance.now() - started).toFixed(1)), valid: Object.values(validity).every(Boolean) && profileEvidence.scalarPreserved };
if (compareArg) { report.comparison = compareBaseline(compareArg, report); report.valid &&= report.comparison.pass; }
if (strict) report.valid &&= upgraded.every(([, value]) => value.lifetime.median >= fresh.lifetime.median && value.paired.lifetimeWins >= .45);
const suffix = `${smoke ? 'smoke' : 'full'}${holdout ? '-holdout' : ''}`; const reportPath = reportArg ?? `reports/balance-${suffix}.json`;
mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`); console.log(markdown(report)); if (!report.valid) process.exitCode = 1;
function run(seed, evolution) { const controller = new RunController({ seed: seed >>> 0, worldOrdinal: '1', ...evolutionRunConfiguration(evolution) }); controller.start();
  while (controller.state.status !== 'extinct' && controller.state.tick < 20_000) controller.advance(64);
  const result = controller.buildResult(); const score = scoreResult(result); const complete = controller.state.status === 'extinct';
  return { seed, complete, finite: Number.isFinite(result.survivalSeconds) && Number.isFinite(result.peakCoverage)
      && Number.isFinite(result.resourceConservationError) && Math.abs(result.resourceConservationError) < 1e-6,
    lifetime: result.survivalSeconds, peakReach: result.peakCoverage, finalReach: result.coverage,
    sustainedReach: result.sustainedCoverage, peakLandOccupancy: result.peakLandOccupancy,
    environment: result.peakEnvironmentLevel, peakEnvironment: result.peakEnvironmentLevel,
    finalEnvironment: result.finalEnvironmentLevel, cause: result.cause, terminalCause: result.terminalCause,
    score: score.total, echoes: score.echoes, authorityHash: result.hash,
    resources: { initial: result.resourceInitial, final: result.resourceFinal, availableFinal: result.resourceAvailableFinal,
      reserveFinal: result.resourceReserveFinal, conservationError: result.resourceConservationError },
    habitatOccupancy: result.habitatOccupancy, everPoweredCells: result.everPoweredCells, poweredCellSeconds: result.poweredCellSeconds,
    transformedCells: result.transformedCells, luminousDevelopment: result.luminousDevelopment };
}
function summarize(values, freshRows) { const paired = values.map((row, index) => ({ row, fresh: freshRows[index] }));
  return { runs: values.length, incomplete: values.filter((row) => !row.complete).length,
    lifetime: distribution(values.map((row) => row.lifetime)), peakReach: distribution(values.map((row) => row.peakReach)),
    finalReach: distribution(values.map((row) => row.finalReach)), sustainedReach: distribution(values.map((row) => row.sustainedReach)),
    peakLandOccupancy: distribution(values.map((row) => row.peakLandOccupancy)),
    environment: exactDistribution(values.map((row) => row.environment)), peakEnvironment: exactDistribution(values.map((row) => row.peakEnvironment)),
    finalEnvironment: exactDistribution(values.map((row) => row.finalEnvironment)), score: exactDistribution(values.map((row) => row.score)), echoes: exactDistribution(values.map((row) => row.echoes)),
    causes: counts(values.map((row) => row.cause)), terminalCauses: counts(values.map((row) => row.terminalCause)),
    authorityHashes: values.map((row) => row.authorityHash),
    resources: { final: distribution(values.map((row) => row.resources.final)), reserveFinal: distribution(values.map((row) => row.resources.reserveFinal)),
      maximumConservationError: Math.max(...values.map((row) => Math.abs(row.resources.conservationError))) },
    habitatOccupancy: values[0].habitatOccupancy.map((_, index) => distribution(values.map((row) => row.habitatOccupancy[index]))),
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
function valueAfter(flag) { const index = args.indexOf(flag); return index >= 0 ? args[index + 1] : null; }
function profileContract() {
  const scalar = ['1', '2', '4', '8', '32'].map((level) => { const profile = compileChallengeProfile({ environmentLevel: level });
    const predecessor = pressureForNetRating(multiplyProgressionIntegers(level, ENVIRONMENT_RATING_PER_LEVEL));
    return { level, profileHash: profile.hash, pressure: profile.score.pressure, predecessor,
      absoluteDifference: Math.abs(profile.score.pressure - predecessor) }; });
  return { version: CHALLENGE_PROFILE_VERSION, cap: RESOURCE_YIELD_EFFECT_CAP,
    levelHashes: Object.fromEntries(['0', '1', '2', '4', '8', '32'].map((level) => [level,
      compileChallengeProfile({ environmentLevel: level }).hash])), scalar,
    scalarPreserved: scalar.every((row) => row.absoluteDifference <= .005) };
}
function compareBaseline(path, current) {
  const baseline = JSON.parse(readFileSync(path, 'utf8')); const fixtures = {};
  for (const [name, value] of Object.entries(current.summaries)) {
    const before = baseline.summaries?.[name]?.lifetime?.median; const threshold = name === 'fresh' ? .10 : .15;
    const relativeChange = before > 0 ? (value.lifetime.median - before) / before : Infinity;
    fixtures[name] = { baselineMedian: before, candidateMedian: value.lifetime.median, relativeChange, threshold,
      withinLifetimeGuardrail: Number.isFinite(relativeChange) && Math.abs(relativeChange) <= threshold,
      incomplete: value.incomplete, causes: value.causes };
  }
  const strongerDefenseHelpful = ['foundation', 'scarcity'].every((name) => current.summaries[name].paired.lifetimeWins >= .45);
  return { baselinePath: path, fixtures, allComplete: Object.values(current.summaries).every((value) => value.incomplete === 0),
    strongerDefenseHelpful, scalarPreserved: current.profileEvidence.scalarPreserved,
    pass: Object.values(fixtures).every((value) => value.withinLifetimeGuardrail) && Object.values(current.summaries).every((value) => value.incomplete === 0)
      && strongerDefenseHelpful && current.profileEvidence.scalarPreserved };
}
