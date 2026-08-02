#!/usr/bin/env node
/** Deterministic headless adaptation policies for benchmark and balance. */
import { createRng } from '../src/core/prng.js';
import { cardById } from '../src/game/adaptations.js';

const CATEGORY_WEIGHTS = {
  first: null,
  random: null,
  balanced: { reach: 1.5, metabolism: 1.5, resilience: 1.5, transport: 1.5, symbiosis: 1.5, memory: 1 },
  expansion: { reach: 3, metabolism: 1, resilience: 0.5, transport: 1, symbiosis: 0.5, memory: 0.5 },
  resilience: { reach: 0.5, metabolism: 1.5, resilience: 3, transport: 1, symbiosis: 1, memory: 0.5 },
  efficiency: { reach: 0.5, metabolism: 3, resilience: 1, transport: 1.5, symbiosis: 1, memory: 1 },
};

export function makePilot(policy, seed) {
  const rng = createRng((seed ^ 0xb075eed) >>> 0);
  const weights = CATEGORY_WEIGHTS[policy];
  if (weights === undefined) throw new Error(`unknown policy: ${policy}`);

  function scoreCard(id) {
    if (policy === 'first') return 1;
    if (policy === 'random') return rng.float();
    let score = 0;
    for (const category of cardById(id).cats) score += weights[category] ?? 0.5;
    return score + rng.float() * 0.1;
  }

  return {
    onMessage(controller, message) {
      if (message.t !== 'adaptation-offered') return;
      let best = message.offer.options[0];
      let bestScore = -Infinity;
      for (const id of message.offer.options) {
        const score = scoreCard(id);
        if (score > bestScore) { bestScore = score; best = id; }
      }
      controller.chooseAdaptation(message.offer.id, best);
    },
  };
}

export function runHeadless({ RunController }, cfg, policy) {
  const pilot = makePilot(policy, cfg.seed);
  const rc = new RunController({ ...cfg, adaptationMode: 'manual' },
    (message) => pilot.onMessage(rc, message));
  rc.start();
  const started = performance.now();
  let guard = 0;
  while (rc.state.status !== 'extinct' && guard++ < 5000) rc.advance(20);
  const ms = performance.now() - started;
  return { result: rc.buildResult(), ticks: rc.state.tick, ms, state: rc.state };
}
