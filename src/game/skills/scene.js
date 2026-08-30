/** Read-only authored-skill projection over the fine Evolution territories. */
import { writeEvolutionTerritoryEdges } from './territories.js';
export const MEMORY_STATUS = Object.freeze({
  EMPTY: 0, LOCKED: 1, UNAFFORDABLE: 2, AFFORDABLE: 3, OWNED_UNAFFORDABLE: 4,
  SELECTED_LOCKED: 5, SELECTED_UNAFFORDABLE: 6, SELECTED_AFFORDABLE: 7,
  OWNED_AFFORDABLE: 8, SELECTED_OWNED_UNAFFORDABLE: 9, SELECTED_OWNED_AFFORDABLE: 10,
  OWNED: 4, SELECTED_OWNED: 9,
});
const KINDS = Object.freeze({ root: 1, specialization: 2, capstone: 3 });
const DOMAINS = Object.freeze({ Foundation: 0, Fertility: 1, Freshwater: 2, Scarcity: 3, Cryogenic: 4, Marine: 5, Luminous: 6 });

export function createMemoryFields(topo) {
  const floats = () => new Float32Array(topo.nodeCount); const baseNutrient = floats(); const baseMoisture = floats();
  const baseTemp = floats(); const altitude = floats();
  baseNutrient.fill(.22); baseMoisture.fill(.18); baseTemp.fill(.35); altitude.fill(.43);
  return Object.freeze({ baseNutrient, baseMoisture, baseTemp, altitude, biomeId: new Uint8Array(topo.nodeCount).fill(9),
    forestDensity: floats(), lakeDepth: floats(), lakeShore: new Uint8Array(topo.nodeCount), freshwaterInfluence: floats(),
    lakeId: new Int16Array(topo.nodeCount).fill(-1), ridgeStrength: floats(), landMask: new Uint8Array(topo.nodeCount).fill(1),
    landmarks: Object.freeze([]), sources: Object.freeze([0]) });
}

export function renderMemorySnapshot(territories, meta, scene, emphasizedIds = []) {
  const topo = territories.topology; const count = topo.nodeCount; const status = new Uint8Array(count); const branch = new Uint8Array(count);
  const tier = new Uint8Array(count); const kind = new Uint8Array(count); const imprintWeight = new Float32Array(count);
  const nodeIndex = new Int16Array(count).fill(-1); const emphasis = new Uint8Array(count); const marked = new Set(emphasizedIds);
  const emphasizedSkills = new Uint8Array(territories.skillCount); const imprintSkills = new Uint8Array(territories.skillCount);
  const focusSkills = []; let selectedSkill = -1;
  for (const imprint of meta.imprints ?? []) for (const siteCell of imprint.cells ?? []) {
    const skill = territories.skillBySiteCell[siteCell] ?? -1; if (skill >= 0) imprintSkills[skill] = 1;
  }
  scene.nodes.forEach((node, index) => {
    const skill = territories.skillBySiteCell[node.cell];
    if (skill < 0) throw new Error(`Evolution skill ${node.id} has no presentation territory`);
    const selected = node.id === scene.selectedId; if (selected) selectedSkill = skill;
    const nodeStatus = statusFor(node, selected); const nodeBranch = DOMAINS[node.domain] ?? 0;
    const nodeKind = KINDS[node.kind] ?? 2; const emphasized = marked.has(node.id);
    if (emphasized) emphasizedSkills[skill] = 1;
    for (let offset = territories.cellStart[skill]; offset < territories.cellStart[skill + 1]; offset++) {
      const cell = territories.cells[offset]; status[cell] = nodeStatus; branch[cell] = nodeBranch;
      tier[cell] = node.tier; kind[cell] = nodeKind; nodeIndex[cell] = index;
      if (emphasized) emphasis[cell] = 1; if (imprintSkills[skill]) imprintWeight[cell] = .55;
    }
    if (node.owned || (node.reachable && node.affordable)) focusSkills.push(skill);
  });
  const territoryEdges = writeEvolutionTerritoryEdges(territories, selectedSkill, emphasizedSkills);
  return Object.freeze({
    tick: scene.nodes.filter((node) => node.owned).length * 16 + (scene.selectedId ? 1 : 0), entropy: .30, status: 'memory',
    memoryStatus: status, memoryBranch: branch, memoryTier: tier, memoryKind: kind, memoryImprintWeight: imprintWeight,
    memoryNodeIndex: nodeIndex, memoryEmphasis: emphasis, memoryScene: scene, nodeStates: scene.nodes,
    memoryOwner: territories.ownerByCell, memoryTerritoryEdge: territoryEdges,
    memoryTerritorySize: territories.territorySize, memoryTerritoryAnchor: territories.anchorCell,
    memoryTerritoryCentroid: territories.centroid, memoryTerritoryDiagnostics: territories.diagnostics,
    metrics: Object.freeze({ coverage: scene.nodes.filter((node) => node.owned).length / Math.max(1, scene.nodes.length), score: '0' }),
    focus: focusDirection(territories, focusSkills.length ? focusSkills
      : scene.nodes.filter((node) => node.kind === 'root').map((node) => territories.skillBySiteCell[node.cell])),
  });
}
function statusFor(node, selected) {
  if (node.owned && node.affordable) return selected ? MEMORY_STATUS.SELECTED_OWNED_AFFORDABLE : MEMORY_STATUS.OWNED_AFFORDABLE;
  if (node.owned) return selected ? MEMORY_STATUS.SELECTED_OWNED_UNAFFORDABLE : MEMORY_STATUS.OWNED_UNAFFORDABLE;
  if (node.locked) return selected ? MEMORY_STATUS.SELECTED_LOCKED : MEMORY_STATUS.LOCKED;
  if (node.affordable) return selected ? MEMORY_STATUS.SELECTED_AFFORDABLE : MEMORY_STATUS.AFFORDABLE;
  return selected ? MEMORY_STATUS.SELECTED_UNAFFORDABLE : MEMORY_STATUS.UNAFFORDABLE;
}
function focusDirection(territories, skills) {
  const focus = [0, 0, 0];
  for (const skill of skills.length ? skills : [0]) for (let axis = 0; axis < 3; axis++) {
    focus[axis] += territories.centroid[skill * 3 + axis];
  }
  const length = Math.hypot(...focus); return length ? focus.map((value) => value / length) : [0, 0, 1];
}
