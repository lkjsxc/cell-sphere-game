/** Stable shared projection and surface for SCORE, ENTROPY, and REACH. */
import { RANKS, rankFor } from '../../game/scoring.js';

const MAX_MILESTONES = 5;
export function createMetricSurface(options) {
  const surface = byId('metric-dialog'); const body = byId('metric-body');
  const buttons = [...document.querySelectorAll('[data-metric]')];
  const samples = []; const scroll = new Map(); let kind = null; let model = null;
  byId('metric-close').addEventListener('click', options.onClose);
  function sample(snapshot) {
    if (!snapshot || !Number.isFinite(snapshot.tick) || !Number.isFinite(snapshot.entropy)) return;
    if (samples.length && snapshot.tick < samples.at(-1).tick) samples.length = 0;
    if (!samples.length || snapshot.tick > samples.at(-1).tick) samples.push({ tick: snapshot.tick, entropy: snapshot.entropy });
    if (samples.length > 24) samples.splice(0, samples.length - 24);
  }
  function render() {
    if (!kind || !model) return; const top = body.scrollTop;
    const projection = metricProjection(kind, { ...model, entropyRate: entropyRate(samples) });
    byId('metric-eyebrow').textContent = projection.eyebrow; byId('metric-heading').textContent = projection.heading;
    byId('metric-primary').textContent = projection.primary; byId('metric-summary').textContent = projection.summary;
    byId('metric-direct-heading').textContent = projection.directHeading;
    byId('metric-conditions-heading').textContent = projection.conditionsHeading;
    byId('metric-counts').replaceChildren(...projection.counts.map(count));
    byId('metric-direct').replaceChildren(...projection.direct.map((item) => row(item, options.onSelect)));
    byId('metric-conditions').replaceChildren(...projection.conditions.map((item) => row(item, options.onSelect)));
    byId('metric-footer-text').textContent = projection.footer;
    requestAnimationFrame(() => { body.scrollTop = Math.min(top, Math.max(0, body.scrollHeight - body.clientHeight)); });
  }
  return {
    surface,
    open(nextKind, nextModel) { if (kind) scroll.set(kind, body.scrollTop); kind = nextKind; model = nextModel; sample(model.snapshot);
      buttons.forEach((button) => button.setAttribute('aria-expanded', String(button.dataset.metric === kind)));
      surface.hidden = false; render(); requestAnimationFrame(() => { body.scrollTop = scroll.get(kind) ?? 0; }); },
    update(nextModel) { model = nextModel; sample(model.snapshot); if (!surface.hidden) render(); },
    close() { if (kind) scroll.set(kind, body.scrollTop); buttons.forEach((button) => button.setAttribute('aria-expanded', 'false')); surface.hidden = true; },
    reset() { kind = null; model = null; samples.length = 0; scroll.clear(); this.close(); },
    get kind() { return kind; },
  };
}

