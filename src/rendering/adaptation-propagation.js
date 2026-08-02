/** Bounded cell-only Adaptation propagation prepared once, animated by uniforms. */
const UNREACHABLE = 255;
const CATEGORY = Object.freeze({ reach: 1, metabolism: 2, resilience: 3,
  transport: 4, ecology: 5, perception: 6 });

export class AdaptationPropagation {
  constructor(topo) {
    this.topo = topo;
    this.workQueue = new Uint32Array(topo.nodeCount);
    this.workDistance = new Uint16Array(topo.nodeCount);
    this.events = [];
    this.serial = 0;
  }

  enqueue(message, alive, now, reduced = false) {
    const prepared = this.prepare(message, alive);
    const event = { ...prepared, token: ++this.serial, reduced,
      duration: reduced ? 220 : 2000, start: null };
    if (this.events.length >= 2) this.events.shift();
    this.events.push(event);
    if (this.events[0].start == null) this.events[0].start = now;
    return event;
  }

  prepare(message, alive) {
    const distances = new Uint8Array(this.topo.nodeCount); distances.fill(UNREACHABLE);
    const origin = message.originCell; let count = 0; let maxDistance = 0;
    this.workDistance.fill(0xffff);
    if (Number.isInteger(origin) && origin >= 0 && origin < this.topo.nodeCount && alive?.[origin] === 1) {
      let head = 0; let tail = 0; this.workQueue[tail++] = origin; this.workDistance[origin] = 0;
      while (head < tail) {
        const cell = this.workQueue[head++]; const distance = this.workDistance[cell]; count++;
        const quantized = Math.min(254, distance); distances[cell] = quantized;
        maxDistance = Math.max(maxDistance, quantized);
        for (let o = this.topo.nodeStart[cell]; o < this.topo.nodeStart[cell + 1]; o++) {
          const next = this.topo.nodeNeighbors[o];
          if (alive[next] !== 1 || this.workDistance[next] !== 0xffff) continue;
          this.workDistance[next] = distance + 1; this.workQueue[tail++] = next;
        }
      }
    }
    return { distances, maxDistance, affectedCount: count, originCell: origin,
      category: CATEGORY[message.category] ?? CATEGORY.reach, categoryName: message.category ?? 'reach' };
  }

  frame(now) {
    while (this.events.length) {
      const active = this.events[0];
      if (active.start == null) active.start = now;
      if (now - active.start < active.duration) {
        return { ...active, progress: Math.max(0, Math.min(1, (now - active.start) / active.duration)) };
      }
      this.events.shift();
      if (this.events[0]) this.events[0].start = now;
    }
    return null;
  }

  clear() { this.events.length = 0; }
  get queueLength() { return this.events.length; }
  get retainedBytes() { return this.events.reduce((sum, event) => sum + event.distances.byteLength, 0); }
}

export { UNREACHABLE as ADAPTATION_UNREACHABLE };
