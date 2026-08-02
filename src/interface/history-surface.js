/** Semantic History presentation. Persistence stores keys; prose is localized here. */
const TITLES = Object.freeze({
  'run.world.created': ['World generated', 'A new autonomous ecology took shape.'],
  'run.inoculation.selected': ['Life chose its origin', 'A suitable cell was selected from the world seed.'],
  'run.germination': ['Germination', 'The first living routes opened.'],
  'run.phase.abundance': ['Abundance', 'Resources supported rapid expansion.'],
  'run.phase.instability': ['Instability', 'Environmental pressure began to dominate.'],
  'run.phase.collapse': ['Collapse', 'The network entered its terminal phase.'],
  'adaptation.offered': ['Adaptation offered', 'Three possible changes entered the queue.'],
  'adaptation.selected.random': ['Adaptation chosen automatically', 'The world selected one of the three options.'],
  'adaptation.selected.manual': ['Adaptation chosen', 'The selected change now affects future ticks.'],
  'adaptation.unresolved': ['Adaptation left unchosen', 'Extinction arrived before this offer was resolved.'],
  'adaptation.mode.changed': ['Adaptation mode changed', 'Future offers now follow the selected decision policy.'],
  'crisis.telegraphed': ['Crisis approaching', 'The network sensed a changing region.'],
  'crisis.started': ['Crisis began', 'A spatial pressure crossed the world.'],
  'crisis.ended': ['Crisis passed', 'The surviving network retained the trace.'],
  'run.extinct': ['Extinction', 'The last living route released its energy.'],
  'run.score.final': ['World remembered', 'Score, Echoes, and an Imprint were preserved.'],
  'geo.coast.reached': ['First coast reached', 'Life encountered the ocean margin.'],
  'geo.river.reached': ['First river reached', 'A flowing corridor changed local conditions.'],
  'geo.forest.reached': ['First forest reached', 'The network entered dense living ground.'],
  'geo.mountain.reached': ['First highland reached', 'Expansion climbed into costly terrain.'],
  'geo.wetland.reached': ['First wetland reached', 'Rich saturated ground joined the network.'],
  'geo.world_knot.reached': ['World Knot reached', 'Life touched a fivefold cell.'],
  'morph.loop.first': ['First loop formed', 'Two routes enclosed a resilient circuit.'],
  'morph.component.split': ['Network split', 'Living tissue separated into components.'],
  'morph.component.reconnected': ['Network reconnected', 'Separated living components joined again.'],
  'memory.node.purchased': ['Memory unlocked', 'Echoes became a permanent path on the atlas.'],
});

export function createHistorySurface(options) {
  const surface = document.getElementById('history-dialog');
  const list = document.getElementById('history-list'); const header = document.getElementById('history-header');
  const current = /** @type {HTMLButtonElement} */ (document.getElementById('history-current'));
  const past = /** @type {HTMLButtonElement} */ (document.getElementById('history-past'));
  const filter = /** @type {HTMLSelectElement} */ (document.getElementById('history-filter'));
  const note = document.getElementById('history-time-note');
  let model = null; let scope = 'current'; let pastIndex = 0;
  document.getElementById('history-close')?.addEventListener('click', () => options.onClose());
  current.addEventListener('click', () => { scope = 'current'; render(); });
  past.addEventListener('click', () => { scope = 'past'; render(); });
  filter.addEventListener('change', render);

  function render() {
    current.setAttribute('aria-pressed', String(scope === 'current'));
    past.setAttribute('aria-pressed', String(scope === 'past'));
    const archive = model?.archive ?? { worlds: [], memory: [] }; const category = filter.value;
    let events = model?.currentEvents ?? []; let heading = model?.currentHeader ?? 'This world';
    if (scope === 'past' && category === 'memory') {
      events = archive.memory.map((item) => ({ seq: item.seq, tick: 0, kind: 'memory', key: 'memory.node.purchased',
        subjectId: item.nodeId, valueA: item.cost })); header.textContent = 'Memory purchased between worlds.';
    } else if (scope === 'past') {
      const worlds = archive.worlds.slice().reverse();
      if (worlds.length) {
        pastIndex = Math.min(pastIndex, worlds.length - 1); const world = worlds[pastIndex]; events = world.events;
        const select = document.createElement('select'); select.setAttribute('aria-label', 'Past world');
        worlds.forEach((item, index) => { const option = document.createElement('option'); option.value = String(index);
          option.textContent = `World ${archive.worlds.length - index} · ${item.score.toLocaleString('en')} · seed ${item.seed}`; select.append(option); });
        select.value = String(pastIndex); select.addEventListener('change', () => { pastIndex = Number(select.value); render(); });
        header.replaceChildren(select); heading = `${world.archetype} · ${world.rank} · ${world.cause}`;
      } else { events = []; header.textContent = 'No completed worlds have been preserved yet.'; }
    } else header.textContent = heading;
    if (scope === 'past' && archive.worlds.length) header.append(document.createTextNode(` — ${heading}`));
    const visible = events.filter((event) => category === 'all' || eventCategory(event) === category);
    list.replaceChildren(...visible.map(eventRow));
    if (!visible.length) { const empty = document.createElement('li'); empty.className = 'history-entry';
      empty.textContent = category === 'all' ? 'Meaningful events will appear as this world unfolds.' : 'No events in this category.'; list.append(empty); }
  }

  function eventRow(event) {
    const row = document.createElement('li'); row.className = 'history-entry';
    const time = document.createElement('time'); time.className = 'history-time'; time.textContent = gameTime(event.tick);
    const copy = document.createElement('div'); copy.className = 'history-copy';
    const [title, detail] = describe(event); const strong = document.createElement('strong'); strong.textContent = title;
    const span = document.createElement('span'); span.textContent = detail; copy.append(strong, span); row.append(time, copy);
    if (Number.isInteger(event.cellId)) { const button = document.createElement('button'); button.type = 'button'; button.className = 'location-btn';
      button.textContent = 'View location'; button.addEventListener('click', () => options.onLocation(event)); row.append(button); }
    return row;
  }

  return { surface, open(next, defaultScope = 'current') { model = next; scope = defaultScope; pastIndex = 0;
    if (note) note.hidden = !next.worldContinues; render(); surface.hidden = false; },
  close() { surface.hidden = true; } };
}

function describe(event) {
  const base = TITLES[event.key] ?? [humanize(event.key), 'A meaningful change was preserved.'];
  const subject = event.subjectId ? ` · ${event.subjectId === 'random' ? 'Automatic' : humanize(event.subjectId)}` : '';
  return [base[0] + subject, base[1]];
}
function humanize(value) { return String(value).split(/[.-]/).at(-1).replaceAll('_', ' ').replace(/^./, (c) => c.toUpperCase()); }
function eventCategory(event) { if (event.kind === 'adaptation' || event.key.startsWith('adaptation.')) return 'adaptation';
  if (event.kind === 'crisis' || event.key.startsWith('crisis.')) return 'crisis'; if (event.kind === 'memory') return 'memory';
  if (event.key.startsWith('geo.') || event.key.startsWith('run.world')) return 'world'; return 'life'; }
function gameTime(tick) { const seconds = Math.floor(tick / 10); return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }
