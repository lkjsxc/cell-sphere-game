#!/usr/bin/env node
/** Distribution and integrity audit for explicit major drainage systems. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRng } from '../../src/core/prng.js';
import { createFields } from '../../src/world/fields.js';
import { createTopology } from '../../src/world/icosphere.js';
const count = Number(process.argv.find((arg) => arg.startsWith('--count='))?.split('=')[1] ?? 1000);
if (!Number.isInteger(count) || count < 1 || count > 10_000) throw new Error('count must be 1..10000');
const topo = createTopology(4); const longest = []; const median = []; const systems = []; const basin = []; const tributaries = [];
const sourceElevation = []; let cycles = 0; let invalidMouths = 0; let broken = 0; let isolated = 0; let decreasing = 0;
const started = performance.now();
for (let index = 0; index < count; index++) {
  const seed = (0x51ab3d71 ^ Math.imul(index + 1, 0x9e3779b1)) >>> 0;
  const fields = createFields(createRng(seed), topo); const lengths = fields.majorRivers.map((river) => river.length).sort((a, b) => a - b);
  systems.push(lengths.length); longest.push(lengths.at(-1) ?? 0); median.push(lengths[Math.floor(lengths.length / 2)] ?? 0);
  let worldTributaries = 0;
  for (const river of fields.majorRivers) {
    basin.push(river.basinFlow); sourceElevation.push(fields.altitude[river.headwater]);
    const cells = [...river.cells];
    for (let i = 0; i < cells.length - 1; i++) {
      if (fields.drainTo[cells[i]] !== cells[i + 1]) broken++;
      if (fields.flowAccumulation[cells[i + 1]] + .0001 < fields.flowAccumulation[cells[i]]) decreasing++;
    }
    if (fields.landMask[fields.drainTo[river.mouth]]) invalidMouths++;
  }
  for (let cell = 0; cell < topo.nodeCount; cell++) if (fields.riverStrength[cell] > 0) {
    if (fields.riverClass[cell] === 1) worldTributaries++;
    const down = fields.drainTo[cell]; if (down >= 0 && fields.landMask[down] && fields.riverStrength[down] <= 0) isolated++;
    const seen = new Set(); let cursor = cell;
    while (cursor >= 0 && fields.landMask[cursor]) { if (seen.has(cursor)) { cycles++; break; } seen.add(cursor); cursor = fields.drainTo[cursor]; }
  }
  tributaries.push(worldTributaries);
}
const report = { worlds: count, elapsedMs: Number((performance.now() - started).toFixed(1)),
  systems: distribution(systems), longestTrunk: distribution(longest), medianTrunk: distribution(median),
  basinFlow: distribution(basin), tributaryCells: distribution(tributaries), sourceElevation: distribution(sourceElevation),
  worldsWithTrunk20: Number((longest.filter((value) => value >= 20).length / count).toFixed(4)),
  integrity: { cycles, invalidMouths, brokenStemLinks: broken, decreasingAccumulation: decreasing, isolatedInteriorSegments: isolated } };
mkdirSync('reports', { recursive: true }); writeFileSync('reports/river-audit.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2)); if (cycles || invalidMouths || broken || decreasing || isolated) process.exitCode = 1;
function distribution(values) { const sorted = values.slice().sort((a, b) => a - b); if (!sorted.length) return { min: 0, median: 0, p90: 0, max: 0, mean: 0 };
  return { min: rounded(sorted[0]), median: rounded(sorted[Math.floor(sorted.length * .5)]), p90: rounded(sorted[Math.floor(sorted.length * .9)]),
    max: rounded(sorted.at(-1)), mean: rounded(sorted.reduce((sum, value) => sum + value, 0) / sorted.length) }; }
function rounded(value) { return Number(value.toFixed?.(4) ?? value); }
