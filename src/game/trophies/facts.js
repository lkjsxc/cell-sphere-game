/** Compact deterministic Trophy proof retained with completed semantic History. */
import { compareProgressionIntegers, normalizeProgressionInteger,
  projectProgressionInteger } from '../../core/progression-integer.js';

const GEO = Object.freeze({ 'geo.coast.reached': 1, 'geo.lake.reached': 2, 'geo.forest.reached': 4,
  'geo.mountain.reached': 8, 'geo.wetland.reached': 16, 'geo.world_knot.reached': 32 });

export function buildTrophyFacts(result, score) {
  const records = Array.isArray(result.history) ? result.history : []; const morph = morphology(records);
  const geographyMask = recordMask(records, GEO); const reach = result.reach ?? {}; const axes = scoreAxes(score);
  const lake = result.lakeProof ?? {}; const occupancy = result.habitatOccupancy ?? [];
  const habitat = [occupancy[13] ?? 0, occupancy[11] ?? 0, occupancy[12] ?? 0, occupancy[1] ?? 0, occupancy[0] ?? 0];
  const habitatMask = habitat.reduce((mask, value, index) => value > 0 ? mask | (1 << index) : mask, 0);
  const habitatClassCount = habitat.filter((value) => value > 0).length;
  const exposure = result.environmentExposure ?? {};
  const resourceRemainingBp = bp((result.resourceInitial ?? 0) > 0 ? result.resourceFinal / result.resourceInitial : 0);
  let flags = 0; let masteryFlags = 0;
  if (projectProgressionInteger(normalizeProgressionInteger(result.peakEnvironmentLevel, '0'), 1_000_000) >= 1
    && projectProgressionInteger(normalizeProgressionInteger(exposure.pressureTicksQ, '0'), 1_000_000_000) > 0) flags |= 1;
  if ((result.peakCoverage ?? 0) >= .35 && (result.minConnectedWhileMajority ?? 0) >= .8) flags |= 4;
  if ((flags & 4) && morph[1] >= 2 && morph[2] >= 2 && (result.minConnectedWhileMajority ?? 0) >= .95) flags |= 8;
  if (geographyMask === 63 && (result.peakCoverage ?? 0) >= .15) flags |= 32;
  if ((lake.lakeLoopSeconds ?? 0) >= 180 && (lake.distinctLakesReached ?? 0) >= 6) flags |= 64;
  if (((lake.ecologyMask ?? 0) & 15) === 15 && (lake.lakeLivingSeconds ?? 0) >= 180 && (lake.lakeRegionPeak ?? 0) >= 100) flags |= 128;
  const total = normalizeProgressionInteger(score?.total, '0');
  if (atLeast(total, '100000') && axes[1] >= 4500) masteryFlags |= 1;
  if (atLeast(total, '250000') && meetsAxes(axes, [8500, 4200, 3000, 8500, 5000, 6500])) masteryFlags |= 2;
  if (atLeast(total, '500000') && (flags & 1)) masteryFlags |= 4;
  if (atLeast(total, '750000') && habitatClassCount >= 3) masteryFlags |= 8;
  if (atLeast(total, '1000000') && meetsAxes(axes, [9000, 6500, 5000, 9000, 5500, 7500])) masteryFlags |= 16;
  return validateTrophyFacts({ version: 7, scoreModelVersion: score?.modelVersion ?? result.scoreModelVersion,
    survivalSeconds: result.survivalSeconds, peakCoverageBp: bp(result.peakCoverage),
    sustainedCoverageBp: bp(result.sustainedCoverage), geographyMask,
    reach: [reach.gained, factor(reach.positive, 'frontier-expansion'), factor(reach.positive, 'regrowth'),
      factor(reach.positive, 'reconnection-growth'), factor(reach.positive, 'skill-enabled-recovery')],
    morph, scoreAxesBp: axes, flags, masteryFlags, ecologyMask: lake.ecologyMask,
    lakeTypeMask: lake.lakeTypeMask, lakeSalinityMask: lake.lakeSalinityMask,
    lake: [lake.lakeCellsReached, lake.shoreCellsReached, lake.distinctLakesReached, lake.completeShores,
      lake.lakeLivingSeconds, lake.largeLakeLivingSeconds, lake.lakeRegionPeak, lake.lakeLoopSeconds, lake.loopSurplusPeak],
    habitat, habitatMask, habitatClassCount, autonomous: 1, resourceDepletedCells: result.resourceDepletedCells,
    resourceRemainingBp, resourceRecoveredCells: result.resourceRecoveredCells,
    freshwaterSupportedSeconds: result.freshwaterSupportedCellSeconds, transformedCells: result.transformedCells,
    electrifiedCells: result.electrifiedCells, glacialLakeCells: result.glacialLakeCells,
    maritimeForestCells: result.maritimeForestCells, reach100: result.reach100?.achieved ? 1 : 0,
    worldOrdinal: projectProgressionInteger(normalizeProgressionInteger(result.worldOrdinal, '1'), 1_000_000),
    environmentPeakLevel: projectProgressionInteger(normalizeProgressionInteger(result.peakEnvironmentLevel, '0'), 1_000_000),
    environmentTimeAtPeakTicks: projectProgressionInteger(normalizeProgressionInteger(exposure.timeAtPeakTicks, '0'), 1_000_000),
    environmentPressureTicksQ: projectProgressionInteger(normalizeProgressionInteger(exposure.pressureTicksQ, '0'), 1_000_000_000),
    scarcityCause: ['resource-exhaustion', 'maintenance-starvation'].includes(result.cause) ? 1 : 0 });
}

