#!/usr/bin/env node
/** Production rolling event-director geometry, onboarding, and huge-profile audit. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { compileChallengeProfile, MAX_EVENTS_PER_WORLD, MIN_TELEGRAPH_TICKS } from '../../src/simulation/challenge-profile.js';
import { RunController } from '../../src/simulation/simulator.js';
import { EVENT_DIRECTOR_VERSION, MAX_EVENT_DIRECTOR_RECENT } from '../../src/simulation/events.js';

const count = Number(process.argv.find((arg) => arg.startsWith('--count='))?.split('=')[1] ?? 210);
const huge = `1${'0'.repeat(512)}`;
if (!Number.isInteger(count) || count < 1 || count > 100000) throw new Error('--count must be 1..100000');
const levels = ['0', '1', '2', '4', '8', huge];
const profiles = Object.fromEntries(levels.map((level) => [level, profileSummary(compileChallengeProfile({ environmentLevel: level }))]));
const size = {}; const arrivals = []; const starts = []; const families = {}; let oceanViolations = 0; let determinismViolations = 0;
let maxActive = 0; let maxRecent = 0; let eventTotal = 0; let onboardingViolations = 0; let preTransitionExtinctions = 0;
for (let index = 0; index < count; index++) {
  const seed = Math.imul(index + 1, 0x9e3779b1) >>> 0;
  const a = runToFirstTransition(seed, '3'); const b = runToFirstTransition(seed, '3');
  const left = a.state.events.map(shape); const right = b.state.events.map(shape);
  if (JSON.stringify(left) !== JSON.stringify(right)) determinismViolations++;
  const protectedRun = runToFirstTransition(seed, '1');
  if (protectedRun.state.events.length !== 0) onboardingViolations++;
  if (a.state.tick < 1200 || protectedRun.state.tick < 1200) preTransitionExtinctions++;
  for (const event of a.state.events) {
    eventTotal++; starts.push(event.startTick); families[event.family] = (families[event.family] ?? 0) + 1;
    (size[event.family] ??= []).push(event.nodes.length); arrivals.push(Math.max(...event.arrivalTicks));
    if (event.startTick - 1200 < MIN_TELEGRAPH_TICKS) onboardingViolations++;
    if (['drought', 'bloom', 'blight'].includes(event.family)) for (const cell of event.nodes) oceanViolations += a.state.fields.landMask[cell] ? 0 : 1;
  }
  for (let step = 0; step < 18 && a.state.status !== 'extinct'; step++) {
    a.advance(100); maxActive = Math.max(maxActive, a.state.events.length); maxRecent = Math.max(maxRecent, a.state.eventDirector.recent.length);
  }
}
const valid = Object.values(profiles).every((profile) => profile.finite && profile.maxConcurrent <= MAX_EVENTS_PER_WORLD
  && profile.telegraphTicks >= MIN_TELEGRAPH_TICKS) && !oceanViolations && !determinismViolations && !onboardingViolations
  && maxActive <= MAX_EVENTS_PER_WORLD && maxRecent <= MAX_EVENT_DIRECTOR_RECENT;
const report = { schema: 3, model: 'rolling-director-v2', worlds: count, events: eventTotal,
  profiles, starts: distribution(starts), families, computeGeometry: { affectedCells: Object.fromEntries(Object.entries(size)
    .map(([family, values]) => [family, distribution(values)])), maxArrivalTicks: distribution(arrivals), oceanViolations },
  director: { version: EVENT_DIRECTOR_VERSION, maxActive, maxRecent, maxEvents: MAX_EVENTS_PER_WORLD,
    maxRecentEvents: MAX_EVENT_DIRECTOR_RECENT, minTelegraphTicks: MIN_TELEGRAPH_TICKS },
  determinismViolations, onboardingViolations, preTransitionExtinctions, valid };
mkdirSync('reports', { recursive: true }); writeFileSync('reports/event-audit.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2)); if (!valid) process.exitCode = 1;

function runToFirstTransition(seed, worldOrdinal) { const run = new RunController({ seed, worldOrdinal }); run.start(); run.advance(1200); return run; }
function profileSummary(profile) { return { pressure: profile.score.pressure, maxConcurrent: profile.events.maxConcurrent,
  cadenceTicks: profile.events.cadenceTicks, telegraphTicks: profile.events.telegraphTicks,
  finite: [...Object.values(profile.coefficients), ...Object.values(profile.events), profile.score.pressure].every(Number.isFinite) }; }
function shape(event) { return [event.id, event.family, event.startTick, event.endTick, event.center, event.intensity, event.nodes.length]; }
function distribution(values) { if (!values.length) return { min: null, median: null, p95: null, max: null, mean: null };
  const sorted = values.slice().sort((a, b) => a - b); return { min: round(sorted[0]), median: round(sorted[Math.floor(sorted.length * .5)]),
    p95: round(sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * .95))]), max: round(sorted.at(-1)),
    mean: round(sorted.reduce((a, b) => a + b, 0) / sorted.length) }; }
function round(value) { return Number(value.toFixed(4)); }
