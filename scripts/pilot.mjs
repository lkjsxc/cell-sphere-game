/** Deterministic unattended production-authority runner. */
import { choosePolicyAction, normalizePolicy } from '../src/agent/policies.js';

export function makePilot(policy = 'autonomous') {
  const campaignPolicy = normalizePolicy(policy);
  return Object.freeze({ policy: campaignPolicy, onMessage() {},
    decide(observation) { return choosePolicyAction(observation, campaignPolicy); } });
}

/**
 * External harness budget only. It never changes simulation terminal authority
 * and incomplete runs return no scored result.
 */
export function runHeadless({ RunController }, cfg, policy = 'autonomous', options = {}) {
  const pilot = makePilot(policy); let rc;
  rc = new RunController(cfg, (message) => pilot.onMessage(rc, message));
  const budgetTicks = Number.isInteger(options.budgetTicks) && options.budgetTicks > 0 ? options.budgetTicks : 10_000;
  const start = performance.now(); rc.start(); let remaining = budgetTicks;
  while (rc.state.status !== 'extinct' && remaining > 0) {
    const chunk = Math.min(256, remaining); rc.advance(chunk); remaining -= chunk;
  }
  const ms = performance.now() - start; const complete = rc.state.status === 'extinct';
  return { result: complete ? rc.buildResult() : null, ticks: rc.state.tick, ms, state: rc.state,
    complete, incomplete: !complete, budgetTicks };
}
