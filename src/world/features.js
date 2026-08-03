import { BIOME, FEATURE, LANDMARK } from './constants.js';

/** Select viable starts and compact geography-backed landmarks. */
export function createFeatures(rng, topo, terrain, hydro, ecology) {
  const { nodeCount: n, positions } = topo; const candidates = [];
  for (let cell = 0; cell < n; cell++) {
    const sourceBiome = ecology.biomeId[cell];
    if (!terrain.landMask[cell] || terrain.coastDistance[cell] === 0 || hydro.lakeId[cell] >= 0
      || ![BIOME.FOREST, BIOME.WET_FOREST, BIOME.GRASS].includes(sourceBiome)
      || ecology.baseTemp[cell] <= .25 || ecology.baseMoisture[cell] <= .3) continue;
    let besideLake = false;
    for (let offset = topo.nodeStart[cell]; offset < topo.nodeStart[cell + 1]; offset++) besideLake ||= hydro.lakeId[topo.nodeNeighbors[offset]] >= 0;
    if (besideLake) continue;
    const tempFit = Math.max(0, 1 - Math.abs(ecology.baseTemp[cell] - .6) * 1.8);
    const moistFit = Math.max(0, 1 - Math.abs(ecology.baseMoisture[cell] - .58) * 1.55);
    const harsh = ecology.biomeId[cell] === BIOME.MOUNTAIN
      || ecology.biomeId[cell] === BIOME.SNOW_ICE ? .35 : 1;
    const score = ecology.baseNutrient[cell] * (.35 + tempFit * .65)
      * (.35 + moistFit * .65) * harsh;
    candidates.push({ cell, score });
  }
  candidates.sort((a, b) => b.score - a.score || a.cell - b.cell);
  const sources = []; const openingRank = Math.min(candidates.length - 1, 2 + rng.intBelow(4));
  if (openingRank >= 0) sources.push(candidates[openingRank].cell);
  while (sources.length < 6) {
    let best = -1; let bestValue = -1;
    for (const candidate of candidates) {
      if (sources.includes(candidate.cell)) continue; let separation = 2;
      for (const source of sources) separation = Math.min(separation, 1 - dot(positions, source, candidate.cell));
      const value = candidate.score * (.28 + .72 * Math.min(1, separation / .52));
      if (value > bestValue || value === bestValue && candidate.cell < best) { bestValue = value; best = candidate.cell; }
    }
    if (best < 0) break; sources.push(best);
  }
  for (const cell of sources) hydro.featureFlags[cell] |= FEATURE.SOURCE;
  const landmarks = buildLandmarks(n, terrain, hydro, ecology);
  for (const mark of landmarks) hydro.featureFlags[mark.cell] |= FEATURE.LANDMARK;
  return { sources: Object.freeze(sources), landmarks: Object.freeze(landmarks) };
}

function buildLandmarks(n, terrain, hydro, ecology) {
  const records = []; const used = new Set();
  add(LANDMARK.SUMMIT, (cell) => terrain.landMask[cell]
    ? terrain.baseElevation[cell] + terrain.ridgeStrength[cell] * .2 : -1);
  add(LANDMARK.GREAT_LAKE, (cell) => {
    const id = hydro.lakeId[cell]; if (id < 0) return -1; const lake = hydro.lakes[id];
    return lake.area + hydro.lakeDepth[cell] * 8;
  });
  add(LANDMARK.FOREST_HEART, (cell) => ecology.forestDensity[cell]);
  add(LANDMARK.WILD_COAST, (cell) => terrain.landMask[cell]
    && terrain.coastDistance[cell] === 0 ? ecology.baseNutrient[cell] : -1);
  add(LANDMARK.DRYLAND, (cell) => terrain.landMask[cell] && hydro.lakeId[cell] < 0
    ? 1 - ecology.baseMoisture[cell] + terrain.ridgeStrength[cell] * .2 : -1);
  add(LANDMARK.LAKE_SHORE, (cell) => hydro.lakeShore[cell]
    ? hydro.freshwaterInfluence[cell] + ecology.baseNutrient[cell] * .2 : -1);
  return records;

  function add(kind, score) {
    let best = -1; let value = 0;
    for (let cell = 0; cell < n; cell++) {
      const next = used.has(cell) ? -1 : score(cell);
      if (next > value) { value = next; best = cell; }
    }
    if (best >= 0) { used.add(best); records.push(Object.freeze({ kind, cell: best })); }
  }
}
function dot(positions, a, b) { return positions[a * 3] * positions[b * 3]
  + positions[a * 3 + 1] * positions[b * 3 + 1] + positions[a * 3 + 2] * positions[b * 3 + 2]; }
