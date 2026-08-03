import { conditional as c, defineBranch, scalar as s, unlock as u } from './node.js';

export const CONTINUITY_MEMORY = defineBranch('continuity', 'perception-watchful-crown', [
  ['remembered-burden', 'Inherited Burden', 'Network upkeep falls by 4%.', 'The Continuity lesson is preserved as a bounded reduction in connected tissue upkeep.', 3, s('maintenance', 0.96)],
  ['faithful-junctions', 'Faithful Junctions', 'Flux reinforcement rises by 3%.', 'Junctions preserve the geometry that once held separate regions in useful contact.', 3, s('reinforce', 1.03)],
  ['threaded-scars', 'Threaded Scars', 'Regrowth into scars is 3% stronger.', 'A faint living thread remains legible when the network returns to damaged ground.', 3, s('regrow', 1.03)],
  ['loop-memory', 'Loop Memory', 'Enable one layer of redundant loops.', 'Alternative routes are valued as continuity insurance instead of dismissed as inefficiency.', 4, s('redundantLoops', 1, 'add')],
  ['bridging-hyphae', 'Bridging Hyphae', 'Enable one layer of anastomosis.', 'Compatible branches remember how to fuse when fragmentation places them near each other.', 4, s('anastomosis', 1, 'add')],
  ['durable-trunks', 'Durable Trunks', 'Transport capacity rises by 4%.', 'Long-lived corridors retain enough width to reconnect activity after a quiet interval.', 4, s('conductance', 1.04)],
  ['patient-repair', 'Patient Repair', 'Regrowth into scars is 5% stronger.', 'Repair follows proven boundaries and avoids repeating the shape of the original break.', 5, s('regrow', 1.05)],
  ['shared-load', 'Shared Load', 'Stress resistance rises by 4%.', 'Connected regions distribute damage so no single surviving bridge absorbs the whole shock.', 6, s('stressResist', 1.04)],
  ['fragment-vow', 'Fragment Vow', 'Regrowth rises after fragmentation.', 'Separated components prioritize the shortest remembered approaches toward one another.', 5, c('components-above-one', 'regrow', 1.16)],
  ['last-bridge', 'Last Bridge', 'Reinforcement rises at low connectivity.', 'The remaining links thicken when losing one more would divide the living network.', 6, c('connectivity-below-35', 'reinforce', 1.16)],
  ['collapse-lattice', 'Collapse Lattice', 'Stress resistance rises after major loss.', 'Survivors settle into a smaller coherent lattice rather than chasing the vanished perimeter.', 7, c('recent-biomass-loss-above-20', 'stressResist', 1.12)],
  ['returning-current', 'Returning Current', 'Transport rises after reconnection.', 'A newly restored route receives a brief current that helps both sides recover exchange.', 8, c('component-just-rejoined', 'conductance', 1.14)],
  ['graft-choice', 'Graft Choice', 'Unlock deliberate component grafting.', 'The player may select one compatible pair of nearby fragments for a bounded reconnection attempt.', 5, u('graftChoice', 'mechanic')],
  ['component-map', 'Component Map', 'Reveal separated living components.', 'The atlas distinguishes genuine islands from quiet tissue without implying invisible links.', 7, u('componentMap', 'information')],
  ['repair-cadence', 'Repair Cadence', 'Unlock connectivity-based repair rules.', 'A saved rule may favor repair only when the visible component count exceeds its threshold.', 9, u('repairCadence', 'automation')],
  ['stillpoint-crown', 'Stillpoint Crown', 'Unlock Continuity mastery for campaign rules.', 'Connection persists as a strategy that can bend, divide, and return without denying extinction.', 14, u('continuityMastery', 'keystone')],
  ['attentive-thread', 'Attentive Thread', 'Join Continuity and Perception mastery.', 'A warning can travel along the same durable paths that later guide reconstruction.', 18, u('continuityPerceptionConfluence', 'connector')],
  ['unbroken-lesson', 'Unbroken Lesson', 'Unlock the capstone and reduce upkeep by 4%.', 'The final continuity rule carries structure between runs while every world still ends honestly.', 26, u('unbrokenLesson', 'capstone', s('maintenance', 0.96))],
]);
