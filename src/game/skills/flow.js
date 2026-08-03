import { conditional as c, defineBranch, scalar as s, unlock as u } from './node.js';

export const FLOW_MEMORY = defineBranch('flow', 'reach-horizon-crown', [
  ['channel-imprint', 'Channel Imprint', 'Transport capacity rises by 8%.', 'The strongest routes retain the shape of past traffic and carry more from the first pulse.', 3, s('conductance', 1.08)],
  ['pliant-veins', 'Pliant Veins', 'Transport capacity rises by 3%.', 'Soft young channels widen under useful traffic before mineralizing into fixed routes.', 3, s('conductance', 1.03)],
  ['rhythmic-thickening', 'Rhythmic Thickening', 'Flux reinforcement rises by 3%.', 'Repeated pulses leave measured layers instead of brittle knots around busy edges.', 3, s('reinforce', 1.03)],
  ['quiet-junctions', 'Quiet Junctions', 'Network upkeep falls by 2%.', 'Junctions share pressure cleanly, reducing energy lost where several routes meet.', 4, s('maintenance', 0.98)],
  ['capillary-feast', 'Capillary Feast', 'Nutrient uptake rises by 3%.', 'Fine channels collect diffuse food while larger vessels remain focused on transfer.', 4, s('uptake', 1.03)],
  ['elastic-conduits', 'Elastic Conduits', 'Transport capacity rises by 4%.', 'Corridors stretch their useful width across changing demand without immediate decay.', 4, s('conductance', 1.04)],
  ['load-bearing-flux', 'Load-Bearing Flux', 'Flux reinforcement rises by 5%.', 'Sustained movement becomes structural evidence, preserving only routes that work.', 5, s('reinforce', 1.05)],
  ['reclaimed-pressure', 'Reclaimed Pressure', 'Expansion costs 3% less energy.', 'Pressure released from pruning is redirected into the next viable growth step.', 6, s('growCost', 0.97)],
  ['thin-stream-rescue', 'Thin-Stream Rescue', 'Reinforcement rises when connectivity is low.', 'Weakly connected tissue thickens the few corridors still carrying useful exchange.', 5, c('connectivity-below-45', 'reinforce', 1.12)],
  ['floodplain-network', 'Floodplain Network', 'Transport rises during nutrient blooms.', 'Temporary abundance spreads through spare channels before a single route can monopolize it.', 6, c('nutrient-bloom-active', 'conductance', 1.10)],
  ['pressure-release', 'Pressure Release', 'Upkeep falls while energy is below 20%.', 'A starving network relaxes low-value channels without abandoning its living backbone.', 7, c('energy-below-20', 'maintenance', 0.90)],
  ['crisis-pulse', 'Crisis Pulse', 'Reinforcement rises during an active crisis.', 'A coherent pulse marks escape routes while the disturbance is still unfolding.', 8, c('crisis-active', 'reinforce', 1.12)],
  ['weir-control', 'Weir Control', 'Unlock manual transport priorities.', 'The player may designate one corridor class to receive reinforcement before its peers.', 5, u('weirControl', 'mechanic')],
  ['flux-reading', 'Flux Reading', 'Reveal route throughput bands.', 'The atlas separates idle, useful, and overloaded corridors without inventing precision.', 7, u('fluxReading', 'information')],
  ['pulse-keeper', 'Pulse Keeper', 'Unlock threshold-based flow tending.', 'A saved rule may tend overloaded channels when visible pressure crosses its threshold.', 9, u('pulseKeeper', 'automation')],
  ['river-crown', 'River Crown', 'Unlock Flow mastery for campaign rules.', 'Transport, reinforcement, and pruning become one remembered circulation discipline.', 14, u('flowMastery', 'keystone')],
  ['running-horizon', 'Running Horizon', 'Join Flow and Reach mastery.', 'Every outward probe carries a measured current back through the route that justified it.', 18, u('flowReachConfluence', 'connector')],
  ['planetary-circulation', 'Planetary Circulation', 'Unlock the Planetary Circulation capstone.', 'A world-spanning current becomes an explicit late-campaign rule rather than a hidden bonus.', 26, u('planetaryCirculation', 'capstone')],
]);
