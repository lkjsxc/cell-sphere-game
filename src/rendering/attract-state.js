/**
 * Bounded cosmetic title organism. It uses the real topology and renderer but
 * never enters authoritative simulation, persistence, scoring, or progression.
 */
import { writeLifeStates } from '../core/life-state.js';

export class AttractState {
  constructor(topo, root = 0) {
    this.topo = topo;
    this.snapshot = {
      tick: 0, entropy: 0, status: 'attract',
      biomass: new Float32Array(topo.nodeCount),
      stress: new Float32Array(topo.nodeCount),
      alive: new Uint8Array(topo.nodeCount),
      lifeState: new Uint8Array(topo.nodeCount),
      events: [],
      metrics: { coverage: 0, score: 0, pendingAdaptations: 0 },
    };
    this.seen = new Uint8Array(topo.nodeCount);
    this.queue = new Uint16Array(topo.nodeCount);
    this.lastStep = 0;
    this.root = root;
    this.reset(root);
  }

  reset(root) {
    const snap = this.snapshot;
    snap.biomass.fill(0); snap.stress.fill(0); snap.alive.fill(0); snap.lifeState.fill(0);
    this.seen.fill(0); this.head = 0; this.tail = 1; this.grown = 0;
    this.root = root; this.queue[0] = root; this.seen[root] = 1;
    snap.tick++; this.growOne(); this.lastStep = performance.now();
  }

  update(now, reducedMotion = false) {
    const interval = reducedMotion ? 260 : 92;
    if (this.grown >= 54 && now - this.lastStep > 4200) {
      this.reset((this.root * 1664525 + 1013904223) % this.topo.nodeCount); return;
    }
    if (now - this.lastStep < interval || this.grown >= 54) return;
    this.lastStep = now;
    this.growOne();
    if (!reducedMotion && this.grown < 32) this.growOne();
  }

  growOne() {
    if (this.head >= this.tail || this.grown >= 54) return;
    const node = this.queue[this.head++];
    const snap = this.snapshot; const topo = this.topo;
    snap.alive[node] = 1;
    snap.biomass[node] = 0.72 + ((node * 37) % 23) / 70;
    this.grown++;
    for (let offset = topo.nodeStart[node]; offset < topo.nodeStart[node + 1]; offset++) {
      const neighbor = topo.nodeNeighbors[offset];
      if (!this.seen[neighbor] && this.tail < this.queue.length) {
        this.seen[neighbor] = 1;
        this.queue[this.tail++] = neighbor;
      }
    }
    writeLifeStates(topo, snap.alive, snap.biomass, snap.stress, snap.lifeState);
    snap.tick++;
    snap.metrics.coverage = this.grown / topo.nodeCount;
  }
}
