/** Immutable presentation/authority identity and the only valid empty world frame. */
export const WORLD_IDENTITY_FIELDS = Object.freeze([
  'worldSessionId', 'runId', 'seed', 'presentationGeneration', 'resultTransactionKey',
]);

export function createWorldIdentity(value) {
  for (const name of ['worldSessionId', 'runId', 'seed', 'presentationGeneration']) {
    if (!Number.isInteger(value?.[name]) || value[name] < (name === 'seed' ? 0 : 1)) throw new Error(`invalid ${name}`);
  }
  const resultTransactionKey = value.resultTransactionKey
    ?? `world:${value.worldSessionId}:${value.runId}:${value.seed}:${value.presentationGeneration}`;
  if (typeof resultTransactionKey !== 'string' || !resultTransactionKey) throw new Error('invalid resultTransactionKey');
  return Object.freeze({ worldSessionId: value.worldSessionId, runId: value.runId, seed: value.seed,
    presentationGeneration: value.presentationGeneration, resultTransactionKey });
}

export function identityFields(identity) {
  if (!identity) return null;
  return { worldSessionId: identity.worldSessionId, runId: identity.runId, seed: identity.seed,
    presentationGeneration: identity.presentationGeneration, resultTransactionKey: identity.resultTransactionKey };
}

export function sameWorldIdentity(left, right) {
  return Boolean(left && right && WORLD_IDENTITY_FIELDS.every((name) => left[name] === right[name]));
}
