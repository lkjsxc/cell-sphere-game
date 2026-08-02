/** Primary world screen only. Simulation and overlays are independent state. */
import { createStateMachine } from '../core/state-machine.js';

export function createAppState() {
  return createStateMachine({
    initial: 'title',
    transitions: {
      title: { begin: 'starting' },
      starting: { ready: 'running', fail: 'title' },
      running: { extinct: 'result' },
      result: { memory: 'memory', restart: 'starting' },
      memory: { restart: 'starting' },
    },
  });
}
