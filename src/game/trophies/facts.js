/** Compact deterministic Trophy proof retained with completed semantic History. */
const GEO = Object.freeze({ 'geo.coast.reached': 1, 'geo.lake.reached': 2, 'geo.forest.reached': 4,
  'geo.mountain.reached': 8, 'geo.wetland.reached': 16, 'geo.world_knot.reached': 32 });
const CRISIS = Object.freeze({ drought: 1, heat: 2, freeze: 4, 'toxic-rain': 8, 'solar-flare': 16, ash: 32, blight: 64 });

export function buildTrophyFacts(result, score) {
  const events = Array.isArray(result.history) ? result.history : []; const morph = morphology(events);
  const geographyMask = eventMask(events, GEO); const crisisMask = crisisEventMask(events);
  const reach = result.reach ?? {}; const axes = scoreAxes(score); const lake = result.lakeProof ?? {};
  const occupancy = result.habitatOccupancy ?? []; const habitat = [occupancy[13] ?? 0, occupancy[11] ?? 0,
    occupancy[12] ?? 0, occupancy[1] ?? 0, occupancy[0] ?? 0];
  const habitatMask = habitat.reduce((mask, value, index) => value > 0 ? mask | (1 << index) : mask, 0);
  const habitatClassCount = habitat.filter((value) => value > 0).length;
  let flags = 0; let masteryFlags = 0;
  if ((result.crisesTotal ?? 0) > 0 && result.crisesEndured === result.crisesTotal) flags |= 1;
  if ((result.peakCoverage ?? 0) >= .35 && (result.minConnectedWhileMajority ?? 0) >= .8) flags |= 4;
  if ((flags & 4) && morph[1] >= 2 && morph[2] >= 2 && (result.minConnectedWhileMajority ?? 0) >= .95) flags |= 8;
  if (geographyMask === 63 && (result.peakCoverage ?? 0) >= .15) flags |= 32;
  if ((lake.lakeLoopSeconds ?? 0) >= 180 && (lake.distinctLakesReached ?? 0) >= 6) flags |= 64;
  if (((lake.ecologyMask ?? 0) & 15) === 15 && (lake.lakeLivingSeconds ?? 0) >= 180 && (lake.lakeRegionPeak ?? 0) >= 100) flags |= 128;
  const total = score?.total ?? 0;
  if (total >= 100000 && axes[1] >= 4500) masteryFlags |= 1;
  if (total >= 250000 && meetsAxes(axes, [8500,4200,3000,8500,5000,6500])) masteryFlags |= 2;
  if (total >= 500000 && (flags & 1)) masteryFlags |= 4;
  if (total >= 750000 && habitatClassCount >= 3) masteryFlags |= 8;
  if (total >= 1000000 && meetsAxes(axes, [9000,6500,5000,9000,5500,7500])) masteryFlags |= 16;
  return validateTrophyFacts({ version: 4, survivalSeconds: result.survivalSeconds, peakCoverageBp: bp(result.peakCoverage),
    sustainedCoverageBp: bp(result.sustainedCoverage), geographyMask, crisisMask,
    crisesEndured: result.crisesEndured, crisesTotal: result.crisesTotal,
    reach: [reach.gained, factor(reach.positive, 'frontier-expansion'), factor(reach.positive, 'regrowth'),
      factor(reach.positive, 'reconnection-growth'), factor(reach.positive, 'skill-enabled-recovery')],
    morph, scoreAxesBp: axes, flags, masteryFlags, ecologyMask: lake.ecologyMask,
    lakeTypeMask: lake.lakeTypeMask, lakeSalinityMask: lake.lakeSalinityMask,
    lake: [lake.lakeCellsReached, lake.shoreCellsReached, lake.distinctLakesReached, lake.completeShores,
      lake.lakeLivingSeconds, lake.largeLakeLivingSeconds, lake.lakeRegionPeak, lake.droughtLakeSurvivals,
      lake.freezeLakeSurvivals, lake.lakeLoopSeconds, lake.loopSurplusPeak],
    habitat, habitatMask, habitatClassCount, autonomous:1, resourceDepletedCells: result.resourceDepletedCells,
    resourceRemainingBp: bp((result.resourceInitial ?? 0) > 0 ? result.resourceFinal / result.resourceInitial : 0),
    worldOrdinal: result.worldOrdinal, eventCount: result.crisesTotal,
    scarcityCause: ['resource-exhaustion', 'maintenance-starvation'].includes(result.cause) ? 1 : 0 });
}

