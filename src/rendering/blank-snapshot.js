/** The only renderer-valid neutral frame between world authorities. */
import { createWorldIdentity, identityFields } from '../core/world-session.js';
import { environmentScheduleAtTick } from '../game/environment-level.js';
import { createEnvironmentExposure, environmentExposureSummary } from '../game/environment-exposure.js';
import { ENVIRONMENT_PROFILE_VERSION } from '../simulation/challenge-profile.js';
import { EVENT_DIRECTOR_VERSION } from '../simulation/events.js';

export function createBlankSnapshot(nodeCount, identity) {
  if (!Number.isInteger(nodeCount) || nodeCount <= 0) throw new Error('invalid blank snapshot node count');
  const session = createWorldIdentity(identity); const schedule = environmentScheduleAtTick('0'); const zeroFactors = Object.freeze([]);
  const reach = Object.freeze({ current: 0, gained: 0, lost: 0, net: 0, windowSeconds: 15,
    positive: zeroFactors, negative: zeroFactors, positiveConditions: zeroFactors, negativeConditions: zeroFactors });
  const metrics = Object.freeze({ coverage: 0, peakCoverage: 0, connectedShare: 0, aliveCount: 0,
    totalLivingBiomass: 0, viableEnergyCells: 0, activeFrontierCells: 0, terminalCause: null,
    resourceReserveFraction: 1, resourceDepletedCells: 0, score: '0', vitality: 0 });
  return Object.freeze({ ...identityFields(session), tick: 0, entropy: 0, status: 'starting', worldOrdinal: '1',
    environmentModelVersion: schedule.environmentModelVersion,
    environmentScheduleVersion: schedule.environmentScheduleVersion,
    environmentScheduleHash: schedule.environmentScheduleHash,
    environmentProfileVersion: ENVIRONMENT_PROFILE_VERSION,
    eventDirector: Object.freeze({ version: EVENT_DIRECTOR_VERSION, activeCount: 0, futureCount: 0, recentCount: 0,
      harmfulEventsDisabled: false }),
    currentEnvironmentLevel: '0', peakEnvironmentLevel: '0', environmentLevelStartTick: '0',
    nextEnvironmentLevelTick: schedule.nextEnvironmentLevelTick, environmentLevelProgressQ: 0,
    environmentTransitionCount: '0', environmentExposure: environmentExposureSummary(createEnvironmentExposure('0')),
    environmentPressureSummary: Object.freeze({ level: '0', publicRating: '0', profileHash: null, nextLevel: '0', nextProfileHash: null,
    interpolationQ: 0, effectiveCoefficients: Object.freeze({}), pressure: 0, severityQ: 0, dimensions: Object.freeze({}) }),
    biomass: new Float32Array(nodeCount), stress: new Float32Array(nodeCount),
    alive: new Uint8Array(nodeCount), lifeState: new Uint8Array(nodeCount), eventStrength: new Uint8Array(nodeCount),
    eventFamily: new Uint8Array(nodeCount), resourceRichnessQ: new Uint8Array(nodeCount),
    reserveFractionQ: new Uint8Array(nodeCount), resourceState: new Uint8Array(nodeCount),
    transformationState: new Uint8Array(nodeCount), electricityQ: new Uint8Array(nodeCount),
    reach, metrics, events: Object.freeze([]), blank: true });
}
