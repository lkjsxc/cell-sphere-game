/** Authoritative deterministic run controller shared by Worker and fallback. */
import { BALANCE as B } from '../game/balance.js';
import { ADAPTATIONS, applyCardEffects, selectRandomOption } from '../game/adaptations.js';
import { createRunState } from './state.js';
import { updateEnvironment } from './environment.js';
import { runMetabolism } from './metabolism.js';
import { runTransport } from './transport.js';
import { runGrowth } from './growth.js';
import { runDeath } from './death.js';
import { analyzeConnectivity } from './connectivity.js';
import { runSummary } from './summary.js';
import { logReplay, recordHistory, REPLAY } from './replay.js';
import { buildSnapshot } from './snapshot.js';
import { buildRunResult, dominantCause } from './result.js';

export class RunController {
  constructor(cfg, emit = () => {}) {
    this.emit = emit;
    this.cfg = { ...cfg, adaptationMode: cfg.adaptationMode ?? 'random' };
    this.state = createRunState(this.cfg);
  }

  start() {
    const s = this.state;
    if (s.status !== 'idle') throw new Error(`start from ${s.status}`);
    s.status = 'running';
    logReplay(s, REPLAY.STRAIN, strainIndex(this.cfg.strainId));
    logReplay(s, REPLAY.INOCULATE, s.inoculationCell);
    logReplay(s, REPLAY.ADAPTATION_MODE, modeIndex(s.adaptationMode));
    recordHistory(s, 'run-start');
    this.emit({ t: 'started', tick: 0, inoculationCell: s.inoculationCell });
  }

  /** Advance up to n authoritative ticks; offers never pause progress. */
  advance(n) {
    let done = 0;
    while (done < n && this.state.status === 'running') {
      this.step();
      done++;
    }
    return done;
  }

  step() {
    const s = this.state;
    if (s.status !== 'running') return false;
    s.tick++;
    if (s.tick % B.ENV_EVERY === 0) updateEnvironment(s);
    runMetabolism(s);
    runTransport(s);
    runGrowth(s);
    runDeath(s);
    if (s.tick % B.CONNECTIVITY_EVERY === 0) analyzeConnectivity(s);
    if (s.tick % B.SUMMARY_EVERY === 0) runSummary(s, (message) => this.emit(message));
    this.resolveNextRandomOffer();

    if (s.aliveCount <= 0) {
      s.status = 'extinct';
      s.extinction = { tick: s.tick, cause: dominantCause(s) };
      for (const offer of s.adaptationOffers) {
        if (offer.resolvedTick == null) recordHistory(s, 'adaptation-unresolved', { id: offer.id });
      }
      recordHistory(s, 'run-extinct', { cause: s.extinction.cause });
      this.emit({ t: 'extinct', summary: this.buildResult() });
    }
    return true;
  }

  /** Resolve one fixed offer manually at the current authoritative tick. */
  chooseAdaptation(offerId, cardId) {
    const s = this.state;
    if (s.status !== 'running') throw new Error(`cannot choose adaptation while ${s.status}`);
    const offer = s.adaptationOffers.find((item) => item.id === offerId);
    if (!offer) throw new Error(`unknown adaptation offer: ${offerId}`);
    if (offer.resolvedTick != null) throw new Error(`adaptation offer already resolved: ${offerId}`);
    if (!offer.options.includes(cardId)) throw new Error(`card not in adaptation offer: ${cardId}`);
    this.resolveOffer(offer, cardId, 'manual');
    return true;
  }

  /** Change passive decision policy without touching simulation/content RNG. */
  setAdaptationMode(mode) {
    if (mode !== 'random' && mode !== 'manual') throw new Error(`invalid adaptation mode: ${mode}`);
    const s = this.state;
    if (s.status === 'extinct') throw new Error('cannot change adaptation mode after extinction');
    if (s.adaptationMode === mode) return false;
    s.adaptationMode = mode;
    logReplay(s, REPLAY.ADAPTATION_MODE, modeIndex(mode));
    recordHistory(s, 'adaptation-mode', { id: mode });
    this.emit({ t: 'adaptation-mode', mode, tick: s.tick });
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

  resolveOffer(offer, cardId, selectionMode) {
    const s = this.state;
    applyCardEffects(s.traits, cardId);
    s.ownedCards.push(cardId);
    offer.resolvedTick = s.tick;
    offer.selectedCardId = cardId;
    offer.selectionMode = selectionMode;
    s.lastAdaptationResolutionTick = s.tick;
    logReplay(s, REPLAY.ADAPTATION_SELECT, offer.id, cardIndex(cardId), s.tick, modeIndex(selectionMode));
    recordHistory(s, 'adaptation-selected', { id: offer.id, card: cardIndex(cardId), mode: selectionMode });
    this.emit({ t: 'adaptation-selected', offerId: offer.id, cardId, tick: s.tick, selectionMode });
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
}

function strainIndex(id) { return ['pioneer', 'conservator', 'weaver'].indexOf(id ?? 'pioneer'); }
function cardIndex(id) { return ADAPTATIONS.findIndex((card) => card.id === id); }
function modeIndex(mode) { return mode === 'random' ? 0 : 1; }
