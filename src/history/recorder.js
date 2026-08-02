/** Observational checkpoint recorder owned by RunController, outside authority hashes. */
import { encodeVisualHistory } from './codec.js';
import { nearestFrame } from './preview.js';

export const FRAME_FLAGS = Object.freeze({ MAJOR: 1, TERMINAL: 2, INITIAL: 4 });

export class HistoryRecorder {
  constructor(state, cadence = 50) {
    this.cellCount = state.topo.nodeCount; this.seed = state.seed; this.cadence = cadence;
    this.frames = []; this.cached = null; this.capture(state, FRAME_FLAGS.INITIAL | FRAME_FLAGS.MAJOR);
  }

  observe(state, major = false, terminal = false) {
    if (!major && !terminal && state.tick % this.cadence !== 0) return false;
    let flags = major ? FRAME_FLAGS.MAJOR : 0;
    if (terminal) flags |= FRAME_FLAGS.TERMINAL | FRAME_FLAGS.MAJOR;
    return this.capture(state, flags);
  }

  capture(state, flags = 0) {
    const cells = quantizeCells(state); const frame = {
      tick: state.tick, entropyQ: quantize(state.entropy, 1), flags,
      aliveCount: Math.min(65535, state.aliveCount), cells,
    };
    const previous = this.frames.at(-1);
    if (previous?.tick === frame.tick) {
      frame.flags |= previous.flags; this.frames[this.frames.length - 1] = frame;
    } else {
      if (previous && frame.tick < previous.tick) throw new Error('history checkpoints must be ordered');
      this.frames.push(frame);
    }
    this.cached = null; return true;
  }

  preview(tick) { return nearestFrame(this.frames, tick); }
  buffer() {
    if (!this.cached) this.cached = encodeVisualHistory({ cellCount: this.cellCount, seed: this.seed, cadence: this.cadence }, this.frames);
    return this.cached.slice(0);
  }
}

export function quantizeCells(state) {
  const cells = new Uint8Array(state.topo.nodeCount);
  for (let cell = 0; cell < cells.length; cell++) {
    const biomass = quantize(state.biomass[cell], 2); const stress = quantize(state.stress[cell], 1);
    let cellClass = 0;
    if (state.alive[cell]) cellClass = state.stress[cell] >= 0.62 ? 3 : isFrontier(state, cell) ? 2 : 1;
    cells[cell] = (cellClass << 6) | (biomass << 3) | stress;
  }
  return cells;
}

function isFrontier(state, cell) {
  for (let offset = state.topo.nodeStart[cell]; offset < state.topo.nodeStart[cell + 1]; offset++) {
    const edge = state.topo.nodeEdges[offset]; const other = state.topo.edgeA[edge] === cell ? state.topo.edgeB[edge] : state.topo.edgeA[edge];
    if (!state.alive[other]) return true;
  }
  return false;
}
function quantize(value, max) { return Math.max(0, Math.min(7, Math.round((Number(value) || 0) * 7 / max))); }
