/** Bounded exact-cell Evolution detail and native purchase action. */
import {
  EVOLUTION_TOPOLOGY, evolutionCellState,
  previewEvolutionLevel,
} from '../game/skills/index.js';
import { formatProgressionEngineering, normalizeProgressionInteger } from '../core/progression-integer.js';

export function createMemorySurface(options) {
  const panel = byId('memory-node-panel'); const unlock = /** @type {HTMLButtonElement} */ (byId('memory-unlock'));
  const change = byId('memory-node-change');
  let selectedCell = null; let projection = null; let feedbackTimer = 0; let accessibleDescription = '';
  byId('memory-node-close').addEventListener('click', options.onCloseNode);
  unlock.addEventListener('click', () => { if (selectedCell !== null) options.onUnlock(selectedCell); });

  function render() {
    if (selectedCell === null || !projection) return;
    const state = evolutionCellState(projection, selectedCell, selectedCell);
    const purchasesOpen = options.canUnlock?.() !== false;
    const preview = previewEvolutionLevel({ evolutionLevels: projection.vector }, selectedCell, projection);
    const boundary = state.reason === 'progression-security-boundary';
    byId('memory-node-branch').textContent = `${state.domain.toUpperCase()} · CELL ${state.cell + 1} OF ${EVOLUTION_TOPOLOGY.nodeCount}`;
    byId('memory-node-heading').textContent = state.nameEn; byId('memory-node-summary').textContent = state.summary;
    byId('memory-node-detail').textContent = state.description;
    const status = boundary ? `Local Level ${number(state.localLevel)} · no further level can be represented here`
      : state.owned ? state.affordable ? `Local Level ${number(state.localLevel)} · ready to strengthen` : `Local Level ${number(state.localLevel)} · more Echoes required`
        : state.locked ? 'Local Level 0 · locked by direct cell adjacency' : state.affordable ? 'Local Level 0 · ready to establish' : 'Local Level 0 · reachable · more Echoes required';
    const changes = preview?.changes?.map(formatChange).join(' · ') || 'No further change can be represented';
    const unlocked = preview?.unlocked?.map(humanize).join(', ') || 'No new habitat';
    const instruction = state.selectedReady && purchasesOpen ? `Activate this selected cell again to ${state.owned ? 'strengthen' : 'establish'} it.`
      : state.owned ? 'Activate to select this cell.' : state.reachable ? 'Activate to select this reachable cell.' : 'Establish a directly adjacent cell first.';
    byId('memory-node-meta').replaceChildren(...definitionRows([
      ['Status', purchasesOpen ? status : `${status} · Evolution is available after this World`],
      ['Local level', boundary ? `Level ${number(state.localLevel)} · unavailable` : `Level ${number(state.localLevel)} → ${number(state.nextLocalLevel)}`],
      ['Shared archetype rank', boundary ? `Rank ${number(state.aggregateRank)} · unavailable` : `Rank ${number(state.aggregateRank)} → ${number(state.nextAggregateRank)}`],
      ['Exact next cost', boundary ? `${number(projection.balance)} Echoes held` : `${number(state.nextCost)} Echoes · ${number(projection.balance)} held`],
      ['Before → after', changes], ['New habitat', unlocked], ['Purchase', instruction],
    ]));
    unlock.hidden = false; unlock.disabled = !state.selectedReady || !purchasesOpen;
    const verb = state.owned ? 'Strengthen' : 'Establish';
    unlock.textContent = !purchasesOpen ? 'Evolution after this World' : boundary ? 'No further level available'
      : `${verb} cell for ${number(state.nextCost)} Echoes`;
    unlock.setAttribute('aria-label', !purchasesOpen ? `${state.nameEn} cell upgrades are available after this World`
      : boundary ? `${state.nameEn} cell has no further representable level`
        : `${verb} ${state.nameEn} at cell ${state.cell + 1} for ${number(state.nextCost)} Echoes`);
    if (state.nextCost === null) delete unlock.dataset.exactValue; else unlock.dataset.exactValue = state.nextCost;
    unlock.dataset.action = state.selectedReady && purchasesOpen ? 'recommended' : 'normal';
    accessibleDescription = `Cell ${state.cell + 1} of ${EVOLUTION_TOPOLOGY.nodeCount}. ${state.nameEn}. ${state.domain}. Local Level ${number(state.localLevel)}. Shared rank ${number(state.aggregateRank)}. ${statusName(state)}.`;
  }

  function acquisition(preview, newly) {
    clearTimeout(feedbackTimer); change.hidden = false; change.classList.remove('skill-acquired'); void change.offsetWidth; change.classList.add('skill-acquired');
    const effect = preview?.changes?.map(formatChange).join(' · ') || 'Permanent ecological rule improved';
    change.textContent = `${effect}. Shared rank ${number(preview?.newAggregateRank ?? '0')}. ${newly.length} neighboring ${newly.length === 1 ? 'cell is' : 'cells are'} now reachable.`;
    feedbackTimer = setTimeout(() => { change.hidden = true; change.classList.remove('skill-acquired'); }, 5000);
  }

  return { panel,
    openCell(cell, nextProjection) { selectedCell = cell; projection = nextProjection; change.hidden = true; panel.hidden = false; render(); },
    refresh(nextProjection, newly = [], preview = null) { projection = nextProjection; if (selectedCell !== null) render(); if (preview) acquisition(preview, newly); },
    sync(nextProjection) { projection = nextProjection; if (selectedCell !== null) render(); },
    closeNode() { panel.hidden = true; selectedCell = null; projection = null; accessibleDescription = ''; clearTimeout(feedbackTimer); feedbackTimer = 0; change.hidden = true; },
    get selectedCell() { return selectedCell; },
    get accessibleDescription() { return accessibleDescription; },
  };
}

function statusName(state) { return state.owned ? state.affordable ? 'owned and affordable' : 'owned and unaffordable'
  : state.reachable ? state.affordable ? 'reachable and affordable' : 'reachable and unaffordable' : 'locked'; }
function formatChange(change) { return `${humanize(change.key)} ${decimal(change.before)} → ${decimal(change.after)}`; }
function decimal(value) { return `${Math.round(value * 1000) / 1000}${typeof value === 'number' && value > 1.5 ? '' : '×'}`; }
function number(value) { const exact = normalizeProgressionInteger(value, '0'); return exact.length <= 15 ? exact.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : formatProgressionEngineering(exact, 6); }
function byId(id) { return /** @type {HTMLElement} */ (document.getElementById(id)); }
function definitionRows(rows) { return rows.flatMap(([term, value]) => { const dt = document.createElement('dt'); dt.textContent = term; const dd = document.createElement('dd'); dd.textContent = value; return [dt, dd]; }); }
function humanize(value) { return String(value).replaceAll('_', ' ').replaceAll('-', ' ').replace(/\b\w/g, (character) => character.toUpperCase()); }
