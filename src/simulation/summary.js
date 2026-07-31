/**
 * Summary phase: coverage metrics, efficiency, crisis accounting, and the
 * adaptation draft trigger. Runs every SUMMARY_EVERY ticks.
 */
import { BALANCE as B } from '../game/balance.js';
import { drawDraftOptions } from '../game/adaptations.js';
import { telegraphLead } from './events.js';

/**
 * @param {object} state
 * @param {(msg: object) => void} emit notification callback
 */
export function runSummary(state, emit) {
  const coverage = state.aliveCount / state.topo.nodeCount;
  state.coverage = coverage;
  if (coverage > state.peakCoverage) state.peakCoverage = coverage;
  state.sustainedSum += coverage;
  state.sustainedSamples++;
  if (state.connectedShare > state.peakConnectedShare) {
    state.peakConnectedShare = state.connectedShare;
  }
  if (coverage > 0.5 && state.connectedShare < state.minConnectedWhileMajority) {
    state.minConnectedWhileMajority = state.connectedShare;
  }

  announceEvents(state, emit);
  checkDraft(state, emit);
}

/** Event lifecycle notifications: telegraph -> active -> end. */
function announceEvents(state, emit) {
  const lead = telegraphLead(state.traits);
  for (const ev of state.events) {
    if (!(ev.announced & 1) && state.tick >= ev.startTick - lead) {
      ev.announced |= 1;
      emit({ t: 'event', phase: 'telegraph', family: ev.family, nameJa: ev.nameJa,
        descJa: ev.descJa, center: ev.center, radiusDot: ev.radiusDot, tick: state.tick });
    }
    if (!(ev.announced & 2) && state.tick >= ev.startTick) {
      ev.announced |= 2;
      emit({ t: 'event', phase: 'active', family: ev.family, nameJa: ev.nameJa,
        center: ev.center, radiusDot: ev.radiusDot, tick: state.tick });
      if (ev.crisis) state.crisesTotal++;
      // Fever growth: energy burst through frontier tissue.
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
      emit({ t: 'event', phase: 'end', family: ev.family, tick: state.tick });
    }
  }
}

/** Draft trigger at milestone ticks. */
function checkDraft(state, emit) {
  if (state.pendingDraft) return;
  if (state.draftIndex >= B.DRAFT_TICKS.length) return;
  if (state.tick < B.DRAFT_TICKS[state.draftIndex]) return;

  // Crisis-aware boosting: respond to the nearest upcoming crisis.
  const crisisCats = [];
  for (const ev of state.events) {
    if (ev.crisis && ev.startTick > state.tick && ev.startTick - state.tick < 400) {
      crisisCats.push('resilience');
      break;
    }
  }

  const options = drawDraftOptions(state.contentRng, {
    owned: state.ownedCards,
    lastOffered: state.pendingDraft ? state.pendingDraft.options : (state.lastOffered ?? []),
    crisisCats,
  }, B.DRAFT_OPTIONS);

  state.pendingDraft = { options, tick: state.tick };
  state.lastOffered = options;
  state.status = 'draft';
  emit({ t: 'draft', options, tick: state.tick });
}
