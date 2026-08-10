/** Whitelist for persisted aggregate evidence and authored condition leaves. */
export const TROPHY_MAX_KEYS = Object.freeze([
  'survivalSeconds', 'peakCoverageBp', 'sustainedCoverageBp', 'reachGains', 'frontierGrowth', 'regrowth', 'loops', 'splits', 'reconnections', 'breakAndMend',
  'coherentMajority', 'unbrokenMajority', 'survivalAxisBp', 'reachAxisBp', 'spreadAxisBp',
  'unityAxisBp', 'efficiencyAxisBp', 'stabilityAxisBp', 'balancedAxesWorld', 'reachFormWorld', 'efficientResolveWorld', 'allAxesWorld',
  'diverseGeographyWorld', 'lakeMorphologyWorld', 'lakeEcologyWorld', 'forestWetlandWorld', 'forestHighlandWorld', 'lakeWetlandWorld',
  'lakeCellsReached', 'lakeShoreCellsReached', 'distinctLakesReached', 'completeLakeShores', 'lakeLivingSeconds', 'largeLakeLivingSeconds', 'lakeRegionPeak',
  'lakeLoopSeconds', 'loopSurplusPeak', 'lakeHabitatCells', 'tundraHabitatCells', 'snowHabitatCells', 'shallowOceanCells', 'deepOceanCells',
  'habitatClassCount', 'habitatClassMask', 'resourceRemainingBp', 'resourceRecoveredCells', 'freshwaterSupportedSeconds', 'transformedCells', 'electrifiedCells',
  'glacialLakeCells', 'maritimeForestCells', 'reach100', 'environmentExposureWorld', 'environmentPeakLevel',
  'environmentTimeAtPeakTicks', 'environmentPressureTicksQ', 'scoreReachWorld', 'scoreBalancedWorld',
  'scoreEnvironmentWorld', 'scoreHabitatWorld', 'scoreSixAxisWorld',
]);
export const TROPHY_SUM_KEYS = Object.freeze([
  'worldsWithLake', 'totalReachGains', 'totalRegrowth', 'totalLakeLivingSeconds', 'balancedWorlds',
  'scarcityWorlds', 'autonomousWorlds', 'resourceDepletedCells',
]);
export const TROPHY_DERIVED_KEYS = Object.freeze([
  'runs', 'bestScore', 'totalEchoes', 'skillCount', 'skillBranchCount', 'imprintCount', 'geographyMask', 'lakeTypeMask', 'lakeSalinityMask',
]);
export const TROPHY_CONDITION_KEYS = Object.freeze([...TROPHY_MAX_KEYS, ...TROPHY_SUM_KEYS, ...TROPHY_DERIVED_KEYS]);
