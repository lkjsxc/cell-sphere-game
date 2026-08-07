/** Monotonic Trophy evaluation; callers choose explicit transaction timing. */
import { getMemoryNode, ownedEvolutionIds } from '../skills/index.js';
import { normalizeProgressionInteger, projectProgressionInteger } from '../../core/progression-integer.js';
import { HABITAT_TROPHIES } from './habitat.js'; import { ENDURANCE_TROPHIES } from './endurance.js';
import { EVOLUTION_TROPHIES } from './evolution.js'; import { FORM_TROPHIES } from './form.js';
import { MASTERY_TROPHIES } from './mastery.js'; import { REACH_TROPHIES } from './reach.js';
import { deriveLegacyTrophyFacts, validateTrophyFacts } from './facts.js';
import { TROPHY_MAX_KEYS, TROPHY_SUM_KEYS } from './keys.js';
export { TROPHY_CONDITION_KEYS, TROPHY_DERIVED_KEYS, TROPHY_MAX_KEYS, TROPHY_SUM_KEYS } from './keys.js';
const CATALOG = Object.freeze([REACH_TROPHIES, FORM_TROPHIES, ENDURANCE_TROPHIES,
  HABITAT_TROPHIES, EVOLUTION_TROPHIES, MASTERY_TROPHIES].flat());
const ORDER = new Map(CATALOG.map((trophy, index) => [trophy.id, index]));

export function trophyConditionMet(condition, aggregate) {
  if (condition?.rule === 'at-least') return (aggregate[condition.key] ?? 0) >= condition.value;
  if (condition?.rule === 'includes') return ((aggregate[condition.key] ?? 0) & condition.mask) === condition.mask;
  if (condition?.rule === 'all') return condition.conditions.every((entry) => trophyConditionMet(entry, aggregate));
  if (condition?.rule === 'any') return condition.conditions.some((entry) => trophyConditionMet(entry, aggregate));
  return false;
}

export function reconcileTrophies(meta, archive, newFacts = null) {
  const backfill = (meta.trophyBackfillVersion ?? 0) < 3; const aggregate = baseAggregate(meta); let evaluatedWorlds = 0;
  if (backfill) {
    for (const world of archive?.worlds ?? []) { const facts = validateTrophyFacts(world.trophyFacts) ?? deriveLegacyTrophyFacts(world);
      if (facts) { mergeFacts(aggregate, facts); evaluatedWorlds++; } }
  } else if (newFacts) { const facts = validateTrophyFacts(newFacts); if (facts) { mergeFacts(aggregate, facts); evaluatedWorlds = 1; } }
  const owned = new Set(Array.isArray(meta.trophyIds) ? meta.trophyIds : []); const awardedIds = [];
  for (const trophy of CATALOG) if (!owned.has(trophy.id) && trophyConditionMet(trophy.condition, aggregate)) { owned.add(trophy.id); awardedIds.push(trophy.id); }
  const trophyIds = [...owned].filter((id) => ORDER.has(id)).sort((a, b) => ORDER.get(a) - ORDER.get(b));
  const queued = uniqueIds([...(meta.trophyQueue ?? []), ...awardedIds]).filter((id) => ORDER.has(id));
  const next = { ...meta, trophyVersion: 3, trophyIds, trophyQueue: queued, trophyBackfillVersion: 3,
    trophyProgress: serializeProgress(aggregate) };
  return Object.freeze({ meta: next, awardedIds: Object.freeze(awardedIds), backfilled: backfill, evaluatedWorlds,
    aggregate: Object.freeze({ ...aggregate }) });
}

export function baseAggregate(meta) {
  const skills = ownedEvolutionIds(meta); const branches = new Set();
  for (const id of skills) { const branch = getMemoryNode(id)?.branch; if (branch) branches.add(branch); }
  const progress = meta.trophyProgress ?? {}; const aggregate = Object.fromEntries([...TROPHY_MAX_KEYS, ...TROPHY_SUM_KEYS].map((key) => [key, 0]));
  for (const key of [...TROPHY_MAX_KEYS, ...TROPHY_SUM_KEYS]) aggregate[key] = finite(progress.aggregate?.[key]);
  Object.assign(aggregate, { runs: exactFinite(meta.runs), bestScore: exactFinite(meta.bestScore), totalEchoes: exactFinite(meta.totalEchoes),
    skillCount: skills.length, skillBranchCount: branches.size, imprintCount: meta.imprints?.length ?? 0,
    geographyMask: finite(progress.geographyMask), crisisMask: finite(progress.crisisMask),
    lakeTypeMask: finite(progress.lakeTypeMask), lakeSalinityMask: finite(progress.lakeSalinityMask) });
  return aggregate;
}

