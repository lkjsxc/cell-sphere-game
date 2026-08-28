#!/usr/bin/env node
/** Source gate: world geography renders only as whole cells and shared cell edges. */
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
const root = resolve(new URL('../..', import.meta.url).pathname);
const renderingFiles = jsFiles('src/rendering'); const worldFiles = jsFiles('src/world');
const sources = new Map([...renderingFiles, ...worldFiles].map((file) => [file, read(file)]));
const violations = [];
const obsolete = /\b(?:[av]?river(?:Down|Up|Meta|Strength|Class|Order|System|Upstream)?|majorRivers|tributary|GREAT_RIVER)\b/i;
const finePatterns = /quadraticCurveTo|bezierCurveTo|drawRivers|riverBoundary|(?:down|up|local)Channel|centerToCenter|subcellWater|insetWater|\bchannels?\b/i;
for (const file of renderingFiles) {
  const source = sources.get(file); reportMatches(file, source, obsolete, 'obsolete waterway identifier');
  reportMatches(file, source, finePatterns, 'fine-feature drawing pattern');
}
for (const file of worldFiles) reportMatches(file, sources.get(file), obsolete, 'obsolete public geography identifier');
for (const file of worldFiles.filter((file) => !file.endsWith('/hydrology.js'))) {
  reportMatches(file, sources.get(file), /\b(?:rainfall|filledElevation|flowAccumulation|drainTo)\b/, 'private drainage field escaped hydrology');
}
const fallback = sources.get('src/rendering/fallback2d.js');
const geographyStart = fallback.indexOf('for (let cell = 0; cell < topo.nodeCount; cell++)');
const geographyEnd = fallback.indexOf('if (snapshot)', geographyStart);
const staticGeography = fallback.slice(geographyStart, geographyEnd);
if (/cellPath\(cell\s*,/.test(staticGeography)) violations.push('src/rendering/fallback2d.js: static geography uses an inset cell path');
if (!/fields\.lakeId/.test(fallback) || !/fields\.lakeShore/.test(fallback)) violations.push('src/rendering/fallback2d.js: missing full-cell lake/shore material');
const geometry = sources.get('src/rendering/cell-geometry.js'); const shader = sources.get('src/rendering/shaders.js');
const worldPass = sources.get('src/rendering/world-pass.js'); const boundaryShader = sources.get('src/rendering/shaders-boundary.js');
const lifeEdges = sources.get('src/rendering/life-edges.js');
if (!/const lakeEdge/.test(geometry)) violations.push('src/rendering/cell-geometry.js: lake edges are not cell-boundary metadata');
if (!/float lakeCell/.test(shader) || !/\(1\.0 - lakeCell\)/.test(shader)) violations.push('src/rendering/shaders.js: lake relief is not flattened');
if (!/aEcology/.test(shader) || !/resourceState/.test(shader) || !/recoveringResource/.test(shader))
  violations.push('src/rendering/shaders.js: local resource presentation contract missing');
if (/mix\(base, vec3\(grey\)[^;]*uEntropy/.test(shader)) violations.push('src/rendering/shaders.js: global entropy terrain grayscale returned');
if (/const dim = 1 - entropy/.test(fallback)) violations.push('src/rendering/fallback2d.js: global entropy terrain dim returned');
if (!/writeLifeEdges\(this\.topo/.test(worldPass) || !/writeLifeEdges\(this\.topo/.test(fallback))
  violations.push('production backends do not consume the shared life-edge projection');
if (!/aLifeEdge/.test(worldPass) || !/aLifeEdge/.test(boundaryShader))
  violations.push('existing WebGL boundary pass does not carry dynamic life edges');
if (!/topo\.edgeA\[edge\]/.test(lifeEdges) || !/topo\.edgeB\[edge\]/.test(lifeEdges))
  violations.push('shared life-edge projection does not use canonical topology order');
if (/float frontier|alive \* life|frontier \* inset/.test(shader))
  violations.push('src/rendering/shaders.js: ordinary whole-cell life authority returned');
if (/lifeStyles|state === LIFE_STATE\.LIVING|state === LIFE_STATE\.FRONTIER/.test(fallback))
  violations.push('src/rendering/fallback2d.js: ordinary whole-cell life authority returned');
const renderer = sources.get('src/rendering/renderer.js');
if (!/drawCalls = 4/.test(renderer)) violations.push('src/rendering/renderer.js: steady-state draw count changed');
const fields = sources.get('src/world/fields.js');
for (const name of ['lakeId', 'lakeDepth', 'lakeShore', 'freshwaterInfluence', 'freshwaterTier', 'freshwaterLakeId', 'lakes']) {
  if (!new RegExp(`\\b${name}\\b`).test(fields)) violations.push(`src/world/fields.js: missing ${name}`);
}
const report = { scannedFiles: sources.size, renderingFiles: renderingFiles.length, worldFiles: worldFiles.length,
    fourDraws: /drawCalls = 4/.test(renderer), fullCellLakes: !/cellPath\(cell\s*,/.test(staticGeography),
  localResourceColor: /aEcology/.test(shader) && /resourceState/.test(shader), sharedLifeEdges: /writeLifeEdges\(this\.topo/.test(worldPass)
    && /writeLifeEdges\(this\.topo/.test(fallback), ordinaryLifeInteriorFill: false,
  globalEntropyTerrainFade: false, violations };
console.log(JSON.stringify(report, null, 2)); if (violations.length) process.exitCode = 1;
function jsFiles(directory) { return readdirSync(resolve(root, directory)).filter((name) => name.endsWith('.js')).sort().map((name) => `${directory}/${name}`); }
function read(file) { return readFileSync(resolve(root, file), 'utf8'); }
function reportMatches(file, source, pattern, reason) { for (const match of source.matchAll(new RegExp(pattern.source, `${pattern.flags.includes('i') ? 'i' : ''}g`))) {
  const line = source.slice(0, match.index).split('\n').length; violations.push(`${file}:${line}: ${reason}: ${match[0]}`); }
}
