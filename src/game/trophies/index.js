/** Canonical 96-achievement Trophy Sphere catalog. */
import { ADAPTATION_TROPHIES } from './adaptation.js';
import { ENDURANCE_TROPHIES } from './endurance.js';
import { EVOLUTION_TROPHIES } from './evolution.js';
import { FORM_TROPHIES } from './form.js';
import { MASTERY_TROPHIES } from './mastery.js';
import { REACH_TROPHIES } from './reach.js';
import { TROPHY_ATLAS_CELLS, TROPHY_ATLAS_HASH, TROPHY_FAMILIES, validateTrophyAtlas } from './atlas.js';
export { TROPHY_ATLAS_REVERSE } from './atlas.js';

export const TROPHY_CATALOG_VERSION = 1;
const GROUPS = Object.freeze([REACH_TROPHIES, FORM_TROPHIES, ENDURANCE_TROPHIES,
  ADAPTATION_TROPHIES, EVOLUTION_TROPHIES, MASTERY_TROPHIES]);
export const TROPHIES = Object.freeze(GROUPS.flat().map((trophy, index) =>
  Object.freeze({ ...trophy, cell: TROPHY_ATLAS_CELLS[index] })));
export const TROPHY_IDS = Object.freeze(TROPHIES.map((trophy) => trophy.id));
const BY_ID = new Map(TROPHIES.map((trophy) => [trophy.id, trophy]));
export function getTrophy(id) { return BY_ID.get(id) ?? null; }
export function groupedTrophies() { return Object.freeze(TROPHY_FAMILIES.map((key, family) => Object.freeze({
  family: `${key[0].toUpperCase()}${key.slice(1)}`, trophies: Object.freeze(TROPHIES.slice(family * 16, family * 16 + 16)),
}))); }

export function validateTrophyCatalog(trophies = TROPHIES) {
  const errors = []; const ids = new Set(); const cells = new Set(); const families = {};
  for (const trophy of trophies) {
    if (!/^[a-z][a-z-]+$/.test(trophy.id) || ids.has(trophy.id)) errors.push(`invalid trophy id: ${trophy.id}`); ids.add(trophy.id);
    if (!Number.isInteger(trophy.cell) || trophy.cell < 0 || trophy.cell >= 162 || cells.has(trophy.cell)) errors.push(`invalid trophy cell: ${trophy.id}`); cells.add(trophy.cell);
    if (typeof trophy.nameEn !== 'string' || trophy.nameEn.length < 5) errors.push(`invalid trophy name: ${trophy.id}`);
    if (typeof trophy.criteriaEn !== 'string' || trophy.criteriaEn.length < 18) errors.push(`invalid trophy criterion: ${trophy.id}`);
    if (!['at-least', 'includes'].includes(trophy.condition?.rule) || typeof trophy.condition.key !== 'string') errors.push(`invalid trophy rule: ${trophy.id}`);
    if (trophy.condition?.rule === 'at-least' && !(trophy.condition.value > 0)) errors.push(`invalid trophy threshold: ${trophy.id}`);
    if (trophy.condition?.rule === 'includes' && !Number.isInteger(trophy.condition.mask)) errors.push(`invalid trophy mask: ${trophy.id}`);
    families[trophy.family] = (families[trophy.family] ?? 0) + 1;
  }
  if (trophies.length !== 96) errors.push(`trophy count: ${trophies.length}`);
  for (const name of ['Reach', 'Form', 'Endurance', 'Adaptation', 'Evolution', 'Mastery']) if (families[name] !== 16) errors.push(`trophy family count: ${name}`);
  const atlas = validateTrophyAtlas(trophies.map((trophy) => trophy.cell));
  errors.push(...atlas.errors);
  return Object.freeze({ valid: !errors.length, errors: Object.freeze(errors), count: trophies.length,
    uniqueIds: ids.size, uniqueCells: cells.size, families: Object.freeze(families), atlasHash: TROPHY_ATLAS_HASH });
}

