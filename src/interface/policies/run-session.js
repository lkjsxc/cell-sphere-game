/** Atomic first-wins world replacement and exactly-once result transactions. */
import { compileEvolution } from '../../game/skills/index.js';
import {
  ENVIRONMENT_MODEL_VERSION,
  ENVIRONMENT_ONBOARDING_MODIFIER_VERSION,
  ENVIRONMENT_SCHEDULE_HASH,
  ENVIRONMENT_SCHEDULE_VERSION,
  environmentOnboardingModifierForWorld,
} from '../../game/environment-level.js';
import { incrementProgressionInteger, maxProgressionInteger, normalizeProgressionInteger } from '../../core/progression-integer.js';
import { hashStringU32, hexU32 } from '../../core/hash.js';
import { identityFields, sameWorldIdentity } from '../../core/world-session.js';
import { createBlankSnapshot } from '../../rendering/blank-snapshot.js';
import { normalizeHistoryEvents, appendAbandonedWorld, saveHistory } from '../../platform/history.js';
import { saveMeta } from '../../platform/storage.js';
import { saveRunTransaction } from '../../platform/run-transaction-store.js';
import { seedForRun } from '../app-data.js';
import { applyRunResult } from './run-result.js';
import { disableContinuation, resetContinuation, setContinuationHidden, startContinuation } from './continuation.js';
import * as ui from '../surfaces.js';

