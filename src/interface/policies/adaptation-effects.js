/** Bridges versioned authoritative arrival fields to bounded rendering and copy. */
import { AdaptationPropagation } from '../../rendering/adaptation-propagation.js';
import { ADAPTATION_COPY } from '../panel-surfaces.js';

export function createAdaptationEffects(topo, host) {
  const propagation = new AdaptationPropagation(topo); let captionTimer = 0;
  function showCaption(cardId) {
    const copy = ADAPTATION_COPY[cardId] ?? [humanize(cardId), 'A new behavior enters the living world.'];
    host.replaceChildren(line('strong', copy[0]), line('span', copy[1])); host.hidden = false;
    clearTimeout(captionTimer); captionTimer = setTimeout(() => { host.hidden = true; }, 2500);
  }
  function selected(message, _snapshot, reduced, now = performance.now()) {
    showCaption(message.cardId); propagation.enqueue(message, now, reduced);
  }
  function clear() { propagation.clear(); clearTimeout(captionTimer); host.hidden = true; }
  return { selected, onSnapshot: () => {}, clear, frame: (now) => propagation.frame(now),
    get queueLength() { return propagation.queueLength; },
    get retainedBytes() { return propagation.retainedBytes; }, get pendingCount() { return 0; } };
}

function line(tag, text) { const node = document.createElement(tag); node.textContent = text; return node; }
function humanize(value) { return String(value).replaceAll('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase()); }
