#!/usr/bin/env node
/**
 * Repository structure gate.
 *
 * Enforces the legibility rules from the project contract over the set of
 * tracked-or-trackable files (git-tracked plus untracked, non-ignored;
 * untracked working-copy noise is not part of the repo):
 *   - every tracked directory contains a README.md;
 *   - at most 16 direct children per directory;
 *   - at most 200 lines per source/doc file;
 *   - no directories or files named old/new/legacy/temp/v1/v2/final/...;
 *
 * Documented exceptions live in LINE_EXCEPTIONS / CHILD_EXCEPTIONS below and
 * must name the reason. Exits non-zero on any violation.
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const ROOT = resolve(new URL('..', import.meta.url).pathname);

/** Files allowed to exceed 200 lines: path -> reason. */
const LINE_EXCEPTIONS = new Map([
  // none yet — split files instead of adding entries casually
]);

/** Directories allowed to exceed 16 direct children: path -> reason. */
const CHILD_EXCEPTIONS = new Map([
  // none yet
]);

const BANNED_NAMES = new Set([
  'old', 'new', 'legacy', 'temp', 'tmp', 'v1', 'v2', 'final',
  'final-final', 'backup', 'misc', 'stuff', 'utils2',
]);

const TEXT_EXT = new Set(['.js', '.mjs', '.css', '.html', '.md', '.json', '.yaml', '.yml', '.webmanifest']);
const LINE_LIMIT = 200;
const CHILD_LIMIT = 16;

const files = execSync('git ls-files --cached --others --exclude-standard', { cwd: ROOT, encoding: 'utf8' })
  .split('\n').filter(Boolean);

const violations = [];
const dirs = new Map(); // dir -> Set of direct children

for (const file of files) {
  const parts = file.split('/');
  // Register every ancestor directory's direct children.
  for (let i = 0; i < parts.length - 1; i++) {
    const dir = parts.slice(0, i).join('/') || '.';
    if (!dirs.has(dir)) dirs.set(dir, new Set());
    dirs.get(dir).add(parts[i]);
  }
  const parent = dirname(file) === '.' ? '.' : dirname(file);
  if (!dirs.has(parent)) dirs.set(parent, new Set());
  dirs.get(parent).add(parts[parts.length - 1]);

  // Banned file/dir names along the path.
  for (const part of parts) {
    const base = part.toLowerCase().replace(/\.[^.]+$/, '');
    if (BANNED_NAMES.has(base)) {
      violations.push(`${file}: banned name component "${part}"`);
    }
  }

  // Line limit for text files.
  const ext = file.slice(file.lastIndexOf('.'));
  if (TEXT_EXT.has(ext)) {
    const lines = readFileSync(join(ROOT, file), 'utf8').split('\n').length;
    const allowed = LINE_EXCEPTIONS.get(file);
    if (lines > LINE_LIMIT && allowed === undefined) {
      violations.push(`${file}: ${lines} lines (limit ${LINE_LIMIT})`);
    }
  }
}

// README per directory + child limits.
for (const [dir, children] of dirs) {
  if (dir !== '.' && !children.has('README.md')) {
    violations.push(`${dir}/: missing README.md`);
  }
  const limit = CHILD_EXCEPTIONS.get(dir) ?? CHILD_LIMIT;
  if (children.size > limit) {
    violations.push(`${dir}/: ${children.size} direct children (limit ${limit})`);
  }
}

if (violations.length > 0) {
  console.error('Structure violations:');
  for (const v of [...new Set(violations)]) console.error(`  - ${v}`);
  process.exit(1);
}
console.log(`check:structure — OK (${files.length} tracked files, ${dirs.size} directories)`);
