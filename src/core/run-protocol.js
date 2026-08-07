/** Version of the reduced Worker/fallback run envelope. */
export const RUN_PROTOCOL_VERSION = 6;
export function acceptsRunProtocol(message){return message?.protocolVersion===RUN_PROTOCOL_VERSION;}
