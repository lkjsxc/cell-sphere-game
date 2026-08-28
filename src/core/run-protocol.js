/** Version of the reduced Worker/fallback run envelope. */
// v12 carries public speed multipliers; the Worker converts them through runtime-speed policy.
export const RUN_PROTOCOL_VERSION = 12;
export function acceptsRunProtocol(message){return message?.protocolVersion===RUN_PROTOCOL_VERSION;}
