import { allOf as all, atLeast as n, defineTrophyFamily as family, includes as bits } from './definition.js';
export const ENDURANCE_TROPHIES = family('endurance', [
  ['two-minutes', 'Long Root', 'Survive 280 seconds after completing five worlds.', all(n('survivalSeconds', 280), n('runs', 5))],
  ['three-minutes', 'Weathered Root', 'Survive 300 seconds after enduring ten crises across worlds.', all(n('survivalSeconds', 300), n('totalCrisesEndured', 10))],
  ['four-minutes', 'Lakebound Root', 'Survive 320 seconds with 120 seconds of lake living.', all(n('survivalSeconds', 320), n('lakeLivingSeconds', 120))],
  ['five-minutes', 'Stable Canopy', 'Survive 330 seconds with at least 80% Stability.', all(n('survivalSeconds', 330), n('stabilityAxisBp', 8000))],
  ['six-minutes', 'Ceiling Garden', 'Reach the 360-second authority ceiling after substantial progression.', all(n('survivalSeconds', 360), n('skillCount', 84))],
  ['drought-endured', 'Lake Through Drought', 'Survive drought beside a lake region after twenty total crises.', all(n('droughtLakeSurvivals', 1), n('totalCrisesEndured', 20))],
  ['heat-endured', 'After Heat', 'Endure heat after at least thirty total crises.', all(bits('crisisMask', 2), n('totalCrisesEndured', 30))],
  ['freeze-endured', 'Lake Through Freeze', 'Survive freeze beside a lake region after forty total crises.', all(n('freezeLakeSurvivals', 1), n('totalCrisesEndured', 40))],
  ['toxin-endured', 'After Toxic Rain', 'Endure toxic rain after at least sixty total crises.', all(bits('crisisMask', 8), n('totalCrisesEndured', 60))],
  ['flare-endured', 'After Solar Fire', 'Endure a solar flare after at least eighty total crises.', all(bits('crisisMask', 16), n('totalCrisesEndured', 80))],
  ['ash-endured', 'After Ash', 'Endure ash after at least one hundred total crises.', all(bits('crisisMask', 32), n('totalCrisesEndured', 100))],
  ['blight-endured', 'After Blight', 'Endure blight after at least 140 total crises.', all(bits('crisisMask', 64), n('totalCrisesEndured', 140))],
  ['two-crises', 'Developing Weather', 'Endure three crises in one mature world.', n('crisesEndured', 3)],
  ['four-crises', 'Lake Weather Mastery', 'Endure four crises with lake drought and freeze proof.', all(n('crisesEndured', 4), n('droughtLakeSurvivals', 1), n('freezeLakeSurvivals', 1))],
  ['all-started', 'Nothing Left Unendured', 'Endure every started crisis in a mature world.', all(n('allCrisesEndured', 1), n('crisesEndured', 4))],
  ['all-families', 'Weather Archive', 'Endure all seven crisis families and at least 250 total crises.', all(bits('crisisMask', 127), n('totalCrisesEndured', 250))],
]);
