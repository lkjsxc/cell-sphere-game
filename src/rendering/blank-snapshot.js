/** The only renderer-valid neutral frame between world authorities. */
import { createWorldIdentity, identityFields } from '../core/world-session.js';

export function createBlankSnapshot(nodeCount, identity) {
  if (!Number.isInteger(nodeCount) || nodeCount <= 0) throw new Error('invalid blank snapshot node count');
  const session = createWorldIdentity(identity); const zeroFactors = Object.freeze([]);
  const reach = Object.freeze({ current: 0, gained: 0, lost: 0, net: 0, windowSeconds: 15,
    positive: zeroFactors, negative: zeroFactors, positiveConditions: zeroFactors, negativeConditions: zeroFactors });
  const metrics = Object.freeze({ coverage: 0, peakCoverage: 0, connectedShare: 0, aliveCount: 0,
    totalLivingBiomass: 0, viableEnergyCells: 0, activeFrontierCells: 0, terminalCause: null,
    resourceReserveFraction: 1, resourceDepletedCells: 0, score: 0, vitality: 0 });
  return Object.freeze({ ...identityFields(session), tick: 0, entropy: 0, status: 'starting', worldOrdinal: 1, worldEra: 1,
    biomass: new Float32Array(nodeCount), stress: new Float32Array(nodeCount),
    alive: new Uint8Array(nodeCount), lifeState: new Uint8Array(nodeCount), eventStrength: new Uint8Array(nodeCount),
    eventFamily: new Uint8Array(nodeCount), resourceRichnessQ: new Uint8Array(nodeCount),
    reserveFractionQ: new Uint8Array(nodeCount), resourceState: new Uint8Array(nodeCount),
    transformationState: new Uint8Array(nodeCount), electricityQ: new Uint8Array(nodeCount),
    reach, metrics, events: Object.freeze([]), blank: true });
}
