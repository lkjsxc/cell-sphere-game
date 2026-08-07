/** Evolution and Trophy sphere coordination outside the core app controller. */
import { buildMemorySnapshot, createMemoryFields, evolutionCellState, getMemoryNode,
  MEMORY_ATLAS_REVERSE, MEMORY_NODES, purchaseEvolutionLevel } from '../../game/skills/index.js';
import { TROPHIES, TROPHY_ATLAS_REVERSE, getTrophy } from '../../game/trophies/index.js';
import { reconcileTrophies } from '../../game/trophies/evaluator.js'; import { buildTrophySnapshot, createTrophyFields } from '../../game/trophies/scene.js';
import { createGeodesicTopology, createTopology } from '../../world/icosphere.js'; import { focusCamera } from '../../rendering/camera.js';
import { interruptCameraPolicy } from '../camera-policy.js';
import { appendEvolutionEvent, appendTrophyEvents, saveHistory } from '../../platform/history.js'; import { saveMeta } from '../../platform/storage.js';
import { saveProgressionTransaction } from '../../platform/run-transaction-store.js';
import {boundedTransactionKey} from '../../core/hash.js';
import * as ui from '../surfaces.js';

export function initializeProgression(app) { app.topo3 = createGeodesicTopology(5); app.topo2 = createTopology(2);
  app.atlasFields = createMemoryFields(app.topo3); app.trophyFields = createTrophyFields(app.topo2);
  app.memorySnapshot = null; app.trophySnapshot = null; app.evolutionActivation = { lastPurchaseAt: -Infinity }; }
export function progressionTap(app, node) {
  if(app.scene==='evolution'){const index=MEMORY_ATLAS_REVERSE[node];if(index>=0)selectEvolutionCell(app,MEMORY_NODES[index].id);return true;}
  if (app.scene === 'trophies') { const index = TROPHY_ATLAS_REVERSE[node]; if (index >= 0) selectTrophy(app, TROPHIES[index].id); return true; }
  return false;
}
export function enterEvolution(app) { app.selectScene('evolution'); }
export function presentEvolution(app, restoreCamera = false) { app.closeActiveOverlay(); app.selectedNode = null; app.makeRenderer(0, 'memory'); app.memorySnapshot = buildMemorySnapshot(app.topo3, app.meta);
  if (!restoreCamera && app.memorySnapshot.focus) focusCamera(app.camera, app.memorySnapshot.focus); app.memoryUi.syncTree(app.meta);
  ui.showMemory(app.el,app.meta,availableEvolutionLevels(app));}
export function selectEvolutionCell(app,id,source='cell'){const node=getMemoryNode(id);if(!node)return false;
  if(app.overlay==='memory-node'&&app.memoryUi.selectedId===id)return activateSelectedEvolutionCell(app,id,source);
  app.closeActiveOverlay(); app.selectedNode = node.cell;
  app.memorySnapshot = buildMemorySnapshot(app.topo, app.meta, id); app.memoryUi.openNode(node, app.meta); app.overlay = 'memory-node';
  app.surfaces.open('memory-node', app.memoryUi.panel, document.getElementById('memory-node-heading')); app.resize(true); return true; }
export function closeEvolutionCell(app){app.memoryUi.closeNode();app.surfaces.close('memory-node');if(app.overlay==='memory-node')app.overlay=null;
  app.selectedNode=null;app.memorySnapshot=buildMemorySnapshot(app.topo,app.meta);app.resize(true);interruptCameraPolicy(app.cameraPolicy,performance.now());}
