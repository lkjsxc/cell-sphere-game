#!/usr/bin/env node
/** Authoritative first-purchase Luminous, decay, and renderer-hierarchy audit. */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { RunController } from '../../src/simulation/simulator.js';
import { compileEvolution, evolutionRunConfiguration } from '../../src/game/skills/index.js';

const seeds = [1, 9099, 2693800525, 44123];
const firstIds = ['first-division', 'reliable-budding', 'bioelectric-spark'];
const matureIds = ['first-division', 'reliable-budding', 'nutrient-uptake', 'frugal-membrane', 'stable-transport',
  'bioelectric-spark', 'light-retention', 'powered-transport', 'luminous-recovery', 'luminous-canopy', 'deep-current', 'luminous-crown'];
const configs = Object.freeze({ fresh: compileEvolution({}), first: compileEvolution({ evolutionLevels: levels(firstIds) }),
  mature: compileEvolution({ evolutionLevels: levels(matureIds) }) });
const rows = Object.fromEntries(Object.entries(configs).map(([name, evolution]) => [name, seeds.map((seed) => run(name, evolution, seed))]));
const repeat = run('mature-repeat', configs.mature, seeds[1]); const first = rows.first; const mature = rows.mature; const fresh = rows.fresh;
const shader = readFileSync(new URL('../../src/rendering/shaders.js', import.meta.url), 'utf8');
const canvas = readFileSync(new URL('../../src/rendering/fallback2d.js', import.meta.url), 'utf8');
const authority = readFileSync(new URL('../../src/simulation/worldmaking.js', import.meta.url), 'utf8');
const rendererSourceContract = {
  webglChargeGate: /float chargeLight = pow\(powered/.test(shader), webglDarkness: /float darkness = 1\.0 - daylight/.test(shader),
  webglOrdinaryDark: /alive \* life[^\n]*darkness/.test(shader), webglPoweredDarkBoost: /darkness \* 0\.54/.test(shader),
  canvasChargeGate: /if \(powered > 0\)/.test(canvas), canvasDarkness: /const darkness=1-daylight/.test(canvas),
  canvasOrdinaryDark: /state === LIFE_STATE\.LIVING/.test(canvas), wireGeometry: /(?:wire|cable|powerline)(?:Geometry|Path|Vertex)/i.test(`${shader}\n${canvas}\n${authority}`),
};
const average = (rows, key) => rows.reduce((sum, row) => sum + row.mid[key], 0) / rows.length;
const invariants = {
  freshHasNoFalseLight: fresh.every((row) => row.mid.poweredCells === 0 && row.mid.chargeSum === 0 && !row.luminous.enabled),
  firstPurchaseChargesRealCells: first.some((row) => row.terminal.everPoweredCells > 0 && row.terminal.poweredCellSeconds > 0),
  matureLuminousIsStronger: average(mature, 'chargeSum') > average(first, 'chargeSum') && configs.mature.luminous.visualDevelopment > configs.first.luminous.visualDevelopment,
  matureUpkeepImproves: configs.first.luminous.upkeepScale > 1 && configs.mature.luminous.upkeepScale < configs.first.luminous.upkeepScale,
  liveChargeDecayObserved: first.some((row) => row.liveDecayCells > 0),
  extinctionClearsLiveCharge: [...first, ...mature].every((row) => row.terminal.finalElectrifiedCells === 0),
  deterministic: rows.mature[1].hash === repeat.hash && JSON.stringify(rows.mature[1].mid) === JSON.stringify(repeat.mid),
  rendererHierarchy: ['webglChargeGate', 'webglDarkness', 'webglOrdinaryDark', 'webglPoweredDarkBoost', 'canvasChargeGate', 'canvasDarkness', 'canvasOrdinaryDark']
    .every((key) => rendererSourceContract[key]) && !rendererSourceContract.wireGeometry,
};
const report = { schema: 3, seeds, firstIds, configs: Object.fromEntries(Object.entries(configs).map(([name, value]) => [name, value.luminous])), rows,
  rendererSourceContract, browserVisualGate: 'test:browser:file and test:browser:canvas measure paired zero-charge, ordinary-night, powered-day, and powered-night luminance; paired deltas separate charge emission from daylight.',
  invariants, valid: Object.values(invariants).every(Boolean) };
mkdirSync('reports', { recursive: true }); writeFileSync('reports/luminous-audit.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2)); if (!report.valid) process.exitCode = 1;
function levels(ids) { return ids.map((id) => ({ id, level: '1' })); }
function run(label, evolution, seed) {
  const controller = new RunController({ seed, worldOrdinal: '20', ...evolutionRunConfiguration(evolution) });
  controller.start(); let liveDecayCells = 0; const previous = Uint8Array.from(controller.state.electricityQ);
  for (let tick = 0; tick < 300 && controller.state.status !== 'extinct'; tick++) { controller.advance(1); observeDecay(previous, controller, () => { liveDecayCells++; }); }
  const snapshot = controller.snapshot(); const charge = [...snapshot.electricityQ]; const mid = { tick: snapshot.tick, poweredCells: charge.filter(Boolean).length,
    chargeSum: charge.reduce((sum, value) => sum + value, 0), peakCharge: Math.max(...charge), alive: snapshot.metrics.aliveCount,
    development: snapshot.luminousDevelopment };
  while (controller.state.status !== 'extinct') { previous.set(controller.state.electricityQ); controller.advance(1); observeDecay(previous, controller, () => { liveDecayCells++; }); }
  const result = controller.buildResult(); return { label, seed, luminous: evolution.luminous, mid, terminal: { tick: result.tick, cause: result.cause,
    electrifiedCells: result.electrifiedCells, finalElectrifiedCells: result.finalElectrifiedCells, everPoweredCells: result.everPoweredCells,
    poweredCellSeconds: result.poweredCellSeconds }, liveDecayCells, hash: result.hash };
}
function observeDecay(previous, controller, onDecay) { for (let cell = 0; cell < previous.length; cell++) if (previous[cell] > controller.state.electricityQ[cell] && controller.state.alive[cell]) onDecay(); previous.set(controller.state.electricityQ); }
