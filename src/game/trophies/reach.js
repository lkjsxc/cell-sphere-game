import { allOf as all, atLeast as n, defineTrophyFamily as family, includes as bits } from './definition.js';
/** Reach trophies scale to the authored 42-skill Evolution catalog. */
export const REACH_TROPHIES = family('reach', [
  ['coast-touch', 'Coastal Expedition', 'With seven Evolution cells, reach coast and forest while covering one quarter of a World.', all(bits('geographyMask', 5), n('peakCoverageBp', 2500), n('skillCount', 7))],
  ['lake-network', 'Lake Constellation', 'With fourteen Evolution cells, reach five lakes and eighty shore cells.', all(n('distinctLakesReached', 5), n('lakeShoreCellsReached', 80), n('lakeLivingSeconds', 120), n('skillCount', 14))],
  ['forest-touch', 'Wet Forest Weave', 'With seven Evolution cells, reach forest and wetland while sustaining 15% coverage.', all(n('forestWetlandWorld', 1), n('sustainedCoverageBp', 1500), n('skillCount', 7))],
  ['highland-touch', 'Canopy to Crown', 'With eleven Evolution cells, reach forest and highland while covering 30% of a World.', all(n('forestHighlandWorld', 1), n('peakCoverageBp', 3000), n('skillCount', 11))],
  ['wetland-touch', 'Living Watershed', 'With twenty Evolution cells, complete four shores and archive lake types and salinities.', all(n('lakeWetlandWorld', 1), n('completeLakeShores', 4), bits('lakeSalinityMask', 7), n('skillCount', 20))],
  ['world-knot', 'Knot Expedition', 'With fourteen Evolution cells, reach a World Knot after 1,000 gains.', all(bits('geographyMask', 32), n('reachGains', 1000), n('skillCount', 14))],
  ['whole-atlas', 'Whole-Cell Sphere', 'With twenty-one Evolution cells, reach all six geography classes and 30% coverage.', all(n('diverseGeographyWorld', 1), n('peakCoverageBp', 3000), n('skillCount', 21))],
  ['coverage-ten', 'Expansive Sphere', 'With fourteen Evolution cells, reach 35% peak coverage and five lakes.', all(n('peakCoverageBp', 3500), n('distinctLakesReached', 5), n('skillCount', 14))],
  ['coverage-quarter', 'Great Sphere', 'With twenty Evolution cells, reach 45% peak coverage.', all(n('peakCoverageBp', 4500), n('skillCount', 20))],
  ['coverage-forty', 'Broad Presence', 'With twenty-eight Evolution cells, reach 60% peak coverage.', all(n('peakCoverageBp', 6000), n('skillCount', 28))],
  ['coverage-half', 'Living Dominion', 'With thirty-five Evolution cells, reach 70% peak coverage with lake morphology.', all(n('peakCoverageBp', 7000), n('lakeMorphologyWorld', 1), n('skillCount', 35))],
  ['sustained-ten', 'Lasting Province', 'With fourteen Evolution cells, average 25% coverage after Scarcity work.', all(n('sustainedCoverageBp', 2500), n('scarcityWorlds', 3), n('skillCount', 14))],
  ['sustained-quarter', 'Lasting Continent', 'With twenty-eight Evolution cells, average 40% coverage with lake ecology.', all(n('sustainedCoverageBp', 4000), n('lakeEcologyWorld', 1), n('skillCount', 28))],
  ['gains-two-fifty', 'Twenty-Two Hundred Arrivals', 'With fourteen Evolution cells, record 2,200 Reach gains.', all(n('reachGains', 2200), n('skillCount', 14))],
  ['gains-seven-fifty', 'Thirty-Five Hundred Arrivals', 'With twenty-eight Evolution cells, record 3,500 Reach gains.', all(n('reachGains', 3500), n('skillCount', 28))],
  ['gains-fifteen-hundred', 'Six Thousand Arrivals', 'With all forty-two Evolution cells, record 6,000 Reach gains.', all(n('reachGains', 6000), n('skillCount', 42))],
]);
