import { atLeast as n, defineTrophyFamily as family } from './definition.js';
export const MASTERY_TROPHIES = family('mastery', [
  ['score-forty', 'Pathfinder Score', 'Reach a Network Score of 40,000.', n('bestScore', 40000)],
  ['score-ninety', 'Conductor Score', 'Reach a Network Score of 90,000.', n('bestScore', 90000)],
  ['score-one-eighty', 'Worldweaver Score', 'Reach a Network Score of 180,000.', n('bestScore', 180000)],
  ['score-three-twenty', 'Lasting Web Score', 'Reach a Network Score of 320,000.', n('bestScore', 320000)],
  ['score-five-twenty', 'Planetary Score', 'Reach a Network Score of 520,000.', n('bestScore', 520000)],
  ['score-seven-fifty', 'Spherewide Score', 'Reach a Network Score of 750,000.', n('bestScore', 750000)],
  ['survival-axis', 'Complete Survival', 'Fill the Survival score axis in one world.', n('survivalAxisBp', 10000)],
  ['reach-axis', 'Mastered Reach', 'Raise the Reach score axis to 70% in one world.', n('reachAxisBp', 7000)],
  ['spread-axis', 'Mastered Spread', 'Raise the Spread score axis to 50% in one world.', n('spreadAxisBp', 5000)],
  ['unity-axis', 'Mastered Unity', 'Raise the Unity score axis to 98% in one world.', n('unityAxisBp', 9800)],
  ['efficiency-axis', 'Mastered Efficiency', 'Raise the Efficiency score axis to 25% in one world.', n('efficiencyAxisBp', 2500)],
  ['resolve-axis', 'Complete Resolve', 'Fill the Resolve score axis in one world.', n('resolveAxisBp', 10000)],
  ['balanced-six', 'Balanced Six', 'Meet a substantial baseline on all six score axes in one world.', n('balancedAxesWorld', 1)],
  ['reach-form-vector', 'Reach Form Vector', 'Master Reach, Spread, and Unity together in one world.', n('reachFormWorld', 1)],
  ['efficient-resolve', 'Efficient Resolve', 'Master Efficiency and Resolve together in one world.', n('efficientResolveWorld', 1)],
  ['all-six', 'Sixfold Mastery', 'Meet all six individual mastery thresholds in one world.', n('allAxesWorld', 1)],
]);
