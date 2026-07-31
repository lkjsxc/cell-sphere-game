/** Tiny shared helpers for scripts. */
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

/** Resolve a path relative to the scripts directory. */
export function resolveRes(rel) {
  return resolve(here, rel);
}
