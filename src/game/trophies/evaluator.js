/** Monotonic Trophy evaluation; callers choose explicit transaction timing. */
import { ADAPTATIONS } from '../adaptations.js';
import { getMemoryNode } from '../skills/index.js';
import { ADAPTATION_TROPHIES } from './adaptation.js'; import { ENDURANCE_TROPHIES } from './endurance.js';
import { EVOLUTION_TROPHIES } from './evolution.js'; import { FORM_TROPHIES } from './form.js';
import { MASTERY_TROPHIES } from './mastery.js'; import { REACH_TROPHIES } from './reach.js';
import { deriveLegacyTrophyFacts, validateTrophyFacts } from './facts.js';
import { TROPHY_MAX_KEYS, TROPHY_SUM_KEYS } from './keys.js';
export { TROPHY_CONDITION_KEYS, TROPHY_DERIVED_KEYS, TROPHY_MAX_KEYS, TROPHY_SUM_KEYS } from './keys.js';
const CATALOG = Object.freeze([REACH_TROPHIES, FORM_TROPHIES, ENDURANCE_TROPHIES,
  ADAPTATION_TROPHIES, EVOLUTION_TROPHIES, MASTERY_TROPHIES].flat());
const ORDER = new Map(CATALOG.map((trophy, index) => [trophy.id, index]));
const CARD = new Map(ADAPTATIONS.map((card) => [card.id, card]));

export function trophyConditionMet(condition, aggregate) {
  if (condition?.rule === 'at-least') return (aggregate[condition.key] ?? 0) >= condition.value;
  if (condition?.rule === 'includes') return ((aggregate[condition.key] ?? 0) & condition.mask) === condition.mask;
  if (condition?.rule === 'all') return condition.conditions.every((entry) => trophyConditionMet(entry, aggregate));
  if (condition?.rule === 'any') return condition.conditions.some((entry) => trophyConditionMet(entry, aggregate));
  return false;
}

/** Explicit recognition. newFacts is supplied only by an exactly-once world commit. */
export function reconcileTrophies(meta, archive, newFacts = null) {
  const backfill = (meta.trophyBackfillVersion ?? 0) < 2; const aggregate = baseAggregate(meta); let evaluatedWorlds = 0;
  if (backfill) {
    for (const world of archive?.worlds ?? []) { const facts = validateTrophyFacts(world.trophyFacts) ?? deriveLegacyTrophyFacts(world);
      if (facts) { mergeFacts(aggregate, facts); evaluatedWorlds++; } }
  } else if (newFacts) { const facts = validateTrophyFacts(newFacts); if (facts) { mergeFacts(aggregate, facts); evaluatedWorlds = 1; } }
  const owned = new Set(Array.isArray(meta.trophyIds) ? meta.trophyIds : []); const awardedIds = [];
  for (const trophy of CATALOG) if (!owned.has(trophy.id) && trophyConditionMet(trophy.condition, aggregate)) { owned.add(trophy.id); awardedIds.push(trophy.id); }
  const trophyIds = [...owned].filter((id) => ORDER.has(id)).sort((a, b) => ORDER.get(a) - ORDER.get(b));
  const queued = uniqueIds([...(meta.trophyQueue ?? []), ...awardedIds]).filter((id) => ORDER.has(id));
  const next = { ...meta, trophyVersion: 2, trophyIds, trophyQueue: queued, trophyBackfillVersion: 2,
    trophyProgress: serializeProgress(aggregate) };
  return Object.freeze({ meta: next, awardedIds: Object.freeze(awardedIds), backfilled: backfill, evaluatedWorlds,
    aggregate: Object.freeze({ ...aggregate, adaptationIds: undefined }) });
}

export function baseAggregate(meta) {
  const skills = Array.isArray(meta.memoryNodes) ? meta.memoryNodes : []; const branches = new Set();
  for (const id of skills) { const branch = getMemoryNode(id)?.branch; if (branch) branches.add(branch); }
  const progress = meta.trophyProgress ?? {}; const a = Object.fromEntries([...TROPHY_MAX_KEYS, ...TROPHY_SUM_KEYS].map((key) => [key, 0]));
  for (const key of [...TROPHY_MAX_KEYS, ...TROPHY_SUM_KEYS]) a[key] = finite(progress.aggregate?.[key]);
  Object.assign(a, { runs: finite(meta.runs), bestScore: finite(meta.bestScore), totalEchoes: finite(meta.totalEchoes),
    skillCount: skills.length, skillBranchCount: branches.size, imprintCount: meta.imprints?.length ?? 0,
    geographyMask: finite(progress.geographyMask), crisisMask: finite(progress.crisisMask),
    adaptationCategoryMask: finite(progress.adaptationCategoryMask), lakeTypeMask: finite(progress.lakeTypeMask),
    lakeSalinityMask: finite(progress.lakeSalinityMask), adaptationIds: new Set(progress.adaptationIds ?? []) });
  cardDiversity(a); return a;
}

