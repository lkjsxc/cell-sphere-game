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
    assert.match(html, new RegExp(`id="${id}"[\\s\\S]{0,520}>${label}<`));
  }
  const ordered = ['score-button', 'reach-button', 'environment-level-button', 'result-control'].map((id) => html.indexOf(`id="${id}"`));
  assert.ok(ordered.every((offset, index) => offset > (ordered[index - 1] ?? -1)));
  assert.match(html, /id="environment-level-button"[^>]*data-metric="environment"[^>]*data-surface-trigger="metric"[^>]*aria-controls="metric-dialog"/);
  assert.equal(html.includes('entropy-button'), false); assert.equal(html.includes('hud-pressure'), false);
  assert.match(html, /id="result-control"[^>]*aria-expanded="false"[^>]*hidden/);
  for (const retired of ['result-score-button', 'result-entropy-button', 'result-reach-button', 'result-summaries'])
    assert.equal(html.includes(retired), false);
  assert.doesNotMatch(html, /class="metric-summary"/);
  const resultActions = ['result-next-button', 'result-evolution-button', 'result-history-button'].map((id) => html.indexOf(`id="${id}"`));
  assert.ok(resultActions.every((offset, index) => offset > (resultActions[index - 1] ?? -1)));
  assert.ok(html.indexOf('id="result-countdown"') > html.indexOf('<footer class="surface-actions result-actions">'));
  assert.doesNotMatch(html, /id="result-countdown"[^>]*role="status"/);
  for (const retired of ['evolution-focus-available', 'trophy-focus', 'menu-home', 'menu-evolution', 'menu-trophies', 'menu-result', 'settings-speed', 'camera-reset', 'settings-version'])
    assert.equal(html.includes(`id="${retired}"`), false, retired);
  for (const retiredName of ['historyRetention', 'pauseOnPanels', 'cameraInertia', 'idleRotation']) assert.equal(html.includes(`name="${retiredName}"`), false, retiredName);
  assert.equal(html.includes('option value="luminous"'), false); assert.match(html, /<details class="data-reset">/);
  const memoryActions = html.match(/<div class="memory-actions">[\s\S]*?<\/div>/)?.[0] ?? '';
  const trophyActions = html.match(/<div class="trophy-actions">[\s\S]*?<\/div>/)?.[0] ?? '';
  for (const actions of [memoryActions, trophyActions]) { assert.match(actions, /Next World/); assert.match(actions, /Menu/); assert.doesNotMatch(actions, /Focus|History/); }
  const speedOptions = [...html.matchAll(/id="speed-select"[\s\S]*?<\/select>/g)][0]?.[0] ?? '';
  assert.deepEqual([...speedOptions.matchAll(/option value="([\d.]+)"/g)].map((match) => Number(match[1])), [.5, 1, 2]);
  const rail = html.match(/<div class="command-rail[\s\S]*?<\/div>\s*<\/div>\s*<\/section>/)?.[0] ?? '';
  assert.match(rail, /pause-button/); assert.match(rail, /speed-select/); assert.match(rail, /menu-button/);
  assert.doesNotMatch(rail, /adaptation|card|offer/i);
  for (const absent of ['new-world-button', 'settings-open', 'history-open']) assert.equal(rail.includes(absent), false);
});

