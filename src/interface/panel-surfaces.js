/** Explicit Adaptation and Memory atlas panels. */
import { cardById } from '../game/adaptations.js';
import { MEMORY_BRANCHES, MEMORY_NODES, getMemoryNode, memoryNodeState } from '../game/memory.js';

const COPY = Object.freeze({
  'long-filaments': ['Long Filaments', 'Frontiers extend faster.', 'Routes cost more to maintain.'],
  'frugal-cytoplasm': ['Frugal Cytoplasm', 'Maintenance falls sharply.', 'Burst growth becomes slower.'],
  anastomosis: ['Anastomosis', 'Separated branches reconnect.', 'Transport costs slightly more.'],
  'thermal-proteins': ['Thermal Proteins', 'Heat and cold stress weaken.', 'Nutrient uptake falls.'],
  'dormant-cysts': ['Dormant Cysts', 'Calm tissue endures late pressure.', 'Normal metabolism costs more.'],
  'salt-vesicles': ['Salt Vesicles', 'Drought and toxin tolerance rise.', 'Transport slows.'],
  'exploratory-fans': ['Exploratory Fans', 'Cells open several frontiers.', 'Each route is thinner.'],
  'pulsed-transport': ['Pulsed Transport', 'Flow pulses reinforce routes.', 'Flow weakens between pulses.'],
  'cannibal-reclamation': ['Reclamation', 'Dead tissue returns energy.', 'Stress recovery slows.'],
  'symbiotic-film': ['Symbiotic Film', 'Living regions renew nutrients.', 'Frontier speed falls slightly.'],
  'adaptive-membrane': ['Adaptive Membrane', 'Exposure gradually builds resistance.', 'It begins with no bonus.'],
  'hollow-veins': ['Hollow Veins', 'New routes cost less.', 'Their maximum capacity falls.'],
  'dense-cords': ['Dense Cords', 'Routes carry and reinforce more.', 'Expansion slows.'],
  'migratory-core': ['Migratory Core', 'Life can reclaim rich dead regions.', 'Maintenance rises.'],
  'spore-memory': ['Spore Memory', 'The run gains a memory score bonus.', 'Survival does not improve.'],
  'distributed-sensing': ['Distributed Sensing', 'Crises are forecast sooner.', 'Uptake falls slightly.'],
  'local-sacrifice': ['Local Sacrifice', 'Doomed branches cut themselves away.', 'The network loses their mass.'],
  'redundant-loops': ['Redundant Loops', 'Routes decay slower after breaks.', 'Reinforcement is less efficient.'],
  'opportunistic-uptake': ['Opportunistic Uptake', 'Nutrient blooms yield more.', 'Ordinary uptake is unchanged.'],
  'quiet-metabolism': ['Quiet Metabolism', 'Low maintenance extends survival.', 'Score rate falls slightly.'],
  'fever-growth': ['Fever Growth', 'Crises trigger a frontier burst.', 'Normal storage falls slightly.'],
  'cold-reserve': ['Cold Reserve', 'Abundance raises energy storage.', 'The bonus fades late.'],
  'toxin-catalysis': ['Toxin Catalysis', 'Toxic pressure becomes energy.', 'Toxin resistance does not rise.'],
  'fractal-frontier': ['Fractal Frontier', 'More tips search at once.', 'Individual branches weaken.'],
});

export function createAdaptationSurface(options) {
  const dialog = /** @type {HTMLDialogElement} */ (document.getElementById('adaptations-dialog'));
  const cards = document.getElementById('adaptation-cards'); const pending = document.getElementById('adaptations-pending');
  const meta = document.getElementById('adaptations-offer-meta'); const owned = document.getElementById('adaptations-owned');
  const modeButton = /** @type {HTMLButtonElement} */ (document.getElementById('adaptations-mode'));
  let model = { offers: [], cards: [], mode: 'random', tick: 0 };
  document.getElementById('adaptations-close')?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('cancel', (event) => { event.preventDefault(); dialog.close(); });
  dialog.addEventListener('close', () => options.onClose());
  modeButton.addEventListener('click', () => options.onMode(model.mode === 'random' ? 'manual' : 'random'));
  function render() {
    const queue = model.offers.filter((offer) => offer.resolvedTick == null); const offer = queue[0];
    pending.textContent = queue.length ? `${queue.length} pending ${queue.length === 1 ? 'offer' : 'offers'}` : 'No pending offers';
    modeButton.textContent = model.mode === 'random' ? 'AUTO: RANDOM' : 'MANUAL'; modeButton.dataset.mode = model.mode;
    meta.textContent = offer ? `Offered at ${gameTime(offer.offerTick)} · ${offer.reason} · world ${gameTime(model.tick)}`
      : `All offers resolved · world ${gameTime(model.tick)}`;
    cards.replaceChildren(...(offer?.options ?? []).map((id) => adaptationCard(id,
      () => options.onChoose(offer.id, id))));
    owned.replaceChildren(...model.cards.map((id) => { const li = document.createElement('li'); li.textContent = COPY[id]?.[0] ?? humanize(id); return li; }));
  }
  return { dialog, update(next) { model = next; if (dialog.open) render(); },
    open(next) { model = next; render(); if (!dialog.open) dialog.showModal(); document.getElementById('adaptations-close')?.focus(); },
    close() { if (dialog.open) dialog.close(); } };
}

