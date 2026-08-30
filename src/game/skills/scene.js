/** Shared exact-cell Evolution material and edge projection for both renderers. */
import { createRng } from '../../core/prng.js';
import { smoothField, sphericalField } from '../../world/noise.js';
import { EVOLUTION_ARCHETYPES } from './catalog.js';

export const EVOLUTION_STATUS = Object.freeze({
  EMPTY: 0, LOCKED: 1, UNAFFORDABLE: 2, AFFORDABLE: 3, OWNED_UNAFFORDABLE: 4,
  SELECTED_LOCKED: 5, SELECTED_UNAFFORDABLE: 6, SELECTED_AFFORDABLE: 7,
  OWNED_AFFORDABLE: 8, SELECTED_OWNED_UNAFFORDABLE: 9, SELECTED_OWNED_AFFORDABLE: 10,
});
export const EVOLUTION_CELL_EDGE = Object.freeze({ QUIET: 0, OWNED: 1, FRONTIER: 2, RECENT: 3, SELECTED: 4 });

const KINDS = Object.freeze({ root: 1, specialization: 2, capstone: 3 });
const DOMAINS = Object.freeze({ Foundation: 0, Fertility: 1, Freshwater: 2, Scarcity: 3, Cryogenic: 4, Marine: 5, Luminous: 6 });

export function createEvolutionFields(topology) {
  const rng = createRng(0xe701c311); const count = topology.nodeCount;
  const nutrientField = smoothField(sphericalField(rng, topology.positions, count, { lobes: 23, sharpness: 3, signed: true }), topology, 1);
  const moistureField = smoothField(sphericalField(rng, topology.positions, count, { lobes: 19, sharpness: 2, signed: true }), topology, 1);
  const temperatureField = smoothField(sphericalField(rng, topology.positions, count, { lobes: 17, sharpness: 2, signed: true }), topology, 1);
  const reliefField = sphericalField(rng, topology.positions, count, { lobes: 29, sharpness: 4, signed: true });
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

export function renderEvolutionSnapshot(layout, meta, projection) {
  const { topology, archetypeByCell } = layout; const count = topology.nodeCount;
  const status = new Uint8Array(count); const domain = new Uint8Array(count); const tier = new Uint8Array(count);
  const kind = new Uint8Array(count); const imprintWeight = new Float32Array(count);
  const archetypeIndex = new Uint8Array(archetypeByCell); const recent = new Uint8Array(projection.recent);
  for (const imprint of meta.imprints ?? []) for (const cell of imprint.cells ?? []) {
    if (Number.isInteger(cell) && cell >= 0 && cell < count) imprintWeight[cell] = .55;
  }
  for (let cell = 0; cell < count; cell++) {
    const archetype = archetypeByCell[cell]; const definition = EVOLUTION_ARCHETYPES[archetype];
    status[cell] = statusFor(projection, cell); domain[cell] = DOMAINS[definition.domain] ?? 0;
    tier[cell] = definition.tier; kind[cell] = KINDS[definition.kind] ?? 2;
  }
  const edges = writeEvolutionCellEdges(layout, projection);
  const focusCells = [];
  for (let cell = 0; cell < count; cell++) if (projection.owned[cell]
    || (projection.reachable[cell] && projection.affordable[cell])) focusCells.push(cell);
  if (!focusCells.length) focusCells.push(layout.rootCell);
  return Object.freeze({
    tick: projection.ownedCellCount * 16 + (projection.selectedCell === null ? 0 : 1), entropy: .30, status: 'evolution',
    evolutionStatus: status, evolutionDomain: domain, evolutionTier: tier, evolutionKind: kind,
    evolutionImprintWeight: imprintWeight, evolutionArchetypeIndex: archetypeIndex,
    evolutionRecent: recent, evolutionEdge: edges, evolutionProjection: projection,
    selectedEvolutionCell: projection.selectedCell,
    metrics: Object.freeze({ coverage: projection.ownedCellCount / count, score: '0' }),
    focus: focusDirection(topology, focusCells),
  });
}

export function writeEvolutionCellEdges(layout, projection, out = null) {
  const { topology } = layout; const target = out ?? new Uint8Array(topology.edgeCount);
  if (!(target instanceof Uint8Array) || target.length !== topology.edgeCount) throw new Error('invalid Evolution edge output');
  for (let edge = 0; edge < topology.edgeCount; edge++) {
    const a = topology.edgeA[edge]; const b = topology.edgeB[edge];
    if (a === projection.selectedCell || b === projection.selectedCell) target[edge] = EVOLUTION_CELL_EDGE.SELECTED;
    else if (projection.recent[a] || projection.recent[b]) target[edge] = EVOLUTION_CELL_EDGE.RECENT;
    else if ((!projection.owned[a] && projection.reachable[a]) || (!projection.owned[b] && projection.reachable[b])
      || projection.owned[a] !== projection.owned[b]) target[edge] = EVOLUTION_CELL_EDGE.FRONTIER;
    else if (projection.owned[a] || projection.owned[b]) target[edge] = EVOLUTION_CELL_EDGE.OWNED;
    else target[edge] = EVOLUTION_CELL_EDGE.QUIET;
  }
  return target;
}

function statusFor(projection, cell) {
  const selected = projection.selectedCell === cell; const owned = projection.owned[cell] === 1;
  const affordable = projection.affordable[cell] === 1; const reachable = projection.reachable[cell] === 1;
  if (owned && affordable) return selected ? EVOLUTION_STATUS.SELECTED_OWNED_AFFORDABLE : EVOLUTION_STATUS.OWNED_AFFORDABLE;
  if (owned) return selected ? EVOLUTION_STATUS.SELECTED_OWNED_UNAFFORDABLE : EVOLUTION_STATUS.OWNED_UNAFFORDABLE;
  if (!reachable) return selected ? EVOLUTION_STATUS.SELECTED_LOCKED : EVOLUTION_STATUS.LOCKED;
  if (affordable) return selected ? EVOLUTION_STATUS.SELECTED_AFFORDABLE : EVOLUTION_STATUS.AFFORDABLE;
  return selected ? EVOLUTION_STATUS.SELECTED_UNAFFORDABLE : EVOLUTION_STATUS.UNAFFORDABLE;
}

function focusDirection(topology, cells) {
  const focus = [0, 0, 0];
  for (const cell of cells) for (let axis = 0; axis < 3; axis++) focus[axis] += topology.positions[cell * 3 + axis];
  const length = Math.hypot(...focus);
  if (length > 1e-8) return focus.map((value) => value / length);
  const fallback = cells[0] ?? 0; return Array.from(topology.positions.slice(fallback * 3, fallback * 3 + 3));
}

function scaled(source, offset, scale) {
  const out = new Float32Array(source.length);
  for (let index = 0; index < source.length; index++) out[index] = Math.fround(offset + source[index] * scale);
  return out;
}
