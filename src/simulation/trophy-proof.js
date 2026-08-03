/** Bounded, authority-neutral whole-cell proof for completed-world Trophies. */
import { BIOME, FEATURE } from '../world/fields.js';

const TYPE_BITS = Object.freeze({ glacial: 1, marsh: 2, 'salt-basin': 4, rift: 8, 'rain-fed': 16 });
const SALINITY_BITS = Object.freeze({ fresh: 1, brackish: 2, saline: 4 });

export function createTrophyProof(topo, fields) {
  return {
    reached: new Uint8Array(topo.nodeCount), lakeReached: new Uint8Array(fields.lakes.length),
    shoreReached: new Uint16Array(fields.lakes.length), completedShore: new Uint8Array(fields.lakes.length),
    lakeCellsReached: 0, shoreCellsReached: 0, distinctLakesReached: 0, completeShores: 0,
    ecologyMask: 0, lakeTypeMask: 0, lakeSalinityMask: 0,
    lakeLivingSamples: 0, largeLakeLivingSamples: 0, lakeRegionPeak: 0,
    lakeRegionAlive: 0, largeLakeRegionAlive: 0, droughtLakeSurvivals: 0, freezeLakeSurvivals: 0,
    loopSurplusPeak: 0, loopLivingSamples: 0,
  };
}

export function recordTrophyReach(state, cell) {
  const proof = state.trophyProof; if (!proof || proof.reached[cell]) return;
  proof.reached[cell] = 1; const { fields, topo } = state; const lakeId = fields.lakeId[cell];
  if (lakeId >= 0) { proof.lakeCellsReached++; markLake(proof, fields.lakes[lakeId]); }
  if (fields.lakeShore[cell]) {
    proof.shoreCellsReached++;
    for (const id of adjacentLakes(topo, fields, cell)) { const lake = fields.lakes[id]; markLake(proof, lake);
      proof.shoreReached[id]++; if (!proof.completedShore[id] && proof.shoreReached[id] >= lake.shoreCells.length) {
        proof.completedShore[id] = 1; proof.completeShores++;
      }
    }
  }
  if (fields.biomeId[cell] === BIOME.LAKE) proof.ecologyMask |= 1;
  if (fields.biomeId[cell] === BIOME.WETLAND) proof.ecologyMask |= 2;
  if (fields.featureFlags[cell] & FEATURE.FOREST) proof.ecologyMask |= 4;
  if ([BIOME.HIGHLAND, BIOME.MOUNTAIN].includes(fields.biomeId[cell])) proof.ecologyMask |= 8;
}

/** One bounded scan at the existing one-second summary cadence, never per tick. */
export function sampleTrophyLiving(state) {
  const proof = state.trophyProof; let lake = 0; let shore = 0; let large = 0; let edges = 0;
  for (let cell = 0; cell < state.topo.nodeCount; cell++) {
    if (!state.alive[cell]) continue; const id = state.fields.lakeId[cell];
    if (id >= 0) { lake++; if (state.fields.lakes[id].areaClass === 'large') large++; }
    if (state.fields.lakeShore[cell]) { shore++;
      if (adjacentLakes(state.topo, state.fields, cell).some((next) => state.fields.lakes[next].areaClass === 'large')) large++;
    }
  }
  for (let edge = 0; edge < state.topo.edgeCount; edge++) edges += state.edgeActive[edge];
  proof.lakeRegionAlive = lake + shore; proof.largeLakeRegionAlive = large;
  proof.lakeRegionPeak = Math.max(proof.lakeRegionPeak, proof.lakeRegionAlive);
  if (lake >= 2 && shore >= 6) proof.lakeLivingSamples++;
  if (large >= 8) proof.largeLakeLivingSamples++;
  const surplus = Math.max(0, edges - state.aliveCount + Math.max(1, Math.round((1 - state.connectedShare) * state.aliveCount)));
  proof.loopSurplusPeak = Math.max(proof.loopSurplusPeak, surplus);
  if (surplus >= 8 && proof.lakeRegionAlive >= 8) proof.loopLivingSamples++;
}

export function recordTrophyCrisisSurvival(state, family) {
  const proof = state.trophyProof; if (proof.lakeRegionAlive < 6) return;
  if (family === 'drought') proof.droughtLakeSurvivals++;
  if (family === 'freeze') proof.freezeLakeSurvivals++;
}

export function buildLakeProof(state) {
  const p = state.trophyProof;
  return Object.freeze({ version: 1, lakeCellsReached: p.lakeCellsReached, shoreCellsReached: p.shoreCellsReached,
    distinctLakesReached: p.distinctLakesReached, completeShores: p.completeShores, ecologyMask: p.ecologyMask,
    lakeTypeMask: p.lakeTypeMask, lakeSalinityMask: p.lakeSalinityMask,
    lakeLivingSeconds: p.lakeLivingSamples, largeLakeLivingSeconds: p.largeLakeLivingSamples,
    lakeRegionPeak: p.lakeRegionPeak, droughtLakeSurvivals: p.droughtLakeSurvivals,
    freezeLakeSurvivals: p.freezeLakeSurvivals, loopSurplusPeak: p.loopSurplusPeak,
    lakeLoopSeconds: p.loopLivingSamples });
}

function markLake(proof, lake) {
  if (!proof.lakeReached[lake.id]) { proof.lakeReached[lake.id] = 1; proof.distinctLakesReached++; }
  proof.lakeTypeMask |= TYPE_BITS[lake.type] ?? 0; proof.lakeSalinityMask |= SALINITY_BITS[lake.salinity] ?? 0;
}
function adjacentLakes(topo, fields, cell) { const ids = [];
  for (let offset = topo.nodeStart[cell]; offset < topo.nodeStart[cell + 1]; offset++) { const id = fields.lakeId[topo.nodeNeighbors[offset]];
    if (id >= 0 && !ids.includes(id)) ids.push(id);
  } return ids;
}
