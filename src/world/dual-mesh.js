/**
 * Goldberg-like spherical dual of the geodesic world graph.
 *
 * Every primal node becomes one selectable cell; incident triangle centres
 * become its ordered corners. The primal graph already provides the shared
 * boundaries, so simulation IDs and rendered cell IDs stay identical.
 */
import { assert } from '../core/assert.js';

function normalized(x, y, z) {
  const length = Math.hypot(x, y, z);
  return [x / length, y / length, z / length];
}

function dotAt(values, offset, vector) {
  return values[offset] * vector[0]
    + values[offset + 1] * vector[1]
    + values[offset + 2] * vector[2];
}

function edgeKey(a, b, nodeCount) {
  return a < b ? a * nodeCount + b : b * nodeCount + a;
}

/** @param {import('./icosphere.js').Topology} topo */
export function createDualMesh(topo) {
  const { nodeCount, triCount, edgeCount, positions, triangles } = topo;
  const corners = new Float32Array(triCount * 3);
  const incident = Array.from({ length: nodeCount }, () => []);
  const edgeIndex = new Map();
  const boundaryCornerA = new Uint16Array(edgeCount);
  const boundaryCornerB = new Uint16Array(edgeCount);
  boundaryCornerA.fill(0xffff);
  boundaryCornerB.fill(0xffff);

  for (let edge = 0; edge < edgeCount; edge++) {
    edgeIndex.set(edgeKey(topo.edgeA[edge], topo.edgeB[edge], nodeCount), edge);
  }

  for (let face = 0; face < triCount; face++) {
    const a = triangles[face * 3];
    const b = triangles[face * 3 + 1];
    const c = triangles[face * 3 + 2];
    const center = normalized(
      positions[a * 3] + positions[b * 3] + positions[c * 3],
      positions[a * 3 + 1] + positions[b * 3 + 1] + positions[c * 3 + 1],
      positions[a * 3 + 2] + positions[b * 3 + 2] + positions[c * 3 + 2],
    );
    corners.set(center, face * 3);
    incident[a].push(face); incident[b].push(face); incident[c].push(face);
    attachBoundary(a, b, face); attachBoundary(b, c, face); attachBoundary(c, a, face);
  }

  const cellStart = new Uint32Array(nodeCount + 1);
  for (let cell = 0; cell < nodeCount; cell++) {
    cellStart[cell + 1] = cellStart[cell] + incident[cell].length;
  }
  const cellCorners = new Uint16Array(cellStart[nodeCount]);

  for (let cell = 0; cell < nodeCount; cell++) {
    const normal = [positions[cell * 3], positions[cell * 3 + 1], positions[cell * 3 + 2]];
    const reference = Math.abs(normal[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    const tangent = normalized(
      reference[1] * normal[2] - reference[2] * normal[1],
      reference[2] * normal[0] - reference[0] * normal[2],
      reference[0] * normal[1] - reference[1] * normal[0],
    );
    const bitangent = [
      normal[1] * tangent[2] - normal[2] * tangent[1],
      normal[2] * tangent[0] - normal[0] * tangent[2],
      normal[0] * tangent[1] - normal[1] * tangent[0],
    ];
    incident[cell].sort((left, right) => {
      const lo = left * 3; const ro = right * 3;
      return Math.atan2(dotAt(corners, lo, bitangent), dotAt(corners, lo, tangent))
        - Math.atan2(dotAt(corners, ro, bitangent), dotAt(corners, ro, tangent));
    });
    cellCorners.set(incident[cell], cellStart[cell]);
  }

  for (let edge = 0; edge < edgeCount; edge++) {
    assert(boundaryCornerA[edge] !== 0xffff && boundaryCornerB[edge] !== 0xffff,
      `dual boundary ${edge} is not closed`);
  }
  assert(cellCorners.length === edgeCount * 2, `dual corner slots ${cellCorners.length}`);

  return Object.freeze({
    cellCount: nodeCount,
    cornerCount: triCount,
    boundaryCount: edgeCount,
    /** Unit directions for unique shared polygon corners. */
    corners,
    /** CSR offsets into cellCorners. */
    cellStart,
    /** Ordered corner IDs for every cell. */
    cellCorners,
    /** The two corner IDs delimiting each canonical cell boundary. */
    boundaryCornerA,
    boundaryCornerB,
  });

  function attachBoundary(a, b, face) {
    const edge = edgeIndex.get(edgeKey(a, b, nodeCount));
    assert(edge !== undefined, `missing primal edge ${a},${b}`);
    if (boundaryCornerA[edge] === 0xffff) boundaryCornerA[edge] = face;
    else {
      assert(boundaryCornerB[edge] === 0xffff, `edge ${edge} has more than two faces`);
      boundaryCornerB[edge] = face;
    }
  }
}

/** @typedef {ReturnType<typeof createDualMesh>} DualMesh */
