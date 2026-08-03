/** Run start, terminal reward, and reward-free abandonment transactions. */
import { buildMemorySnapshot, compileMemory } from '../../game/memory.js';
import { normalizeHistoryEvents, appendAbandonedWorld, saveHistory } from '../../platform/history.js';
import { saveMeta } from '../../platform/storage.js';
import { seedForRun } from '../app-data.js';
import { applyRunResult } from './run-result.js';
import { cancelContinuation, startContinuation } from './continuation.js';
import * as ui from '../surfaces.js';

export function startRun(app) {
  app.closeActiveOverlay(); app.adaptationEffects.clear(); cancelContinuation(app.continuation);
  app.el.countdown.textContent = ''; app.pause.clear(); app.selectedNode = null;
  app.offers = []; app.cards = []; app.currentHistory = []; app.lastResult = null;
  const seedIndex = Math.max(app.meta.runs, app.meta.worldSeedIndex ?? app.meta.runs);
  const seed = seedForRun(seedIndex); app.meta = { ...app.meta, worldSeedIndex: seedIndex + 1 };
  if (!saveMeta(app.meta)) ui.announce(app.el, 'The world seed sequence is session-only because storage is unavailable.');
  app.runSeed = seed; app.makeRenderer(seed);
  app.flow.send(app.state === 'title' ? 'begin' : app.state === 'running' ? 'abort' : 'restart');
  app.resize(false); app.snapshot = null; app.historySnapshot = null; app.historyHighlights = [];
  ui.show(app.el, 'run'); ui.announce(app.el, 'The seeded world is choosing a suitable place to begin.');
  const memory = compileMemory(app.meta);
  app.activeRunId = app.driver.start({ seed, strainId: 'pioneer', memoryEffects: memory.effects,
    memoryConditionals: memory.conditionals, memoryUnlocks: memory.unlocks,
    adaptationMode: app.settings.adaptationMode }, app.speed);
}

export function finishRun(app, result) {
  if (result.runId !== app.activeRunId) return false;
  const transaction = applyRunResult(app.meta, app.archive, result,
    app.settings.historyRetention, app.resultKeys); if (!transaction.applied) return false;
  app.resultKeys.add(transaction.key); if (app.resultKeys.size > 16) app.resultKeys.delete(app.resultKeys.values().next().value);
  app.closeActiveOverlay(); app.adaptationEffects.clear();
  app.selectedNode = null; app.flow.send('extinct'); app.lastResult = result;
  app.currentHistory = normalizeHistoryEvents(result.history); app.meta = transaction.meta; app.archive = transaction.archive;
  const skills = buildMemorySnapshot(app.topo3, app.meta).nodeStates;
  app.el.evolutionButton.dataset.action = skills.some((node) => node.reachable && node.affordable && !node.owned) ? 'available' : 'quiet';
  if (!saveMeta(app.meta)) ui.announce(app.el, 'Progress is temporary because browser storage is unavailable.');
  saveHistory(app.archive, app.settings.historyRetention);
  const record = app.archive.worlds.at(-1);
  app.historyPlayback.save(record && { id: record.id, seed: record.seed, completedAt: app.meta.runs });
  ui.showResult(app.el, transaction.score, { ...result, adaptationOffers: result.offers,
    campaignResolvedNow: transaction.meta.runs === 4 }); app.resize(false);
  if (app.settings.autoContinue) { startContinuation(app.continuation, performance.now(), { resultKey: transaction.key, runId: result.runId }); app.updateContinuation(); }
  return true;
}

export function finishAbandoned(app, summary) {
  if (summary.runId !== app.activeRunId) return false;
  app.archive = appendAbandonedWorld(app.archive, summary, app.settings.historyRetention);
  saveHistory(app.archive, app.settings.historyRetention); app.currentHistory = normalizeHistoryEvents(summary.history);
  app.adaptationEffects.clear(); app.pause.set('new-world', false); app.startRun(); return true;
}
