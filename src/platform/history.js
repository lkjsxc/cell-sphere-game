/** Bounded semantic History schema 10 with realized SCORE and Luminous evidence. */
import { buildTrophyFacts, validateTrophyFacts } from '../game/trophies/facts.js';
import { loadNamespacedDocument, saveNamespacedDocument } from './namespace-store.js';
import { ENVIRONMENT_MODEL_VERSION, normalizeEnvironmentLevel } from '../game/environment-level.js';
import { ENVIRONMENT_EXPOSURE_VERSION } from '../game/environment-exposure.js';
import { challengeDimensions, ENVIRONMENT_PROFILE_VERSION } from '../simulation/challenge-profile.js';
import { addProgressionIntegers, compareProgressionIntegers, incrementProgressionInteger,
  normalizeProgressionInteger } from '../core/progression-integer.js';
const MAX_BYTES = 700_000;
/** Fixed semantic-world ceiling; byte trimming adapts the actual retained count. */
const HISTORY_WORLD_RETENTION = 24;
const MAX_EVENTS = 80;
const MAX_MEMORY_EVENTS = 128;
const MAX_TROPHY_EVENTS = 128;
const CELL_COUNT = 2562;

export function defaultHistory() { return { schema: 10, worlds: [], evolution: [], trophies: [] }; }
function finiteInt(value, min = 0) { return Number.isFinite(value) && value >= min ? Math.floor(value) : null; }

const SIM_EVENT = Object.freeze({
  'run-created': ['world', 'run.world.created'], inoculation: ['world', 'run.inoculation.selected'],
  'run-start': ['life', 'run.germination'], 'network-loop': ['life', 'morph.loop.first'], 'component-split': ['life', 'morph.component.split'],
  'component-reconnected': ['life', 'morph.component.reconnected'],
  'run-extinct': ['life', 'run.extinct'],
  'run-abandoned': ['life', 'run.abandoned'], 'environment-transition': ['environment', 'environment.level.transition'],
  'resource-reserve': ['resource', 'resource.reserve.threshold'],
  'resource-recovered': ['resource', 'resource.cell.recovered'], 'glacial-lake': ['world', 'world.glacial_lake.formed'],
  'wetland-succession': ['world', 'world.wetland_succession.formed'], 'maritime-forest': ['world', 'world.maritime_forest.formed'],
  'powered-cell': ['life', 'life.cell.powered'], 'reach-100': ['world', 'world.reach_100.sustained'],
  coverage: ['world', 'geo.coverage.milestone'], phase: ['life', 'run.phase.abundance'],
  'geo-coast': ['world', 'geo.coast.reached'], 'geo-lake': ['world', 'geo.lake.reached'],
  'geo-forest': ['world', 'geo.forest.reached'], 'geo-mountain': ['world', 'geo.mountain.reached'],
  'geo-wetland': ['world', 'geo.wetland.reached'], 'geo-world-knot': ['world', 'geo.world_knot.reached'],
});

function primaryCells(raw) {
  const candidates = Array.isArray(raw.primaryCells) ? raw.primaryCells : [raw.cellId ?? raw.cell];
  const unique = [];
  for (const cell of candidates) {
    if (Number.isInteger(cell) && cell >= 0 && cell < CELL_COUNT && !unique.includes(cell)) unique.push(cell);
    if (unique.length === 8) break;
  }
  return unique;
}

