/** Monotonic Trophy evaluation; callers choose explicit transaction timing. */
import { getMemoryNode } from '../skills/index.js';
import { ADAPTATION_TROPHIES } from './adaptation.js'; import { ENDURANCE_TROPHIES } from './endurance.js';
import { EVOLUTION_TROPHIES } from './evolution.js'; import { FORM_TROPHIES } from './form.js';
import { MASTERY_TROPHIES } from './mastery.js'; import { REACH_TROPHIES } from './reach.js';
import { deriveLegacyTrophyFacts, validateTrophyFacts } from './facts.js';
const CATALOG = Object.freeze([REACH_TROPHIES, FORM_TROPHIES, ENDURANCE_TROPHIES,
  ADAPTATION_TROPHIES, EVOLUTION_TROPHIES, MASTERY_TROPHIES].flat());
const ORDER = new Map(CATALOG.map((trophy, index) => [trophy.id, index]));

export function trophyConditionMet(condition, aggregate) {
  if (condition?.rule === 'at-least') return (aggregate[condition.key] ?? 0) >= condition.value;
  if (condition?.rule === 'includes') return ((aggregate[condition.key] ?? 0) & condition.mask) === condition.mask;
  return false;
}

/** No caller invokes this from load/validation; it is an explicit progression transaction. */
export function reconcileTrophies(meta, archive) {
  const backfill = (meta.trophyBackfillVersion ?? 0) < 1; const aggregate = baseAggregate(meta); let evaluatedWorlds = 0;
  for (const world of archive?.worlds ?? []) {
    const facts = validateTrophyFacts(world.trophyFacts) ?? (backfill ? deriveLegacyTrophyFacts(world) : null);
    aggregate.bestScore = Math.max(aggregate.bestScore, world.score ?? 0); if (!facts) continue;
    mergeFacts(aggregate, facts); evaluatedWorlds++;
  }
  const owned = new Set(Array.isArray(meta.trophyIds) ? meta.trophyIds : []); const awardedIds = [];
  for (const trophy of CATALOG) if (!owned.has(trophy.id) && trophyConditionMet(trophy.condition, aggregate)) { owned.add(trophy.id); awardedIds.push(trophy.id); }
  const trophyIds = [...owned].filter((id) => ORDER.has(id)).sort((a, b) => ORDER.get(a) - ORDER.get(b));
  const next = { ...meta, trophyVersion: 1, trophyIds, trophyBackfillVersion: 1,
    trophyProgress: { adaptationIds: [...aggregate.adaptationIds].sort(), geographyMask: aggregate.geographyMask,
      geographyVersion: 2, crisisMask: aggregate.crisisMask, adaptationCategoryMask: aggregate.adaptationCategoryMask } };
  return Object.freeze({ meta: next, awardedIds: Object.freeze(awardedIds), backfilled: backfill, evaluatedWorlds });
}

function baseAggregate(meta) {
  const skills = Array.isArray(meta.memoryNodes) ? meta.memoryNodes : []; const branches = new Set();
  for (const id of skills) { const branch = getMemoryNode(id)?.branch; if (branch) branches.add(branch); }
  const progress = meta.trophyProgress ?? {};
  return { runs: meta.runs ?? 0, bestScore: meta.bestScore ?? 0, totalEchoes: meta.totalEchoes ?? 0,
    skillCount: skills.length, skillBranchCount: branches.size, imprintCount: meta.imprints?.length ?? 0,
    geographyMask: progress.geographyMask ?? 0, crisisMask: progress.crisisMask ?? 0,
    adaptationCategoryMask: progress.adaptationCategoryMask ?? 0, adaptationIds: new Set(progress.adaptationIds ?? []),
    survivalSeconds: 0, peakCoverageBp: 0, sustainedCoverageBp: 0, reachGains: 0, loops: 0, splits: 0,
    reconnections: 0, breakAndMend: 0, regrowth: 0, reconnectionGrowth: 0, frontierGrowth: 0,
    adaptationGrowth: 0, skillRecovery: 0, coherentMajority: 0, unbrokenMajority: 0, crisesEndured: 0,
    allCrisesEndured: 0, adaptationsSelected: 0, manualSelections: 0, randomSelections: 0, allOffersResolved: 0,
    allAdaptationCategoriesWorld: 0, survivalAxisBp: 0, reachAxisBp: 0, spreadAxisBp: 0,
    unityAxisBp: 0, efficiencyAxisBp: 0, resolveAxisBp: 0, balancedAxesWorld: 0, reachFormWorld: 0,
    efficientResolveWorld: 0, allAxesWorld: 0, adaptationCardCount: 0 };
}
function mergeFacts(a, f) {
  a.geographyMask |= f.geographyMask; a.crisisMask |= f.crisisMask; a.adaptationCategoryMask |= f.adaptationCategoryMask;
  for (const id of f.adaptationIds) a.adaptationIds.add(id); a.adaptationCardCount = a.adaptationIds.size;
  maxima(a, { survivalSeconds: f.survivalSeconds, peakCoverageBp: f.peakCoverageBp, sustainedCoverageBp: f.sustainedCoverageBp,
    reachGains: f.reach[0], frontierGrowth: f.reach[1], regrowth: f.reach[2], reconnectionGrowth: f.reach[3],
    adaptationGrowth: f.reach[4], skillRecovery: f.reach[5], loops: f.morph[0], splits: f.morph[1], reconnections: f.morph[2],
    breakAndMend: f.morph[1] && f.morph[2] ? 1 : 0, crisesEndured: f.crisesEndured,
    allCrisesEndured: f.flags & 1 ? 1 : 0, adaptationsSelected: f.offers[0], manualSelections: f.offers[1],
    randomSelections: f.offers[2], allOffersResolved: f.flags & 2 ? 1 : 0, coherentMajority: f.flags & 4 ? 1 : 0,
    unbrokenMajority: f.flags & 8 ? 1 : 0, allAdaptationCategoriesWorld: f.flags & 16 ? 1 : 0 });
  const keys = ['survivalAxisBp', 'reachAxisBp', 'spreadAxisBp', 'unityAxisBp', 'efficiencyAxisBp', 'resolveAxisBp'];
  keys.forEach((key, index) => { a[key] = Math.max(a[key], f.scoreAxesBp[index]); }); const q = f.scoreAxesBp;
  a.balancedAxesWorld ||= meets(q, [7000, 4000, 2500, 8000, 1800, 6000]);
  a.reachFormWorld ||= q[1] >= 7000 && q[2] >= 5000 && q[3] >= 9800;
  a.efficientResolveWorld ||= q[4] >= 2500 && q[5] >= 10000;
  a.allAxesWorld ||= meets(q, [10000, 7000, 5000, 9800, 2500, 10000]);
}
function maxima(target, values) { for (const [key, value] of Object.entries(values)) target[key] = Math.max(target[key] ?? 0, value ?? 0); }
function meets(values, thresholds) { return thresholds.every((threshold, index) => values[index] >= threshold); }
