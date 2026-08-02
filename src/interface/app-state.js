/** Explicit screen/run state; overlays such as pause do not change run truth. */
import { createStateMachine } from '../core/state-machine.js';

export function createAppState() {
  return createStateMachine({
    initial: 'title',
    transitions: {
      title: { begin: 'starting' },
      starting: { ready: 'running', fail: 'title' },
      running: { draft: 'draft', extinct: 'result' },
      draft: { choose: 'running', extinct: 'result' },
      result: { restart: 'starting' },
    },
  });
}
