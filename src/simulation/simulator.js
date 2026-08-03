/** Authoritative deterministic run controller shared by Worker and fallback. */
import { BALANCE as B } from '../game/balance.js';
import { chooseAdaptationOrigin } from '../core/adaptation-origin.js';
import { computeAdaptationArrivals } from '../core/adaptation-arrival.js';
import { hashStringU32 } from '../core/hash.js';
import { ADAPTATIONS, adaptationPresentationCategory, applyCardEffects, selectRandomOption } from '../game/adaptations.js';
import { applyMemoryConditionals } from '../game/memory.js';
import { beginTerminalCollapse, createRunState, reconcileLiveness, terminalCollapseReason } from './state.js';
import { updateEnvironment } from './environment.js';
import { runMetabolism } from './metabolism.js';
import { runTransport } from './transport.js';
import { runGrowth } from './growth.js';
import { runDeath } from './death.js';
import { analyzeConnectivity } from './connectivity.js';
import { runSummary } from './summary.js';
import { logReplay, recordHistory, REPLAY } from './replay.js';
import { buildSnapshot } from './snapshot.js';
import { buildAbandonedRun, buildRunResult, dominantCause } from './result.js';
import { HistoryRecorder } from '../history/recorder.js';

export class RunController {
  constructor(cfg, emit = () => {}) {
    this.emit = emit;
    this.cfg = { ...cfg, adaptationMode: cfg.adaptationMode ?? 'random' };
    this.state = createRunState(this.cfg);
    this.historyRecorder = new HistoryRecorder(this.state);
  }

  start() {
    const s = this.state;
    if (s.status !== 'idle') throw new Error(`start from ${s.status}`);
    s.status = 'running';
    logReplay(s, REPLAY.STRAIN, strainIndex(this.cfg.strainId));
    logReplay(s, REPLAY.INOCULATE, s.inoculationCell);
    logReplay(s, REPLAY.ADAPTATION_MODE, modeIndex(s.adaptationMode));
    recordHistory(s, 'run-start');
    this.historyRecorder.observe(s, true);
    this.emit({ t: 'started', tick: 0, inoculationCell: s.inoculationCell });
    this.emit({ t: 'history-batch', events: s.history.map((event) => ({ ...event })) });
  }

  /** Advance up to n authoritative ticks; offers never pause progress. */
  advance(n) {
    let done = 0;
    while (done < n && (this.state.status === 'running' || this.state.status === 'terminal-collapse')) { this.step(); done++; }
    return done;
  }

  step() {
    const s = this.state;
    if (s.status !== 'running' && s.status !== 'terminal-collapse') return false;
    const historyLength = s.history.length; const collapsing = s.status === 'terminal-collapse';
    s.tick++;
    if (!collapsing) {
      applyMemoryConditionals(s);
      if (s.tick % B.ENV_EVERY === 0) updateEnvironment(s);
      runMetabolism(s); runTransport(s); runGrowth(s);
    }
    runDeath(s);
    const living = reconcileLiveness(s);
    if (living.livingCount === 0) return this.finishExtinction();
    if (!collapsing) {
      if (s.tick % B.CONNECTIVITY_EVERY === 0) analyzeConnectivity(s);
      if (s.tick % B.SUMMARY_EVERY === 0) runSummary(s, (message) => this.emit(message));
      this.resolveNextRandomOffer();
      const reason = terminalCollapseReason(s);
      if (reason && beginTerminalCollapse(s, reason)) {
        this.emit({ t: 'terminal-collapse', tick: s.tick, cause: reason,
          livingCount: s.aliveCount, deadline: s.terminalDeadline });
        this.emit({ t: 'history-batch', events: [{ ...s.history.at(-1) }] });
      }
    }
    this.historyRecorder.observe(s, s.history.length !== historyLength);
    return true;
  }

  finishExtinction() {
    const s = this.state; if (s.status === 'extinct') return false;
    const historyStart = s.history.length;
    s.status = 'extinct'; s.aliveCount = 0; s.coverage = 0;
    s.connectedShare = 0; s.largestComponent = 0;
    s.extinction = { tick: s.tick, cause: dominantCause(s), terminalCause: s.terminalCause ?? 'natural' };
    for (const offer of s.adaptationOffers) if (offer.resolvedTick == null) {
      recordHistory(s, 'adaptation-unresolved', { id: offer.id });
    }
    recordHistory(s, 'run-extinct', { cause: s.extinction.cause });
    this.historyRecorder.observe(s, true, true);
    this.emit({ t: 'history-batch', events: s.history.slice(historyStart).map((event) => ({ ...event })) });
    this.emit({ t: 'extinct', summary: this.buildResult() });
    return true;
  }

  abort() {
    const s = this.state;
    if (s.status !== 'running' && s.status !== 'terminal-collapse') return false;
    const historyStart = s.history.length; s.status = 'aborted';
    recordHistory(s, 'run-abandoned', { value: s.aliveCount });
    this.historyRecorder.observe(s, true, true);
    this.emit({ t: 'history-batch', events: s.history.slice(historyStart).map((event) => ({ ...event })) });
    this.emit({ t: 'aborted', summary: buildAbandonedRun(s) });
    return true;
  }

