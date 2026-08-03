/** Unified shell semantics and pure metric/Event Log projections. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { metricProjection } from '../../src/interface/inspection/metric-surface.js';
import { EVENT_LOG_ROW_CAP, eventLogWorlds } from '../../src/interface/inspection/event-log-surface.js';

test('one selector, context shell, compact dock, and three metric buttons are semantic', () => {
  const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
  assert.deepEqual([...html.matchAll(/role="tab"[^>]*data-scene="([^"]+)"/g)].map((match) => match[1]),
    ['home', 'world', 'evolution', 'trophies']);
  assert.equal((html.match(/id="context-shell"/g) ?? []).length, 1);
  for (const [id, label] of [['score-button', 'SCORE'], ['entropy-button', 'ENTROPY'], ['reach-button', 'REACH']]) {
    assert.match(html, new RegExp(`id="${id}"[\\s\\S]{0,260}>${label}<`));
  }
  const rail = html.match(/<div class="command-rail[\s\S]*?<\/div>\s*<\/div>\s*<\/section>/)?.[0] ?? '';
  assert.match(rail, /pause-button/); assert.match(rail, /speed-select/); assert.match(rail, /adaptations-button/); assert.match(rail, /menu-button/);
  for (const absent of ['new-world-button', 'settings-open', 'history-open']) assert.equal(rail.includes(absent), false);
});

test('metric projections use actual score, entropy snapshots, and Reach ledger values', () => {
  const score = { total: 120000, rank: { en: 'Conductor' }, rate: 1, mult: 1, breakdown: [
    { en: 'Reach', q: .5, weight: .2, points: 10000 },
  ] };
  const scoreView = metricProjection('score', { score, result: {}, history: [] });
  assert.equal(scoreView.primary, '120,000'); assert.equal(scoreView.counts[0].value, 'Conductor');
  assert.match(scoreView.direct[0].label, /50% axis · 20% weight/);
  const entropy = metricProjection('entropy', { snapshot: { tick: 400, entropy: .42, status: 'running', events: [
    { family: 'heat', intensity: .6, center: 4 },
  ], reach: { negativeConditions: [{ label: 'entropy', score: .42 }] } }, entropyRate: 3, history: [] });
  assert.equal(entropy.primary, '42%'); assert.equal(entropy.counts[1].value, '+3 pp / 10s'); assert.deepEqual(entropy.direct[0].cells, [4]);
  const reach = metricProjection('reach', { snapshot: { metrics: { coverage: .125 }, reach: { current: 12, windowSeconds: 15,
    gained: 7, lost: 4, net: 3, positive: [{ label: 'regrowth', count: 7, samples: [2, 3] }], negative: [], positiveConditions: [], negativeConditions: [] } } });
  assert.equal(reach.primary, '13%'); assert.deepEqual(reach.counts.map((item) => item.value), ['+7', '−4', '+3']);
  assert.deepEqual(reach.direct[0].cells, [2, 3]);
});

test('Event Log current/archive models and rows stay bounded', () => {
  const events = Array.from({ length: EVENT_LOG_ROW_CAP + 25 }, (_, seq) => ({ seq, tick: seq, key: 'run.germination', kind: 'life', primaryCells: [seq % 8] }));
  const model = eventLogWorlds({ events, seed: 7, tick: 104, terminal: false }, { worlds: [
    { id: 'archive-1', archetype: 'Temperate', seed: 6, tick: 90, events },
  ] });
  assert.equal(model.worlds.length, 2); assert.equal(model.worlds[0].current, true);
  assert.equal(model.worlds[0].events.length, EVENT_LOG_ROW_CAP); assert.equal(model.worlds[1].events.length, EVENT_LOG_ROW_CAP);
  assert.equal(model.worlds[0].events[0].seq, 25);
});
