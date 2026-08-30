import { allOf as all, atLeast as n, defineTrophyFamily as family } from './definition.js';
/** Network-form trophies scale to the authored 42-skill Evolution catalog. */
export const FORM_TROPHIES = family('form', [
  ['first-loop', 'Enduring Circuit', 'With seven Evolution cells, sustain lake-centered loops with fifty surplus edges.', all(n('loopSurplusPeak', 50), n('lakeLoopSeconds', 120), n('skillCount', 7))],
  ['first-split', 'Surviving Fracture', 'With seven Evolution cells, split twice and regrow 300 cells.', all(n('splits', 2), n('regrowth', 300), n('skillCount', 7))],
  ['first-reconnection', 'Mended Scar', 'With eleven Evolution cells, reconnect twice and regrow 500 cells.', all(n('reconnections', 2), n('regrowth', 500), n('skillCount', 11))],
  ['break-and-mend', 'Break and Mend', 'With eleven Evolution cells, split and reconnect at least three times each.', all(n('splits', 3), n('reconnections', 3), n('skillCount', 11))],
  ['two-splits', 'Repeated Fracture', 'With fourteen Evolution cells, split five times while retaining 30% peak coverage.', all(n('splits', 5), n('peakCoverageBp', 3000), n('skillCount', 14))],
  ['two-reconnections', 'Repeated Repair', 'With sixteen Evolution cells, reconnect five times and regrow 1,000 cells.', all(n('reconnections', 5), n('regrowth', 1000), n('skillCount', 16))],
  ['first-regrowth', 'Scar Garden', 'With eighteen Evolution cells, regrow 1,200 cells while reaching 30% peak coverage.', all(n('regrowth', 1200), n('peakCoverageBp', 3000), n('skillCount', 18))],
  ['regrowth-hundred', 'Scar Province', 'With twenty-one Evolution cells, accumulate 20,000 regrowth gains.', all(n('totalRegrowth', 20000), n('skillCount', 21))],
  ['reconnection-growth', 'Joining Growth', 'With twenty-one Evolution cells, reconnect eight times and regrow 2,000 cells.', all(n('reconnections', 8), n('regrowth', 2000), n('skillCount', 21))],
  ['reconnection-fifty', 'Reconnection Province', 'With twenty-eight Evolution cells, reconnect twelve times and regrow 3,000 cells.', all(n('reconnections', 12), n('regrowth', 3000), n('skillCount', 28))],
  ['frontier-hundred', 'Frontier Province', 'With twenty-one Evolution cells, gain 1,500 frontier cells.', all(n('frontierGrowth', 1500), n('skillCount', 21))],
  ['frontier-five-hundred', 'Frontier Archive', 'With twenty-eight Evolution cells, accumulate 100,000 Reach gains.', all(n('totalReachGains', 100000), n('skillCount', 28))],
  ['adapted-growth', 'Learned Expansion', 'With twenty-eight Evolution cells, record gated-habitat Reach gains.', all(n('habitatClassCount', 3), n('reachGains', 4000), n('skillCount', 28))],
  ['skill-recovery', 'Inherited Recovery', 'With thirty-five Evolution cells, regrow 4,000 cells in one World.', all(n('regrowth', 4000), n('skillCount', 35))],
  ['coherent-majority', 'Coherent Majority', 'With twenty-eight Evolution cells, reach 60% coverage while connected.', all(n('coherentMajority', 1), n('peakCoverageBp', 6000), n('skillCount', 28))],
  ['unbroken-majority', 'Unbroken Majority', 'With thirty-five Evolution cells, split, reconnect, and retain strong majority connectivity.', all(n('unbrokenMajority', 1), n('peakCoverageBp', 6000), n('skillCount', 35))],
]);
