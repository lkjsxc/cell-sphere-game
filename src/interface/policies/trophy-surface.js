/** Read-only pointer and keyboard surface for all 96 Trophy criteria. */
import { TROPHIES, groupedTrophies } from '../../game/trophies/index.js';
export function createTrophySurface(options) {
  const panel = byId('trophy-detail-panel'); const grid = byId('trophy-grid'); let selected = null; let meta = null; let focusIndex = 0;
  byId('trophy-detail-close').addEventListener('click', options.onClose);
  grid.addEventListener('keydown', (event) => { const at = Number(event.target?.dataset?.trophyIndex); if (!Number.isInteger(at)) return;
    const moves = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -16, ArrowDown: 16, Home: -(at % 16), End: 15 - at % 16 };
    if (!(event.key in moves)) return; event.preventDefault(); focusIndex = Math.max(0, Math.min(95, at + moves[event.key])); renderGrid(); grid.querySelector(`[data-trophy-index="${focusIndex}"]`)?.focus(); });
  function renderGrid() { const earned = new Set(meta?.trophyIds ?? []); const groups = groupedTrophies(); let index = 0;
    grid.replaceChildren(...groups.map((group) => { const row = document.createElement('div'); row.setAttribute('role', 'row'); row.setAttribute('aria-label', group.family);
      for (const trophy of group.trophies) { const at = index++; const button = document.createElement('button'); button.type = 'button'; button.dataset.trophyIndex = String(at); button.dataset.trophyId = trophy.id;
        button.setAttribute('role', 'gridcell'); button.tabIndex = at === focusIndex ? 0 : -1; button.setAttribute('aria-selected', String(trophy.id === selected?.id));
        button.textContent = `${trophy.nameEn}. ${earned.has(trophy.id) ? 'Earned' : 'Not earned'}. ${trophy.criteriaEn}`;
        button.addEventListener('click', () => options.onSelect(trophy.id)); row.append(button); } return row; })); }
  function renderDetail() { if (!selected) return; const earned = new Set(meta?.trophyIds ?? []).has(selected.id);
    byId('trophy-detail-family').textContent = `${selected.family.toUpperCase()} · TIER ${selected.tier}`;
    byId('trophy-detail-heading').textContent = selected.nameEn; byId('trophy-detail-criterion').textContent = selected.criteriaEn;
    byId('trophy-detail-status').textContent = earned ? 'Earned from preserved world evidence.' : 'Not yet earned. Progress is checked after completed worlds and explicit Trophy review.';
  }
  return { panel, sync(nextMeta) { meta = nextMeta; renderGrid(); }, open(trophy, nextMeta) { selected = trophy; meta = nextMeta;
      focusIndex = TROPHIES.indexOf(trophy); renderDetail(); renderGrid(); panel.hidden = false; },
    close() { panel.hidden = true; selected = null; renderGrid(); }, get selectedId() { return selected?.id ?? null; } };
}
function byId(id) { return /** @type {HTMLElement} */ (document.getElementById(id)); }
