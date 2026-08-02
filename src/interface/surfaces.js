/** Core semantic surfaces. Dynamic text uses textContent, never innerHTML. */
const CAUSE = Object.freeze({
  starvation: 'Local resources fell below the cost of the network.',
  heat: 'Heat stress fractured the remaining transport routes.',
  cold: 'The cold stopped transport between surviving cells.',
  drought: 'Drying outpaced the network’s reserves.',
  toxin: 'Toxic pressure overwhelmed the living core.',
  event: 'A planetary crisis split the last viable component.',
  collapse: 'Terminal entropy closed the final living route.',
});

const byId = (id) => /** @type {HTMLElement} */ (document.getElementById(id));
export function elements() {
  return {
    title: byId('title-screen'), run: byId('run-screen'), result: byId('result-screen'), memory: byId('memory-screen'),
    begin: /** @type {HTMLButtonElement} */ (byId('begin-button')),
    memoryButton: /** @type {HTMLButtonElement} */ (byId('memory-button')),
    restart: /** @type {HTMLButtonElement} */ (byId('restart-button')),
    pause: /** @type {HTMLButtonElement} */ (byId('pause-button')),
    speed: /** @type {HTMLSelectElement} */ (byId('speed-select')),
    adaptationButton: /** @type {HTMLButtonElement} */ (byId('adaptations-button')),
    adaptationBadge: byId('adaptation-badge'),
    boot: byId('boot-status'), score: byId('hud-score'), pressure: byId('hud-pressure'), reach: byId('hud-reach'),
    event: byId('hud-event-text'), resultRank: byId('result-rank'), resultScore: byId('result-score'),
    resultCause: byId('result-cause'), breakdown: byId('result-breakdown'), resultAdaptations: byId('result-adaptations'),
    echoes: byId('result-echoes'), resultImprint: byId('result-imprint'), memoryBalance: byId('memory-balance'),
    memoryAvailable: byId('memory-available'), countdown: byId('result-countdown'),
    resultNext: /** @type {HTMLButtonElement} */ (byId('result-next-button')),
    resultDetails: /** @type {HTMLButtonElement} */ (byId('result-details-button')),
    live: byId('live-region'), toast: byId('toast-root'), resultHistory: byId('result-history-button'),
  };
}

export function show(el, state) {
  for (const [name, screen] of Object.entries({ title: el.title, run: el.run, result: el.result, memory: el.memory })) {
    screen.hidden = name !== state;
  }
}

export function updateHud(el, snap) {
  const metrics = snap.metrics ?? {};
  el.score.textContent = number(metrics.score ?? 0);
  el.pressure.textContent = `${Math.round((snap.entropy ?? 0) * 100)}%`;
  el.reach.textContent = `${Math.round((metrics.coverage ?? 0) * 100)}%`;
  updateAdaptationCount(el, metrics.pendingAdaptations ?? snap.pendingAdaptations ?? 0);
}

export function updateAdaptationCount(el, count) {
  const n = Math.max(0, Math.floor(count));
  el.adaptationBadge.hidden = n === 0; el.adaptationBadge.textContent = String(n);
  el.adaptationButton.setAttribute('aria-label', n ? `Adaptations, ${n} waiting` : 'Adaptations');
}

export function announce(el, text) { el.event.textContent = text; el.live.textContent = text; }

export function toast(el, text, quiet = false) {
  if (quiet) return;
  while (el.toast.children.length >= 3) el.toast.firstElementChild?.remove();
  const node = document.createElement('div'); node.className = 'toast toast-enter'; node.textContent = text;
  el.toast.append(node); setTimeout(() => node.remove(), 1800);
}

export function showResult(el, score, result) {
  el.resultRank.textContent = `${score.rank.en.split(' ')[0].toUpperCase()} · +${score.echoes} Echoes`;
  el.resultScore.textContent = number(score.total);
  el.resultCause.textContent = CAUSE[result.cause] ?? 'The final living cell released its remaining energy.';
  el.echoes.textContent = `${score.echoes} Echoes entered permanent memory.`;
  el.resultImprint.textContent = result.imprint?.edges?.length ? 'Imprint preserved · strongest morphology retained.' : '';
  const offers = result.adaptationOffers ?? result.offers ?? [];
  const random = offers.filter((offer) => offer.selectionMode === 'random' && offer.selectedCardId).length;
  const manual = offers.filter((offer) => offer.selectionMode === 'manual' && offer.selectedCardId).length;
  const pending = offers.filter((offer) => !offer.selectedCardId).length;
  el.resultAdaptations.textContent = `Adaptations · ${random} automatic · ${manual} manual${pending ? ` · ${pending} unchosen` : ''}`;
  el.breakdown.replaceChildren(...score.breakdown.map((part) => {
    const row = document.createElement('p'); row.className = 'breakdown-row';
    row.textContent = `${part.en}  ${number(part.points)}`; return row;
  }));
  show(el, 'result');
}

export function showMemory(el, meta, available = 0) { el.memoryBalance.textContent = number(meta.echoBalance);
  el.memoryAvailable.textContent = `${available} available`; show(el, 'memory'); }
export function number(value) { return new Intl.NumberFormat('en').format(Math.round(value)); }
