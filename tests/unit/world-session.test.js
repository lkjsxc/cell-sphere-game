/** Atomic world identity and typed neutral-frame contracts. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorldIdentity, identityFields, sameWorldIdentity } from '../../src/core/world-session.js';
import { createBlankSnapshot } from '../../src/rendering/blank-snapshot.js';

function identity(overrides = {}) {
  return createWorldIdentity({ worldSessionId: 7, runId: 11, seed: 42, presentationGeneration: 13, ...overrides });
}
test('world identity is immutable, complete, and exact-match only', () => {
  const value = identity(); assert.equal(Object.isFrozen(value), true);
  assert.deepEqual(Object.keys(value), ['worldSessionId', 'runId', 'seed', 'presentationGeneration', 'resultTransactionKey']);
  assert.equal(value.resultTransactionKey, 'world:7:11:42:13');
  assert.equal(sameWorldIdentity(value, identityFields(value)), true);
  assert.equal(sameWorldIdentity(value, { ...value, presentationGeneration: 14 }), false);
  assert.throws(() => createWorldIdentity({ ...value, runId: 0 }), /runId/);
});

test('typed blank snapshot has zero life, stress, events, HUD, and Reach state', () => {
  const session = identity(); const blank = createBlankSnapshot(2562, session);
  assert.equal(Object.isFrozen(blank), true); assert.equal(blank.status, 'starting'); assert.equal(blank.blank, true);
  assert.equal(sameWorldIdentity(blank, session), true);
  for (const [name, Type] of [['biomass', Float32Array], ['stress', Float32Array], ['alive', Uint8Array],
    ['lifeState', Uint8Array], ['eventStrength', Uint8Array], ['eventFamily', Uint8Array]]) {
    assert.ok(blank[name] instanceof Type); assert.equal(blank[name].length, 2562);
    assert.equal(blank[name].some((value) => value !== 0), false, name);
  }
  assert.deepEqual(blank.metrics, { coverage: 0, peakCoverage: 0, connectedShare: 0, aliveCount: 0,
    totalLivingBiomass: 0, viableEnergyCells: 0, activeFrontierCells: 0, terminalCause: null,
    resourceReserveFraction: 1, resourceDepletedCells: 0, score: 0, vitality: 0 });
  assert.equal(blank.reach.current, 0); assert.equal(blank.reach.gained, 0); assert.equal(blank.reach.lost, 0);
  assert.deepEqual(blank.events, []); assert.throws(() => createBlankSnapshot(0, session), /node count/);
});
