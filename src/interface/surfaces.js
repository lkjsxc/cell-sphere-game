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
    adaptationBadge: byId('adaptation-badge'), adaptationModeLabel: byId('adaptation-mode-label'),
    boot: byId('boot-status'), score: byId('hud-score'), pressure: byId('hud-pressure'), reach: byId('hud-reach'), trace: byId('hud-trace'),
    reachButton: byId('reach-balance-button'), resultReach: byId('result-reach-button'),
    event: byId('hud-event-text'), resultRank: byId('result-rank'), resultScore: byId('result-score'),
    resultCause: byId('result-cause'), breakdown: byId('result-breakdown'), resultAdaptations: byId('result-adaptations'),
    echoes: byId('result-echoes'), resultImprint: byId('result-imprint'), memoryBalance: byId('memory-balance'),
    memoryAvailable: byId('memory-available'), countdown: byId('result-countdown'),
    resultNext: /** @type {HTMLButtonElement} */ (byId('result-next-button')),
    evolutionButton: /** @type {HTMLButtonElement} */ (byId('memory-button')),
    resultDetails: /** @type {HTMLButtonElement} */ (byId('result-details-button')),
    live: byId('live-region'), toast: byId('toast-root'), adaptationCaption: byId('adaptation-caption'),
    resultHistory: byId('result-history-button'),
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
  const aliveCount = Math.max(0, Math.floor(metrics.aliveCount ?? 0));
  el.reach.textContent = formatCoverage(metrics.coverage ?? 0, aliveCount, snap.alive?.length ?? 2562);
  el.trace.hidden = aliveCount === 0 || aliveCount > 3;
  el.trace.textContent = snap.status === 'terminal-collapse' ? 'FINAL TRACE' : `LAST ${aliveCount} ${aliveCount === 1 ? 'CELL' : 'CELLS'}`;
  updateAdaptationCount(el, metrics.pendingAdaptations ?? snap.pendingAdaptations ?? 0);
}

export function updateAdaptationCount(el, count) {
  const n = Math.max(0, Math.floor(count));
  el.adaptationBadge.hidden = n === 0; el.adaptationBadge.textContent = String(n);
  const manual = el.adaptationButton.dataset.mode === 'manual';
  el.adaptationButton.dataset.action = manual && n >= 3 ? 'urgent' : manual && n ? 'recommended' : 'normal';
  el.adaptationButton.setAttribute('aria-label', n ? `Adaptations, ${n} waiting, ${manual ? 'manual' : 'auto random'}` : `Adaptations, ${manual ? 'manual' : 'auto random'}`);
}

export function updateAdaptationMode(el, mode) {
  const manual = mode === 'manual'; el.adaptationButton.dataset.mode = manual ? 'manual' : 'random';
  el.adaptationModeLabel.textContent = manual ? 'MANUAL' : 'AUTO';
  updateAdaptationCount(el, el.adaptationBadge.hidden ? 0 : Number(el.adaptationBadge.textContent));
}

export function announce(el, text) { el.event.textContent = text; el.live.textContent = text; }

export function toast(el, text, quiet = false) {
  if (quiet) return;
  while (el.toast.children.length >= 3) el.toast.firstElementChild?.remove();
  const node = document.createElement('div'); node.className = 'toast toast-enter'; node.textContent = text;
  el.toast.append(node); setTimeout(() => node.remove(), 1800);
}

export function showResult(el, score, result) {
  el.resultRank.textContent = result.campaignResolvedNow ? `FIRST CYCLE RESOLVED · +${score.echoes} Echoes`
    : `${score.rank.en.split(' ')[0].toUpperCase()} · +${score.echoes} Echoes`;
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

export function formatCoverage(coverage, aliveCount, totalCells = 2562) {
  const living = Math.max(0, Math.floor(aliveCount));
  if (living === 0) return '0%';
  const percent = Math.max(coverage * 100, living / Math.max(1, totalCells) * 100);
  if (percent < 0.1) return `<0.1% · ${living} ${living === 1 ? 'cell' : 'cells'}`;
  if (percent < 10) return `${percent.toFixed(1)}%`;
  return `${Math.round(percent)}%`;
}

export function showMemory(el, meta, available = 0) { el.memoryBalance.textContent = number(meta.echoBalance);
  el.memoryAvailable.textContent = `${available} ${available === 1 ? 'skill' : 'skills'} available`; show(el, 'memory'); }
export function number(value) { return new Intl.NumberFormat('en').format(Math.round(value)); }
