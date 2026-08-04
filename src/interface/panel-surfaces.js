/** Evolution Globe semantic tree, Skill detail, and acquisition feedback. */
import { MEMORY_NODES, getMemoryNode, memoryNodeState, memoryPurchasePreview, newlyAvailableAdjacentIds } from '../game/skills/index.js';

export function createMemorySurface(options) {
  const panel = byId('memory-node-panel'); const unlock = /** @type {HTMLButtonElement} */ (byId('memory-unlock'));
  const tree = byId('evolution-tree'); const change = byId('memory-node-change');
  let selected = null; let meta = null; let feedbackTimer = 0;
  byId('memory-node-close').addEventListener('click', options.onCloseNode);
  unlock.addEventListener('click', () => { if (selected) options.onUnlock(selected.id); });

  function renderNode() {
    const state = memoryNodeState(meta, selected, selected?.id); selected = state;
    const preview = memoryPurchasePreview(meta, state.id);
    byId('memory-node-branch').textContent = `${state.branch.toUpperCase()} · TIER ${state.tier}`;
    byId('memory-node-heading').textContent = state.nameEn;
    byId('memory-node-summary').textContent = state.effectEn;
    byId('memory-node-detail').textContent = state.description;
    const status = state.owned ? 'Owned' : state.locked ? 'Locked · one directly adjacent owned cell required'
      : state.affordable ? 'Available' : 'Available · more Echoes required';
    const neighbor = state.adjacentOwnedId ? getMemoryNode(state.adjacentOwnedId)?.nameEn ?? state.adjacentOwnedId
      : state.bootstrap ? 'Fresh-world root' : 'No adjacent owned cell';
    const gameplayParts = [...(preview?.changes?.map(formatChange) ?? []),
      ...(preview?.unlocked?.map((entry) => `${humanize(entry.key)} unlocked`) ?? [])];
    const gameplay = gameplayParts.length ? gameplayParts.join(' · ') : 'Rule change shown above';
    const potential = preview ? `${number(preview.potentialBefore)} → ${number(preview.potentialAfter)} (+${number(preview.potentialGain)})`
      : `${number(metaWorldPotential(meta))} current`;
    const newlyAvailable = newlyAvailableAdjacentIds(meta, state.id).map((id) => getMemoryNode(id)?.nameEn ?? id);
    byId('memory-node-meta').replaceChildren(...definitionRows([
      ['Status', status], ['Cost', `${state.cost} Echoes · ${meta.echoBalance} held`],
      ['Gameplay', gameplay], ['World Potential', potential], ['Adjacent owned cell', neighbor],
      ['Newly available', newlyAvailable.length ? newlyAvailable.join(', ') : 'No additional adjacent cells'],
    ]));
    unlock.hidden = state.owned; unlock.disabled = !state.selectedReady;
    unlock.textContent = `Unlock for ${state.cost} Echoes`; unlock.dataset.action = state.selectedReady ? 'recommended' : 'normal';
  }

  function renderTree() {
    tree.replaceChildren(...MEMORY_NODES.map((node) => {
      const state = memoryNodeState(meta, node); const button = document.createElement('button'); button.type = 'button';
      button.setAttribute('role', 'treeitem'); button.setAttribute('aria-level', String(state.tier + 1));
      button.setAttribute('aria-selected', String(state.id === selected?.id));
      const status = state.owned ? 'Owned' : state.reachable ? state.affordable ? 'Available' : 'Available, more Echoes required'
        : 'Locked, adjacent owned cell required';
      button.textContent = `${state.nameEn}. ${status}. ${state.cost} Echoes. World Potential plus ${number(state.potentialGain)}.`;
      button.addEventListener('click', () => options.onSelect(node.id)); return button;
    }));
  }

  function acquisition(preview, newly) {
    clearTimeout(feedbackTimer); change.hidden = false; change.classList.remove('skill-acquired'); void change.offsetWidth;
    change.classList.add('skill-acquired');
    const effectParts = [...(preview?.changes?.map(formatChange) ?? []),
      ...(preview?.unlocked?.map((entry) => `${humanize(entry.key)} unlocked`) ?? [])];
    const effect = effectParts.join(' · ') || 'Permanent rule unlocked';
    change.textContent = `${effect}. World Potential ${number(preview?.potentialBefore ?? 0)} → ${number(preview?.potentialAfter ?? 0)}. ${newly.length} adjacent ${newly.length === 1 ? 'cell is' : 'cells are'} now available.`;
    feedbackTimer = setTimeout(() => { change.hidden = true; change.classList.remove('skill-acquired'); }, 5000);
  }

  return {
    panel,
    openNode(node, nextMeta) { selected = node; meta = nextMeta; change.hidden = true; panel.hidden = false; renderNode(); renderTree(); },
    refresh(nextMeta, newly = [], preview = null) { meta = nextMeta; if (selected) renderNode(); renderTree(); if (preview) acquisition(preview, newly); },
    syncTree(nextMeta) { meta = nextMeta; renderTree(); },
    closeNode() { panel.hidden = true; selected = null; clearTimeout(feedbackTimer); feedbackTimer = 0; change.hidden = true; },
    get selectedId() { return selected?.id ?? null; },
  };
}

function metaWorldPotential(meta) {
  let value = 16000; const owned = new Set(meta?.memoryNodes ?? []);
  for (const node of MEMORY_NODES) if (owned.has(node.id)) value += node.potentialGain;
  return value;
}
function formatChange(change) { return `${humanize(change.key)} ${decimal(change.before)} → ${decimal(change.after)}`; }
function decimal(value) { return `${Math.round(value * 1000) / 1000}×`; }
function number(value) { return new Intl.NumberFormat('en').format(Math.round(value)); }
function byId(id) { return /** @type {HTMLElement} */ (document.getElementById(id)); }
function definitionRows(rows) { return rows.flatMap(([term, value]) => { const dt = document.createElement('dt'); dt.textContent = term;
  const dd = document.createElement('dd'); dd.textContent = value; return [dt, dd]; }); }
function humanize(value) { return String(value).replaceAll('_', ' ').replaceAll('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase()); }
