/** Bridges versioned authoritative arrival fields to bounded rendering and queued copy. */
import { AdaptationPropagation } from '../../rendering/adaptation-propagation.js';
import { ADAPTATION_COPY } from '../panel-surfaces.js';
import { createTimedPresentationQueue, PRESENTATION_DURATION } from './presentation-timing.js';

export function createAdaptationEffects(topo, host, timing = {}) {
  const propagation = new AdaptationPropagation(topo);
  const captions = createTimedPresentationQueue({ ...timing, duration: PRESENTATION_DURATION.adaptationCaption,
    keyOf: (item) => item.cardId, onShow: ({ cardId, reduced }) => {
      const copy = ADAPTATION_COPY[cardId] ?? [humanize(cardId), 'A new behavior enters the living world.'];
      host.replaceChildren(line('strong', copy[0]), line('span', copy[1])); host.hidden = false;
      host.classList.toggle('is-static', Boolean(reduced));
    }, onIdle: () => { host.replaceChildren(); host.hidden = true; host.classList.remove('is-static'); } });
  function selected(message, _snapshot, reduced, now = performance.now()) {
    captions.enqueue({ cardId: message.cardId, reduced }); propagation.enqueue(message, now, reduced);
  }
  function clear() { propagation.clear(); captions.clear('world-retired'); }
  return { selected, onSnapshot: () => {}, clear, frame: (now) => propagation.frame(now),
    get queueLength() { return propagation.queueLength; }, get retainedBytes() { return propagation.retainedBytes; },
    get pendingCount() { return captions.length; } };
}
function line(tag, text) { const node = document.createElement(tag); node.textContent = text; return node; }
function humanize(value) { return String(value).replaceAll('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase()); }