function validateEvent(raw, index) {
  if (!raw || typeof raw !== 'object') return null;
  const tick = finiteInt(raw.tick); const mapped = SIM_EVENT[raw.type]; const kindValue = raw.kind ?? mapped?.[0];
  if (tick === null || typeof kindValue !== 'string' || !/^[a-z-]{2,32}$/.test(kindValue)) return null;
  let mappedKey = mapped?.[1];
  if (raw.type === 'phase' && typeof raw.id === 'string') mappedKey = `run.phase.${raw.id}`;
  const key = typeof raw.key === 'string' && /^[a-z]+(?:[.-][a-z_]+)+$/.test(raw.key) ? raw.key : mappedKey;
  if (!key) return null;
  const cells = primaryCells(raw); const event = { seq: finiteInt(raw.seq) ?? index, tick, kind: kindValue,
    importance: Math.max(0, Math.min(3, finiteInt(raw.importance) ?? 1)), key, primaryCells: cells };
  if (cells.length) event.cellId = cells[0];
  if (Number.isInteger(raw.regionId) && raw.regionId >= -1 && raw.regionId < 512) event.regionId = raw.regionId;
  const subject = raw.subjectId ?? raw.family ?? (raw.type !== 'phase' && typeof raw.id === 'string' ? raw.id : null);
  if (typeof subject === 'string' && /^[a-z0-9-]{1,48}$/.test(subject)) event.subjectId = subject;
  if (Number.isFinite(raw.valueA ?? raw.value)) event.valueA = raw.valueA ?? raw.value;
  if (Number.isFinite(raw.valueB ?? raw.cells)) event.valueB = raw.valueB ?? raw.cells;
  return event;
}

