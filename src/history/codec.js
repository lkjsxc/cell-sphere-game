/** Strict bounded visual-History codec. */
export const MAGIC = 'INHV';
export const VERSION = 3;
export const MAX_BYTES = 256 * 1024;
export const MAX_CELLS = 8192;
/** Bump when seed-derived geography or its renderer interpretation changes. */
export const WORLD_VISUAL_VERSION = 2;
const HEADER_BYTES = 24;
const FRAME_HEADER_BYTES = 10;
const CELL_BYTES = 3;
const INITIAL_FLAG = 4;
const TERMINAL_FLAG = 2;
const MAJOR_FLAG = 1;
const TRANSITION_FLAG = 8;

export function encodeVisualHistory(metadata, inputFrames) {
  const cellCount = integer(metadata?.cellCount, 1, MAX_CELLS, 'cellCount');
  // Simulation state accepts the complete unsigned seed word even though the
  // player-facing seed code uses 30 bits. Preserve the exact world geography.
  const seed = integer(metadata?.seed, 0, 0xffffffff, 'seed');
  const cadence = integer(metadata?.cadence ?? 50, 1, 65535, 'cadence');
  const worldVisualVersion = integer(metadata?.worldVisualVersion ?? WORLD_VISUAL_VERSION,
    WORLD_VISUAL_VERSION, WORLD_VISUAL_VERSION, 'worldVisualVersion');
  const frames = thinFrames(validateFrames(inputFrames, cellCount), cellCount);
  if (!frames.length) throw new Error('visual history needs a checkpoint');
  const size = HEADER_BYTES + frames.length * frameStride(cellCount);
  if (size > MAX_BYTES) throw new Error('visual history exceeds 256 KiB');
  const buffer = new ArrayBuffer(size); const view = new DataView(buffer); const bytes = new Uint8Array(buffer);
  bytes.set([73, 78, 72, 86]); view.setUint8(4, VERSION); view.setUint8(5, HEADER_BYTES);
  view.setUint16(6, cellCount, true); view.setUint32(8, seed, true); view.setUint16(12, cadence, true);
  view.setUint16(14, frames.length, true); view.setUint32(16, frames.at(-1).tick, true);
  view.setUint32(20, worldVisualVersion, true);
  let offset = HEADER_BYTES;
  for (const frame of frames) {
    view.setUint32(offset, frame.tick, true); view.setUint8(offset + 4, frame.entropyQ);
    view.setUint8(offset + 5, frame.flags); view.setUint16(offset + 6, frame.aliveCount, true);
    view.setUint8(offset + 8, frame.luminousDevelopmentQ); view.setUint8(offset + 9, 0);
    bytes.set(frame.cells, offset + FRAME_HEADER_BYTES);
    bytes.set(frame.resources, offset + FRAME_HEADER_BYTES + cellCount);
    bytes.set(frame.worldmaking, offset + FRAME_HEADER_BYTES + cellCount * 2);
    offset += frameStride(cellCount);
  }
  return buffer;
}

export function decodeVisualHistory(value) {
  if (!(value instanceof ArrayBuffer)) throw new Error('visual history must be an ArrayBuffer');
  if (value.byteLength < HEADER_BYTES || value.byteLength > MAX_BYTES) throw new Error('invalid visual history size');
  const view = new DataView(value); const bytes = new Uint8Array(value);
  if (String.fromCharCode(...bytes.subarray(0, 4)) !== MAGIC) throw new Error('invalid visual history magic');
  if (view.getUint8(4) !== VERSION || view.getUint8(5) !== HEADER_BYTES) throw new Error('unsupported visual history version');
  const cellCount = view.getUint16(6, true); const seed = view.getUint32(8, true);
  const cadence = view.getUint16(12, true); const count = view.getUint16(14, true);
  const terminalTick = view.getUint32(16, true); const worldVisualVersion = view.getUint32(20, true);
  if (!cellCount || cellCount > MAX_CELLS || !cadence || !count
    || worldVisualVersion !== WORLD_VISUAL_VERSION) throw new Error('invalid visual history metadata');
  const stride = frameStride(cellCount);
  if (HEADER_BYTES + count * stride !== value.byteLength) throw new Error('invalid visual history length');
  const frames = []; let offset = HEADER_BYTES; let prior = -1;
  for (let index = 0; index < count; index++, offset += stride) {
    const tick = view.getUint32(offset, true); const flags = view.getUint8(offset + 5);
    const aliveCount = view.getUint16(offset + 6, true);
    if (flags > (MAJOR_FLAG | TERMINAL_FLAG | INITIAL_FLAG | TRANSITION_FLAG) || view.getUint8(offset + 9) !== 0) throw new Error('invalid visual history checkpoint');
    const cells = bytes.subarray(offset + FRAME_HEADER_BYTES, offset + FRAME_HEADER_BYTES + cellCount);
    const resources = bytes.subarray(offset + FRAME_HEADER_BYTES + cellCount, offset + FRAME_HEADER_BYTES + cellCount * 2);
    const worldmaking = bytes.subarray(offset + FRAME_HEADER_BYTES + cellCount * 2, offset + FRAME_HEADER_BYTES + cellCount * 3);
    let countedAlive = 0;
    for (let cell = 0; cell < cellCount; cell++) if (cells[cell] >>> 6) countedAlive++;
    if (tick <= prior || aliveCount !== countedAlive) throw new Error('invalid visual history checkpoint');
    frames.push(Object.freeze({ tick, entropyQ: view.getUint8(offset + 4), flags, aliveCount,
      luminousDevelopmentQ: view.getUint8(offset + 8), cells, resources, worldmaking }));
    prior = tick;
  }
  if (frames.at(-1).tick !== terminalTick) throw new Error('invalid terminal checkpoint');
  return Object.freeze({ version: VERSION, worldVisualVersion, cellCount, seed, cadence, terminalTick,
    frames: Object.freeze(frames) });
}

