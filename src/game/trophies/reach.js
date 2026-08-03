import { atLeast as n, defineTrophyFamily as family, includes as bits } from './definition.js';
export const REACH_TROPHIES = family('reach', [
  ['coast-touch', 'Tidal Margin', 'Reach a coastal cell in one completed world.', bits('geographyMask', 1)],
  ['river-touch', 'River Listener', 'Reach a river cell in one completed world.', bits('geographyMask', 2)],
  ['forest-touch', 'Understory Thread', 'Reach a forest cell in one completed world.', bits('geographyMask', 4)],
  ['highland-touch', 'Highland Hold', 'Reach a highland or mountain cell.', bits('geographyMask', 8)],
  ['wetland-touch', 'Wetland Footing', 'Reach a wetland cell in one completed world.', bits('geographyMask', 16)],
  ['world-knot', 'World Knot', 'Reach one of the sphere’s fivefold cells.', bits('geographyMask', 32)],
  ['whole-atlas', 'Whole Atlas', 'Reach all six geography classes across completed worlds.', bits('geographyMask', 63)],
  ['coverage-ten', 'First Continent', 'Reach at least 10% peak world coverage.', n('peakCoverageBp', 1000)],
  ['coverage-quarter', 'Quarter World', 'Reach at least 25% peak world coverage.', n('peakCoverageBp', 2500)],
  ['coverage-forty', 'Broad Presence', 'Reach at least 40% peak world coverage.', n('peakCoverageBp', 4000)],
  ['coverage-half', 'Living Hemisphere', 'Reach at least 50% peak world coverage.', n('peakCoverageBp', 5000)],
  ['sustained-ten', 'Lasting Foothold', 'Average at least 10% coverage through one world.', n('sustainedCoverageBp', 1000)],
  ['sustained-quarter', 'Lasting Quarter', 'Average at least 25% coverage through one world.', n('sustainedCoverageBp', 2500)],
  ['gains-two-fifty', 'Two Hundred Fifty Arrivals', 'Record 250 Reach gains in one completed world.', n('reachGains', 250)],
  ['gains-seven-fifty', 'Seven Hundred Fifty Arrivals', 'Record 750 Reach gains in one completed world.', n('reachGains', 750)],
  ['gains-fifteen-hundred', 'Fifteen Hundred Arrivals', 'Record 1,500 Reach gains in one completed world.', n('reachGains', 1500)],
]);
