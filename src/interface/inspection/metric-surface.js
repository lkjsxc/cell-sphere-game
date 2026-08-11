/** Stable shared projection and surface for World metrics. */
import { rankFor } from '../../game/scoring.js';
import { formatProgressionEngineering, normalizeProgressionInteger, subtractProgressionIntegers } from '../../core/progression-integer.js';

const MAX_MILESTONES = 5;
const ENVIRONMENT_DIMENSIONS = Object.freeze([
  Object.freeze({ key: 'scarcity', label: 'Resources' }),
  Object.freeze({ key: 'renewal', label: 'Moisture and renewal' }),
  Object.freeze({ key: 'climate', label: 'Climate' }),
  Object.freeze({ key: 'toxicity', label: 'Toxicity' }),
  Object.freeze({ key: 'maintenance', label: 'Maintenance' }),
]);
export function createMetricSurface(options) {
  const surface = byId('metric-dialog'); const body = byId('metric-body');
  const buttons = [...document.querySelectorAll('[data-metric]')];
  const scroll = new Map(); let kind = null; let model = null; let environmentRender = null;
  byId('metric-close').addEventListener('click', options.onClose);
  function render() {
    if (!kind || !model) return; const top = body.scrollTop;
    const projection = metricProjection(kind, model);
    byId('metric-eyebrow').textContent = projection.eyebrow; byId('metric-heading').textContent = projection.heading;
    byId('metric-primary').textContent = projection.primary;
    byId('metric-primary').setAttribute('aria-label', projection.primaryAccessible ?? projection.primary);
    byId('metric-summary').textContent = projection.summary;
    byId('metric-direct-heading').textContent = projection.directHeading;
    byId('metric-conditions-heading').textContent = projection.conditionsHeading;
    byId('metric-counts').replaceChildren(...projection.counts.map(count));
    byId('metric-direct').replaceChildren(...projection.direct.map((item) => row(item, options.onSelect)));
    byId('metric-conditions').replaceChildren(...projection.conditions.map((item) => row(item, options.onSelect)));
    byId('metric-footer-text').textContent = projection.footer;
    if (kind === 'environment') environmentRender = environmentStamp(model);
    requestAnimationFrame(() => { body.scrollTop = Math.min(top, Math.max(0, body.scrollHeight - body.clientHeight)); });
  }
  return {
    surface,
    open(nextKind, nextModel) { if (kind) scroll.set(kind, body.scrollTop); kind = nextKind; model = nextModel;
      buttons.forEach((button) => button.setAttribute('aria-expanded', String(button.dataset.metric === kind)));
      surface.hidden = false; render(); requestAnimationFrame(() => { body.scrollTop = scroll.get(kind) ?? 0; }); },
    update(nextModel) { model = nextModel;
      if (!surface.hidden && (kind !== 'environment' || environmentUpdateDue(environmentRender, nextModel))) render(); },
    close() { if (kind) scroll.set(kind, body.scrollTop); buttons.forEach((button) => button.setAttribute('aria-expanded', 'false')); surface.hidden = true; },
    reset() { kind = null; model = null; environmentRender = null; scroll.clear(); this.close(); },
    get kind() { return kind; },
  };
}

