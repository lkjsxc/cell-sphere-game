/** Primary world screen only. Simulation and overlays are independent state. */
import { createStateMachine } from '../core/state-machine.js';

export function createAppState() {
  return createStateMachine({
    initial: 'title',
    transitions: {
      title: { begin: 'starting', trophies: 'trophies' },
      starting: { ready: 'running', replace: 'starting', fail: 'title' },
      running: { extinct: 'result', abort: 'starting' },
      result: { memory: 'memory', trophies: 'trophies', restart: 'starting' },
      memory: { trophies: 'trophies', restart: 'starting' },
      trophies: { memory: 'memory', restart: 'starting' },
    },
  });
}
