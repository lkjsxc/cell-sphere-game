/** Immutable presentation/authority identity and the only valid empty world frame. */
import { boundedTransactionKey } from './hash.js';

/** Mutable Environment level/profile state is intentionally absent. */
export const WORLD_IDENTITY_FIELDS = Object.freeze([
  'worldSessionId', 'runId', 'seed', 'presentationGeneration',
  'environmentModelVersion', 'environmentScheduleVersion', 'environmentScheduleHash',
  'immutableStartConfigurationHash', 'resultTransactionKey',
]);

export function createWorldIdentity(value) {
  for (const name of ['worldSessionId', 'runId', 'seed', 'presentationGeneration']) {
    if (!Number.isInteger(value?.[name]) || value[name] < (name === 'seed' ? 0 : 1)) throw new Error(`invalid ${name}`);
  }
  const environmentModelVersion = version(value?.environmentModelVersion, 'environmentModelVersion');
  const environmentScheduleVersion = version(value?.environmentScheduleVersion, 'environmentScheduleVersion');
  const environmentScheduleHash = hash(value?.environmentScheduleHash, 'environmentScheduleHash');
  const immutableStartConfigurationHash = hash(value?.immutableStartConfigurationHash, 'immutableStartConfigurationHash');
  const resultTransactionKey = value.resultTransactionKey ?? boundedTransactionKey('world-result', [
    value.worldSessionId, value.runId, value.seed, value.presentationGeneration,
    environmentModelVersion, environmentScheduleVersion, environmentScheduleHash,
    immutableStartConfigurationHash,
  ]);
  if (typeof resultTransactionKey !== 'string' || !resultTransactionKey || resultTransactionKey.length > 128) {
    throw new Error('invalid resultTransactionKey');
  }
  return Object.freeze({
    worldSessionId: value.worldSessionId, runId: value.runId, seed: value.seed,
    presentationGeneration: value.presentationGeneration,
    environmentModelVersion, environmentScheduleVersion, environmentScheduleHash,
    immutableStartConfigurationHash, resultTransactionKey,
  });
}

export function identityFields(identity) {
  if (!identity) return null;
  return Object.fromEntries(WORLD_IDENTITY_FIELDS.map((name) => [name, identity[name]]));
}

export function sameWorldIdentity(left, right) {
  return Boolean(left && right && WORLD_IDENTITY_FIELDS.every((name) => left[name] === right[name]));
}

function version(value, name) {
  if (!Number.isInteger(value) || value < 1) throw new Error(`invalid ${name}`);
  return value;
}
function hash(value, name) {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}$/.test(value)) throw new Error(`invalid ${name}`);
  return value;
}
