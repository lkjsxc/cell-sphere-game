import { allOf as all, atLeast as n, defineTrophyFamily as family } from './definition.js';
export const HABITAT_TROPHIES = family('habitat', [
  ['first-lake', 'Lacustrine Arrival', 'Authoritatively colonize at least one whole-cell lake.', n('lakeHabitatCells', 1)],
  ['tundra-footing', 'Tundra Footing', 'Authoritatively colonize at least five tundra cells.', n('tundraHabitatCells', 5)],
  ['cryogenic-footing', 'Cryogenic Footing', 'Authoritatively colonize at least five snow or ice cells.', n('snowHabitatCells', 5)],
  ['brackish-edge', 'Brackish Edge', 'Authoritatively colonize at least five shallow-ocean cells.', n('shallowOceanCells', 5)],
  ['abyssal-first', 'Abyssal First', 'Authoritatively colonize a deep-ocean cell.', n('deepOceanCells', 1)],
  ['three-habitats', 'Three Habitats', 'Occupy three gated habitat classes across completed worlds.', n('habitatClassCount', 3)],
  ['lake-province', 'Lake Province', 'Colonize thirty whole-cell lake cells in one world.', n('lakeHabitatCells', 30)],
  ['tundra-province', 'Tundra Province', 'Colonize thirty tundra cells in one world.', n('tundraHabitatCells', 30)],
  ['ice-province', 'Ice Province', 'Colonize twenty snow or ice cells in one world.', n('snowHabitatCells', 20)],
  ['pelagic-province', 'Pelagic Province', 'Colonize fifty shallow-ocean cells in one world.', n('shallowOceanCells', 50)],
  ['abyssal-province', 'Abyssal Province', 'Colonize twenty deep-ocean cells in one world.', n('deepOceanCells', 20)],
  ['scarcity-witness', 'Scarcity Witness', 'Complete three worlds with finite local reserve exhaustion.', n('scarcityWorlds', 3)],
  ['spent-landscape', 'Spent Landscape', 'Exhaust long-term stock in at least five thousand whole cells across completed worlds.', n('resourceDepletedCells', 5000)],
  ['autonomous-patience', 'Autonomous Patience', 'Complete twelve worlds without any mid-run decision authority.', n('autonomousWorlds', 12)],
  ['quiet-onboarding', 'Quiet Onboarding', 'Complete both scarcity-era worlds with zero harmful events.', n('zeroEventWorlds', 2)],
  ['living-world-habitats', 'Living World Habitats', 'Reach one million SCORE after occupying all five gated habitat classes.', all(n('bestScore', 1000000), n('habitatClassCount', 5))],
]);
