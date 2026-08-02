/** Semantic DOM surfaces. Dynamic text uses textContent, never innerHTML. */
import { cardById } from '../game/adaptations.js';
import { MEMORY_NODES, canPurchaseMemory } from '../game/memory.js';

const CAUSE = Object.freeze({
  starvation: 'Local resources fell below the cost of the network.',
  heat: 'Heat stress fractured the remaining transport routes.',
  cold: 'The cold stopped transport between surviving cells.',
  drought: 'Drying outpaced the network’s reserves.',
  toxin: 'Toxic pressure overwhelmed the living core.',
  event: 'A planetary crisis split the last viable component.',
  collapse: 'Terminal entropy closed the final living route.',
});

const ADAPTATION_EN = Object.freeze({
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

/** @returns {ReturnType<typeof elements>} */
export function elements() {
  const byId = (id) => /** @type {HTMLElement} */ (document.getElementById(id));
  return {
    title: byId('title-screen'), run: byId('run-screen'), result: byId('result-screen'),
    memory: byId('memory-screen'), begin: /** @type {HTMLButtonElement} */ (byId('begin-button')),
    memoryButton: /** @type {HTMLButtonElement} */ (byId('memory-button')),
    restart: /** @type {HTMLButtonElement} */ (byId('restart-button')),
    pause: /** @type {HTMLButtonElement} */ (byId('pause-button')),
    speed: /** @type {HTMLSelectElement} */ (byId('speed-select')),
    boot: byId('boot-status'), score: byId('hud-score'), pressure: byId('hud-pressure'),
    reach: byId('hud-reach'), signal: byId('hud-signal'), event: byId('hud-event-text'),
    dialog: /** @type {HTMLDialogElement} */ (byId('draft-dialog')),
    cards: byId('draft-cards'), resultRank: byId('result-rank'),
    resultScore: byId('result-score'), resultCause: byId('result-cause'),
    breakdown: byId('result-breakdown'), echoes: byId('result-echoes'),
    memoryBalance: byId('memory-balance'), memoryNodes: byId('memory-nodes'), live: byId('live-region'),
  };
}

/** @param {ReturnType<typeof elements>} el @param {'title'|'run'|'result'|'memory'} state */
export function show(el, state) {
  for (const [name, screen] of Object.entries({ title: el.title, run: el.run, result: el.result, memory: el.memory })) {
    screen.hidden = name !== state;
  }
}

/** @param {ReturnType<typeof elements>} el @param {object} snap */
export function updateHud(el, snap) {
  const m = snap.metrics;
  el.score.textContent = number(m.score ?? 0);
  el.pressure.textContent = `${Math.round(snap.entropy * 100)}%`;
  el.reach.textContent = `${Math.round(m.coverage * 100)}%`;
  el.signal.textContent = `Signal ${m.signalCharges} / ${m.signalMax ?? 3}`;
}

/** @param {ReturnType<typeof elements>} el @param {string} text */
export function announce(el, text) {
  el.event.textContent = text;
  el.live.textContent = text;
}

/** @param {ReturnType<typeof elements>} el @param {string[]} ids @param {(id:string)=>void} choose */
export function showDraft(el, ids, choose) {
  el.cards.replaceChildren(...ids.map((id) => adaptationCard(id, choose)));
  if (!el.dialog.open) el.dialog.showModal();
  const first = el.cards.querySelector('button');
  if (first instanceof HTMLElement) first.focus();
}

/** @param {ReturnType<typeof elements>} el */
export function hideDraft(el) {
  if (el.dialog.open) el.dialog.close();
}

/** @param {ReturnType<typeof elements>} el @param {ReturnType<import('../game/scoring.js').scoreResult>} score @param {object} result */
export function showResult(el, score, result) {
  el.resultRank.textContent = `${score.rank.en} · ${score.rank.ja}`;
  el.resultScore.textContent = number(score.total);
  el.resultCause.textContent = CAUSE[result.cause] ?? 'The final living cell released its remaining energy.';
  el.echoes.textContent = `${score.echoes} Echoes entered permanent memory.`;
  el.breakdown.replaceChildren(...score.breakdown.map((part) => breakdownRow(part)));
  show(el, 'result');
  el.memoryButton.focus();
}

export function showMemory(el, meta, purchase) {
  el.memoryBalance.textContent = number(meta.echoBalance);
  const visible = MEMORY_NODES.filter((node) => meta.memoryNodes.includes(node.id)
    || node.requires.every((required) => meta.memoryNodes.includes(required)));
  el.memoryNodes.replaceChildren(...visible.map((node) => memoryNode(node, meta, purchase)));
  show(el, 'memory');
  const available = el.memoryNodes.querySelector('button:not(:disabled)');
  if (available instanceof HTMLElement) available.focus();
}

function memoryNode(node, meta, purchase) {
  const owned = meta.memoryNodes.includes(node.id);
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'memory-node';
  button.disabled = owned || !canPurchaseMemory(meta, node.id);
  const status = owned ? 'Remembered' : `${node.cost} Echoes`;
  button.append(line('memory-node-name', node.nameEn), line('memory-node-effect', node.effectEn),
    line('memory-node-cost', status));
  if (!button.disabled) button.addEventListener('click', () => purchase(node.id), { once: true });
  return button;
}

function adaptationCard(id, choose) {
  const card = cardById(id);
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'card';
  const copy = ADAPTATION_EN[id] ?? [id, card.effectJa, card.costJa];
  button.append(line('card-category', `⬡ ${card.cats.join(' · ')}`), line('card-name', copy[0]),
    line('card-effect', copy[1]), line('card-cost', copy[2]));
  button.addEventListener('click', () => choose(id), { once: true });
  return button;
}

function breakdownRow(part) {
  const row = document.createElement('p');
  row.className = 'breakdown-row';
  row.textContent = `${part.en} / ${part.ja}  ${number(part.points)}`;
  return row;
}

function line(className, text) {
  const node = document.createElement('span');
  node.className = className; node.textContent = text;
  return node;
}

function number(value) { return new Intl.NumberFormat().format(Math.round(value)); }
