/** Explicit Adaptation and Evolution Globe skill surfaces. */
import { cardById } from '../game/adaptations.js';
import { MEMORY_NODES, getMemoryNode, memoryNodeState } from '../game/memory.js';

export const ADAPTATION_COPY = Object.freeze({
  'long-filaments': ['Long Reach', 'Frontiers extend faster.', 'New living cells cost more to maintain.'],
  'frugal-cytoplasm': ['Frugal Cytoplasm', 'Maintenance falls sharply.', 'Burst growth becomes slower.'],
  anastomosis: ['Anastomosis', 'Separated regions reconnect.', 'Neighbor exchange costs slightly more.'],
  'thermal-proteins': ['Thermal Proteins', 'Heat and cold stress weaken.', 'Nutrient uptake falls.'],
  'dormant-cysts': ['Dormant Cysts', 'Calm tissue endures late pressure.', 'Normal metabolism costs more.'],
  'salt-vesicles': ['Salt Vesicles', 'Drought and toxin tolerance rise.', 'Transport slows.'],
  'exploratory-fans': ['Exploratory Fans', 'Cells open several frontiers.', 'Each route is thinner.'],
  'pulsed-transport': ['Pulsed Transport', 'Neighbor exchange strengthens rhythmically.', 'Exchange weakens between pulses.'],
  'cannibal-reclamation': ['Reclamation', 'Dead tissue returns energy.', 'Stress recovery slows.'],
  'symbiotic-film': ['Symbiotic Film', 'Living regions renew nutrients.', 'Frontier speed falls slightly.'],
  'adaptive-membrane': ['Adaptive Membrane', 'Exposure gradually builds resistance.', 'It begins with no bonus.'],
  'hollow-veins': ['Light Tissue', 'New living cells cost less.', 'Their maximum capacity falls.'],
  'dense-cords': ['Dense Tissue', 'Connected cells carry and reinforce more.', 'Expansion slows.'],
  'migratory-core': ['Migratory Core', 'Life can reclaim rich dead regions.', 'Maintenance rises.'],
  'spore-memory': ['Spore Memory', 'The run gains a memory score bonus.', 'Survival does not improve.'],
  'distributed-sensing': ['Distributed Sensing', 'Crises are forecast sooner.', 'Uptake falls slightly.'],
  'local-sacrifice': ['Local Sacrifice', 'Doomed branches cut themselves away.', 'The network loses their mass.'],
  'redundant-loops': ['Redundant Loops', 'Connected cells decay slower after breaks.', 'Reinforcement is less efficient.'],
  'opportunistic-uptake': ['Opportunistic Uptake', 'Nutrient blooms yield more.', 'Ordinary uptake is unchanged.'],
  'quiet-metabolism': ['Quiet Metabolism', 'Low maintenance extends survival.', 'Score rate falls slightly.'],
  'fever-growth': ['Fever Growth', 'Crises trigger a frontier burst.', 'Normal storage falls slightly.'],
  'cold-reserve': ['Cold Reserve', 'Abundance raises energy storage.', 'The bonus fades late.'],
  'toxin-catalysis': ['Toxin Catalysis', 'Toxic pressure becomes energy.', 'Toxin resistance does not rise.'],
  'fractal-frontier': ['Fractal Frontier', 'More tips search at once.', 'Individual branches weaken.'],
});

export function createAdaptationSurface(options) {
  const surface = byId('adaptations-dialog'); const cards = byId('adaptation-cards');
  const pending = byId('adaptations-pending'); const meta = byId('adaptations-offer-meta');
  const owned = byId('adaptations-owned'); const auto = byId('adaptation-auto');
  const manual = byId('adaptation-manual'); const help = byId('adaptation-mode-help');
  let model = { offers: [], cards: [], mode: 'random', tick: 0 };
  byId('adaptations-close').addEventListener('click', options.onClose);
  auto.addEventListener('click', () => options.onMode('random'));
  manual.addEventListener('click', () => options.onMode('manual'));
  function render() {
    const automatic = model.mode === 'random'; auto.setAttribute('aria-pressed', String(automatic));
    manual.setAttribute('aria-pressed', String(!automatic));
    help.textContent = automatic ? 'Randomly chooses one of the three options. The result is deterministic for this world.'
      : 'Offers wait here while the world continues.';
    const queue = model.offers.filter((offer) => offer.resolvedTick == null); const offer = queue[0];
    pending.textContent = queue.length ? `${queue.length} pending ${queue.length === 1 ? 'offer' : 'offers'}` : 'No pending offers';
    meta.textContent = offer ? `Offered at ${gameTime(offer.offerTick)} · ${offer.reason} · world ${gameTime(model.tick)}`
      : `All offers resolved · world ${gameTime(model.tick)}`;
    cards.replaceChildren(...(offer?.options ?? []).map((id) => adaptationCard(id, () => options.onChoose(offer.id, id))));
    owned.replaceChildren(...model.cards.map((id) => { const li = document.createElement('li');
      li.textContent = ADAPTATION_COPY[id]?.[0] ?? humanize(id); return li; }));
  }
  return { surface, update(next) { model = next; if (!surface.hidden) render(); },
    open(next) { model = next; render(); surface.hidden = false; }, close() { surface.hidden = true; } };
}

