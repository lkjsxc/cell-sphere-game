/** Coordinates live/past visual History without becoming simulation authority. */
import { decodeVisualHistory } from '../history/codec.js';
import { createPreviewBuffers, nearestFrame, projectPreview } from '../history/preview.js';
import { createRecentRuns } from '../platform/recent-runs.js';
import { identityFields, sameWorldIdentity } from '../core/world-session.js';

export function createHistoryPlayback(app) {
  const recent = createRecentRuns(); const loads = createHistoryLoadGuard(); const requests = new Map();
  let requestId = 0; let decoded = null; let buffers = null; let seedBefore = null; let progressionBefore = null;
  function request(kind, record = null) {
    const id = ++requestId; const identity = app.worldIdentity; if (!identity) return null;
    requests.set(id, { kind, record, generation: app.driver.generation, identity });
    app.driver.message({ t: 'history-buffer', requestId: id, ...identityFields(identity) }); return id;
  }
  function handle(message) {
    if (message.t !== 'history-buffer') return false; const pending = requests.get(message.requestId);
    requests.delete(message.requestId); if (!pending || pending.generation !== app.driver.generation
      || !sameWorldIdentity(pending.identity, message) || !sameWorldIdentity(message, app.worldIdentity)) return true;
    let value; try { value = decodeVisualHistory(message.buffer); } catch { return true; }
    if (pending.kind === 'save') { recent.put({ ...pending.record, buffer: message.buffer }); return true; }
    if (app.historyUi.surface.hidden || app.historyUi.worldId !== 'current' || value.seed !== app.runSeed) return true;
    useDecoded(value); app.historyUi.setAvailability(true);
    if (app.historyUi.selectedWorld) seek(app.historyUi.tick, null, app.historyUi.selectedWorld); return true;
  }
  function save(record) { if (record) request('save', record); }
  function open(scope = null) {
    const phase = app.phase ?? app.state; const scene = app.scene ?? (app.state === 'memory' ? 'evolution' : app.state);
    seedBefore = app.visualSeed; progressionBefore = ['evolution', 'trophies'].includes(scene) ? scene : null; decoded = null; buffers = null; app.historySnapshot = null; app.historyHighlights = [];
    const worlds = [];
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
    app.historySnapshot = null; app.historyHighlights = []; decoded = null; buffers = null;
    if (world.current) { restoreFields(); request('view'); app.historyUi.setAvailability(null); return; }
    app.makeRenderer(world.seed, 'history'); app.resize(true);
    if (world.id === 'empty') { app.historyUi.setAvailability(false, 'No completed semantic or visual History exists yet.'); return; }
    app.historyUi.setAvailability(null);
    recent.get(world.id).then((record) => {
      if (!loads.isCurrent(token) || presentationGeneration !== app.presentationGeneration
        || app.historyUi.surface.hidden || app.historyUi.worldId !== world.id) return;
      if (!record) { app.historyUi.setAvailability(false); return; }
      try { const value = decodeVisualHistory(record.buffer); if (value.seed !== world.seed) throw new Error('seed mismatch');
        useDecoded(value); app.historyUi.setAvailability(true); seek(world.tick, world.events.at(-1), world); }
      catch { app.historyUi.setAvailability(false, 'Stored visual detail was invalid; semantic events remain.'); }
    });
  }
  function seek(tick, event, world) {
    app.historyHighlights = event?.primaryCells?.slice(0, 8) ?? [];
    if (!decoded || decoded.seed !== world.seed) { app.historyUi.updateFrame(tick, app.snapshot?.tick ?? world.tick); return; }
    const frame = nearestFrame(decoded.frames, tick); const preview = projectPreview(frame, buffers);
    app.historySnapshot = world.current && app.worldIdentity ? { ...preview, ...identityFields(app.worldIdentity) } : preview;
    app.historyUi.updateFrame(frame.tick, app.snapshot?.tick ?? world.tick);
  }
  function live() {
    loads.invalidate(); app.historySnapshot = null; app.historyHighlights = []; restoreFields();
    app.historyUi.updateFrame(app.snapshot?.tick ?? 0, app.snapshot?.tick ?? 0);
  }
  function close() { loads.invalidate(); requests.forEach((value, key) => { if (value.kind === 'view') requests.delete(key); });
    app.historySnapshot = null; app.historyHighlights = []; restoreFields(); decoded = null; buffers = null; }
  function retire() { loads.invalidate(); requests.clear(); app.historySnapshot = null; app.historyHighlights = [];
    decoded = null; buffers = null; seedBefore = null; progressionBefore = null; }
  function restoreFields() {
    if (progressionBefore && app.topo !== (progressionBefore === 'evolution' ? app.topo3 : app.topo2)) { app.makeRenderer(0, progressionBefore === 'evolution' ? 'memory' : 'trophies'); app.resize(true); return; }
    if (!progressionBefore && seedBefore != null && (app.visualSeed !== seedBefore || app.topo !== app.topo4)) { app.makeRenderer(seedBefore); app.resize(true); }
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
