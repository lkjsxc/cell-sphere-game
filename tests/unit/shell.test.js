/** Unified shell semantics and pure metric projections. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { metricProjection } from '../../src/interface/inspection/metric-surface.js';

test('one selector, context shell, compact dock, and ordered terminal metrics are semantic', () => {
  const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
  assert.deepEqual([...html.matchAll(/role="tab"[^>]*data-scene="([^"]+)"/g)].map((match) => match[1]),
    ['home', 'world', 'evolution', 'trophies']);
  assert.equal((html.match(/id="context-shell"/g) ?? []).length, 1);
  for (const [id, label] of [['score-button', 'SCORE'], ['reach-button', 'REACH'], ['environment-level-button', 'ENV LEVEL']]) {
    assert.match(html, new RegExp(`id="${id}"[\\s\\S]{0,260}>${label}<`));
  }
  const ordered = ['score-button', 'reach-button', 'environment-level-button', 'result-control'].map((id) => html.indexOf(`id="${id}"`));
  assert.ok(ordered.every((offset, index) => offset > (ordered[index - 1] ?? -1)));
  assert.match(html, /id="environment-level-button"[^>]*data-surface-trigger="history"[^>]*aria-controls="history-dialog"/);
  assert.equal(html.includes('entropy-button'), false); assert.equal(html.includes('hud-pressure'), false);
  assert.match(html, /id="result-control"[^>]*aria-expanded="false"[^>]*hidden/);
  for (const retired of ['result-score-button', 'result-entropy-button', 'result-reach-button', 'result-summaries'])
    assert.equal(html.includes(retired), false);
  assert.doesNotMatch(html, /class="metric-summary"/);
  const resultActions = ['result-next-button', 'result-evolution-button', 'result-history-button'].map((id) => html.indexOf(`id="${id}"`));
  assert.ok(resultActions.every((offset, index) => offset > (resultActions[index - 1] ?? -1)));
  for (const retired of ['evolution-focus-available', 'trophy-focus']) assert.equal(html.includes(retired), false);
  const memoryActions = html.match(/<div class="memory-actions">[\s\S]*?<\/div>/)?.[0] ?? '';
  const trophyActions = html.match(/<div class="trophy-actions">[\s\S]*?<\/div>/)?.[0] ?? '';
  for (const actions of [memoryActions, trophyActions]) { assert.match(actions, /Next World/); assert.match(actions, /Menu/); assert.doesNotMatch(actions, /Focus|History/); }
  const speedOptions = [...html.matchAll(/id="speed-select"[\s\S]*?<\/select>/g)][0]?.[0] ?? '';
  assert.deepEqual([...speedOptions.matchAll(/option value="(\d+)"/g)].map((match) => Number(match[1])), [1, 2, 4, 8]);
  const rail = html.match(/<div class="command-rail[\s\S]*?<\/div>\s*<\/div>\s*<\/section>/)?.[0] ?? '';
  assert.match(rail, /pause-button/); assert.match(rail, /speed-select/); assert.match(rail, /menu-button/);
  assert.doesNotMatch(rail, /adaptation|card|offer/i);
  for (const absent of ['new-world-button', 'settings-open', 'history-open']) assert.equal(rail.includes(absent), false);
});

test('metric projections use actual score and Reach ledger values', () => {
  const score = { total: 120000, rank: { en: 'Cartographer' }, quality: .75, worldPotential: 160000, modelVersion: 2, mult: 1, breakdown: [
    { en: 'Reach', q: .5, weight: .2, points: 10000 },
  ] };
  const scoreView = metricProjection('score', { score, result: {}, history: [] });
  assert.equal(scoreView.primary, '120,000'); assert.equal(scoreView.counts[0].value, 'Cartographer');
  assert.match(scoreView.direct[0].label, /50% axis · 20% weight/);
  const reach = metricProjection('reach', { snapshot: { metrics: { coverage: .125 }, reach: { current: 12, windowSeconds: 15,
    gained: 7, lost: 4, net: 3, positive: [{ label: 'regrowth', count: 7, samples: [2, 3] }], negative: [], positiveConditions: [], negativeConditions: [] } } });
  assert.equal(reach.primary, '13%'); assert.deepEqual(reach.counts.map((item) => item.value), ['+7', '−4', '+3']);
  assert.deepEqual(reach.direct[0].cells, [2, 3]);
});

test('History, visible metric affordances, restrained Result, and compact dock keep bounded geometry', () => {
  const css = readFileSync(new URL('../../styles/shell.css', import.meta.url), 'utf8');
  assert.match(css, /\.context-result \{ grid-template-rows: auto minmax\(0, 1fr\) auto; \}/);
  assert.match(css, /\.context-history \{ grid-template-rows: auto minmax\(0, 1fr\); \}/);
  assert.doesNotMatch(css, /adaptation|card-row/i);
  const components = readFileSync(new URL('../../styles/components.css', import.meta.url), 'utf8');
  assert.match(components, /\.metric-button \{[^}]*cursor: pointer[^}]*border: 1px solid/s);
  assert.match(components, /\.metric-button::after/); assert.match(components, /\.metric-button:active/);
  const resultRule = components.match(/\.result-control \{([\s\S]*?)\n\}/)?.[1] ?? '';
  assert.match(resultRule, /min-height: var\(--touch-min\)/); assert.match(resultRule, /background: rgba/);
  assert.doesNotMatch(resultRule, /linear-gradient|\.45rem 1\.8rem/);
  const atlas = readFileSync(new URL('../../styles/atlas.css', import.meta.url), 'utf8');
  assert.match(atlas, /\.clock-hour \{ width: 1\.5px;/);
  assert.match(css, /\.hud-metrics:has\(#result-control:not\(\[hidden\]\)\)[^}]*grid-template-columns: repeat\(2/s);
  const controller = readFileSync(new URL('../../src/interface/app-controller.js', import.meta.url), 'utf8');
  assert.match(controller, /openEnvironmentHistory\(\)/); assert.match(controller, /resultEvolution\.addEventListener/);
  assert.match(controller, /replaceRenderCanvas\(\)/); assert.match(controller, /retired\.replaceWith\(replacement\)/);
  assert.match(controller, /storage could not save that acknowledgement/);
});

test('History is the only temporal surface', () => {
  const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
  assert.match(html, /<section class="history-timeline"/);
  for (const retired of ['Event Log', 'event-log-dialog', 'current-event-button', 'history-event-log', 'menu-event-log'])
    assert.equal(html.includes(retired), false, retired);
  const interfaceDir = new URL('../../src/interface/', import.meta.url);
  assert.equal(readdirSync(new URL('inspection/', interfaceDir)).includes('event-log-surface.js'), false);
});
