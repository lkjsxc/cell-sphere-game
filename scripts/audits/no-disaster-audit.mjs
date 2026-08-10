#!/usr/bin/env node
/** Verify that chronic Environment pressure has no gameplay-disaster authority. */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { compileChallengeProfile } from '../../src/simulation/challenge-profile.js';
import { RunController } from '../../src/simulation/simulator.js';

const count = Number(process.argv.find((arg) => arg.startsWith('--count='))?.split('=')[1] ?? 210);
if (!Number.isInteger(count) || count < 1 || count > 100000) throw new Error('--count must be 1..100000');
const forbidden = ['eventDirector', 'eventStrength', 'eventFamily', 'activeEvents', 'crisisMask', 'crisesEndured', 'harmfulEventsDisabled'];
const removedFiles = ['src/simulation/events.js', 'src/game/events-content.js', 'src/rendering/event-tints.js'];
const source = sourceText('src'); const sourceViolations = forbidden.filter((term) => source.includes(term));
const missingRemovedFiles = removedFiles.filter((path) => existsSync(path));
const levels = ['0', '1', '2', '4', '8', `1${'0'.repeat(512)}`];
const profiles = Object.fromEntries(levels.map((level) => {
  const profile = compileChallengeProfile({ environmentLevel: level });
  return [level, { pressure: profile.score.pressure, severity: profile.score.severity,
    coefficientCount: Object.keys(profile.coefficients).length, finite: Object.values(profile.coefficients).every(Number.isFinite),
    hasGameplayDisasterField: 'events' in profile }];
}));
let authorityViolations = 0; let transitions = 0; let deterministicViolations = 0;
for (let index = 0; index < count; index++) {
  const seed = Math.imul(index + 1, 0x9e3779b1) >>> 0; const a = run(seed); const b = run(seed);
  const left = authorityShape(a); const right = authorityShape(b);
  if (JSON.stringify(left) !== JSON.stringify(right)) deterministicViolations++;
  authorityViolations += [a.state, a.snapshot(), a.buildResult()].reduce((sum, value) => sum + forbidden.filter((key) => key in value).length, 0);
  transitions += Number(a.state.environmentTransitionCount);
}
const valid = !sourceViolations.length && !missingRemovedFiles.length && !authorityViolations && !deterministicViolations
  && Object.values(profiles).every((profile) => profile.finite && !profile.hasGameplayDisasterField);
const report = { schema: 1, model: 'chronic-pressure-v4', worlds: count, profiles, transitions,
  sourceViolations, missingRemovedFiles, authorityViolations, deterministicViolations, valid };
mkdirSync('reports', { recursive: true }); writeFileSync('reports/no-disaster-audit.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2)); if (!valid) process.exitCode = 1;

function run(seed) { const run = new RunController({ seed, worldOrdinal: '1' }); run.start(); run.advance(1200); return run; }
function authorityShape(run) { const result = run.buildResult(); return { tick: run.state.tick, level: run.state.currentEnvironmentLevel,
  profile: run.state.currentEnvironmentProfileHash, resultHash: result.hash, history: result.history }; }
function sourceText(directory) {
  const files = []; const walk = (path) => { for (const entry of readdirSync(path, { withFileTypes: true })) {
    const target = join(path, entry.name); if (entry.isDirectory()) walk(target); else if (entry.name.endsWith('.js')) files.push(target);
  } };
  walk(directory); return files.map((path) => readFileSync(path, 'utf8')).join('\n');
}