export function metricProjection(kind, model) {
  if (kind === 'score') return scoreProjection(model);
  if (kind === 'entropy') return entropyProjection(model);
  return reachProjection(model);
}
function scoreProjection({ snapshot, result, score, history = [] }) {
  const final = Boolean(result && score); const projection = score ?? snapshot?.metrics?.scoreProjection;
  const total = projection?.total ?? snapshot?.metrics?.score ?? 0; const rank = projection?.rank ?? rankFor(total);
  const next = RANKS.find((item) => item.min > total); const remaining = next ? next.min - total : 0;
  const milestones = history.filter((event) => event.key?.includes('milestone') || event.key?.startsWith('run.phase.')).slice(-MAX_MILESTONES);
  const direct = (projection?.breakdown ?? []).map((part) => ({
    label: `${part.en} · ${Math.round((part.q ?? 0) * 100)}% axis${part.weight != null ? ` · ${Math.round(part.weight * 100)}% weight` : ''}`,
    value: number(part.points ?? 0),
  }));
  const conditions = [
    { label: final ? 'Final authority' : 'Live projection', value: final ? 'Final' : 'Updating' },
    { label: 'Run Quality', value: `${Math.round((projection?.quality ?? 0) * 100)}%` },
    { label: 'World Potential', value: number(projection?.worldPotential ?? result?.worldPotential ?? 0) },
    { label: 'Challenge multiplier', value: `${(projection?.mult ?? 1).toFixed(2)}×` },
    { label: 'SCORE model', value: `v${projection?.modelVersion ?? result?.scoreModelVersion ?? 2}` },
    ...milestones.map((event) => ({ label: eventTitle(event), value: gameTime(event.tick) })),
  ];
  return { eyebrow: final ? 'FINAL SCORE' : 'LIVE SCORE PROJECTION', heading: 'SCORE', primary: number(total),
    summary: final ? 'The final deterministic point model for this world.' : 'A live projection from the same deterministic model used at extinction.',
    counts: [{ label: 'Rank', value: rank.en }, { label: 'Next rank', value: next?.en ?? 'Highest' },
      { label: 'Run Quality', value: `${Math.round((projection?.quality ?? 0) * 100)}%` }],
    directHeading: 'Axes and contributions', direct: nonempty(direct, 'No score contribution yet.'),
    conditionsHeading: 'Model and real milestones', conditions,
    footer: 'SCORE = Run Quality × permanent World Potential × explicit Challenge. Speed, camera, quality, and frame rate have no effect.',
  };
}
function entropyProjection({ snapshot, result, entropyRate = null, history = [] }) {
  const entropy = snapshot?.entropy ?? 0; const active = snapshot?.events ?? [];
  const phaseEvent = [...history].reverse().find((event) => event.key?.startsWith('run.phase.'));
  const phase = result ? 'Complete' : phaseEvent ? eventTitle(phaseEvent) : humanize(snapshot?.status ?? 'opening');
  const reachLimits = snapshot?.reach?.negativeConditions ?? [];
  const direct = active.map((event) => ({ label: `${humanize(event.family)} event`, value: `${Math.round((event.intensity ?? 0) * 100)}%`, cells: [event.center] }));
  const conditions = reachLimits.map((item) => ({ label: humanize(item.label), value: `${Math.round(item.score * 100)}%` }));
  return { eyebrow: result ? 'TERMINAL WORLD PRESSURE' : 'LIVE WORLD PRESSURE', heading: 'ENTROPY', primary: `${Math.round(entropy * 100)}%`,
    summary: result ? 'Terminal context from the final preserved world snapshot.' : 'Global collapse pressure, derived from authoritative snapshots and active events.',
    counts: [{ label: 'Era', value: `World ${snapshot?.worldOrdinal ?? result?.worldOrdinal ?? 1}` }, { label: 'Recent rate', value: entropyRate == null ? 'Gathering' : `${entropyRate > 0 ? '+' : ''}${entropyRate} pp / 10s` },
      { label: 'Active events', value: String(active.length) }],
    directHeading: 'Active event contribution', direct: nonempty(direct, 'No active event contribution.'),
    conditionsHeading: 'Global effects and seasonal context', conditions: nonempty(conditions, result ? 'World pressure reached its terminal context.' : 'No strong limiting condition.'),
    footer: `Era ${snapshot?.worldEra ?? result?.worldEra ?? 1} · finite local reserves are separate from global Entropy · tick ${snapshot?.tick ?? result?.tick ?? 0}.`,
  };
}
function reachProjection({ snapshot, result }) {
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
function entropyRate(samples) { if (samples.length < 2) return null; const last = samples.at(-1); const first = [...samples].reverse().find((item) => last.tick - item.tick >= 20) ?? samples[0];
  const seconds = (last.tick - first.tick) / 10; if (seconds <= 0) return null; return Math.round(((last.entropy - first.entropy) * 100 / seconds) * 10); }
function count(item) { const node = document.createElement('div'); node.className = 'metric-count'; node.append(line('span', item.label), line('strong', item.value)); return node; }
function row(item, onSelect) { const node = document.createElement(item.cells?.length ? 'button' : 'div'); node.className = 'metric-row';
  if (item.cells?.length) { node.type = 'button'; node.addEventListener('click', () => onSelect(item.cells)); }
  node.append(line('span', item.label), line('strong', item.value)); return node; }
function nonempty(items, message) { return items.length ? items : [{ label: message, value: '—' }]; }
function line(tag, text) { const node = document.createElement(tag); node.textContent = text; return node; }
function eventTitle(event) { return humanize(event.key?.replace(/^run\./, '') ?? 'milestone'); }
function humanize(value) { return String(value).replaceAll(/[._-]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function gameTime(tick = 0) { const seconds = Math.floor(tick / 10); return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }
function number(value) { return new Intl.NumberFormat('en').format(Math.round(value)); }
function signed(value) { return `${value > 0 ? '+' : ''}${value ?? 0}`; }
function byId(id) { return document.getElementById(id); }
