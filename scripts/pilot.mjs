/** Deterministic unattended production-authority runner. */
export function makePilot(policy = 'autonomous') {
  return Object.freeze({ policy, onMessage() {} });
}

export function runHeadless({ RunController }, cfg, policy = 'autonomous') {
  const pilot = makePilot(policy); let rc;
  rc = new RunController(cfg, (message) => pilot.onMessage(rc, message));
  const start = performance.now(); rc.start(); rc.advance(4000); const ms = performance.now() - start;
  return { result: rc.buildResult(), ticks: rc.state.tick, ms, state: rc.state };
}
