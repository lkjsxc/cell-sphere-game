/** Version of the reduced Worker/fallback run envelope. */
// v11 carries direct Ecology/Luminous inputs and the terminal visual-History bundle.
export const RUN_PROTOCOL_VERSION = 11;
export function acceptsRunProtocol(message){return message?.protocolVersion===RUN_PROTOCOL_VERSION;}
