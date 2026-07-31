#!/usr/bin/env node
/**
 * Deterministic headless bot policies shared by the benchmark and balance
 * harness. These use the production RunController — never a copied model.
 *
 * A pilot is a function (controller, message) => void wired as the
 * controller's emit callback; it reacts to 'draft' (and optionally places
 * Signals on a cadence by being polled via tickPilot()).
 */
import { createRng } from '../src/core/prng.js';
import { cardById } from '../src/game/adaptations.js';

const CATEGORY_WEIGHTS = {
  first: null, // special: always options[0]
  random: null, // special: uniform random
  balanced: { reach: 1.5, metabolism: 1.5, resilience: 1.5, transport: 1.5, symbiosis: 1.5, memory: 1 },
  expansion: { reach: 3, metabolism: 1, resilience: 0.5, transport: 1, symbiosis: 0.5, memory: 0.5 },
  resilience: { reach: 0.5, metabolism: 1.5, resilience: 3, transport: 1, symbiosis: 1, memory: 0.5 },
  efficiency: { reach: 0.5, metabolism: 3, resilience: 1, transport: 1.5, symbiosis: 1, memory: 1 },
};

/**
 * @param {string} policy one of CATEGORY_WEIGHTS keys
 * @param {number} seed deterministic seed for the pilot's own choices
 * @param {{signals?: boolean}} [opts]
 */
export function makePilot(policy, seed, opts = {}) {
  const rng = createRng((seed ^ 0xb075eed) >>> 0);
  const weights = CATEGORY_WEIGHTS[policy];
  if (weights === undefined) throw new Error(`unknown policy: ${policy}`);
  let lastSignalTick = -999;

  function scoreCard(id) {
    if (policy === 'first') return 1;
    if (policy === 'random') return rng.float();
    const card = cardById(id);
    let s = 0;
    for (const cat of card.cats) s += weights[cat] ?? 0.5;
    return s + rng.float() * 0.1; // tiny tie-break jitter, still deterministic
  }

  return {
    /** Emit callback for the controller. */
    onMessage(controller, msg) {
      if (msg.t === 'draft') {
        let best = msg.options[0];
        let bestScore = -Infinity;
        for (const id of msg.options) {
          const s = scoreCard(id);
          if (s > bestScore) { bestScore = s; best = id; }
        }
        controller.decide(best);
      }
    },
    /** Optional per-batch polling: place Signals like a calm active player. */
    tick(controller) {
      if (!opts.signals) return;
      const s = controller.state;
      if (s.status !== 'running') return;
      if (s.tick - lastSignalTick < 220) return;
      if (s.signalCharges <= 0) return;
      const target = bestSignalTarget(s);
      if (target >= 0) {
        controller.placeSignal(target);
        lastSignalTick = s.tick;
      }
    },
  };
}

/** Highest-nutrient node adjacent to living frontier tissue. */
function bestSignalTarget(s) {
  const { nodeStart, nodeNeighbors } = s.topo;
  let best = -1;
  let bestScore = 0;
  for (let i = 0; i < s.topo.nodeCount; i++) {
    if (s.alive[i] !== 1) continue;
    for (let o = nodeStart[i]; o < nodeStart[i + 1]; o++) {
      const nb = nodeNeighbors[o];
      if (s.alive[nb] === 1) continue;
      const score = s.nutrient[nb];
      if (score > bestScore) { bestScore = score; best = nb; }
    }
  }
  return bestScore > 0.3 ? best : -1;
}

/**
 * Run one full headless run to extinction (or a hard guard).
 * @returns {{result: object, ticks: number, ms: number}}
 */
export function runHeadless({ RunController }, cfg, policy, opts = {}) {
  const pilot = makePilot(policy, cfg.seed, opts);
  const rc = new RunController(cfg, (m) => pilot.onMessage(rc, m));
  rc.start();
  const t0 = performance.now();
  let guard = 0;
  while (rc.state.status !== 'extinct' && guard++ < 5000) {
    rc.advance(20);
    pilot.tick(rc);
  }
  const ms = performance.now() - t0;
  return { result: rc.buildResult(), ticks: rc.state.tick, ms, state: rc.state };
}
