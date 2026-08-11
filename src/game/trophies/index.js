/** Canonical 96-achievement Trophy Sphere catalog. */
import { HABITAT_TROPHIES } from './habitat.js';
import { ENDURANCE_TROPHIES } from './endurance.js';
import { EVOLUTION_TROPHIES } from './evolution.js';
import { FORM_TROPHIES } from './form.js';
import { MASTERY_TROPHIES } from './mastery.js';
import { REACH_TROPHIES } from './reach.js';
import { TROPHY_CONDITION_KEYS } from './keys.js';
import { TROPHY_ATLAS_CELLS, TROPHY_ATLAS_HASH, TROPHY_FAMILIES, validateTrophyAtlas } from './atlas.js';
export { TROPHY_ATLAS_REVERSE } from './atlas.js';

export const TROPHY_CATALOG_VERSION = 5;
const GROUPS = Object.freeze([REACH_TROPHIES, FORM_TROPHIES, ENDURANCE_TROPHIES,
  HABITAT_TROPHIES, EVOLUTION_TROPHIES, MASTERY_TROPHIES]);
export const TROPHIES = Object.freeze(GROUPS.flat().map((trophy, index) =>
  Object.freeze({ ...trophy, cell: TROPHY_ATLAS_CELLS[index], rewardEn: 'Trophy Cell preserved' })));
export const TROPHY_IDS = Object.freeze(TROPHIES.map((trophy) => trophy.id));
const BY_ID = new Map(TROPHIES.map((trophy) => [trophy.id, trophy]));
export function getTrophy(id) { return BY_ID.get(id) ?? null; }
export function groupedTrophies() { return Object.freeze(TROPHY_FAMILIES.map((key, family) => Object.freeze({
  family: `${key[0].toUpperCase()}${key.slice(1)}`, trophies: Object.freeze(TROPHIES.slice(family * 16, family * 16 + 16)),
}))); }

export function validateTrophyCatalog(trophies = TROPHIES) {
  const errors = []; const ids = new Set(); const cells = new Set(); const families = {}; const allowed = new Set(TROPHY_CONDITION_KEYS);
  for (const trophy of trophies) {
    if (!/^[a-z][a-z-]+$/.test(trophy.id) || ids.has(trophy.id)) errors.push(`invalid trophy id: ${trophy.id}`); ids.add(trophy.id);
    if (!Number.isInteger(trophy.cell) || trophy.cell < 0 || trophy.cell >= 162 || cells.has(trophy.cell)) errors.push(`invalid trophy cell: ${trophy.id}`); cells.add(trophy.cell);
    if (typeof trophy.nameEn !== 'string' || trophy.nameEn.length < 5) errors.push(`invalid trophy name: ${trophy.id}`);
    if (typeof trophy.criteriaEn !== 'string' || trophy.criteriaEn.length < 18) errors.push(`invalid trophy criterion: ${trophy.id}`);
    validateCondition(trophy.condition, trophy.id, allowed, errors);
    families[trophy.family] = (families[trophy.family] ?? 0) + 1;
  }
  if (trophies.length !== 96) errors.push(`trophy count: ${trophies.length}`);
  for (const name of ['Reach', 'Form', 'Endurance', 'Habitat', 'Evolution', 'Mastery']) if (families[name] !== 16) errors.push(`trophy family count: ${name}`);
  const atlas = validateTrophyAtlas(trophies.map((trophy) => trophy.cell)); errors.push(...atlas.errors);
  return Object.freeze({ valid: !errors.length, errors: Object.freeze(errors), count: trophies.length,
    uniqueIds: ids.size, uniqueCells: cells.size, families: Object.freeze(families), atlasHash: TROPHY_ATLAS_HASH });
}
function validateCondition(condition, id, allowed, errors, depth = 0) {
  if (!condition || depth > 3 || !['at-least','includes','all','any'].includes(condition.rule)) { errors.push(`invalid trophy rule: ${id}`); return; }
  if (condition.rule === 'all' || condition.rule === 'any') {
    if (!Array.isArray(condition.conditions) || condition.conditions.length < 2 || condition.conditions.length > 5) errors.push(`invalid trophy combinator: ${id}`);
    else for (const child of condition.conditions) validateCondition(child, id, allowed, errors, depth + 1); return;
  }
  if (!allowed.has(condition.key)) errors.push(`invalid trophy key: ${id}:${condition.key}`);
  if (condition.rule === 'at-least' && !(condition.value > 0)) errors.push(`invalid trophy threshold: ${id}`);
  if (condition.rule === 'includes' && !Number.isInteger(condition.mask)) errors.push(`invalid trophy mask: ${id}`);
}