function adaptationCard(id, choose) {
  const card = cardById(id); const copy = ADAPTATION_COPY[id]
    ?? [humanize(id), 'A new behavior enters the network.', 'Its tradeoff is preserved in the run.'];
  const button = document.createElement('button'); button.type = 'button'; button.className = 'card'; button.dataset.action = 'available';
  button.append(line('card-category', `⬡ ${card.cats.join(' · ')}`), line('card-name', copy[0]),
    line('card-effect', copy[1]), line('card-cost', copy[2]));
  button.addEventListener('click', choose, { once: true }); return button;
}

export function createMemorySurface(options) {
  const panel = byId('memory-node-panel'); const unlock = /** @type {HTMLButtonElement} */ (byId('memory-unlock'));
  const tree = byId('evolution-tree'); const change = byId('memory-node-change'); let selected = null; let meta = null;
  byId('memory-node-close').addEventListener('click', options.onCloseNode);
  unlock.addEventListener('click', () => { if (selected) options.onUnlock(selected.id); });
  function renderNode() {
    const state = memoryNodeState(meta, selected, selected?.id); selected = state;
    byId('memory-node-branch').textContent = `${state.branch.toUpperCase()} · TIER ${state.tier}`;
    byId('memory-node-heading').textContent = state.nameEn; byId('memory-node-summary').textContent = state.effectEn;
    byId('memory-node-detail').textContent = state.description;
    const status = state.owned ? 'Unlocked' : state.runsRemaining ? `Locked · observe ${state.runsRemaining} more worlds`
      : state.locked ? 'Locked · prerequisite skills needed' : state.affordable ? 'Available' : 'Available · more Echoes needed';
    const prereqs = state.requires.length ? state.requires.map((id) => getMemoryNode(id)?.nameEn ?? id).join(', ') : 'No prerequisite';
    byId('memory-node-meta').replaceChildren(...definitionRows([
      ['Status', status], ['Cost', `${state.cost} Echoes · ${meta.echoBalance} held`],
      ['Worlds observed', state.requiredRuns ? `${meta.runs} of ${state.requiredRuns} required` : 'Ready from first world'],
      ['Prerequisite skills', prereqs]]));
    unlock.hidden = state.owned; unlock.disabled = !state.selectedReady;
    unlock.textContent = `Unlock for ${state.cost} Echoes`; unlock.dataset.action = state.selectedReady ? 'recommended' : 'normal';
  }
  function renderTree() {
    tree.replaceChildren(...MEMORY_NODES.map((node) => { const state = memoryNodeState(meta, node);
      const button = document.createElement('button'); button.type = 'button'; button.setAttribute('role', 'treeitem');
      button.setAttribute('aria-level', String(state.tier + 1)); button.setAttribute('aria-selected', String(state.id === selected?.id));
      const status = state.owned ? 'Unlocked' : state.reachable ? state.affordable ? 'Available' : 'Available, more Echoes needed'
        : state.runsRemaining ? `Locked, observe ${state.runsRemaining} more worlds` : 'Locked';
      button.textContent = `${state.nameEn}. ${status}. ${state.cost} Echoes.`; button.addEventListener('click', () => options.onSelect(node.id)); return button;
    }));
  }
  return { panel, openNode(node, nextMeta) { selected = node; meta = nextMeta; change.hidden = true;
      panel.hidden = false; renderNode(); renderTree(); },
    refresh(nextMeta, newly = []) { meta = nextMeta; if (selected) renderNode(); renderTree();
      change.hidden = newly.length === 0; change.textContent = newly.length ? `${newly.length} adjacent ${newly.length === 1 ? 'skill is' : 'skills are'} now available.` : ''; },
    syncTree(nextMeta) { meta = nextMeta; renderTree(); }, closeNode() { panel.hidden = true; selected = null; },
    get selectedId() { return selected?.id ?? null; } };
}

function byId(id) { return /** @type {HTMLElement} */ (document.getElementById(id)); }
function line(className, text) { const node = document.createElement('span'); if (className) node.className = className; node.textContent = text; return node; }
function definitionRows(rows) { return rows.flatMap(([term, value]) => { const dt = document.createElement('dt'); dt.textContent = term;
  const dd = document.createElement('dd'); dd.textContent = value; return [dt, dd]; }); }
function humanize(value) { return String(value).replaceAll('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase()); }
function gameTime(tick) { const seconds = Math.floor((tick ?? 0) / 10); return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }
