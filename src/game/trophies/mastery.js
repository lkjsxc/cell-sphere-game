import { allOf as all, atLeast as n, defineTrophyFamily as family } from './definition.js';
export const MASTERY_TROPHIES = family('mastery', [
  ['score-forty', 'Rooted SCORE', 'Reach a current-model SCORE of 200,000.', n('bestScore', 200000)],
  ['score-ninety', 'Cartographer SCORE', 'Reach a current-model SCORE of 225,000 with at least 65% Exploration quality in that World.', n('scoreReachWorld', 1)],
  ['score-one-eighty', 'Worldweaver SCORE', 'Reach a current-model SCORE of 250,000 with balanced Run Quality in that world.', n('scoreBalancedWorld', 1)],
  ['score-three-twenty', 'Planetary SCORE', 'Reach a current-model SCORE of 500,000 under sustained Environment exposure.', n('scoreEnvironmentWorld', 1)],
  ['score-five-twenty', 'Biosphere SCORE', 'Reach a current-model SCORE of 750,000 with three gated habitat classes in that world.', n('scoreHabitatWorld', 1)],
  ['score-seven-fifty', 'Living World SCORE', 'Reach a current-model SCORE of 1,000,000 with all six quality axes mastered in that world.', n('scoreSixAxisWorld', 1)],
  ['survival-axis', 'Complete Survival', 'Fill Survival under mature pressure with substantial Evolution.', all(n('survivalAxisBp', 9500), n('environmentExposureWorld', 1), n('skillCount', 16))],
  ['reach-axis', 'Mastered Reach', 'Raise Reach to 60% while reaching several lakes.', all(n('reachAxisBp', 6000), n('distinctLakesReached', 4), n('skillCount', 42))],
  ['spread-axis', 'Mastered Spread', 'Raise sustained Reach to 50% with long lake-centered living.', all(n('spreadAxisBp', 5000), n('lakeLivingSeconds', 180), n('skillCount', 42))],
  ['unity-axis', 'Mastered Unity', 'Fill Unity while reaching 40% peak coverage and a loop surplus of 100.', all(n('unityAxisBp', 9500), n('peakCoverageBp', 4000), n('loopSurplusPeak', 100))],
  ['efficiency-axis', 'Mastered Efficiency', 'Raise Resource Efficiency to 55% with substantial Evolution.', all(n('efficiencyAxisBp', 5500), n('skillCount', 42))],
  ['resolve-axis', 'Complete Stability', 'Raise Stability to 75% after deep chronic-pressure exposure.', all(n('stabilityAxisBp', 7500), n('environmentPressureTicksQ', 900000000), n('skillCount', 32))],
  ['balanced-six', 'Balanced Six', 'Meet demanding baselines on all six SCORE axes in one world.', n('balancedAxesWorld', 1)],
  ['reach-form-vector', 'Whole Living Sphere', 'Keep every authoritative world cell alive for the full REACH 100 interval.', n('reach100', 1)],
  ['efficient-resolve', 'Worldmaker Circuit', 'Transform at least fifty cells and energize at least fifty in one world.', all(n('transformedCells', 50), n('electrifiedCells', 50))],
  ['all-six', 'Sixfold Mastery', 'Meet all six final Run Quality thresholds in one world.', n('allAxesWorld', 1)],
]);