  /** Resolve one fixed offer manually at the current authoritative tick. */
  chooseAdaptation(offerId, cardId, context = {}) {
    const s = this.state;
    if (s.status !== 'running') throw new Error(`cannot choose adaptation while ${s.status}`);
    const offer = s.adaptationOffers.find((item) => item.id === offerId);
    if (!offer) throw new Error(`unknown adaptation offer: ${offerId}`);
    if (offer.resolvedTick != null) throw new Error(`adaptation offer already resolved: ${offerId}`);
    if (!offer.options.includes(cardId)) throw new Error(`card not in adaptation offer: ${cardId}`);
    this.resolveOffer(offer, cardId, 'manual', context);
    return true;
  }

  /** Change passive decision policy without touching simulation/content RNG. */
  setAdaptationMode(mode, context = {}) {
    if (mode !== 'random' && mode !== 'manual') throw new Error(`invalid adaptation mode: ${mode}`);
    const s = this.state;
    if (s.status === 'extinct') throw new Error('cannot change adaptation mode after extinction');
    if (s.adaptationMode === mode) { this.emit({ t: 'adaptation-mode', mode, tick: s.tick, ...context }); return false; }
    s.adaptationMode = mode;
    logReplay(s, REPLAY.ADAPTATION_MODE, modeIndex(mode));
    recordHistory(s, 'adaptation-mode', { id: mode });
    this.emit({ t: 'adaptation-mode', mode, tick: s.tick, ...context });
    this.emit({ t: 'history-batch', events: [{ ...s.history.at(-1) }] });
    this.historyRecorder.observe(s, true);
    if (mode === 'random' && s.status === 'running') this.resolveNextRandomOffer();
    return true;
  }

  /** Resolve at most one pending FIFO offer in this authoritative tick. */
  resolveNextRandomOffer() {
    const s = this.state;
    if (s.status !== 'running' || s.adaptationMode !== 'random') return false;
    if (s.lastAdaptationResolutionTick === s.tick) return false;
    const offer = s.adaptationOffers.find((item) => item.resolvedTick == null);
    if (!offer) return false;
    this.resolveOffer(offer, selectRandomOption(s.decisionRng, offer.options), 'random');
    return true;
  }

  resolveOffer(offer, cardId, selectionMode, context = {}) {
    const s = this.state;
    const origin = chooseAdaptationOrigin(s);
    const category = adaptationPresentationCategory(cardId);
    const propagation = computeAdaptationArrivals({ topo: s.topo, fields: s.fields,
      originCell: origin.cell, alive: s.alive, biomass: s.biomass, stress: s.stress,
      energy: s.energy, category, salt: hashStringU32(`${cardId}:${origin.cell}`) });
    applyCardEffects(s.traits, cardId);
    s.ownedCards.push(cardId);
    offer.resolvedTick = s.tick;
    offer.selectedCardId = cardId;
    offer.selectionMode = selectionMode;
    s.lastAdaptationResolutionTick = s.tick;
    logReplay(s, REPLAY.ADAPTATION_SELECT, offer.id, cardIndex(cardId), s.tick, modeIndex(selectionMode));
    recordHistory(s, 'adaptation-selected', { id: offer.id, card: cardIndex(cardId), mode: selectionMode });
    this.emit({ t: 'adaptation-selected', offerId: offer.id, offerVersion: offer.offerVersion, cardId, tick: s.tick, selectionMode, ...context,
      originCell: origin.cell, category, affectedComponentId: origin.componentId,
      arrivalVersion: propagation.version, arrivals: propagation.arrivals,
      affectedCount: propagation.affectedCount, minArrival: propagation.minArrival,
      medianArrival: propagation.medianArrival, maxArrival: propagation.maxArrival },
    [propagation.arrivals.buffer]);
    this.emit({ t: 'history-batch', events: [{ ...s.history.at(-1) }] });
    this.historyRecorder.observe(s, true);
  }

  /** Pure compact dynamic projection for pointer inspection. */
  inspectCell(node) {
    const s = this.state;
    if (!Number.isInteger(node) || node < 0 || node >= s.topo.nodeCount) {
      throw new Error(`invalid cell: ${node}`);
    }
    let activeEdges = 0;
    let conductance = 0;
    for (let o = s.topo.nodeStart[node]; o < s.topo.nodeStart[node + 1]; o++) {
      const edge = s.topo.nodeEdges[o];
      if (s.edgeActive[edge] === 1) {
        activeEdges++;
        conductance += s.conductance[edge];
      }
    }
    return {
      tick: s.tick, node, alive: s.alive[node], biomass: s.biomass[node], energy: s.energy[node],
      nutrient: s.nutrient[node], moisture: s.moisture[node], temperature: s.temperature[node],
      toxicity: s.toxicity[node], stress: s.stress[node], activeEdges,
      meanConductance: activeEdges ? conductance / activeEdges : 0,
    };
  }

  buildResult() { return buildRunResult(this.state); }
  snapshot() { return buildSnapshot(this.state); }
  historyPreview(tick) { return this.historyRecorder.preview(tick); }
  historyBuffer() { return this.historyRecorder.buffer(); }
}

function strainIndex(id) { return ['pioneer', 'conservator', 'weaver'].indexOf(id ?? 'pioneer'); }
function cardIndex(id) { return ADAPTATIONS.findIndex((card) => card.id === id); }
function modeIndex(mode) { return mode === 'random' ? 0 : 1; }
