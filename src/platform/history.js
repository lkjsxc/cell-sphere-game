/** Bounded semantic History schema 4. Visual detail is stored separately. */
import { buildTrophyFacts, validateTrophyFacts } from '../game/trophies/facts.js';
import { loadNamespacedDocument, saveNamespacedDocument } from './namespace-store.js';
const MAX_BYTES = 700_000;
const MAX_EVENTS = 80;
const MAX_MEMORY_EVENTS = 128;
const MAX_TROPHY_EVENTS = 128;
const CELL_COUNT = 2562;

export function defaultHistory() { return { schema: 4, worlds: [], memory: [], trophies: [] }; }
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
  'run-abandoned': ['life', 'run.abandoned'],
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
  if (Number.isFinite(raw.valueA)) event.valueA = raw.valueA;
  if (Number.isFinite(raw.valueB)) event.valueB = raw.valueB;
  return event;
}

function validateWorld(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const seed = finiteInt(raw.seed); const tick = finiteInt(raw.tick); const score = finiteInt(raw.score);
  if (seed === null || seed >= 0x40000000 || tick === null || score === null) return null;
  const events = Array.isArray(raw.events) ? raw.events.slice(0, MAX_EVENTS).map(validateEvent).filter(Boolean)
    .sort((a, b) => a.seq - b.seq || a.tick - b.tick) : [];
  const world = { id: typeof raw.id === 'string' ? raw.id.slice(0, 48) : `${seed}-${tick}`, seed, tick, score,
    rank: typeof raw.rank === 'string' ? raw.rank.slice(0, 24) : 'Seed',
    cause: typeof raw.cause === 'string' ? raw.cause.slice(0, 32) : 'unknown',
    archetype: typeof raw.archetype === 'string' ? raw.archetype.slice(0, 40) : 'Living World',
    echo: finiteInt(raw.echo) ?? 0, hash: typeof raw.hash === 'string' ? raw.hash.slice(0, 16) : '',
    inoculationCell: Number.isInteger(raw.inoculationCell) ? raw.inoculationCell : null,
    adaptations: Array.isArray(raw.adaptations) ? raw.adaptations.filter((id) => typeof id === 'string').slice(0, 24) : [], events };
  const trophyFacts = validateTrophyFacts(raw.trophyFacts); if (trophyFacts) world.trophyFacts = trophyFacts; return world;
}

export function validateHistory(raw, retention = 24) {
  const out = defaultHistory(); if (!raw || typeof raw !== 'object') return out;
  if (Array.isArray(raw.worlds)) out.worlds = raw.worlds.map(validateWorld).filter(Boolean).slice(-retention);
  if (Array.isArray(raw.memory)) out.memory = raw.memory.filter((event) => event && typeof event.nodeId === 'string'
    && Number.isFinite(event.cost) && event.cost >= 0).slice(-MAX_MEMORY_EVENTS)
    .map((event, index) => ({ seq: finiteInt(event.seq) ?? index, nodeId: event.nodeId.slice(0, 48),
      cost: Math.floor(event.cost), balance: finiteInt(event.balance) ?? 0, run: finiteInt(event.run) ?? 0 }));
  if (Array.isArray(raw.trophies)) out.trophies = raw.trophies.map(validateTrophyEvent).filter(Boolean).slice(-MAX_TROPHY_EVENTS);
  return out;
}

export function loadHistory(retention = 24) {
  return loadNamespacedDocument('history', (value) => validateHistory(value, retention), defaultHistory);
}
export function saveHistory(history, retention = 24) {
  try {
    const value = validateHistory(history, retention); let text = JSON.stringify(value);
    while (text.length > MAX_BYTES && value.worlds.length > 1) { value.worlds.shift(); text = JSON.stringify(value); }
    if (text.length > MAX_BYTES) return false;
    return saveNamespacedDocument('history', value, (item) => validateHistory(item, retention));
  } catch { return false; }
}
export function normalizeHistoryEvents(events) { return (Array.isArray(events) ? events : []).slice(0, MAX_EVENTS).map(validateEvent).filter(Boolean); }
export function appendWorld(history, result, score, runIndex, retention = 24) {
  const events = normalizeHistoryEvents(result.history); const record = validateWorld({ id: `${runIndex}-${result.seed}-${result.hash}`,
    seed: result.seed, tick: result.tick, score: score.total, rank: score.rank.en, cause: result.cause, echo: score.echoes,
    hash: result.hash, archetype: result.archetype, inoculationCell: result.inoculationCell,
    adaptations: (result.adaptationOffers ?? result.offers ?? []).filter((offer) => offer.selectedCardId).map((offer) => offer.selectedCardId),
    trophyFacts: result.trophyFacts ?? buildTrophyFacts(result, score), events });
  return validateHistory({ ...history, worlds: [...history.worlds, record] }, retention);
}
export function appendAbandonedWorld(history, result, retention = 24) {
  const record = validateWorld({ id: `abandoned-${result.runId}-${result.seed}-${result.tick}`,
    seed: result.seed, tick: result.tick, score: result.score, rank: 'Abandoned', cause: 'abandoned',
    echo: 0, hash: '', archetype: result.archetype, inoculationCell: result.inoculationCell,
    adaptations: (result.offers ?? []).filter((offer) => offer.selectedCardId).map((offer) => offer.selectedCardId),
    events: normalizeHistoryEvents(result.history) });
  return validateHistory({ ...history, worlds: [...history.worlds, record] }, retention);
}
export function appendMemoryEvent(history, nodeId, cost, balance, run) { const event = { seq: history.memory.length, nodeId, cost, balance, run };
  return validateHistory({ ...history, memory: [...history.memory, event] }, 32); }
export function appendTrophyEvents(history, ids, worldId = history.worlds.at(-1)?.id) {
  if (!ids?.length) return history; const source = validateHistory(history, 32); const world = source.worlds.find((entry) => entry.id === worldId);
  const known = new Set(source.trophies.map((event) => event.subjectId)); const added = ids.filter((id) => !known.has(id)).map((id, index) => ({
    seq: source.trophies.length + index, tick: world?.tick ?? 0, kind: 'trophy', importance: 3, key: 'trophy.earned',
    subjectId: id, primaryCells: [], worldId: world?.id ?? null, run: source.worlds.length }));
  if (!added.length) return source; const worlds = source.worlds.map((entry) => {
    if (entry.id !== worldId) return entry; let seq = entry.events.reduce((max, event) => Math.max(max, event.seq), -1) + 1;
    return { ...entry, events: [...entry.events, ...added.map((event) => ({ ...event, seq: seq++ }))].slice(-MAX_EVENTS) };
  }); return validateHistory({ ...source, worlds, trophies: [...source.trophies, ...added] }, 32);
}
function validateTrophyEvent(raw, index) { if (!raw || typeof raw !== 'object' || raw.key !== 'trophy.earned'
    || typeof raw.subjectId !== 'string' || !/^[a-z][a-z-]{2,63}$/.test(raw.subjectId)) return null;
  return { seq: finiteInt(raw.seq) ?? index, tick: finiteInt(raw.tick) ?? 0, kind: 'trophy', importance: 3,
    key: 'trophy.earned', subjectId: raw.subjectId, primaryCells: [], worldId: typeof raw.worldId === 'string' ? raw.worldId.slice(0, 48) : null,
    run: finiteInt(raw.run) ?? 0 };
}
export function clearHistory() { return defaultHistory(); }
export function serializeHistory(history) { return JSON.stringify(validateHistory(history, 32), null, 2); }
export function parseHistory(text, retention = 24) { return validateHistory(JSON.parse(text), retention); }
