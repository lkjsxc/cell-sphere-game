#!/usr/bin/env node
/** Production transformation, reclamation, electricity, and score-bound audit. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { RunController } from '../../src/simulation/simulator.js';
import { compileMemory, MEMORY_NODE_IDS } from '../../src/game/skills/index.js';

const count = integerArg('--count=', 24); const full = compileMemory({ memoryNodes: MEMORY_NODE_IDS });
const fresh = compileMemory({ memoryNodes: [] }); const rows = []; const untouched = []; const started = performance.now();
for (let index = 0; index < count; index++) rows.push(run((0x7472616e + Math.imul(index, 0x9e3779b1)) >>> 0, full, 20));
for (let index = 0; index < Math.min(12, count); index++) untouched.push(run((0x66726565 + Math.imul(index, 0x85ebca6b)) >>> 0, fresh, 1));
const repeatA = run(0x7472616e, full, 20); const repeatB = run(0x7472616e, full, 20);
const report = { worlds: count, elapsedMs: Math.round(performance.now() - started), activeBuilds: full.activeBuilds.map((build) => build.id),
  fullPotential: full.worldPotential, score: dist(rows, 'score'), transformedCells: dist(rows, 'transformedCells'),
  reclaimedCells: dist(rows, 'reclaimedCells'), glacialLakeCells: dist(rows, 'glacialLakeCells'),
  maritimeForestCells: dist(rows, 'maritimeForestCells'), everPoweredCells: dist(rows, 'everPoweredCells'),
  peakElectrifiedCells: dist(rows, 'electrifiedCells'), poweredCellSeconds: dist(rows, 'poweredCellSeconds'),
  freshTransformations: untouched.reduce((sum, row) => sum + row.transformedCells, 0),
  freshPoweredCells: untouched.reduce((sum, row) => sum + row.everPoweredCells, 0),
  maxConservationError: Math.max(...rows.map((row) => Math.abs(row.resourceConservationError))),
  deterministic: repeatA.stateHash === repeatB.stateHash && JSON.stringify(repeatA) === JSON.stringify(repeatB), valid: false };
report.valid = full.activeBuilds.length >= 12 && report.transformedCells.median > 0
  && rows.some((row) => row.reclaimedCells > 0) && rows.some((row) => row.glacialLakeCells > 0)
  && rows.some((row) => row.maritimeForestCells > 0) && report.everPoweredCells.median > 0
  && report.freshTransformations === 0 && report.freshPoweredCells === 0
  && report.glacialLakeCells.max <= 24 && report.maritimeForestCells.max <= 24
  && report.score.p90 <= full.worldPotential && report.maxConservationError < 1e-4 && report.deterministic;
mkdirSync('reports', { recursive: true }); writeFileSync('reports/transformation-audit.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2)); if (!report.valid) process.exitCode = 1;
function run(seed, memory, worldOrdinal) { const controller = new RunController({ seed, worldOrdinal,
  worldPotential: memory.worldPotential, evolutionPower: memory.evolutionPower, potentialVersion: memory.potentialVersion,
  memoryEffects: memory.effects, memoryConditionals: memory.conditionals, memoryUnlocks: memory.unlocks,
  habitatCapabilities: memory.habitatCapabilities, activeBuilds: memory.activeBuilds, buildEffects: memory.buildEffects });
  controller.start(); controller.advance(4000); return controller.buildResult(); }
function integerArg(prefix, fallback) { const value = Number(process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ?? fallback);
  if (!Number.isInteger(value) || value < 1 || value > 10000) throw new Error(`${prefix} must be 1..10000`); return value; }
function dist(rows, key) { const values = rows.map((row) => Number(row[key]) || 0).sort((a, b) => a - b);
  const at = (p) => round(values[Math.floor((values.length - 1) * p)]); return { min: round(values[0]), p10: at(.1), median: at(.5), p90: at(.9), max: round(values.at(-1)) }; }
function round(value) { return Number((Number(value) || 0).toFixed(6)); }
