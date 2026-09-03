import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EVOLUTION_NAVIGATION_SHORTCUTS, evolutionNavigationCommand,
  evolutionNavigationTarget, isReadyEvolutionNavigation,
} from '../../../src/interface/policies/evolution-navigation.js';

test('exact-cell traversal wraps in stable numeric order and jumps to the authored root', () => {
  const inputs = { nodeCount: 4, rootCell: 2, selectedCell: 0, readyCells: [], owned: new Uint8Array(4) };
  assert.equal(evolutionNavigationTarget('previous-cell', inputs), 3);
  assert.equal(evolutionNavigationTarget('next-cell', { ...inputs, selectedCell: 3 }), 0);
  assert.equal(evolutionNavigationTarget('root-cell', inputs), 2);
});

test('ready traversal prefers unowned cells, sorts them, and wraps both ways', () => {
  const owned = new Uint8Array(7); owned[1] = 1; owned[5] = 1;
  const inputs = { nodeCount: 7, rootCell: 0, selectedCell: 2, readyCells: Uint32Array.of(5, 1, 4, 2), owned };
  assert.equal(evolutionNavigationTarget('next-ready', inputs), 4);
  assert.equal(evolutionNavigationTarget('next-ready', { ...inputs, selectedCell: 4 }), 2);
  assert.equal(evolutionNavigationTarget('previous-ready', { ...inputs, selectedCell: 4 }), 2);
  assert.equal(evolutionNavigationTarget('previous-ready', { ...inputs, selectedCell: 2 }), 4);
});

test('ready traversal falls back to owned refinements and may retain one eligible cell', () => {
  const owned = new Uint8Array(7); owned[1] = 1; owned[5] = 1;
  const inputs = { nodeCount: 7, rootCell: 0, selectedCell: 1, readyCells: [5, 1], owned };
  assert.equal(evolutionNavigationTarget('next-ready', inputs), 5);
  assert.equal(evolutionNavigationTarget('previous-ready', inputs), 5);
  assert.equal(evolutionNavigationTarget('next-ready', { ...inputs, selectedCell: 5, readyCells: [5] }), 5);
});

test('empty and malformed ready sets have no target and remain finitely bounded', () => {
  const base = { nodeCount: 4, rootCell: 2, selectedCell: 1, owned: new Uint8Array(4) };
  assert.equal(evolutionNavigationTarget('next-ready', { ...base, readyCells: [] }), null);
  assert.equal(evolutionNavigationTarget('previous-ready', { ...base, readyCells: [-1, 4, 1.5, 9] }), null);
  assert.equal(evolutionNavigationTarget('next-ready', { ...base, readyCells: [2, 2, 3, 3, 1] }), 2);
  assert.equal(evolutionNavigationTarget('next-cell', { ...base, nodeCount: 0 }), null);
  assert.equal(evolutionNavigationTarget('root-cell', { ...base, rootCell: Infinity }), null);
  assert.equal(evolutionNavigationTarget('unknown', base), null);
});

test('invalid selection has deterministic forward, backward, and ready entry points', () => {
  const inputs = { nodeCount: 6, rootCell: 4, selectedCell: 99, readyCells: [4, 2], owned: new Uint8Array(6) };
  assert.equal(evolutionNavigationTarget('next-cell', inputs), 0);
  assert.equal(evolutionNavigationTarget('previous-cell', inputs), 5);
  assert.equal(evolutionNavigationTarget('next-ready', inputs), 2);
  assert.equal(evolutionNavigationTarget('previous-ready', inputs), 4);
});

test('command interpretation accepts only unmodified non-repeated selected keys', () => {
  assert.deepEqual(EVOLUTION_NAVIGATION_SHORTCUTS, ['ArrowLeft', 'ArrowRight', 'Home', 'PageUp', 'PageDown']);
  assert.equal(evolutionNavigationCommand({ key: 'ArrowLeft' }), 'previous-cell');
  assert.equal(evolutionNavigationCommand({ key: 'PageDown' }), 'next-ready');
  for (const event of [
    { key: 'ArrowRight', repeat: true }, { key: 'Home', shiftKey: true }, { key: 'PageUp', ctrlKey: true },
    { key: 'PageDown', altKey: true }, { key: 'ArrowLeft', metaKey: true }, { key: 'End' }, null,
  ]) assert.equal(evolutionNavigationCommand(event), null);
  assert.equal(isReadyEvolutionNavigation('previous-ready'), true);
  assert.equal(isReadyEvolutionNavigation('next-ready'), true);
  assert.equal(isReadyEvolutionNavigation('next-cell'), false);
});
