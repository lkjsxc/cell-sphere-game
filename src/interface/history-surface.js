/** Nonmodal temporal History controls over the visible world. */
const TITLES = Object.freeze({
  'run.world.created': ['World generated', 'A new autonomous ecology took shape.'],
  'run.inoculation.selected': ['Life chose its origin', 'A suitable seeded cell became the origin.'],
  'run.germination': ['Germination', 'The first living cells opened.'],
  'run.phase.abundance': ['Abundance', 'Resources supported rapid expansion.'],
  'run.phase.instability': ['Instability', 'Environmental pressure began to dominate.'],
  'run.phase.collapse': ['Collapse', 'The world entered its terminal phase.'],
  'environment.level.transition': ['Environment Level reached', 'Authoritative world time increased this world’s chronic environmental pressure.'],
  'adaptation.offered': ['Legacy Adaptation offered', 'An archived retired choice entered this old world.'],
  'adaptation.selected.random': ['Legacy Adaptation chosen automatically', 'An archived world selected one retired option.'],
  'adaptation.selected.manual': ['Legacy Adaptation chosen', 'An archived player choice is retained as read-only evidence.'],
  'adaptation.unresolved': ['Legacy Adaptation left unchosen', 'The archived world ended first.'],
  'adaptation.mode.changed': ['Legacy Adaptation mode changed', 'A retired archived choice policy changed.'],
  'crisis.telegraphed': ['Crisis approaching', 'The network sensed a changing region.'],
  'crisis.started': ['Crisis began', 'Spatial pressure crossed the world.'],
  'crisis.ended': ['Crisis passed', 'Surviving cells retained the trace.'],
  'run.extinct': ['Extinction', 'The last living cell released its energy.'],
  'run.abandoned': ['World left behind', 'No Echoes, score reward, trophy, or Imprint was granted.'],
  'resource.reserve.threshold': ['Reachable reserves declined', 'Growth consumed finite local stock faster than renewal replaced it.'],
  'geo.coast.reached': ['First coast reached', 'Life encountered the ocean margin.'],
  'geo.lake.reached': ['First lake reached', 'Life entered a connected whole-cell freshwater basin.'],
  'geo.river.reached': ['Archived freshwater reach', 'A legacy drainage milestone was preserved without lake proof.'],
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
  let model = null; let world = null; let events = []; let eventIndex = -1; let raf = 0; let openOptions = {};
  byId('history-close').addEventListener('click', options.onClose);
  worldSelect.addEventListener('change', () => chooseWorld(worldSelect.value)); filter.addEventListener('change', () => {
    openOptions = { ...openOptions, filter: filter.value }; renderSelected(); renderList(); });
  range.addEventListener('input', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => seek(Number(range.value))); });
  prev.addEventListener('click', () => navigate(-1)); next.addEventListener('click', () => navigate(1));
  latest.addEventListener('click', () => world?.current ? options.onLive() : seek(world?.tick ?? 0));

  function chooseWorld(id) {
    world = model.worlds.find((item) => item.id === id) ?? model.worlds[0]; if (!world) return;
    worldSelect.value = world.id; events = world.events ?? []; range.max = String(Math.max(0, world.tick));
    const viewingTick = world.current ? Math.min(world.tick, model.liveTick) : world.tick;
    const environmentAnchor = openOptions.filter === 'environment' && world.current
      ? environmentHistoryAnchor(events, viewingTick) : null;
    range.value = String(environmentAnchor?.tick ?? viewingTick); latest.textContent = world.terminal ? 'Final' : world.current ? 'Live' : 'Latest';
    eventIndex = environmentAnchor?.index ?? nearestEvent(events, viewingTick); renderSelected(); renderList(); setAvailability(null);
    options.onWorld(world); options.onSeek(Number(range.value), environmentAnchor?.event ?? events[eventIndex] ?? null, world);
  }
  function seek(tick) {
    const value = Math.max(0, Math.min(world?.tick ?? 0, Math.floor(tick))); range.value = String(value);
    eventIndex = nearestEvent(events, value); renderSelected(); options.onSeek(value, events[eventIndex] ?? null, world);
  }
  function navigate(delta) {
    if (!events.length) return; eventIndex = Math.max(0, Math.min(events.length - 1, eventIndex + delta));
    const event = events[eventIndex]; range.value = String(event.tick); renderSelected(); options.onSeek(event.tick, event, world);
  }
  function renderSelected() {
    const event = events[eventIndex]; prev.disabled = eventIndex <= 0; next.disabled = eventIndex < 0 || eventIndex >= events.length - 1;
    if (openOptions.filter === 'environment' && world?.current && !environmentHistoryAnchor(events, world.tick)) {
      selected.textContent = `Environment Level ${openOptions.environmentLevel ?? '0'} — this world has not reached its first Environment transition yet.`;
      return;
    }
    if (!event) { selected.textContent = 'No semantic events were recorded at this time.'; return; }
    const [title, detail] = describeHistoryEvent(event); selected.replaceChildren(strong(title), document.createTextNode(` — ${detail}`));
  }
  function renderList() {
    const visible = events.filter((event) => filter.value === 'all' || historyEventCategory(event) === filter.value).slice(-80);
    list.replaceChildren(...visible.map((event) => {
      const row = document.createElement('li'); row.className = 'history-entry'; const button = document.createElement('button');
      button.type = 'button'; button.className = 'history-event-btn'; const [title, detail] = describeHistoryEvent(event);
      button.append(strong(`${historyGameTime(event.tick)} · ${title}`), document.createTextNode(detail));
      button.addEventListener('click', () => { eventIndex = events.indexOf(event); seek(event.tick); }); row.append(button); return row;
    }));
    if (!visible.length) { const empty = document.createElement('li'); empty.className = 'history-entry'; empty.textContent = 'No events in this category.'; list.append(empty); }
  }
  function setAvailability(available, message = '') {
    note.hidden = available === true; note.textContent = message || (available === false
      ? 'Approximate visual detail was not preserved for this world; semantic events remain.' : 'Loading device-local visual detail…');
  }
  function updateFrame(frameTick, liveTick = world?.tick ?? 0) {
    range.value = String(frameTick); const behind = world?.current && liveTick > frameTick ? ` · ${historyGameTime(liveTick - frameTick)} behind live` : '';
    time.textContent = `${historyGameTime(frameTick)}${behind} · nearest approximate checkpoint`;
  }
  return { surface, open(nextModel, defaultId, nextOptions = {}) { model = nextModel; openOptions = { ...nextOptions };
      filter.value = ['all', 'world', 'life', 'environment', 'legacy-adaptation', 'crisis'].includes(openOptions.filter) ? openOptions.filter : 'all';
      worldSelect.replaceChildren(...model.worlds.map((item) => {
        const option = document.createElement('option'); option.value = item.id; option.textContent = item.label; return option; }));
      surface.hidden = false; chooseWorld(model.worlds.some((item) => item.id === defaultId) ? defaultId : model.worlds[0]?.id); },
    close() { cancelAnimationFrame(raf); raf = 0; surface.hidden = true; },
    reset() { cancelAnimationFrame(raf); raf = 0; surface.hidden = true; model = null; world = null; events = []; eventIndex = -1; openOptions = {};
      list.replaceChildren(); selected.textContent = ''; range.value = '0'; range.max = '0'; },
    setAvailability, updateFrame, get worldId() { return world?.id ?? null; },
    get selectedWorld() { return world; }, get tick() { return Number(range.value); } };
}
function nearestEvent(events, tick) { let best = -1; let distance = Infinity;
  events.forEach((event, index) => { const d = Math.abs(event.tick - tick); if (d < distance) { best = index; distance = d; } }); return best; }
