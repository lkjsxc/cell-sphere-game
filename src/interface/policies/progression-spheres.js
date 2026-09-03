/** Exact Evolution-cell and Trophy sphere coordination outside the app controller. */
import {
  EVOLUTION_LAYOUT, buildEvolutionProjection, buildEvolutionSnapshot, createEvolutionFields,
  evolutionCellState, newlyReachableEvolutionCells, purchaseEvolutionLevel,
} from '../../game/skills/index.js';
import { TROPHIES, TROPHY_ATLAS_REVERSE, getTrophy } from '../../game/trophies/index.js';
import { reconcileTrophies } from '../../game/trophies/evaluator.js';
import { buildTrophySnapshot, createTrophyFields } from '../../game/trophies/scene.js';
import { createTopology } from '../../world/icosphere.js';
import { appendEvolutionEvent, appendTrophyEvents, saveHistory } from '../../platform/history.js';
import { saveMeta } from '../../platform/storage.js';
import { saveProgressionTransaction } from '../../platform/run-transaction-store.js';
import { boundedTransactionKey } from '../../core/hash.js';
import * as ui from '../surfaces.js';

export function initializeProgression(app) {
  app.topo2 = createTopology(2); app.evolutionLayout = EVOLUTION_LAYOUT;
  app.evolutionFields = createEvolutionFields(app.topo4); app.trophyFields = createTrophyFields(app.topo2);
  app.memorySnapshot = null; app.trophySnapshot = null; app.evolutionActivation = { lastPurchaseAt: -Infinity };
}

export function progressionTap(app, cell) {
  if (app.scene === 'evolution') { selectEvolutionCell(app, cell, 'cell'); return true; }
  if (app.scene === 'trophies') { const index = TROPHY_ATLAS_REVERSE[cell]; if (index >= 0) selectTrophy(app, TROPHIES[index].id); return true; }
  return false;
}

export function enterEvolution(app) { return app.selectScene('evolution'); }
export function presentEvolution(app, restoreCamera = false) {
  app.closeActiveOverlay(); app.selectedNode = null; app.makeRenderer(0, 'memory');
  app.memorySnapshot = buildEvolutionSnapshot(app.meta);
  if (!restoreCamera && app.memorySnapshot.focus) app.focusCamera(app.memorySnapshot.focus);
  ui.showMemory(app.el, app.meta, availableEvolutionLevels(app));
}

export function selectEvolutionCell(app, cell, source = 'cell') {
  const projection = app.memorySnapshot?.evolutionProjection ?? buildEvolutionProjection(app.meta);
  const state = evolutionCellState(projection, cell, cell); if (state.cell === null) return false;
  const keyboardNavigation = source === 'keyboard';
  if (app.overlay === 'memory-node' && app.memoryUi.selectedCell === cell) {
    if (!keyboardNavigation) return activateSelectedEvolutionCell(app, cell, source);
    app.focusCamera(app.topo4.positions.subarray(cell * 3, cell * 3 + 3));
    app.memoryUi.openCell(cell, projection); app.resize(true); return true;
  }
  const surfaceOpen = app.overlay === 'memory-node';
  if (!surfaceOpen) app.closeActiveOverlay();
  app.selectedNode = cell; app.memorySnapshot = buildEvolutionSnapshot(app.meta, cell);
  if (keyboardNavigation) app.focusCamera(app.topo4.positions.subarray(cell * 3, cell * 3 + 3));
  if (surfaceOpen) app.memoryUi.openCell(cell, app.memorySnapshot.evolutionProjection);
  else {
    app.memoryUi.openCell(cell, app.memorySnapshot.evolutionProjection); app.overlay = 'memory-node';
    app.surfaces.open('memory-node', app.memoryUi.panel,
      keyboardNavigation ? null : document.getElementById('memory-node-heading'));
  }
  app.resize(true); return true;
}

export function closeEvolutionCell(app) {
  app.memoryUi.closeNode(); app.surfaces.close('memory-node'); if (app.overlay === 'memory-node') app.overlay = null;
  app.selectedNode = null; app.memorySnapshot = buildEvolutionSnapshot(app.meta); app.resize(true);
}

export function buyEvolutionLevel(app, cell, source = 'button') { return requestEvolutionPurchase(app, cell, source); }

function activateSelectedEvolutionCell(app, cell, source) {
  const state = evolutionCellState(app.memorySnapshot.evolutionProjection, cell, cell);
  if (state.reason !== 'ready') { app.memoryUi.refresh(app.memorySnapshot.evolutionProjection); ui.announce(app.el, purchaseReason(state)); return false; }
  return requestEvolutionPurchase(app, cell, source);
}

