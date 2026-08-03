/** Compact deterministic proof retained with completed semantic History. */
import { ADAPTATIONS } from '../adaptations.js';
const GEO = Object.freeze({ 'geo.coast.reached': 1, 'geo.river.reached': 2, 'geo.forest.reached': 4,
  'geo.mountain.reached': 8, 'geo.wetland.reached': 16, 'geo.world_knot.reached': 32 });
const CRISIS = Object.freeze({ drought: 1, heat: 2, freeze: 4, 'toxic-rain': 8, 'solar-flare': 16, ash: 32, blight: 64 });
const CATEGORIES = Object.freeze({ reach: 1, metabolism: 2, resilience: 4, transport: 8, symbiosis: 16, memory: 32 });
const CARD = new Map(ADAPTATIONS.map((card) => [card.id, card]));

export function buildTrophyFacts(result, score) {
  const events = Array.isArray(result.history) ? result.history : []; const offers = result.offers ?? result.adaptationOffers ?? [];
  const adaptationIds = unique(offers.map((offer) => offer.selectedCardId)); const selected = adaptationIds.length;
  const manual = offers.filter((offer) => offer.selectedCardId && offer.selectionMode === 'manual').length;
  const random = offers.filter((offer) => offer.selectedCardId && offer.selectionMode === 'random').length;
  const pending = offers.filter((offer) => !offer.selectedCardId).length; const morph = morphology(events);
  const geographyMask = eventMask(events, GEO); const crisisMask = crisisEventMask(events); const categories = categoryMask(adaptationIds);
  const reach = result.reach ?? {}; const frontier = factor(reach.positive, 'frontier-expansion'); const regrowth = factor(reach.positive, 'regrowth');
  const reconnection = factor(reach.positive, 'reconnection-growth'); const adapted = factor(reach.positive, 'Adaptation-enabled-expansion');
  const skill = factor(reach.positive, 'skill-enabled-recovery'); const axes = scoreAxes(score);
  let flags = 0;
  if ((result.crisesTotal ?? 0) > 0 && result.crisesEndured === result.crisesTotal) flags |= 1;
  if (selected >= 3 && pending === 0) flags |= 2;
  if ((result.peakCoverage ?? 0) >= .5 && (result.minConnectedWhileMajority ?? 0) >= .75) flags |= 4;
  if ((flags & 4) && morph[1] && morph[2] && (result.minConnectedWhileMajority ?? 0) >= .95) flags |= 8;
  if (categories === 63) flags |= 16;
  return validateTrophyFacts({ version: 1, survivalSeconds: result.survivalSeconds, peakCoverageBp: bp(result.peakCoverage),
    sustainedCoverageBp: bp(result.sustainedCoverage), geographyMask, crisisMask,
    crisesEndured: result.crisesEndured, crisesTotal: result.crisesTotal, reach: [reach.gained, frontier, regrowth, reconnection, adapted, skill],
    morph, offers: [selected, manual, random, pending], adaptationIds, adaptationCategoryMask: categories, scoreAxesBp: axes, flags });
}

export function deriveLegacyTrophyFacts(world) {
  const events = Array.isArray(world?.events) ? world.events : []; const adaptationIds = unique(world?.adaptations ?? []); const morph = morphology(events);
  const selected = adaptationIds.length; const manual = events.filter((event) => event.key === 'adaptation.selected.manual').length;
  const random = events.filter((event) => event.key === 'adaptation.selected.random').length; let flags = 0;
  if (selected >= 3 && !events.some((event) => event.key === 'adaptation.unresolved')) flags |= 2;
  if (categoryMask(adaptationIds) === 63) flags |= 16;
  return validateTrophyFacts({ version: 1, survivalSeconds: (world?.tick ?? 0) / 10,
    peakCoverageBp: events.some((event) => event.key === 'geo.coverage.milestone') ? 1000 : 0,
    geographyMask: eventMask(events, GEO), crisisMask: crisisEventMask(events), crisesEndured: crisisCount(events),
    reach: [0, 0, 0, 0, 0, 0], morph, offers: [selected, manual, random, 0], adaptationIds,
    adaptationCategoryMask: categoryMask(adaptationIds), scoreAxesBp: [0, 0, 0, 0, 0, 0], flags });
}

export function validateTrophyFacts(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const array = (value, length, max = 1_000_000) => Array.from({ length }, (_, index) => integer(value?.[index], max));
  return Object.freeze({ version: 1, survivalSeconds: integer(raw.survivalSeconds, 100_000),
    peakCoverageBp: integer(raw.peakCoverageBp, 10_000), sustainedCoverageBp: integer(raw.sustainedCoverageBp, 10_000),
    geographyMask: integer(raw.geographyMask, 63), crisisMask: integer(raw.crisisMask, 127),
    crisesEndured: integer(raw.crisesEndured, 64), crisesTotal: integer(raw.crisesTotal, 64),
    reach: Object.freeze(array(raw.reach, 6)), morph: Object.freeze(array(raw.morph, 3, 80)),
    offers: Object.freeze(array(raw.offers, 4, 24)), adaptationIds: Object.freeze(unique(raw.adaptationIds).filter((id) => CARD.has(id)).slice(0, 24)),
    adaptationCategoryMask: integer(raw.adaptationCategoryMask, 63), scoreAxesBp: Object.freeze(array(raw.scoreAxesBp, 6, 10_000)), flags: integer(raw.flags, 31) });
}
function morphology(events) { return ['morph.loop.first', 'morph.component.split', 'morph.component.reconnected'].map((key) => events.filter((event) => eventKey(event) === key).length); }
function eventMask(events, map) { let mask = 0; for (const event of events) mask |= map[eventKey(event)] ?? 0; return mask; }
function crisisEventMask(events) { let mask = 0; for (const event of events) if (eventKey(event) === 'crisis.ended') mask |= CRISIS[event.subjectId ?? event.family] ?? 0; return mask; }
function crisisCount(events) { return events.filter((event) => eventKey(event) === 'crisis.ended').length; }
function eventKey(event) { if (event.key) return event.key; const type = event.type;
  return type === 'network-loop' ? 'morph.loop.first' : type === 'component-split' ? 'morph.component.split'
    : type === 'component-reconnected' ? 'morph.component.reconnected' : type === 'event-end' ? 'crisis.ended'
      : type?.startsWith('geo-') ? `geo.${type.slice(4).replaceAll('-', '_')}.reached` : type === 'coverage' ? 'geo.coverage.milestone' : ''; }
function categoryMask(ids) { let mask = 0; for (const id of ids) for (const cat of CARD.get(id)?.cats ?? []) mask |= CATEGORIES[cat] ?? 0; return mask; }
function factor(entries, id) { return entries?.find((entry) => entry.id === id)?.count ?? 0; }
function scoreAxes(score) { const by = new Map((score?.breakdown ?? []).map((part) => [part.key, bp(part.q)]));
  return ['survival', 'peakCoverage', 'sustainedCoverage', 'connectivity', 'efficiency', 'crisis'].map((key) => by.get(key) ?? 0); }
function bp(value) { return Math.max(0, Math.min(10_000, Math.round((Number.isFinite(value) ? value : 0) * 10_000))); }
function integer(value, max) { return Math.max(0, Math.min(max, Number.isFinite(value) ? Math.floor(value) : 0)); }
function unique(values) { return [...new Set((Array.isArray(values) ? values : []).filter((value) => typeof value === 'string' && /^[a-z0-9-]{1,48}$/.test(value)))]; }