export function metricProjection(kind, model = {}) {
  if (kind === 'score') return scoreProjection(model);
  if (kind === 'environment') return environmentProjection(model);
  return reachProjection(model);
}
function scoreProjection({ snapshot, result, score, history = [] }) {
  const final = Boolean(result && score); const projection = score ?? snapshot?.metrics?.scoreProjection;
  const total = canonical(projection?.total ?? snapshot?.metrics?.score ?? '0'); const rank = projection?.rank ?? rankFor(total);
  const next = projection?.nextRank ?? null;
  const milestones = history.filter((event) => event.key?.includes('milestone') || event.key?.startsWith('run.phase.')).slice(-MAX_MILESTONES);
  const direct = (projection?.breakdown ?? []).map((part) => ({
    label: `${part.en} · ${Math.round((part.q ?? 0) * 100)}% axis${part.weight != null ? ` · ${Math.round(part.weight * 100)}% weight` : ''}`,
    value: number(part.points ?? 0),
  }));
  const conditions = [
    { label: final ? 'Final authority' : 'Live projection', value: final ? 'Final' : 'Updating' },
    { label: 'Run Quality', value: `${Math.round((projection?.quality ?? 0) * 100)}%` },
    { label: 'Environment credit', value: `${Math.round((projection?.environmentCredit?.bonus ?? 0) * 100)}% · exposure gated` },
    { label: 'SCORE model', value: `v${projection?.modelVersion ?? result?.scoreModelVersion ?? 2}` },
    ...milestones.map((event) => ({ label: eventTitle(event), value: gameTime(event.tick) })),
  ];
  return { eyebrow: final ? 'FINAL SCORE' : 'LIVE SCORE PROJECTION', heading: 'SCORE', primary: number(total), primaryAccessible: `SCORE ${total}`,
    summary: final ? 'The final deterministic point model for this world.' : 'A live projection from the same deterministic model used at extinction.',
    counts: [{ label: 'Rank', value: rank.en }, { label: 'Next rank', value: next?.en ?? 'Highest' },
      { label: 'Run Quality', value: `${Math.round((projection?.quality ?? 0) * 100)}%` }],
    directHeading: 'Axes and contributions', direct: nonempty(direct, 'No score contribution yet.'),
    conditionsHeading: 'Model and real milestones', conditions,
    footer: 'SCORE comes only from realized ecological outcomes and bounded Environment-pressure evidence. Speed, camera, quality, and frame rate have no effect.',
  };
}
function environmentProjection({ snapshot, result } = {}) {
  const live = object(snapshot); const terminal = object(result); const final = Boolean(result && typeof result === 'object');
  const source = final ? terminal : live;
  const level = canonical(source.currentEnvironmentLevel ?? source.finalEnvironmentLevel ?? live.currentEnvironmentLevel ?? '0');
  const peak = canonical(source.peakEnvironmentLevel ?? live.peakEnvironmentLevel ?? level);
  const startTick = canonical(source.environmentLevelStartTick ?? live.environmentLevelStartTick ?? '0');
  const tick = canonical(source.tick ?? live.tick ?? startTick);
  const nextTick = canonical(source.nextEnvironmentLevelTick ?? live.nextEnvironmentLevelTick ?? tick);
  const progressQ = clampQ(live.environmentLevelProgressQ ?? source.environmentLevelProgressQ);
  const remainingTicks = final ? null : remaining(nextTick, tick);
  const pressure = object(source.environmentPressureSummary ?? live.environmentPressureSummary);
  const dimensions = ENVIRONMENT_DIMENSIONS.map(({ key, label }) => {
    const value = object(pressure.dimensions)[key];
    const amount = finite(value?.pressure);
    return { key, label, amount, value: pressureLabel(amount) };
  });
  const strongest = dimensions.reduce((best, dimension) => dimension.amount > best.amount ? dimension : best,
    { key: null, label: 'Baseline ecology', amount: 0, value: 'Baseline' });
  const remainingText = remainingTicks == null ? 'World complete' : gameTime(remainingTicks);
  const timing = final
    ? [
      { label: 'Final level', value: `Level ${number(level)}` },
      { label: 'Peak level', value: `Level ${number(peak)}` },
      { label: 'Time at peak', value: gameTime(source.timeAtPeakTicks ?? source.environmentExposure?.timeAtPeakTicks ?? '0') },
    ]
    : [
      { label: 'Progress to next level', value: `${Math.floor(progressQ / 10_000)}%` },
      { label: 'Game time remaining', value: remainingText },
      { label: 'This level began', value: gameTime(startTick) },
      { label: 'Next transition', value: gameTime(nextTick) },
    ];
  const dominant = strongest.amount > 0 ? strongest.label : 'baseline resources and maintenance';
  const summary = final
    ? `This world ended at Environment Level ${number(level)}. Its peak was Level ${number(peak)}.`
    : level === '0'
      ? 'Finite resources and baseline maintenance already matter. Chronic Environment pressure begins at Level 1.'
      : `${strongest.label} is currently the strongest chronic pressure. The next rise arrives in ${remainingText}.`;
  return {
    eyebrow: final ? 'FINAL ENVIRONMENT' : 'CURRENT ENVIRONMENT',
    heading: 'ENVIRONMENT LEVEL',
    primary: number(level),
    primaryAccessible: `Environment Level ${level}`,
    summary,
    counts: final
      ? [{ label: 'Final', value: `Level ${number(level)}` }, { label: 'Peak', value: `Level ${number(peak)}` }, { label: 'Pressure', value: pressureLabel(finite(pressure.pressure)) }]
      : [{ label: 'Current', value: `Level ${number(level)}` }, { label: 'Next', value: remainingText }, { label: 'Progress', value: `${Math.floor(progressQ / 10_000)}%` }],
    directHeading: 'Current chronic pressure',
    direct: dimensions.map((dimension) => ({ label: dimension.label, value: dimension.value })),
    conditionsHeading: final ? 'Final context' : 'Level timing',
    conditions: [{ label: 'Strongest current pressure', value: dominant }, ...timing],
    footer: 'Every World starts at Environment Level 0. Evolution can help life endure pressure, but never carries this clock into a new World.',
  };
}
function reachProjection({ snapshot, result } = {}) {
  const reach = result?.reach ?? snapshot?.reach ?? {}; const final = Boolean(result); const living = final ? result.finalLivingCount ?? 0 : reach.current ?? snapshot?.metrics?.aliveCount ?? 0;
  const coverage = final ? result.coverage ?? 0 : snapshot?.metrics?.coverage ?? 0; const gained = reach.gained ?? 0; const lost = reach.lost ?? 0; const net = reach.net ?? gained - lost;
  const direct = [...(reach.positive ?? []).map((item) => ({ label: `Gain · ${item.label}`, value: `+${item.count}`, cells: item.samples })),
    ...(reach.negative ?? []).map((item) => ({ label: `Loss · ${item.label}`, value: `−${item.count}`, cells: item.samples }))];
  const conditions = [...(reach.positiveConditions ?? []).map((item) => ({ label: `Support · ${item.label}`, value: `${Math.round(item.score * 100)}%` })),
    ...(reach.negativeConditions ?? []).map((item) => ({ label: `Limit · ${item.label}`, value: `${Math.round(item.score * 100)}%` }))];
  if (final && reach.turningPoint) conditions.push({ label: `Strongest turning point · ${gameTime(reach.turningPoint.second * 10)}`, value: signed(reach.turningPoint.net) });
  return { eyebrow: final ? 'FINAL REACH LEDGER' : 'LIVE REACH LEDGER', heading: 'REACH', primary: `${Math.round(coverage * 100)}%`,
    summary: final ? `Full run · ${gained} whole cells gained and ${lost} lost.` : `${living} cells living · ${reach.windowSeconds ?? 15}-second authoritative transition window.`,
    counts: [{ label: 'Gains', value: `+${gained}` }, { label: 'Losses', value: `−${lost}` }, { label: 'Net', value: signed(net) }],
    directHeading: 'Direct gains and losses', direct: nonempty(direct, 'No direct transitions in this interval.'),
    conditionsHeading: final ? 'Turning point' : 'Supports and limits', conditions: nonempty(conditions, 'No supporting or limiting condition recorded.'),
    footer: 'Cell transitions come from the bounded authoritative Reach ledger; selectable rows highlight real samples.',
  };
}
function count(item) { const node = document.createElement('div'); node.className = 'metric-count'; node.append(line('span', item.label), line('strong', item.value)); return node; }
function row(item, onSelect) { const node = document.createElement(item.cells?.length ? 'button' : 'div'); node.className = 'metric-row';
  if (item.cells?.length) { node.type = 'button'; node.addEventListener('click', () => onSelect(item.cells)); }
  node.append(line('span', item.label), line('strong', item.value)); return node; }
