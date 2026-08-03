#!/usr/bin/env node
/** Exhaustive catalog, topology, proof-boundary, and evaluator-cost audit. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { TROPHIES, validateTrophyCatalog } from '../../src/game/trophies/index.js';
import { validateTrophyAtlas } from '../../src/game/trophies/atlas.js';
import { trophyConditionMet } from '../../src/game/trophies/evaluator.js';
const catalog = validateTrophyCatalog(); const atlas = validateTrophyAtlas(); let boundaries = 0; const loops = 10_000;
const started = performance.now();
for (let pass = 0; pass < loops; pass++) for (const trophy of TROPHIES) {
  const c = trophy.condition; const key = c.key; const high = c.rule === 'includes' ? c.mask : c.value;
  const low = c.rule === 'includes' ? c.mask & (c.mask - 1) : c.value - 1;
  if (trophyConditionMet(c, { [key]: high }) && !trophyConditionMet(c, { [key]: low })) boundaries++;
}
const elapsedMs = performance.now() - started;
const report = { catalog: { count: catalog.count, families: catalog.families, uniqueIds: catalog.uniqueIds,
  exactCriteria: new Set(TROPHIES.map((trophy) => trophy.criteriaEn)).size },
  topology: { cells: 162, trophyCells: atlas.cells, neutralCells: atlas.neutral, mappingHash: atlas.hash },
  proofBoundariesChecked: boundaries, evaluator: { evaluations: loops * TROPHIES.length * 2,
    elapsedMs: Number(elapsedMs.toFixed(3)), evaluationsPerMs: Math.round(loops * TROPHIES.length * 2 / elapsedMs) },
  valid: catalog.valid && atlas.valid && boundaries === loops * 96 };
mkdirSync('reports', { recursive: true }); writeFileSync('reports/trophy-audit.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2)); if (!report.valid) process.exitCode = 1;
