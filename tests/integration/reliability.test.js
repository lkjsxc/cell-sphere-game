/** Terminal authority, liveness repair, and truthful late-stage presentation. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BALANCE as B } from '../../src/game/balance.js';
import { formatCoverage } from '../../src/interface/surfaces.js';
import { RunController } from '../../src/simulation/simulator.js';
import { reconcileLiveness } from '../../src/simulation/state.js';

function controller(seed = 1, options = {}) {
  const messages = [];
  const run = new RunController({ seed, ...options }, (message) => messages.push(message));
  run.start();
  return { run, messages };
}

test('coverage text reserves zero for authoritative extinction', () => {
  assert.equal(formatCoverage(0, 0), '0%');
  assert.equal(formatCoverage(1 / 2562, 1), '<0.1% · 1 cell');
  assert.equal(formatCoverage(2 / 2562, 2), '<0.1% · 2 cells');
  assert.equal(formatCoverage(3 / 2562, 3), '0.1%');
  assert.equal(formatCoverage(0.075, 192), '7.5%');
  assert.equal(formatCoverage(0.127, 325), '13%');
});

test('liveness reconciliation repairs production drift and reports it', () => {
  const { run } = controller(2);
  run.advance(5);
  const exact = run.state.alive.reduce((sum, value) => sum + value, 0);
  run.state.aliveCount += 7;
  const metrics = reconcileLiveness(run.state);
  assert.equal(metrics.livingCount, exact);
  assert.equal(run.state.aliveCount, exact);
  assert.equal(run.state.coverage, exact / run.state.topo.nodeCount);
  assert.equal(run.state.diagnostics.livenessRepairs, 1);
});

test('strict liveness reconciliation fails immediately on divergence', () => {
  const { run } = controller(3, { strictInvariants: true });
  run.state.aliveCount += 1;
  assert.throws(() => reconcileLiveness(run.state), /liveness invariant divergence/);
});

test('sub-epsilon living roles and dead-owned edges are removed', () => {
  const { run } = controller(4);
  const s = run.state; const cell = s.inoculationCell;
  s.biomass[cell] = B.BIOMASS_EPS / 2;
  const edge = s.topo.nodeEdges[s.topo.nodeStart[cell]];
  s.edgeActive[edge] = 1;
  const metrics = reconcileLiveness(s);
  assert.equal(metrics.livingCount, 0);
  assert.equal(s.alive[cell], 0);
  assert.equal(s.edgeActive[edge], 0);
});

test('hard ceiling enters a visible bounded collapse and emits one result', () => {
  const { run, messages } = controller(5);
  const s = run.state;
  s.tick = B.RUN_CEILING_TICKS - 1;
  s.biomass[s.inoculationCell] = 20;
  s.energy[s.inoculationCell] = 20;
  run.advance(1);
  assert.equal(s.status, 'terminal-collapse');
  assert.equal(s.terminalCause, 'hard-maximum');
  assert.equal(s.terminalDeadline, B.RUN_HARD_MAX_TICKS);
  run.advance(B.TERMINAL_COLLAPSE_TICKS + 5);
  assert.equal(s.status, 'extinct');
  assert.ok(s.tick <= B.RUN_HARD_MAX_TICKS);
  assert.equal(s.aliveCount, 0);
  assert.equal(s.coverage, 0);
  const terminal = messages.filter((message) => message.t === 'extinct');
  assert.equal(terminal.length, 1);
  assert.equal(terminal[0].summary.finalLivingCount, 0);
  assert.equal(terminal[0].summary.terminalCause, 'hard-maximum');
  run.advance(100);
  assert.equal(messages.filter((message) => message.t === 'extinct').length, 1);
});

test('sampled automatic and manual worlds finish under the authority maximum', { timeout: 30_000 }, () => {
  for (let seed = 0; seed < 64; seed++) {
    const { run, messages } = controller(80_000 + seed, { adaptationMode: seed % 5 ? 'random' : 'manual' });
    while (run.state.status !== 'extinct') run.advance(64);
    assert.ok(run.state.tick <= B.RUN_HARD_MAX_TICKS, `seed ${seed}`);
    assert.equal(run.state.aliveCount, 0);
    assert.equal(messages.filter((message) => message.t === 'extinct').length, 1);
  }
});
