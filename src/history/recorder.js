/** Observational checkpoint recorder owned by RunController, outside authority hashes. */
import { encodeVisualHistory, maxVisualHistoryFrames, thinFrames } from './codec.js';

export const FRAME_FLAGS = Object.freeze({ MAJOR: 1, TERMINAL: 2, INITIAL: 4, TRANSITION: 8 });

export class HistoryRecorder {
  constructor(state, cadence = 50) {
    this.cellCount = state.topo.nodeCount; this.seed = state.seed; this.cadence = cadence;
    this.frames = []; this.cached = null; this.capture(state, FRAME_FLAGS.INITIAL | FRAME_FLAGS.MAJOR);
  }

  observe(state, major = false, terminal = false, transition = false) {
    if (!major && !terminal && !transition && state.tick % this.cadence !== 0) return false;
    let flags = major ? FRAME_FLAGS.MAJOR : 0;
    if (terminal) flags |= FRAME_FLAGS.TERMINAL | FRAME_FLAGS.MAJOR;
    if (transition) flags |= FRAME_FLAGS.TRANSITION | FRAME_FLAGS.MAJOR;
    return this.capture(state, flags);
  }

  capture(state, flags = 0) {
    const visual = quantizeFrame(state); const frame = {
      tick: state.tick, entropyQ: quantize(state.entropy, 255), flags,
      aliveCount: Math.min(65535, state.aliveCount), ...visual,
    };
    const previous = this.frames.at(-1);
    if (previous?.tick === frame.tick) {
      frame.flags |= previous.flags; this.frames[this.frames.length - 1] = frame;
    } else {
      if (previous && frame.tick < previous.tick) throw new Error('history checkpoints must be ordered');
      this.frames.push(frame);
    }
    if (this.frames.length > maxVisualHistoryFrames(this.cellCount)) this.frames = thinFrames(this.frames, this.cellCount);
    this.cached = null; return true;
  }

  buffer() {
    if (!this.cached) this.cached = encodeVisualHistory({ cellCount: this.cellCount, seed: this.seed, cadence: this.cadence }, this.frames);
    return this.cached.slice(0);
  }
}

/** Quantize every dynamic channel the production renderers consume. */
export function quantizeFrame(state) {
  const count = state.topo.nodeCount; const cells = new Uint8Array(count);
  const resources = new Uint8Array(count); const worldmaking = new Uint8Array(count);
  for (let cell = 0; cell < count; cell++) {
    const biomass = quantizeRange(state.biomass[cell], 2, 7); const stress = quantizeRange(state.stress[cell], 1, 7);
    let cellClass = 0;
    if (state.alive[cell]) cellClass = state.stress[cell] >= 0.62 ? 3 : isFrontier(state, cell) ? 2 : 1;
    cells[cell] = (cellClass << 6) | (biomass << 3) | stress;
    const resourceState = Math.max(0, Math.min(7, state.resourceState[cell] ?? 0));
    const resourceRichness = quantize(state.resourceRichness[cell], 31);
    resources[cell] = (resourceRichness << 3) | resourceState;
    const transformation = Math.max(0, Math.min(7, state.transformationState[cell] ?? 0));
    const charge = quantize((state.electricityQ[cell] ?? 0) / 255, 31);
    worldmaking[cell] = (charge << 3) | transformation;
  }
  return { cells, resources, worldmaking,
    electricityDevelopmentQ: quantize(state.electricityMastery?.visualDevelopment ?? 0, 255) };
}

/** Life-only projection remains useful to non-rendering generators. */
export function quantizeCells(state) { return quantizeFrame(state).cells; }

function isFrontier(state, cell) {
  for (let offset = state.topo.nodeStart[cell]; offset < state.topo.nodeStart[cell + 1]; offset++) {
    const edge = state.topo.nodeEdges[offset]; const other = state.topo.edgeA[edge] === cell ? state.topo.edgeB[edge] : state.topo.edgeA[edge];
    if (!state.alive[other]) return true;
  }
  return false;
}
function quantize(value, max) { return Math.max(0, Math.min(max, Math.round((Number(value) || 0) * max))); }
function quantizeRange(value, range, max) { return Math.max(0, Math.min(max, Math.round((Number(value) || 0) * max / range))); }
