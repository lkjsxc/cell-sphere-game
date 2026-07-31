/**
 * Minimal explicit finite state machine. Legal transitions are declared up
 * front; illegal sends throw, which surfaces wiring bugs loudly instead of
 * silently ignoring them.
 */

/**
 * @template {string} S
 * @param {Object} def
 * @param {S} def.initial
 * @param {Record<S, Record<string, S>>} def.transitions state -> event -> next
 * @param {((from: S, event: string, to: S) => void)} [def.onTransition]
 */
export function createStateMachine(def) {
  let current = def.initial;

  return {
    /** @returns {S} */
    get state() {
      return current;
    },
    /** @param {string} event @returns {boolean} */
    can(event) {
      return Boolean(def.transitions[current] && def.transitions[current][event]);
    },
    /** @param {string} event @returns {S} the new state */
    send(event) {
      const next = def.transitions[current] && def.transitions[current][event];
      if (!next) {
        throw new Error(`illegal transition: ${current} --${event}--> ?`);
      }
      const prev = current;
      current = next;
      if (def.onTransition) def.onTransition(prev, event, current);
      return current;
    },
    /** All states reachable by one event from the current state. */
    events() {
      return Object.keys(def.transitions[current] ?? {});
    },
  };
}
