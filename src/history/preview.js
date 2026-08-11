/** Nearest checkpoint lookup and allocation-free renderer projection. */
import { LIFE_STATE } from '../core/life-state.js';

export function nearestFrame(frames, tick) {
  if (!Array.isArray(frames) || !frames.length) return null;
  const target = Number.isFinite(tick) ? tick : frames.at(-1).tick;
  let low = 0; let high = frames.length - 1;
  while (low <= high) {
    const mid = (low + high) >>> 1; const value = frames[mid].tick;
    if (value === target) return frames[mid];
    if (value < target) low = mid + 1; else high = mid - 1;
  }
  if (high < 0) return frames[0]; if (low >= frames.length) return frames.at(-1);
  return target - frames[high].tick <= frames[low].tick - target ? frames[high] : frames[low];
}

export function createPreviewBuffers(cellCount) {
  if (!Number.isInteger(cellCount) || cellCount <= 0) throw new Error('invalid preview cell count');
  return { cellCount, alive: new Uint8Array(cellCount), biomass: new Float32Array(cellCount),
    stress: new Float32Array(cellCount), lifeState: new Uint8Array(cellCount),
    resourceRichnessQ: new Uint8Array(cellCount), resourceState: new Uint8Array(cellCount),
    transformationState: new Uint8Array(cellCount), electricityQ: new Uint8Array(cellCount) };
}

export function projectPreview(frame, buffers) {
  if (!validFrame(frame, buffers.cellCount)) throw new Error('invalid preview frame');
  const { alive, biomass, stress, lifeState, resourceRichnessQ, resourceState, transformationState, electricityQ } = buffers;
  for (let cell = 0; cell < buffers.cellCount; cell++) {
    const life = frame.cells[cell]; const cellClass = life >>> 6;
    const resource = frame.resources[cell]; const worldmaking = frame.worldmaking[cell];
    alive[cell] = cellClass ? 1 : 0; biomass[cell] = ((life >>> 3) & 7) * (2 / 7); stress[cell] = (life & 7) / 7;
    resourceState[cell] = resource & 7; resourceRichnessQ[cell] = Math.round((resource >>> 3) * 255 / 31);
    transformationState[cell] = worldmaking & 7; electricityQ[cell] = Math.round((worldmaking >>> 3) * 255 / 31);
    if (!cellClass) lifeState[cell] = biomass[cell] > 0 ? LIFE_STATE.DEAD_REMAINS : LIFE_STATE.UNOCCUPIED;
    else if (cellClass === 2) lifeState[cell] = LIFE_STATE.FRONTIER;
    else if (cellClass === 3) lifeState[cell] = stress[cell] >= 1 ? LIFE_STATE.CRITICAL : LIFE_STATE.STRESSED;
    else lifeState[cell] = LIFE_STATE.LIVING;
  }
  return { tick: frame.tick, entropy: frame.entropyQ / 255, status: 'history', alive, biomass, stress, lifeState,
    resourceRichnessQ, resourceState, transformationState, electricityQ,
    electricityDevelopment: frame.electricityDevelopmentQ / 255,
    metrics: { aliveCount: frame.aliveCount }, approximate: true, historyVisual: true };
}

function validFrame(frame, cellCount) {
  return Boolean(frame && frame.cells instanceof Uint8Array && frame.resources instanceof Uint8Array
    && frame.worldmaking instanceof Uint8Array && frame.cells.length === cellCount
    && frame.resources.length === cellCount && frame.worldmaking.length === cellCount);
}
