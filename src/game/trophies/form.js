import { allOf as all, atLeast as n, defineTrophyFamily as family } from './definition.js';
export const FORM_TROPHIES = family('form', [
  ['first-loop', 'Enduring Circuit', 'With 42 Skills, sustain lake-centered loops with fifty surplus edges.', all(n('loopSurplusPeak', 50), n('lakeLoopSeconds', 120), n('skillCount', 42))],
  ['first-split', 'Surviving Fracture', 'With 42 Skills, split twice and regrow 300 cells.', all(n('splits', 2), n('regrowth', 300), n('skillCount', 42))],
  ['first-reconnection', 'Mended Scar', 'With 64 Skills, reconnect twice and regrow 500 cells.', all(n('reconnections', 2), n('regrowth', 500), n('skillCount', 64))],
  ['break-and-mend', 'Break and Mend', 'With 64 Skills, split and reconnect at least three times each.', all(n('splits', 3), n('reconnections', 3), n('skillCount', 64))],
  ['two-splits', 'Repeated Fracture', 'With 84 Skills, split five times while retaining 30% peak coverage.', all(n('splits', 5), n('peakCoverageBp', 3000), n('skillCount', 84))],
  ['two-reconnections', 'Repeated Repair', 'With 96 Skills, reconnect five times and regrow 1,000 cells.', all(n('reconnections', 5), n('regrowth', 1000), n('skillCount', 96))],
  ['first-regrowth', 'Scar Garden', 'With 108 Skills, regrow 1,200 cells while reaching 30% peak coverage.', all(n('regrowth', 1200), n('peakCoverageBp', 3000), n('skillCount', 108))],
  ['regrowth-hundred', 'Scar Province', 'With 126 Skills, accumulate 20,000 regrowth gains.', all(n('totalRegrowth', 20000), n('skillCount', 126))],
  ['reconnection-growth', 'Joining Growth', 'With 126 Skills, reconnect eight times and regrow 2,000 cells.', all(n('reconnections', 8), n('regrowth', 2000), n('skillCount', 126))],
  ['reconnection-fifty', 'Reconnection Province', 'With 168 Skills, reconnect twelve times and regrow 3,000 cells.', all(n('reconnections', 12), n('regrowth', 3000), n('skillCount', 168))],
  ['frontier-hundred', 'Frontier Province', 'With 126 Skills, gain 1,500 frontier cells.', all(n('frontierGrowth', 1500), n('skillCount', 126))],
  ['frontier-five-hundred', 'Frontier Archive', 'With 168 Skills, accumulate 100,000 Reach gains.', all(n('totalReachGains', 100000), n('skillCount', 168))],
  ['adapted-growth', 'Learned Expansion', 'With 168 Skills, record 4,000 Reach gains across gated habitats.', all(n('habitatClassCount', 3), n('reachGains', 4000), n('skillCount', 168))],
  ['skill-recovery', 'Inherited Recovery', 'With 210 Skills, regrow 4,000 cells in one world.', all(n('regrowth', 4000), n('skillCount', 210))],
  ['coherent-majority', 'Coherent Majority', 'With 168 Skills, reach 60% coverage while retaining coherent connectivity.', all(n('coherentMajority', 1), n('peakCoverageBp', 6000), n('skillCount', 168))],
  ['unbroken-majority', 'Unbroken Majority', 'With 210 Skills, split, reconnect, and retain strong majority connectivity.', all(n('unbrokenMajority', 1), n('peakCoverageBp', 6000), n('skillCount', 210))],
]);
