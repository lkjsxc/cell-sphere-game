/** Whitelist for persisted aggregate evidence and authored condition leaves. */
export const TROPHY_MAX_KEYS = Object.freeze([
  'survivalSeconds','peakCoverageBp','sustainedCoverageBp','reachGains','frontierGrowth','regrowth','loops','splits','reconnections','breakAndMend',
  'crisesEndured','allCrisesEndured','coherentMajority','unbrokenMajority','survivalAxisBp','reachAxisBp','spreadAxisBp',
  'unityAxisBp','efficiencyAxisBp','stabilityAxisBp','balancedAxesWorld','reachFormWorld','efficientResolveWorld','allAxesWorld',
  'diverseGeographyWorld','lakeMorphologyWorld','lakeEcologyWorld','forestWetlandWorld','forestHighlandWorld','lakeWetlandWorld',
  'lakeCellsReached','lakeShoreCellsReached','distinctLakesReached','completeLakeShores','lakeLivingSeconds','largeLakeLivingSeconds','lakeRegionPeak',
  'droughtLakeSurvivals','freezeLakeSurvivals','lakeLoopSeconds','loopSurplusPeak',
  'lakeHabitatCells','tundraHabitatCells','snowHabitatCells','shallowOceanCells','deepOceanCells','habitatClassCount','habitatClassMask',
  'resourceRemainingBp','worldThreePressure','scoreReachWorld','scoreBalancedWorld','scoreCrisisWorld','scoreHabitatWorld','scoreSixAxisWorld',
]);
export const TROPHY_SUM_KEYS = Object.freeze([
  'worldsWithLake','totalCrisesEndured','totalReachGains','totalRegrowth','totalLakeLivingSeconds','totalLakeCrisisSurvivals','balancedWorlds',
  'scarcityWorlds','autonomousWorlds','zeroEventWorlds','resourceDepletedCells',
]);
export const TROPHY_DERIVED_KEYS = Object.freeze([
  'runs','bestScore','totalEchoes','skillCount','skillBranchCount','imprintCount','geographyMask','crisisMask','lakeTypeMask','lakeSalinityMask',
]);
export const TROPHY_CONDITION_KEYS = Object.freeze([...TROPHY_MAX_KEYS, ...TROPHY_SUM_KEYS, ...TROPHY_DERIVED_KEYS]);
