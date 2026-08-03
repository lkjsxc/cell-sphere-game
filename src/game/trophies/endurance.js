import { allOf as all, atLeast as n, defineTrophyFamily as family, includes as bits } from './definition.js';
export const ENDURANCE_TROPHIES = family('endurance', [
  ['two-minutes', 'Long Root', 'Survive 300 seconds after enduring 100 crises across completed worlds.', all(n('survivalSeconds', 300), n('totalCrisesEndured', 100))],
  ['three-minutes', 'Weathered Root', 'Survive 315 seconds after enduring 250 crises across completed worlds.', all(n('survivalSeconds', 315), n('totalCrisesEndured', 250))],
  ['four-minutes', 'Lakebound Root', 'Survive 330 seconds with 180 seconds of lake living after 500 total crises.', all(n('survivalSeconds', 330), n('lakeLivingSeconds', 180), n('totalCrisesEndured', 500))],
  ['five-minutes', 'Crisis Canopy', 'Survive 345 seconds with 95% Resolve after 800 total crises.', all(n('survivalSeconds', 345), n('resolveAxisBp', 9500), n('totalCrisesEndured', 800))],
  ['six-minutes', 'Ceiling Garden', 'Reach 360 seconds with a complete offer queue after 1,200 total crises.', all(n('survivalSeconds', 360), n('allOffersResolved', 1), n('totalCrisesEndured', 1200))],
  ['drought-endured', 'Lake Through Drought', 'Survive drought beside a lake region after enduring 180 total crises.', all(n('droughtLakeSurvivals', 1), n('totalCrisesEndured', 180))],
  ['heat-endured', 'After Heat', 'Endure heat after at least 300 total crises across completed worlds.', all(bits('crisisMask', 2), n('totalCrisesEndured', 300))],
  ['freeze-endured', 'Lake Through Freeze', 'Survive freeze beside a lake region after 450 total crises.', all(n('freezeLakeSurvivals', 1), n('totalCrisesEndured', 450))],
  ['toxin-endured', 'After Toxic Rain', 'Endure toxic rain after at least 650 total crises across worlds.', all(bits('crisisMask', 8), n('totalCrisesEndured', 650))],
  ['flare-endured', 'After Solar Fire', 'Endure a solar flare after at least 900 total crises across worlds.', all(bits('crisisMask', 16), n('totalCrisesEndured', 900))],
  ['ash-endured', 'After Ash', 'Endure ash after at least 1,200 total crises across completed worlds.', all(bits('crisisMask', 32), n('totalCrisesEndured', 1200))],
  ['blight-endured', 'After Blight', 'Endure blight after at least 1,500 total crises across completed worlds.', all(bits('crisisMask', 64), n('totalCrisesEndured', 1500))],
  ['two-crises', 'Eightfold Weather', 'Endure eight crises in one world after 600 total crises.', all(n('crisesEndured', 8), n('totalCrisesEndured', 600))],
  ['four-crises', 'Lake Weather Mastery', 'Endure eight crises with lake drought and freeze proof after 900 total crises.', all(n('crisesEndured', 8), n('droughtLakeSurvivals', 1), n('freezeLakeSurvivals', 1), n('totalCrisesEndured', 900))],
  ['all-started', 'Nothing Left Unendured', 'Endure every one of eight crises in a world after 1,200 total crises.', all(n('allCrisesEndured', 1), n('crisesEndured', 8), n('totalCrisesEndured', 1200))],
  ['all-families', 'Weather Archive', 'Endure all seven crisis families and at least 2,000 total crises across worlds.', all(bits('crisisMask', 127), n('totalCrisesEndured', 2000))],
]);
