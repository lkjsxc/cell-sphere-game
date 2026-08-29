/** Fixed render-owned unit sphere for the decorative atmosphere shell. */
const REFINEMENT = 5;
const PHI = (1 + Math.sqrt(5)) / 2;
const BASE_VERTICES = [
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

export const ATMOSPHERE_SAGITTA_LIMIT_CSS_PX = 0.25;
export const ATMOSPHERE_GEOMETRY = createFixedAtmosphereGeometry();

function createFixedAtmosphereGeometry() {
  let vertices = BASE_VERTICES.map(normalize);
  let faces = BASE_FACES.map((face) => face.slice());
  for (let level = 0; level < REFINEMENT; level++) {
    const midpointCache = new Map(); const nextFaces = [];
    const midpoint = (left, right) => {
      const low = Math.min(left, right); const high = Math.max(left, right);
      const key = low * 65536 + high; const cached = midpointCache.get(key);
      if (cached !== undefined) return cached;
      const a = vertices[left]; const b = vertices[right];
      const index = vertices.length;
      vertices.push(normalize([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]));
      midpointCache.set(key, index); return index;
    };
    for (const [a, b, c] of faces) {
      const ab = midpoint(a, b); const bc = midpoint(b, c); const ca = midpoint(c, a);
      nextFaces.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
    }
    faces = nextFaces;
  }

  const positions = new Float32Array(vertices.length * 3);
  for (let vertex = 0; vertex < vertices.length; vertex++) {
    positions[vertex * 3] = Math.fround(vertices[vertex][0]);
    positions[vertex * 3 + 1] = Math.fround(vertices[vertex][1]);
    positions[vertex * 3 + 2] = Math.fround(vertices[vertex][2]);
  }
  const indices = new Uint16Array(faces.length * 3);
  for (let triangle = 0; triangle < faces.length; triangle++) indices.set(faces[triangle], triangle * 3);
  const maximumAngularEdge = measureMaximumAngularEdge(positions, indices);
  return Object.freeze({ refinement: REFINEMENT, positions, indices,
    vertexCount: positions.length / 3, indexCount: indices.length, triangleCount: indices.length / 3,
    indexType: 'uint16', positionBytes: positions.byteLength, indexBytes: indices.byteLength,
    byteLength: positions.byteLength + indices.byteLength, maximumAngularEdge,
    signature: geometrySignature(positions, indices), constructionCount: 1 });
}

function normalize(vector) {
  const inverse = 1 / Math.hypot(vector[0], vector[1], vector[2]);
  return [vector[0] * inverse, vector[1] * inverse, vector[2] * inverse];
}
function measureMaximumAngularEdge(positions, indices) {
  let maximum = 0;
  for (let triangle = 0; triangle < indices.length; triangle += 3) {
    maximum = Math.max(maximum, angularEdge(positions, indices[triangle], indices[triangle + 1]),
      angularEdge(positions, indices[triangle + 1], indices[triangle + 2]),
      angularEdge(positions, indices[triangle + 2], indices[triangle]));
  }
  return maximum;
}
function angularEdge(positions, left, right) {
  const a = left * 3; const b = right * 3;
  const dot = positions[a] * positions[b] + positions[a + 1] * positions[b + 1] + positions[a + 2] * positions[b + 2];
  return Math.acos(Math.max(-1, Math.min(1, dot)));
}
function geometrySignature(positions, indices) {
  const bytes = new ArrayBuffer(4); const view = new DataView(bytes); let hash = 2166136261;
  const update = (length) => { for (let byte = 0; byte < length; byte++) hash = Math.imul(hash ^ view.getUint8(byte), 16777619); };
  for (const value of positions) { view.setFloat32(0, value, true); update(4); }
  for (const value of indices) { view.setUint16(0, value, true); update(2); }
  return `atmosphere-v1-l${REFINEMENT}-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}
