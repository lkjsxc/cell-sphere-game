/** Read-only cell observatory. Static geography and dynamic life never mutate authority. */
import { BIOME, LANDMARK, WATER } from '../../world/fields.js';

const BIOME_NAME = Object.freeze({
  [BIOME.DEEP_OCEAN]: 'Deep ocean', [BIOME.SHALLOW_OCEAN]: 'Shallow sea', [BIOME.COAST]: 'Coast',
  [BIOME.FOREST]: 'Temperate forest', [BIOME.WET_FOREST]: 'Dense wet forest', [BIOME.GRASS]: 'Grassland',
  [BIOME.DRY_GRASS]: 'Dry grassland', [BIOME.DESERT]: 'Desert', [BIOME.WETLAND]: 'Wetland',
  [BIOME.HIGHLAND]: 'Highland', [BIOME.MOUNTAIN]: 'Mountain', [BIOME.TUNDRA]: 'Tundra', [BIOME.SNOW_ICE]: 'Snow and ice',
  [BIOME.LAKE]: 'Whole-cell lake',
});
const WATER_NAME = Object.freeze({ [WATER.LAND]: 'Land', [WATER.DEEP_OCEAN]: 'Deep ocean',
  [WATER.SHALLOW_OCEAN]: 'Coastal water', [WATER.LAKE]: 'Lake water' });
const LANDMARK_NAME = Object.freeze({ [LANDMARK.SUMMIT]: 'Mountain Crown', [LANDMARK.GREAT_LAKE]: 'Great Lake',
  [LANDMARK.FOREST_HEART]: 'Forest Heart', [LANDMARK.WILD_COAST]: 'Coast Gate',
  [LANDMARK.DRYLAND]: 'Dry Basin', [LANDMARK.LAKE_SHORE]: 'Lake Shore' });

