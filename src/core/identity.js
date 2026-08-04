/** Canonical product, repository, persistence, export, and diagnostic identity. */
export const PRODUCT = 'cell-sphere-game';
export const TAGLINE = 'Every extinction becomes memory.';
export const VERSION = '0.1.0';
export const REPOSITORY = 'lkjsxc/cell-sphere-game';
export const REPOSITORY_URL = `https://github.com/${REPOSITORY}`;
export const PAGES_URL = 'https://lkjsxc.github.io/cell-sphere-game/';

export const LEGACY_PRODUCT = 'incremental-network-game';
export const EXPORT_PRODUCTS = Object.freeze([PRODUCT, LEGACY_PRODUCT]);
export const EXPORT_FILENAME = `${PRODUCT}-save.json`;

export const STORAGE_KEYS = Object.freeze({
  meta: `${PRODUCT}:meta:v1`,
  settings: `${PRODUCT}:settings:v3`,
  history: `${PRODUCT}:history:v2`,
  resultTransaction: `${PRODUCT}:result-transaction:v1`,
  migration: `${PRODUCT}:namespace-migration:v1`,
});
export const LEGACY_STORAGE_KEYS = Object.freeze({
  meta: Object.freeze([`${LEGACY_PRODUCT}:meta:v1`]),
  settings: Object.freeze([
    `${LEGACY_PRODUCT}:settings:v3`,
    `${LEGACY_PRODUCT}:settings:v2`,
    `${LEGACY_PRODUCT}:settings:v1`,
  ]),
  history: Object.freeze([
    `${LEGACY_PRODUCT}:history:v2`,
    `${LEGACY_PRODUCT}:history:v1`,
  ]),
});
export const RECENT_RUNS_DB = `${PRODUCT}:recent-runs`;
export const LEGACY_RECENT_RUNS_DB = `${LEGACY_PRODUCT}:recent-runs`;
export const RECENT_RUNS_RECEIPT = 'legacy-namespace-v1';

export const DIAGNOSTIC_GLOBALS = Object.freeze({
  app: '__CELL_SPHERE_APP__',
  boot: '__CELL_SPHERE_BOOT__',
  errors: '__CELL_SPHERE_ERRORS__',
});
