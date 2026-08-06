import { allOf as all, atLeast as n, defineTrophyFamily as family, includes as bits } from './definition.js';
export const REACH_TROPHIES = family('reach', [
  ['coast-touch', 'Coastal Expedition', 'With 42 Evolution cells at Level 1+, reach coast and forest while covering at least 25% of one world.', all(bits('geographyMask', 5), n('peakCoverageBp', 2500), n('skillCount', 42))],
  ['lake-network', 'Lake Constellation', 'With 84 Evolution cells at Level 1+, reach five lakes and eighty shore cells.', all(n('distinctLakesReached', 5), n('lakeShoreCellsReached', 80), n('lakeLivingSeconds', 120), n('skillCount', 84))],
  ['forest-touch', 'Wet Forest Weave', 'With 42 Evolution cells at Level 1+, reach forest and wetland while sustaining 15% coverage.', all(n('forestWetlandWorld', 1), n('sustainedCoverageBp', 1500), n('skillCount', 42))],
  ['highland-touch', 'Canopy to Crown', 'With 64 Evolution cells at Level 1+, reach forest and highland while covering 30% of one world.', all(n('forestHighlandWorld', 1), n('peakCoverageBp', 3000), n('skillCount', 64))],
  ['wetland-touch', 'Living Watershed', 'With 120 Evolution cells at Level 1+, complete four shores and archive lake types and salinities.', all(n('lakeWetlandWorld', 1), n('completeLakeShores', 4), bits('lakeSalinityMask', 7), n('skillCount', 120))],
  ['world-knot', 'Knot Expedition', 'With 84 Evolution cells at Level 1+, reach a World Knot after 1,000 gains.', all(bits('geographyMask', 32), n('reachGains', 1000), n('skillCount', 84))],
  ['whole-atlas', 'Whole-Cell Atlas', 'With 126 Evolution cells at Level 1+, reach all six geography classes and 30% coverage.', all(n('diverseGeographyWorld', 1), n('peakCoverageBp', 3000), n('skillCount', 126))],
  ['coverage-ten', 'Expansive Sphere', 'With 84 Evolution cells at Level 1+, reach 35% peak coverage and five lakes.', all(n('peakCoverageBp', 3500), n('distinctLakesReached', 5), n('skillCount', 84))],
  ['coverage-quarter', 'Great Sphere', 'With 120 Evolution cells at Level 1+, reach 45% peak coverage.', all(n('peakCoverageBp', 4500), n('skillCount', 120))],
  ['coverage-forty', 'Broad Presence', 'With 168 Evolution cells at Level 1+, reach 60% peak coverage.', all(n('peakCoverageBp', 6000), n('skillCount', 168))],
  ['coverage-half', 'Living Dominion', 'With 210 Evolution cells at Level 1+, reach 70% peak coverage with lake morphology.', all(n('peakCoverageBp', 7000), n('lakeMorphologyWorld', 1), n('skillCount', 210))],
  ['sustained-ten', 'Lasting Province', 'With 84 Evolution cells at Level 1+, average 25% coverage after scarcity mastery.', all(n('sustainedCoverageBp', 2500), n('scarcityWorlds', 3), n('skillCount', 84))],
  ['sustained-quarter', 'Lasting Continent', 'With 168 Evolution cells at Level 1+, average 40% coverage with lake ecology.', all(n('sustainedCoverageBp', 4000), n('lakeEcologyWorld', 1), n('skillCount', 168))],
  ['gains-two-fifty', 'Twenty-Two Hundred Arrivals', 'With 84 Evolution cells at Level 1+, record 2,200 Reach gains.', all(n('reachGains', 2200), n('skillCount', 84))],
  ['gains-seven-fifty', 'Thirty-Five Hundred Arrivals', 'With 168 Evolution cells at Level 1+, record 3,500 Reach gains.', all(n('reachGains', 3500), n('skillCount', 168))],
  ['gains-fifteen-hundred', 'Six Thousand Arrivals', 'With all 252 Evolution cells at Level 1+, record 6,000 Reach gains.', all(n('reachGains', 6000), n('skillCount', 252))],
]);
