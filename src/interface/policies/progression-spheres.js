/** Evolution and Trophy sphere coordination outside the core app controller. */
import { buildMemorySnapshot, createMemoryFields, getMemoryNode, MEMORY_ATLAS_REVERSE, MEMORY_NODES, purchaseMemory } from '../../game/skills/index.js';
import { TROPHIES, TROPHY_ATLAS_REVERSE, getTrophy } from '../../game/trophies/index.js';
import { reconcileTrophies } from '../../game/trophies/evaluator.js'; import { buildTrophySnapshot, createTrophyFields } from '../../game/trophies/scene.js';
import { createTopology } from '../../world/icosphere.js'; import { focusCamera } from '../../rendering/camera.js';
import { interruptCameraPolicy } from '../camera-policy.js';
import { appendMemoryEvent, saveHistory } from '../../platform/history.js'; import { saveMeta } from '../../platform/storage.js';
import * as ui from '../surfaces.js';

export function initializeProgression(app) { app.topo3 = createTopology(3); app.topo2 = createTopology(2);
  app.atlasFields = createMemoryFields(app.topo3); app.trophyFields = createTrophyFields(app.topo2);
  app.memorySnapshot = null; app.trophySnapshot = null; app.pendingTrophyIds = []; }
export function progressionTap(app, node) {
  if (app.scene === 'evolution') { const index = MEMORY_ATLAS_REVERSE[node]; if (index >= 0) selectSkill(app, MEMORY_NODES[index].id); return true; }
  if (app.scene === 'trophies') { const index = TROPHY_ATLAS_REVERSE[node]; if (index >= 0) selectTrophy(app, TROPHIES[index].id); return true; }
  return false;
}
export function enterEvolution(app) { app.selectScene('evolution'); }
export function presentEvolution(app, restoreCamera = false) { app.closeActiveOverlay(); app.selectedNode = null; app.makeRenderer(0, 'memory'); app.memorySnapshot = buildMemorySnapshot(app.topo3, app.meta);
  if (!restoreCamera && app.memorySnapshot.focus) focusCamera(app.camera, app.memorySnapshot.focus); app.memoryUi.syncTree(app.meta);
  ui.showMemory(app.el, app.meta, availableSkills(app)); }
export function selectSkill(app, id) { const node = getMemoryNode(id); if (!node) return;
  if (app.overlay === 'memory-node' && app.memoryUi.selectedId === id) return closeSkill(app); app.closeActiveOverlay(); app.selectedNode = node.cell;
  focusCamera(app.camera, app.topo.positions.subarray(node.cell * 3, node.cell * 3 + 3)); interruptCameraPolicy(app.cameraPolicy, performance.now(), 60_000);
  app.memorySnapshot = buildMemorySnapshot(app.topo, app.meta, id); app.memoryUi.openNode(node, app.meta); app.overlay = 'memory-node';
  app.surfaces.open('memory-node', app.memoryUi.panel, document.getElementById('memory-node-heading')); app.resize(true); }
export function closeSkill(app) { app.memoryUi.closeNode(); app.surfaces.close('memory-node'); if (app.overlay === 'memory-node') app.overlay = null;
  app.selectedNode = null; app.memorySnapshot = buildMemorySnapshot(app.topo, app.meta); app.resize(true); interruptCameraPolicy(app.cameraPolicy, performance.now()); }
