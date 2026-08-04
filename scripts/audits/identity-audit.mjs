#!/usr/bin/env node
/** Rejects transitional identity in active source/config while preserving explicit evidence. */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(new URL('../..', import.meta.url).pathname);
const OLD = ['incremental', 'network', 'game'].join('-');
const OLD_GLOBAL = ['__IN', ''].join('_');
const TEXT = new Set(['.js', '.mjs', '.json', '.md', '.html', '.css', '.yml', '.yaml']);
const problems = [];
const allowed = [
  ['AGENTS.md', (line) => line.includes('legacy identity allowed')],
  ['src/core/identity.js', (line) => line.includes('LEGACY_PRODUCT')],
  ['docs/cell-sphere-release-ledger.md', (line) => line.includes('observed') && line.includes('start')],
];

for (const file of files(ROOT)) {
  const relative = file.slice(ROOT.length + 1); const text = readFileSync(file, 'utf8');
  text.split('\n').forEach((line, index) => {
    if (line.includes(OLD) && !allowed.some(([path, permit]) => path === relative && permit(line))) {
      problems.push(`${relative}:${index + 1}: transitional product identity in active text`);
    }
    if (line.includes(OLD_GLOBAL)) problems.push(`${relative}:${index + 1}: ambiguous legacy browser diagnostic global`);
  });
}
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
requireEqual(pkg.name, 'cell-sphere-game', 'package name');
requireEqual(pkg.repository?.url, 'https://github.com/lkjsxc/cell-sphere-game', 'repository URL');
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
for (const required of ['<title>cell-sphere-game — Every extinction becomes memory.</title>',
  'content="cell-sphere-game — Every extinction becomes memory."', '<h1 id="title-heading">cell-sphere-game</h1>']) {
  if (!html.includes(required)) problems.push(`index.html: missing canonical identity: ${required}`);
}
const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');
if (!readme.includes('# cell-sphere-game') || !readme.includes('https://lkjsxc.github.io/cell-sphere-game/')) {
  problems.push('README.md: canonical heading or Pages URL missing');
}
if (readme !== readFileSync(join(ROOT, '.github/README.md'), 'utf8')) problems.push('README mirrors are not byte-identical');
if (problems.length) {
  console.error('Identity audit failed:'); for (const problem of problems) console.error(`  - ${problem}`); process.exit(1);
}
console.log(`audit:identity — OK (canonical product/repo/Pages/browser/storage identity; ${allowed.length} narrow legacy allowances)`);

function files(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (['.git', 'reports', 'node_modules', 'tmp'].includes(name)) continue;
    const file = join(dir, name); const info = statSync(file);
    if (info.isDirectory()) files(file, out); else if (TEXT.has(file.slice(file.lastIndexOf('.')))) out.push(file);
  }
  return out;
}
function requireEqual(actual, expected, label) { if (actual !== expected) problems.push(`package.json: ${label} is ${JSON.stringify(actual)}`); }
