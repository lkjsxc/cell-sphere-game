/** Bounded authoritative arrival fields animated without per-frame allocation. */
import { ADAPTATION_ARRIVAL_VERSION, ADAPTATION_UNREACHABLE } from '../core/adaptation-arrival.js';

const CATEGORY = Object.freeze({ reach: 1, metabolism: 2, resilience: 3,
  transport: 4, ecology: 5, perception: 6 });
const FULL_DURATION = 2200; const CHARGE_MS = 140; const TRAIL_MS = 420;

export class AdaptationPropagation {
  constructor(topo) { this.topo = topo; this.events = []; this.serial = 0; }

  enqueue(message, now, reduced = false) {
    if (message.arrivalVersion !== ADAPTATION_ARRIVAL_VERSION
        || !(message.arrivals instanceof Uint16Array)
        || message.arrivals.length !== this.topo.nodeCount) return null;
    const event = {
      token: ++this.serial, arrivals: message.arrivals,
      affectedCount: message.affectedCount, minArrival: message.minArrival,
      medianArrival: message.medianArrival, maxArrival: message.maxArrival,
      originCell: message.originCell, category: CATEGORY[message.category] ?? 1,
      categoryName: message.category ?? 'reach', reduced,
      reducedThreshold: Math.min(450, Math.max(160, message.medianArrival || 160)),
      duration: reduced ? 420 : FULL_DURATION, start: null,
      timeMs: -CHARGE_MS, trailMs: TRAIL_MS, progress: 0,
    };
    if (this.events.length >= 2) this.events.shift();
    this.events.push(event); if (this.events[0].start == null) this.events[0].start = now;
    return event;
  }

  frame(now) {
    while (this.events.length) {
      const active = this.events[0]; if (active.start == null) active.start = now;
      const elapsed = now - active.start;
      if (elapsed < active.duration) {
        active.progress = Math.max(0, Math.min(1, elapsed / active.duration));
        active.timeMs = active.reduced ? 0 : elapsed - CHARGE_MS;
        return active;
      }
      this.events.shift(); if (this.events[0]) this.events[0].start = now;
    }
    return null;
  }

  clear() { this.events.length = 0; }
  get queueLength() { return this.events.length; }
  get retainedBytes() { return this.events.reduce((sum, event) => sum + event.arrivals.byteLength, 0); }
}

export { ADAPTATION_UNREACHABLE };
