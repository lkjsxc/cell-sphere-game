/** Risk protected: corrupted saves must never white-screen; invalid values
 *  must fall back to safe defaults field by field. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateSettings, defaultSettings } from '../../src/platform/settings.js';
import { defaultMeta, validateMeta } from '../../src/platform/storage.js';

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
  assert.deepEqual(meta, { schema: 1, bestScore: 123, totalEchoes: 8, runs: 2, signalHintShown: true });
  const invalid = validateMeta(JSON.parse('{"bestScore":-1,"runs":-3,"__proto__":{"polluted":true}}'));
  assert.equal(invalid.bestScore, 0);
  assert.equal(invalid.runs, 0);
  assert.equal({}.polluted, undefined);
});
