/** Deterministic fine-cell territories over an authoritative authored graph. */
import { fnv1aBytes, hexU32 } from '../../core/hash.js';

export const EVOLUTION_TERRITORY_EDGE = Object.freeze({
  INTERNAL: 0,
  BOUNDARY: 1,
  EMPHASIZED: 2,
  SELECTED: 3,
});

/**
 * Refine authored sites into connected fine-cell territories without creating
 * progression nodes. The returned typed arrays are immutable by contract.
 */
export function createEvolutionTerritoryProjection(presentationTopology, authoredTopology, nodes) {
  validateInputs(presentationTopology, authoredTopology, nodes);
  const skillCount = nodes.length;
  const skillBySiteCell = new Int16Array(authoredTopology.nodeCount).fill(-1);
  const siteCellBySkill = new Uint16Array(skillCount);
  for (let skill = 0; skill < skillCount; skill++) {
    const siteCell = nodes[skill].cell;
    if (!Number.isInteger(siteCell) || siteCell < 0 || siteCell >= authoredTopology.nodeCount
      || skillBySiteCell[siteCell] >= 0) throw new Error(`invalid Evolution territory site at skill ${skill}`);
    skillBySiteCell[siteCell] = skill; siteCellBySkill[skill] = siteCell;
  }

  const ownerByCell = new Uint8Array(presentationTopology.nodeCount);
  const territorySize = new Uint16Array(skillCount);
  let tieCellCount = 0;
  for (let cell = 0; cell < presentationTopology.nodeCount; cell++) {
    const at = cell * 3; const x = presentationTopology.positions[at];
    const y = presentationTopology.positions[at + 1]; const z = presentationTopology.positions[at + 2];
    let bestSkill = -1; let bestDot = -Infinity; let tied = false;
    for (let skill = 0; skill < skillCount; skill++) {
      const site = siteCellBySkill[skill] * 3;
      const dot = x * authoredTopology.positions[site]
        + y * authoredTopology.positions[site + 1]
        + z * authoredTopology.positions[site + 2];
      if (dot > bestDot) { bestDot = dot; bestSkill = skill; tied = false; }
      else if (dot === bestDot) {
        // Authored catalog order is the explicit exact-tie authority.
        if (skill < bestSkill) bestSkill = skill;
        tied = true;
      }
    }
    if (bestSkill < 0) throw new Error(`Evolution territory cell ${cell} has no owner`);
    ownerByCell[cell] = bestSkill; territorySize[bestSkill]++;
    if (tied) tieCellCount++;
  }

  const cellStart = new Uint32Array(skillCount + 1);
  for (let skill = 0; skill < skillCount; skill++) cellStart[skill + 1] = cellStart[skill] + territorySize[skill];
  const cells = new Uint16Array(presentationTopology.nodeCount); const cursor = cellStart.slice(0, skillCount);
  for (let cell = 0; cell < presentationTopology.nodeCount; cell++) cells[cursor[ownerByCell[cell]]++] = cell;

  const componentCount = connectedComponents(presentationTopology, ownerByCell, skillCount);
  const centroid = new Float32Array(skillCount * 3); const anchorCell = new Uint16Array(skillCount);
  writeRepresentatives(presentationTopology, cellStart, cells, centroid, anchorCell);

  const edgeType = new Uint8Array(presentationTopology.edgeCount);
  const contactCountByPair = new Uint16Array(skillCount * skillCount);
  for (let edge = 0; edge < presentationTopology.edgeCount; edge++) {
    const ownerA = ownerByCell[presentationTopology.edgeA[edge]];
    const ownerB = ownerByCell[presentationTopology.edgeB[edge]];
    if (ownerA === ownerB) continue;
    edgeType[edge] = EVOLUTION_TERRITORY_EDGE.BOUNDARY;
    contactCountByPair[ownerA * skillCount + ownerB]++;
    contactCountByPair[ownerB * skillCount + ownerA]++;
  }
  const expectedContact = expectedContacts(authoredTopology, skillBySiteCell, skillCount);
  const diagnostics = validateProjection({ presentationTopology, skillCount, ownerByCell, territorySize,
    componentCount, contactCountByPair, expectedContact, tieCellCount, edgeType });

  return Object.freeze({
    topology: presentationTopology,
    authoredTopology,
    skillCount,
    ownerByCell,
    skillBySiteCell,
    siteCellBySkill,
    territorySize,
    cellStart,
    cells,
    centroid,
    anchorCell,
    edgeType,
    contactCountByPair,
    componentCount,
    diagnostics,
  });
}
/** Write selection/emphasis over the static fine-edge classification. */
export function writeEvolutionTerritoryEdges(projection, selectedSkill = -1, emphasizedSkills = null, out = null) {
  const edgeCount = projection?.topology?.edgeCount;
  const target = out ?? new Uint8Array(edgeCount);
  if (!(target instanceof Uint8Array) || target.length !== edgeCount) throw new Error('invalid Evolution territory edge output');
  if (selectedSkill !== -1 && (!Number.isInteger(selectedSkill) || selectedSkill < 0 || selectedSkill >= projection.skillCount)) {
    throw new Error('invalid selected Evolution territory');
  }
  if (emphasizedSkills !== null && (!(emphasizedSkills instanceof Uint8Array)
    || emphasizedSkills.length !== projection.skillCount)) throw new Error('invalid emphasized Evolution territories');
  const { topology, ownerByCell, edgeType } = projection;
  for (let edge = 0; edge < edgeCount; edge++) {
    if (edgeType[edge] === EVOLUTION_TERRITORY_EDGE.INTERNAL) { target[edge] = EVOLUTION_TERRITORY_EDGE.INTERNAL; continue; }
    const ownerA = ownerByCell[topology.edgeA[edge]]; const ownerB = ownerByCell[topology.edgeB[edge]];
    target[edge] = ownerA === selectedSkill || ownerB === selectedSkill
      ? EVOLUTION_TERRITORY_EDGE.SELECTED
      : emphasizedSkills?.[ownerA] || emphasizedSkills?.[ownerB]
        ? EVOLUTION_TERRITORY_EDGE.EMPHASIZED : EVOLUTION_TERRITORY_EDGE.BOUNDARY;
  }
  return target;
}

