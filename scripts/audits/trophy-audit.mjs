#!/usr/bin/env node
/** Production Trophy calibration, catalog integrity, migration, and dominance audit. */
import { mkdirSync, writeFileSync } from 'node:fs'; import { performance } from 'node:perf_hooks';
import { TROPHIES, TROPHY_IDS, validateTrophyCatalog } from '../../src/game/trophies/index.js';
import { validateTrophyAtlas } from '../../src/game/trophies/atlas.js';
import { baseAggregate, reconcileTrophies, trophyConditionMet } from '../../src/game/trophies/evaluator.js';
import { TROPHY_MAX_KEYS, TROPHY_SUM_KEYS } from '../../src/game/trophies/keys.js';
import { validateTrophyFacts } from '../../src/game/trophies/facts.js';
import { MEMORY_BRANCHES, availableMemoryNodes, compileEvolution, purchaseEvolutionLevel } from '../../src/game/skills/index.js';
import { RunController } from '../../src/simulation/simulator.js';
import { compareProgressionIntegers, incrementProgressionInteger } from '../../src/core/progression-integer.js';
import { applyRunResult } from '../../src/interface/policies/run-result.js';
import { defaultHistory } from '../../src/platform/history.js'; import { defaultMeta, validateMeta } from '../../src/platform/storage.js';
import { hashStringU32, hexU32 } from '../../src/core/hash.js';

const started = performance.now(); const catalog = validateTrophyCatalog(); const atlas = validateTrophyAtlas();
const firstWorldCohort = Array.from({ length: 24 }, (_, lane) => firstWorld(20260731 + lane * 104729));
const campaign = modeledCampaign(240); const targets = { 1: [1, 2], 4: [3, 8], 12: [8, 20], 48: [20, 45], 240: [65, 92] };
const targetResults = Object.fromEntries(Object.entries(targets).map(([horizon, range]) => { const acquired = campaign.horizons[horizon].total;
  return [horizon, { acquired, target: range, withinTarget: acquired >= range[0] && acquired <= range[1] }]; }));
const trivial = TROPHY_IDS.filter((id) => id !== 'evolution-first-world'
  && firstWorldCohort.filter((row) => row.ids.includes(id)).length >= firstWorldCohort.length / 2);
const impossible = impossibleCriteria(); const duplicateConditions = duplicateBy((trophy) => JSON.stringify(trophy.condition));
const duplicateCriteria = duplicateBy((trophy) => trophy.criteriaEn); const dominance = dominantPairs(); const legacy = legacyAudit();
const cohortCounts = firstWorldCohort.map((row) => row.ids.length).sort((a, b) => a - b);
const report = { catalog: { count: catalog.count, families: catalog.families, uniqueIds: catalog.uniqueIds,
    uniqueCriteria: new Set(TROPHIES.map((trophy) => trophy.criteriaEn)).size, uniqueConditions: new Set(TROPHIES.map((trophy) => JSON.stringify(trophy.condition))).size,
    combinators: ruleCounts() }, topology: { cells: 162, trophyCells: atlas.cells, neutralCells: atlas.neutral, mappingHash: atlas.hash },
  productionFirstWorldCohort: { worlds: firstWorldCohort.length, min: cohortCounts[0], median: cohortCounts[Math.floor(cohortCounts.length / 2)],
    max: cohortCounts.at(-1), distribution: frequencies(cohortCounts), automaticNonOnboardingAtLeastHalf: trivial },
  modeledCampaign: { policy:'production autonomous authority; one affordable adjacent Evolution level per world',
    horizons: targetResults, newlyByHorizon: campaign.horizons, finalOwnedCells: campaign.meta.evolutionLevels.length,
    finalEchoes: campaign.meta.totalEchoes, finalTrophies: campaign.meta.trophyIds.length, remaining: 96 - campaign.meta.trophyIds.length,
    familyTotals: familyTotals(campaign.meta.trophyIds) },
  integrity: { impossible, duplicateConditions, duplicateCriteria, dominatedPairs: dominance, oneTimeRewards: campaign.oneTime,
    legacyMigration: legacy }, elapsedMs: Math.round(performance.now() - started) };