export function buySkill(app, id) { const before = new Set(app.memorySnapshot.nodeStates.filter((node) => node.reachable).map((node) => node.id));
  const purchase = purchaseMemory(app.meta, id); if (!purchase.ok) return; const trophies = reconcileTrophies(purchase.meta, app.archive);
  if (!saveMeta(trophies.meta)) return ui.announce(app.el, 'That skill could not be stored; no Echoes were spent.');
  app.meta = trophies.meta; app.pendingTrophyIds.push(...trophies.awardedIds); app.archive = appendMemoryEvent(app.archive, id, purchase.spent, app.meta.echoBalance, app.meta.runs);
  saveHistory(app.archive, app.settings.historyRetention); const next = buildMemorySnapshot(app.topo, app.meta, id);
  const newly = next.nodeStates.filter((node) => node.reachable && !before.has(node.id)).map((node) => node.id); app.memorySnapshot = buildMemorySnapshot(app.topo, app.meta, id, newly);
  app.memoryUi.refresh(app.meta, newly); ui.showMemory(app.el, app.meta, availableSkills(app));
  ui.announce(app.el, `${purchase.node.nameEn} unlocked. ${newly.length} adjacent skills are now available.${trophies.awardedIds.length ? ` ${trophies.awardedIds.length} trophies recognized.` : ''}`); }
export function focusAvailableSkill(app) { const state = app.memorySnapshot?.nodeStates.find((node) => node.reachable && !node.owned && node.affordable)
    ?? app.memorySnapshot?.nodeStates.find((node) => node.reachable && !node.owned); if (state) selectSkill(app, state.id); }
export function availableSkills(app) { return app.memorySnapshot?.nodeStates?.filter((node) => node.reachable && !node.owned).length ?? 0; }

export function enterTrophies(app) { app.selectScene('trophies'); }
export function presentTrophies(app, restoreCamera = false) { app.closeActiveOverlay();
  const recognition = reconcileTrophies(app.meta, app.archive); app.meta = recognition.meta; app.pendingTrophyIds.push(...recognition.awardedIds);
  if (!saveMeta(app.meta)) ui.announce(app.el, 'Trophy recognition is session-only because storage is unavailable.');
  app.selectedNode = null; app.makeRenderer(0, 'trophies'); app.trophySnapshot = buildTrophySnapshot(app.topo2, app.meta, null, app.pendingTrophyIds);
  if (!restoreCamera && app.trophySnapshot.focus) focusCamera(app.camera, app.trophySnapshot.focus); app.trophyUi.sync(app.meta); ui.showTrophies(app.el, app.meta);
  if (recognition.awardedIds.length) ui.announce(app.el, `${recognition.awardedIds.length} trophies recognized from preserved evidence.`); }
export function selectTrophy(app, id) { const trophy = getTrophy(id); if (!trophy) return;
  if (app.overlay === 'trophy-detail' && app.trophyUi.selectedId === id) return closeTrophy(app); app.closeActiveOverlay(); app.selectedNode = trophy.cell;
  focusCamera(app.camera, app.topo.positions.subarray(trophy.cell * 3, trophy.cell * 3 + 3)); interruptCameraPolicy(app.cameraPolicy, performance.now(), 60_000);
  app.trophySnapshot = buildTrophySnapshot(app.topo, app.meta, id, app.pendingTrophyIds); app.trophyUi.open(trophy, app.meta); app.overlay = 'trophy-detail';
  app.surfaces.open('trophy-detail', app.trophyUi.panel, document.getElementById('trophy-detail-heading')); app.resize(true); }
export function closeTrophy(app) { app.trophyUi.close(); app.surfaces.close('trophy-detail'); if (app.overlay === 'trophy-detail') app.overlay = null;
  app.selectedNode = null; app.trophySnapshot = buildTrophySnapshot(app.topo, app.meta, null, app.pendingTrophyIds); app.resize(true); interruptCameraPolicy(app.cameraPolicy, performance.now()); }
export function focusTrophy(app) { const id = app.pendingTrophyIds.find((candidate) => getTrophy(candidate))
    ?? TROPHIES.find((trophy) => app.meta.trophyIds.includes(trophy.id))?.id ?? TROPHIES.find((trophy) => !app.meta.trophyIds.includes(trophy.id))?.id;
  if (id) selectTrophy(app, id); }
export function reconcileBeforeHistoryClear(app) { const result = reconcileTrophies(app.meta, app.archive); app.meta = result.meta;
  app.pendingTrophyIds.push(...result.awardedIds); saveMeta(app.meta); return result.awardedIds; }
