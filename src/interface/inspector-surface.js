/** Read-only cell observatory. Static geography and dynamic life never mutate authority. */
import { BIOME, LANDMARK, WATER } from '../world/fields.js';

const BIOME_NAME = Object.freeze({
  [BIOME.DEEP_OCEAN]: 'Deep ocean', [BIOME.SHALLOW_OCEAN]: 'Shallow sea', [BIOME.COAST]: 'Coast',
  [BIOME.FOREST]: 'Temperate forest', [BIOME.WET_FOREST]: 'Dense wet forest', [BIOME.GRASS]: 'Grassland',
  [BIOME.DRY_GRASS]: 'Dry grassland', [BIOME.DESERT]: 'Desert', [BIOME.WETLAND]: 'Wetland / floodplain',
  [BIOME.HIGHLAND]: 'Highland', [BIOME.MOUNTAIN]: 'Mountain', [BIOME.TUNDRA]: 'Tundra', [BIOME.SNOW_ICE]: 'Snow and ice',
});
const WATER_NAME = Object.freeze({ [WATER.LAND]: 'Land', [WATER.DEEP_OCEAN]: 'Deep ocean',
  [WATER.SHALLOW_OCEAN]: 'Coastal water', [WATER.LAKE]: 'Lake basin', [WATER.RIVER]: 'River corridor' });
const LANDMARK_NAME = Object.freeze({ [LANDMARK.SUMMIT]: 'Mountain Crown', [LANDMARK.GREAT_RIVER]: 'Great River',
  [LANDMARK.FOREST_HEART]: 'Forest Heart', [LANDMARK.WILD_COAST]: 'Coast Gate',
  [LANDMARK.DRYLAND]: 'Dry Basin', [LANDMARK.LAKE]: 'Lake Basin' });

export function createInspectorSurface(options) {
  const panel = document.getElementById('cell-inspector'); const heading = document.getElementById('inspector-heading');
  const summary = document.getElementById('inspector-summary'); const fieldsRoot = document.getElementById('inspector-fields');
  const life = document.getElementById('inspector-life'); const history = document.getElementById('inspector-history');
  let model = null;
  document.getElementById('inspector-close')?.addEventListener('click', () => options.onClose());
  document.getElementById('inspector-prev')?.addEventListener('click', () => options.onLandmark(-1));
  document.getElementById('inspector-next')?.addEventListener('click', () => options.onLandmark(1));

  function render() {
    if (!model) return; const { node, world, topo } = model;
    const landmark = world.landmarks.find((mark) => mark.cell === node);
    heading.textContent = landmark ? LANDMARK_NAME[landmark.kind] : `Region ${world.regionId[node] + 1} · Cell ${node}`;
    const knot = topo.degree[node] === 5;
    summary.textContent = `${BIOME_NAME[world.biomeId[node]]}. ${knot ? 'A fivefold World Knot.' : 'An ordinary sixfold cell.'}`;
    const rows = [
      ['Terrain', WATER_NAME[world.waterClass[node]]], ['Biome', BIOME_NAME[world.biomeId[node]]],
      ['Elevation', elevation(world, node)], ['Temperature', band(world.baseTemp[node], ['Very cold', 'Cold', 'Temperate', 'Warm'])],
      ['Rainfall', band(world.rainfall[node], ['Very dry', 'Dry', 'Moderate', 'Very wet'])],
      ['Moisture', band(world.baseMoisture[node], ['Parched', 'Dry', 'Moist', 'Saturated'])],
      ['Nutrient potential', band(world.baseNutrient[node], ['Sparse', 'Limited', 'Rich', 'Abundant'])],
      ['Forest density', forest(world.forestDensity[node])], ['Region / basin', `Region ${world.regionId[node] + 1}`],
    ];
    if (world.riverOrder[node]) rows.push(['River', `Order ${world.riverOrder[node]} · ${band(world.riverStrength[node], ['Minor', 'Tributary', 'Strong', 'Major trunk'])}`]);
    if (world.lakeId[node] >= 0) rows.push(['Lake', `Basin ${world.lakeId[node] + 1}`]);
    fieldsRoot.replaceChildren(...definitionRows(rows)); renderDynamic(); renderHistory();
  }

  function renderDynamic() {
    life.replaceChildren(); const d = model?.dynamic; if (!d) return;
    const h3 = document.createElement('h3'); h3.textContent = 'Living state';
    const dl = document.createElement('dl'); dl.className = 'inspection-grid';
    const stateName = d.alive ? (d.stress > 0.75 ? 'Alive · critical stress' : 'Alive')
      : d.biomass > 0.02 ? 'Dead tissue / scar' : 'Unoccupied';
    const role = d.activeEdges >= 4 ? 'Junction' : d.activeEdges === 1 ? 'Frontier / bridge' : d.activeEdges > 1 ? 'Route tissue' : 'Isolated';
    dl.append(...definitionRows([['State', stateName], ['Role', role], ['Biomass', band(Math.min(1, d.biomass / 2.5), ['Trace', 'Thin', 'Established', 'Dense'])],
      ['Energy reserve', band(Math.min(1, Math.max(0, d.energy) / 6), ['Empty', 'Low', 'Stable', 'Full'])],
      ['Stress', band(d.stress, ['Calm', 'Watchful', 'Strained', 'Critical'])], ['Local nutrient', band(d.nutrient, ['Spent', 'Low', 'Rich', 'Abundant'])],
      ['Active routes', `${d.activeEdges} · ${band(Math.min(1, d.meanConductance / 2), ['Faint', 'Thin', 'Strong', 'Trunk'])}`],
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
    panel, open(next) { model = next; panel.hidden = false; render(); heading.focus?.(); },
    updateDynamic(dynamic, events = model?.events ?? []) { if (!model) return; model = { ...model, dynamic, events }; renderDynamic(); renderHistory(); },
    close() { panel.hidden = true; model = null; }, get node() { return model?.node ?? null; },
  };
}

function definitionRows(rows) { return rows.flatMap(([term, value]) => { const dt = document.createElement('dt'); dt.textContent = term;
  const dd = document.createElement('dd'); dd.textContent = value; return [dt, dd]; }); }
function band(value, labels) { return labels[Math.max(0, Math.min(labels.length - 1, Math.floor(value * labels.length)))]; }
function forest(value) { return value < 0.1 ? 'Open ground' : value < 0.34 ? 'Scattered canopy' : value < 0.58 ? 'Forest edge' : 'Dense forest core'; }
function elevation(world, node) { if (!world.landMask[node]) return world.oceanDepth[node] > 0.34 ? 'Deep basin' : 'Shallow shelf';
  const height = (world.baseElevation[node] - world.seaLevel) / Math.max(0.05, 1 - world.seaLevel);
  return band(height, ['Lowland', 'Rolling land', 'Highland', 'Mountain crown']); }