report.deterministicHash = hexU32(hashStringU32(JSON.stringify({ catalog: report.catalog, cohort: report.productionFirstWorldCohort,
  campaign: report.modeledCampaign, integrity: report.integrity })));
report.valid = catalog.valid && atlas.valid && !trivial.length && !impossible.length && !duplicateConditions.length && !duplicateCriteria.length
  && Object.values(targetResults).every((row) => row.withinTarget) && legacy.valid && campaign.oneTime.valid && campaign.meta.trophyIds.length < 96;
mkdirSync('reports', { recursive: true }); writeFileSync('reports/trophy-audit.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2)); if (!report.valid) process.exitCode = 1;

function firstWorld(seed) { const result = automaticRun(seed, defaultMeta()); const tx = applyRunResult(defaultMeta(), defaultHistory(),
    { ...result, resultTransactionKey: `fresh:${seed}` }, 32, new Set()); return { seed, ids: tx.trophyIds }; }
function modeledCampaign(worlds) { let meta = defaultMeta(); let archive = defaultHistory(); const keys = new Set(); const horizons = {}; let prior = new Set(); let firstTx = null;
  for (let run = 1; run <= worlds; run++) { const seed = (20260731 + (run - 1) * 104729) & 0x3fffffff;
    const result = automaticRun(seed, meta);
    const tx = applyRunResult(meta, archive, { ...result, resultTransactionKey: `campaign:${run}:${seed}` }, 32, keys);
    if (run === 1) firstTx = { before: { meta, archive }, result: { ...result, resultTransactionKey: `campaign:${run}:${seed}` }, tx };
    keys.add(tx.key); meta = tx.meta; archive = tx.archive; const bought = buyOne(meta, run); meta = bought.meta;
    meta = reconcileTrophies(meta, archive).meta;
    if ([1,4,12,48,240].includes(run)) { const current = new Set(meta.trophyIds); const newly = [...current].filter((id) => !prior.has(id));
      horizons[run] = { total: current.size, newlySincePreviousHorizon: newly.length, names: newly }; prior = current; }
  }
  const duplicate = applyRunResult(firstTx.tx.meta, firstTx.tx.archive, firstTx.result, 32, new Set([firstTx.tx.key]));
  const awardEvents = firstTx.tx.archive.worlds[0].events.filter((event) => event.key === 'trophy.earned');
  return { meta, archive, horizons, oneTime: { duplicateApplied: duplicate.applied, duplicateAwards: duplicate.trophyIds.length,
    firstAwardIdsUnique: new Set(firstTx.tx.trophyIds).size === firstTx.tx.trophyIds.length,
    firstHistoryEntries: awardEvents.length, firstQueueEntries: firstTx.tx.meta.trophyQueue.length,
    valid: !duplicate.applied && !duplicate.trophyIds.length && awardEvents.length === firstTx.tx.trophyIds.length } };
}
function automaticRun(seed, meta) { const evolution=compileEvolution(meta);
  const rc=new RunController({seed,strainId:'pioneer',worldOrdinal:incrementProgressionInteger(meta.runs),
    evolutionDefense:{affinityDefense:evolution.affinityDefense,pressureDefense:evolution.pressureDefense},
    worldPotential:evolution.worldPotential,evolutionPower:evolution.evolutionPower,evolutionDepth:evolution.evolutionDepth,potentialVersion:evolution.potentialVersion,
    memoryEffects:evolution.effects,memoryConditionals:evolution.conditionals,memoryUnlocks:evolution.unlocks,habitatCapabilities:evolution.habitatCapabilities,
    activeBuilds:evolution.activeBuilds,buildEffects:evolution.buildEffects,electricityMastery:evolution.electricityMastery});rc.start();
  while(rc.state.status!=='extinct')rc.advance(20);return rc.buildResult();}
function buyOne(meta,run){const preferred=MEMORY_BRANCHES[(run-1)%MEMORY_BRANCHES.length],options=availableMemoryNodes(meta).slice()
    .sort((a,b)=>(a.affinity===preferred?-1:0)-(b.affinity===preferred?-1:0)||Number(a.owned)-Number(b.owned)||a.tier-b.tier
      ||compareProgressionIntegers(a.nextCost,b.nextCost)||a.id.localeCompare(b.id));
  if(!options.length)return{ok:false,meta};const state=options[0];return purchaseEvolutionLevel(meta,state.id,{expectedLevel:state.currentLevel,expectedRevision:meta.revision,
    transactionKey:`trophy-audit:${run}:${state.id}:${state.currentLevel}`});}
function impossibleCriteria() { const aggregate = Object.fromEntries([...TROPHY_MAX_KEYS, ...TROPHY_SUM_KEYS].map((key) => [key, 10_000_000]));
  Object.assign(aggregate, { runs: 10000, bestScore: 2_000_000, totalEchoes: 1_000_000, skillCount: 252, skillBranchCount: 6,
    imprintCount: 8, geographyMask: 63, crisisMask: 127, adaptationCategoryMask: 63, adaptationCardCount: 24,
    lakeTypeMask: 31, lakeSalinityMask: 7, reachCardCount: 6, metabolismCardCount: 6, resilienceCardCount: 7,
    transportCardCount: 5, symbiosisCardCount: 4, memoryCardCount: 2 });
  return TROPHIES.filter((trophy) => !trophyConditionMet(trophy.condition, aggregate)).map((trophy) => trophy.id); }
function legacyAudit() { const loaded = validateMeta({ ...defaultMeta(), schema: 7, trophyIds: ['reach-river-touch'], trophyBackfillVersion: 1,
    trophyProgress: { geographyMask: 2 } }); const facts = validateTrophyFacts({ version: 1, geographyMask: 2 });
  const outcome = reconcileTrophies(loaded, { worlds: [{ seed: 1, tick: 1, score: 0, trophyFacts: facts }] });
  const valid = loaded.legacyTrophyIds.includes('reach-river-touch') && !loaded.trophyIds.includes('reach-lake-network')
    && !(facts.geographyMask & 2) && !outcome.awardedIds.includes('reach-lake-network');
  return { valid, legacyIds: loaded.legacyTrophyIds, currentLakeOwned: loaded.trophyIds.includes('reach-lake-network'), v1LakeBit: facts.geographyMask & 2 }; }
function dominantPairs() { const singles = TROPHIES.map((trophy) => ({ trophy, leaves: allLeaves(trophy.condition) })).filter((row) => row.leaves);
  const pairs = []; for (const high of singles) for (const low of singles) { if (high === low || high.leaves.length !== low.leaves.length) continue;
    const h = new Map(high.leaves.map((leaf) => [leaf.key, leaf])); let strict = false; const dominates = low.leaves.every((leaf) => {
      const other = h.get(leaf.key); if (!other || other.rule !== leaf.rule) return false; const a = other.value ?? other.mask; const b = leaf.value ?? leaf.mask;
      if (leaf.rule === 'includes') { strict ||= a !== b; return (a & b) === b; } strict ||= a > b; return a >= b; });
    if (dominates && strict) pairs.push(`${high.trophy.id} => ${low.trophy.id}`);
  } return pairs.slice(0, 32); }
function allLeaves(condition) { if (condition.rule === 'any') return null; if (condition.rule === 'all') { const nested = condition.conditions.map(allLeaves); return nested.some((row) => !row) ? null : nested.flat(); } return [condition]; }
function duplicateBy(project) { const groups = new Map(); for (const trophy of TROPHIES) { const key = project(trophy); groups.set(key, [...(groups.get(key) ?? []), trophy.id]); }
  return [...groups.values()].filter((ids) => ids.length > 1); }
function frequencies(values) { const out = {}; for (const value of values) out[value] = (out[value] ?? 0) + 1; return out; }
function familyTotals(ids) { const owned = new Set(ids); return Object.fromEntries(['Reach','Form','Endurance','Habitat','Evolution','Mastery'].map((family) => [family,
  TROPHIES.filter((trophy) => trophy.family === family && owned.has(trophy.id)).length])); }
function ruleCounts() { const counts = {}; const visit = (condition) => { counts[condition.rule] = (counts[condition.rule] ?? 0) + 1; for (const child of condition.conditions ?? []) visit(child); };
  for (const trophy of TROPHIES) visit(trophy.condition); return counts; }
