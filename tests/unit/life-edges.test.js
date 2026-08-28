import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LIFE_STATE } from '../../src/core/life-state.js';
import {
  BOUNDARY_VERTICES_PER_EDGE,
  LIFE_EDGE_RELATION,
  LIFE_EDGE_STATE,
  LIFE_EDGE_STRIDE,
  LIFE_EDGE_STYLE,
  classifyLifeEdge,
  lifeEdgeRelation,
  lifeEdgeState,
  lifeEdgeStyle,
  writeBoundaryLifeVertices,
  writeLifeEdges,
} from '../../src/rendering/life-edges.js';

const STATES = Object.values(LIFE_STATE);
const unpack = (packed) => ({ state: lifeEdgeState(packed), relation: lifeEdgeRelation(packed),
  style: lifeEdgeStyle(packed) });

test('every categorical pair is symmetric, finite, bounded, and deterministic', () => {
  for (const a of STATES) for (const b of STATES) {
    const first = classifyLifeEdge(a, b, 0.4, 0.8, 0.7, 1);
    const reverse = classifyLifeEdge(b, a, 0.8, 0.4, 1, 0.7);
    assert.equal(first, reverse, `${a},${b} endpoint order changed classification`);
    assert.equal(first, classifyLifeEdge(a, b, 0.4, 0.8, 0.7, 1));
    const edge = unpack(first);
    assert.ok(Object.values(LIFE_EDGE_STATE).includes(edge.state));
    assert.ok(Object.values(LIFE_EDGE_RELATION).includes(edge.relation));
    assert.ok(Object.values(LIFE_EDGE_STYLE).includes(edge.style));
    assert.ok(Number.isInteger(first) && first >= 0 && first <= 255);
  }
});

test('precedence and adjacency relation preserve the ecological hierarchy', () => {
  assert.deepEqual(unpack(classifyLifeEdge(LIFE_STATE.UNOCCUPIED, LIFE_STATE.UNOCCUPIED)),
    { state: LIFE_EDGE_STATE.NONE, relation: LIFE_EDGE_RELATION.INACTIVE, style: LIFE_EDGE_STYLE.NONE });
  assert.deepEqual(unpack(classifyLifeEdge(LIFE_STATE.LIVING, LIFE_STATE.FRONTIER, 1, 1)),
    { state: LIFE_EDGE_STATE.LIVING, relation: LIFE_EDGE_RELATION.INTERNAL, style: LIFE_EDGE_STYLE.LIVING_INTERNAL });
  assert.equal(unpack(classifyLifeEdge(LIFE_STATE.FRONTIER, LIFE_STATE.UNOCCUPIED)).relation, LIFE_EDGE_RELATION.EXPOSED);
  assert.equal(unpack(classifyLifeEdge(LIFE_STATE.STRESSED, LIFE_STATE.LIVING)).state, LIFE_EDGE_STATE.STRESSED);
  assert.equal(unpack(classifyLifeEdge(LIFE_STATE.CRITICAL, LIFE_STATE.STRESSED)).state, LIFE_EDGE_STATE.CRITICAL);
  const livingRemains = unpack(classifyLifeEdge(LIFE_STATE.DEAD_REMAINS, LIFE_STATE.LIVING));
  assert.equal(livingRemains.state, LIFE_EDGE_STATE.LIVING); assert.equal(livingRemains.relation, LIFE_EDGE_RELATION.EXPOSED);
  const remains = unpack(classifyLifeEdge(LIFE_STATE.DEAD_REMAINS, LIFE_STATE.UNOCCUPIED));
  assert.equal(remains.state, LIFE_EDGE_STATE.REMAINS); assert.equal(remains.relation, LIFE_EDGE_RELATION.RESIDUAL);
  assert.equal(remains.style, LIFE_EDGE_STYLE.REMAINS);
});

test('malformed optional intensity inputs and unknown states normalize safely', () => {
  for (const values of [[NaN, Infinity, -Infinity, NaN], [undefined, null, '1', {}]]) {
    const packed = classifyLifeEdge(LIFE_STATE.CRITICAL, LIFE_STATE.STRESSED, ...values);
    assert.equal(unpack(packed).state, LIFE_EDGE_STATE.CRITICAL);
    assert.ok(Number.isInteger(packed) && Number.isFinite(packed));
  }
  assert.deepEqual(unpack(classifyLifeEdge(99, -1, NaN, Infinity)),
    { state: LIFE_EDGE_STATE.NONE, relation: LIFE_EDGE_RELATION.INACTIVE, style: LIFE_EDGE_STYLE.NONE });
});

test('canonical topology writers are allocation-free, bounded, and preserve edge order', () => {
  const topo = { edgeCount: 3, edgeA: Uint16Array.from([0, 0, 1]), edgeB: Uint16Array.from([1, 2, 2]) };
  const states = Uint8Array.from([LIFE_STATE.LIVING, LIFE_STATE.LIVING, LIFE_STATE.UNOCCUPIED]);
  const edges = new Uint8Array(topo.edgeCount * LIFE_EDGE_STRIDE);
  assert.equal(writeLifeEdges(topo, states, edges), edges);
  assert.equal(lifeEdgeStyle(edges[0]), LIFE_EDGE_STYLE.LIVING_INTERNAL);
  assert.equal(lifeEdgeStyle(edges[2 * LIFE_EDGE_STRIDE]), LIFE_EDGE_STYLE.LIVING_EXPOSED);
  const vertices = new Uint8Array(topo.edgeCount * BOUNDARY_VERTICES_PER_EDGE * LIFE_EDGE_STRIDE);
  assert.equal(writeBoundaryLifeVertices(edges, vertices), vertices);
  for (let edge = 0; edge < topo.edgeCount; edge++) for (let vertex = 0; vertex < BOUNDARY_VERTICES_PER_EDGE; vertex++) {
    const source = edge * LIFE_EDGE_STRIDE; const target = (edge * BOUNDARY_VERTICES_PER_EDGE + vertex) * LIFE_EDGE_STRIDE;
    assert.deepEqual([...vertices.subarray(target, target + LIFE_EDGE_STRIDE)], [...edges.subarray(source, source + LIFE_EDGE_STRIDE)]);
  }
  assert.equal(edges.byteLength, topo.edgeCount, 'projection uses one byte per canonical edge');
  assert.throws(() => writeLifeEdges(topo, states, new Uint8Array(1)), /invalid life-edge output/);
});

test('edge projection has no renderer, time, camera, RNG, or simulation dependency', () => {
  const source = readFileSync(new URL('../../src/rendering/life-edges.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /Math\.random|performance|Date\.|camera|WebGL|Canvas|simulation\//);
  assert.match(source, /topo\.edgeA\[edge\]/); assert.match(source, /topo\.edgeB\[edge\]/);
});
