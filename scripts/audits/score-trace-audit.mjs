#!/usr/bin/env node
/** Tick-trace audit for authoritative cumulative SCORE v3. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { RunController } from '../../src/simulation/simulator.js';
import { compileMemory } from '../../src/game/skills/index.js';
const count = integerArg('--count=', 1000); const memory = compileMemory({ memoryNodes: [] }); const rows = []; const started = performance.now();
let decreases = 0; let finalMismatches = 0;
for (let index = 0; index < count; index++) {
  const c = new RunController({ seed: (0x5c0ae000 + Math.imul(index, 0x9e3779b1)) >>> 0, worldOrdinal: 1,
    worldPotential: memory.worldPotential, potentialVersion: memory.potentialVersion, evolutionPower: memory.evolutionPower ?? 0,
    memoryEffects: memory.effects, memoryConditionals: memory.conditionals, memoryUnlocks: memory.unlocks,
    habitatCapabilities: memory.habitatCapabilities, activeBuilds: memory.activeBuilds, buildEffects: memory.buildEffects });
  c.start(); let previous = 0; let largestJump = 0; let score15 = 0; let preterminal = 0; const checkpoints = [];
  while (c.state.status !== 'extinct') {
    c.advance(1); const score = c.state.scoreMerit.total; if (score < previous) decreases++;
    largestJump = Math.max(largestJump, score - previous); previous = score;
    if (c.state.tick <= 150) score15 = score;
    if (c.state.status === 'terminal-collapse' && !preterminal) preterminal = score;
    if (c.state.tick % 10 === 0) checkpoints.push(score);
  }
  const result = c.buildResult(); if (result.score !== previous) finalMismatches++;
  const final = Math.max(1, result.score); const at = (fraction) => checkpoints[Math.min(checkpoints.length - 1, Math.floor(checkpoints.length * fraction))] ?? 0;
  rows.push({ final: result.score, largestJump, relativeJump: largestJump / final, score15Share: score15 / final,
    p25Share: at(.25) / final, p50Share: at(.5) / final, p75Share: at(.75) / final,
    preterminalShare: (preterminal || result.score) / final, finalDelta: result.score - previous });
}
const report = { worlds: count, elapsedMs: round(performance.now() - started), decreases, finalMismatches,
  finalScore: dist(rows.map((row) => row.final)), largestAbsoluteJump: dist(rows.map((row) => row.largestJump)),
  largestRelativeJump: dist(rows.map((row) => row.relativeJump)), scoreAt15SecondsShare: dist(rows.map((row) => row.score15Share)),
  scoreAt25PercentShare: dist(rows.map((row) => row.p25Share)), scoreAt50PercentShare: dist(rows.map((row) => row.p50Share)),
  scoreAt75PercentShare: dist(rows.map((row) => row.p75Share)), preterminalShare: dist(rows.map((row) => row.preterminalShare)),
  finalDelta: dist(rows.map((row) => row.finalDelta)), valid: false };
report.valid = decreases === 0 && finalMismatches === 0 && report.largestRelativeJump.max <= .10
  && report.scoreAt15SecondsShare.p90 <= .15 && report.preterminalShare.min >= .85 && report.finalDelta.max === 0
  && report.finalScore.median >= 8000 && report.finalScore.median <= 15000;
mkdirSync('reports', { recursive: true }); writeFileSync('reports/score-trace-audit.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2)); if (!report.valid) process.exitCode = 1;
function integerArg(prefix, fallback) { const value = Number(process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ?? fallback);
  if (!Number.isInteger(value) || value < 1 || value > 100000) throw new Error(`${prefix} must be 1..100000`); return value; }
function dist(values) { const sorted = values.slice().sort((a, b) => a - b); const at = (p) => round(sorted[Math.floor((sorted.length - 1) * p)]);
  return { min: round(sorted[0]), p25: at(.25), median: at(.5), p75: at(.75), p90: at(.9), max: round(sorted.at(-1)) }; }
function round(value) { return Number((Number.isFinite(value) ? value : 0).toFixed(6)); }
