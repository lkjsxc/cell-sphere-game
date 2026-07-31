/**
 * RunController: the single deterministic orchestrator used identically by
 * the Web Worker driver and the main-thread fallback. Owns canonical state;
 * exposes decision entry points; emits notifications through one callback.
 */
import { BALANCE as B } from '../game/balance.js';
import { createRunState } from './state.js';
import { updateEnvironment } from './environment.js';
import { runMetabolism } from './metabolism.js';
import { runTransport } from './transport.js';
import { runGrowth } from './growth.js';
import { runDeath } from './death.js';
import { analyzeConnectivity } from './connectivity.js';
import { runSummary } from './summary.js';
import { logReplay, REPLAY } from './replay.js';
import { buildSnapshot } from './snapshot.js';
import { buildRunResult, dominantCause } from './result.js';
import { ADAPTATIONS, drawDraftOptions, applyCardEffects } from '../game/adaptations.js';
import { clamp01 } from '../core/math.js';

export class RunController {
  /**
   * @param {object} cfg {seed, strainId, memoryEffects, challenge, inoculate}
   * @param {(msg: object) => void} emit
   */
  constructor(cfg, emit) {
    this.emit = emit;
    this.state = createRunState(cfg);
    this.cfg = cfg;
  }

  /** Begin the run (status idle -> running). */
  start() {
    const s = this.state;
    if (s.status !== 'idle') throw new Error(`start from ${s.status}`);
    s.status = 'running';
    logReplay(s, REPLAY.STRAIN, strainIndex(this.cfg.strainId));
    logReplay(s, REPLAY.INOCULATE, inoculateNode(s));
    this.emit({ t: 'started', tick: 0 });
  }

  /**
   * Advance up to n ticks. Stops early at drafts and extinction.
   * @param {number} n
   * @returns {number} ticks actually simulated
   */
  advance(n) {
    let done = 0;
    while (done < n && this.state.status === 'running') {
      this.step();
      done++;
    }
    return done;
  }

  /** One canonical tick. */
  step() {
    const s = this.state;
    s.tick++;

    if (s.tick % B.ENV_EVERY === 0) updateEnvironment(s);
    runMetabolism(s);
    runTransport(s);
    runGrowth(s);
    runDeath(s);
    decaySignals(s);
    regenSignalCharge(s);

    if (s.tick % B.CONNECTIVITY_EVERY === 0) analyzeConnectivity(s);
    if (s.tick % B.SUMMARY_EVERY === 0) runSummary(s, (m) => this.emit(m));

    if (s.aliveCount <= 0 && s.status === 'running') {
      s.status = 'extinct';
      s.extinction = { tick: s.tick, cause: dominantCause(s) };
      this.emit({ t: 'extinct', summary: this.buildResult() });
    }
  }

  /** Place a Signal at a node. Returns false if unavailable. */
  placeSignal(node) {
    const s = this.state;
    if (s.status !== 'running' || s.signalCharges <= 0) return false;
    s.signalCharges--;
    s.signalsPlaced++;
    const { positions } = s.topo;
    const cx = positions[node * 3];
    const cy = positions[node * 3 + 1];
    const cz = positions[node * 3 + 2];
    const radiusDot = B.SIGNAL_RADIUS_DOT;
    const until = s.tick + B.SIGNAL_DURATION_TICKS * s.traits.signalDuration;
    for (let i = 0; i < s.topo.nodeCount; i++) {
      const dot = cx * positions[i * 3] + cy * positions[i * 3 + 1] + cz * positions[i * 3 + 2];
      if (dot > radiusDot) {
        const w = (dot - radiusDot) / (1 - radiusDot);
        s.signal[i] = Math.fround(clamp01(s.signal[i] + B.SIGNAL_STRENGTH * w * w));
      }
    }
    s.activeSignals.push({ node, untilTick: until });
    logReplay(s, REPLAY.SIGNAL, node);
    this.emit({ t: 'signal', node, untilTick: until });
    return true;
  }

  /** Resolve a pending draft with a chosen card. */
  decide(cardId) {
    const s = this.state;
    if (s.status !== 'draft' || !s.pendingDraft) throw new Error('no pending draft');
    if (!s.pendingDraft.options.includes(cardId)) throw new Error(`invalid option ${cardId}`);
    applyCardEffects(s.traits, cardId);
    s.ownedCards.push(cardId);
    s.pendingDraft = null;
    s.draftIndex++;
    s.status = 'running';
    logReplay(s, REPLAY.DECIDE, cardIndex(cardId));
    this.emit({ t: 'decided', card: cardId, tick: s.tick });
  }

  /** Reroll the pending draft (requires rerollsLeft > 0). */
  reroll() {
    const s = this.state;
    if (s.status !== 'draft' || s.rerollsLeft <= 0) return false;
    s.rerollsLeft--;
    const previous = s.pendingDraft?.options ?? [];
    logReplay(s, REPLAY.REROLL);
    const options = drawDraftOptions(s.contentRng, {
      owned: s.ownedCards, lastOffered: previous, crisisCats: [],
    }, B.DRAFT_OPTIONS);
    s.pendingDraft = { options, tick: s.tick };
    s.lastOffered = options;
    this.emit({ t: 'draft', options, tick: s.tick });
    return true;
  }

  /** Compact result summary for the result screen and archive. */
  buildResult() {
    return buildRunResult(this.state);
  }

  /** Visual snapshot (copies; safe to transfer). */
  snapshot() {
    return buildSnapshot(this.state);
  }
}

function decaySignals(s) {
  for (let i = 0; i < s.topo.nodeCount; i++) {
    if (s.signal[i] > 0) s.signal[i] = Math.fround(s.signal[i] * B.SIGNAL_DECAY);
  }
  s.activeSignals = s.activeSignals.filter((sig) => sig.untilTick > s.tick);
}

function regenSignalCharge(s) {
  const max = B.SIGNAL_CHARGES + s.traits.signalCharges;
  if (s.signalCharges >= max) return;
  s.signalRegenAcc++;
  if (s.signalRegenAcc >= B.SIGNAL_REGEN_TICKS) {
    s.signalRegenAcc = 0;
    s.signalCharges = Math.min(max, s.signalCharges + 1);
  }
}

function strainIndex(id) {
  return ['pioneer', 'conservator', 'weaver'].indexOf(id ?? 'pioneer');
}

function cardIndex(id) {
  return ADAPTATIONS.findIndex((c) => c.id === id);
}

function inoculateNode(s) {
  // The state constructor already applied the inoculation; recover the node.
  for (let i = 0; i < s.topo.nodeCount; i++) if (s.alive[i] === 1) return i;
  return 0;
}
