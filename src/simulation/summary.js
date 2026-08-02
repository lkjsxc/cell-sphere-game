/** Summary metrics, semantic milestones, events, and passive offers. */
import { BALANCE as B } from '../game/balance.js';
import { ADAPTATIONS, drawAdaptationOptions } from '../game/adaptations.js';
import { telegraphLead } from './events.js';
import { BIOME, FEATURE } from '../world/fields.js';
import { logReplay, recordHistory, REPLAY } from './replay.js';

const PHASES = Object.freeze([
  Object.freeze({ tick: 0, id: 'abundance' }),
  Object.freeze({ tick: 600, id: 'competition' }),
  Object.freeze({ tick: 1800, id: 'instability' }),
  Object.freeze({ tick: 3000, id: 'collapse' }),
]);
const COVERAGE_MILESTONES = Object.freeze([0.1, 0.25, 0.5, 0.75]);

/** @param {object} state @param {(msg: object) => void} emit */
export function runSummary(state, emit) {
  const historyStart = state.history.length;
  const coverage = state.aliveCount / state.topo.nodeCount;
  state.coverage = coverage;
  if (coverage > state.peakCoverage) state.peakCoverage = coverage;
  state.sustainedSum += coverage;
  state.sustainedSamples++;
  if (state.connectedShare > state.peakConnectedShare) state.peakConnectedShare = state.connectedShare;
  if (coverage > 0.5 && state.connectedShare < state.minConnectedWhileMajority) {
    state.minConnectedWhileMajority = state.connectedShare;
  }
  announceEvents(state, emit);
  recordMilestones(state);
  recordGeography(state);
  recordMorphology(state);
  checkAdaptationOffer(state, emit);
  if (state.history.length > historyStart) {
    emit({ t: 'history-batch', events: state.history.slice(historyStart).map((event) => ({ ...event })) });
  }
}

function announceEvents(state, emit) {
  const lead = telegraphLead(state.traits);
  for (const ev of state.events) {
    if (!(ev.announced & 1) && state.tick >= ev.startTick - lead) {
      ev.announced |= 1;
      recordHistory(state, 'event-telegraph', { id: ev.id, family: ev.family, cell: ev.center });
      emit({ t: 'event', phase: 'telegraph', family: ev.family, nameJa: ev.nameJa,
        descJa: ev.descJa, center: ev.center, radiusDot: ev.radiusDot, tick: state.tick });
    }
    if (!(ev.announced & 2) && state.tick >= ev.startTick) {
      ev.announced |= 2;
      recordHistory(state, 'event-start', { id: ev.id, family: ev.family, cell: ev.center });
      emit({ t: 'event', phase: 'active', family: ev.family, nameJa: ev.nameJa,
        center: ev.center, radiusDot: ev.radiusDot, tick: state.tick });
      if (ev.crisis) state.crisesTotal++;
      if (ev.crisis && state.traits.feverGrowth) {
        for (let i = 0; i < state.topo.nodeCount; i++) {
          if (state.alive[i] === 1 && state.energy[i] > 0) {
            state.energy[i] = Math.fround(state.energy[i] + 0.35);
          }
        }
      }
    }
    if (!(ev.announced & 4) && state.tick > ev.endTick) {
      ev.announced |= 4;
      if (ev.crisis && state.aliveCount > 0) state.crisesEndured++;
      recordHistory(state, 'event-end', { id: ev.id, family: ev.family, cell: ev.center });
      emit({ t: 'event', phase: 'end', family: ev.family, tick: state.tick });
    }
  }
}

