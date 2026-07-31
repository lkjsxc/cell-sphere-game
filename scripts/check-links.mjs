#!/usr/bin/env node
/**
 * Static link / deployment path checks.
 *
 * Verifies, without a network:
 *   - every local file referenced from index.html and from ES module imports
 *     under src/ exists;
 *   - all import specifiers use explicit relative paths with .js extensions
 *     (required for native browser modules and GitHub Pages);
 *   - no absolute https:// runtime imports or CDN references exist in src/
 *     or index.html (the app must work offline after first load);
 *   - no bare package specifiers are imported (zero runtime dependencies).
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const problems = [];

function listJs(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const info = statSync(full);
    if (info.isDirectory()) listJs(full, out);
    else if (name.endsWith('.js')) out.push(full);
  }
  return out;
}

// --- index.html asset references -----------------------------------------
const indexHtml = readFileSync(join(ROOT, 'index.html'), 'utf8');
const assetRefs = [...indexHtml.matchAll(/(?:src|href)="([^"#]+)"/g)].map((m) => m[1]);
for (const ref of assetRefs) {
  if (/^(https?:)?\/\//.test(ref) || ref.startsWith('data:')) {
    problems.push(`index.html references external URL: ${ref}`);
    continue;
  }
  if (!existsSync(join(ROOT, ref.split('?')[0]))) {
    problems.push(`index.html references missing file: ${ref}`);
  }
}

// --- ES module imports -----------------------------------------------------
const files = listJs(join(ROOT, 'src'));
for (const file of files) {
  const src = readFileSync(file, 'utf8');
  const imports = [...src.matchAll(/(?:import|export)[^'"]*from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|import\s+['"]([^'"]+)['"]/g)];
  for (const m of imports) {
    const spec = m[1] ?? m[2] ?? m[3];
    if (!spec) continue;
    if (/^https?:\/\//.test(spec)) {
      problems.push(`${file}: runtime remote import ${spec}`);
    } else if (spec.startsWith('.')) {
      if (!spec.endsWith('.js')) {
        problems.push(`${file}: import without .js extension: ${spec}`);
      } else if (!existsSync(resolve(dirname(file), spec))) {
        problems.push(`${file}: import target missing: ${spec}`);
      }
    } else {
      problems.push(`${file}: bare package import (dependencies are banned): ${spec}`);
    }
  }
  if (/from\s*['"]https?:\/\//.test(src) === false && /https:\/\/[^\s'"]+\.(js|css)/.test(src)) {
    problems.push(`${file}: possible CDN reference`);
  }
}

if (problems.length > 0) {
  console.error('Link/path problems:');
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`check:links — OK (${files.length} modules, ${assetRefs.length} html refs)`);
