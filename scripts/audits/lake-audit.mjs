#!/usr/bin/env node
/** Distribution, connectivity, ecology, determinism, and cost audit for whole-cell lakes. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRng } from '../../src/core/prng.js';
import { fnv1aBytes, hashF32, hexU32 } from '../../src/core/hash.js';
import { BIOME, FEATURE, WATER, createFields } from '../../src/world/fields.js';
import { createTopology } from '../../src/world/icosphere.js';
const count = Number(process.argv.find((argument) => argument.startsWith('--count='))?.split('=')[1] ?? 500);
if (!Number.isInteger(count) || count < 1 || count > 5000) throw new Error('count must be 1..5000');
const topo = createTopology(4); const lakeCounts = []; const areas = []; const shores = []; const wetlands = [];
const lakeCoverage = []; const influenceCoverage = []; const moistureLift = []; const generationMs = [];
const depths = []; const catchments = []; const types = {}; const salinities = {};
const integrity = { disconnectedIds: 0, idMismatches: 0, oceanOverlaps: 0, touchingIds: 0,
  missingShore: 0, invalidShore: 0, missingWetland: 0, invalidWetland: 0,
  invalidRecords: 0, influenceBounds: 0, deterministicMismatches: 0,
  privateFieldLeaks: 0, publicDrainageLeaks: 0 };
let aggregateHash = fnv1aBytes(new Uint8Array(0)); const started = performance.now();
for (let index = 0; index < count; index++) {
  const seed = (0x51ab3d71 ^ Math.imul(index + 1, 0x9e3779b1)) >>> 0; const before = performance.now();
  const fields = createFields(createRng(seed), topo); generationMs.push(performance.now() - before);
  const hash = worldLakeHash(fields); const duplicate = createFields(createRng(seed), topo);
  if (worldLakeHash(duplicate) !== hash) integrity.deterministicMismatches++;
  aggregateHash = fnv1aBytes(new TextEncoder().encode(hash), aggregateHash);
  for (const key of ['rainfall', 'filledElevation', 'drainTo', 'flowAccumulation', 'riverOrder',
    'riverStrength', 'riverClass', 'riverSystem', 'riverUpstream', 'majorRivers']) integrity.privateFieldLeaks += key in fields;
  lakeCounts.push(fields.lakes.length); let lakeCells = 0; let influenced = 0; let wetSum = 0; let wetCount = 0; let drySum = 0; let dryCount = 0;
  for (let cell = 0; cell < topo.nodeCount; cell++) {
    if (fields.freshwaterInfluence[cell] < 0 || fields.freshwaterInfluence[cell] > 1) integrity.influenceBounds++;
    if (fields.freshwaterInfluence[cell] > 0) { influenced++; if (fields.landMask[cell]) { wetSum += fields.baseMoisture[cell]; wetCount++; } }
    else if (fields.landMask[cell]) { drySum += fields.baseMoisture[cell]; dryCount++; }
    const id = fields.lakeId[cell]; if (id < 0) continue; lakeCells++;
    if (!fields.landMask[cell] || fields.waterClass[cell] !== WATER.LAKE) integrity.oceanOverlaps++;
    for (const next of neighbors(cell)) if (fields.lakeId[next] >= 0 && fields.lakeId[next] !== id) integrity.touchingIds++;
  }
  lakeCoverage.push(lakeCells / Math.max(1, fields.landMask.reduce((sum, value) => sum + value, 0)));
  influenceCoverage.push(influenced / topo.nodeCount); moistureLift.push(wetSum / Math.max(1, wetCount) - drySum / Math.max(1, dryCount));
  for (const lake of fields.lakes) auditLake(fields, lake);
}
const elapsedMs = performance.now() - started;
const report = { worlds: count, elapsedMs: round(elapsedMs), deterministicHash: hexU32(aggregateHash),
  lakesPerWorld: distribution(lakeCounts), areaCells: distribution(areas), shoreCells: distribution(shores),
  wetlandCells: distribution(wetlands), maxDepth: distribution(depths), catchmentCells: distribution(catchments),
  lakeCoverageOfLand: distribution(lakeCoverage), ecologicalInfluenceCoverage: distribution(influenceCoverage),
  influencedMoistureLift: distribution(moistureLift), types, salinities,
  areaShare3to18: round(areas.filter((area) => area >= 3 && area <= 18).length / Math.max(1, areas.length)),
  generationMsPerWorld: distribution(generationMs), integrity };
mkdirSync('reports', { recursive: true }); writeFileSync('reports/lake-audit.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
const failures = Object.values(integrity).reduce((sum, value) => sum + value, 0)
  || report.lakesPerWorld.min < 5 || report.lakesPerWorld.max > 8 || report.areaShare3to18 < .9
  || Object.keys(types).length < 3 || Object.keys(salinities).length < 2
  || report.lakeCoverageOfLand.median < .015 || report.lakeCoverageOfLand.median > .14
  || report.ecologicalInfluenceCoverage.median <= report.lakeCoverageOfLand.median * 2
  || report.ecologicalInfluenceCoverage.median > .7 || report.influencedMoistureLift.median < .02
  || report.generationMsPerWorld.mean > 60;
if (failures) process.exitCode = 1;

function auditLake(fields, lake) {
  areas.push(lake.area); shores.push(lake.shoreCells.length); wetlands.push(lake.wetlandCells.length);
  depths.push(lake.maxDepth); catchments.push(lake.catchment); types[lake.type] = (types[lake.type] ?? 0) + 1;
  salinities[lake.salinity] = (salinities[lake.salinity] ?? 0) + 1;
  if (!Object.isFrozen(lake) || !Object.isFrozen(lake.cells) || lake.area !== lake.cells.length
    || !['small', 'medium', 'large'].includes(lake.areaClass) || !['shallow', 'middle', 'deep'].includes(lake.depthClass)
    || !['open', 'seasonal', 'closed'].includes(lake.outletStatus)) integrity.invalidRecords++;
  for (const key of ['outflowCell', 'drainTo', 'flow', 'flowAccumulation', 'filledElevation'])
    if (key in lake) integrity.publicDrainageLeaks++;
  const allowed = new Set(lake.cells); const seen = new Set([lake.cells[0]]); const queue = [lake.cells[0]];
  for (let head = 0; head < queue.length; head++) for (const next of neighbors(queue[head])) if (allowed.has(next) && !seen.has(next)) {
    seen.add(next); queue.push(next);
  }
  if (seen.size !== lake.cells.length) integrity.disconnectedIds++;
  for (const cell of lake.cells) {
    if (fields.lakeId[cell] !== lake.id || fields.biomeId[cell] !== BIOME.LAKE
      || !(fields.featureFlags[cell] & FEATURE.LAKE)) integrity.idMismatches++;
  }
  if (!lake.shoreCells.length) integrity.missingShore++;
  for (const cell of lake.shoreCells) if (!fields.landMask[cell] || fields.lakeId[cell] >= 0 || !fields.lakeShore[cell]
    || !(fields.featureFlags[cell] & FEATURE.LAKE_SHORE) || ![...neighbors(cell)].some((next) => fields.lakeId[next] === lake.id)) integrity.invalidShore++;
  if (!lake.wetlandCells.length) integrity.missingWetland++;
  const shore = new Set(lake.shoreCells);
  for (const cell of lake.wetlandCells) if (!shore.has(cell) || fields.biomeId[cell] !== BIOME.WETLAND
    || !(fields.featureFlags[cell] & FEATURE.WETLAND)) integrity.invalidWetland++;
}
function worldLakeHash(fields) {
  let hash = fnv1aBytes(new Uint8Array(fields.lakeId.buffer)); hash = hashF32(hash, fields.lakeDepth, 100000);
  hash = fnv1aBytes(fields.lakeShore, hash); hash = hashF32(hash, fields.freshwaterInfluence, 100000);
  return hexU32(fnv1aBytes(new TextEncoder().encode(JSON.stringify(fields.lakes)), hash));
}
function neighbors(cell) { return topo.nodeNeighbors.subarray(topo.nodeStart[cell], topo.nodeStart[cell + 1]); }
function distribution(values) { const sorted = values.slice().sort((a, b) => a - b); if (!sorted.length) return { min: 0, median: 0, p90: 0, p95: 0, max: 0, mean: 0 };
  return { min: round(sorted[0]), median: round(sorted[Math.floor(sorted.length * .5)]), p90: round(sorted[Math.floor(sorted.length * .9)]),
    p95: round(sorted[Math.floor(sorted.length * .95)]), max: round(sorted.at(-1)), mean: round(sorted.reduce((sum, value) => sum + value, 0) / sorted.length) }; }
function round(value) { return Number(value.toFixed(5)); }
