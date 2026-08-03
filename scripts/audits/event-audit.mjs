#!/usr/bin/env node
/** Determinism, shape, permeability, and generation-cost audit for graph events. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRng } from '../../src/core/prng.js';
import { scheduleEvents } from '../../src/simulation/events.js';
import { createFields } from '../../src/world/fields.js';
import { createTopology } from '../../src/world/icosphere.js';
const count = Number(process.argv.find((arg) => arg.startsWith('--count='))?.split('=')[1] ?? 200);
const topo = createTopology(4); const size = {}; const computeMs = []; const arrival = []; let oceanViolations = 0; let irregular = 0; let events = 0;
for (let index = 0; index < count; index++) { const seed = Math.imul(index + 1, 0x9e3779b1) >>> 0;
  const fields = createFields(createRng(seed ^ 0x51ab3d71), topo); const started = performance.now();
  const scheduled = scheduleEvents(createRng(seed ^ 0x0e7e17a1), topo, fields, null); computeMs.push((performance.now() - started) / scheduled.length);
  for (const event of scheduled) { events++; (size[event.family] ??= []).push(event.nodes.length); arrival.push(Math.max(...event.arrivalTicks));
    if (['drought', 'bloom', 'blight'].includes(event.family)) for (const cell of event.nodes) oceanViolations += fields.landMask[cell] ? 0 : 1;
    const reached = new Uint8Array(topo.nodeCount); let minDot = 1; for (const cell of event.nodes) { reached[cell] = 1; minDot = Math.min(minDot, dot(topo.positions, event.center, cell)); }
    for (let cell = 0; cell < topo.nodeCount; cell++) if (!reached[cell] && dot(topo.positions, event.center, cell) > minDot + .0001) { irregular++; break; }
  }
}
const report = { worlds: count, events, computeMsPerField: distribution(computeMs), maxArrivalTicks: distribution(arrival),
  affectedCells: Object.fromEntries(Object.entries(size).map(([family, values]) => [family, distribution(values)])),
  oceanViolations, irregularFields: irregular, irregularShare: Number((irregular / events).toFixed(4)) };
mkdirSync('reports', { recursive: true }); writeFileSync('reports/event-audit.json', `${JSON.stringify(report, null, 2)}\n`); console.log(JSON.stringify(report, null, 2));
if (oceanViolations || irregular < events * .8) process.exitCode = 1;
function dot(positions, a, b) { const ai = a * 3; const bi = b * 3; return positions[ai] * positions[bi] + positions[ai + 1] * positions[bi + 1] + positions[ai + 2] * positions[bi + 2]; }
function distribution(values) { const sorted = values.slice().sort((a, b) => a - b); return { min: round(sorted[0]), median: round(sorted[Math.floor(sorted.length * .5)]), p95: round(sorted[Math.floor(sorted.length * .95)]), max: round(sorted.at(-1)), mean: round(sorted.reduce((sum, value) => sum + value, 0) / sorted.length) }; }
function round(value) { return Number(value.toFixed(4)); }