export function isVisualHistoryBuffer(value) {
  try { decodeVisualHistory(value); return true; } catch { return false; }
}

export function maxVisualHistoryFrames(cellCount) {
  return Math.floor((MAX_BYTES - HEADER_BYTES) / frameStride(integer(cellCount, 1, MAX_CELLS, 'cellCount')));
}

export function thinFrames(input, cellCount) {
  const frames = validateFrames(input, cellCount); const max = maxVisualHistoryFrames(cellCount);
  if (frames.length <= max) return frames;
  const retained = new Set([frames[0], frames.at(-1)]);
  const transitions = frames.filter((frame) => (frame.flags & TRANSITION_FLAG) && !retained.has(frame));
  retainEvenly(retained, transitions, max - retained.size);
  const major = frames.filter((frame) => (frame.flags & MAJOR_FLAG) && !retained.has(frame));
  retainEvenly(retained, major, max - retained.size);
  const ordinary = frames.filter((frame) => !retained.has(frame));
  retainEvenly(retained, ordinary, max - retained.size);
  return frames.filter((frame) => retained.has(frame));
}

function retainEvenly(retained, candidates, count) {
  if (count <= 0 || !candidates.length) return;
  if (count >= candidates.length) { for (const frame of candidates) retained.add(frame); return; }
  if (count === 1) { retained.add(candidates[Math.floor(candidates.length / 2)]); return; }
  for (let index = 0; index < count; index++) {
    retained.add(candidates[Math.round(index * (candidates.length - 1) / (count - 1))]);
  }
}

function validateFrames(input, cellCount) {
  if (!Array.isArray(input)) throw new Error('checkpoints must be an array');
  let prior = -1;
  return input.map((frame) => {
    const tick = integer(frame?.tick, 0, 0xffffffff, 'tick');
    const entropyQ = integer(frame?.entropyQ, 0, 255, 'entropyQ');
    const flags = integer(frame?.flags ?? 0, 0, MAJOR_FLAG | TERMINAL_FLAG | INITIAL_FLAG | TRANSITION_FLAG, 'flags');
    const aliveCount = integer(frame?.aliveCount, 0, cellCount, 'aliveCount');
    const luminousDevelopmentQ = integer(frame?.luminousDevelopmentQ ?? 0, 0, 255, 'luminousDevelopmentQ');
    if (!(frame.cells instanceof Uint8Array) || !(frame.resources instanceof Uint8Array)
      || !(frame.worldmaking instanceof Uint8Array) || frame.cells.length !== cellCount
      || frame.resources.length !== cellCount || frame.worldmaking.length !== cellCount || tick <= prior) {
      throw new Error('invalid checkpoint');
    }
    prior = tick;
    return { tick, entropyQ, flags, aliveCount, luminousDevelopmentQ,
      cells: frame.cells, resources: frame.resources, worldmaking: frame.worldmaking };
  });
}
function frameStride(cellCount) { return FRAME_HEADER_BYTES + cellCount * CELL_BYTES; }
function integer(value, min, max, name) {
  if (!Number.isInteger(value) || value < min || value > max) throw new Error(`invalid ${name}`); return value;
}
