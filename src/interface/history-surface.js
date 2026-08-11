/** One-scroll-owner temporal History controls over the visible world. */
const TITLES = Object.freeze({
  'run.world.created': ['World generated', 'A new autonomous ecology took shape.'],
  'run.inoculation.selected': ['Life chose its origin', 'A suitable seeded cell became the origin.'],
  'run.germination': ['Germination', 'The first living cells opened.'],
  'run.phase.abundance': ['Abundance', 'Resources supported rapid expansion.'],
  'run.phase.instability': ['Instability', 'Environmental pressure began to dominate.'],
  'run.phase.collapse': ['Collapse', 'The world entered its terminal phase.'],
  'environment.level.transition': ['Environment Level reached', 'Authoritative world time increased this world’s chronic environmental pressure.'],
  'run.extinct': ['Extinction', 'The last living cell released its energy.'],
  'run.abandoned': ['World left behind', 'No Echoes, score reward, trophy, or Imprint was granted.'],
  'resource.reserve.threshold': ['Reachable reserves declined', 'Growth consumed finite local stock faster than renewal replaced it.'],
  'geo.coast.reached': ['First coast reached', 'Life encountered the ocean margin.'],
  'geo.lake.reached': ['First lake reached', 'Life entered a connected whole-cell freshwater basin.'],
  'geo.forest.reached': ['First forest reached', 'The network entered dense living ground.'],
  'geo.mountain.reached': ['First highland reached', 'Expansion climbed into costly terrain.'],
  'geo.wetland.reached': ['First wetland reached', 'Rich saturated ground joined the network.'],
  'geo.world_knot.reached': ['World Knot reached', 'Life touched a fivefold cell.'],
  'morph.loop.first': ['First loop formed', 'Living cells enclosed a resilient circuit.'],
  'morph.component.split': ['Network split', 'Living tissue separated into components.'],
  'morph.component.reconnected': ['Network reconnected', 'Separated components joined again.'],
  'trophy.earned': ['Trophy preserved', 'A difficult criterion became permanent progression exactly once.'],
});