function recordMilestones(state) {
  while (state.phaseIndex + 1 < PHASES.length
    && state.tick >= PHASES[state.phaseIndex + 1].tick) {
    state.phaseIndex++;
    recordHistory(state, 'phase', { id: PHASES[state.phaseIndex].id });
  }
  while (state.coverageMilestoneIndex < COVERAGE_MILESTONES.length
    && state.coverage >= COVERAGE_MILESTONES[state.coverageMilestoneIndex]) {
    const value = COVERAGE_MILESTONES[state.coverageMilestoneIndex++];
    recordHistory(state, 'coverage', { value });
  }
  if (!state.loopMilestone && state.aliveCount > 2) {
    let edges = 0;
    for (let i = 0; i < state.edgeActive.length; i++) edges += state.edgeActive[i];
    if (edges >= state.aliveCount) {
      state.loopMilestone = true;
      recordHistory(state, 'network-loop', { edges, cells: state.aliveCount });
    }
  }
}

function recordGeography(state) {
  const checks = [
    [1, 'geo-coast', (i) => state.fields.featureFlags[i] & FEATURE.COAST],
    [2, 'geo-river', (i) => state.fields.featureFlags[i] & FEATURE.RIVER],
    [4, 'geo-forest', (i) => state.fields.featureFlags[i] & FEATURE.FOREST],
    [8, 'geo-mountain', (i) => state.fields.biomeId[i] === BIOME.HIGHLAND || state.fields.biomeId[i] === BIOME.MOUNTAIN],
    [16, 'geo-wetland', (i) => state.fields.biomeId[i] === BIOME.WETLAND],
    [32, 'geo-world-knot', (i) => state.topo.degree[i] === 5],
  ];
  for (const [bit, type, predicate] of checks) {
    if (state.geographySeen & bit) continue;
    for (let cell = 0; cell < state.topo.nodeCount; cell++) if (state.alive[cell] && predicate(cell)) {
      state.geographySeen |= bit; recordHistory(state, type, { cell }); break;
    }
  }
}

function recordMorphology(state) {
  const fragmented = state.aliveCount > 8 && state.connectedShare < 0.88;
  if (fragmented && !state.wasFragmented) {
    state.wasFragmented = true;
    recordHistory(state, 'component-split', { value: state.connectedShare });
  } else if (!fragmented && state.wasFragmented && state.connectedShare > 0.95) {
    state.wasFragmented = false; state.reconnectedUntil = state.tick + 200;
    recordHistory(state, 'component-reconnected', { value: state.connectedShare });
  }
}

function checkAdaptationOffer(state, emit) {
  if (state.nextOfferIndex >= B.ADAPTATION_OFFER_TICKS.length) return;
  if (state.tick < B.ADAPTATION_OFFER_TICKS[state.nextOfferIndex]) return;
  offerAdaptation(state, emit);
}

/** Create one immutable offer, bounded to the authoritative queue cap. */
export function offerAdaptation(state, emit, forcedReason = null) {
  if (state.adaptationOffers.length >= B.ADAPTATION_QUEUE_CAP) return null;
  const crisisCats = [];
  for (const ev of state.events) {
    if (ev.crisis && ev.startTick > state.tick && ev.startTick - state.tick < 400) {
      crisisCats.push('resilience');
      break;
    }
  }
  const options = Object.freeze(drawAdaptationOptions(state.contentRng, {
    owned: state.ownedCards,
    lastOffered: state.lastOffered,
    crisisCats,
  }, B.ADAPTATION_OPTIONS).slice());
  const offerIndex = state.nextOfferIndex++;
  const offer = {
    id: offerIndex, offerIndex, offerTick: state.tick, options,
    reason: forcedReason ?? (crisisCats.length ? 'crisis' : 'milestone'),
    resolvedTick: null, selectedCardId: null, selectionMode: null,
  };
  state.adaptationOffers.push(offer);
  state.lastOffered = options.slice();
  logReplay(state, REPLAY.ADAPTATION_OFFER, offer.id, ...options.map(adaptationIndex));
  recordHistory(state, 'adaptation-offered', { id: offer.id, reason: offer.reason });
  emit({ t: 'adaptation-offered', offer: { ...offer, options: options.slice() } });
  return offer;
}

function adaptationIndex(id) {
  return ADAPTATIONS.findIndex((card) => card.id === id);
}
