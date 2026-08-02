/** Small browser-bound data/quality helpers kept out of the game controller. */
import { validateMeta } from '../platform/storage.js';
import { validateHistory } from '../platform/history.js';
import { validateSettings } from '../platform/settings.js';

export function seedForRun(runCount, search = location.search) {
  const params = new URLSearchParams(search); const given = Number(params.get('seed'));
  if (Number.isInteger(given) && given >= 0 && given < 0x40000000) return given;
  return (20260731 + runCount * 104729) & 0x3fffffff;
}

export function qualityDpr(settings, caps) {
  if (settings.quality === 'eco') return Math.min(caps.dpr, 1.1);
  if (settings.quality === 'balanced') return Math.min(caps.dpr, 1.5);
  if (settings.quality === 'luminous') return Math.min(caps.dpr, 2);
  const constrained = caps.saveData || caps.memoryHint <= 4;
  return Math.min(caps.dpr, constrained ? 1.15 : 1.5);
}

export function downloadData(meta, history, settings) {
  const blob = new Blob([JSON.stringify({ schema: 1, product: 'incremental-network-game', meta, history, settings }, null, 2)],
    { type: 'application/json' });
  const url = URL.createObjectURL(blob); const link = document.createElement('a');
  link.href = url; link.download = 'incremental-network-game-save.json'; link.click(); URL.revokeObjectURL(url);
}

export function parseImportedData(text) {
  const raw = JSON.parse(text);
  if (!raw || raw.product !== 'incremental-network-game') throw new Error('not a game export');
  return { meta: validateMeta(raw.meta), history: validateHistory(raw.history, 32), settings: validateSettings(raw.settings) };
}
