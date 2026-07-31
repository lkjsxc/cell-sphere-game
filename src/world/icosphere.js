/**
 * Geodesic icosphere topology — the canonical world graph.
 *
 * Subdivision level 4: 2,562 nodes, 5,120 triangles, 7,680 undirected edges.
 * Mostly degree-6 nodes; exactly 12 degree-5 vertices (the original
 * icosahedron corners). Generation uses only +,-,*,/ and Math.sqrt
 * (IEEE-correct per spec) so the topology is bit-identical everywhere.
 */
import { assert } from '../core/assert.js';

const PHI = (1 + Math.sqrt(5)) / 2;

// Icosahedron: 12 vertices, 20 faces (standard winding).
const BASE_VERTS = [
  [-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0],
  [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI],
  [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1],
];
const BASE_FACES = [
  [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
  [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
  [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
  [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
];

function normalize3(v) {
  const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  return [v[0] / len, v[1] / len, v[2] / len];
}

/**
 * Subdivide `faces` on the unit sphere `levels` times.
 * @returns {{positions: Float32Array, triangles: Uint16Array}}
 */
function subdivide(levels) {
  let verts = BASE_VERTS.map(normalize3);
  let faces = BASE_FACES.slice();

  for (let lvl = 0; lvl < levels; lvl++) {
    const midCache = new Map();
    const nextFaces = [];
    const midpoint = (a, b) => {
      const key = a < b ? a * 100000 + b : b * 100000 + a;
      const hit = midCache.get(key);
      if (hit !== undefined) return hit;
      const va = verts[a]; const vb = verts[b];
      verts.push(normalize3([(va[0] + vb[0]) / 2, (va[1] + vb[1]) / 2, (va[2] + vb[2]) / 2]));
      const idx = verts.length - 1;
      midCache.set(key, idx);
      return idx;
    };
    for (const [a, b, c] of faces) {
      const ab = midpoint(a, b);
      const bc = midpoint(b, c);
      const ca = midpoint(c, a);
      nextFaces.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
    }
    faces = nextFaces;
  }

  const positions = new Float32Array(verts.length * 3);
  for (let i = 0; i < verts.length; i++) {
    positions[i * 3] = Math.fround(verts[i][0]);
    positions[i * 3 + 1] = Math.fround(verts[i][1]);
    positions[i * 3 + 2] = Math.fround(verts[i][2]);
  }
  const triangles = new Uint16Array(faces.length * 3);
  for (let i = 0; i < faces.length; i++) {
    triangles[i * 3] = faces[i][0];
    triangles[i * 3 + 1] = faces[i][1];
    triangles[i * 3 + 2] = faces[i][2];
  }
  return { positions, triangles };
}

/**
 * Build the full topology. Deterministic; safe to call on both worker and
 * main thread — results are identical.
 * @param {number} [levels=4]
 */
export function createTopology(levels = 4) {
  const { positions, triangles } = subdivide(levels);
  const nodeCount = positions.length / 3;
  const triCount = triangles.length / 3;

  // Unique undirected edges from triangle adjacency, canonically sorted.
  const edgeSet = new Set();
  const addEdge = (a, b) => edgeSet.add(a < b ? a * nodeCount + b : b * nodeCount + a);
  for (let t = 0; t < triCount; t++) {
    const a = triangles[t * 3]; const b = triangles[t * 3 + 1]; const c = triangles[t * 3 + 2];
    addEdge(a, b); addEdge(b, c); addEdge(c, a);
  }
  const edgeKeys = [...edgeSet].sort((x, y) => x - y);
  const edgeCount = edgeKeys.length;
  const edgeA = new Uint16Array(edgeCount);
  const edgeB = new Uint16Array(edgeCount);
  for (let e = 0; e < edgeCount; e++) {
    edgeA[e] = Math.floor(edgeKeys[e] / nodeCount);
    edgeB[e] = edgeKeys[e] % nodeCount;
  }

  // CSR adjacency: per-node edge list + neighbor list.
  const degree = new Uint8Array(nodeCount);
  for (let e = 0; e < edgeCount; e++) { degree[edgeA[e]]++; degree[edgeB[e]]++; }
  const nodeStart = new Uint32Array(nodeCount + 1);
  for (let i = 0; i < nodeCount; i++) nodeStart[i + 1] = nodeStart[i] + degree[i];
  const nodeEdges = new Uint32Array(edgeCount * 2);
  const nodeNeighbors = new Uint16Array(edgeCount * 2);
  const cursor = new Uint32Array(nodeCount);
  for (let e = 0; e < edgeCount; e++) {
    const a = edgeA[e]; const b = edgeB[e];
    let o = nodeStart[a] + cursor[a]++;
    nodeEdges[o] = e; nodeNeighbors[o] = b;
    o = nodeStart[b] + cursor[b]++;
    nodeEdges[o] = e; nodeNeighbors[o] = a;
  }

  assert(nodeCount === 10 * 4 ** levels + 2, `node count ${nodeCount}`);
  assert(triCount === 20 * 4 ** levels, `triangle count ${triCount}`);
  assert(edgeCount === 30 * 4 ** levels, `edge count ${edgeCount}`);

  return Object.freeze({
    levels,
    nodeCount,
    triCount,
    edgeCount,
    /** Unit-sphere positions (also normals). Float32Array(nodeCount*3). */
    positions,
    /** Triangle indices. Uint16Array(triCount*3). */
    triangles,
    /** Edge endpoints. Uint16Array(edgeCount) each. */
    edgeA,
    edgeB,
    /** CSR start offsets into nodeEdges/nodeNeighbors. Uint32Array(nodeCount+1). */
    nodeStart,
    /** Edge indices incident to each node. Uint32Array(edgeCount*2). */
    nodeEdges,
    /** Neighbor node index for each nodeEdges slot. Uint16Array(edgeCount*2). */
    nodeNeighbors,
    /** Incident edge count per node. Uint8Array(nodeCount). */
    degree,
  });
}

/** @typedef {ReturnType<typeof createTopology>} Topology */
