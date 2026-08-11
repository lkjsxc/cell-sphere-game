import { allOf as all, atLeast as n, defineTrophyFamily as family } from './definition.js';

export const ENDURANCE_TROPHIES = family('endurance', [
  ['two-minutes', 'Long Root', 'Survive 90 seconds after completing five worlds.', all(n('survivalSeconds', 90), n('runs', 5))],
  ['three-minutes', 'Seasoned Root', 'Survive 180 seconds at Environment Level 3 after a five-world lineage.', all(n('survivalSeconds', 180), n('environmentPeakLevel', 3), n('runs', 5))],
  ['four-minutes', 'Lakebound Root', 'Survive 140 seconds with 60 seconds of lake living.', all(n('survivalSeconds', 140), n('lakeLivingSeconds', 60))],
  ['five-minutes', 'Stable Canopy', 'Survive 160 seconds with at least 80% Stability.', all(n('survivalSeconds', 160), n('stabilityAxisBp', 8000))],
  ['six-minutes', 'Long Garden', 'Survive 180 seconds after substantial progression.', all(n('survivalSeconds', 180), n('skillCount', 42))],
  ['resource-strain', 'Thin Reserves', 'Deplete 2,500 local reserves across resource-limited worlds.', all(n('resourceDepletedCells', 2500), n('scarcityWorlds', 6))],
  ['resource-recovery', 'Returning Loam', 'Recover at least 30 depleted cells in one world.', n('resourceRecoveredCells', 30)],
  ['freshwater-endurance', 'Freshwater Thread', 'Maintain 50,000 freshwater-supported cell seconds.', n('freshwaterSupportedSeconds', 50000)],
  ['environment-one', 'First Pressure', 'Reach Environment Level 1 after completing five worlds.', all(n('environmentPeakLevel', 1), n('runs', 5))],
  ['environment-two', 'Deepening Pressure', 'Reach Environment Level 2 with coherent majority coverage.', all(n('environmentPeakLevel', 2), n('coherentMajority', 1))],
  ['pressure-time', 'Pressure Memory', 'Accumulate substantial chronic-pressure exposure after six worlds.', all(n('environmentPressureTicksQ', 900000000), n('runs', 6))],
  ['scarcity-lineage', 'Scarcity Lineage', 'Complete eight resource-limited worlds.', n('scarcityWorlds', 8)],
  ['first-exposure', 'Established Under Pressure', 'Complete five worlds with sustained Environment exposure.', all(n('environmentExposureWorld', 1), n('runs', 5))],
  ['lake-network', 'Lake Network', 'Maintain lake life through a durable loop.', all(n('lakeLivingSeconds', 90), n('lakeLoopSeconds', 60))],
  ['coherent-reserve', 'Coherent Reserve', 'Keep a coherent majority with at least 20% reserves remaining.', all(n('coherentMajority', 1), n('resourceRemainingBp', 2000))],
  ['deep-exposure', 'Deep Exposure', 'Reach Environment Level 5 after a five-world lineage.', all(n('environmentPeakLevel', 5), n('survivalSeconds', 240), n('runs', 5))],
]);