export function mergeFacts(a, f) {
  a.geographyMask |= f.geographyMask; a.crisisMask |= f.crisisMask; a.adaptationCategoryMask |= f.adaptationCategoryMask;
  a.lakeTypeMask |= f.lakeTypeMask; a.lakeSalinityMask |= f.lakeSalinityMask; for (const id of f.adaptationIds) a.adaptationIds.add(id);
  const maxima = { survivalSeconds: f.survivalSeconds, peakCoverageBp: f.peakCoverageBp, sustainedCoverageBp: f.sustainedCoverageBp,
    reachGains: f.reach[0], frontierGrowth: f.reach[1], regrowth: f.reach[2], loops: f.morph[0],
    splits: f.morph[1], reconnections: f.morph[2],
    breakAndMend: f.morph[1] && f.morph[2] ? 1 : 0, crisesEndured: f.crisesEndured,
    allCrisesEndured: f.flags & 1 ? 1 : 0, adaptationsSelected: f.offers[0], manualSelections: f.offers[1],
    randomSelections: f.offers[2], allOffersResolved: f.flags & 2 ? 1 : 0, coherentMajority: f.flags & 4 ? 1 : 0,
    unbrokenMajority: f.flags & 8 ? 1 : 0, allAdaptationCategoriesWorld: f.flags & 16 ? 1 : 0,
    diverseGeographyWorld: f.flags & 32 ? 1 : 0, lakeMorphologyWorld: f.flags & 64 ? 1 : 0,
    lakeEcologyWorld: f.flags & 128 ? 1 : 0, forestWetlandWorld: (f.ecologyMask & 6) === 6 ? 1 : 0,
    forestHighlandWorld: (f.ecologyMask & 12) === 12 ? 1 : 0, lakeWetlandWorld: (f.ecologyMask & 3) === 3 ? 1 : 0,
    lakeCellsReached: f.lake[0], lakeShoreCellsReached: f.lake[1],
    distinctLakesReached: f.lake[2], completeLakeShores: f.lake[3], lakeLivingSeconds: f.lake[4],
    largeLakeLivingSeconds: f.lake[5], lakeRegionPeak: f.lake[6], droughtLakeSurvivals: f.lake[7],
    freezeLakeSurvivals: f.lake[8], lakeLoopSeconds: f.lake[9], loopSurplusPeak: f.lake[10] };
  for (const [key, value] of Object.entries(maxima)) a[key] = Math.max(a[key] ?? 0, value ?? 0);
  const axes = ['survivalAxisBp','reachAxisBp','spreadAxisBp','unityAxisBp','efficiencyAxisBp','resolveAxisBp'];
  axes.forEach((key, index) => { a[key] = Math.max(a[key], f.scoreAxesBp[index]); }); const q = f.scoreAxesBp;
  a.balancedAxesWorld ||= meets(q, [10000, 6000, 4400, 10000, 4400, 10000]);
  a.reachFormWorld ||= q[1] >= 7000 && q[2] >= 6000 && q[3] >= 10000;
  a.efficientResolveWorld ||= q[4] >= 4500 && q[5] >= 10000;
  a.allAxesWorld ||= meets(q, [10000, 7000, 5000, 10000, 4200, 10000]);
  a.worldsWithLake += f.lake[2] >= 2 ? 1 : 0; a.worldsWithManual += f.offers[1] >= 3 ? 1 : 0;
  a.worldsWithAuto += f.offers[2] >= 3 ? 1 : 0; a.worldsAllOffers += f.flags & 2 ? 1 : 0;
  a.totalCrisesEndured += f.crisesEndured; a.totalAdaptationsSelected += f.offers[0]; a.totalManualSelections += f.offers[1];
  a.totalRandomSelections += f.offers[2]; a.totalReachGains += f.reach[0]; a.totalRegrowth += f.reach[2];
  a.totalLakeLivingSeconds += f.lake[4]; a.totalLakeCrisisSurvivals += f.lake[7] + f.lake[8];
  a.balancedWorlds += meets(q, [10000, 6000, 4400, 10000, 4400, 10000]) ? 1 : 0;
  cardDiversity(a);
}

function serializeProgress(a) { const aggregate = {};
  for (const key of [...TROPHY_MAX_KEYS, ...TROPHY_SUM_KEYS]) aggregate[key] = finite(a[key]);
  return { version: 3, adaptationIds: [...a.adaptationIds].sort(), geographyMask: a.geographyMask, geographyVersion: 3,
    crisisMask: a.crisisMask, adaptationCategoryMask: a.adaptationCategoryMask,
    lakeTypeMask: a.lakeTypeMask, lakeSalinityMask: a.lakeSalinityMask, aggregate };
}
function cardDiversity(a) { const counts = { reach: 0, metabolism: 0, resilience: 0, transport: 0, symbiosis: 0, memory: 0 };
  for (const id of a.adaptationIds) for (const category of CARD.get(id)?.cats ?? []) counts[category]++;
  a.adaptationCardCount = a.adaptationIds.size; for (const [category, count] of Object.entries(counts)) a[`${category}CardCount`] = count;
}
function meets(values, thresholds) { return thresholds.every((threshold, index) => values[index] >= threshold); }
function finite(value) { return Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0; }
function uniqueIds(ids) { return [...new Set(ids.filter((id) => typeof id === 'string'))]; }