export function mergeFacts(a, f) {
  a.geographyMask |= f.geographyMask; a.crisisMask |= f.crisisMask;
  a.lakeTypeMask |= f.lakeTypeMask; a.lakeSalinityMask |= f.lakeSalinityMask;
  const maxima = { survivalSeconds: f.survivalSeconds, peakCoverageBp: f.peakCoverageBp, sustainedCoverageBp: f.sustainedCoverageBp,
    reachGains: f.reach[0], frontierGrowth: f.reach[1], regrowth: f.reach[2], loops: f.morph[0], splits: f.morph[1], reconnections: f.morph[2],
    breakAndMend: f.morph[1] && f.morph[2] ? 1 : 0, crisesEndured: f.crisesEndured,
    allCrisesEndured: f.flags & 1 ? 1 : 0, coherentMajority: f.flags & 4 ? 1 : 0, unbrokenMajority: f.flags & 8 ? 1 : 0,
    diverseGeographyWorld: f.flags & 32 ? 1 : 0, lakeMorphologyWorld: f.flags & 64 ? 1 : 0, lakeEcologyWorld: f.flags & 128 ? 1 : 0,
    forestWetlandWorld: (f.ecologyMask & 6) === 6 ? 1 : 0, forestHighlandWorld: (f.ecologyMask & 12) === 12 ? 1 : 0,
    lakeWetlandWorld: (f.ecologyMask & 3) === 3 ? 1 : 0, lakeCellsReached: f.lake[0], lakeShoreCellsReached: f.lake[1],
    distinctLakesReached: f.lake[2], completeLakeShores: f.lake[3], lakeLivingSeconds: f.lake[4], largeLakeLivingSeconds: f.lake[5],
    lakeRegionPeak: f.lake[6], droughtLakeSurvivals: f.lake[7], freezeLakeSurvivals: f.lake[8], lakeLoopSeconds: f.lake[9], loopSurplusPeak: f.lake[10],
    lakeHabitatCells: f.habitat[0], tundraHabitatCells: f.habitat[1], snowHabitatCells: f.habitat[2], shallowOceanCells: f.habitat[3],
    deepOceanCells: f.habitat[4], habitatClassCount: f.habitatClassCount,
    scoreReachWorld:f.masteryFlags&1?1:0,scoreBalancedWorld:f.masteryFlags&2?1:0,scoreCrisisWorld:f.masteryFlags&4?1:0,
    scoreHabitatWorld:f.masteryFlags&8?1:0,scoreSixAxisWorld:f.masteryFlags&16?1:0,
    resourceRemainingBp: f.resourceRemainingBp, resourceRecoveredCells: f.resourceRecoveredCells,
    freshwaterSupportedSeconds: f.freshwaterSupportedSeconds, transformedCells: f.transformedCells,
    electrifiedCells: f.electrifiedCells, glacialLakeCells: f.glacialLakeCells,
    maritimeForestCells: f.maritimeForestCells, reach100: f.reach100,
    environmentPeakLevel: f.environmentPeakLevel, environmentTimeAtPeakTicks: f.environmentTimeAtPeakTicks,
    environmentPressureTicksQ: f.environmentPressureTicksQ,
    worldThreePressure: !f.onboardingHarmfulEventsDisabled && f.environmentPeakLevel >= 1 && f.eventCount > 0 ? 1 : 0 };
  for (const [key, value] of Object.entries(maxima)) a[key] = Math.max(a[key] ?? 0, value ?? 0);
  a.habitatClassMask=(a.habitatClassMask??0)|f.habitatMask;a.habitatClassCount=bitCount(a.habitatClassMask);
  const axes = ['survivalAxisBp','reachAxisBp','spreadAxisBp','unityAxisBp','efficiencyAxisBp','stabilityAxisBp'];
  axes.forEach((key, index) => { a[key] = Math.max(a[key] ?? 0, f.scoreAxesBp[index]); });
  const q = f.scoreAxesBp; a.balancedAxesWorld ||= meets(q, [8500, 4200, 3000, 8500, 5000, 6500]);
  a.reachFormWorld ||= q[1] >= 6000 && q[2] >= 4500 && q[3] >= 9000;
  a.efficientResolveWorld ||= q[4] >= 5500 && q[5] >= 7500;
  a.allAxesWorld ||= meets(q, [9000, 6500, 5000, 9000, 5500, 7500]);
  a.worldsWithLake += f.lake[2] >= 2 ? 1 : 0; a.totalCrisesEndured += f.crisesEndured;
  a.totalReachGains += f.reach[0]; a.totalRegrowth += f.reach[2]; a.totalLakeLivingSeconds += f.lake[4];
  a.totalLakeCrisisSurvivals += f.lake[7] + f.lake[8]; a.balancedWorlds += meets(q, [8500, 4200, 3000, 8500, 5000, 6500]) ? 1 : 0;
  a.autonomousWorlds += f.autonomous; a.scarcityWorlds += f.scarcityCause;a.resourceDepletedCells+=f.resourceDepletedCells;
  a.zeroEventWorlds += f.autonomous && f.onboardingHarmfulEventsDisabled && f.eventCount === 0 ? 1 : 0;
}

function serializeProgress(a) { const aggregate = {};
  for (const key of [...TROPHY_MAX_KEYS, ...TROPHY_SUM_KEYS]) aggregate[key] = finite(a[key]);
  return { version: 4, geographyMask: a.geographyMask, geographyVersion: 3, crisisMask: a.crisisMask,
    lakeTypeMask: a.lakeTypeMask, lakeSalinityMask: a.lakeSalinityMask, aggregate };
}
function bitCount(value){let count=0;for(let bits=value;bits;bits>>>=1)count+=bits&1;return count;}
function meets(values, thresholds) { return thresholds.every((threshold, index) => values[index] >= threshold); }
function finite(value) { return Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0; }
function exactFinite(value) { return projectProgressionInteger(normalizeProgressionInteger(value, '0'), 10_000_000); }
function uniqueIds(ids) { return [...new Set(ids.filter((id) => typeof id === 'string'))]; }
