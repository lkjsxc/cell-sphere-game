/** Bridges presentation-only Adaptation messages to bounded rendering and caption UI. */
import { AdaptationPropagation } from '../../rendering/adaptation-propagation.js';
import { ADAPTATION_COPY } from '../panel-surfaces.js';

export function createAdaptationEffects(topo, host) {
  const propagation = new AdaptationPropagation(topo); let pending = []; let captionTimer = 0;
  function showCaption(cardId) {
    const copy = ADAPTATION_COPY[cardId] ?? [humanize(cardId), 'A new behavior enters the living world.'];
    host.replaceChildren(line('strong', copy[0]), line('span', copy[1])); host.hidden = false;
    clearTimeout(captionTimer); captionTimer = setTimeout(() => { host.hidden = true; }, 2500);
  }
  function selected(message, snapshot, reduced, now = performance.now()) {
    showCaption(message.cardId);
    const item = { message, reduced };
    if (snapshot?.tick >= message.tick) propagation.enqueue(message, snapshot.alive, now, reduced);
    else { if (pending.length >= 2) pending.shift(); pending.push(item); }
  }
  function onSnapshot(snapshot, now = performance.now()) {
    const waiting = [];
    for (const item of pending) {
      if (snapshot.tick >= item.message.tick) propagation.enqueue(item.message, snapshot.alive, now, item.reduced);
      else waiting.push(item);
    }
    pending = waiting;
  }
  function clear() {
    propagation.clear(); pending = []; clearTimeout(captionTimer); host.hidden = true;
  }
  return { selected, onSnapshot, clear, frame: (now) => propagation.frame(now),
    get queueLength() { return propagation.queueLength; },
    get retainedBytes() { return propagation.retainedBytes; },
    get pendingCount() { return pending.length; } };
}

function line(tag, text) { const node = document.createElement(tag); node.textContent = text; return node; }
function humanize(value) { return String(value).replaceAll('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase()); }
