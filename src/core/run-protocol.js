/** Version of the reduced Worker/fallback run envelope. */
// v8 removes gameplay-disaster payload authority from the run envelope.
export const RUN_PROTOCOL_VERSION = 8;
export function acceptsRunProtocol(message){return message?.protocolVersion===RUN_PROTOCOL_VERSION;}
