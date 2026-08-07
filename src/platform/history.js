/** Bounded semantic History schema 8 with dynamic Environment interpolation evidence. */
import { buildTrophyFacts, validateTrophyFacts } from '../game/trophies/facts.js';
import { loadNamespacedDocument, saveNamespacedDocument } from './namespace-store.js';
import { ENVIRONMENT_MODEL_VERSION, normalizeEnvironmentLevel } from '../game/environment-level.js';
import { ENVIRONMENT_EXPOSURE_VERSION } from '../game/environment-exposure.js';
import { addProgressionIntegers, compareProgressionIntegers, incrementProgressionInteger,
  normalizeProgressionInteger } from '../core/progression-integer.js';
const MAX_BYTES = 700_000;
const MAX_EVENTS = 80;
const MAX_MEMORY_EVENTS = 128;
const MAX_TROPHY_EVENTS = 128;
const CELL_COUNT = 2562;

export function defaultHistory() { return { schema: 8, worlds: [], evolution: [], trophies: [] }; }
function finiteInt(value, min = 0) { return Number.isFinite(value) && value >= min ? Math.floor(value) : null; }

const SIM_EVENT = Object.freeze({
  'run-created': ['world', 'run.world.created'], inoculation: ['world', 'run.inoculation.selected'],
  'run-start': ['life', 'run.germination'], 'event-telegraph': ['crisis', 'crisis.telegraphed'],
  'event-start': ['crisis', 'crisis.started'], 'event-end': ['crisis', 'crisis.ended'],
  'network-loop': ['life', 'morph.loop.first'], 'component-split': ['life', 'morph.component.split'],
  'component-reconnected': ['life', 'morph.component.reconnected'],
  'adaptation-offered': ['adaptation', 'adaptation.offered'],
  'adaptation-selected': ['adaptation', 'adaptation.selected.manual'],
  'adaptation-unresolved': ['adaptation', 'adaptation.unresolved'],
  'adaptation-mode': ['adaptation', 'adaptation.mode.changed'], 'run-extinct': ['life', 'run.extinct'],
  'run-abandoned': ['life', 'run.abandoned'], 'environment-transition': ['environment', 'environment.level.transition'],
  'resource-reserve': ['resource', 'resource.reserve.threshold'],
  'resource-recovered': ['resource', 'resource.cell.recovered'], 'glacial-lake': ['world', 'world.glacial_lake.formed'],
  'wetland-succession': ['world', 'world.wetland_succession.formed'], 'maritime-forest': ['world', 'world.maritime_forest.formed'],
  'powered-cell': ['life', 'life.cell.powered'], 'reach-100': ['world', 'world.reach_100.sustained'],
  coverage: ['world', 'geo.coverage.milestone'], phase: ['life', 'run.phase.abundance'],
  'geo-coast': ['world', 'geo.coast.reached'], 'geo-lake': ['world', 'geo.lake.reached'],
  'geo-river': ['world', 'geo.river.reached'],
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
  if (raw.type === 'adaptation-selected' && raw.mode === 'random') mappedKey = 'adaptation.selected.random';
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
  if (seed === null || seed >= 0x40000000 || tick === null) return null;
  const events = Array.isArray(raw.events) ? raw.events.slice(0, MAX_EVENTS).map(validateEvent).filter(Boolean)
    .sort((a, b) => a.seq - b.seq || a.tick - b.tick) : [];
  const world = { id: typeof raw.id === 'string' ? raw.id.slice(0, 64) : `${seed}-${tick}`, seed, tick,
    score: normalizeProgressionInteger(raw.score, '0'),
    rank: typeof raw.rank === 'string' ? raw.rank.slice(0, 64) : 'Seed',
    cause: typeof raw.cause === 'string' ? raw.cause.slice(0, 32) : 'unknown',
    archetype: typeof raw.archetype === 'string' ? raw.archetype.slice(0, 40) : 'Living World',
    echo: normalizeProgressionInteger(raw.echo, '0'), hash: typeof raw.hash === 'string' ? raw.hash.slice(0, 16) : '',
    scoreModelVersion: finiteInt(raw.scoreModelVersion) ?? 1,
    worldPotential: normalizeProgressionInteger(raw.worldPotential, '0'), potentialVersion: finiteInt(raw.potentialVersion) ?? 1,
    evolutionPower: finiteInt(raw.evolutionPower) ?? 0,
    evolutionDepth: normalizeProgressionInteger(raw.evolutionDepth, '0'),
    worldOrdinal: normalizeProgressionInteger(raw.worldOrdinal, '1'),
    resourceInitial: Number.isFinite(raw.resourceInitial) ? Math.max(0, raw.resourceInitial) : 0,
    resourceFinal: Number.isFinite(raw.resourceFinal) ? Math.max(0, raw.resourceFinal) : 0,
    resourceRecoveredCells: finiteInt(raw.resourceRecoveredCells) ?? 0,
    freshwaterSupportedCellSeconds: finiteInt(raw.freshwaterSupportedCellSeconds) ?? 0,
    transformedCells: finiteInt(raw.transformedCells) ?? 0, electrifiedCells: finiteInt(raw.electrifiedCells) ?? 0,
    finalElectrifiedCells: finiteInt(raw.finalElectrifiedCells) ?? 0,
    everPoweredCells: finiteInt(raw.everPoweredCells) ?? 0,
    poweredCellSeconds: finiteInt(raw.poweredCellSeconds) ?? 0,
    electricityMasteryRating: normalizeProgressionInteger(raw.electricityMasteryRating, '0'),
    electricityDevelopment: Number.isFinite(raw.electricityDevelopment) ? Math.max(0, Math.min(1, raw.electricityDevelopment)) : 0,
    reach100:raw.reach100===true,activeBuilds:Array.isArray(raw.activeBuilds)
      ?[...new Set(raw.activeBuilds.slice(0,64).filter((id)=>typeof id==='string'&&/^[a-z][a-z0-9-]{1,47}$/.test(id)))].slice(0,16):[],
    inoculationCell: Number.isInteger(raw.inoculationCell) ? raw.inoculationCell : null, events };
  if (isDynamicEnvironmentWorld(raw)) {
    world.environmentModelVersion = ENVIRONMENT_MODEL_VERSION;
    world.environmentScheduleVersion = finiteInt(raw.environmentScheduleVersion) ?? 0;
    world.environmentScheduleHash = validHash(raw.environmentScheduleHash);
    world.environmentProfileVersion = finiteInt(raw.environmentProfileVersion) ?? 0;
    world.startEnvironmentLevel = '0';
    world.finalEnvironmentLevel = normalizeEnvironmentLevel(raw.finalEnvironmentLevel, '0');
    world.peakEnvironmentLevel = normalizeEnvironmentLevel(raw.peakEnvironmentLevel, world.finalEnvironmentLevel);
    if (compareProgressionIntegers(world.peakEnvironmentLevel, world.finalEnvironmentLevel) < 0) world.peakEnvironmentLevel = world.finalEnvironmentLevel;
    world.environmentTransitionCount = normalizeProgressionInteger(raw.environmentTransitionCount, '0');
    world.environmentExposure = validateEnvironmentExposure(raw.environmentExposure);
    world.timeAtPeakTicks = normalizeProgressionInteger(raw.timeAtPeakTicks, world.environmentExposure.timeAtPeakTicks);
    world.recentEnvironmentTransitions = validateRecentTransitions(raw.recentEnvironmentTransitions);
    world.currentEnvironmentProfileHash = validHash(raw.currentEnvironmentProfileHash);
    world.onboardingEnvironmentModifier = validateOnboardingModifier(raw.onboardingEnvironmentModifier);
    world.environmentPressureSummary = validatePressureSummary(raw.environmentPressureSummary);
  } else {
    // Old `environmentLevel` is a static attempted level, never a v2 peak.
    world.environmentModelVersion = 1;
    world.attemptedEnvironmentLevel = normalizeEnvironmentLevel(raw.attemptedEnvironmentLevel ?? raw.environmentLevel,
      legacyEnvironmentLevel(raw.worldOrdinal));
    world.legacyChallengeProfileVersion = finiteInt(raw.challengeProfileVersion ?? raw.legacyChallengeProfileVersion) ?? 0;
    world.legacyChallengeProfileHash = validHash(raw.challengeProfileHash ?? raw.legacyChallengeProfileHash);
  }
  if (typeof raw.resultTransactionKey === 'string' && raw.resultTransactionKey.length <= 128) world.resultTransactionKey = raw.resultTransactionKey;
  const legacyAdaptations=Array.isArray(raw.adaptations)?raw.adaptations.slice(0,48).filter((id)=>typeof id==='string').slice(0,24):[];
  if (legacyAdaptations.length) world.adaptations = legacyAdaptations;
  const trophyFacts = validateTrophyFacts(raw.trophyFacts); if (trophyFacts) world.trophyFacts = trophyFacts; return world;
}

function isDynamicEnvironmentWorld(raw) {
  return raw?.environmentModelVersion === ENVIRONMENT_MODEL_VERSION && raw?.startEnvironmentLevel === '0';
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
function validateOnboardingModifier(raw) {
  if (!raw || typeof raw !== 'object') return Object.freeze({ version: 0, harmfulEventsDisabled: false });
  return Object.freeze({ version: finiteInt(raw.version) ?? 0, harmfulEventsDisabled: raw.harmfulEventsDisabled === true,
    label: typeof raw.label === 'string' ? raw.label.slice(0, 48) : '' });
}
function validatePressureSummary(raw) {
  if (!raw || typeof raw !== 'object') return Object.freeze({ level: '0', nextLevel: '0', profileHash: '', nextProfileHash: '',
    interpolationQ: 0, effectiveCoefficients: Object.freeze({}), pressure: 0, severityQ: 0 });
  const coefficientKeys = ['renewalScale', 'seasonScale', 'dryingScale', 'heatDriftScale', 'toxinScale',
    'maintenanceScale', 'transportStressScale', 'recoveryScale', 'attritionScale'];
  const coefficients = Object.fromEntries(coefficientKeys.flatMap((key) => Number.isFinite(raw.effectiveCoefficients?.[key])
    ? [[key, Math.max(-1_000_000, Math.min(1_000_000, raw.effectiveCoefficients[key]))]] : []));
  return Object.freeze({ level: normalizeEnvironmentLevel(raw.level, '0'), nextLevel: normalizeEnvironmentLevel(raw.nextLevel, '0'),
    profileHash: validHash(raw.profileHash), nextProfileHash: validHash(raw.nextProfileHash),
    interpolationQ: Math.max(0, Math.min(1_000_000, finiteInt(raw.interpolationQ) ?? 0)),
    effectiveCoefficients: Object.freeze(coefficients),
    pressure: Number.isFinite(raw.pressure) ? Math.max(0, Math.min(1, raw.pressure)) : 0,
    severityQ: Math.max(0, Math.min(1_000_000, finiteInt(raw.severityQ) ?? 0)) });
}

export function validateHistory(raw, retention = 24) {
  const out = defaultHistory(); if (!raw || typeof raw !== 'object') return out;
  if(Array.isArray(raw.worlds))out.worlds=raw.worlds.slice(-retention*2).map(validateWorld).filter(Boolean).slice(-retention);
  const evolution=Array.isArray(raw.evolution)?raw.evolution:Array.isArray(raw.memory)?raw.memory:[];
  out.evolution=evolution.slice(-MAX_MEMORY_EVENTS*2).map(validateEvolutionEvent).filter(Boolean).slice(-MAX_MEMORY_EVENTS);
  if(Array.isArray(raw.trophies))out.trophies=raw.trophies.slice(-MAX_TROPHY_EVENTS*2).map(validateTrophyEvent).filter(Boolean).slice(-MAX_TROPHY_EVENTS);
  return trimValidatedHistory(out).value;
}

export function loadHistory(retention = 24) {
  return loadNamespacedDocument('history', (value) => validateHistory(value, retention), defaultHistory);
}
export function saveHistory(history, retention = 24) {
  try {
    const { value, bytes } = boundHistoryDocument(history, retention);
    if (bytes > MAX_BYTES) return false;
    return saveNamespacedDocument('history', value, (item) => validateHistory(item, retention));
  } catch { return false; }
}
export function normalizeHistoryEvents(events) { return (Array.isArray(events) ? events : []).slice(0, MAX_EVENTS).map(validateEvent).filter(Boolean); }
export function appendWorld(history,result,score,runIndex,retention=24){
  const source=validateHistory(history,retention),key=result.resultTransactionKey;
  if(key&&source.worlds.some((entry)=>entry.resultTransactionKey===key))return source;
  const events=normalizeHistoryEvents(result.history);const record=validateWorld({id:`world-${result.seed}-${result.hash}-${result.tick}`,
    seed: result.seed, tick: result.tick, score: score.total, rank: score.rank.en, cause: result.cause, echo: score.echoes,
    hash: result.hash, archetype: result.archetype, inoculationCell: result.inoculationCell,
    scoreModelVersion: score.modelVersion, worldPotential: result.worldPotential, potentialVersion: result.potentialVersion,
    evolutionPower: result.evolutionPower, evolutionDepth: result.evolutionDepth, worldOrdinal: result.worldOrdinal,
    environmentModelVersion: result.environmentModelVersion, environmentScheduleVersion: result.environmentScheduleVersion,
    environmentScheduleHash: result.environmentScheduleHash, environmentProfileVersion: result.environmentProfileVersion,
    startEnvironmentLevel: result.startEnvironmentLevel, finalEnvironmentLevel: result.finalEnvironmentLevel,
    peakEnvironmentLevel: result.peakEnvironmentLevel, environmentTransitionCount: result.environmentTransitionCount,
    timeAtPeakTicks: result.timeAtPeakTicks, environmentExposure: result.environmentExposure,
    recentEnvironmentTransitions: result.recentEnvironmentTransitions,
    currentEnvironmentProfileHash: result.currentEnvironmentProfileHash,
    onboardingEnvironmentModifier: result.onboardingEnvironmentModifier,
    environmentPressureSummary: result.environmentPressureSummary, resultTransactionKey: result.resultTransactionKey,
    resourceInitial: result.resourceInitial, resourceFinal: result.resourceFinal,
    resourceRecoveredCells: result.resourceRecoveredCells,
    freshwaterSupportedCellSeconds: result.freshwaterSupportedCellSeconds,
    transformedCells: result.transformedCells, electrifiedCells: result.electrifiedCells,
    finalElectrifiedCells: result.finalElectrifiedCells, everPoweredCells: result.everPoweredCells,
    poweredCellSeconds: result.poweredCellSeconds, electricityMasteryRating: result.electricityMasteryRating,
    electricityDevelopment: result.electricityDevelopment,
    reach100: result.reach100?.achieved === true, activeBuilds: result.activeBuilds,
    trophyFacts:result.trophyFacts??buildTrophyFacts(result,score),events});
  return validateHistory({...source,worlds:[...source.worlds,record]},retention);
}
export function appendAbandonedWorld(history,result,retention=24){
  const source=validateHistory(history,retention),id=`abandoned-${result.runId}-${result.seed}-${result.tick}`;
  if(source.worlds.some((entry)=>entry.id===id))return source;
  const record=validateWorld({id,
    seed: result.seed, tick: result.tick, score: result.score, rank: 'Abandoned', cause: 'abandoned',
    echo: 0, hash: '', archetype: result.archetype, inoculationCell: result.inoculationCell,
    scoreModelVersion: result.scoreModelVersion, worldPotential: result.worldPotential,
    potentialVersion: result.potentialVersion, evolutionPower: result.evolutionPower,
    evolutionDepth: result.evolutionDepth, worldOrdinal: result.worldOrdinal,
    environmentModelVersion: result.environmentModelVersion, environmentScheduleVersion: result.environmentScheduleVersion,
    environmentScheduleHash: result.environmentScheduleHash, environmentProfileVersion: result.environmentProfileVersion,
    startEnvironmentLevel: result.startEnvironmentLevel ?? '0', finalEnvironmentLevel: result.finalEnvironmentLevel ?? '0',
    peakEnvironmentLevel: result.peakEnvironmentLevel ?? '0', environmentTransitionCount: result.environmentTransitionCount ?? '0',
    environmentExposure: result.environmentExposure, currentEnvironmentProfileHash: result.currentEnvironmentProfileHash,
    onboardingEnvironmentModifier: result.onboardingEnvironmentModifier, events:normalizeHistoryEvents(result.history)});
  return validateHistory({...source,worlds:[...source.worlds,record]},retention);
}
export function appendEvolutionEvent(history,evidence){
  const source=validateHistory(history,32);
  if(evidence?.transactionKey&&source.evolution.some((entry)=>entry.transactionKey===evidence.transactionKey))return source;
  const event=validateEvolutionEvent({...evidence,seq:source.evolution.length},source.evolution.length);
  if(!event)return source;
  return validateHistory({ ...source, evolution: [...source.evolution, event] }, 32);
}
/** Legacy writer alias; old binary records remain readable as Level 0 → 1. */
export function appendMemoryEvent(history, nodeId, cost, balance, run) {
  if (nodeId && typeof nodeId === 'object') return appendEvolutionEvent(history, nodeId);
  const balanceAfter = normalizeProgressionInteger(balance, '0'); const exactCost = normalizeProgressionInteger(cost, '0');
  return appendEvolutionEvent(history, { nodeId, oldLevel:'0', newLevel:'1', cost:exactCost,
    balanceBefore:addProgressionIntegers(balanceAfter, exactCost), balanceAfter, run });
}
export function appendTrophyEvents(history, ids, worldId = history.worlds.at(-1)?.id) {
  if (!ids?.length) return history; const source = validateHistory(history, 32); const world = source.worlds.find((entry) => entry.id === worldId);
  const known = new Set(source.trophies.map((event) => event.subjectId)); const added = ids.filter((id) => !known.has(id)).map((id, index) => ({
    seq: source.trophies.length + index, tick: world?.tick ?? 0, kind: 'trophy', importance: 3, key: 'trophy.earned',
    subjectId:id, primaryCells:[], worldId:world?.id??null,
    run:world?.worldOrdinal??String(source.worlds.length) }));
  if (!added.length) return source; const worlds = source.worlds.map((entry) => {
    if (entry.id !== worldId) return entry; let seq = entry.events.reduce((max, event) => Math.max(max, event.seq), -1) + 1;
    return { ...entry, events: [...entry.events, ...added.map((event) => ({ ...event, seq: seq++ }))].slice(-MAX_EVENTS) };
  }); return validateHistory({ ...source, worlds, trophies: [...source.trophies, ...added] }, 32);
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
function legacyEnvironmentLevel(worldOrdinal) {
  const ordinal = normalizeProgressionInteger(worldOrdinal, '1');
  if (compareProgressionIntegers(ordinal, '2') <= 0) return '0'; if (ordinal === '3') return '1';
  if (compareProgressionIntegers(ordinal, '5') <= 0) return '2';
  if (compareProgressionIntegers(ordinal, '10') <= 0) return '3'; return '4';
}
function validateTrophyEvent(raw, index) { if (!raw || typeof raw !== 'object' || raw.key !== 'trophy.earned'
    || typeof raw.subjectId !== 'string' || !/^[a-z][a-z-]{2,63}$/.test(raw.subjectId)) return null;
  return { seq: finiteInt(raw.seq) ?? index, tick: finiteInt(raw.tick) ?? 0, kind: 'trophy', importance: 3,
    key:'trophy.earned', subjectId:raw.subjectId, primaryCells:[], worldId:typeof raw.worldId==='string'?raw.worldId.slice(0,48):null,
    run:normalizeProgressionInteger(raw.run, '0') };
}
export function clearHistory() { return defaultHistory(); }
export function serializeHistory(history) { return boundHistoryDocument(history, 32, 2).text; }
export function parseHistory(text, retention = 24) { return validateHistory(JSON.parse(text), retention); }
function boundHistoryDocument(history, retention, space = 0) {
  return trimValidatedHistory(validateHistory(history, retention), space);
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