function validateWorld(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const seed = finiteInt(raw.seed); const tick = finiteInt(raw.tick);
  if (seed === null || seed >= 0x100000000 || tick === null) return null;
  const events = Array.isArray(raw.events) ? raw.events.slice(0, MAX_EVENTS).map(validateEvent).filter(Boolean)
    .sort((a, b) => a.seq - b.seq || a.tick - b.tick) : [];
  const world = { id: typeof raw.id === 'string' ? raw.id.slice(0, 64) : `${seed}-${tick}`, seed, tick,
    score: normalizeProgressionInteger(raw.score, '0'),
    rank: typeof raw.rank === 'string' ? raw.rank.slice(0, 64) : 'Seed',
    cause: typeof raw.cause === 'string' ? raw.cause.slice(0, 32) : 'unknown',
    archetype: typeof raw.archetype === 'string' ? raw.archetype.slice(0, 40) : 'Living World',
    echo: normalizeProgressionInteger(raw.echo, '0'), hash: typeof raw.hash === 'string' ? raw.hash.slice(0, 16) : '',
    scoreModelVersion: finiteInt(raw.scoreModelVersion) ?? 1,
    worldOrdinal: normalizeProgressionInteger(raw.worldOrdinal, '1'),
    resourceInitial: Number.isFinite(raw.resourceInitial) ? Math.max(0, raw.resourceInitial) : 0,
    resourceFinal: Number.isFinite(raw.resourceFinal) ? Math.max(0, raw.resourceFinal) : 0,
    resourceRecoveredCells: finiteInt(raw.resourceRecoveredCells) ?? 0,
    freshwaterSupportedCellSeconds: finiteInt(raw.freshwaterSupportedCellSeconds) ?? 0,
    transformedCells: finiteInt(raw.transformedCells) ?? 0, electrifiedCells: finiteInt(raw.electrifiedCells) ?? 0,
    finalElectrifiedCells: finiteInt(raw.finalElectrifiedCells) ?? 0,
    everPoweredCells: finiteInt(raw.everPoweredCells) ?? 0,
    poweredCellSeconds: finiteInt(raw.poweredCellSeconds) ?? 0,
    luminousDevelopment: Number.isFinite(raw.luminousDevelopment) ? Math.max(0, Math.min(1, raw.luminousDevelopment)) : 0,
    luminousEnabled: raw.luminousEnabled === true,
    reach100: raw.reach100 === true, inoculationCell: Number.isInteger(raw.inoculationCell) ? raw.inoculationCell : null, events };
  if (raw.environmentModelVersion !== ENVIRONMENT_MODEL_VERSION || raw.startEnvironmentLevel !== '0') return null;
  world.environmentModelVersion = ENVIRONMENT_MODEL_VERSION;
  world.environmentScheduleVersion = finiteInt(raw.environmentScheduleVersion) ?? 0;
  world.environmentScheduleHash = validHash(raw.environmentScheduleHash);
  world.environmentProfileVersion = finiteInt(raw.environmentProfileVersion) ?? 0;
  world.resultSchemaVersion = finiteInt(raw.resultSchemaVersion) ?? 0;
  world.startEnvironmentLevel = '0';
  world.finalEnvironmentLevel = normalizeEnvironmentLevel(raw.finalEnvironmentLevel, '0');
  world.peakEnvironmentLevel = normalizeEnvironmentLevel(raw.peakEnvironmentLevel, world.finalEnvironmentLevel);
  if (compareProgressionIntegers(world.peakEnvironmentLevel, world.finalEnvironmentLevel) < 0) world.peakEnvironmentLevel = world.finalEnvironmentLevel;
  world.environmentTransitionCount = normalizeProgressionInteger(raw.environmentTransitionCount, '0');
  world.environmentExposure = validateEnvironmentExposure(raw.environmentExposure);
  world.timeAtPeakTicks = normalizeProgressionInteger(raw.timeAtPeakTicks, world.environmentExposure.timeAtPeakTicks);
  world.recentEnvironmentTransitions = validateRecentTransitions(raw.recentEnvironmentTransitions);
  world.currentEnvironmentProfileHash = validHash(raw.currentEnvironmentProfileHash);
  world.environmentPressureSummary = validatePressureSummary(raw.environmentPressureSummary, world.environmentProfileVersion);
  if (typeof raw.resultTransactionKey === 'string' && raw.resultTransactionKey.length <= 128) world.resultTransactionKey = raw.resultTransactionKey;
  const trophyFacts = validateTrophyFacts(raw.trophyFacts); if (trophyFacts) world.trophyFacts = trophyFacts; return world;
}
function validHash(value) { return typeof value === 'string' && /^[0-9a-f]{8}$/.test(value) ? value : ''; }
function validateEnvironmentExposure(raw) {
  if (!raw || typeof raw !== 'object' || raw.version !== ENVIRONMENT_EXPOSURE_VERSION) {
    return Object.freeze({ version: ENVIRONMENT_EXPOSURE_VERSION, totalTicks: '0', pressureTicksQ: '0',
      qualityPressureTicksQ: '0', timeAtPeakTicks: '0', peakPressureQ: 0, currentLevel: '0' });
  }
  return Object.freeze({ version: ENVIRONMENT_EXPOSURE_VERSION,
    totalTicks: normalizeProgressionInteger(raw.totalTicks, '0'),
    pressureTicksQ: normalizeProgressionInteger(raw.pressureTicksQ, '0'),
    qualityPressureTicksQ: normalizeProgressionInteger(raw.qualityPressureTicksQ, '0'),
    timeAtPeakTicks: normalizeProgressionInteger(raw.timeAtPeakTicks, '0'),
    peakPressureQ: Math.max(0, Math.min(1_000_000, finiteInt(raw.peakPressureQ) ?? 0)),
    currentLevel: normalizeEnvironmentLevel(raw.currentLevel, '0') });
}
function validateRecentTransitions(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.slice(-8).map((entry) => {
    if (!entry || typeof entry !== 'object') return null;
    const tick = normalizeProgressionInteger(entry.tick, '0');
    const level = normalizeEnvironmentLevel(entry.level, '0');
    const profileHash = validHash(entry.profileHash);
    const pressure = Number.isFinite(entry.pressure) ? Math.max(0, Math.min(1, entry.pressure)) : 0;
    return { tick, level, profileHash, pressure };
  }).filter(Boolean);
}
function validatePressureSummary(raw, worldProfileVersion = 0) {
  if (!raw || typeof raw !== 'object') return Object.freeze({ level: '0', nextLevel: '0',
    profileVersion: worldProfileVersion, nextProfileVersion: 0, profileHash: '', nextProfileHash: '', interpolationQ: 0,
    effectiveCoefficients: Object.freeze({}), pressure: 0, severityQ: 0,
    detailAvailable: false, dimensions: Object.freeze({}) });
  const coefficientKeys = ['resourceYieldScale', 'renewalScale', 'seasonScale', 'dryingScale', 'heatDriftScale', 'toxinScale',
    'maintenanceScale', 'transportStressScale', 'recoveryScale', 'attritionScale'];
  const coefficients = Object.fromEntries(coefficientKeys.flatMap((key) => Number.isFinite(raw.effectiveCoefficients?.[key])
    ? [[key, Math.max(-1_000_000, Math.min(1_000_000, raw.effectiveCoefficients[key]))]] : []));
  const definitions = challengeDimensions();
  const detailAvailable = worldProfileVersion === ENVIRONMENT_PROFILE_VERSION
    && raw.profileVersion === ENVIRONMENT_PROFILE_VERSION
    && raw.nextProfileVersion === ENVIRONMENT_PROFILE_VERSION
    && Object.keys(definitions).every((key) => Number.isFinite(raw.dimensions?.[key]?.pressure));
  const dimensions = detailAvailable ? Object.freeze(Object.fromEntries(Object.entries(definitions).map(([key, definition]) => [key,
    Object.freeze({ label: definition.label,
      pressure: Math.max(0, Math.min(1, raw.dimensions[key].pressure)) })]))) : Object.freeze({});
  return Object.freeze({ level: normalizeEnvironmentLevel(raw.level, '0'), nextLevel: normalizeEnvironmentLevel(raw.nextLevel, '0'),
    profileVersion: worldProfileVersion, nextProfileVersion: detailAvailable ? ENVIRONMENT_PROFILE_VERSION : 0,
    profileHash: validHash(raw.profileHash), nextProfileHash: validHash(raw.nextProfileHash),
    interpolationQ: Math.max(0, Math.min(1_000_000, finiteInt(raw.interpolationQ) ?? 0)),
    effectiveCoefficients: Object.freeze(coefficients),
    pressure: Number.isFinite(raw.pressure) ? Math.max(0, Math.min(1, raw.pressure)) : 0,
    severityQ: Math.max(0, Math.min(1_000_000, finiteInt(raw.severityQ) ?? 0)), detailAvailable, dimensions });
}

