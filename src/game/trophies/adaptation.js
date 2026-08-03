import { atLeast as n, defineTrophyFamily as family, includes as bits } from './definition.js';
export const ADAPTATION_TROPHIES = family('adaptation', [
  ['first-choice', 'First Adaptation', 'Complete a world after selecting an Adaptation.', n('adaptationsSelected', 1)],
  ['manual-choice', 'Deliberate Change', 'Select an Adaptation manually.', n('manualSelections', 1)],
  ['automatic-choice', 'Seeded Change', 'Receive an Auto Random Adaptation.', n('randomSelections', 1)],
  ['three-choices', 'Three Changes', 'Resolve three Adaptation offers in one world.', n('adaptationsSelected', 3)],
  ['five-choices', 'Five Changes', 'Resolve five Adaptation offers in one world.', n('adaptationsSelected', 5)],
  ['nothing-pending', 'No Choice Left Behind', 'Finish with at least three resolved offers and none pending.', n('allOffersResolved', 1)],
  ['three-manual', 'Three Deliberate Changes', 'Select three Adaptations manually in one world.', n('manualSelections', 3)],
  ['five-random', 'Five Seeded Changes', 'Resolve five offers through Auto Random in one world.', n('randomSelections', 5)],
  ['reach-category', 'Reach Lesson', 'Select an Adaptation in the Reach category.', bits('adaptationCategoryMask', 1)],
  ['metabolism-category', 'Metabolism Lesson', 'Select an Adaptation in the Metabolism category.', bits('adaptationCategoryMask', 2)],
  ['resilience-category', 'Resilience Lesson', 'Select an Adaptation in the Resilience category.', bits('adaptationCategoryMask', 4)],
  ['transport-category', 'Transport Lesson', 'Select an Adaptation in the Transport category.', bits('adaptationCategoryMask', 8)],
  ['symbiosis-category', 'Symbiosis Lesson', 'Select an Adaptation in the Symbiosis category.', bits('adaptationCategoryMask', 16)],
  ['memory-category', 'Memory Lesson', 'Select an Adaptation in the Memory category.', bits('adaptationCategoryMask', 32)],
  ['all-categories-world', 'Whole Organism', 'Represent all six Adaptation categories in one world.', n('allAdaptationCategoriesWorld', 1)],
  ['all-cards', 'Complete Adaptation Archive', 'Select all 24 canonical Adaptation cards across completed worlds.', n('adaptationCardCount', 24)],
]);
