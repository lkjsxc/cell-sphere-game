/** Whitelist for persisted aggregate evidence and authored condition leaves. */
export const TROPHY_MAX_KEYS = Object.freeze(['survivalSeconds','peakCoverageBp','sustainedCoverageBp','reachGains','frontierGrowth',
  'regrowth','loops','splits','reconnections','breakAndMend',
  'crisesEndured','allCrisesEndured','adaptationsSelected','manualSelections','randomSelections','allOffersResolved',
  'coherentMajority','unbrokenMajority','allAdaptationCategoriesWorld','survivalAxisBp','reachAxisBp','spreadAxisBp',
  'unityAxisBp','efficiencyAxisBp','resolveAxisBp','balancedAxesWorld','reachFormWorld','efficientResolveWorld','allAxesWorld',
  'diverseGeographyWorld','lakeMorphologyWorld','lakeEcologyWorld','forestWetlandWorld','forestHighlandWorld','lakeWetlandWorld','lakeCellsReached','lakeShoreCellsReached',
  'distinctLakesReached','completeLakeShores','lakeLivingSeconds','largeLakeLivingSeconds','lakeRegionPeak',
  'droughtLakeSurvivals','freezeLakeSurvivals','lakeLoopSeconds','loopSurplusPeak']);
export const TROPHY_SUM_KEYS = Object.freeze(['worldsWithLake','worldsWithManual','worldsWithAuto','worldsAllOffers','totalCrisesEndured',
  'totalAdaptationsSelected','totalManualSelections','totalRandomSelections','totalReachGains','totalRegrowth','totalLakeLivingSeconds',
  'totalLakeCrisisSurvivals','balancedWorlds']);
export const TROPHY_DERIVED_KEYS = Object.freeze(['runs','bestScore','totalEchoes','skillCount','skillBranchCount','imprintCount',
  'geographyMask','crisisMask','adaptationCategoryMask','adaptationCardCount','lakeTypeMask','lakeSalinityMask',
  'reachCardCount','metabolismCardCount','resilienceCardCount','transportCardCount','symbiosisCardCount','memoryCardCount']);
export const TROPHY_CONDITION_KEYS = Object.freeze([...TROPHY_MAX_KEYS, ...TROPHY_SUM_KEYS, ...TROPHY_DERIVED_KEYS]);