export function createInspectorSurface(options) {
  const panel = document.getElementById('cell-inspector'); const heading = document.getElementById('inspector-heading');
  const summary = document.getElementById('inspector-summary'); const fieldsRoot = document.getElementById('inspector-fields');
  const life = document.getElementById('inspector-life'); const history = document.getElementById('inspector-history');
  let model = null;
  document.getElementById('inspector-close')?.addEventListener('click', () => options.onClose());

  function render() {
    if (!model) return; const { node, world, topo } = model;
    const landmark = world.landmarks.find((mark) => mark.cell === node);
    heading.textContent = landmark ? LANDMARK_NAME[landmark.kind] : `Region ${world.regionId[node] + 1} · Cell ${node}`;
    const knot = topo.degree[node] === 5;
    summary.textContent = `${BIOME_NAME[world.biomeId[node]]}. ${knot ? 'A fivefold World Knot.' : 'An ordinary sixfold cell.'}`;
    const rows = [
      ['Terrain', WATER_NAME[world.waterClass[node]]], ['Biome', BIOME_NAME[world.biomeId[node]]],
      ['Elevation', elevation(world, node)], ['Temperature', band(world.baseTemp[node], ['Very cold', 'Cold', 'Temperate', 'Warm'])],
      ['Freshwater influence', band(world.freshwaterInfluence[node], ['None', 'Trace', 'Local', 'Strong'])],
      ['Moisture', band(world.baseMoisture[node], ['Parched', 'Dry', 'Moist', 'Saturated'])],
      ['Nutrient potential', band(world.baseNutrient[node], ['Sparse', 'Limited', 'Rich', 'Abundant'])],
      ['Forest density', forest(world.forestDensity[node])], ['Region / basin', `Region ${world.regionId[node] + 1}`],
    ];
    const lake = lakeRecord(world, node);
    if (world.lakeId[node] >= 0) rows.push(['Lake', `Lake ${world.lakeId[node] + 1} · ${label(lake.type)}`],
      ['Lake depth', `${label(lake.depthClass)} · ${Math.round(world.lakeDepth[node] * 1000) / 10}% relief`]);
    if (world.lakeShore[node]) rows.push(['Lake shore', lake ? `Shore of Lake ${lake.id + 1}` : 'Freshwater margin']);
    if (world.biomeId[node] === BIOME.WETLAND) rows.push(['Wetland', lake ? `Whole-cell shore wetland · Lake ${lake.id + 1}` : 'Whole-cell wetland']);
    if (lake) rows.push(['Lake area', `${lake.area} whole cells · ${label(lake.areaClass)}`],
      ['Lake water', `${label(lake.salinity)} · ${label(lake.type)}`],
      ['Lake surface', elevationBand(lake.surfaceElevation, world.seaLevel)],
      ['Lake catchment', `${lake.catchment} land cells`], ['Lake outlet', label(lake.outletStatus)]);
    fieldsRoot.replaceChildren(...definitionRows(rows)); renderDynamic(); renderHistory();
  }

  function renderDynamic() {
    life.replaceChildren(); const d = model?.dynamic; if (!d) return;
    const h3 = document.createElement('h3'); h3.textContent = 'Living state';
    const dl = document.createElement('dl'); dl.className = 'inspection-grid';
    const stateName = d.alive ? (d.stress > 0.75 ? 'Alive · critical stress' : 'Alive')
      : d.biomass > 0.02 ? 'Dead tissue / scar' : 'Unoccupied';
    const role = d.activeEdges >= 4 ? 'Connected center' : d.activeEdges === 1 ? 'Frontier cell' : d.activeEdges > 1 ? 'Connected tissue' : 'Isolated';
    const access = d.habitatAccessible ? 'Accessible' : `Evolution access required · ${d.requiredSkill} (${d.requiredCapability})`;
    dl.append(...definitionRows([['State', stateName], ['Role', role], ['Habitat access', access],
      ['Reachable from adjacent life', d.adjacentLife ? 'Yes' : 'No'],
      ['Suitability if accessible', `${Math.round((d.suitabilityIfAccessible ?? 0) * 100)}%`],
      ['Long-term local stock', band(Math.min(1, (d.resourceReserve ?? 0) / 0.5), ['Exhausted', 'Low', 'Stored', 'Deep'])],
      ['Biomass', band(Math.min(1, d.biomass / 2.5), ['Trace', 'Thin', 'Established', 'Dense'])],
      ['Energy reserve', band(Math.min(1, Math.max(0, d.energy) / 6), ['Empty', 'Low', 'Stable', 'Full'])],
      ['Stress', band(d.stress, ['Calm', 'Watchful', 'Strained', 'Critical'])], ['Local nutrient', band(d.nutrient, ['Spent', 'Low', 'Rich', 'Abundant'])],
      ['Living neighbors', `${d.activeEdges} · ${band(Math.min(1, d.meanConductance / 2), ['Faint', 'Low exchange', 'Strong exchange', 'Core exchange'])}`],
      ['Toxic pressure', band(d.toxicity, ['Clear', 'Low', 'Elevated', 'Severe'])]]));
    life.append(h3, dl);
  }

  function renderHistory() {
    history.replaceChildren(); const events = model?.events ?? []; if (!events.length) return;
    const h3 = document.createElement('h3'); h3.textContent = 'History here'; const p = document.createElement('p');
    p.className = 'panel-copy'; p.textContent = `${events.length} meaningful ${events.length === 1 ? 'event references' : 'events reference'} this cell.`;
    const button = document.createElement('button'); button.type = 'button'; button.className = 'btn btn-secondary';
    button.textContent = 'Open History here'; button.addEventListener('click', () => options.onHistory(model.node)); history.append(h3, p, button);
  }

  return {
    panel, open(next) { model = next; panel.hidden = false; render(); },
    updateDynamic(dynamic, events = model?.events ?? []) { if (!model) return; model = { ...model, dynamic, events }; renderDynamic(); renderHistory(); },
    close() { panel.hidden = true; model = null; }, get node() { return model?.node ?? null; },
  };
}

function definitionRows(rows) { return rows.flatMap(([term, value]) => { const dt = document.createElement('dt'); dt.textContent = term;
  const dd = document.createElement('dd'); dd.textContent = value; return [dt, dd]; }); }
function band(value, labels) { return labels[Math.max(0, Math.min(labels.length - 1, Math.floor(value * labels.length)))]; }
function forest(value) { return value < 0.1 ? 'Open ground' : value < 0.34 ? 'Scattered canopy' : value < 0.58 ? 'Forest edge' : 'Dense forest core'; }
function elevation(world, node) { if (!world.landMask[node]) return world.oceanDepth[node] > 0.34 ? 'Deep basin' : 'Shallow shelf';
  const lake = world.lakeId[node] >= 0 ? world.lakes[world.lakeId[node]] : null;
  const value = lake?.surfaceElevation ?? world.baseElevation[node];
  return elevationBand(value, world.seaLevel); }
function elevationBand(value, seaLevel) { const height = (value - seaLevel) / Math.max(.05, 1 - seaLevel);
  return band(height, ['Lowland', 'Rolling land', 'Highland', 'Mountain crown']); }
function lakeRecord(world, node) { const id = world.lakeId[node]; if (id >= 0) return world.lakes[id];
  return world.lakes.find((lake) => lake.shoreCells.includes(node) || lake.wetlandCells.includes(node)) ?? null; }
function label(value) { return String(value ?? 'unknown').replaceAll('-', ' ').replace(/^./, (character) => character.toUpperCase()); }
