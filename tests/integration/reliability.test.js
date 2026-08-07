/** Terminal authority, liveness repair, and truthful late-stage presentation. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BALANCE as B } from '../../src/game/balance.js';
import { formatCoverage } from '../../src/interface/surfaces.js';
import { RunController } from '../../src/simulation/simulator.js';
import { beginTerminalCollapse, reconcileLiveness } from '../../src/simulation/state.js';

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

test('a large authoritative tick is not a rewarded hard maximum; only causal collapse finalizes', () => {
  const { run, messages } = controller(5); const s = run.state;
  s.tick = 100_000; s.biomass[s.inoculationCell] = 20; s.energy[s.inoculationCell] = 20;
  run.advance(1);
  assert.equal(s.status, 'running'); assert.notEqual(s.terminalCause, 'hard-maximum');
  assert.equal(beginTerminalCollapse(s, 'terminal-stall'), true);
  assert.equal(s.terminalCause, 'terminal-stall'); assert.equal(s.terminalDeadline, s.terminalCollapseStart + B.TERMINAL_COLLAPSE_TICKS);
  run.advance(B.TERMINAL_COLLAPSE_TICKS + 5);
  assert.equal(s.status, 'extinct'); assert.equal(s.aliveCount, 0); assert.equal(s.coverage, 0);
  const terminal = messages.filter((message) => message.t === 'extinct');
  assert.equal(terminal.length, 1); assert.equal(terminal[0].summary.finalLivingCount, 0);
  assert.equal(terminal[0].summary.terminalCause, 'terminal-stall');
  run.advance(100); assert.equal(messages.filter((message) => message.t === 'extinct').length, 1);
});

test('sampled finite builds naturally finish within an explicit test budget, not simulation authority', { timeout: 30_000 }, () => {
  const budget = 10_000;
  for (let seed = 0; seed < 32; seed++) {
    const { run, messages } = controller(80_000 + seed);
    while (run.state.status !== 'extinct' && run.state.tick < budget) run.advance(64);
    assert.equal(run.state.status, 'extinct', `seed ${seed} exceeded external test budget`);
    assert.equal(run.state.aliveCount, 0); assert.equal(messages.filter((message) => message.t === 'extinct').length, 1);
  }
});
