import { atLeast as n, defineTrophyFamily as family } from './definition.js';
export const EVOLUTION_TROPHIES = family('evolution', [
  ['first-world', 'First Extinction', 'Complete one world.', n('runs', 1)],
  ['four-worlds', 'First Cycle', 'Complete four worlds.', n('runs', 4)],
  ['ten-worlds', 'Ten Worlds', 'Complete ten worlds.', n('runs', 10)],
  ['twenty-five-worlds', 'Twenty-Five Worlds', 'Complete twenty-five worlds.', n('runs', 25)],
  ['fifty-worlds', 'Fifty Worlds', 'Complete fifty worlds.', n('runs', 50)],
  ['hundred-worlds', 'Hundred Worlds', 'Complete one hundred worlds.', n('runs', 100)],
  ['gate-horizon', 'Observed Horizon', 'Complete 164 worlds.', n('runs', 164)],
  ['first-skill', 'First Skill Cell', 'Own one permanent Skill Cell.', n('skillCount', 1)],
  ['six-branches', 'Six Living Lessons', 'Own at least one Skill Cell in every branch.', n('skillBranchCount', 6)],
  ['thirty-two-skills', 'Thirty-Two Skills', 'Own 32 permanent Skill Cells.', n('skillCount', 32)],
  ['authored-landmarks', 'Hundred Eight Landmarks', 'Own 108 permanent Skill Cells.', n('skillCount', 108)],
  ['half-globe', 'Half Evolution', 'Own 324 permanent Skill Cells.', n('skillCount', 324)],
  ['whole-globe', 'Whole Evolution', 'Own all 642 permanent Skill Cells.', n('skillCount', 642)],
  ['thousand-echoes', 'Thousand Echoes', 'Earn 1,000 lifetime Echoes.', n('totalEchoes', 1000)],
  ['first-imprint', 'First Imprint', 'Preserve one morphology Imprint.', n('imprintCount', 1)],
  ['imprint-ring', 'Eight Imprints', 'Fill the eight-Imprint retention ring.', n('imprintCount', 8)],
]);
