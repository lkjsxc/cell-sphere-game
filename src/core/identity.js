/** Canonical product, repository, current persistence, export, and diagnostic identity. */
export const PRODUCT = 'cell-sphere-game';
export const TAGLINE = 'Every extinction becomes memory.';
export const VERSION = '0.1.0';
export const REPOSITORY = 'lkjsxc/cell-sphere-game';
export const REPOSITORY_URL = `https://github.com/${REPOSITORY}`;
export const PAGES_URL = 'https://lkjsxc.github.io/cell-sphere-game/';

export const EXPORT_FILENAME = `${PRODUCT}-save.json`;

/** A clean current namespace; older documents are deliberately ignored. */
export const STORAGE_KEYS = Object.freeze({
  meta: `${PRODUCT}:meta:v2`,
  settings: `${PRODUCT}:settings:v4`,
  history: `${PRODUCT}:history:v3`,
  resultTransaction: `${PRODUCT}:result-transaction:v2`,
});
export const RECENT_RUNS_DB = `${PRODUCT}:recent-runs:v2`;

export const DIAGNOSTIC_GLOBALS = Object.freeze({
  app: '__CELL_SPHERE_APP__',
  boot: '__CELL_SPHERE_BOOT__',
  errors: '__CELL_SPHERE_ERRORS__',
});
