/** Version of the reduced Worker/fallback run envelope. */
// v10 carries the terminal visual-History bundle before a retired Worker can be stopped.
export const RUN_PROTOCOL_VERSION = 10;
export function acceptsRunProtocol(message){return message?.protocolVersion===RUN_PROTOCOL_VERSION;}