function nonempty(items, message) { return items.length ? items : [{ label: message, value: '—' }]; }
function line(tag, text) { const node = document.createElement(tag); node.textContent = text; return node; }
function eventTitle(event) { return humanize(event.key?.replace(/^run\./, '') ?? 'milestone'); }
function humanize(value) { return String(value).replaceAll(/[._-]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function gameTime(tick = 0) {
  const exact = canonical(tick);
  if (exact.length > 12) return `${formatProgressionEngineering(exact, 4)} ticks`;
  const seconds = Math.floor(Number(exact) / 10);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}
function remaining(nextTick, tick) {
  try { return subtractProgressionIntegers(canonical(nextTick), canonical(tick)); } catch { return '0'; }
}
function environmentStamp(model) {
  const terminal = object(model?.result); const live = object(model?.snapshot); const source = model?.result && typeof model.result === 'object' ? terminal : live;
  return { tick: canonical(source.tick ?? live.tick ?? '0'), level: canonical(source.currentEnvironmentLevel ?? source.finalEnvironmentLevel ?? live.currentEnvironmentLevel ?? '0'), final: Boolean(model?.result && typeof model.result === 'object') };
}
function environmentUpdateDue(previous, model) {
  const next = environmentStamp(model);
  if (!previous || previous.level !== next.level || previous.final !== next.final) return true;
  const elapsed = remaining(next.tick, previous.tick);
  return elapsed.length > 2 || Number(elapsed) >= 10;
}
function pressureLabel(value) {
  if (!(value > 0)) return 'Baseline';
  if (value < .2) return 'Mild';
  if (value < .5) return 'Rising';
  if (value < .8) return 'Strong';
  return 'Severe';
}
function clampQ(value) { return Math.max(0, Math.min(1_000_000, Math.floor(Number.isFinite(value) ? value : 0))); }
function finite(value) { return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)); }
function object(value) { return value && typeof value === 'object' ? value : {}; }
function canonical(value) { return normalizeProgressionInteger(value, '0'); }
function number(value) { const exact = canonical(value);
  return exact.length <= 15 ? exact.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : formatProgressionEngineering(exact, 6); }
function signed(value) { return `${value > 0 ? '+' : ''}${value ?? 0}`; }
function byId(id) { return document.getElementById(id); }
