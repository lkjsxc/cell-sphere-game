/** Semantic DOM surfaces. Dynamic text uses textContent, never innerHTML. */
import { cardById } from '../game/adaptations.js';

const CAUSE = Object.freeze({
  starvation: '栄養とエネルギーが尽きました。', heat: '熱の圧力が組織を崩しました。',
  cold: '冷えた世界で輸送が止まりました。', drought: '乾きが維持を上回りました。',
  toxin: '毒性の高まりが組織を傷つけました。', event: '危機がネットワークを分断しました。',
  collapse: '終末の圧力が最後の経路を閉じました。',
});

/** @returns {ReturnType<typeof elements>} */
export function elements() {
  const byId = (id) => /** @type {HTMLElement} */ (document.getElementById(id));
  return {
    title: byId('title-screen'), run: byId('run-screen'), result: byId('result-screen'),
    begin: /** @type {HTMLButtonElement} */ (byId('begin-button')),
    restart: /** @type {HTMLButtonElement} */ (byId('restart-button')),
    pause: /** @type {HTMLButtonElement} */ (byId('pause-button')),
    speed: /** @type {HTMLSelectElement} */ (byId('speed-select')),
    boot: byId('boot-status'), score: byId('hud-score'), pressure: byId('hud-pressure'),
    reach: byId('hud-reach'), signal: byId('hud-signal'), event: byId('hud-event-text'),
    dialog: /** @type {HTMLDialogElement} */ (byId('draft-dialog')),
    cards: byId('draft-cards'), resultRank: byId('result-rank'),
    resultScore: byId('result-score'), resultCause: byId('result-cause'),
    breakdown: byId('result-breakdown'), echoes: byId('result-echoes'),
    live: byId('live-region'),
  };
}

/** @param {ReturnType<typeof elements>} el @param {'title'|'run'|'result'} state */
export function show(el, state) {
  for (const [name, screen] of Object.entries({ title: el.title, run: el.run, result: el.result })) {
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
  el.resultCause.textContent = CAUSE[result.cause] ?? '最後の細胞が世界から消えました。';
  el.echoes.textContent = `この絶滅から ${score.echoes} Echoes を得ました。`;
  el.breakdown.replaceChildren(...score.breakdown.map((part) => breakdownRow(part)));
  show(el, 'result');
  el.restart.focus();
}

function adaptationCard(id, choose) {
  const card = cardById(id);
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'card';
  button.append(line('card-category', `◌ ${card.cats.join(' · ')}`), line('card-name', card.nameJa),
    line('card-effect', card.effectJa), line('card-cost', card.costJa));
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
