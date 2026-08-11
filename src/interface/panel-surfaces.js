/** Evolution sphere semantic tree, concise detail, and exact acquisition feedback. */
import { MEMORY_NODES, evolutionCellState, getMemoryNode, previewEvolutionLevel, newlyAvailableAdjacentIds } from '../game/skills/index.js';
import { formatProgressionEngineering, normalizeProgressionInteger } from '../core/progression-integer.js';

export function createMemorySurface(options) {
  const panel = byId('memory-node-panel'); const unlock = /** @type {HTMLButtonElement} */ (byId('memory-unlock'));
  const tree = byId('evolution-tree'); const change = byId('memory-node-change'); let selected = null; let meta = null; let feedbackTimer = 0;
  byId('memory-node-close').addEventListener('click', options.onCloseNode);
  unlock.addEventListener('click', () => { if (selected) options.onUnlock(selected.id); });
  function renderNode() {
    const state = evolutionCellState(meta, selected, selected?.id); selected = state; const purchasesOpen = options.canUnlock?.() !== false;
    const preview = previewEvolutionLevel(meta, state.id); const boundary = state.reason === 'progression-security-boundary';
    byId('memory-node-branch').textContent = `${state.domain.toUpperCase()} · RING ${state.tier}`;
    byId('memory-node-heading').textContent = state.nameEn; byId('memory-node-summary').textContent = state.summary;
    byId('memory-node-detail').textContent = state.description;
    const status = boundary ? `Level ${number(state.currentLevel)} · no further level can be represented here`
      : state.owned ? state.affordable ? `Level ${number(state.currentLevel)} · ready to upgrade` : `Level ${number(state.currentLevel)} · more Echoes required`
        : state.locked ? 'Level 0 · locked by physical adjacency' : state.affordable ? 'Level 0 · ready to unlock' : 'Level 0 · reachable · more Echoes required';
    const neighbor = state.adjacentOwnedId ? getMemoryNode(state.adjacentOwnedId)?.nameEn ?? state.adjacentOwnedId
      : state.bootstrap ? 'First Division is the only fresh frontier' : 'No adjacent Level 1+ cell';
    const changes = preview?.changes?.map(formatChange).join(' · ') || 'No further change can be represented';
    const unlocked = preview?.unlocked?.map(humanize).join(', ') || 'No new habitat';
    const nearby = newlyAvailableAdjacentIds(meta, state.id).map((id) => getMemoryNode(id)?.nameEn ?? id);
    const instruction = state.selectedReady && purchasesOpen ? `Activate this selected cell again to ${state.owned ? 'upgrade' : 'unlock'}.`
      : state.owned ? 'Activate to select this cell.' : state.reachable ? 'Activate to select this reachable cell.' : 'Unlock a directly adjacent Level 1+ cell first.';
    byId('memory-node-meta').replaceChildren(...definitionRows([
      ['Status', purchasesOpen ? status : `${status} · Evolution is available after this World`],
      ['Current → next level', boundary ? `Level ${number(state.currentLevel)} · unavailable` : `Level ${number(state.currentLevel)} → Level ${number(state.nextLevel)}`],
      ['Exact next cost', boundary ? `${number(meta.echoBalance)} Echoes held` : `${number(state.nextCost)} Echoes · ${number(meta.echoBalance)} held`],
      ['Before → after', changes], ['New habitat', unlocked], ['Unlock reason', neighbor], ['Purchase', instruction],
      ['New neighboring cells', nearby.length ? nearby.join(', ') : 'No additional frontier from this cell'],
    ]));
    unlock.hidden = false; unlock.disabled = !state.selectedReady || !purchasesOpen;
    const verb = state.owned ? 'Upgrade' : 'Unlock';
    unlock.textContent = !purchasesOpen ? 'Evolution after this World' : boundary ? 'No further level available'
      : `${verb} for ${number(state.nextCost)} Echoes`;
    unlock.setAttribute('aria-label', !purchasesOpen ? `${state.nameEn} upgrades are available after this World`
      : boundary ? `${state.nameEn} has no further representable level` : `${verb} ${state.nameEn} for ${number(state.nextCost)} Echoes`);
    if (state.nextCost === null) delete unlock.dataset.exactValue; else unlock.dataset.exactValue = state.nextCost;
    unlock.dataset.action = state.selectedReady && purchasesOpen ? 'recommended' : 'normal';
  }
  function renderTree() {
    tree.replaceChildren(...MEMORY_NODES.map((node) => {
      const state = evolutionCellState(meta, node, selected?.id); const button = document.createElement('button'); button.type = 'button';
      button.setAttribute('role', 'treeitem'); button.setAttribute('aria-level', String(state.tier + 1)); button.setAttribute('aria-selected', String(state.id === selected?.id));
      const availability = state.owned ? state.affordable ? 'Owned and ready to upgrade' : 'Owned; more Echoes required'
        : state.reachable ? state.affordable ? 'Ready to unlock' : 'Reachable; more Echoes required' : 'Locked; an adjacent Level 1+ cell is required';
      const next = state.nextCost === null ? 'No further level is available.' : `Next level ${number(state.nextLevel)} costs ${number(state.nextCost)} Echoes.`;
      const prompt = state.id === selected?.id && state.reason === 'ready' ? `Activate again to ${state.owned ? 'purchase one upgrade' : 'unlock'}.` : 'Activate to select.';
      button.textContent = `${state.nameEn}. ${state.domain}. Level ${number(state.currentLevel)}. ${state.summary} ${availability}. ${next} ${prompt}`;
      button.addEventListener('click', () => options.onSelect(node.id)); return button;
    }));
  }
  function acquisition(preview, newly) {
    clearTimeout(feedbackTimer); change.hidden = false; change.classList.remove('skill-acquired'); void change.offsetWidth; change.classList.add('skill-acquired');
    const effect = preview?.changes?.map(formatChange).join(' · ') || 'Permanent ecological rule improved';
    change.textContent = `${effect}. ${newly.length} adjacent ${newly.length === 1 ? 'cell is' : 'cells are'} now available.`;
    feedbackTimer = setTimeout(() => { change.hidden = true; change.classList.remove('skill-acquired'); }, 5000);
  }
  return { panel,
    openNode(node, nextMeta) { selected = node; meta = nextMeta; change.hidden = true; panel.hidden = false; renderNode(); renderTree(); },
    refresh(nextMeta, newly = [], preview = null) { meta = nextMeta; if (selected) renderNode(); renderTree(); if (preview) acquisition(preview, newly); },
    syncTree(nextMeta) { meta = nextMeta; renderTree(); },
    closeNode() { panel.hidden = true; selected = null; clearTimeout(feedbackTimer); feedbackTimer = 0; change.hidden = true; },
    get selectedId() { return selected?.id ?? null; },
  };
}
function formatChange(change) { return `${humanize(change.key)} ${decimal(change.before)} → ${decimal(change.after)}`; }
function decimal(value) { return `${Math.round(value * 1000) / 1000}${typeof value === 'number' && value > 1.5 ? '' : '×'}`; }
function number(value) { const exact = normalizeProgressionInteger(value, '0'); return exact.length <= 15 ? exact.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : formatProgressionEngineering(exact, 6); }
function byId(id) { return /** @type {HTMLElement} */ (document.getElementById(id)); }
function definitionRows(rows) { return rows.flatMap(([term, value]) => { const dt = document.createElement('dt'); dt.textContent = term; const dd = document.createElement('dd'); dd.textContent = value; return [dt, dd]; }); }
function humanize(value) { return String(value).replaceAll('_', ' ').replaceAll('-', ' ').replace(/\b\w/g, (character) => character.toUpperCase()); }
