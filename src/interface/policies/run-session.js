/** Atomic first-wins world replacement and exactly-once result transactions. */
import { buildMemorySnapshot, compileMemory } from '../../game/skills/index.js';
import { identityFields, sameWorldIdentity } from '../../core/world-session.js';
import { createBlankSnapshot } from '../../rendering/blank-snapshot.js';
import { normalizeHistoryEvents, appendAbandonedWorld, saveHistory } from '../../platform/history.js';
import { saveMeta } from '../../platform/storage.js';
import { seedForRun } from '../app-data.js';
import { applyRunResult } from './run-result.js';
import { disableContinuation, resetContinuation, startContinuation } from './continuation.js';
import * as ui from '../surfaces.js';

export function createWorldReplacementState() {
  return { status: 'idle', reason: null, expectedIdentity: null, requestSequence: 0, accepted: 0, rejected: 0 };
}
export function requestWorldReplacement(app, reason, expectedIdentity = null) {
  const state = app.worldReplacement;
  if (state.status !== 'idle' || !expectedMatches(app, expectedIdentity)) { state.rejected++; return false; }
  state.status = 'requested'; state.reason = reason; state.expectedIdentity = expectedIdentity;
  state.requestSequence++; state.accepted++;
  if (reason === 'confirmed-new-world' && app.state === 'running' && app.driver.outcome == null) {
    state.status = 'awaiting-authority'; app.newWorld?.pending();
    if (app.driver.abort(app.worldIdentity)) return true;
  }
  return performWorldReplacement(app);
}
export function startRun(app, reason = null) {
  const selectedReason = reason ?? (app.state === 'title' ? 'title-grow' : app.state === 'result' ? 'manual-next'
    : app.state === 'memory' ? 'evolution-restart' : app.state === 'trophies' ? 'trophy-restart' : 'requested-restart');
  const expected = app.state === 'result' ? app.lastResultIdentity : null;
  return requestWorldReplacement(app, selectedReason, expected);
}
export function performWorldReplacement(app) {
  const replacement = app.worldReplacement; if (!['requested', 'awaiting-authority'].includes(replacement.status)) return false;
  replacement.status = 'replacing'; retireWorldPresentation(app); replacement.status = 'preparing';
  const seedIndex = Math.max(app.meta.runs, app.meta.worldSeedIndex ?? app.meta.runs); const seed = seedForRun(seedIndex);
  app.meta = { ...app.meta, worldSeedIndex: seedIndex + 1 };
  if (!saveMeta(app.meta)) ui.announce(app.el, 'The world seed sequence is session-only because storage is unavailable.');
  const identity = app.driver.reserveIdentity({ worldSessionId: ++app.worldSessionSequence, seed,
    presentationGeneration: ++app.presentationGeneration });
  app.worldIdentity = identity; app.activeRunId = identity.runId; app.runSeed = seed;
  app.makeRenderer(seed, 'world', identity); const blank = createBlankSnapshot(app.topo4.nodeCount, identity);
  app.snapshot = blank; app.driver.installSnapshot(blank); app.flow.send(transitionFor(app.state));
  ui.show(app.el, 'run'); ui.resetWorldPresentation(app.el, blank); app.resize(false);
  app.renderer.bindWorldSession(identity); app.renderer.resetDynamicState();
  const rendered = app.renderer.render({ snapshot: blank, worldIdentity: identity, camera: app.camera,
    selectedNode: null, adaptation: null, highlightedCells: [], time: performance.now() / 1000, pulse: false });
  app.presentationAudit.blankFrames++; app.presentationAudit.lastBlank = Object.freeze({ ...identityFields(identity), rendered,
    renderer: app.renderer.backend, audit: app.renderer.lastFrameAudit });
  ui.announce(app.el, 'The seeded world is choosing a suitable place to begin.');
  const memory = compileMemory(app.meta); replacement.status = 'starting';
  app.driver.start({ seed, strainId: 'pioneer', memoryEffects: memory.effects,
    memoryConditionals: memory.conditionals, memoryUnlocks: memory.unlocks,
    adaptationMode: app.settings.adaptationMode }, app.speed, identity);
  return true;
}
export function retireWorldPresentation(app) {
  const retired = app.worldIdentity; app.retiredWorldIdentity = retired; app.worldIdentity = null; app.activeRunId = 0;
  app.driver.stop(); app.renderer?.resetDynamicState(); app.requestId++; app.requestGeneration++; resetContinuation(app.continuation);
  app.countdownLabel = ''; app.el.countdown.textContent = ''; app.pause.clear(); app.adaptationEffects.clear();
  app.historyPlayback.retire(); app.surfaces.reset?.(); app.inspector.close(); app.historyUi.reset?.(); app.reachUi.reset?.();
  app.adapt.reset?.(); app.newWorld.close(); app.settingsUi.close(); app.memoryUi.closeNode(); app.trophyUi.close();
  app.overlay = null; app.selectedNode = null; app.offers = []; app.cards = []; app.currentHistory = [];
  app.lastResult = null; app.lastResultIdentity = null; app.historySnapshot = null; app.historyHighlights = [];
  app.snapshot = null; app.driver.installSnapshot(null); app.worldFields = null; app.fields = null;
  app.lastInspect = 0; app.lastRender = 0; app.timeDial.reset(performance.now()); ui.resetWorldPresentation(app.el, null);
  return retired;
}
export function markWorldStarted(app, identity) {
  if (!sameWorldIdentity(identity, app.worldIdentity) || app.worldReplacement.status !== 'starting') return false;
  app.worldReplacement.status = 'idle'; app.worldReplacement.reason = null; app.worldReplacement.expectedIdentity = null; return true;
}
export function recoverPreAuthorityFailure(app, identity) {
  if (!sameWorldIdentity(identity, app.worldIdentity)) return false; const sequence = app.worldReplacement.requestSequence;
  app.worldReplacement.status = 'recovering'; queueMicrotask(() => {
    if (app.worldReplacement.status !== 'recovering' || app.worldReplacement.requestSequence !== sequence
      || !sameWorldIdentity(identity, app.worldIdentity)) return;
    app.worldReplacement.status = 'idle'; requestWorldReplacement(app, 'recoverable-pre-authority-failure', identity);
  }); return true;
}
export function finishRun(app, result) {
  if (!sameWorldIdentity(result, app.worldIdentity)) return false;
  const identified = { ...result, resultTransactionKey: app.worldIdentity.resultTransactionKey };
  const transaction = applyRunResult(app.meta, app.archive, identified,
    app.settings.historyRetention, app.resultKeys); if (!transaction.applied) return false;
  app.resultKeys.add(transaction.key); if (app.resultKeys.size > 16) app.resultKeys.delete(app.resultKeys.values().next().value);
  app.closeActiveOverlay(); app.adaptationEffects.clear(); app.selectedNode = null; app.flow.send('extinct');
  app.lastResult = identified; app.lastResultIdentity = app.worldIdentity;
  app.currentHistory = normalizeHistoryEvents(result.history); app.meta = transaction.meta; app.archive = transaction.archive;
  app.pendingTrophyIds.push(...transaction.trophyIds); const skills = buildMemorySnapshot(app.topo3, app.meta).nodeStates;
  app.el.evolutionButton.dataset.action = skills.some((node) => node.reachable && node.affordable && !node.owned) ? 'available' : 'quiet';
  if (!saveMeta(app.meta)) ui.announce(app.el, 'Progress is temporary because browser storage is unavailable.');
  saveHistory(app.archive, app.settings.historyRetention); const record = app.archive.worlds.at(-1);
  app.historyPlayback.save(record && { id: record.id, seed: record.seed, completedAt: app.meta.runs });
  ui.showResult(app.el, transaction.score, { ...result, adaptationOffers: result.offers,
    trophyIds: transaction.trophyIds, campaignResolvedNow: transaction.meta.runs === 4 }); app.resize(false);
  if (app.worldReplacement.status === 'awaiting-authority') return performWorldReplacement(app);
  if (app.settings.autoContinue) startContinuation(app.continuation, performance.now(), app.worldIdentity);
  else disableContinuation(app.continuation, app.worldIdentity);
  app.updateContinuation(); return true;
}
export function finishAbandoned(app, summary) {
  if (!sameWorldIdentity(summary, app.worldIdentity) || app.worldReplacement.status !== 'awaiting-authority') return false;
  app.archive = appendAbandonedWorld(app.archive, summary, app.settings.historyRetention);
  saveHistory(app.archive, app.settings.historyRetention); app.currentHistory = normalizeHistoryEvents(summary.history);
  return performWorldReplacement(app);
}
function expectedMatches(app, expected) {
  if (!expected) return true;
  if (typeof expected === 'string') return expected === app.lastResultIdentity?.resultTransactionKey;
  return sameWorldIdentity(expected, app.worldIdentity) || sameWorldIdentity(expected, app.lastResultIdentity);
}
function transitionFor(state) {
  if (state === 'title') return 'begin'; if (state === 'running') return 'abort';
  if (state === 'starting') return 'replace'; return 'restart';
}