export function createHistorySurface(options) {
  const surface = byId('history-dialog'); const worldSelect = byId('history-world'); const range = byId('history-range');
  const prev = byId('history-prev'); const next = byId('history-next'); const latest = byId('history-live');
  const time = byId('history-time-label'); const selected = byId('history-selected'); const note = byId('history-visual-note');
  const list = byId('history-list'); const filter = byId('history-filter');
  let model = null; let world = null; let events = []; let eventIndex = -1; let raf = 0;
  let visualAvailable = null; let viewingLive = false;
  byId('history-close').addEventListener('click', options.onClose);
  worldSelect.addEventListener('change', () => chooseWorld(worldSelect.value));
  filter.addEventListener('change', () => renderList());
  range.addEventListener('input', () => { viewingLive = false; cancelAnimationFrame(raf); raf = requestAnimationFrame(() => seek(Number(range.value))); });
  prev.addEventListener('click', () => navigate(-1)); next.addEventListener('click', () => navigate(1));
  latest.addEventListener('click', () => {
    if (world?.current) { viewingLive = true; options.onLive(); return; }
    viewingLive = false; seek(world?.tick ?? 0);
  });

  function chooseWorld(id) {
    world = model.worlds.find((item) => item.id === id) ?? model.worlds[0]; if (!world) return;
    worldSelect.value = world.id; events = world.events ?? []; range.max = String(Math.max(0, world.tick));
    const viewingTick = world.current ? Math.min(world.tick, model.liveTick) : world.tick;
    range.value = String(viewingTick); latest.textContent = world.terminal ? 'Final' : world.current ? 'Live' : 'Latest';
    viewingLive = world.current; eventIndex = nearestEvent(events, viewingTick); renderSelected(); renderList(); setAvailability(null);
    options.onSeek(Number(range.value), events[eventIndex] ?? null, world); options.onWorld(world);
  }
  function seek(tick) {
    const value = Math.max(0, Math.min(world?.tick ?? 0, Math.floor(tick))); range.value = String(value);
    eventIndex = nearestEvent(events, value); renderSelected(); renderList(); options.onSeek(value, events[eventIndex] ?? null, world);
  }
  function navigate(delta) {
    if (!events.length || visualAvailable !== true) return;
    viewingLive = false; eventIndex = Math.max(0, Math.min(events.length - 1, eventIndex + delta));
    const event = events[eventIndex]; range.value = String(event.tick); renderSelected(); renderList(); options.onSeek(event.tick, event, world);
  }
  function renderSelected() {
    const event = events[eventIndex]; syncControls();
    if (!event) { selected.textContent = 'No semantic History record exists at this time.'; return; }
    const [title, detail] = describeHistoryEvent(event); selected.replaceChildren(strong(title), document.createTextNode(` — ${detail}`));
  }
  function renderList() {
    const visible = events.filter((event) => filter.value === 'all' || historyEventCategory(event) === filter.value).slice(-80);
    list.replaceChildren(...visible.map((event) => {
      const index = events.indexOf(event); const current = index === eventIndex;
      const row = document.createElement('li'); row.className = 'history-entry'; const button = document.createElement('button');
      button.type = 'button'; button.className = `history-event-btn${current ? ' is-selected' : ''}`;
      if (current) button.setAttribute('aria-current', 'true');
      const [title, detail] = describeHistoryEvent(event);
      button.append(strong(`${historyGameTime(event.tick)} · ${title}`), document.createTextNode(detail));
      button.addEventListener('click', () => { viewingLive = false; eventIndex = index; seek(event.tick); }); row.append(button); return row;
    }));
    if (!visible.length) { const empty = document.createElement('li'); empty.className = 'history-entry'; empty.textContent = 'No History records in this category.'; list.append(empty); }
  }
  function setAvailability(available, message = '') {
    visualAvailable = available; syncControls(); note.hidden = available === true;
    note.textContent = message || (available === false
      ? 'Visual checkpoint unavailable. Showing semantic History only.'
      : 'Loading device-local visual checkpoints…');
  }
  function syncControls() {
    const ready = visualAvailable === true;
    range.disabled = !ready; prev.disabled = !ready || eventIndex <= 0;
    next.disabled = !ready || eventIndex < 0 || eventIndex >= events.length - 1;
    latest.disabled = !world?.current && !ready;
  }
  function updateCurrentWorld(nextModel) {
    if (!model || surface.hidden) return false;
    const current = model.worlds.find((item) => item.current); if (!current) return false;
    const previousTick = Math.max(0, current.tick ?? 0); const previousLiveTick = Math.max(0, model.liveTick ?? previousTick);
    const selectedTick = Number(range.value); const followLive = world?.current && viewingLive && selectedTick >= Math.min(previousTick, previousLiveTick);
    current.events = Array.isArray(nextModel?.events) ? nextModel.events.slice(-80) : [];
    current.tick = Math.max(previousTick, Math.max(0, Math.floor(nextModel?.tick ?? previousTick)));
    model.liveTick = Math.max(previousLiveTick, Math.max(0, Math.floor(nextModel?.liveTick ?? current.tick)));
    if (!world?.current) return true;
    world = current; events = current.events; range.max = String(current.tick);
    const targetTick = followLive ? Math.min(current.tick, model.liveTick) : Math.min(Math.max(0, selectedTick), current.tick);
    range.value = String(targetTick); eventIndex = nearestEvent(events, targetTick); if (followLive) viewingLive = true;
    latest.textContent = world.terminal ? 'Final' : 'Live'; renderSelected(); renderList();
    if (followLive) options.onSeek(targetTick, events[eventIndex] ?? null, world);
    return true;
  }
  function updateFrame(frameTick, liveTick = world?.tick ?? 0, presentation = {}) {
    const mode = presentation.mode ?? 'visual'; const frame = Math.max(0, Math.floor(frameTick ?? 0));
    if (mode === 'live') { time.textContent = `Live state · ${historyGameTime(frame)}`; return; }
    if (mode === 'final') { time.textContent = `Final state · ${historyGameTime(frame)}`; return; }
    if (mode === 'loading') { time.textContent = `Visual checkpoint loading · semantic time ${historyGameTime(frame)}`; return; }
    if (mode === 'semantic') { time.textContent = `Semantic History only · ${historyGameTime(frame)}`; return; }
    const behind = world?.current && liveTick > frame ? ` · ${historyGameTime(liveTick - frame)} behind live` : '';
    time.textContent = `${historyGameTime(frame)}${behind} · historical visual checkpoint`;
  }
  return { surface, open(nextModel, defaultId) { model = nextModel; filter.value = 'all';
      worldSelect.replaceChildren(...model.worlds.map((item) => {
        const option = document.createElement('option'); option.value = item.id; option.textContent = item.label; return option; }));
      surface.hidden = false; chooseWorld(model.worlds.some((item) => item.id === defaultId) ? defaultId : model.worlds[0]?.id); },
    close() { cancelAnimationFrame(raf); raf = 0; surface.hidden = true; },
    reset() { cancelAnimationFrame(raf); raf = 0; surface.hidden = true; model = null; world = null; events = []; eventIndex = -1;
      visualAvailable = null; viewingLive = false; list.replaceChildren(); selected.textContent = ''; range.value = '0'; range.max = '0'; syncControls(); },
    setAvailability, updateCurrentWorld, updateFrame, get worldId() { return world?.id ?? null; },
    get selectedWorld() { return world; }, get selectedEvent() { return events[eventIndex] ?? null; },
    get tick() { return Number(range.value); }, get visualAvailable() { return visualAvailable; }, get isLive() { return viewingLive; } };
}
function nearestEvent(events, tick) { let best = -1; let distance = Infinity;
  events.forEach((event, index) => { const d = Math.abs(event.tick - tick); if (d < distance) { best = index; distance = d; } }); return best; }
export function describeHistoryEvent(event) { const base = TITLES[event.key] ?? [humanize(event.key), 'A meaningful change was preserved.'];
  const subject = event.subjectId ? ` · ${humanize(event.subjectId)}` : ''; return [base[0] + subject, base[1]]; }
export function historyEventCategory(event) { if (event.kind === 'environment') return 'environment';
  if (event.kind === 'trophy') return 'life'; if (event.key.startsWith('geo.') || event.key.startsWith('run.world')) return 'world'; return 'life'; }
export function historyGameTime(tick) { const seconds = Math.floor(tick / 10); return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }
function humanize(value) { return String(value).split(/[.-]/).at(-1).replaceAll('_', ' ').replace(/^./, (c) => c.toUpperCase()); }
function strong(text) { const node = document.createElement('strong'); node.textContent = text; return node; }
function byId(id) { return /** @type {HTMLElement} */ (document.getElementById(id)); }
