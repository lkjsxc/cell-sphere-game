import { allOf as all, atLeast as n, defineTrophyFamily as family } from './definition.js';
export const MASTERY_TROPHIES = family('mastery', [
  ['score-forty', 'Pathfinder SCORE', 'Reach a SCORE of 700,000 with at least 50% Reach-axis quality.', all(n('bestScore', 700000), n('reachAxisBp', 5000))],
  ['score-ninety', 'Conductor SCORE', 'Reach a SCORE of 725,000 with at least 40% Spread-axis quality.', all(n('bestScore', 725000), n('spreadAxisBp', 4000))],
  ['score-one-eighty', 'Worldweaver SCORE', 'Reach a SCORE of 750,000 while mastering a balanced six-axis world.', all(n('bestScore', 750000), n('balancedAxesWorld', 1))],
  ['score-three-twenty', 'Lasting Web SCORE', 'Reach a SCORE of 775,000 and endure every started crisis in a world.', all(n('bestScore', 775000), n('allCrisesEndured', 1))],
  ['score-five-twenty', 'Planetary SCORE', 'Reach a SCORE of 790,000 with lake-centered ecology in one world.', all(n('bestScore', 790000), n('lakeEcologyWorld', 1))],
  ['score-seven-fifty', 'Spherewide SCORE', 'Reach a SCORE of 800,000 and all six mastery axes in one world.', all(n('bestScore', 800000), n('allAxesWorld', 1))],
  ['survival-axis', 'Complete Survival', 'Fill Survival after enduring 500 crises across completed worlds.', all(n('survivalAxisBp', 10000), n('totalCrisesEndured', 500))],
  ['reach-axis', 'Mastered Reach', 'Raise Reach to 60% while reaching all seven lakes in one world.', all(n('reachAxisBp', 6000), n('distinctLakesReached', 7), n('skillCount', 128))],
  ['spread-axis', 'Mastered Spread', 'Raise Spread to 50% and sustain 300 seconds of lake-centered living.', all(n('spreadAxisBp', 5000), n('lakeLivingSeconds', 300), n('skillCount', 192))],
  ['unity-axis', 'Mastered Unity', 'Fill Unity while reaching 60% peak coverage and a loop surplus of 400.', all(n('unityAxisBp', 10000), n('peakCoverageBp', 6000), n('loopSurplusPeak', 400))],
  ['efficiency-axis', 'Mastered Efficiency', 'Raise Efficiency to 50% after discovering all Metabolism cards.', all(n('efficiencyAxisBp', 5000), n('metabolismCardCount', 6), n('skillCount', 256))],
  ['resolve-axis', 'Complete Resolve', 'Fill Resolve after 40 drought or freeze survivals beside lake regions.', all(n('resolveAxisBp', 10000), n('totalLakeCrisisSurvivals', 40))],
  ['balanced-six', 'Balanced Six', 'Meet demanding baselines on all six SCORE axes in one world.', n('balancedAxesWorld', 1)],
  ['reach-form-vector', 'Reach Form Vector', 'Master Reach, Spread, and Unity together in one world.', n('reachFormWorld', 1)],
  ['efficient-resolve', 'Efficient Resolve', 'Master Efficiency and Resolve together in one world.', n('efficientResolveWorld', 1)],
  ['all-six', 'Sixfold Mastery', 'Meet all six final mastery thresholds in one world.', n('allAxesWorld', 1)],
]);
