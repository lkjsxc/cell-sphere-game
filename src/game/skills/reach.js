import { conditional as c, defineBranch, scalar as s, unlock as u } from './node.js';

export const REACH_MEMORY = defineBranch('reach', 'continuity-stillpoint-crown', [
  ['horizon-instinct', 'Horizon Instinct', 'Frontiers advance 6% more readily.', 'The network remembers the texture of promising ground before committing a new tip.', 2, s('reach', 1.06)],
  ['tender-runners', 'Tender Runners', 'New tips advance 2% more readily.', 'Fine exploratory runners test nearby cells without turning every trial into a trunk.', 3, s('reach', 1.02)],
  ['frugal-budding', 'Frugal Budding', 'Expansion costs 2% less energy.', 'A remembered budding rhythm spends less stored energy on each outward step.', 3, s('growCost', 0.98)],
  ['sunward-bias', 'Sunward Bias', 'Frontiers advance 3% more readily.', 'Growing margins retain a weak directional bias toward hospitable open territory.', 4, s('reach', 1.03)],
  ['hollow-stems', 'Hollow Stems', 'Expansion costs 3% less energy.', 'Young corridors remain light until traffic proves that reinforcement is worthwhile.', 4, s('growCost', 0.97)],
  ['rooted-return', 'Rooted Return', 'Regrowth into scars is 4% stronger.', 'Surviving edges guide fresh tissue back through recently abandoned cells.', 4, s('regrow', 1.04)],
  ['many-pointed-front', 'Many-Pointed Front', 'Each cell may support one extra expansion.', 'The frontier divides attention among more viable tips instead of betting on one route.', 5, s('growthCap', 1, 'add')],
  ['forager-memory', 'Forager Memory', 'Nutrient uptake rises by 3%.', 'Explorers remember which terrain rewarded early movement and feed while advancing.', 6, s('uptake', 1.03)],
  ['empty-quarter', 'The Empty Quarter', 'Reach rises while coverage is below 25%.', 'Sparse worlds invite a decisive opening spread before crowding changes the calculus.', 5, c('coverage-below-25', 'reach', 1.08)],
  ['broken-horizon', 'Broken Horizon', 'Regrowth strengthens after fragmentation.', 'A divided network treats old scars as signposts toward separated living islands.', 6, c('components-above-one', 'regrow', 1.12)],
  ['last-open-cell', 'Last Open Cell', 'Expansion becomes cheaper near saturation.', 'Crowded frontiers fold through the few remaining gaps instead of wasting broad probes.', 7, c('coverage-above-70', 'growCost', 0.90)],
  ['storm-runners', 'Storm Runners', 'Reach rises during an active crisis.', 'Threatened margins sprint beyond the disturbance before reinforcing their escape.', 8, c('crisis-active', 'reach', 1.10)],
  ['pathfinder-strain', 'Pathfinder Strain', 'Unlock the Pathfinder starting morphology.', 'A long-fronted strain can be selected for worlds where early territory matters most.', 5, u('pathfinderStrain', 'mechanic')],
  ['frontier-forecast', 'Frontier Forecast', 'Reveal projected frontier pressure.', 'The atlas exposes a compact forecast of where expansion is likely to stall next.', 7, u('frontierForecast', 'information')],
  ['patient-inoculation', 'Patient Inoculation', 'Unlock deliberate auto-inoculation.', 'A chosen opening rule may inoculate only after the world matches its saved conditions.', 9, u('patientInoculation', 'automation')],
  ['horizon-crown', 'Horizon Crown', 'Unlock Reach mastery for campaign rules.', 'Every explored boundary becomes a remembered option rather than a discarded attempt.', 14, u('reachMastery', 'keystone')],
  ['far-current', 'Far Current', 'Join Reach and Continuity mastery.', 'Exploration learns to leave a durable thread back to the tissue that launched it.', 18, u('reachContinuityConfluence', 'connector')],
  ['world-seeder', 'World Seeder', 'Unlock the World Seeder capstone.', 'A complete atlas of outward motion opens the campaign rule for seeded frontiers.', 26, u('worldSeeder', 'capstone')],
]);
