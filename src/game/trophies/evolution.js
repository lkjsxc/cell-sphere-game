import { allOf as all, atLeast as n, defineTrophyFamily as family, includes as bits } from './definition.js';
export const EVOLUTION_TROPHIES = family('evolution', [
  ['first-world', 'First Extinction', 'Complete one autonomous world; this is the single onboarding Trophy.', n('runs', 1)],
  ['four-worlds', 'First Cycle', 'Complete four autonomous worlds.', n('runs', 4)],
  ['ten-worlds', 'Ten Worlds', 'Complete ten worlds.', n('runs', 10)],
  ['twenty-five-worlds', 'Twenty-Five Worlds', 'Complete 25 worlds and unlock at least twelve Evolution cells to Level 1+.', all(n('runs', 25), n('skillCount', 12))],
  ['fifty-worlds', 'Fifty Worlds', 'Complete 50 worlds and unlock at least 42 Evolution cells to Level 1+.', all(n('runs', 50), n('skillCount', 42))],
  ['hundred-worlds', 'Hundred Worlds', 'Complete 100 worlds after enduring all seven crisis families.', all(n('runs', 100), bits('crisisMask', 127))],
  ['gate-horizon', 'Long Horizon', 'Complete 240 worlds after earning at least 4,000 lifetime Echoes.', all(n('runs', 240), n('totalEchoes', 4000))],
  ['first-skill', 'First Inheritance', 'Unlock one permanent Evolution cell to Level 1.', n('skillCount', 1)],
  ['six-branches', 'Six Living Lessons', 'Unlock at least one Evolution cell in every affinity.', n('skillBranchCount', 6)],
  ['thirty-two-skills', 'Twelve Cells', 'Unlock 12 permanent Evolution cells through physical adjacency.', n('skillCount', 12)],
  ['authored-landmarks', 'One Territory', 'Unlock 42 permanent Evolution cells, equal to one affinity territory.', n('skillCount', 42)],
  ['half-globe', 'One-Third Breadth', 'Unlock 84 permanent Evolution cells to Level 1+.', n('skillCount', 84)],
  ['whole-globe', 'Breadth Complete', 'Unlock all 252 Evolution cells to Level 1+; later levels remain unlimited.', n('skillCount', 252)],
  ['thousand-echoes', 'Four Thousand Echoes', 'Earn 4,000 lifetime Echoes.', n('totalEchoes', 4000)],
  ['first-imprint', 'Imprint Practice', 'Preserve at least four Imprints after completing eight worlds.', all(n('imprintCount', 4), n('runs', 8))],
  ['imprint-ring', 'Seasoned Imprint Ring', 'Fill the eight-Imprint ring after completing 25 worlds.', all(n('imprintCount', 8), n('runs', 25))],
]);
