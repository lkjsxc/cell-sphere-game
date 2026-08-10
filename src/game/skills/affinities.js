/** Environmental identities layered over stable current territories and cell IDs. */
import { hashStringU32, hexU32 } from '../../core/hash.js';

export const EVOLUTION_CONTENT_VERSION = 1;

const metadata = [
  ['Fertility', 'Ecology', '#69ad68', [0.412, 0.678, 0.408], 'leaf-dapple', 'Rich soil, forest, uptake, and biomass'],
  ['Freshwater', 'Flow', '#55bfd1', [0.333, 0.749, 0.820], 'concentric-ripple', 'Lakes, shores, wetlands, renewal, and moisture'],
  ['Scarcity', 'Reserve', '#c28b42', [0.761, 0.545, 0.259], 'broken-strata', 'Poor terrain, conservation, and reclamation'],
  ['Cryogenic', 'Perception', '#d7edf5', [0.843, 0.929, 0.961], 'crystal-facet', 'Cold sensing, dormancy, snow, and glacial systems'],
  ['Marine', 'Reach', '#315da8', [0.192, 0.365, 0.659], 'pressure-wave', 'Salinity, coasts, shallow ocean, and deep ocean'],
  ['Luminous', 'Continuity', '#d8ad4c', [0.847, 0.678, 0.298], 'radiant-cell', 'Bioelectric conductance and whole-cell infrastructure'],
];

export const EVOLUTION_AFFINITIES = Object.freeze(metadata.map(([id, territory, color, rgb, pattern, label]) => Object.freeze({
  id, territory, color, rgb: Object.freeze(rgb), pattern, label,
})));
export const EVOLUTION_AFFINITY_IDS = Object.freeze(EVOLUTION_AFFINITIES.map((entry) => entry.id));
export const AFFINITY_BY_TERRITORY = Object.freeze(Object.fromEntries(EVOLUTION_AFFINITIES.map((entry) => [entry.territory, entry.id])));
export const AFFINITY_METADATA_HASH = hexU32(hashStringU32(JSON.stringify(EVOLUTION_AFFINITIES)));

const TAGS = Object.freeze({
  Fertility: Object.freeze(['rich-terrain', 'rapid-uptake', 'biomass', 'soil-building', 'forest', 'regeneration', 'broad-habitat']),
  Freshwater: Object.freeze(['lake', 'shore', 'wetland', 'renewal', 'moisture', 'catchment', 'broad-habitat']),
  Scarcity: Object.freeze(['poor-terrain', 'depleted', 'reclamation', 'low-upkeep', 'detritus', 'resource-recovery', 'broad-habitat']),
  Cryogenic: Object.freeze(['cold', 'dormancy', 'snow-ice', 'glacial', 'temperature-sensing', 'cold-storage', 'broad-habitat']),
  Marine: Object.freeze(['salinity', 'shallow-ocean', 'deep-ocean', 'pressure', 'coastal-succession', 'pelagic', 'broad-habitat']),
  Luminous: Object.freeze(['bioelectric', 'conductance', 'infrastructure', 'power-generation', 'powered-transformation', 'illumination', 'broad-habitat']),
});
const TRADEOFFS = Object.freeze({
  Fertility: 'Fast uptake can exhaust rich local stock.', Freshwater: 'Catchment renewal is finite and rate-limited.',
  Scarcity: 'Conservative reclamation trades opening speed for endurance.', Cryogenic: 'Cold specialization slows warm-region growth.',
  Marine: 'Pressure and salinity tolerance carry higher maintenance.', Luminous: 'Power infrastructure has setup and upkeep costs.',
});
const HABITATS = Object.freeze({ Fertility:'RICH_LAND', Freshwater:'FRESHWATER_MARGIN', Scarcity:'POOR_DEPLETED_LAND',
  Cryogenic:'COLD_HABITAT', Marine:'MARINE_HABITAT', Luminous:'ENERGIZED_HABITAT' });
const TRANSFORMATIONS_BY_TAG = Object.freeze({ glacial:'glacial-lake', 'soil-building':'reclaimed-soil',
  'coastal-succession':'wetland-succession', infrastructure:'electrified', 'powered-transformation':'recovering', illumination:'electrified' });

export function affinityForTerritory(territory) { return AFFINITY_BY_TERRITORY[territory] ?? null; }
export function affinityMetadata(id) { return EVOLUTION_AFFINITIES.find((entry) => entry.id === id) ?? null; }
export function secondaryTagsFor(affinity, index, effect) {
  const source = TAGS[affinity] ?? []; const tags = new Set([source[index % source.length], source[(index * 3 + 1) % source.length]]);
  if (effect?.mode === 'habitat') tags.add('broad-habitat');
  if (effect?.key === 'LAKE_ACCESS') tags.add('lake');
  if (effect?.key === 'SHALLOW_OCEAN_ACCESS' || effect?.key === 'SHALLOW_OCEAN_EDGE_ACCESS') tags.add('shallow-ocean');
  if (effect?.key === 'DEEP_OCEAN_ACCESS') { tags.add('deep-ocean'); tags.add('pressure'); }
  if (effect?.key === 'TUNDRA_ACCESS' || effect?.key === 'SNOW_ICE_ACCESS') tags.add('cold');
  return Object.freeze([...tags].filter(Boolean).sort());
}
export function tradeoffForAffinity(affinity) { return TRADEOFFS[affinity] ?? 'A bounded domain benefit carries an explicit opportunity cost.'; }
export function habitatContributionsFor(affinity, effect) {
  const values = new Set([HABITATS[affinity]]); if (effect?.mode === 'habitat') values.add(effect.key);
  return Object.freeze([...values].filter(Boolean).sort());
}
export function transformationContributionsFor(tags) {
  return Object.freeze([...new Set(tags.map((tag) => TRANSFORMATIONS_BY_TAG[tag]).filter(Boolean))].sort());
}
