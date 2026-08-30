/** Cellular renderer projection for the read-only Trophy Sphere. */
import { createRng } from '../../core/prng.js';
import { smoothField, sphericalField } from '../../world/noise.js';
import { TROPHIES } from './index.js';
export const TROPHY_STATUS = Object.freeze({ UNEARNED: 2, EARNED: 4, SELECTED_UNEARNED: 6, SELECTED_EARNED: 8 });
export function createTrophyFields(topo) {
  const rng = createRng(0xe701c311); const count = topo.nodeCount;
  const nutrientField = smoothField(sphericalField(rng, topo.positions, count, { lobes: 23, sharpness: 3, signed: true }), topo, 1);
  const moistureField = smoothField(sphericalField(rng, topo.positions, count, { lobes: 19, sharpness: 2, signed: true }), topo, 1);
  const temperatureField = smoothField(sphericalField(rng, topo.positions, count, { lobes: 17, sharpness: 2, signed: true }), topo, 1);
  const reliefField = sphericalField(rng, topo.positions, count, { lobes: 29, sharpness: 4, signed: true });
  const baseNutrient = scaled(nutrientField, .16, .62); const baseMoisture = scaled(moistureField, .12, .70);
  const baseTemp = scaled(temperatureField, .18, .66); const altitude = scaled(reliefField, .27, .42);
  const forestDensity = new Float32Array(count); const ridgeStrength = new Float32Array(count);
  for (let cell = 0; cell < count; cell++) {
    forestDensity[cell] = Math.fround(.08 + nutrientField[cell] * moistureField[cell] * .34);
    ridgeStrength[cell] = Math.fround(.05 + Math.abs(reliefField[cell] - .5) * .32);
  }
  return Object.freeze({ baseNutrient, baseMoisture, baseTemp, altitude,
    biomeId: new Uint8Array(count).fill(9), forestDensity,
    lakeDepth: new Float32Array(count), lakeShore: new Uint8Array(count), freshwaterInfluence: new Float32Array(count),
    lakeId: new Int16Array(count).fill(-1), ridgeStrength, landMask: new Uint8Array(count).fill(1),
    landmarks: Object.freeze([]), sources: Object.freeze([0]) });
}
export function buildTrophySnapshot(topo, meta, selectedId = null, emphasizedIds = []) {
  if (topo.levels !== 2 || topo.nodeCount !== 162) throw new Error('Trophy Sphere requires the level-2 topology');
  const count = topo.nodeCount; const status = new Uint8Array(count); const branch = new Uint8Array(count);
  const tier = new Uint8Array(count); const kind = new Uint8Array(count); const nodeIndex = new Int16Array(count).fill(-1);
  const emphasis = new Uint8Array(count); const imprint = new Float32Array(count); const earnedIds = new Set(meta?.trophyIds ?? []);
  const emphasized = new Set(emphasizedIds); const nodes = TROPHIES.map((trophy, index) => {
    const earned = earnedIds.has(trophy.id); const selected = trophy.id === selectedId; status[trophy.cell] = earned
      ? selected ? TROPHY_STATUS.SELECTED_EARNED : TROPHY_STATUS.EARNED
      : selected ? TROPHY_STATUS.SELECTED_UNEARNED : TROPHY_STATUS.UNEARNED;
    branch[trophy.cell] = Math.floor(index / 16) + 1; tier[trophy.cell] = trophy.tier; kind[trophy.cell] = 4;
    nodeIndex[trophy.cell] = index; emphasis[trophy.cell] = emphasized.has(trophy.id) ? 1 : 0;
    return Object.freeze({ ...trophy, earned, selected });
  });
  return Object.freeze({ tick: earnedIds.size * 16 + (selectedId ? 1 : 0), entropy: .2, status: 'trophies',
    memoryStatus: status, memoryBranch: branch, memoryTier: tier, memoryKind: kind,
    memoryImprintWeight: imprint, memoryNodeIndex: nodeIndex, memoryEmphasis: emphasis,
    trophyScene: Object.freeze({ selectedId, nodes: Object.freeze(nodes) }), nodeStates: Object.freeze(nodes),
    metrics: Object.freeze({ coverage: earnedIds.size / 96, score: 0 }),
    focus: focusDirection(topo, nodes.filter((node) => node.earned).map((node) => node.cell)),
  });
}
function focusDirection(topo, cells) { const use = cells.length ? cells : TROPHIES.filter((trophy) => trophy.familyIndex === 0).map((trophy) => trophy.cell); const focus = [0, 0, 0];
  for (const cell of use) for (let axis = 0; axis < 3; axis++) focus[axis] += topo.positions[cell * 3 + axis];
  const length = Math.hypot(...focus); return length ? focus.map((value) => value / length) : [0, 0, 1]; }
function scaled(source, offset, scale) { const out = new Float32Array(source.length);
  for (let index = 0; index < source.length; index++) out[index] = Math.fround(offset + source[index] * scale); return out; }
