/** Bounded semantic Event Log shared by current and archived worlds. */
import { describeHistoryEvent, historyEventCategory, historyGameTime } from '../history-surface.js';

export const EVENT_LOG_ROW_CAP = 80;
export function createEventLogSurface(options) {
  const surface = byId('event-log-dialog'); const worlds = byId('event-log-world');
  const filter = byId('event-log-filter'); const list = byId('event-log-list'); const bound = byId('event-log-bound');
  let model = { worlds: [] }; let selected = null;
  byId('event-log-close').addEventListener('click', options.onClose);
  byId('event-log-history').addEventListener('click', () => options.onHistory(selected));
  worlds.addEventListener('change', () => { selected = model.worlds.find((world) => world.id === worlds.value) ?? model.worlds[0]; render(); });
  filter.addEventListener('change', render);
  function render() {
    const source = selected?.events ?? []; const matching = source.filter((event) => filter.value === 'all' || historyEventCategory(event) === filter.value);
    const visible = matching.slice(-EVENT_LOG_ROW_CAP); list.replaceChildren(...visible.map((event) => entry(event, selected, options)));
    if (!visible.length) { const empty = document.createElement('li'); empty.className = 'event-log-entry'; empty.textContent = 'No semantic events in this category.'; list.append(empty); }
    bound.textContent = matching.length > visible.length ? `Showing latest ${visible.length} of ${matching.length} bounded entries.` : `${visible.length} bounded ${visible.length === 1 ? 'entry' : 'entries'}.`;
  }
  return {
    surface,
    open(nextModel, preferred = 'current') { model = nextModel; worlds.replaceChildren(...model.worlds.map(option));
      selected = model.worlds.find((world) => world.id === preferred) ?? model.worlds[0] ?? null;
      worlds.value = selected?.id ?? ''; surface.hidden = false; render(); },
    update(nextModel) { const id = selected?.id; model = nextModel; selected = model.worlds.find((world) => world.id === id) ?? model.worlds[0] ?? null;
      worlds.replaceChildren(...model.worlds.map(option)); worlds.value = selected?.id ?? ''; if (!surface.hidden) render(); },
    close() { surface.hidden = true; },
    reset() { model = { worlds: [] }; selected = null; list.replaceChildren(); surface.hidden = true; },
    get selectedWorld() { return selected; },
  };
}
export function eventLogWorlds(current, archive = { worlds: [] }) {
  const worlds = []; if (current) worlds.push({ id: 'current', current: true, label: current.terminal ? 'Current world · final' : 'Current world · live',
    events: (current.events ?? []).slice(-EVENT_LOG_ROW_CAP), seed: current.seed, tick: current.tick ?? 0 });
  for (const world of (archive.worlds ?? []).slice().reverse()) worlds.push({ id: world.id, current: false,
    label: `${world.archetype} · seed ${world.seed}`, events: (world.events ?? []).slice(-EVENT_LOG_ROW_CAP), seed: world.seed, tick: world.tick ?? 0 });
  if (!worlds.length) worlds.push({ id: 'empty', current: false, label: 'No recorded worlds', events: [], seed: null, tick: 0 });
  return { worlds: worlds.slice(0, 33) };
}
function entry(event, world, options) {
  const li = document.createElement('li'); li.className = 'event-log-entry'; const button = document.createElement('button'); button.type = 'button';
  const [title, explanation] = describeHistoryEvent(event); const category = historyEventCategory(event); const cells = (event.primaryCells ?? []).slice(0, 8);
  const phase = event.key?.startsWith('run.phase.') ? event.key.split('.').at(-1) : event.kind ?? category;
  button.append(strong(`${historyGameTime(event.tick)} · ${title}`), span(`${category} · ${phase} · ${world?.current ? 'current world' : 'archive'}${cells.length ? ` · ${cells.length} ${cells.length === 1 ? 'cell' : 'cells'}` : ''}`), span(explanation));
  button.addEventListener('click', () => { if (cells.length && world?.current) options.onFocus(cells, event); else options.onHistory(world, event); });
  li.append(button); return li;
}
function option(world) { const node = document.createElement('option'); node.value = world.id; node.textContent = world.label; return node; }
function strong(text) { const node = document.createElement('strong'); node.textContent = text; return node; }
function span(text) { const node = document.createElement('span'); node.textContent = text; return node; }
function byId(id) { return document.getElementById(id); }
