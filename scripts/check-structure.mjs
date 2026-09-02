#!/usr/bin/env node
/**
 * Repository structure gate.
 *
 * Enforces the legibility rules from the project contract over the set of
 * tracked-or-trackable files (git-tracked plus untracked, non-ignored;
 * untracked working-copy noise is not part of the repo):
 *   - every tracked directory contains a README.md;
 *   - warns above 16 direct children and fails above 24;
 *   - warns above 200 lines per source/doc file and fails above 400;
 *   - no directories or files named old/new/legacy/temp/v1/v2/final/...;
 *   - GitHub's higher-priority .github/README.md mirrors the root README.
 *
 * Documented exceptions live in LINE_EXCEPTIONS / CHILD_EXCEPTIONS below and
 * must name the reason. Exits non-zero on any violation.
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const ROOT = resolve(new URL('..', import.meta.url).pathname);

/** Files allowed to exceed the 400-line hard cap: path -> reason. */
const LINE_EXCEPTIONS = new Map([
  ['AGENTS.md', 'the superseding repository contract is intentionally comprehensive'],
  ['docs/work/autonomous-world-contract-closure-v1/README.md',
    'the user-supplied canonical implementation mandate must remain intact'],
  ['docs/work/living-boundary-semantics-v1/README.md',
    'the user-supplied canonical implementation mandate must remain intact'],
  ['scripts/browser-file-test.mjs',
    'one shared production-browser transport and focused dispatcher avoids duplicated browser harnesses'],
]);

/** Directories allowed to exceed the 24-child hard cap: path -> reason. */
const CHILD_EXCEPTIONS = new Map([
  // The independently testable shared edge projection adds one cohesive owner.
  ['tests/unit', 25],
]);

const BANNED_NAMES = new Set([
  'old', 'new', 'legacy', 'temp', 'tmp', 'v1', 'v2', 'final',
  'final-final', 'backup', 'misc', 'stuff', 'utils2',
]);

const TEXT_EXT = new Set(['.js', '.mjs', '.css', '.html', '.md', '.json', '.yaml', '.yml', '.webmanifest']);
const LINE_WARNING_LIMIT = 200;
const LINE_HARD_LIMIT = 400;
const CHILD_WARNING_LIMIT = 16;
const CHILD_HARD_LIMIT = 24;

const files = execSync('git ls-files --cached --others --exclude-standard', { cwd: ROOT, encoding: 'utf8' })
  .split('\n').filter(Boolean).filter((file) => existsSync(join(ROOT, file)));

const violations = []; const warnings = [];
const dirs = new Map(); // dir -> Set of direct children
const githubReadme = join(ROOT, '.github/README.md');
if (readFileSync(githubReadme, 'utf8') !== readFileSync(join(ROOT, 'README.md'), 'utf8')) {
  violations.push('.github/README.md: must exactly mirror the canonical root README.md');
}

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
    if (lines > LINE_HARD_LIMIT && allowed === undefined) {
      violations.push(`${file}: ${lines} lines (hard cap ${LINE_HARD_LIMIT})`);
    } else if (lines > LINE_WARNING_LIMIT) {
      warnings.push(`${file}: ${lines} lines (maintainability warning above ${LINE_WARNING_LIMIT})`);
    }
  }
}

// README per directory + child limits.
for (const [dir, children] of dirs) {
  if (dir !== '.' && !children.has('README.md')) {
    violations.push(`${dir}/: missing README.md`);
  }
  const hardLimit = CHILD_EXCEPTIONS.get(dir) ?? CHILD_HARD_LIMIT;
  if (children.size > hardLimit) {
    violations.push(`${dir}/: ${children.size} direct children (hard cap ${hardLimit})`);
  } else if (children.size > CHILD_WARNING_LIMIT) {
    warnings.push(`${dir}/: ${children.size} direct children (maintainability warning above ${CHILD_WARNING_LIMIT})`);
  }
}

if (warnings.length > 0) {
  console.warn('Structure warnings:');
  for (const warning of [...new Set(warnings)]) console.warn(`  - ${warning}`);
}
if (violations.length > 0) {
  console.error('Structure violations:');
  for (const v of [...new Set(violations)]) console.error(`  - ${v}`);
  process.exit(1);
}
console.log(`check:structure — OK (${files.length} tracked files, ${dirs.size} directories)`);