function validateInputs(presentation, authored, nodes) {
  if (!presentation || !authored || !Array.isArray(nodes) || nodes.length < 1 || nodes.length > 255) {
    throw new Error('invalid Evolution territory inputs');
  }
  if (presentation.nodeCount > 0xffff || presentation.positions?.length !== presentation.nodeCount * 3
    || authored.positions?.length !== authored.nodeCount * 3) throw new Error('unsupported Evolution territory topology');
  if (nodes.length !== authored.nodeCount) throw new Error('every authored site must own one Evolution territory');
}

function connectedComponents(topology, ownerByCell, skillCount) {
  const components = new Uint8Array(skillCount); const seen = new Uint8Array(topology.nodeCount);
  const queue = new Uint16Array(topology.nodeCount);
  for (let start = 0; start < topology.nodeCount; start++) {
    if (seen[start]) continue;
    const skill = ownerByCell[start]; components[skill]++; let head = 0; let tail = 0;
    queue[tail++] = start; seen[start] = 1;
    while (head < tail) {
      const cell = queue[head++];
      for (let offset = topology.nodeStart[cell]; offset < topology.nodeStart[cell + 1]; offset++) {
        const next = topology.nodeNeighbors[offset];
        if (!seen[next] && ownerByCell[next] === skill) { seen[next] = 1; queue[tail++] = next; }
      }
    }
  }
  return components;
}

function writeRepresentatives(topology, cellStart, cells, centroid, anchorCell) {
  for (let skill = 0; skill < cellStart.length - 1; skill++) {
    let x = 0; let y = 0; let z = 0;
    for (let offset = cellStart[skill]; offset < cellStart[skill + 1]; offset++) {
      const at = cells[offset] * 3; x += topology.positions[at]; y += topology.positions[at + 1]; z += topology.positions[at + 2];
    }
    const length = Math.hypot(x, y, z);
    if (!(length > 0)) throw new Error(`Evolution territory ${skill} has no centroid`);
    x /= length; y /= length; z /= length;
    centroid[skill * 3] = Math.fround(x); centroid[skill * 3 + 1] = Math.fround(y); centroid[skill * 3 + 2] = Math.fround(z);
    let anchor = 0; let bestDot = -Infinity;
    for (let offset = cellStart[skill]; offset < cellStart[skill + 1]; offset++) {
      const cell = cells[offset]; const at = cell * 3;
      const dot = x * topology.positions[at] + y * topology.positions[at + 1] + z * topology.positions[at + 2];
      if (dot > bestDot || (dot === bestDot && cell < anchor)) { bestDot = dot; anchor = cell; }
    }
    anchorCell[skill] = anchor;
  }
}

function expectedContacts(topology, skillBySiteCell, skillCount) {
  const result = new Uint8Array(skillCount * skillCount);
  for (let edge = 0; edge < topology.edgeCount; edge++) {
    const skillA = skillBySiteCell[topology.edgeA[edge]]; const skillB = skillBySiteCell[topology.edgeB[edge]];
    if (skillA < 0 || skillB < 0 || skillA === skillB) throw new Error(`invalid authored Evolution contact ${edge}`);
    result[skillA * skillCount + skillB] = 1; result[skillB * skillCount + skillA] = 1;
  }
  return result;
}

function validateProjection(value) {
  const { presentationTopology, skillCount, ownerByCell, territorySize, componentCount,
    contactCountByPair, expectedContact, tieCellCount, edgeType } = value;
  let covered = 0; let minSize = Infinity; let maxSize = 0; let actualContacts = 0; let expectedContactsCount = 0;
  let minContactEdges = Infinity; let maxContactEdges = 0;
  for (let skill = 0; skill < skillCount; skill++) {
    const size = territorySize[skill]; covered += size; minSize = Math.min(minSize, size); maxSize = Math.max(maxSize, size);
    if (!size || componentCount[skill] !== 1) throw new Error(`Evolution territory ${skill} is empty or disconnected`);
    for (let other = skill + 1; other < skillCount; other++) {
      const index = skill * skillCount + other; const actual = contactCountByPair[index] > 0;
      const expected = expectedContact[index] > 0;
      if (actual) { actualContacts++; minContactEdges = Math.min(minContactEdges, contactCountByPair[index]);
        maxContactEdges = Math.max(maxContactEdges, contactCountByPair[index]); }
      if (expected) expectedContactsCount++;
      if (actual !== expected) throw new Error(`Evolution territory contact mismatch ${skill}:${other}`);
    }
  }
  if (covered !== presentationTopology.nodeCount || ownerByCell.length !== covered) throw new Error('incomplete Evolution territory coverage');
  let state = fnv1aBytes(ownerByCell); state = fnv1aBytes(edgeType, state);
  return Object.freeze({ presentationCells: presentationTopology.nodeCount, presentationEdges: presentationTopology.edgeCount,
    skillCount, coveredCells: covered, minSize, maxSize, tieCellCount, actualContacts, expectedContacts: expectedContactsCount,
    minContactEdges, maxContactEdges, digest: hexU32(state) });
}