test('metric projections use actual score and Reach ledger values', () => {
  const score = { total: 120000, rank: { en: 'Cartographer' }, quality: .75, modelVersion: 6, mult: 1, breakdown: [
    { en: 'Reach', q: .5, weight: .2, points: 10000 },
  ] };
  const scoreView = metricProjection('score', { score, result: {}, history: [] });
  assert.equal(scoreView.primary, '120,000'); assert.equal(scoreView.primaryAccessible, 'SCORE 120000'); assert.equal(scoreView.counts[0].value, 'Cartographer');
  const hugeScore = `9${'0'.repeat(30)}`; const hugeScoreView = metricProjection('score', { snapshot: { metrics: { score: hugeScore } } });
  assert.match(hugeScoreView.primary, /e\+/); assert.equal(hugeScoreView.primaryAccessible, `SCORE ${hugeScore}`);
  assert.match(scoreView.direct[0].label, /50% axis · 20% weight/);
  const reach = metricProjection('reach', { snapshot: { metrics: { coverage: .125 }, reach: { current: 12, windowSeconds: 15,
    gained: 7, lost: 4, net: 3, positive: [{ label: 'regrowth', count: 7, samples: [2, 3] }], negative: [], positiveConditions: [], negativeConditions: [] } } });
  assert.equal(reach.primary, '13%'); assert.deepEqual(reach.counts.map((item) => item.value), ['+7', '−4', '+3']);
  assert.deepEqual(reach.direct[0].cells, [2, 3]);
});

test('Environment metric projection is current-state detail with bounded compact time', () => {
  const atZero = metricProjection('environment', { snapshot: {
    tick: '0', currentEnvironmentLevel: '0', peakEnvironmentLevel: '0', environmentLevelStartTick: '0', nextEnvironmentLevelTick: '1200', environmentLevelProgressQ: 0,
    environmentPressureSummary: { pressure: 0, dimensions: {} },
  } });
  assert.equal(atZero.primary, '0'); assert.match(atZero.summary, /Finite resources/);
  assert.equal(atZero.conditions.find((item) => item.label === 'Game time remaining').value, '02:00');
  const beforeOne = metricProjection('environment', { snapshot: {
    tick: '1199', currentEnvironmentLevel: '0', peakEnvironmentLevel: '0', environmentLevelStartTick: '0', nextEnvironmentLevelTick: '1200', environmentLevelProgressQ: 999_166,
    environmentPressureSummary: { pressure: 0, dimensions: {} },
  } });
  assert.equal(beforeOne.counts.find((item) => item.label === 'Progress').value, '99%');
  const atOne = metricProjection('environment', { snapshot: {
    tick: '1200', currentEnvironmentLevel: '1', peakEnvironmentLevel: '1', environmentLevelStartTick: '1200', nextEnvironmentLevelTick: '1800', environmentLevelProgressQ: 0,
    environmentPressureSummary: { pressure: .42, dimensions: {
      scarcity: { pressure: .1 }, renewal: { pressure: .35 }, climate: { pressure: .42 }, toxicity: { pressure: 0 }, maintenance: { pressure: .2 },
    } },
  } });
  assert.equal(atOne.primary, '1'); assert.equal(atOne.conditions[0].value, 'Climate');
  assert.equal(atOne.direct.find((item) => item.label === 'Climate').value, 'Rising');
  const multiDigit = metricProjection('environment', { snapshot: {
    tick: '7800', currentEnvironmentLevel: '12', peakEnvironmentLevel: '12', environmentLevelStartTick: '7800', nextEnvironmentLevelTick: '8400', environmentLevelProgressQ: 0,
    environmentPressureSummary: { pressure: .8, dimensions: { maintenance: { pressure: .8 } } },
  } });
  assert.equal(multiDigit.primary, '12'); assert.equal(multiDigit.conditions[0].value, 'Maintenance');
  const terminal = metricProjection('environment', { result: {
    tick: '8000', finalEnvironmentLevel: '12', peakEnvironmentLevel: '13', environmentLevelStartTick: '7800', nextEnvironmentLevelTick: '8400',
    timeAtPeakTicks: '900', environmentPressureSummary: { pressure: .8, dimensions: { maintenance: { pressure: .8 } } },
  } });
  assert.equal(terminal.eyebrow, 'FINAL ENVIRONMENT'); assert.equal(terminal.counts[1].value, 'Level 13');
  assert.equal(terminal.conditions.find((item) => item.label === 'Time at peak').value, '01:30');
  const huge = `1${'0'.repeat(40)}`;
  const hugeProjection = metricProjection('environment', { snapshot: { currentEnvironmentLevel: huge, tick: huge, environmentLevelStartTick: huge, nextEnvironmentLevelTick: huge,
    environmentPressureSummary: null } });
  assert.match(hugeProjection.primary, /e\+\d+/); assert.equal(hugeProjection.primaryAccessible, `Environment Level ${huge}`);
  assert.doesNotThrow(() => metricProjection('environment', { snapshot: { currentEnvironmentLevel: {}, environmentPressureSummary: { dimensions: null } } }));
});

