#!/usr/bin/env node
/** Reject every active trace of the retired mid-run choice system. */
import { existsSync, readFileSync, readdirSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const ROOT = resolve(new URL('../..', import.meta.url).pathname);
const deleted = [
  'src/game/adaptations.js','src/core/adaptation-origin.js','src/core/adaptation-arrival.js',
  'src/simulation/protocol/adaptation-command.js','src/interface/policies/adaptation-effects.js',
  'src/rendering/adaptation-propagation.js','src/game/trophies/adaptation.js',
];
const patterns = [
  /from\s+['"][^'"]*adaptations\.js['"]/, /adaptation-offered/, /adaptation-selected/,
  /choose-adaptation/, /set-adaptation-mode/, /adaptationMode/, /adaptationOffers/, /ownedCards/,
  /pendingAdaptations/, /aAdaptation/, /uAdaptation/, /adaptations-button/, /adaptations-dialog/,
  /adaptation-caption/, /adaptationCaption/, /adaptation-mode-control/,
];
const files = walk('src').concat(['index.html', ...walk('styles')]); const violations = [];
for (const file of files) {
  const text = readFileSync(resolve(ROOT, file), 'utf8');
  text.split('\n').forEach((line, index) => patterns.forEach((pattern) => {
    if (pattern.test(line)) violations.push(`${file}:${index + 1}:${pattern}`);
  }));
}
for (const file of deleted) if (existsSync(resolve(ROOT, file))) violations.push(`${file}: deleted module still exists`);
const report = { activeFilesScanned: files.length, deletedModules: deleted.length, violations, valid: violations.length === 0 };
mkdirSync(resolve(ROOT, 'reports'), { recursive: true });
writeFileSync(resolve(ROOT, 'reports/adaptation-removal-audit.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2)); if (violations.length) process.exitCode = 1;
function walk(relative) { const out = []; const directory = resolve(ROOT, relative);
  for (const name of readdirSync(directory)) { const path = resolve(directory, name); const rel = `${relative}/${name}`;
    if (statSync(path).isDirectory()) out.push(...walk(rel)); else if (/\.(?:js|html|css|md)$/.test(name)) out.push(rel); }
  return out; }
