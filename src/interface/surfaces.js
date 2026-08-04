/** Core semantic surfaces. Dynamic text uses textContent, never innerHTML. */
import { getTrophy } from '../game/trophies/index.js';
import { createTimedPresentationQueue, PRESENTATION_DURATION } from './policies/presentation-timing.js';
const TOAST_QUEUES = new WeakMap();
const CAUSE = Object.freeze({
  'resource-exhaustion': 'The reachable reserves were consumed faster than they could renew.',
  'maintenance-starvation': 'Maintenance outpaced the energy remaining in reachable cells.',
  fragmentation: 'Separated living regions could no longer exchange enough energy.',
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
    title: byId('title-screen'), run: byId('run-screen'), memory: byId('memory-screen'), trophies: byId('trophy-screen'),
    begin: /** @type {HTMLButtonElement} */ (byId('begin-button')),
    restart: /** @type {HTMLButtonElement} */ (byId('restart-button')),
    pause: /** @type {HTMLButtonElement} */ (byId('pause-button')),
    speed: /** @type {HTMLSelectElement} */ (byId('speed-select')),
    boot: byId('boot-status'), score: byId('hud-score'), pressure: byId('hud-pressure'), reach: byId('hud-reach'), trace: byId('hud-trace'),
    scoreButton: byId('score-button'), entropyButton: byId('entropy-button'), reachButton: byId('reach-button'), resultReach: byId('result-reach-button'),
    event: byId('hud-event-text'), resultRank: byId('result-rank'), resultScore: byId('result-score'),
    resultCause: byId('result-cause'), breakdown: byId('result-breakdown'),
    echoes: byId('result-echoes'), resultImprint: byId('result-imprint'), resultTrophies: byId('result-trophies'), memoryBalance: byId('memory-balance'), trophyCount: byId('trophy-count'),
    trophyBadge: byId('trophy-tab-badge'), trophyLegacy: byId('trophy-legacy'),
    memoryAvailable: byId('memory-available'), countdown: byId('result-countdown'), resultFirstCycle: byId('result-first-cycle'),
    resultNext: /** @type {HTMLButtonElement} */ (byId('result-next-button')), resultControl: byId('result-control'),
    live: byId('live-region'), toast: byId('toast-root'), eventTime: byId('hud-event-time'), eventButton: byId('current-event-button'),
    resultHistory: byId('result-history-button'),
  };
}

export function show(el, scene) {
  for (const [name, screen] of Object.entries({ home: el.title, world: el.run, evolution: el.memory, trophies: el.trophies })) {
    screen.hidden = name !== scene;
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
}

export function resetWorldPresentation(el, snapshot = null) {
  updateHud(el, snapshot ?? { entropy: 0, status: 'starting', alive: { length: 2562 },
    metrics: { score: 0, coverage: 0, aliveCount: 0 }, reach: null });
  el.eventTime.textContent = '00:00 · STARTING'; el.event.textContent = 'Preparing a new world.'; el.eventButton.dataset.read = 'true';
  el.live.textContent = ''; el.resultRank.textContent = ''; el.resultScore.textContent = '0';
  el.resultCause.textContent = ''; el.echoes.textContent = ''; el.resultTrophies.textContent = '';
  el.resultImprint.textContent = ''; el.resultFirstCycle.textContent = ''; el.breakdown.replaceChildren();
  el.resultControl.hidden = true; el.pause.disabled = false; el.pause.classList.remove('is-complete');
  el.pause.setAttribute('aria-pressed', 'false'); el.pause.setAttribute('aria-label', 'Pause world time');
  el.speed.disabled = false; el.speed.setAttribute('aria-label', 'Game speed');
}

export function announce(el, text) { el.event.textContent = text; el.live.textContent = text; }
export function updateCurrentEvent(el, event, terminal = false) {
  if (!event) return;
  const seconds = Math.floor((event.tick ?? 0) / 10); const time = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const title = String(event.key ?? event.family ?? 'world update').split(/[.-]/).at(-1).replaceAll('_', ' ');
  el.eventTime.textContent = `${time} · ${terminal ? 'FINAL' : String(event.kind ?? 'WORLD').toUpperCase()}`;
  el.event.textContent = title.replace(/^./, (letter) => letter.toUpperCase()); el.eventButton.dataset.read = 'false';
}

export function toast(el, text, quiet = false) {
  if (quiet) return; let queue = TOAST_QUEUES.get(el.toast);
  if (!queue) { queue = createTimedPresentationQueue({ duration: PRESENTATION_DURATION.toast,
      onShow: (message) => { const node = document.createElement('div'); node.className = 'toast toast-enter'; node.textContent = message; el.toast.replaceChildren(node); },
      onIdle: () => el.toast.replaceChildren() }); TOAST_QUEUES.set(el.toast, queue); }
  queue.enqueue(text);
}

export function showResult(el, score, result) {
  el.resultRank.textContent = result.campaignResolvedNow ? `FIRST CYCLE RESOLVED · +${score.echoes} Echoes`
    : `${score.rank.en.split(' ')[0].toUpperCase()} · +${score.echoes} Echoes`;
  el.resultScore.textContent = number(score.total);
  el.resultCause.textContent = CAUSE[result.cause] ?? 'The final living cell released its remaining energy.';
  el.echoes.textContent = `${score.echoes} Echoes entered permanent memory.`;
  el.resultImprint.textContent = result.imprint?.edges?.length ? 'Imprint preserved · strongest morphology retained.' : '';
  const names = (result.trophyIds ?? []).map((id) => getTrophy(id)?.nameEn).filter(Boolean);
  el.resultTrophies.textContent = names.length ? `New Trophies · ${names.join(' · ')}` : 'No new Trophy this world.';
  el.resultFirstCycle.textContent = result.campaignResolvedNow ? 'First cycle milestone · five worlds observed.' : '';
  el.breakdown.replaceChildren(...score.breakdown.map((part) => {
    const row = document.createElement('p'); row.className = 'breakdown-row';
    row.textContent = `${part.en}  ${number(part.points)}`; return row;
  }));
  el.resultControl.hidden = false; el.pause.disabled = true; el.pause.classList.add('is-complete'); el.pause.setAttribute('aria-label', 'World time complete');
  el.speed.disabled = true; el.speed.setAttribute('aria-label', 'Game speed, next-world preference');
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
  el.memoryAvailable.textContent = `${available} ${available === 1 ? 'skill' : 'skills'} available`; }
export function showTrophies(el, meta) { const count = meta.trophyIds?.length ?? 0; el.trophyCount.textContent = `${count} / 96 earned`;
  const legacy = meta.legacyTrophyIds?.length ?? 0; if (el.trophyLegacy) { el.trophyLegacy.hidden = legacy === 0;
    el.trophyLegacy.textContent = legacy ? `Legacy · ${legacy} retired river-era Trophy preserved separately; it supplies no current lake proof.` : ''; } }
export function number(value) { return new Intl.NumberFormat('en').format(Math.round(value)); }
