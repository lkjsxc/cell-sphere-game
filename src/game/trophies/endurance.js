import { atLeast as n, defineTrophyFamily as family, includes as bits } from './definition.js';
export const ENDURANCE_TROPHIES = family('endurance', [
  ['two-minutes', 'Two-Minute Root', 'Survive for at least 120 game seconds.', n('survivalSeconds', 120)],
  ['three-minutes', 'Three-Minute Root', 'Survive for at least 180 game seconds.', n('survivalSeconds', 180)],
  ['four-minutes', 'Four-Minute Root', 'Survive for at least 240 game seconds.', n('survivalSeconds', 240)],
  ['five-minutes', 'Five-Minute Root', 'Survive for at least 300 game seconds.', n('survivalSeconds', 300)],
  ['six-minutes', 'Six-Minute Root', 'Survive for at least 360 game seconds.', n('survivalSeconds', 360)],
  ['drought-endured', 'After Drought', 'Remain alive through a drought crisis.', bits('crisisMask', 1)],
  ['heat-endured', 'After Heat', 'Remain alive through a heat crisis.', bits('crisisMask', 2)],
  ['freeze-endured', 'After Freeze', 'Remain alive through a freeze crisis.', bits('crisisMask', 4)],
  ['toxin-endured', 'After Toxic Rain', 'Remain alive through a toxic-rain crisis.', bits('crisisMask', 8)],
  ['flare-endured', 'After Solar Fire', 'Remain alive through a solar-flare crisis.', bits('crisisMask', 16)],
  ['ash-endured', 'After Ash', 'Remain alive through an ash crisis.', bits('crisisMask', 32)],
  ['blight-endured', 'After Blight', 'Remain alive through a blight crisis.', bits('crisisMask', 64)],
  ['two-crises', 'Double Weather', 'Endure at least two crises in one world.', n('crisesEndured', 2)],
  ['four-crises', 'Fourfold Weather', 'Endure at least four crises in one world.', n('crisesEndured', 4)],
  ['all-started', 'Nothing Left Unendured', 'Endure every crisis that starts in one world.', n('allCrisesEndured', 1)],
  ['all-families', 'Weather Archive', 'Endure all seven crisis families across completed worlds.', bits('crisisMask', 127)],
]);
