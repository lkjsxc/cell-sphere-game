import { BIOME, FEATURE, LANDMARK } from './constants.js';

/** Select viable starts and compact geography-backed landmarks. */
export function createFeatures(rng, topo, terrain, hydro, ecology) {
  const { nodeCount: n, positions } = topo;
  const candidates = [];
  for (let i = 0; i < n; i++) {
    if (!terrain.landMask[i] || hydro.lakeId[i] >= 0 || ecology.baseTemp[i] <= .25 || ecology.baseMoisture[i] <= .3) continue;
    const tempFit = Math.max(0, 1 - Math.abs(ecology.baseTemp[i] - 0.6) * 1.8);
    const moistFit = Math.max(0, 1 - Math.abs(ecology.baseMoisture[i] - 0.58) * 1.55);
    const harsh = ecology.biomeId[i] === BIOME.MOUNTAIN
      || ecology.biomeId[i] === BIOME.SNOW_ICE ? 0.35 : 1;
    const score = ecology.baseNutrient[i] * (0.35 + tempFit * 0.65)
      * (0.35 + moistFit * 0.65) * harsh;
    candidates.push({ cell: i, score });
  }
  candidates.sort((a, b) => b.score - a.score || a.cell - b.cell);
  const sources = [];
  const openingRank = Math.min(candidates.length - 1, 2 + rng.intBelow(4));
  sources.push(candidates[openingRank].cell);
  while (sources.length < 6) {
    let best = -1; let bestValue = -1;
    for (const candidate of candidates) {
      if (sources.includes(candidate.cell)) continue;
      let separation = 2;
      for (const source of sources) separation = Math.min(separation,
        1 - dot(positions, source, candidate.cell));
      const value = candidate.score * (0.28 + 0.72 * Math.min(1, separation / 0.52));
      if (value > bestValue || (value === bestValue && candidate.cell < best)) {
        bestValue = value; best = candidate.cell;
      }
    }
    if (best < 0) break;
    sources.push(best);
  }
  for (const cell of sources) hydro.featureFlags[cell] |= FEATURE.SOURCE;
  const landmarks = buildLandmarks(n, terrain, hydro, ecology);
  for (const mark of landmarks) hydro.featureFlags[mark.cell] |= FEATURE.LANDMARK;
  return { sources: Object.freeze(sources), landmarks: Object.freeze(landmarks) };
}

function buildLandmarks(n, terrain, hydro, ecology) {
  const records = []; const used = new Set();
  add(LANDMARK.SUMMIT, (i) => terrain.landMask[i]
    ? terrain.baseElevation[i] + terrain.ridgeStrength[i] * 0.2 : -1);
  add(LANDMARK.GREAT_RIVER, (i) => hydro.riverStrength[i]);
  add(LANDMARK.FOREST_HEART, (i) => ecology.forestDensity[i]);
  add(LANDMARK.WILD_COAST, (i) => terrain.landMask[i]
    && terrain.coastDistance[i] === 0 ? ecology.baseNutrient[i] : -1);
  add(LANDMARK.DRYLAND, (i) => terrain.landMask[i]
    ? 1 - ecology.baseMoisture[i] + terrain.ridgeStrength[i] * 0.2 : -1);
  add(LANDMARK.LAKE, (i) => hydro.lakeId[i] >= 0 ? hydro.flowAccumulation[i] : -1);
  return records;

  function add(kind, score) {
    let best = -1; let value = 0;
    for (let i = 0; i < n; i++) {
      const next = used.has(i) ? -1 : score(i);
      if (next > value) { value = next; best = i; }
    }
    if (best >= 0) {
      used.add(best); records.push(Object.freeze({ kind, cell: best }));
    }
  }
}

function dot(positions, a, b) {
  return positions[a * 3] * positions[b * 3]
    + positions[a * 3 + 1] * positions[b * 3 + 1]
    + positions[a * 3 + 2] * positions[b * 3 + 2];
}
