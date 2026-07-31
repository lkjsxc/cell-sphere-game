/** Risk protected: corrupted saves must never white-screen; invalid values
 *  must fall back to safe defaults field by field. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateSettings, defaultSettings } from '../../src/platform/settings.js';

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
  const s = validateSettings({ motion: 'reduced', muted: false, quality: 'eco' });
  assert.equal(s.motion, 'reduced');
  assert.equal(s.muted, false);
  assert.equal(s.quality, 'eco');
});

test('invalid enum values fall back per field', () => {
  const s = validateSettings({ motion: 'sideways', quality: 'ultra', muted: 'yes' });
  assert.equal(s.motion, defaultSettings().motion);
  assert.equal(s.quality, 'auto');
  assert.equal(s.muted, true);
});

test('prototype pollution attempts are ignored', () => {
  const s = validateSettings(JSON.parse('{"__proto__": {"polluted": true}, "muted": false}'));
  assert.equal(s.muted, false);
  assert.equal({}.polluted, undefined);
});
