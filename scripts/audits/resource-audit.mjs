#!/usr/bin/env node
/** Fresh-world local resource, niche access, conservation, and SCORE audit. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { RunController } from '../../src/simulation/simulator.js';
import { compileMemory } from '../../src/game/skills/index.js';

const count = integerArg('--count=', 1000); const memory = compileMemory({ memoryNodes: [] }); const rows = [];
const initial = []; const final = []; const states = Array(8).fill(0); let livingByQuintile = Array(5).fill(0); let birthsByQuintile = Array(5).fill(0);
const started = performance.now();
for (let index = 0; index < count; index++) {
  const controller = new RunController({ seed: (0x72657300 + Math.imul(index, 0x9e3779b1)) >>> 0,
    worldOrdinal: 1, worldPotential: memory.worldPotential, potentialVersion: memory.potentialVersion,
    evolutionPower: memory.evolutionPower ?? 0, memoryEffects: memory.effects,
    memoryConditionals: memory.conditionals, memoryUnlocks: memory.unlocks,
    habitatCapabilities: memory.habitatCapabilities, activeBuilds: memory.activeBuilds,
    buildEffects: memory.buildEffects });
  controller.start(); controller.advance(4000); const result = controller.buildResult();
  initial.push(...controller.state.initialResourceRichness); final.push(...controller.state.resourceRichness);
  result.resourceStateCounts.forEach((value, state) => { states[state] += value; });
  livingByQuintile = livingByQuintile.map((value, quintile) => value + result.resourceLivingTicksByQuintile[quintile]);
  birthsByQuintile = birthsByQuintile.map((value, quintile) => value + result.resourceBirthsByQuintile[quintile]);
  rows.push({ score: result.score, duration: result.survivalSeconds, peakReach: result.peakCoverage,
    peakLandOccupancy: result.peakLandOccupancy, resourceRemaining: result.resourceFinal / result.resourceInitial,
    conservationError: Math.abs(result.resourceConservationError), depleted: result.resourceDepletedCells,
    recovered: result.resourceRecoveredCells, blocked: sum(controller.state.resourceBlocked),
    birthRichness: result.averageResourceRichnessAtBirth });
}
const livingTotal = sum(livingByQuintile); const livingShare = livingByQuintile.map((value) => livingTotal ? value / livingTotal : 0);
const report = { worlds: count, elapsedMs: round(performance.now() - started),
  initialRichness: dist(initial), finalRichness: dist(final), resourceStateCounts: states,
  score: dist(rows.map((row) => row.score)), durationSeconds: dist(rows.map((row) => row.duration)),
  peakReach: dist(rows.map((row) => row.peakReach)), peakLandOccupancy: dist(rows.map((row) => row.peakLandOccupancy)),
  resourceRemaining: dist(rows.map((row) => row.resourceRemaining)), conservationError: dist(rows.map((row) => row.conservationError)),
  exhaustedOrDepletedCells: dist(rows.map((row) => row.depleted)), recoveredCells: dist(rows.map((row) => row.recovered)),
  resourceFloorBlockedAttempts: dist(rows.map((row) => row.blocked)), averageResourceAtBirth: dist(rows.map((row) => row.birthRichness)),
  livingCellTicksByResourceQuintile: livingByQuintile.map(round), livingShareByResourceQuintile: livingShare.map(round),
  birthsByResourceQuintile: birthsByQuintile, aboveMedianLivingShare: round(livingShare[2] + livingShare[3] + livingShare[4]),
  bottomQuartileLivingShare: round(livingShare[0] + livingShare[1] * .25), valid: false };
report.valid = report.conservationError.max < 1e-5 && report.peakLandOccupancy.median >= .12
  && report.peakLandOccupancy.median <= .30 && report.peakLandOccupancy.p90 < .45
  && report.aboveMedianLivingShare >= .75 && report.bottomQuartileLivingShare < .03
  && report.score.median >= 8000 && report.score.median <= 15000;
mkdirSync('reports', { recursive: true }); writeFileSync('reports/resource-audit.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2)); if (!report.valid) process.exitCode = 1;
function integerArg(prefix, fallback) { const value = Number(process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ?? fallback);
  if (!Number.isInteger(value) || value < 1 || value > 100000) throw new Error(`${prefix} must be 1..100000`); return value; }
function dist(values) { const sorted = values.slice().sort((a, b) => a - b); const at = (p) => round(sorted[Math.floor((sorted.length - 1) * p)]);
  return { min: round(sorted[0]), p10: at(.1), p25: at(.25), median: at(.5), p75: at(.75), p90: at(.9), max: round(sorted.at(-1)) }; }
function sum(values) { let value = 0; for (const item of values) value += item; return value; }
function round(value) { return Number((Number.isFinite(value) ? value : 0).toFixed(6)); }