export function validateTrophyFacts(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const array = (value, length, max = 1_000_000) => Object.freeze(Array.from({ length }, (_, index) => integer(value?.[index], max)));
  return Object.freeze({ version: 7, scoreModelVersion: integer(raw.scoreModelVersion, 16),
    survivalSeconds: integer(raw.survivalSeconds, 100_000),
    peakCoverageBp: integer(raw.peakCoverageBp, 10_000), sustainedCoverageBp: integer(raw.sustainedCoverageBp, 10_000),
    geographyMask: integer(raw.geographyMask, 63) & 63,
    reach: array(raw.reach, 5), morph: array(raw.morph, 3, 80), scoreAxesBp: array(raw.scoreAxesBp, 6, 10_000),
    flags: integer(raw.flags, 255), masteryFlags: integer(raw.masteryFlags, 31), ecologyMask: integer(raw.ecologyMask, 15),
    lakeTypeMask: integer(raw.lakeTypeMask, 31), lakeSalinityMask: integer(raw.lakeSalinityMask, 7), lake: array(raw.lake, 9, 100_000),
    habitat: array(raw.habitat, 5, 2562), habitatMask: integer(raw.habitatMask, 31), habitatClassCount: integer(raw.habitatClassCount, 5), autonomous: integer(raw.autonomous, 1),
    resourceDepletedCells: integer(raw.resourceDepletedCells, 2562), resourceRemainingBp: integer(raw.resourceRemainingBp, 10_000),
    resourceRecoveredCells: integer(raw.resourceRecoveredCells, 2562), freshwaterSupportedSeconds: integer(raw.freshwaterSupportedSeconds, 10_000_000),
    transformedCells: integer(raw.transformedCells, 2562), electrifiedCells: integer(raw.electrifiedCells, 2562),
    glacialLakeCells: integer(raw.glacialLakeCells, 2562), maritimeForestCells: integer(raw.maritimeForestCells, 2562),
    reach100: integer(raw.reach100, 1), worldOrdinal: integer(raw.worldOrdinal, 1_000_000),
    environmentPeakLevel: integer(raw.environmentPeakLevel, 1_000_000),
    environmentTimeAtPeakTicks: integer(raw.environmentTimeAtPeakTicks, 1_000_000),
    environmentPressureTicksQ: integer(raw.environmentPressureTicksQ, 1_000_000_000), scarcityCause: integer(raw.scarcityCause, 1) });
}
function morphology(records) { return ['morph.loop.first', 'morph.component.split', 'morph.component.reconnected'].map((key) => records.filter((record) => recordKey(record) === key).length); }
function recordMask(records, map) { let mask = 0; for (const record of records) mask |= map[recordKey(record)] ?? 0; return mask; }
function recordKey(record) { if (record.key) return record.key; const type = record.type;
  return type === 'network-loop' ? 'morph.loop.first' : type === 'component-split' ? 'morph.component.split'
    : type === 'component-reconnected' ? 'morph.component.reconnected'
      : type?.startsWith('geo-') ? `geo.${type.slice(4).replaceAll('-', '_')}.reached` : type === 'coverage' ? 'geo.coverage.milestone' : ''; }
function factor(entries, id) { return entries?.find((entry) => entry.id === id)?.count ?? 0; }
function atLeast(value, threshold) { return compareProgressionIntegers(value, threshold) >= 0; }
function meetsAxes(values, thresholds) { return thresholds.every((threshold, index) => values[index] >= threshold); }
function scoreAxes(score) { const by = new Map((score?.breakdown ?? []).map((part) => [part.key, bp(part.q)]));
  return ['survival', 'exploration', 'presence', 'coherence', 'stewardship', 'worldmaking'].map((key) => by.get(key) ?? 0); }
function bp(value) { return Math.max(0, Math.min(10_000, Math.round((Number.isFinite(value) ? value : 0) * 10_000))); }
function integer(value, max) { return Math.max(0, Math.min(max, Number.isFinite(value) ? Math.floor(value) : 0)); }
