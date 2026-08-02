/** Risk protected: corrupted saves must never white-screen; invalid values
 *  must fall back to safe defaults field by field. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateSettings, defaultSettings } from '../../src/platform/settings.js';
import { defaultMeta, validateMeta } from '../../src/platform/storage.js';
import { buildMemorySnapshot, canPurchaseMemory, memoryEffects, purchaseMemory } from '../../src/game/memory.js';
import { createTopology } from '../../src/world/icosphere.js';

test('defaults are safe', () => {
  const d = defaultSettings();
  assert.equal(d.muted, true);
  assert.equal(d.haptics, false);
  assert.ok(['full', 'reduced'].includes(d.motion));
});

test('null / garbage input yields defaults', () => {
  assert.deepEqual(validateSettings(null), defaultSettings());
  assert.deepEqual(validateSettings('junk'), defaultSettings());
  assert.deepEqual(validateSettings(42), defaultSettings());
});

test('valid values pass through', () => {
  const s = validateSettings({ motion: 'reduced', muted: false, quality: 'eco', lang: 'ja', speed: 32 });
  assert.equal(s.motion, 'reduced');
  assert.equal(s.muted, false);
  assert.equal(s.quality, 'eco');
  assert.equal(s.lang, 'ja');
  assert.equal(s.speed, 32);
});

test('invalid enum values fall back per field', () => {
  const s = validateSettings({ motion: 'sideways', quality: 'ultra', muted: 'yes', lang: 'xx', speed: 3 });
  assert.equal(s.motion, defaultSettings().motion);
  assert.equal(s.quality, 'auto');
  assert.equal(s.muted, true);
  assert.equal(s.lang, null);
  assert.equal(s.speed, 1);
});

test('prototype pollution attempts are ignored', () => {
  const s = validateSettings(JSON.parse('{"__proto__": {"polluted": true}, "muted": false}'));
  assert.equal(s.muted, false);
  assert.equal({}.polluted, undefined);
});

test('progression validation preserves only bounded values', () => {
  assert.deepEqual(validateMeta(null), defaultMeta());
  const meta = validateMeta({ schema: 1, bestScore: 123.9, totalEchoes: 8.4, runs: 2.9, signalHintShown: true });
  assert.deepEqual(meta, { schema: 2, bestScore: 123, totalEchoes: 8, echoBalance: 8,
    runs: 2, signalHintShown: true, memoryNodes: [] });
  const invalid = validateMeta(JSON.parse('{"bestScore":-1,"runs":-3,"__proto__":{"polluted":true}}'));
  assert.equal(invalid.bestScore, 0);
  assert.equal(invalid.runs, 0);
  assert.equal({}.polluted, undefined);
});

test('Memory Globe purchase conserves Echoes and changes next-run traits', () => {
  const meta = { ...defaultMeta(), echoBalance: 6, totalEchoes: 6 };
  assert.equal(canPurchaseMemory(meta, 'first-trace'), true);
  assert.equal(canPurchaseMemory(meta, 'deep-reserve'), false, 'prerequisite must be purchased first');
  const purchase = purchaseMemory(meta, 'first-trace');
  assert.equal(purchase.ok, true);
  assert.equal(purchase.meta.echoBalance, 4);
  assert.deepEqual(purchase.meta.memoryNodes, ['first-trace']);
  assert.deepEqual(memoryEffects(purchase.meta), { signalCharges: 1 });
  assert.equal(meta.echoBalance, 6, 'purchase is transactional, not mutating');
  assert.equal(purchaseMemory(purchase.meta, 'first-trace').ok, false, 'cannot repurchase');
});

test('Memory Globe fossil uses valid canonical boundaries only', () => {
  const topo = createTopology(2);
  const meta = { ...defaultMeta(), memoryNodes: ['first-trace'] };
  const fossil = buildMemorySnapshot(topo, meta);
  assert.equal(fossil.status, 'memory');
  assert.ok(fossil.edgeActive.some((value) => value === 1), 'purchased memory must create a filament');
  for (let edge = 0; edge < topo.edgeCount; edge++) {
    if (!fossil.edgeActive[edge]) continue;
    assert.equal(fossil.alive[topo.edgeA[edge]], 1);
    assert.equal(fossil.alive[topo.edgeB[edge]], 1);
  }
});
