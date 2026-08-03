import { allOf as all, atLeast as n, defineTrophyFamily as family } from './definition.js';
export const FORM_TROPHIES = family('form', [
  ['first-loop', 'Enduring Circuit', 'With 64 Skills owned, sustain lake-centered loops for 300 seconds with 400 surplus edges.', all(n('loopSurplusPeak', 400), n('lakeLoopSeconds', 300), n('skillCount', 64))],
  ['first-split', 'Surviving Fracture', 'With 96 Skills owned, split four times, regrow 1,200 cells, and survive 330 seconds.', all(n('splits', 4), n('regrowth', 1200), n('survivalSeconds', 330), n('skillCount', 96))],
  ['first-reconnection', 'Mended Scar', 'With 128 Skills owned, reconnect three times and regrow 1,200 lost cells in one world.', all(n('reconnections', 3), n('regrowth', 1200), n('skillCount', 128))],
  ['break-and-mend', 'Break and Mend', 'With 64 Skills owned, split and reconnect at least five times each in one world.', all(n('splits', 5), n('reconnections', 5), n('skillCount', 64))],
  ['two-splits', 'Repeated Fracture', 'With 160 Skills owned, split eight times while retaining 35% peak coverage.', all(n('splits', 8), n('peakCoverageBp', 3500), n('skillCount', 160))],
  ['two-reconnections', 'Repeated Repair', 'With 192 Skills owned, reconnect eight times and regrow 2,000 cells in one world.', all(n('reconnections', 8), n('regrowth', 2000), n('skillCount', 192))],
  ['first-regrowth', 'Scar Garden', 'With 224 Skills owned, regrow 1,200 lost cells while reaching at least 30% peak coverage.', all(n('regrowth', 1200), n('peakCoverageBp', 3000), n('skillCount', 224))],
  ['regrowth-hundred', 'Scar Province', 'With 324 Skills, accumulate 40,000 regrowth gains across completed worlds.', all(n('totalRegrowth', 40000), n('skillCount', 324))],
  ['reconnection-growth', 'Joining Growth', 'With 256 Skills, reconnect ten times and regrow 2,500 cells in one world.', all(n('reconnections', 10), n('regrowth', 2500), n('skillCount', 256))],
  ['reconnection-fifty', 'Reconnection Province', 'With 384 Skills, reconnect twenty times and regrow 4,000 cells in one world.', all(n('reconnections', 20), n('regrowth', 4000), n('skillCount', 384))],
  ['frontier-hundred', 'Frontier Province', 'With 256 Skills, gain 1,500 frontier cells and reach forest-highland ecology.', all(n('frontierGrowth', 1500), n('forestHighlandWorld', 1), n('skillCount', 256))],
  ['frontier-five-hundred', 'Frontier Archive', 'With 384 Skills, accumulate 150,000 Reach gains across completed worlds.', all(n('totalReachGains', 150000), n('skillCount', 384))],
  ['adapted-growth', 'Learned Expansion', 'With 320 Skills, represent all Adaptation categories and record 4,000 Reach gains.', all(n('allAdaptationCategoriesWorld', 1), n('reachGains', 4000), n('skillCount', 320))],
  ['skill-recovery', 'Inherited Recovery', 'With 448 Skills, regrow 5,000 lost cells in one completed world.', all(n('regrowth', 5000), n('skillCount', 448))],
  ['coherent-majority', 'Coherent Majority', 'With 324 Skills, reach 60% coverage while retaining 80% majority connectivity.', all(n('coherentMajority', 1), n('peakCoverageBp', 6000), n('skillCount', 324))],
  ['unbroken-majority', 'Unbroken Majority', 'With 448 Skills, split, reconnect, and retain 95% connectivity beyond 60% coverage.', all(n('unbrokenMajority', 1), n('peakCoverageBp', 6000), n('skillCount', 448))],
]);
