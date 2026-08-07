#!/usr/bin/env node
/** Exact all-authoritative-cell sustained REACH 100% feasibility and safety audit. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { RunController } from '../../src/simulation/simulator.js';
import { compileMemory, MEMORY_NODE_IDS } from '../../src/game/skills/index.js';
import { REACH_100_REQUIRED_TICKS } from '../../src/simulation/lifecycle/reach-goal.js';

const count=integerArg('--count=',300),breadth=compileMemory({memoryNodes:MEMORY_NODE_IDS});
const EXTERNAL_FINISH_BUDGET_TICKS = 10_000;
const fresh=compileMemory({memoryNodes:[]}),rows=[],freshRows=[];const started=performance.now();
for(let index=0;index<count;index++)rows.push(run((0x72656163+Math.imul(index,0x9e3779b1))>>>0,breadth,20));
for (let index = 0; index < Math.min(100, count); index++) freshRows.push(run((0x66726573 + Math.imul(index, 0x85ebca6b)) >>> 0, fresh, 1));
const achieved = rows.filter((row) => row.achieved); const report = { worlds: count, freshWorlds: freshRows.length,
  elapsedMs: Math.round(performance.now() - started), sustainTicks: REACH_100_REQUIRED_TICKS,
  levelOneBreadthPotential:breadth.worldPotential,activeBuilds:breadth.activeBuilds.map((build)=>build.id),
  achieved: achieved.length, achievementRate: round(achieved.length / count), achievedTicks: achieved.map((row) => row.achievedTick),
  breadthPeakCoverage:dist(rows.map((row)=>row.peakCoverage)),breadthScore:dist(rows.map((row)=>row.score)),
  freshAchieved: freshRows.filter((row) => row.achieved).length, freshPeakCoverage: dist(freshRows.map((row) => row.peakCoverage)),
  exactProofs: achieved.every((row) => row.requiredTicks === REACH_100_REQUIRED_TICKS
    && row.achievedTick > 0 && row.peakCoverage === 1),
  extinctAfterGoal: achieved.every((row) => row.status === 'extinct' && row.tick > row.achievedTick),
  externalFinishBudgetTicks: EXTERNAL_FINISH_BUDGET_TICKS,
  allFiniteBuildsFinishedWithinExternalBudget: rows.every((row) => row.status === 'extinct'),
  terminalTicks: dist(rows.map((row) => row.tick)), valid: false };
report.valid = report.activeBuilds.includes('world-gardener') && report.achievementRate >= .01 && report.achievementRate <= .12
  && report.freshAchieved === 0 && report.freshPeakCoverage.max < .55 && report.exactProofs
  && report.extinctAfterGoal && report.allFiniteBuildsFinishedWithinExternalBudget;
mkdirSync('reports', { recursive: true }); writeFileSync('reports/reach100-audit.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2)); if (!report.valid) process.exitCode = 1;
function run(seed,evolution,worldOrdinal){const controller=new RunController({seed,worldOrdinal,
  worldPotential:evolution.worldPotential,evolutionPower:evolution.evolutionPower,evolutionDepth:evolution.evolutionDepth,potentialVersion:evolution.potentialVersion,
  memoryEffects:evolution.effects,memoryConditionals:evolution.conditionals,memoryUnlocks:evolution.unlocks,
  habitatCapabilities:evolution.habitatCapabilities,activeBuilds:evolution.activeBuilds,buildEffects:evolution.buildEffects,electricityMastery:evolution.electricityMastery});
  controller.start(); while (controller.state.status !== 'extinct' && controller.state.tick < EXTERNAL_FINISH_BUDGET_TICKS) controller.advance(64);
  const result = controller.buildResult(); return { score: result.score,
    peakCoverage: result.peakCoverage, achieved: result.reach100.achieved, achievedTick: result.reach100.achievedTick,
    requiredTicks: result.reach100.requiredTicks, tick: result.tick, status: controller.state.status }; }
function integerArg(prefix, fallback) { const value = Number(process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ?? fallback);
  if (!Number.isInteger(value) || value < 1 || value > 10000) throw new Error(`${prefix} must be 1..10000`); return value; }
function dist(values) { const sorted = values.slice().sort((a, b) => a - b); const at = (p) => round(sorted[Math.floor((sorted.length - 1) * p)]);
  return { min: round(sorted[0]), p10: at(.1), median: at(.5), p90: at(.9), max: round(sorted.at(-1)) }; }
function round(value) { return Number((Number(value) || 0).toFixed(6)); }
