import { allOf as all, atLeast as n, defineTrophyFamily as family, includes as bits } from './definition.js';
export const REACH_TROPHIES = family('reach', [
  ['coast-touch', 'Coastal Expedition', 'With 64 Skills owned, reach coast and forest while covering at least 35% of one world.', all(bits('geographyMask', 5), n('peakCoverageBp', 3500), n('skillCount', 64))],
  ['lake-network', 'Lake Constellation', 'With 256 Skills, reach seven lakes and 220 shores, then live around a large lake for 180 seconds.', all(n('distinctLakesReached', 7), n('lakeShoreCellsReached', 220), n('lakeLivingSeconds', 300), n('largeLakeLivingSeconds', 180), n('skillCount', 256))],
  ['forest-touch', 'Wet Forest Weave', 'With 96 Skills owned, reach forest and wetland while sustaining at least 20% world coverage.', all(n('forestWetlandWorld', 1), n('sustainedCoverageBp', 2000), n('skillCount', 96))],
  ['highland-touch', 'Canopy to Crown', 'With 128 Skills owned, reach forest and highland while covering at least 35% of one world.', all(n('forestHighlandWorld', 1), n('peakCoverageBp', 3500), n('skillCount', 128))],
  ['wetland-touch', 'Living Watershed', 'With 320 Skills, complete six shores, reach 230 shore cells, and archive all lake types and salinities.', all(n('lakeWetlandWorld', 1), n('completeLakeShores', 6), all(bits('lakeTypeMask', 31), bits('lakeSalinityMask', 7)), n('lakeShoreCellsReached', 230), n('skillCount', 320))],
  ['world-knot', 'Knot Expedition', 'With 160 Skills owned, reach a World Knot after 2,200 gains and 200 lake-centered seconds.', all(bits('geographyMask', 32), n('reachGains', 2200), n('lakeLivingSeconds', 200), n('skillCount', 160))],
  ['whole-atlas', 'Whole-Cell Atlas', 'With 192 Skills owned, reach all six geography classes and at least 30% coverage in one world.', all(n('diverseGeographyWorld', 1), n('peakCoverageBp', 3000), n('skillCount', 192))],
  ['coverage-ten', 'Expansive Sphere', 'With 224 Skills owned, reach 35% peak coverage while visiting at least five distinct lakes.', all(n('peakCoverageBp', 3500), n('distinctLakesReached', 5), n('skillCount', 224))],
  ['coverage-quarter', 'Great Sphere', 'With 320 Skills, reach 45% peak coverage after linking forest and highland ecology.', all(n('peakCoverageBp', 4500), n('forestHighlandWorld', 1), n('skillCount', 320))],
  ['coverage-forty', 'Broad Presence', 'With 384 Skills, reach 60% peak coverage after completing the whole-cell atlas.', all(n('peakCoverageBp', 6000), n('diverseGeographyWorld', 1), n('skillCount', 384))],
  ['coverage-half', 'Living Dominion', 'With 448 Skills, reach 75% peak coverage with sustained lake-centered morphology.', all(n('peakCoverageBp', 7500), n('lakeMorphologyWorld', 1), n('skillCount', 448))],
  ['sustained-ten', 'Lasting Province', 'With 256 Skills, average 25% coverage while resolving all five Adaptation offers.', all(n('sustainedCoverageBp', 2500), n('allOffersResolved', 1), n('skillCount', 256))],
  ['sustained-quarter', 'Lasting Continent', 'With 384 Skills, average 40% coverage with demanding lake-centered ecology.', all(n('sustainedCoverageBp', 4000), n('lakeEcologyWorld', 1), n('skillCount', 384))],
  ['gains-two-fifty', 'Twenty-Two Hundred Arrivals', 'With 256 Skills, record 2,200 Reach gains and at least 25% peak coverage.', all(n('reachGains', 2200), n('peakCoverageBp', 2500), n('skillCount', 256))],
  ['gains-seven-fifty', 'Thirty-Five Hundred Arrivals', 'With 384 Skills, record 3,500 Reach gains while forming a loop surplus of 300.', all(n('reachGains', 3500), n('loopSurplusPeak', 300), n('skillCount', 384))],
  ['gains-fifteen-hundred', 'Six Thousand Arrivals', 'With 512 Skills, record 6,000 Reach gains and at least 50% peak coverage.', all(n('reachGains', 6000), n('peakCoverageBp', 5000), n('skillCount', 512))],
]);
