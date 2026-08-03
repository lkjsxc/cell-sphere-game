/** Allocation-bounded player for the production-generated title lifecycle. */
import { decodeVisualHistory } from '../history/codec.js';
import { createPreviewBuffers, projectPreview } from '../history/preview.js';
import { TITLE_SHOWCASE } from './data.js';

export class TitleShowcase {
  constructor(topo) {
    const history = decodeVisualHistory(decodeBase64(TITLE_SHOWCASE.dataBase64));
    if (history.cellCount !== topo.nodeCount || history.frames.length !== TITLE_SHOWCASE.frameCount) {
      throw new Error('title showcase topology mismatch');
    }
    this.frames = history.frames; this.buffers = createPreviewBuffers(topo.nodeCount);
    this.reducedFrame = TITLE_SHOWCASE.reducedFrame;
    this.startedAt = null; this.hiddenAt = null; this.frameIndex = -1; this.reduced = false;
    this.apply(0);
  }

  update(now, reducedMotion = false, hidden = false) {
    if (hidden) { if (this.hiddenAt == null) this.hiddenAt = now; return; }
    if (this.hiddenAt != null) {
      if (this.startedAt != null) this.startedAt += now - this.hiddenAt;
      this.hiddenAt = null;
    }
    if (reducedMotion) {
      this.reduced = true; this.apply(TITLE_SHOWCASE.reducedFrame); return;
    }
    if (this.reduced || this.startedAt == null) { this.startedAt = now; this.reduced = false; }
    const elapsed = Math.max(0, now - this.startedAt) % TITLE_SHOWCASE.durationMs;
    this.apply(Math.min(this.frames.length - 1, Math.floor(elapsed / TITLE_SHOWCASE.frameIntervalMs)));
  }

  apply(index) {
    if (index === this.frameIndex) return false;
    const projected = projectPreview(this.frames[index], this.buffers);
    projected.status = 'attract'; projected.metrics = { aliveCount: this.frames[index].aliveCount,
      coverage: this.frames[index].aliveCount / this.buffers.cellCount, score: 0, pendingAdaptations: 0 };
    this.snapshot = projected; this.frameIndex = index; return true;
  }
}

export { TITLE_SHOWCASE };

function decodeBase64(value) {
  const raw = atob(value); const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes.buffer;
}
