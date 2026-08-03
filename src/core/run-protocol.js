/** Immutable identifiers for commands whose outcome must be acknowledged. */
export const RUN_PROTOCOL_VERSION = 2;
export function runCommand(type, runId, commandId, payload = {}) {
  return Object.freeze({ t: type, protocolVersion: RUN_PROTOCOL_VERSION, runId, commandId, ...payload });
}
export function validRunCommand(message) {
  return message?.protocolVersion === RUN_PROTOCOL_VERSION
    && Number.isInteger(message.runId) && message.runId > 0
    && Number.isInteger(message.commandId) && message.commandId > 0;
}