export function createWorldReplacementState() {
  return { status: 'idle', reason: null, expectedIdentity: null, requestSequence: 0,
    recoveryAttempts: 0, accepted: 0, rejected: 0 };
}
export function requestWorldReplacement(app, reason, expectedIdentity = null) {
  const state = app.worldReplacement;
  if (state.status !== 'idle' || !expectedMatches(app, expectedIdentity)) { state.rejected++; return false; }
  state.status = 'requested'; state.reason = reason; state.expectedIdentity = expectedIdentity;
  state.requestSequence++; state.accepted++;
  if (phaseOf(app) === 'running' && app.driver.outcome == null) {
    state.status = 'awaiting-authority'; app.newWorld?.pending?.();
    if (app.driver.abort(app.worldIdentity)) return true;
    state.status = 'requested';
  }
  return performWorldReplacement(app);
}
export function startRun(app, reason = null) {
  const phase = phaseOf(app); const selectedReason = reason ?? (phase === 'idle' ? 'title-grow' : phase === 'result' ? 'manual-next-world' : 'requested-restart');
  const expected = phase === 'result' ? app.lastResultIdentity : null;
  return requestWorldReplacement(app, selectedReason, expected);
}
export function performWorldReplacement(app) {
  const replacement = app.worldReplacement; if (!['requested', 'awaiting-authority'].includes(replacement.status)) return false;
  replacement.status = 'replacing'; retireWorldPresentation(app); replacement.status = 'preparing';
  const seedIndex = maxProgressionInteger(normalizeProgressionInteger(app.meta.runs, '0'),
    normalizeProgressionInteger(app.meta.worldSeedIndex, app.meta.runs)); const seed = seedForRun(seedIndex);
  app.meta = { ...app.meta, worldSeedIndex: incrementProgressionInteger(seedIndex),
    revision: incrementProgressionInteger(normalizeProgressionInteger(app.meta.revision, '0')) };
  if (!saveMeta(app.meta)) ui.announce(app.el, 'The world seed sequence is session-only because storage is unavailable.');
  const evolution = compileEvolution(app.meta);
  const worldOrdinal = incrementProgressionInteger(seedIndex);
  const onboardingEnvironmentModifier = environmentOnboardingModifierForWorld(worldOrdinal);
  const identity = app.driver.reserveIdentity({ worldSessionId: ++app.worldSessionSequence, seed,
    presentationGeneration: ++app.presentationGeneration,
    environmentModelVersion: ENVIRONMENT_MODEL_VERSION,
    environmentScheduleVersion: ENVIRONMENT_SCHEDULE_VERSION,
    environmentScheduleHash: ENVIRONMENT_SCHEDULE_HASH,
    immutableStartConfigurationHash: immutableStartConfigurationHash(seed, worldOrdinal, evolution, onboardingEnvironmentModifier),
    onboardingEnvironmentModifierVersion: ENVIRONMENT_ONBOARDING_MODIFIER_VERSION });
  app.worldIdentity = identity; app.activeRunId = identity.runId; app.runSeed = seed;
  app.makeRenderer(seed, 'world', identity); const blank = createBlankSnapshot(app.topo4.nodeCount, identity);
  app.snapshot = blank; app.driver.installSnapshot(blank); app.flow.send(transitionFor(phaseOf(app))); app.flow.select?.('world');
  app.sceneSelector?.update?.('world'); ui.show(app.el, 'world'); ui.resetWorldPresentation(app.el, blank); app.updateSceneActions?.(); app.resize(false);
  app.renderer.bindWorldSession(identity); app.renderer.resetDynamicState();
  const rendered = app.renderer.render({ snapshot: blank, worldIdentity: identity, camera: app.camera,
    selectedNode: null, highlightedCells: [], time: performance.now() / 1000, pulse: false });
  app.presentationAudit.blankFrames++; app.presentationAudit.lastBlank = Object.freeze({ ...identityFields(identity), rendered,
    renderer: app.renderer.backend, audit: app.renderer.lastFrameAudit });
  ui.announce(app.el, 'Environment Level 0 is choosing a suitable place to begin.');
  replacement.status = 'starting';
  app.driver.start({ seed, strainId: 'pioneer', worldOrdinal,
    evolutionDefense:{ affinityDefense:evolution.affinityDefense, pressureDefense:evolution.pressureDefense },
    memoryEffects: evolution.effects, memoryConditionals: evolution.conditionals, memoryUnlocks: evolution.unlocks,
    habitatCapabilities: evolution.habitatCapabilities, worldPotential: evolution.worldPotential,
    evolutionPower: evolution.evolutionPower ?? 0, evolutionDepth:evolution.evolutionDepth,
    potentialVersion: evolution.potentialVersion,
    activeBuilds: evolution.activeBuilds ?? [], buildEffects: evolution.buildEffects ?? {},
    electricityMastery:evolution.electricityMastery }, app.speed, identity);
  return true;
}
export function retireWorldPresentation(app) {
  const retired = app.worldIdentity; app.retiredWorldIdentity = retired; app.worldIdentity = null; app.activeRunId = 0;
  app.driver.stop(); app.renderer?.resetDynamicState(); app.requestId++; app.requestGeneration++; resetContinuation(app.continuation);
  app.countdownLabel = ''; app.el.countdown.textContent = ''; app.pause.clear();
  app.historyPlayback.retire(); app.surfaces.reset?.(); app.inspector.close(); app.historyUi.reset?.(); app.metricUi?.reset?.(); app.eventLogUi?.reset?.();
  app.newWorld.close(); app.settingsUi.close(); app.memoryUi.closeNode(); app.trophyUi.close();
  app.overlay = null; app.selectedNode = null; app.currentHistory = [];
  app.lastResult = null; app.lastScore = null; app.lastResultIdentity = null; app.historySnapshot = null; app.historyHighlights = [];
  app.snapshot = null; app.driver.installSnapshot(null); app.worldFields = null; app.fields = null;
  app.lastInspect = 0; app.lastRender = 0; app.timeDial.reset(performance.now()); ui.resetWorldPresentation(app.el, null);
  return retired;
}
export function markWorldStarted(app, identity) {
  if (!sameWorldIdentity(identity, app.worldIdentity) || app.worldReplacement.status !== 'starting') return false;
  app.worldReplacement.status = 'idle'; app.worldReplacement.reason = null; app.worldReplacement.expectedIdentity = null;
  app.worldReplacement.recoveryAttempts = 0; return true;
}
export function recoverPreAuthorityFailure(app, identity) {
  if (!sameWorldIdentity(identity, app.worldIdentity)) return false;
  if (app.worldReplacement.recoveryAttempts >= 1) {
    app.worldReplacement.status = 'idle'; app.flow.send?.('fail'); app.failRun?.('The simulation could not start after a recovery attempt.');
    app.selectScene?.('home'); return false;
  }
  const sequence = app.worldReplacement.requestSequence;
  app.worldReplacement.recoveryAttempts++;
  app.worldReplacement.status = 'recovering'; queueMicrotask(() => {
    if (app.worldReplacement.status !== 'recovering' || app.worldReplacement.requestSequence !== sequence
      || !sameWorldIdentity(identity, app.worldIdentity)) return;
    app.worldReplacement.status = 'idle'; requestWorldReplacement(app, 'recoverable-pre-authority-failure', identity);
  }); return true;
}
export function recoverAuthorityLossDuringReplacement(app,message){
  if(app.worldReplacement.status!=='awaiting-authority'||!sameWorldIdentity(message,app.worldIdentity))return false;
  const snapshot=app.snapshot??{},identity=identityFields(app.worldIdentity);
  app.archive=appendAbandonedWorld(app.archive,{...snapshot,...identity,runId:identity.runId,seed:identity.seed,tick:snapshot.tick??0,
    score:'0',worldOrdinal:snapshot.worldOrdinal??normalizeProgressionInteger(app.meta.worldSeedIndex,'0'),
    startEnvironmentLevel:'0',finalEnvironmentLevel:snapshot.currentEnvironmentLevel??'0',
    peakEnvironmentLevel:snapshot.peakEnvironmentLevel??'0',history:app.currentHistory??[]},app.settings.historyRetention);
  saveHistory(app.archive,app.settings.historyRetention);ui.announce(app.el,'The retiring world authority was lost; its reward-free abandonment was recorded.');
  return performWorldReplacement(app);
}
export function finishRun(app,result){
  if(!sameWorldIdentity(result,app.worldIdentity))return false;
  const identified={...result,resultTransactionKey:app.worldIdentity.resultTransactionKey};
  const transaction=applyRunResult(app.meta,app.archive,identified,
    app.settings.historyRetention, app.resultKeys); if (!transaction.applied) return false;
  app.resultKeys = new Set(transaction.meta.resultKeys);
  app.closeActiveOverlay(); app.selectedNode = null; app.flow.send('extinct');
  app.lastResult = identified; app.lastScore = transaction.score; app.lastResultIdentity = app.worldIdentity;
  app.meta = transaction.meta; app.archive = transaction.archive;
  app.currentHistory = app.archive.worlds.at(-1)?.events?.slice(-80) ?? normalizeHistoryEvents(result.history).slice(-80);
  ui.updateCurrentEvent(app.el, app.currentHistory.at(-1), true); app.eventLogUi.update(app.eventLogModel()); app.trophyNotifications.sync(app.meta);
  if (!saveRunTransaction(app.meta,app.archive,app.settings.historyRetention))
    ui.announce(app.el, 'Progress is temporary because browser storage is unavailable.');
  const record = app.archive.worlds.at(-1);
  app.historyPlayback.save(record && { id: record.id, seed: record.seed, completedAt: app.meta.runs });
  ui.showResult(app.el,transaction.score,{...result,trophyIds:transaction.trophyIds,campaignResolvedNow:transaction.meta.runs==='5'});
  if (app.worldReplacement.status === 'awaiting-authority') return performWorldReplacement(app);
  app.selectScene('world');
  if (app.settings.autoContinue) {
    const now = performance.now(); startContinuation(app.continuation, now, app.worldIdentity);
    if (globalThis.document?.hidden === true) setContinuationHidden(app.continuation, true, now);
  } else disableContinuation(app.continuation, app.worldIdentity);
  app.updateContinuation(); app.openResult(); return true;
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
function immutableStartConfigurationHash(seed, worldOrdinal, evolution, onboarding) {
  const material = stableStartJson({ seed, worldOrdinal, environmentModelVersion: ENVIRONMENT_MODEL_VERSION,
    environmentScheduleVersion: ENVIRONMENT_SCHEDULE_VERSION, environmentScheduleHash: ENVIRONMENT_SCHEDULE_HASH,
    onboarding, evolution });
  return hexU32(hashStringU32(material));
}
function stableStartJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableStartJson).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) =>
    `${JSON.stringify(key)}:${stableStartJson(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
function phaseOf(app) { return app.phase ?? (app.state === 'title' ? 'idle' : app.state); }
function transitionFor(phase) {
  if (phase === 'idle') return 'begin'; if (phase === 'running') return 'abort';
  if (phase === 'starting') return 'replace'; return 'restart';
}
