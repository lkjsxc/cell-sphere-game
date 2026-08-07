/** Version of the reduced Worker/fallback run envelope. */
// v7 carries the revised dynamic pressure/result evidence contract.
export const RUN_PROTOCOL_VERSION = 7;
export function acceptsRunProtocol(message){return message?.protocolVersion===RUN_PROTOCOL_VERSION;}
