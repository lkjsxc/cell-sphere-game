import { test } from 'node:test';
import assert from 'node:assert/strict';
import { environmentHistoryAnchor, historyEventCategory } from '../../src/interface/history-surface.js';

test('Environment History anchors the latest transition at or before the live tick', () => {
  const events = [
    { tick: 0, kind: 'world', key: 'run.world.created' },
    { tick: 1200, kind: 'environment', key: 'environment.level.transition', subjectId: '1' },
    { tick: 1500, kind: 'life', key: 'resource.reserve.threshold' },
    { tick: 1800, kind: 'environment', key: 'environment.level.transition', subjectId: '2' },
  ];
  assert.equal(historyEventCategory(events[1]), 'environment');
  assert.deepEqual(environmentHistoryAnchor(events, 1600), { event: events[1], index: 1, tick: 1200 });
  assert.deepEqual(environmentHistoryAnchor(events, 2400), { event: events[3], index: 3, tick: 1800 });
  assert.equal(environmentHistoryAnchor(events, 1199), null);
});
