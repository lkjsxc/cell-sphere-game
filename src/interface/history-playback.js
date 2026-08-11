/** Coordinates truthful live/past visual History without becoming simulation authority. */
import { decodeVisualHistory } from '../history/codec.js';
import { createPreviewBuffers, nearestFrame, projectPreview } from '../history/preview.js';
import { createRecentRuns } from '../platform/recent-runs.js';
import { identityFields, sameWorldIdentity } from '../core/world-session.js';

export function createHistoryPlayback(app) {
  const recent = createRecentRuns(); const loads = createHistoryLoadGuard(); const requests = new Map();
  let requestId = 0; let decoded = null; let buffers = null; let seedBefore = null; let progressionBefore = null;
  function request(kind, record = null, loadToken = null) {
    const id = ++requestId; const identity = app.worldIdentity; if (!identity) return null;
    requests.set(id, { kind, record, loadToken, generation: app.driver.generation, identity });
    app.driver.message({ t: 'history-buffer', requestId: id, ...identityFields(identity) }); return id;
  }
  function handle(message) {
    if (message.t !== 'history-buffer') return false; const pending = requests.get(message.requestId);
    requests.delete(message.requestId); if (!pending || pending.generation !== app.driver.generation
      || !sameWorldIdentity(pending.identity, message) || !sameWorldIdentity(message, app.worldIdentity)
      || (pending.kind === 'view' && !loads.isCurrent(pending.loadToken))) return true;
    let value; try { value = decodeVisualHistory(message.buffer); } catch {
      if (pending.kind === 'view') unavailableCurrent('Visual checkpoints were invalid; showing semantic History only.');
      return true;
    }
    if (pending.kind === 'save') { recent.put({ ...pending.record, buffer: message.buffer }); return true; }
    const world = app.historyUi.selectedWorld;
    if (app.historyUi.surface.hidden || app.historyUi.worldId !== 'current' || !world?.current) return true;
    if (value.seed !== app.runSeed || value.cellCount !== app.topo4.nodeCount) {
      unavailableCurrent('Visual checkpoints did not match this World; showing semantic History only.'); return true;
    }
    useDecoded(value); app.historyUi.setAvailability(true);
    if (app.historyUi.isLive) presentLive(world); else seek(app.historyUi.tick, app.historyUi.selectedEvent, world);
    return true;
  }
  function save(record, visualHistoryBuffer = null) {
    if (!record) return;
    if (visualHistoryBuffer instanceof ArrayBuffer) { recent.put({ ...record, buffer: visualHistoryBuffer }); return; }
    request('save', record);
  }
  function open(scope = null) {
    const phase = app.phase ?? app.state; const scene = app.scene ?? (app.state === 'memory' ? 'evolution' : app.state);
    seedBefore = app.visualSeed; progressionBefore = ['evolution', 'trophies'].includes(scene) ? scene : null;
    clearPreview(); const worlds = [];
    if (['starting', 'running', 'result'].includes(phase)) worlds.push({ id: 'current', current: true, terminal: phase === 'result',
      label: phase === 'result' ? `Latest world · seed ${app.runSeed}` : `Current world · seed ${app.runSeed}`,
      seed: app.runSeed, tick: app.lastResult?.tick ?? app.snapshot?.tick ?? 0, events: app.currentHistory });
    for (const item of app.archive.worlds.slice().reverse()) worlds.push({ ...item, current: false,
      label: `${item.archetype} · ${item.score.toLocaleString('en')} · seed ${item.seed}`, tick: item.tick });
    if (!worlds.length) worlds.push({ id: 'empty', current: false, label: 'No completed worlds', seed: seedBefore, tick: 0, events: [] });
    const defaultId = scope === 'current' ? 'current' : scope === 'past' ? worlds.find((item) => !item.current)?.id
      : worlds.some((item) => item.id === scope) ? scope : worlds[0].id;
    app.openFull('history'); app.historyUi.open({ worlds, liveTick: app.snapshot?.tick ?? 0 }, defaultId);
    app.activateSurface('history', app.historyUi.surface, 'history-heading');
  }
  function selectWorld(world) {
    const token = loads.next(); const presentationGeneration = app.presentationGeneration;
    clearPreview();
    if (world.current) {
      restoreFields(); app.historyUi.setAvailability(null, 'Loading this World’s device-local visual checkpoints…'); request('view', null, token); return;
    }
    app.historyPlaybackActive = true; app.makeRenderer(world.seed, 'history'); app.resize(true);
    if (world.id === 'empty') {
      app.historyUi.setAvailability(false, 'No completed semantic or visual History exists yet.'); return;
    }
    app.historyUi.setAvailability(null, 'Loading this World’s device-local visual checkpoints…');
    recent.get(world.id).then((record) => {
      if (!loads.isCurrent(token) || presentationGeneration !== app.presentationGeneration
        || app.historyUi.surface.hidden || app.historyUi.worldId !== world.id) return;
      if (!record) { unavailable(world); return; }
      try {
        const value = decodeVisualHistory(record.buffer);
        if (value.seed !== world.seed || value.cellCount !== app.topo.nodeCount) throw new Error('visual checkpoint mismatch');
        useDecoded(value); app.historyUi.setAvailability(true); seek(app.historyUi.tick, app.historyUi.selectedEvent, world);
      } catch { unavailable(world, 'Stored visual detail was invalid; semantic History remains.'); }
    });
  }
  function seek(tick, event, world) {
    app.historyHighlights = event?.primaryCells?.slice(0, 8) ?? [];
    if (!decoded || decoded.seed !== world.seed) {
      if (world.current) {
        clearPresentation(); const mode = app.historyUi.isLive ? world.terminal ? 'final' : 'live'
          : app.historyUi.visualAvailable === false ? 'semantic' : 'loading';
        app.historyUi.updateFrame(tick, app.snapshot?.tick ?? world.tick, { mode });
      } else {
        app.historyPlaybackActive = true; app.historySnapshot = null;
        app.historyUi.updateFrame(tick, world.tick, { mode: app.historyUi.visualAvailable === false ? 'semantic' : 'loading' });
      }
      return false;
    }
    const frame = nearestFrame(decoded.frames, tick);
    if (!frame) return false;
    const preview = projectPreview(frame, buffers);
    app.historySnapshot = Object.freeze({ ...preview, historyWorldId: world.id, historyFrameTick: frame.tick,
      ...(world.current && app.worldIdentity ? identityFields(app.worldIdentity) : {}) });
    app.historyPlaybackActive = true;
    app.historyUi.setAvailability(true); app.historyUi.updateFrame(frame.tick, app.snapshot?.tick ?? world.tick, { mode: 'visual' });
    return true;
  }
  function unavailable(world, message = '') {
    app.historyUi.setAvailability(false, message);
    seek(app.historyUi.tick, app.historyUi.selectedEvent, world);
  }
  function unavailableCurrent(message) {
    const world = app.historyUi.selectedWorld;
    if (app.historyUi.surface.hidden || app.historyUi.worldId !== 'current' || !world?.current) return;
    unavailable(world, message);
  }
  function presentLive(world = app.historyUi.selectedWorld) {
    clearPresentation(); restoreFields();
    const tick = app.snapshot?.tick ?? world?.tick ?? 0;
    app.historyUi.updateFrame(tick, tick, { mode: world?.terminal ? 'final' : 'live' });
  }
  function live() {
    loads.invalidate(); app.historyHighlights = []; presentLive();
  }
  function close() {
    loads.invalidate(); requests.forEach((value, key) => { if (value.kind === 'view') requests.delete(key); });
    clearPreview(); restoreFields();
  }
  function retire() {
    loads.invalidate(); requests.clear(); clearPreview();
    seedBefore = null; progressionBefore = null;
  }
  function clearPresentation() {
    app.historySnapshot = null; app.historyHighlights = []; app.historyPlaybackActive = false;
  }
  function clearPreview() { clearPresentation(); decoded = null; buffers = null; }
  function restoreFields() {
    if (progressionBefore && app.topo !== (progressionBefore === 'evolution' ? app.topo3 : app.topo2)) {
      app.makeRenderer(0, progressionBefore === 'evolution' ? 'memory' : 'trophies'); app.resize(true); return;
    }
    if (!progressionBefore && seedBefore != null && (app.visualSeed !== seedBefore || app.topo !== app.topo4)) {
      app.makeRenderer(seedBefore); app.resize(true);
    }
  }
  function useDecoded(value) { decoded = value; buffers = createPreviewBuffers(value.cellCount); }
  return { open, close, retire, handle, save, selectWorld, seek, live, clear: () => recent.clear(),
    get pendingRequests() { return requests.size; }, get recentRuns() { return recent; } };
}

export function createHistoryLoadGuard() {
  let generation = 0;
  return { next() { return ++generation; }, invalidate() { generation++; }, isCurrent(value) { return value === generation; },
    get generation() { return generation; } };
}
