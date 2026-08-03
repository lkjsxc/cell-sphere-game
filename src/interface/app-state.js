/** Orthogonal world authority and selected presentation scene. */
import { createStateMachine } from '../core/state-machine.js';

export const WORLD_PHASES = Object.freeze(['idle', 'starting', 'running', 'result']);
export const SCENES = Object.freeze(['home', 'world', 'evolution', 'trophies']);

export function createAppState() {
  const authority = createStateMachine({
    initial: 'idle',
    transitions: {
      idle: { begin: 'starting' },
      starting: { ready: 'running', replace: 'starting', fail: 'idle' },
      running: { extinct: 'result', abort: 'starting' },
      result: { restart: 'starting' },
    },
  });
  let scene = 'home';
  return {
    get phase() { return authority.state; },
    get scene() { return scene; },
    /** Compatibility for authority-only callers; scenes never masquerade as phases. */
    get state() { return authority.state; },
    send(event) { return authority.send(event); },
    can(event) { return authority.can(event); },
    events() { return authority.events(); },
    select(next) {
      if (!SCENES.includes(next)) throw new Error(`unknown scene: ${next}`);
      scene = next; return scene;
    },
  };
}
