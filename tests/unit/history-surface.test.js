import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as historySurface from '../../src/interface/history-surface.js';

test('History keeps Environment records without a special Environment-detail route', () => {
  const event = { tick: 1200, kind: 'environment', key: 'environment.level.transition', subjectId: '1' };
  assert.equal(historySurface.historyEventCategory(event), 'environment');
  assert.equal(typeof historySurface.environmentHistoryAnchor, 'undefined');
});
