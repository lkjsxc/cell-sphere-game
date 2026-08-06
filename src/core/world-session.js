/** Immutable presentation/authority identity and the only valid empty world frame. */
import {normalizeProgressionInteger} from './progression-integer.js';
import {boundedTransactionKey} from './hash.js';
export const WORLD_IDENTITY_FIELDS = Object.freeze([
  'worldSessionId', 'runId', 'seed', 'presentationGeneration', 'environmentLevel',
  'challengeProfileHash', 'resultTransactionKey',
]);

export function createWorldIdentity(value) {
  for (const name of ['worldSessionId', 'runId', 'seed', 'presentationGeneration']) {
    if (!Number.isInteger(value?.[name]) || value[name] < (name === 'seed' ? 0 : 1)) throw new Error(`invalid ${name}`);
  }
  const environmentLevel = normalizeProgressionInteger(value.environmentLevel, '0');
  const challengeProfileHash = typeof value.challengeProfileHash === 'string' && /^[0-9a-f]{8}$/.test(value.challengeProfileHash)
    ? value.challengeProfileHash : '00000000';
  const resultTransactionKey=value.resultTransactionKey??boundedTransactionKey('world-result',[
    value.worldSessionId,value.runId,value.seed,value.presentationGeneration,environmentLevel,challengeProfileHash]);
  if(typeof resultTransactionKey!=='string'||!resultTransactionKey||resultTransactionKey.length>128)throw new Error('invalid resultTransactionKey');
  return Object.freeze({ worldSessionId: value.worldSessionId, runId: value.runId, seed: value.seed,
    presentationGeneration: value.presentationGeneration, environmentLevel, challengeProfileHash, resultTransactionKey });
}

export function identityFields(identity) {
  if (!identity) return null;
  return { worldSessionId: identity.worldSessionId, runId: identity.runId, seed: identity.seed,
    presentationGeneration: identity.presentationGeneration, environmentLevel: identity.environmentLevel,
    challengeProfileHash: identity.challengeProfileHash, resultTransactionKey: identity.resultTransactionKey };
}

export function sameWorldIdentity(left, right) {
  return Boolean(left && right && WORLD_IDENTITY_FIELDS.every((name) => left[name] === right[name]));
}
