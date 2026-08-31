/** Immutable World-derived substrate shared by Evolution layout and rendering. */
import { createRng } from '../../core/prng.js';
import { createFields } from '../../world/fields.js';
import { EVOLUTION_TOPOLOGY, EVOLUTION_TOPOLOGY_LEVEL } from './topology.js';

export const EVOLUTION_SUBSTRATE_SEED = 0xe701c311;
export const EVOLUTION_SUBSTRATE = createFields(createRng(EVOLUTION_SUBSTRATE_SEED), EVOLUTION_TOPOLOGY);

/**
 * Numeric cell identity is canonical across repeated level-4 topology objects,
 * so every Evolution consumer can reuse the one content-lifetime substrate.
 */
export function createEvolutionFields(topology = EVOLUTION_TOPOLOGY) {
  if (!topology || topology.levels !== EVOLUTION_TOPOLOGY_LEVEL
    || topology.nodeCount !== EVOLUTION_TOPOLOGY.nodeCount
    || topology.edgeCount !== EVOLUTION_TOPOLOGY.edgeCount) {
    throw new Error('invalid Evolution substrate topology');
  }
  return EVOLUTION_SUBSTRATE;
}
