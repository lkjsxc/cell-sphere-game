#!/usr/bin/env node
/** Matched-world finite freshwater survival advantage audit. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { RunController } from '../../src/simulation/simulator.js';
import { compileEvolution } from '../../src/game/skills/index.js';
import { FRESH_RESOURCE_FLOOR } from '../../src/simulation/lifecycle/ecological-access.js';

const count = integerArg('--count=', 300); const memory = compileEvolution({ evolutionLevels: [] }); const pairs = [];
const starts = { near: 0, far: 0 }; const started = performance.now();
for (let index = 0; index < count; index++) {
  const seed = (0x66726573 + Math.imul(index, 0x9e3779b1)) >>> 0;
  const probe = controller(seed); const pair = matchedPair(probe.state); if (!pair) continue;
  const near = finish(controller(seed, pair.near)); const far = finish(controller(seed, pair.far));
  starts.near += probe.state.fields.freshwaterInfluence[pair.near]; starts.far += probe.state.fields.freshwaterInfluence[pair.far];
  pairs.push({ durationRatio: near.survivalSeconds / far.survivalSeconds,
    nearDuration: near.survivalSeconds, farDuration: far.survivalSeconds,
    exhaustionDelay: near.firstResourceExhaustionSeconds - far.firstResourceExhaustionSeconds,
    nearScore: near.score, farScore: far.score, nearReach: near.peakCoverage, farReach: far.peakCoverage,
    nearRemaining: near.resourceFinal / near.resourceInitial, farRemaining: far.resourceFinal / far.resourceInitial,
    nearHard: near.terminalCause === 'hard-maximum', farHard: far.terminalCause === 'hard-maximum' });
}
const ratios = pairs.map((row) => row.durationRatio); const report = { requestedPairs: count, matchedPairs: pairs.length,
  elapsedMs: round(performance.now() - started), freshwaterInfluenceAtStart: { nearMean: round(starts.near / pairs.length), farMean: round(starts.far / pairs.length) },
  durationRatio: dist(ratios), nearDurationSeconds: dist(pairs.map((row) => row.nearDuration)),
  farDurationSeconds: dist(pairs.map((row) => row.farDuration)), exhaustionDelaySeconds: dist(pairs.map((row) => row.exhaustionDelay)),
  scoreDifference: dist(pairs.map((row) => row.nearScore - row.farScore)), reachDifference: dist(pairs.map((row) => row.nearReach - row.farReach)),
  remainingResourceDifference: dist(pairs.map((row) => row.nearRemaining - row.farRemaining)),
  nearWins: round(pairs.filter((row) => row.durationRatio > 1).length / pairs.length),
  nearHardMaximumRate: round(pairs.filter((row) => row.nearHard).length / pairs.length),
  farHardMaximumRate: round(pairs.filter((row) => row.farHard).length / pairs.length), valid: false };
report.valid = pairs.length >= count * .85 && report.durationRatio.median >= 1.08 && report.durationRatio.median <= 1.25
  && report.exhaustionDelaySeconds.median > 0 && report.nearWins < 1 && report.nearHardMaximumRate < .45;
mkdirSync('reports', { recursive: true }); writeFileSync('reports/freshwater-audit.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2)); if (!report.valid) process.exitCode = 1;
function controller(seed, inoculate) { return new RunController({ seed, inoculate, worldOrdinal: 1,
  worldPotential: memory.worldPotential, potentialVersion: memory.potentialVersion, evolutionPower: memory.evolutionPower ?? 0,
  memoryEffects: memory.effects, memoryConditionals: memory.conditionals, memoryUnlocks: memory.unlocks,
  habitatCapabilities: memory.habitatCapabilities, activeBuilds: memory.activeBuilds, buildEffects: memory.buildEffects }); }
function finish(value) { value.start(); value.advance(4000); return value.buildResult(); }
function matchedPair(state) {
  const near = []; const far = [];
  for (let cell = 0; cell < state.topo.nodeCount; cell++) {
    if (!state.fields.landMask[cell] || state.fields.biomeId[cell] >= 9 || state.initialResourceRichness[cell] < FRESH_RESOURCE_FLOOR
        || richNeighbors(state, cell) < 2) continue;
    const support = state.fields.freshwaterInfluence[cell]; if (support >= .42) near.push(cell); else if (support <= .02) far.push(cell);
  }
  let best = null;
  for (const a of near) for (const b of far) {
    if (state.fields.biomeId[a] !== state.fields.biomeId[b]) continue;
    const mismatch = Math.abs(state.fields.baseNutrient[a] - state.fields.baseNutrient[b]) * 3
      + Math.abs(state.fields.baseTemp[a] - state.fields.baseTemp[b]) * 2
      + Math.abs(state.fields.altitude[a] - state.fields.altitude[b])
      + Math.abs(state.fields.baseMoisture[a] - state.fields.baseMoisture[b])
      + Math.abs(richNeighbors(state, a) - richNeighbors(state, b)) * .12;
    if (!best || mismatch < best.mismatch || mismatch === best.mismatch && a < best.near) best = { near: a, far: b, mismatch };
  }
  return best?.mismatch <= .65 ? best : null;
}
function richNeighbors(state, cell) { let count = 0;
  for (let offset = state.topo.nodeStart[cell]; offset < state.topo.nodeStart[cell + 1]; offset++)
    if (state.initialResourceRichness[state.topo.nodeNeighbors[offset]] >= FRESH_RESOURCE_FLOOR) count++; return count; }
function integerArg(prefix, fallback) { const value = Number(process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ?? fallback);
  if (!Number.isInteger(value) || value < 1 || value > 100000) throw new Error(`${prefix} must be 1..100000`); return value; }
function dist(values) { if (!values.length) return { min: 0, p25: 0, median: 0, p75: 0, p90: 0, max: 0 };
  const sorted = values.slice().sort((a, b) => a - b); const at = (p) => round(sorted[Math.floor((sorted.length - 1) * p)]);
  return { min: round(sorted[0]), p25: at(.25), median: at(.5), p75: at(.75), p90: at(.9), max: round(sorted.at(-1)) }; }
function round(value) { return Number((Number.isFinite(value) ? value : 0).toFixed(6)); }
