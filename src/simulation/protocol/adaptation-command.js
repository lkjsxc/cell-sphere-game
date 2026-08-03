/** Explicit acknowledgement/rejection around Adaptation authority. */
import { RUN_PROTOCOL_VERSION, validRunCommand } from '../../core/run-protocol.js';
export function executeAdaptationSelection(controller, message, runId) {
  const reject = (reason) => rejection('adaptation-selection-rejected', controller, message, runId, reason);
  if (!validRunCommand(message)) return reject('invalid-command');
  if (message.runId !== runId) return reject('wrong-run');
  const state = controller.state;
  if (state.status !== 'running') return reject('run-no-longer-active');
  if (state.adaptationMode !== 'manual') return reject('mode-not-manual');
  const offer = state.adaptationOffers.find((item) => item.id === message.offerId);
  if (!offer) return reject('stale-offer');
  if (offer.offerVersion !== message.offerVersion) return reject('stale-offer-version');
  if (offer.resolvedTick != null) return reject('already-resolved');
  if (!offer.options.includes(message.cardId)) return reject('option-not-present');
  controller.chooseAdaptation(message.offerId, message.cardId, commandContext(message)); return null;
}
export function executeAdaptationMode(controller, message, runId) {
  const reject = (reason) => rejection('adaptation-mode-rejected', controller, message, runId, reason);
  if (!validRunCommand(message)) return reject('invalid-command');
  if (message.runId !== runId) return reject('wrong-run');
  if (!['running', 'terminal-collapse'].includes(controller.state.status)) return reject('run-no-longer-active');
  if (message.mode !== 'manual' && message.mode !== 'random') return reject('invalid-mode');
  controller.setAdaptationMode(message.mode, commandContext(message)); return null;
}
function rejection(type, controller, message, runId, reason) {
  const current = controller.state.adaptationOffers.find((offer) => offer.resolvedTick == null);
  return { t: type, protocolVersion: RUN_PROTOCOL_VERSION, runId, commandId: message?.commandId ?? null,
    offerId: message?.offerId ?? null, cardId: message?.cardId ?? null, requestedMode: message?.mode ?? null,
    reason, currentOffer: current ? { ...current, options: current.options.slice() } : null };
}
function commandContext(message) {
  return { protocolVersion: RUN_PROTOCOL_VERSION, commandId: message.commandId,
    ...(message.offerVersion == null ? {} : { offerVersion: message.offerVersion }) };
}
