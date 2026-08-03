import { allOf as all, atLeast as n, defineTrophyFamily as family, includes as bits } from './definition.js';
export const ADAPTATION_TROPHIES = family('adaptation', [
  ['first-choice', 'Practiced Change', 'Resolve 20 Adaptations and discover at least eight distinct cards across worlds.', all(n('totalAdaptationsSelected', 20), n('adaptationCardCount', 8))],
  ['manual-choice', 'Deliberate Practice', 'Complete two worlds with at least three Manual choices and make eight Manual selections total.', all(n('worldsWithManual', 2), n('totalManualSelections', 8))],
  ['automatic-choice', 'Delegated Practice', 'Complete two worlds with at least three Automatic choices and receive eight Automatic selections total.', all(n('worldsWithAuto', 2), n('totalRandomSelections', 8))],
  ['three-choices', 'Twelve Worlds of Change', 'Resolve 60 Adaptations across completed worlds.', n('totalAdaptationsSelected', 60)],
  ['five-choices', 'Expansive Organism', 'Resolve all five offers and reach at least 35% coverage in one world.', all(n('allOffersResolved', 1), n('peakCoverageBp', 3500))],
  ['nothing-pending', 'Twelve Complete Queues', 'Finish twelve worlds with all five Adaptation offers resolved.', n('worldsAllOffers', 12)],
  ['three-manual', 'Manual Mastery', 'Complete 80 Manual worlds and reach a SCORE of 750,000.', all(n('worldsWithManual', 80), n('bestScore', 750000))],
  ['five-random', 'Automatic Mastery', 'Complete 80 Automatic worlds and reach a SCORE of 750,000.', all(n('worldsWithAuto', 80), n('bestScore', 750000))],
  ['reach-category', 'Reach Discipline', 'Discover all six Reach cards, raise Reach to 42%, and own 128 Skills.', all(n('reachCardCount', 6), n('reachAxisBp', 4200), n('skillCount', 128))],
  ['metabolism-category', 'Metabolism Discipline', 'Discover all six Metabolism cards, raise Efficiency to 42%, and own 192 Skills.', all(n('metabolismCardCount', 6), n('efficiencyAxisBp', 4200), n('skillCount', 192))],
  ['resilience-category', 'Resilience Discipline', 'Discover six Resilience cards, all crisis families, and own 256 Skills.', all(n('resilienceCardCount', 6), bits('crisisMask', 127), n('skillCount', 256))],
  ['transport-category', 'Transport Discipline', 'Discover all five Transport cards, a loop surplus of 20, and own 324 Skills.', all(n('transportCardCount', 5), n('loopSurplusPeak', 20), n('skillCount', 324))],
  ['symbiosis-category', 'Symbiosis Discipline', 'Discover all four Symbiosis cards, sustain 15% coverage, and own 448 Skills.', all(n('symbiosisCardCount', 4), n('sustainedCoverageBp', 1500), n('skillCount', 448))],
  ['memory-category', 'Memory Discipline', 'Discover both Memory cards and own at least 512 Evolution Skill Cells.', all(n('memoryCardCount', 2), n('skillCount', 512))],
  ['all-categories-world', 'Whole Organism', 'Represent all six categories in one world after 500 total Adaptation selections.', all(n('allAdaptationCategoriesWorld', 1), n('totalAdaptationsSelected', 500))],
  ['all-cards', 'Complete Adaptation Archive', 'Discover all 24 cards after 60 practiced Manual and Automatic worlds each.', all(n('adaptationCardCount', 24), n('worldsWithManual', 60), n('worldsWithAuto', 60))],
]);
