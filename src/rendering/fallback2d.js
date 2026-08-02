/**
 * Canvas 2D fallback renderer. Same public interface as GLRenderer
 * (resize/render/dispose). Simplified shading, but fully playable: globe,
 * veins, events, selection, and facing-culled geography.
 */
import { EVENT_TINTS } from './instances.js';
import { cameraBasis } from './camera.js';

const BIOME_COLOR = Object.freeze([
  [8, 42, 62], [14, 76, 88], [145, 126, 76], [35, 91, 45], [22, 73, 42],
  [83, 119, 50], [137, 116, 52], [164, 116, 53], [37, 110, 82], [96, 94, 72],
  [112, 110, 104], [113, 128, 104], [205, 218, 218],
]);

export class Canvas2DRenderer {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {import('../world/icosphere.js').Topology} topo
   * @param {import('../world/fields.js').Fields} fields
   */
  constructor(canvas, topo, fields) {
    this.canvas = canvas;
    this.topo = topo;
    this.fields = fields;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) throw new Error('Canvas 2D unavailable');
    this.backend = 'canvas2d';
  }

  resize(cssW, cssH, dpr) {
    const w = Math.max(1, Math.round(cssW * dpr));
    const h = Math.max(1, Math.round(cssH * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
  }

  /** Camera basis shared with the unconstrained WebGL orbit. */
  basis(camera) { return cameraBasis(camera); }

  render(scene) {
    const { ctx, canvas, topo, fields } = this;
    const { snapshot, camera } = scene;
    const w = canvas.width;
    const h = canvas.height;
    const cx = w * (0.5 + camera.offsetX * 0.5);
    const cy = h * (0.5 - camera.offsetY * 0.5);
    const R = Math.min(w, h) * 0.40 * (3.1 / camera.dist);
    const { dir, right, up } = this.basis(camera);
    const entropy = snapshot ? snapshot.entropy : 0;

    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#070b14');
    bg.addColorStop(1, '#0d1421');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Atmosphere glow
    const glow = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.25);
    glow.addColorStop(0, `rgba(64, 140, 158, ${0.28 - entropy * 0.12})`);
    glow.addColorStop(1, 'rgba(64, 140, 158, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(cx - R * 1.3, cy - R * 1.3, R * 2.6, R * 2.6);

    // Globe disc
    const disc = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.35, R * 0.1, cx, cy, R);
    const dim = 1 - entropy * 0.55;
    disc.addColorStop(0, `rgb(${38 * dim + 20}, ${86 * dim + 22}, ${66 * dim + 24})`);
    disc.addColorStop(1, `rgb(${10 * dim + 6}, ${24 * dim + 8}, ${20 * dim + 10})`);
    ctx.fillStyle = disc;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();

    const pos = topo.positions;
    const px = new Float32Array(topo.nodeCount);
    const py = new Float32Array(topo.nodeCount);
    const facing = new Float32Array(topo.nodeCount);
    for (let i = 0; i < topo.nodeCount; i++) {
      const x = pos[i * 3];
      const y = pos[i * 3 + 1];
      const z = pos[i * 3 + 2];
      facing[i] = x * dir[0] + y * dir[1] + z * dir[2];
      px[i] = cx + (x * right[0] + y * right[1] + z * right[2]) * R;
      py[i] = cy - (x * up[0] + y * up[1] + z * up[2]) * R;
    }

    // Explicit biome cells make geography readable without WebGL.
    for (let i = 0; i < topo.nodeCount; i++) {
      if (facing[i] <= 0.03) continue;
      const color = BIOME_COLOR[fields.biomeId?.[i] ?? 5];
      const forest = fields.forestDensity?.[i] ?? 0; const size = 2 + forest * 2;
      ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${(0.32 + facing[i] * 0.42) * dim})`;
      ctx.fillRect(px[i] - size / 2, py[i] - size / 2, size, size);
    }
    ctx.lineCap = 'round';
    for (let i = 0; i < topo.nodeCount; i++) {
      const down = fields.drainTo?.[i] ?? -1; const strength = fields.riverStrength?.[i] ?? 0;
      if (down < 0 || strength <= 0 || facing[i] <= 0 || facing[down] <= 0) continue;
      ctx.strokeStyle = `rgba(71, 177, 205, ${0.52 + strength * 0.34})`; ctx.lineWidth = 0.7 + strength * 2.4;
      ctx.beginPath(); ctx.moveTo(px[i], py[i]); ctx.lineTo(px[down], py[down]); ctx.stroke();
    }

    if (Number.isInteger(scene.selectedNode) && facing[scene.selectedNode] > 0) {
      ctx.beginPath(); ctx.arc(px[scene.selectedNode], py[scene.selectedNode], Math.max(7, R * 0.025), 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(202, 238, 219, .95)'; ctx.lineWidth = 3; ctx.stroke();
    }
    if (snapshot) this.renderNetwork(scene, px, py, facing, R, cx, cy, dir);
  }

  renderNetwork(scene, px, py, facing, R, cx, cy, dir) {
    const { ctx, topo } = this;
    const snap = scene.snapshot;
    const fade = scene.fade ?? 1;

    // Event footprints
    for (const ev of snap.events) {
      if (facing[ev.center] <= 0) continue;
      const tint = EVENT_TINTS[ev.family] ?? [0.7, 0.7, 0.7];
      const angRadius = Math.acos(Math.max(-1, Math.min(1, ev.radiusDot)));
      ctx.beginPath();
      ctx.arc(px[ev.center], py[ev.center], angRadius * R, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${tint[0] * 255 | 0}, ${tint[1] * 255 | 0}, ${tint[2] * 255 | 0}, ${0.14 * fade})`;
      ctx.fill();
    }

    // Veins
    ctx.lineCap = 'round';
    const { edgeA, edgeB, edgeCount } = topo;
    for (let e = 0; e < edgeCount; e++) {
      if (snap.edgeActive[e] !== 1) continue;
      const a = edgeA[e];
      const b = edgeB[e];
      if (facing[a] <= 0 || facing[b] <= 0) continue;
      const stress = (snap.stress[a] + snap.stress[b]) * 0.5;
      const r = 110 + stress * 145;
      const g = 242 - stress * 100;
      const bl = 214 - stress * 90;
      ctx.strokeStyle = `rgba(${r | 0}, ${g | 0}, ${bl | 0}, ${(0.5 + snap.conductance[e] * 0.16) * fade})`;
      ctx.lineWidth = 0.6 + snap.conductance[e] * 1.8;
      ctx.beginPath();
      ctx.moveTo(px[a], py[a]);
      ctx.lineTo(px[b], py[b]);
      ctx.stroke();
    }

  }

  dispose() { /* no persistent GPU resources */ }
}