function requestEvolutionPurchase(app, cell, source, now = performance.now()) {
  const activeWorld = ['starting', 'running'].includes(app.phase);
  if (activeWorld) { ui.announce(app.el, 'Evolution upgrades are available between Worlds.'); return false; }
  if (now - (app.evolutionActivation?.lastPurchaseAt ?? -Infinity) < 350) {
    ui.announce(app.el, 'Upgrade registered. Activate the cell again for another local level.'); return false;
  }
  const beforeProjection = app.memorySnapshot?.evolutionProjection ?? buildEvolutionProjection(app.meta, cell);
  const state = evolutionCellState(beforeProjection, cell, cell);
  const key = evolutionTransactionKey(app.meta.revision, cell, state.localLevel, state.aggregateRank,
    state.nextLocalLevel, state.nextAggregateRank);
  const purchase = purchaseEvolutionLevel(app.meta, cell, {
    expectedLocalLevel: state.localLevel, expectedAggregateRank: state.aggregateRank,
    expectedRevision: app.meta.revision, transactionKey: key, source, activeWorld,
  });
  if (!purchase.ok) { ui.announce(app.el, purchaseReason({ ...state, reason: purchase.reason })); return false; }
  const trophies = reconcileTrophies(purchase.meta, app.archive);
  let archive = appendEvolutionEvent(app.archive, { transactionKey: key, cell, archetypeId: purchase.archetypeId,
    oldLocalLevel: purchase.oldLocalLevel, newLocalLevel: purchase.newLocalLevel,
    oldAggregateRank: purchase.oldAggregateRank, newAggregateRank: purchase.newAggregateRank,
    cost: purchase.cost, balanceBefore: purchase.balanceBefore, balanceAfter: purchase.balanceAfter,
    run: trophies.meta.runs, bestEnvironmentLevelReached: trophies.meta.bestEnvironmentLevelReached,
    compilerVersions: purchase.compilerVersions });
  archive = appendTrophyEvents(archive, trophies.awardedIds);
  app.meta = trophies.meta; app.archive = archive;
  const persisted = saveProgressionTransaction(app.meta, app.archive, { kind: 'evolution', key });
  app.evolutionActivation.lastPurchaseAt = now; app.trophyNotifications.sync(app.meta);
  const afterProjection = buildEvolutionProjection(app.meta, cell, [cell]);
  const newly = purchase.oldLocalLevel === '0' ? newlyReachableEvolutionCells(beforeProjection, afterProjection) : [];
  app.memorySnapshot = buildEvolutionSnapshot(app.meta, cell, [cell]);
  app.memoryUi.refresh(app.memorySnapshot.evolutionProjection, newly, purchase.preview);
  ui.showMemory(app.el, app.meta, availableEvolutionLevels(app));
  const verb = purchase.oldLocalLevel === '0' ? 'established' : `strengthened to Local Level ${purchase.newLocalLevel}`;
  ui.announce(app.el, `Cell ${cell + 1}, ${purchase.archetype.nameEn}, ${verb}. Shared rank ${purchase.newAggregateRank}. `
    + `${newly.length ? `${newly.length} neighboring cells are now reachable. ` : ''}`
    + `${trophies.awardedIds.length ? `${trophies.awardedIds.length} Trophies recognized. ` : ''}`
    + `${persisted ? '' : 'Progress is temporary because browser storage is unavailable.'}`);
  return true;
}

function purchaseReason(state) {
  if (state.reason === 'world-active') return 'Evolution upgrades are available between Worlds.';
  if (state.reason === 'adjacency-required') return 'This cell needs one directly adjacent owned cell.';
  if (state.reason === 'insufficient-echoes') return `More Echoes are required for the next shared archetype rank.`;
  if (['stale-local-level', 'stale-aggregate-rank', 'stale-revision'].includes(state.reason)) return 'Evolution changed; the local level, shared rank, and cost were refreshed.';
  if (state.reason === 'duplicate-transaction') return 'That Evolution cell upgrade was already recorded.';
  if (state.reason === 'progression-security-boundary') return 'This imported magnitude reached the document security boundary; no Echoes were spent.';
  return 'This Evolution cell is not ready to strengthen.';
}

function evolutionTransactionKey(revision, cell, localLevel, aggregateRank, nextLocalLevel, nextAggregateRank) {
  return boundedTransactionKey('evolution-cell-level', [revision, cell, localLevel, aggregateRank, nextLocalLevel, nextAggregateRank]);
}

export function availableEvolutionLevels(app) { return app.memorySnapshot?.evolutionProjection?.readyCells?.length ?? 0; }
export function enterTrophies(app) { app.selectScene('trophies'); }
export function presentTrophies(app, restoreCamera = false) { app.closeActiveOverlay();
  const recognition = reconcileTrophies(app.meta, app.archive); app.meta = recognition.meta;
  app.archive = appendTrophyEvents(app.archive, recognition.awardedIds); saveHistory(app.archive);
  if (!saveMeta(app.meta)) ui.announce(app.el, 'Trophy recognition is session-only because storage is unavailable.');
  app.trophyNotifications.sync(app.meta); app.selectedNode = null; app.makeRenderer(0, 'trophies'); app.trophySnapshot = buildTrophySnapshot(app.topo2, app.meta, null, app.meta.trophyQueue);
  if (!restoreCamera && app.trophySnapshot.focus) app.focusCamera(app.trophySnapshot.focus); app.trophyUi.sync(app.meta); ui.showTrophies(app.el, app.meta); }
export function selectTrophy(app, id) { const trophy = getTrophy(id); if (!trophy) return;
  if (app.overlay === 'trophy-detail' && app.trophyUi.selectedId === id) return closeTrophy(app); app.closeActiveOverlay(); app.selectedNode = trophy.cell;
  app.focusCamera(app.topo.positions.subarray(trophy.cell * 3, trophy.cell * 3 + 3));
  app.trophySnapshot = buildTrophySnapshot(app.topo, app.meta, id, app.meta.trophyQueue); app.trophyUi.open(trophy, app.meta); app.overlay = 'trophy-detail';
  app.surfaces.open('trophy-detail', app.trophyUi.panel, document.getElementById('trophy-detail-heading')); app.resize(true); }
export function closeTrophy(app) { app.trophyUi.close(); app.surfaces.close('trophy-detail'); if (app.overlay === 'trophy-detail') app.overlay = null;
  app.selectedNode = null; app.trophySnapshot = buildTrophySnapshot(app.topo, app.meta, null, app.meta.trophyQueue); app.resize(true); }
export function reconcileBeforeHistoryClear(app) { const result = reconcileTrophies(app.meta, app.archive); app.meta = result.meta;
  app.archive = appendTrophyEvents(app.archive, result.awardedIds); app.trophyNotifications.sync(app.meta); saveMeta(app.meta); return result.awardedIds; }
