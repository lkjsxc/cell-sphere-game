/** Shared deterministic life semantics for canonical topology edges. */
import { LIFE_STATE } from '../core/life-state.js';

export const LIFE_EDGE_STATE = Object.freeze({
  NONE: 0,
  LIVING: 1,
  STRESSED: 2,
  CRITICAL: 3,
  REMAINS: 4,
});

export const LIFE_EDGE_RELATION = Object.freeze({
  INACTIVE: 0,
  INTERNAL: 1,
  EXPOSED: 2,
  RESIDUAL: 3,
});

export const LIFE_EDGE_STYLE = Object.freeze({
  NONE: 0,
  LIVING_INTERNAL: 1,
  LIVING_EXPOSED: 2,
  STRESSED_INTERNAL: 3,
  STRESSED_EXPOSED: 4,
  CRITICAL_INTERNAL: 5,
  CRITICAL_EXPOSED: 6,
  REMAINS: 7,
});

export const LIFE_EDGE_STYLE_COUNT = 8;
export const LIFE_EDGE_STRIDE = 1;
export const BOUNDARY_VERTICES_PER_EDGE = 4;

/** One byte packs the categorical state and adjacency relation. */
export function classifyLifeEdge(stateA, stateB) {
  const a = normalizeLifeState(stateA); const b = normalizeLifeState(stateB);
  const activeA = isActive(a); const activeB = isActive(b);
  const state = dominantState(a, b);
  const relation = activeA && activeB ? LIFE_EDGE_RELATION.INTERNAL
    : activeA || activeB ? LIFE_EDGE_RELATION.EXPOSED
      : state === LIFE_EDGE_STATE.REMAINS ? LIFE_EDGE_RELATION.RESIDUAL : LIFE_EDGE_RELATION.INACTIVE;
  return encodeLifeEdge(state, relation);
}

/** Write canonical edge-order records into a caller-owned Uint8Array. */
export function writeLifeEdges(topo, lifeState, out) {
  if (!(out instanceof Uint8Array) || out.length !== topo.edgeCount * LIFE_EDGE_STRIDE) {
    throw new Error('invalid life-edge output');
  }
  for (let edge = 0; edge < topo.edgeCount; edge++) {
    const a = topo.edgeA[edge]; const b = topo.edgeB[edge];
    out[edge] = classifyLifeEdge(lifeState?.[a], lifeState?.[b]);
  }
  return out;
}

/** Duplicate compact records for the four existing vertices of each boundary quad. */
export function writeBoundaryLifeVertices(edgeData, out) {
  const edgeCount = edgeData.length / LIFE_EDGE_STRIDE;
  if (!(edgeData instanceof Uint8Array) || !Number.isInteger(edgeCount)
    || !(out instanceof Uint8Array) || out.length !== edgeCount * BOUNDARY_VERTICES_PER_EDGE * LIFE_EDGE_STRIDE) {
    throw new Error('invalid boundary life-edge output');
  }
  for (let edge = 0; edge < edgeCount; edge++) {
    const code = edgeData[edge]; const target = edge * BOUNDARY_VERTICES_PER_EDGE;
    out[target] = code; out[target + 1] = code; out[target + 2] = code; out[target + 3] = code;
  }
  return out;
}

export function lifeEdgeState(code) { return code & 7; }
export function lifeEdgeRelation(code) { return (code >>> 3) & 3; }

export function lifeEdgeStyle(code) {
  const state = lifeEdgeState(code); const relation = lifeEdgeRelation(code);
  if (state === LIFE_EDGE_STATE.NONE) return LIFE_EDGE_STYLE.NONE;
  if (state === LIFE_EDGE_STATE.REMAINS) return LIFE_EDGE_STYLE.REMAINS;
  const exposed = relation === LIFE_EDGE_RELATION.EXPOSED ? 1 : 0;
  return 1 + (state - LIFE_EDGE_STATE.LIVING) * 2 + exposed;
}

function encodeLifeEdge(state, relation) { return state | (relation << 3); }
function normalizeLifeState(value) { return Number.isInteger(value) && value >= LIFE_STATE.UNOCCUPIED
  && value <= LIFE_STATE.DEAD_REMAINS ? value : LIFE_STATE.UNOCCUPIED; }
function isActive(state) { return state >= LIFE_STATE.LIVING && state <= LIFE_STATE.CRITICAL; }
function dominantState(a, b) {
  if (a === LIFE_STATE.CRITICAL || b === LIFE_STATE.CRITICAL) return LIFE_EDGE_STATE.CRITICAL;
  if (a === LIFE_STATE.STRESSED || b === LIFE_STATE.STRESSED) return LIFE_EDGE_STATE.STRESSED;
  if (isActive(a) || isActive(b)) return LIFE_EDGE_STATE.LIVING;
  if (a === LIFE_STATE.DEAD_REMAINS || b === LIFE_STATE.DEAD_REMAINS) return LIFE_EDGE_STATE.REMAINS;
  return LIFE_EDGE_STATE.NONE;
}