export function validateHistory(raw) {
  const out = defaultHistory(); if (!raw || typeof raw !== 'object' || raw.schema !== out.schema) return out;
  if(Array.isArray(raw.worlds))out.worlds=raw.worlds.slice(-HISTORY_WORLD_RETENTION*2).map(validateWorld).filter(Boolean).slice(-HISTORY_WORLD_RETENTION);
  const evolution=Array.isArray(raw.evolution) ? raw.evolution : [];
  out.evolution=evolution.slice(-MAX_MEMORY_EVENTS*2).map(validateEvolutionEvent).filter(Boolean).slice(-MAX_MEMORY_EVENTS);
  if(Array.isArray(raw.trophies))out.trophies=raw.trophies.slice(-MAX_TROPHY_EVENTS*2).map(validateTrophyEvent).filter(Boolean).slice(-MAX_TROPHY_EVENTS);
  return trimValidatedHistory(out).value;
}

export function loadHistory() {
  return loadNamespacedDocument('history', validateHistory, defaultHistory);
}
export function saveHistory(history) {
  try {
    const { value, bytes } = boundHistoryDocument(history);
    if (bytes > MAX_BYTES) return false;
    return saveNamespacedDocument('history', value, validateHistory);
  } catch { return false; }
}
export function normalizeHistoryEvents(events) { return (Array.isArray(events) ? events : []).slice(0, MAX_EVENTS).map(validateEvent).filter(Boolean); }
export function appendWorld(history,result,score,runIndex){
  const source=validateHistory(history),key=result.resultTransactionKey;
  if(key&&source.worlds.some((entry)=>entry.resultTransactionKey===key))return source;
  const events=normalizeHistoryEvents(result.history);const record=validateWorld({id:`world-${result.seed}-${result.hash}-${result.tick}`,
    seed: result.seed, tick: result.tick, score: score.total, rank: score.rank.en, cause: result.cause, echo: score.echoes,
    hash: result.hash, archetype: result.archetype, inoculationCell: result.inoculationCell,
    scoreModelVersion: score.modelVersion, worldOrdinal: result.worldOrdinal,
    environmentModelVersion: result.environmentModelVersion, environmentScheduleVersion: result.environmentScheduleVersion,
    environmentScheduleHash: result.environmentScheduleHash, environmentProfileVersion: result.environmentProfileVersion,
    resultSchemaVersion: result.resultSchemaVersion,
    startEnvironmentLevel: result.startEnvironmentLevel, finalEnvironmentLevel: result.finalEnvironmentLevel,
    peakEnvironmentLevel: result.peakEnvironmentLevel, environmentTransitionCount: result.environmentTransitionCount,
    timeAtPeakTicks: result.timeAtPeakTicks, environmentExposure: result.environmentExposure,
    recentEnvironmentTransitions: result.recentEnvironmentTransitions,
    currentEnvironmentProfileHash: result.currentEnvironmentProfileHash,
    environmentPressureSummary: result.environmentPressureSummary, resultTransactionKey: result.resultTransactionKey,
    resourceInitial: result.resourceInitial, resourceFinal: result.resourceFinal,
    resourceRecoveredCells: result.resourceRecoveredCells,
    freshwaterSupportedCellSeconds: result.freshwaterSupportedCellSeconds,
    transformedCells: result.transformedCells, electrifiedCells: result.electrifiedCells,
    finalElectrifiedCells: result.finalElectrifiedCells, everPoweredCells: result.everPoweredCells,
    poweredCellSeconds: result.poweredCellSeconds, luminousDevelopment: result.luminousDevelopment,
    luminousEnabled: result.luminousEnabled === true,
    reach100: result.reach100?.achieved === true,
    trophyFacts:result.trophyFacts??buildTrophyFacts(result,score),events});
  return validateHistory({...source,worlds:[...source.worlds,record]});
}
export function appendAbandonedWorld(history,result){
  const source=validateHistory(history),id=`abandoned-${result.runId}-${result.seed}-${result.tick}`;
  if(source.worlds.some((entry)=>entry.id===id))return source;
  const record=validateWorld({id,
    seed: result.seed, tick: result.tick, score: result.score, rank: 'Abandoned', cause: 'abandoned',
    echo: 0, hash: '', archetype: result.archetype, inoculationCell: result.inoculationCell,
    scoreModelVersion: result.scoreModelVersion, worldOrdinal: result.worldOrdinal,
    environmentModelVersion: result.environmentModelVersion, environmentScheduleVersion: result.environmentScheduleVersion,
    environmentScheduleHash: result.environmentScheduleHash, environmentProfileVersion: result.environmentProfileVersion,
    resultSchemaVersion: result.resultSchemaVersion,
    startEnvironmentLevel: result.startEnvironmentLevel ?? '0', finalEnvironmentLevel: result.finalEnvironmentLevel ?? '0',
    peakEnvironmentLevel: result.peakEnvironmentLevel ?? '0', environmentTransitionCount: result.environmentTransitionCount ?? '0',
    environmentExposure: result.environmentExposure, currentEnvironmentProfileHash: result.currentEnvironmentProfileHash,
    events:normalizeHistoryEvents(result.history)});
  return validateHistory({...source,worlds:[...source.worlds,record]});
}
export function appendEvolutionEvent(history,evidence){
  const source=validateHistory(history);
  if(evidence?.transactionKey&&source.evolution.some((entry)=>entry.transactionKey===evidence.transactionKey))return source;
  const event=validateEvolutionEvent({...evidence,seq:source.evolution.length},source.evolution.length);
  if(!event)return source;
  return validateHistory({ ...source, evolution: [...source.evolution, event] });
}
export function appendTrophyEvents(history, ids, worldId = history.worlds.at(-1)?.id) {
  if (!ids?.length) return history; const source = validateHistory(history); const world = source.worlds.find((entry) => entry.id === worldId);
  const known = new Set(source.trophies.map((event) => event.subjectId)); const added = ids.filter((id) => !known.has(id)).map((id, index) => ({
    seq: source.trophies.length + index, tick: world?.tick ?? 0, kind: 'trophy', importance: 3, key: 'trophy.earned',
    subjectId:id, primaryCells:[], worldId:world?.id??null,
    run:world?.worldOrdinal??String(source.worlds.length) }));
  if (!added.length) return source; const worlds = source.worlds.map((entry) => {
    if (entry.id !== worldId) return entry; let seq = entry.events.reduce((max, event) => Math.max(max, event.seq), -1) + 1;
    return { ...entry, events: [...entry.events, ...added.map((event) => ({ ...event, seq: seq++ }))].slice(-MAX_EVENTS) };
  }); return validateHistory({ ...source, worlds, trophies: [...source.trophies, ...added] });
}
function validateEvolutionEvent(raw, index) {
  if (!raw || typeof raw !== 'object' || typeof raw.nodeId !== 'string'
    || !/^[a-z][a-z-]{1,63}$/.test(raw.nodeId)) return null;
  const oldLevel = normalizeProgressionInteger(raw.oldLevel, '0');
  const newLevel=normalizeProgressionInteger(raw.newLevel,safeIncrement(oldLevel));
  const cost = normalizeProgressionInteger(raw.cost, '0');
  const balanceAfter = normalizeProgressionInteger(raw.balanceAfter ?? raw.balance, '0');
  const balanceBefore=normalizeProgressionInteger(raw.balanceBefore,safeAdd(balanceAfter,cost));
  const event = { seq: finiteInt(raw.seq) ?? index, kind: 'evolution-level', nodeId: raw.nodeId,
    oldLevel, newLevel, cost, balanceBefore, balanceAfter,
    run: normalizeProgressionInteger(raw.run, '0'),
    bestEnvironmentLevelReached: normalizeEnvironmentLevel(raw.bestEnvironmentLevelReached, '0') };
  if (typeof raw.transactionKey === 'string' && raw.transactionKey.length > 0 && raw.transactionKey.length <= 128)
    event.transactionKey = raw.transactionKey;
  if (raw.compilerVersions && typeof raw.compilerVersions === 'object') event.compilerVersions = Object.freeze(
    Object.fromEntries(Object.entries(raw.compilerVersions).filter(([, value]) => Number.isInteger(value) && value >= 0 && value <= 64)));
  return event;
}
function safeIncrement(value){try{return incrementProgressionInteger(value)}catch{return value}}
function safeAdd(left,right){try{return addProgressionIntegers(left,right)}catch{return left}}
function validateTrophyEvent(raw, index) { if (!raw || typeof raw !== 'object' || raw.key !== 'trophy.earned'
    || typeof raw.subjectId !== 'string' || !/^[a-z][a-z-]{2,63}$/.test(raw.subjectId)) return null;
  return { seq: finiteInt(raw.seq) ?? index, tick: finiteInt(raw.tick) ?? 0, kind: 'trophy', importance: 3,
    key:'trophy.earned', subjectId:raw.subjectId, primaryCells:[], worldId:typeof raw.worldId==='string'?raw.worldId.slice(0,48):null,
    run:normalizeProgressionInteger(raw.run, '0') };
}
export function clearHistory() { return defaultHistory(); }
export function serializeHistory(history) { return boundHistoryDocument(history, 2).text; }
export function parseHistory(text) { return validateHistory(JSON.parse(text)); }
function boundHistoryDocument(history, space = 0) {
  return trimValidatedHistory(validateHistory(history), space);
}
function trimValidatedHistory(value, space = 0) {
  let text=JSON.stringify(value,null,space),bytes=documentBytes(text);
  while (bytes > MAX_BYTES && (value.worlds.length || value.evolution.length || value.trophies.length)) {
    const candidates=[value.worlds,value.evolution,value.trophies].filter((entries)=>entries.length)
      .map((entries)=>({entries,bytes:documentBytes(JSON.stringify(entries))})).sort((left,right)=>right.bytes-left.bytes);
    candidates[0].entries.shift(); text = JSON.stringify(value, null, space); bytes = documentBytes(text);
  }
  return { value, text, bytes };
}
function documentBytes(text) { return typeof TextEncoder === 'function' ? new TextEncoder().encode(text).byteLength : text.length; }