export function buyEvolutionLevel(app,id,source='button'){return requestEvolutionPurchase(app,id,source)}
function activateSelectedEvolutionCell(app,id,source){
  const state = evolutionCellState(app.meta, id, id); const now = performance.now();
  if (state.reason !== 'ready') { app.memoryUi.refresh(app.meta); ui.announce(app.el, purchaseReason(state)); return false; }
  if (now - (app.evolutionActivation?.lastPurchaseAt ?? -Infinity) < 350) {
    ui.announce(app.el, 'Upgrade registered. Activate the cell again for another level.'); return false;
  }
  return requestEvolutionPurchase(app, id, source, now);
}
function requestEvolutionPurchase(app,id,source,now=performance.now()){
  if(['starting','running'].includes(app.phase)){ui.announce(app.el,'Evolution upgrades are available between worlds.');return false}
  const state=evolutionCellState(app.meta,id,id);
  const key = evolutionTransactionKey(app.meta.revision, id, state.currentLevel, state.nextLevel);
  const before = new Set(app.memorySnapshot.nodeStates.filter((node) => node.reachable).map((node) => node.id));
  const purchase = purchaseEvolutionLevel(app.meta, id, { expectedLevel:state.currentLevel,
    expectedRevision:app.meta.revision, transactionKey:key, source });
  if (!purchase.ok) { ui.announce(app.el, purchaseReason({ ...state, reason:purchase.reason })); return false; }
  const trophies = reconcileTrophies(purchase.meta, app.archive);
  let archive = appendEvolutionEvent(app.archive, { transactionKey:key, nodeId:id,
    oldLevel:purchase.oldLevel, newLevel:purchase.newLevel, cost:purchase.cost,
    balanceBefore:purchase.balanceBefore, balanceAfter:purchase.balanceAfter, run:trophies.meta.runs,
    bestEnvironmentLevelReached:trophies.meta.bestEnvironmentLevelReached, compilerVersions:purchase.compilerVersions });
  archive = appendTrophyEvents(archive, trophies.awardedIds);
  app.meta = trophies.meta; app.archive = archive;
  const persisted = saveProgressionTransaction(app.meta, app.archive, { kind:'evolution', key, retention:app.settings.historyRetention });
  app.evolutionActivation.lastPurchaseAt = now; app.trophyNotifications.sync(app.meta);
  const next = buildMemorySnapshot(app.topo, app.meta, id);
  const newly = purchase.oldLevel === '0'
    ? next.nodeStates.filter((node) => node.reachable && !before.has(node.id)).map((node) => node.id) : [];
  app.memorySnapshot=buildMemorySnapshot(app.topo,app.meta,id,newly);
  app.memoryUi.refresh(app.meta,newly,purchase.preview);ui.showMemory(app.el,app.meta,availableEvolutionLevels(app));
  const verb = purchase.oldLevel === '0' ? 'unlocked' : `upgraded to Level ${purchase.newLevel}`;
  ui.announce(app.el, `${purchase.node.nameEn} ${verb}. ${newly.length ? `${newly.length} adjacent cells are now available. ` : ''}`
    + `${trophies.awardedIds.length ? `${trophies.awardedIds.length} trophies recognized. ` : ''}`
    + `${persisted ? '' : 'Progress is temporary because browser storage is unavailable.'}`); return true;
}
function purchaseReason(state) {
  if (state.reason === 'adjacency-required') return 'This cell needs one directly adjacent Level 1 or higher cell.';
  if (state.reason === 'insufficient-echoes') return `More Echoes are required for Level ${state.nextLevel}.`;
  if (state.reason === 'stale-level' || state.reason === 'stale-revision') return 'Evolution changed; the current level and cost were refreshed.';
  if(state.reason==='duplicate-transaction')return'That Evolution upgrade was already recorded.';
  if(state.reason==='progression-security-boundary')return'This imported magnitude reached the document security boundary; no Echoes were spent.';
  return'This Evolution cell is not ready to upgrade.';
}
function evolutionTransactionKey(revision,id,currentLevel,nextLevel){
 return boundedTransactionKey('evolution-level',[revision,id,currentLevel,nextLevel])
}
export function focusAvailableEvolutionCell(app){const state=app.memorySnapshot?.nodeStates.find((node)=>!node.owned&&node.reason==='ready')
    ??app.memorySnapshot?.nodeStates.find((node)=>node.reason==='ready')
    ??app.memorySnapshot?.nodeStates.find((node)=>node.reachable&&!node.owned);if(state)selectEvolutionCell(app,state.id)}
export function availableEvolutionLevels(app){return app.memorySnapshot?.nodeStates?.filter((node)=>node.reason==='ready').length??0}
// Narrow compatibility aliases for older interface extensions and saved browser harnesses.
export const selectSkill=selectEvolutionCell,closeSkill=closeEvolutionCell,buySkill=buyEvolutionLevel,
  focusAvailableSkill=focusAvailableEvolutionCell,availableSkills=availableEvolutionLevels;

export function enterTrophies(app) { app.selectScene('trophies'); }
export function presentTrophies(app, restoreCamera = false) { app.closeActiveOverlay();
  const recognition = reconcileTrophies(app.meta, app.archive); app.meta = recognition.meta;
  app.archive = appendTrophyEvents(app.archive, recognition.awardedIds); saveHistory(app.archive, app.settings.historyRetention);
  if (!saveMeta(app.meta)) ui.announce(app.el, 'Trophy recognition is session-only because storage is unavailable.');
  app.trophyNotifications.sync(app.meta); app.selectedNode = null; app.makeRenderer(0, 'trophies'); app.trophySnapshot = buildTrophySnapshot(app.topo2, app.meta, null, app.meta.trophyQueue);
  if (!restoreCamera && app.trophySnapshot.focus) focusCamera(app.camera, app.trophySnapshot.focus); app.trophyUi.sync(app.meta); ui.showTrophies(app.el, app.meta); }
export function selectTrophy(app, id) { const trophy = getTrophy(id); if (!trophy) return;
  if (app.overlay === 'trophy-detail' && app.trophyUi.selectedId === id) return closeTrophy(app); app.closeActiveOverlay(); app.selectedNode = trophy.cell;
  focusCamera(app.camera, app.topo.positions.subarray(trophy.cell * 3, trophy.cell * 3 + 3)); interruptCameraPolicy(app.cameraPolicy, performance.now(), 60_000);
  app.trophySnapshot = buildTrophySnapshot(app.topo, app.meta, id, app.meta.trophyQueue); app.trophyUi.open(trophy, app.meta); app.overlay = 'trophy-detail';
  app.surfaces.open('trophy-detail', app.trophyUi.panel, document.getElementById('trophy-detail-heading')); app.resize(true); }
export function closeTrophy(app) { app.trophyUi.close(); app.surfaces.close('trophy-detail'); if (app.overlay === 'trophy-detail') app.overlay = null;
  app.selectedNode = null; app.trophySnapshot = buildTrophySnapshot(app.topo, app.meta, null, app.meta.trophyQueue); app.resize(true); interruptCameraPolicy(app.cameraPolicy, performance.now()); }
export function focusTrophy(app) { const id = app.meta.trophyQueue.find((candidate) => getTrophy(candidate))
    ?? TROPHIES.find((trophy) => app.meta.trophyIds.includes(trophy.id))?.id ?? TROPHIES.find((trophy) => !app.meta.trophyIds.includes(trophy.id))?.id;
  if (id) selectTrophy(app, id); }
export function reconcileBeforeHistoryClear(app) { const result = reconcileTrophies(app.meta, app.archive); app.meta = result.meta;
  app.archive = appendTrophyEvents(app.archive, result.awardedIds); app.trophyNotifications.sync(app.meta); saveMeta(app.meta); return result.awardedIds; }
