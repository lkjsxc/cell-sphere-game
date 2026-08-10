/** No-disaster authority regression coverage. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RunController } from '../../src/simulation/simulator.js';

test('production authority has no director, crisis fields, or event render buffers', () => {
  assert.equal(existsSync(new URL('../../src/simulation/events.js', import.meta.url)), false);
  assert.equal(existsSync(new URL('../../src/game/events-content.js', import.meta.url)), false);
  assert.equal(existsSync(new URL('../../src/rendering/event-tints.js', import.meta.url)), false);
  const run = new RunController({ seed: 77, worldOrdinal: '1' }); run.start(); run.advance(1500);
  const snapshot = run.snapshot(); const result = run.buildResult();
  for (const value of [snapshot, result, run.state]) for (const key of ['eventDirector', 'events', 'eventStrength', 'eventFamily', 'crisesTotal', 'crisesEndured'])
    assert.equal(key in value, false, key);
});

test('production source excludes gameplay-disaster authority while allowing DOM events and History records', () => {
  const source = sourceText(fileURLToPath(new URL('../../src/', import.meta.url)));
  for (const banned of ['eventDirector', 'eventStrength', 'eventFamily', 'activeEvents', 'crisisMask', 'crisesEndured', 'harmfulEventsDisabled'])
    assert.equal(source.includes(banned), false, banned);
  assert.match(source, /addEventListener/);
  assert.match(source, /history-batch/);
});

function sourceText(directory) {
  const files = [];
  const walk = (path) => { for (const entry of readdirSync(path, { withFileTypes: true })) {
    const target = join(path, entry.name); if (entry.isDirectory()) walk(target); else if (entry.name.endsWith('.js')) files.push(target);
  } };
  walk(directory); return files.map((path) => readFileSync(path, 'utf8')).join('\n');
}