export function describeHistoryEvent(event) { const base = TITLES[event.key] ?? [humanize(event.key), 'A meaningful change was preserved.'];
  const subject = event.subjectId ? ` · ${humanize(event.subjectId)}` : ''; return [base[0] + subject, base[1]]; }
function humanize(value) { return String(value).split(/[.-]/).at(-1).replaceAll('_', ' ').replace(/^./, (c) => c.toUpperCase()); }
export function historyEventCategory(event) { if (event.kind === 'environment') return 'environment'; if (event.kind === 'adaptation') return 'legacy-adaptation'; if (event.kind === 'crisis') return 'crisis';
  if (event.kind === 'trophy') return 'life'; if (event.key.startsWith('geo.') || event.key.startsWith('run.world')) return 'world'; return 'life'; }
export function environmentHistoryAnchor(events, throughTick = Infinity) {
  const limit = Number.isFinite(throughTick) ? Math.max(0, Math.floor(throughTick)) : Infinity;
  for (let index = (events?.length ?? 0) - 1; index >= 0; index--) {
    const event = events[index];
    if (event?.tick <= limit && historyEventCategory(event) === 'environment') return { event, index, tick: event.tick };
  }
  return null;
}
export function historyGameTime(tick) { const seconds = Math.floor(tick / 10); return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }
function strong(text) { const node = document.createElement('strong'); node.textContent = text; return node; }
function byId(id) { return /** @type {HTMLElement} */ (document.getElementById(id)); }
