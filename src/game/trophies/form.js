import { atLeast as n, defineTrophyFamily as family } from './definition.js';
export const FORM_TROPHIES = family('form', [
  ['first-loop', 'Closed Circuit', 'Form a living network loop.', n('loops', 1)],
  ['first-split', 'Two Living Shores', 'Split into more than one living component.', n('splits', 1)],
  ['first-reconnection', 'Mended Thread', 'Reconnect a fragmented network.', n('reconnections', 1)],
  ['break-and-mend', 'Break and Mend', 'Split and reconnect within one completed world.', n('breakAndMend', 1)],
  ['two-splits', 'Repeated Fracture', 'Split twice within one completed world.', n('splits', 2)],
  ['two-reconnections', 'Repeated Repair', 'Reconnect twice within one completed world.', n('reconnections', 2)],
  ['first-regrowth', 'Scar Seed', 'Regrow into one previously lost cell.', n('regrowth', 1)],
  ['regrowth-hundred', 'Scar Garden', 'Regrow into 100 lost cells in one world.', n('regrowth', 100)],
  ['reconnection-growth', 'Joining Growth', 'Gain a cell directly through reconnection.', n('reconnectionGrowth', 1)],
  ['reconnection-fifty', 'Fifty Joining Cells', 'Gain 50 cells through reconnection in one world.', n('reconnectionGrowth', 50)],
  ['frontier-hundred', 'Hundred Frontiers', 'Gain 100 cells through frontier expansion.', n('frontierGrowth', 100)],
  ['frontier-five-hundred', 'Five Hundred Frontiers', 'Gain 500 cells through frontier expansion.', n('frontierGrowth', 500)],
  ['adapted-growth', 'Learned Expansion', 'Gain a cell through an Adaptation effect.', n('adaptationGrowth', 1)],
  ['skill-recovery', 'Inherited Recovery', 'Gain a cell through an inherited Skill effect.', n('skillRecovery', 1)],
  ['coherent-majority', 'Coherent Majority', 'Reach 50% coverage while retaining 75% majority connectivity.', n('coherentMajority', 1)],
  ['unbroken-majority', 'Unbroken Majority', 'Split, reconnect, and retain 95% connectivity beyond 50% coverage.', n('unbrokenMajority', 1)],
]);