/** Old worlds remain readable; retired choice evidence never satisfies current criteria. */
export function deriveLegacyTrophyFacts(world) {
  const events = Array.isArray(world?.events) ? world.events : [];
  return validateTrophyFacts({ version: 4, survivalSeconds: (world?.tick ?? 0) / 10,
    peakCoverageBp: events.some((event) => event.key === 'geo.coverage.milestone') ? 1000 : 0,
    geographyMask: eventMask(events, GEO), crisisMask: crisisEventMask(events), crisesEndured: crisisCount(events),
    reach: [], morph: morphology(events), scoreAxesBp: [], flags: 0, masteryFlags:0, ecologyMask: 0,
    lakeTypeMask: 0, lakeSalinityMask: 0, lake: [], habitat: [], habitatMask:0, habitatClassCount: 0, autonomous:0,
    resourceDepletedCells: 0, resourceRemainingBp: 0, worldOrdinal: world?.worldOrdinal ?? 1,
    eventCount: crisisCount(events), scarcityCause: 0 });
}

export function validateTrophyFacts(raw) {
  if (!raw || typeof raw !== 'object') return null; const sourceVersion = integer(raw.version, 4);
  const array = (value, length, max = 1_000_000) => Object.freeze(Array.from({ length }, (_, index) => integer(value?.[index], max)));
  return Object.freeze({ version: 4, survivalSeconds: integer(raw.survivalSeconds, 100_000),
    peakCoverageBp: integer(raw.peakCoverageBp, 10_000), sustainedCoverageBp: integer(raw.sustainedCoverageBp, 10_000),
    geographyMask: integer(raw.geographyMask, 63) & (sourceVersion === 1 ? 61 : 63), crisisMask: integer(raw.crisisMask, 127),
    crisesEndured: integer(raw.crisesEndured, 64), crisesTotal: integer(raw.crisesTotal, 64),
    reach: array(raw.reach, 5), morph: array(raw.morph, 3, 80), scoreAxesBp: array(raw.scoreAxesBp, 6, 10_000),
    flags: integer(raw.flags, 255), masteryFlags:integer(raw.masteryFlags,31), ecologyMask: integer(raw.ecologyMask, 15),
    lakeTypeMask: integer(raw.lakeTypeMask, 31), lakeSalinityMask: integer(raw.lakeSalinityMask, 7), lake: array(raw.lake, 11, 100_000),
    habitat: array(raw.habitat, 5, 2562), habitatMask:integer(raw.habitatMask,31), habitatClassCount: integer(raw.habitatClassCount, 5), autonomous:integer(raw.autonomous,1),
    resourceDepletedCells: integer(raw.resourceDepletedCells, 2562), resourceRemainingBp: integer(raw.resourceRemainingBp, 10_000),
    worldOrdinal: integer(raw.worldOrdinal, 1_000_000), eventCount: integer(raw.eventCount, 64), scarcityCause: integer(raw.scarcityCause, 1) });
}
function morphology(events) { return ['morph.loop.first', 'morph.component.split', 'morph.component.reconnected'].map((key) => events.filter((event) => eventKey(event) === key).length); }
function eventMask(events, map) { let mask = 0; for (const event of events) mask |= map[eventKey(event)] ?? 0; return mask; }
function crisisEventMask(events) { let mask = 0; for (const event of events) if (eventKey(event) === 'crisis.ended') mask |= CRISIS[event.subjectId ?? event.family] ?? 0; return mask; }
function crisisCount(events) { return events.filter((event) => eventKey(event) === 'crisis.ended').length; }
function eventKey(event) { if (event.key) return event.key; const type = event.type;
  return type === 'network-loop' ? 'morph.loop.first' : type === 'component-split' ? 'morph.component.split'
    : type === 'component-reconnected' ? 'morph.component.reconnected' : type === 'event-end' ? 'crisis.ended'
      : type?.startsWith('geo-') ? `geo.${type.slice(4).replaceAll('-', '_')}.reached` : type === 'coverage' ? 'geo.coverage.milestone' : ''; }
function factor(entries, id) { return entries?.find((entry) => entry.id === id)?.count ?? 0; }
function meetsAxes(values,thresholds){return thresholds.every((threshold,index)=>values[index]>=threshold)}
function scoreAxes(score) { const by = new Map((score?.breakdown ?? []).map((part) => [part.key, bp(part.q)]));
  return ['survival', 'peakCoverage', 'sustainedCoverage', 'connectivity', 'efficiency', 'stability'].map((key) => by.get(key) ?? 0); }
function bp(value) { return Math.max(0, Math.min(10_000, Math.round((Number.isFinite(value) ? value : 0) * 10_000))); }
function integer(value, max) { return Math.max(0, Math.min(max, Number.isFinite(value) ? Math.floor(value) : 0)); }
