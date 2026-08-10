/** Strict bounded visual-History codec. */
export const MAGIC = 'INHV';
export const VERSION = 1;
export const MAX_BYTES = 256 * 1024;
export const MAX_CELLS = 8192;
const HEADER_BYTES = 24;
const FRAME_HEADER_BYTES = 8;

export function encodeVisualHistory(metadata, inputFrames) {
  const cellCount = integer(metadata?.cellCount, 1, MAX_CELLS, 'cellCount');
  const seed = integer(metadata?.seed, 0, 0x3fffffff, 'seed');
  const cadence = integer(metadata?.cadence ?? 50, 1, 65535, 'cadence');
  const frames = thinFrames(validateFrames(inputFrames, cellCount), cellCount);
  if (!frames.length) throw new Error('visual history needs a checkpoint');
  const size = HEADER_BYTES + frames.length * (FRAME_HEADER_BYTES + cellCount);
  if (size > MAX_BYTES) throw new Error('visual history exceeds 256 KiB');
  const buffer = new ArrayBuffer(size); const view = new DataView(buffer); const bytes = new Uint8Array(buffer);
  bytes.set([73, 78, 72, 86]); view.setUint8(4, VERSION); view.setUint8(5, HEADER_BYTES);
  view.setUint16(6, cellCount, true); view.setUint32(8, seed, true); view.setUint16(12, cadence, true);
  view.setUint16(14, frames.length, true); view.setUint32(16, frames.at(-1).tick, true);
  let offset = HEADER_BYTES;
  for (const frame of frames) {
    view.setUint32(offset, frame.tick, true); view.setUint8(offset + 4, frame.entropyQ);
    view.setUint8(offset + 5, frame.flags); view.setUint16(offset + 6, frame.aliveCount, true);
    bytes.set(frame.cells, offset + FRAME_HEADER_BYTES); offset += FRAME_HEADER_BYTES + cellCount;
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
  const terminalTick = view.getUint32(16, true);
  if (!cellCount || cellCount > MAX_CELLS || seed >= 0x40000000 || !cadence || !count || view.getUint32(20, true) !== 0) throw new Error('invalid visual history metadata');
  const stride = FRAME_HEADER_BYTES + cellCount;
  if (HEADER_BYTES + count * stride !== value.byteLength) throw new Error('invalid visual history length');
  const frames = []; let offset = HEADER_BYTES; let prior = -1;
  for (let i = 0; i < count; i++, offset += stride) {
    const tick = view.getUint32(offset, true); const flags = view.getUint8(offset + 5); const aliveCount = view.getUint16(offset + 6, true);
    const cells = bytes.subarray(offset + FRAME_HEADER_BYTES, offset + stride); let countedAlive = 0;
    for (const cell of cells) if (cell >>> 6) countedAlive++;
    if (tick <= prior || flags > 7 || aliveCount !== countedAlive) throw new Error('invalid visual history checkpoint');
    frames.push(Object.freeze({ tick, entropyQ: view.getUint8(offset + 4), flags, aliveCount, cells })); prior = tick;
  }
  if (frames.at(-1).tick !== terminalTick) throw new Error('invalid terminal checkpoint');
  return Object.freeze({ version: VERSION, cellCount, seed, cadence, terminalTick, frames: Object.freeze(frames) });
}

export function isVisualHistoryBuffer(value) {
  try { decodeVisualHistory(value); return true; } catch { return false; }
}

export function thinFrames(input, cellCount) {
  const frames = validateFrames(input, cellCount); const max = Math.floor((MAX_BYTES - HEADER_BYTES) / (FRAME_HEADER_BYTES + cellCount));
  if (frames.length <= max) return frames;
  const major = frames.filter((frame) => frame.flags !== 0); if (major.length > max) throw new Error('major checkpoints exceed visual history cap');
  const ordinary = frames.filter((frame) => frame.flags === 0); const slots = max - major.length;
  const kept = slots ? ordinary.filter((_, index) => Math.floor(index * slots / ordinary.length) !== Math.floor((index - 1) * slots / ordinary.length)).slice(0, slots) : [];
  return [...major, ...kept].sort((a, b) => a.tick - b.tick);
}

function validateFrames(input, cellCount) {
  if (!Array.isArray(input)) throw new Error('checkpoints must be an array');
  let prior = -1;
  return input.map((frame) => {
    const tick = integer(frame?.tick, 0, 0xffffffff, 'tick');
    const entropyQ = integer(frame?.entropyQ, 0, 255, 'entropyQ'); const flags = integer(frame?.flags ?? 0, 0, 255, 'flags');
    const aliveCount = integer(frame?.aliveCount, 0, cellCount, 'aliveCount');
    if (!(frame.cells instanceof Uint8Array) || frame.cells.length !== cellCount || tick <= prior) throw new Error('invalid checkpoint');
    prior = tick; return { tick, entropyQ, flags, aliveCount, cells: frame.cells };
  });
}
function integer(value, min, max, name) {
  if (!Number.isInteger(value) || value < min || value > max) throw new Error(`invalid ${name}`); return value;
}
