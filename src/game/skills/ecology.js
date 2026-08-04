import { conditional as c, defineBranch, scalar as s, unlock as u } from './node.js';

export const ECOLOGY_MEMORY = defineBranch('ecology', [
  ['tempered-scars', 'Tempered Scars', 'Stress resistance rises by 8%.', 'Past crises leave tissue prepared for pressure without making the next world harmless.', 2, s('stressResist', 1.08)],
  ['sunlit-membrane', 'Sunlit Membrane', 'Heat tolerance widens by 3%.', 'Surface tissue keeps functioning across a slightly broader range of warm terrain.', 3, s('heatTol', 1.03)],
  ['dew-binding', 'Dew Binding', 'Drought tolerance widens by 3%.', 'A fine extracellular film holds brief moisture long enough for cells to share it.', 3, s('droughtTol', 1.03)],
  ['bitter-vesicles', 'Bitter Vesicles', 'Toxin tolerance rises by 4%.', 'Contaminants are isolated in expendable pockets instead of circulating through the body.', 4, s('toxinTol', 1.04)],
  ['scar-gardens', 'Scar Gardens', 'Regrowth into scars is 4% stronger.', 'Dead tissue becomes a prepared substrate for careful recolonization rather than waste.', 4, s('regrow', 1.04)],
  ['buffered-cytoplasm', 'Buffered Cytoplasm', 'Stress resistance rises by 4%.', 'Internal chemistry changes more slowly when the surrounding world shifts abruptly.', 4, s('stressResist', 1.04)],
  ['symbiotic-sheen', 'Symbiotic Sheen', 'Enable one layer of symbiotic film.', 'A cooperative surface community improves renewal where living tissue already holds ground.', 5, s('symbioticFilm', 1, 'add')],
  ['cool-upkeep', 'Cool Upkeep', 'Network upkeep falls by 3%.', 'Temperature-stable tissue spends less energy repairing avoidable molecular damage.', 6, s('maintenance', 0.97)],
  ['heat-shock-memory', 'Heat-Shock Memory', 'Heat tolerance widens during heat crises.', 'A rising thermal front activates remembered proteins before widespread damage begins.', 5, c('heat-crisis-active', 'heatTol', 1.14)],
  ['dry-season-hyphae', 'Dry-Season Hyphae', 'Drought tolerance widens below 30% moisture.', 'Narrow drought-form filaments preserve connection while wet growth would overextend.', 6, c('moisture-below-30', 'droughtTol', 1.14)],
  ['toxin-fed-edge', 'Toxin-Fed Edge', 'Uptake rises under toxin pressure.', 'Specialized margins harvest nearby nutrients while sealing contaminants away from transport.', 7, c('toxin-pressure-above-50', 'uptake', 1.10)],
  ['succession-window', 'Succession Window', 'Regrowth rises after a crisis ends.', 'Survivors recolonize disturbed ground during the short interval before competitors return.', 8, c('crisis-recently-ended', 'regrow', 1.16)],
  ['tundra-proteins', 'Tundra Proteins', 'Permit tundra colonization.', 'Cold-active proteins open tundra while low renewal and cold pressure remain authoritative.', 5, u('TUNDRA_ACCESS', 'habitat')],
  ['cryogenic-matrix', 'Cryogenic Matrix', 'Permit snow and ice colonization.', 'A cryogenic matrix opens snow and ice and adds a bounded layer of cold tolerance.', 7, u('SNOW_ICE_ACCESS', 'habitat', s('coldReserve', 1, 'add'))],
  ['seasonal-shelter', 'Seasonal Shelter', 'Unlock crisis-aware shelter rules.', 'A saved rule may favor protected cells when a visible environmental warning appears.', 9, u('seasonalShelter', 'automation')],
  ['living-crown', 'Living Crown', 'Unlock Ecology mastery for campaign rules.', 'Tolerance becomes active coexistence with change rather than a collection of resistances.', 14, u('ecologyMastery', 'keystone')],
  ['fertile-vault', 'Fertile Vault', 'Join Ecology and Reserve mastery.', 'Stored abundance is invested in tissue suited to the habitat that will receive it.', 18, u('ecologyReserveConfluence', 'connector')],
  ['biosphere-memory', 'Biosphere Memory', 'Unlock the Biosphere Memory capstone.', 'The campaign may carry a bounded ecological legacy between otherwise distinct worlds.', 26, u('biosphereMemory', 'capstone')],
]);