function adaptationCard(id, choose) {
  const card = cardById(id); const copy = COPY[id] ?? [humanize(id), 'A new behavior enters the network.', 'Its tradeoff is preserved in the run.'];
  const button = document.createElement('button'); button.type = 'button'; button.className = 'card';
  button.append(line('card-category', `⬡ ${card.cats.join(' · ')}`), line('card-name', copy[0]),
    line('card-effect', copy[1]), line('card-cost', copy[2])); button.addEventListener('click', choose, { once: true }); return button;
}

export function createMemorySurface(options) {
  const panel = document.getElementById('memory-node-panel'); const unlock = /** @type {HTMLButtonElement} */ (document.getElementById('memory-unlock'));
  const listDialog = /** @type {HTMLDialogElement} */ (document.getElementById('memory-list-dialog'));
  const listRoot = document.getElementById('memory-list'); const filter = /** @type {HTMLSelectElement} */ (document.getElementById('memory-list-filter'));
  let selected = null; let meta = null;
  document.getElementById('memory-node-close')?.addEventListener('click', () => options.onCloseNode());
  document.getElementById('memory-list-close')?.addEventListener('click', () => listDialog.close());
  listDialog.addEventListener('cancel', (event) => { event.preventDefault(); listDialog.close(); });
  listDialog.addEventListener('close', () => options.onCloseList()); filter.addEventListener('change', renderList);
  unlock.addEventListener('click', () => { if (selected) options.onUnlock(selected.id); });
  function renderNode() {
    const state = memoryNodeState(meta, selected, selected?.id); selected = state;
    document.getElementById('memory-node-branch').textContent = `${state.branch.toUpperCase()} · TIER ${state.tier}`;
    document.getElementById('memory-node-heading').textContent = state.nameEn;
    document.getElementById('memory-node-summary').textContent = state.effectEn;
    document.getElementById('memory-node-detail').textContent = state.description;
    const status = state.owned ? 'Owned' : state.locked ? 'Locked' : state.affordable ? 'Available' : 'Needs more Echoes';
    const prereqs = state.requires.length ? state.requires.map((id) => getMemoryNode(id)?.nameEn ?? id).join(', ') : 'Atlas origin';
    const root = document.getElementById('memory-node-meta'); root.replaceChildren(...definitionRows([
      ['Status', status], ['Cost', `${state.cost} Echoes · ${meta.echoBalance} held`], ['Prerequisites', prereqs], ['Kind', humanize(state.kind)]]));
    unlock.disabled = !state.selectedReady; unlock.textContent = state.owned ? 'Remembered' : `Unlock · ${state.cost} Echoes`;
  }
  function renderList() {
    const status = filter.value; const fragments = [];
    for (const branch of MEMORY_BRANCHES) {
      const heading = document.createElement('h3'); heading.textContent = branch; fragments.push(heading);
      for (const node of MEMORY_NODES.filter((item) => item.branch === branch)) {
        const state = memoryNodeState(meta, node); const value = state.owned ? 'owned' : state.reachable && state.affordable ? 'available' : 'locked';
        if (status !== 'all' && status !== value) continue;
        const button = document.createElement('button'); button.type = 'button'; button.className = 'memory-list-item';
        button.append(line('', state.nameEn), line('', `${value} · ${state.cost} Echoes`));
        button.addEventListener('click', () => { listDialog.close(); options.onSelect(node.id); }); fragments.push(button);
      }
    }
    listRoot.replaceChildren(...fragments);
  }
  return { panel, openNode(node, nextMeta) { selected = node; meta = nextMeta; panel.hidden = false; renderNode(); },
    refresh(nextMeta) { meta = nextMeta; if (selected) renderNode(); }, closeNode() { panel.hidden = true; selected = null; },
    openList(nextMeta) { meta = nextMeta; renderList(); if (!listDialog.open) listDialog.showModal(); filter.focus(); },
    closeList() { if (listDialog.open) listDialog.close(); }, get selectedId() { return selected?.id ?? null; } };
}

export function nearestMemoryNode(hit, topo, threshold = 0.986) {
  let best = null; let bestDot = threshold;
  for (const node of MEMORY_NODES) { const p = node.cell * 3;
    const dot = hit[0] * topo.positions[p] + hit[1] * topo.positions[p + 1] + hit[2] * topo.positions[p + 2];
    if (dot > bestDot) { bestDot = dot; best = node; } }
  return best;
}

function line(className, text) { const node = document.createElement('span'); if (className) node.className = className; node.textContent = text; return node; }
function definitionRows(rows) { return rows.flatMap(([term, value]) => { const dt = document.createElement('dt'); dt.textContent = term;
  const dd = document.createElement('dd'); dd.textContent = value; return [dt, dd]; }); }
function humanize(value) { return String(value).replaceAll('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase()); }
function gameTime(tick) { const seconds = Math.floor((tick ?? 0) / 10); return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }
