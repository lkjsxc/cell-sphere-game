#!/usr/bin/env node
/** Production habitat lock, direct unlock, occupancy, and marine-bound audit. */
import { mkdirSync, writeFileSync } from 'node:fs'; import { RunController } from '../../src/simulation/simulator.js';
import { compileEvolution, evolutionRunConfiguration, MEMORY_NODES, MEMORY_NODE_IDS, MEMORY_PHYSICAL_ADJACENCY } from '../../src/game/skills/index.js'; import { BIOME } from '../../src/world/constants.js';
const count = Number(process.argv.find((arg) => arg.startsWith('--count='))?.split('=')[1] ?? 60);
// Fixed development anchors cover the rare snow/deep routes in the CI-safe
// cohort; remaining seeds are an ordinary deterministic sequence.
const seedOffsets = [...new Set([0, 13, 21, ...Array.from({ length: Math.max(0, count * 2) }, (_, index) => index)])].slice(0, count);
const compileIds = (ids) => compileEvolution({ evolutionLevels: ids.map((id) => ({ id, level: '1' })) }); const fresh = compileIds([]); const breadth = compileIds(MEMORY_NODE_IDS);
const keys = ['LAKE_ACCESS', 'TUNDRA_ACCESS', 'SNOW_ICE_ACCESS', 'SHALLOW_OCEAN_EDGE_ACCESS', 'SHALLOW_OCEAN_ACCESS', 'DEEP_OCEAN_ACCESS'];
const unlockIds = Object.fromEntries(keys.map((key) => [key, MEMORY_NODES.find((node) => node.effects.some((effect) => effect.kind === 'habitat' && effect.capability === key))?.id]));
const lineage = (...ids) => [...new Set(ids.flatMap(pathTo))];
// A habitat gate does not manufacture a mature network. Each fixture owns the
// shortest physical routes that can actually reach the authored ability, plus
// the immediate cold/coastal support needed to arrive at that habitat alive.
const packages = Object.freeze({
  LAKE_ACCESS: lineage(unlockIds.LAKE_ACCESS),
  TUNDRA_ACCESS: lineage(unlockIds.TUNDRA_ACCESS),
  SNOW_ICE_ACCESS: lineage(unlockIds.SNOW_ICE_ACCESS, unlockIds.TUNDRA_ACCESS),
  SHALLOW_OCEAN_EDGE_ACCESS: lineage(unlockIds.SHALLOW_OCEAN_EDGE_ACCESS),
  SHALLOW_OCEAN_ACCESS: lineage(unlockIds.SHALLOW_OCEAN_ACCESS),
  DEEP_OCEAN_ACCESS: lineage(unlockIds.DEEP_OCEAN_ACCESS, unlockIds.SHALLOW_OCEAN_EDGE_ACCESS, unlockIds.SHALLOW_OCEAN_ACCESS),
});
const configs = { fresh, breadth, ...Object.fromEntries(Object.entries(packages).map(([key, ids]) => [key, compileIds(ids)])) };
const rows = Object.fromEntries(Object.keys(configs).map((key) => [key, []])); let uniqueOccupancyViolations = 0;
for (const [label, evolution] of Object.entries(configs)) for (const offset of seedOffsets) {
  const controller = new RunController({ seed: (0x510000 + offset) >>> 0, worldOrdinal: '8', ...evolutionRunConfiguration(evolution) }); controller.start(); controller.advance(4000);
  const result = controller.buildResult(); const occupancy = result.habitatOccupancy; const total = occupancy.reduce((sum, value) => sum + value, 0); if (total > controller.state.topo.nodeCount) uniqueOccupancyViolations++;
  rows[label].push({ lake: occupancy[BIOME.LAKE], tundra: occupancy[BIOME.TUNDRA], snowIce: occupancy[BIOME.SNOW_ICE], shallow: occupancy[BIOME.SHALLOW_OCEAN], deep: occupancy[BIOME.DEEP_OCEAN],
    marineShare: total ? (occupancy[BIOME.SHALLOW_OCEAN] + occupancy[BIOME.DEEP_OCEAN]) / total : 0, peak: result.peakCoverage, blocked: controller.state.habitatBlocked.reduce((sum, value) => sum + value, 0) });
}
const gated = ['lake', 'tundra', 'snowIce', 'shallow', 'deep']; const report = { worldsPerConfiguration: seedOffsets.length, seedOffsets, unlockIds, packages, uniqueOccupancyViolations,
  configurations: Object.fromEntries(Object.entries(rows).map(([label, values]) => [label, Object.fromEntries([...gated, 'marineShare', 'peak', 'blocked'].map((key) => [key, dist(values.map((row) => row[key]))]))])), valid: false };
report.valid = !uniqueOccupancyViolations && Object.values(unlockIds).every(Boolean) && gated.every((key) => report.configurations.fresh[key].max === 0)
  && report.configurations.fresh.blocked.median > 0 && report.configurations.breadth.marineShare.median < .7 && report.configurations.breadth.peak.median <= 1
  && report.configurations.LAKE_ACCESS.lake.max > 0 && report.configurations.TUNDRA_ACCESS.tundra.max > 0 && report.configurations.SNOW_ICE_ACCESS.snowIce.max > 0
  && report.configurations.SHALLOW_OCEAN_EDGE_ACCESS.shallow.max > 0 && report.configurations.SHALLOW_OCEAN_ACCESS.shallow.max > 0
  && report.configurations.DEEP_OCEAN_ACCESS.deep.max > 0;
mkdirSync('reports', { recursive: true }); writeFileSync('reports/habitat-audit.json', `${JSON.stringify(report, null, 2)}\n`); console.log(JSON.stringify(report, null, 2)); if (!report.valid) process.exitCode = 1;
function pathTo(target) {
  const pending = ['first-division']; const previous = new Map([['first-division', null]]);
  for (let index = 0; index < pending.length; index++) {
    const id = pending[index]; if (id === target) break;
    for (const neighbor of MEMORY_PHYSICAL_ADJACENCY[id] ?? []) if (!previous.has(neighbor)) { previous.set(neighbor, id); pending.push(neighbor); }
  }
  const path = []; for (let id = target; id; id = previous.get(id)) path.push(id);
  return path.reverse();
}
function dist(values) { const sorted = values.slice().sort((a, b) => a - b); const at = (p) => round(sorted[Math.floor((sorted.length - 1) * p)]); return { min: round(sorted[0]), p25: at(.25), median: at(.5), p75: at(.75), p95: at(.95), max: round(sorted.at(-1)) }; }
function round(value) { return Number(value.toFixed(5)); }