test('History, visible metric affordances, restrained Result, and compact dock keep bounded geometry', () => {
  const css = readFileSync(new URL('../../styles/shell.css', import.meta.url), 'utf8');
  assert.match(css, /\.context-result \{ grid-template-rows: auto minmax\(0, 1fr\) auto; \}/);
  assert.match(css, /\.context-history \{ grid-template-rows: auto auto minmax\(0, 1fr\); \}/);
  assert.match(css, /\.context-history \.history-controls/);
  assert.doesNotMatch(css, /adaptation|card-row/i);
  const components = readFileSync(new URL('../../styles/components.css', import.meta.url), 'utf8');
  assert.match(components, /\.metric-button \{[^}]*cursor: pointer[^}]*border: 1px solid/s);
  assert.match(components, /\.metric-button::after/); assert.match(components, /\.metric-button:active/);
  const resultRule = components.match(/\.result-control \{([\s\S]*?)\n\}/)?.[1] ?? '';
  assert.match(resultRule, /min-height: var\(--touch-min\)/); assert.match(resultRule, /background: rgba/);
  assert.doesNotMatch(resultRule, /linear-gradient|\.45rem 1\.8rem/);
  const atlas = readFileSync(new URL('../../styles/atlas.css', import.meta.url), 'utf8');
  assert.match(atlas, /\.clock-hour \{ width: 1\.5px;/);
  assert.doesNotMatch(atlas, /\.history-timeline \{[^}]*overflow: auto/s);
  assert.match(atlas, /\.history-event-btn\.is-selected/);
  assert.match(css, /\.hud-metrics:has\(#result-control:not\(\[hidden\]\)\)[^}]*grid-template-columns: repeat\(2/s);
  assert.match(css, /\.result-actions \{[\s\S]*?display: grid;/); assert.match(css, /\.result-countdown \{/);
  const layout = readFileSync(new URL('../../styles/layout.css', import.meta.url), 'utf8');
  assert.match(layout, /\.hud-metrics \{\s+  display: grid;\s+  grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/);
  const controller = readFileSync(new URL('../../src/interface/app-controller.js', import.meta.url), 'utf8');
  assert.doesNotMatch(controller, /openEnvironmentHistory\(/);
  assert.match(controller, /environmentButton\.addEventListener\('click', \(\) => this\.openMetric\('environment'\)\)/);
  assert.match(controller, /kind === 'environment' \? \['starting', 'running', 'result'\]/);
  assert.match(controller, /resultEvolution\.addEventListener/);
  assert.match(controller, /replaceRenderCanvas\(\)/); assert.match(controller, /retired\.replaceWith\(replacement\)/);
  assert.match(controller, /storage could not save that acknowledgement/); assert.match(controller, /Next World will begin automatically unless you interact/);
  const menu = readFileSync(new URL('../../src/interface/settings-surface.js', import.meta.url), 'utf8');
  assert.match(menu, /menu-history'\)\.hidden = context\.phase !== 'running'/);
});

test('History is the only temporal surface', () => {
  const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
  assert.match(html, /<section class="history-timeline"/);
  for (const retired of ['Event Log', 'event-log-dialog', 'current-event-button', 'history-event-log', 'menu-event-log'])
    assert.equal(html.includes(retired), false, retired);
  const interfaceDir = new URL('../../src/interface/', import.meta.url);
  assert.equal(readdirSync(new URL('inspection/', interfaceDir)).includes('event-log-surface.js'), false);
});
