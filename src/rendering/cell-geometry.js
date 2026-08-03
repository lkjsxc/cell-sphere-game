/** Static render geometry for the spherical dual-cell substrate. */
import { createDualMesh } from '../world/dual-mesh.js';

function normal(x, y, z) {
  const length = Math.hypot(x, y, z);
  return [x / length, y / length, z / length];
}

function tangentToward(a, b, forward = true) {
  const d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const x = forward ? b[0] - a[0] * d : a[0] * d - b[0];
  const y = forward ? b[1] - a[1] * d : a[1] * d - b[1];
  const z = forward ? b[2] - a[2] * d : a[2] * d - b[2];
  return normal(x, y, z);
}

function cross(a, b) {
  return normal(
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  );
}

function offset(point, side, amount, radius) {
  const p = normal(
    point[0] + side[0] * amount,
    point[1] + side[1] * amount,
    point[2] + side[2] * amount,
  );
  return [p[0] * radius, p[1] * radius, p[2] * radius];
}

/**
 * Cell fans keep each simulation cell's attributes flat and addressable.
 * Boundary quads are raised slightly to prevent z-fighting.
 * @param {import('../world/icosphere.js').Topology} topo
 * @param {import('../world/fields.js').Fields} fields
 */
export function createCellGeometry(topo, fields) {
  const dual = createDualMesh(topo);
  const vertexCount = topo.nodeCount + dual.cellCorners.length;
  const positions = new Float32Array(vertexCount * 3);
  const centers = new Float32Array(vertexCount * 3);
  const material = new Float32Array(vertexCount * 4);
  const terrain = new Float32Array(vertexCount * 4);
  const vertexCell = new Uint16Array(vertexCount);
  const indices = new Uint16Array(dual.cellCorners.length * 3);
  let vertex = 0; let index = 0;

  for (let cell = 0; cell < topo.nodeCount; cell++) {
    const center = topo.positions.subarray(cell * 3, cell * 3 + 3);
    const first = vertex;
    writeVertex(center, cell);
    const start = dual.cellStart[cell]; const end = dual.cellStart[cell + 1];
    for (let offset = start; offset < end; offset++) {
      const corner = dual.cellCorners[offset] * 3;
      writeVertex(dual.corners.subarray(corner, corner + 3), cell);
    }
    const sides = end - start;
    for (let side = 0; side < sides; side++) {
      indices[index++] = first;
      indices[index++] = first + 1 + side;
      indices[index++] = first + 1 + ((side + 1) % sides);
    }
  }

  const boundaryPositions = new Float32Array(topo.edgeCount * 12);
  const boundaryFeature = new Float32Array(topo.edgeCount * 8);
  const boundaryIndices = new Uint16Array(topo.edgeCount * 6);
  for (let edge = 0; edge < topo.edgeCount; edge++) {
    const ai = dual.boundaryCornerA[edge] * 3;
    const bi = dual.boundaryCornerB[edge] * 3;
    const a = Array.from(dual.corners.subarray(ai, ai + 3));
    const b = Array.from(dual.corners.subarray(bi, bi + 3));
    const sideA = cross(a, tangentToward(a, b));
    const sideB = cross(b, tangentToward(b, a, false));
    const base = edge * 4;
    boundaryPositions.set(offset(a, sideA, 0.0018, 1.0025), base * 3);
    boundaryPositions.set(offset(a, sideA, -0.0018, 1.0025), (base + 1) * 3);
    boundaryPositions.set(offset(b, sideB, 0.0018, 1.0025), (base + 2) * 3);
    boundaryPositions.set(offset(b, sideB, -0.0018, 1.0025), (base + 3) * 3);
    const cellA = topo.edgeA[edge]; const cellB = topo.edgeB[edge];
    const coast = fields.landMask?.[cellA] !== fields.landMask?.[cellB] ? 1 : 0;
    for (let corner = 0; corner < 4; corner++) boundaryFeature.set([0, coast], (base + corner) * 2);
    boundaryIndices.set([base, base + 1, base + 2, base + 1, base + 3, base + 2], edge * 6);
  }

  return Object.freeze({
    dual, vertexCount, positions, centers, material, terrain, vertexCell, indices,
    boundaryPositions, boundaryFeature, boundaryIndices,
  });

  function writeVertex(position, cell) {
    positions.set(position, vertex * 3);
    centers.set(centerFor(cell), vertex * 3);
    material.set([
      fields.baseNutrient[cell], fields.baseMoisture[cell], fields.baseTemp[cell], fields.altitude[cell],
    ], vertex * 4);
    terrain.set([fields.biomeId?.[cell] ?? 5, fields.forestDensity?.[cell] ?? 0,
      fields.riverStrength?.[cell] ?? 0, fields.ridgeStrength?.[cell] ?? 0], vertex * 4);
    vertexCell[vertex] = cell;
    vertex++;
  }

  function centerFor(cell) {
    return topo.positions.subarray(cell * 3, cell * 3 + 3);
  }
}
