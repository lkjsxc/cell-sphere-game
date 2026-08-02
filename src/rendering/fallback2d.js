/** Canvas 2D cellular world fallback with geography-equivalent cell polygons. */
import { LIFE_STATE } from '../core/life-state.js';
import { createDualMesh } from '../world/dual-mesh.js';
import { cameraBasis } from './camera.js';
import { EVENT_TINTS } from './event-tints.js';

const BIOME_COLOR = Object.freeze([
  [8, 42, 62], [14, 76, 88], [145, 126, 76], [35, 91, 45], [22, 73, 42],
  [83, 119, 50], [137, 116, 52], [164, 116, 53], [37, 110, 82], [96, 94, 72],
  [112, 110, 104], [113, 128, 104], [205, 218, 218],
]);

export class Canvas2DRenderer {
  constructor(canvas, topo, fields) {
    this.canvas = canvas; this.topo = topo; this.fields = fields;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) throw new Error('Canvas 2D unavailable');
    this.backend = 'canvas2d';
    this.dual = createDualMesh(topo);
    this.px = new Float32Array(topo.nodeCount); this.py = new Float32Array(topo.nodeCount);
    this.facing = new Float32Array(topo.nodeCount);
    this.cornerX = new Float32Array(this.dual.cornerCount);
    this.cornerY = new Float32Array(this.dual.cornerCount);
    this.cornerFacing = new Float32Array(this.dual.cornerCount);
  }

  resize(cssW, cssH, dpr) {
    const w = Math.max(1, Math.round(cssW * dpr)); const h = Math.max(1, Math.round(cssH * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w; this.canvas.height = h;
    }
  }

  basis(camera) { return cameraBasis(camera); }

  render(scene) {
    const { ctx, canvas, topo, fields } = this; const { snapshot, camera } = scene;
    const w = canvas.width; const h = canvas.height;
    const cx = w * (0.5 + camera.offsetX * 0.5); const cy = h * (0.5 - camera.offsetY * 0.5);
    const radius = Math.min(w, h) * 0.40 * (3.1 / camera.dist);
    const basis = this.basis(camera); const entropy = snapshot?.entropy ?? 0; const dim = 1 - entropy * 0.55;
    const bg = ctx.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#070b14'); bg.addColorStop(1, '#0d1421');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    const glow = ctx.createRadialGradient(cx, cy, radius * 0.9, cx, cy, radius * 1.25);
    glow.addColorStop(0, `rgba(64,140,158,${0.28 - entropy * 0.12})`); glow.addColorStop(1, 'rgba(64,140,158,0)');
    ctx.fillStyle = glow; ctx.fillRect(cx - radius * 1.3, cy - radius * 1.3, radius * 2.6, radius * 2.6);
    this.project(topo.positions, this.px, this.py, this.facing, basis, cx, cy, radius);
    this.project(this.dual.corners, this.cornerX, this.cornerY, this.cornerFacing, basis, cx, cy, radius);

    for (let cell = 0; cell < topo.nodeCount; cell++) {
      if (this.facing[cell] <= 0.02) continue;
      const color = BIOME_COLOR[fields.biomeId?.[cell] ?? 5]; const forest = fields.forestDensity?.[cell] ?? 0;
      this.cellPath(cell); ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},${(0.58 + this.facing[cell] * 0.34) * dim})`; ctx.fill();
      if (forest > 0.08) {
        this.cellPath(cell, 0.72); ctx.fillStyle = `rgba(9,54,30,${forest * 0.34})`; ctx.fill();
      }
    }
    if (snapshot) this.drawCellOverlays(snapshot, scene.fade ?? 1);
    if (scene.adaptation) this.drawAdaptation(scene.adaptation);
    this.drawBoundaries(false); this.drawBoundaries(true); this.drawRivers();
    for (const cell of (scene.highlightedCells ?? []).slice(0, 8)) {
      if (this.facing[cell] <= 0) continue; this.cellPath(cell, 0.82);
      ctx.strokeStyle = 'rgba(246,186,79,.96)'; ctx.lineWidth = 2.4; ctx.stroke();
    }
    if (Number.isInteger(scene.selectedNode) && this.facing[scene.selectedNode] > 0) {
      this.cellPath(scene.selectedNode, 0.84); ctx.strokeStyle = 'rgba(202,238,219,.95)'; ctx.lineWidth = 2.2; ctx.stroke();
    }
  }

  project(points, outX, outY, outFacing, basis, cx, cy, radius) {
    const { dir, right, up } = basis;
    for (let i = 0; i < outX.length; i++) {
      const x = points[i * 3]; const y = points[i * 3 + 1]; const z = points[i * 3 + 2];
      outFacing[i] = x * dir[0] + y * dir[1] + z * dir[2];
      outX[i] = cx + (x * right[0] + y * right[1] + z * right[2]) * radius;
      outY[i] = cy - (x * up[0] + y * up[1] + z * up[2]) * radius;
    }
  }

  cellPath(cell, scale = 1) {
    const { ctx, dual, cornerX, cornerY, px, py } = this; const start = dual.cellStart[cell];
    ctx.beginPath();
    for (let offset = start; offset < dual.cellStart[cell + 1]; offset++) {
      const corner = dual.cellCorners[offset];
      const x = px[cell] + (cornerX[corner] - px[cell]) * scale;
      const y = py[cell] + (cornerY[corner] - py[cell]) * scale;
      if (offset === start) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  drawCellOverlays(snapshot, fade) {
    const { ctx, topo } = this; const events = snapshot.events ?? [];
    for (let cell = 0; cell < topo.nodeCount; cell++) {
      if (this.facing[cell] <= 0.02) continue;
      const state = snapshot.lifeState?.[cell]
        ?? (snapshot.alive[cell] ? LIFE_STATE.LIVING : snapshot.biomass[cell] > 0 ? LIFE_STATE.DEAD_REMAINS : 0);
      if (state !== LIFE_STATE.UNOCCUPIED) {
        const styles = lifeStyles(state, fade); this.cellPath(cell); ctx.fillStyle = styles.fill; ctx.fill();
        if (styles.inset) {
          this.cellPath(cell, styles.scale); ctx.fillStyle = styles.inset; ctx.fill();
          if (styles.stroke) { ctx.strokeStyle = styles.stroke; ctx.lineWidth = styles.width; ctx.stroke(); }
        }
      }
      for (const event of events) {
        if (dotCell(topo.positions, cell, event.center) < event.radiusDot) continue;
        const tint = EVENT_TINTS[event.family] ?? [0.7, 0.7, 0.7]; this.cellPath(cell);
        ctx.fillStyle = `rgba(${tint[0] * 255 | 0},${tint[1] * 255 | 0},${tint[2] * 255 | 0},${0.22 * fade})`; ctx.fill();
      }
    }
  }

  drawAdaptation(event) {
    const max = Math.max(1, event.maxDistance); const width = event.category === 1 ? 0.18 : 0.10;
    for (let cell = 0; cell < this.topo.nodeCount; cell++) {
      const distance = event.distances[cell]; if (distance === 255 || this.facing[cell] <= 0.02) continue;
      let strength = event.reduced ? (distance === 0 ? 1 : 0)
        : Math.max(0, 1 - Math.abs(distance / max - event.progress) / width);
      if (event.category === 4) strength *= 0.65 + 0.35 * Math.sin(distance * 1.7 - event.progress * 28);
      if (event.category === 5) strength *= 0.55 + (this.fields.forestDensity?.[cell] ?? 0) * 0.45;
      if (strength <= 0) continue;
      const style = adaptationStyle(event.category, strength); this.cellPath(cell, style.scale);
      this.ctx.fillStyle = style.fill; this.ctx.fill();
      if (style.stroke) { this.ctx.strokeStyle = style.stroke; this.ctx.lineWidth = 1; this.ctx.stroke(); }
    }
  }

  drawBoundaries(coast) {
    const { ctx, topo, dual } = this; ctx.beginPath();
    for (let edge = 0; edge < topo.edgeCount; edge++) {
      const isCoast = this.fields.landMask?.[topo.edgeA[edge]] !== this.fields.landMask?.[topo.edgeB[edge]];
      if (isCoast !== coast) continue;
      const a = dual.boundaryCornerA[edge]; const b = dual.boundaryCornerB[edge];
      if (this.cornerFacing[a] <= 0 || this.cornerFacing[b] <= 0) continue;
      ctx.moveTo(this.cornerX[a], this.cornerY[a]); ctx.lineTo(this.cornerX[b], this.cornerY[b]);
    }
    ctx.strokeStyle = coast ? 'rgba(82,151,159,.52)' : 'rgba(142,154,144,.13)';
    ctx.lineWidth = coast ? 0.9 : 0.45; ctx.stroke();
  }

  drawRivers() {
    const { ctx, topo, fields } = this; ctx.lineCap = 'round';
    for (let cell = 0; cell < topo.nodeCount; cell++) {
      const down = fields.drainTo?.[cell] ?? -1; const strength = fields.riverStrength?.[cell] ?? 0;
      if (down < 0 || strength <= 0 || this.facing[cell] <= 0 || this.facing[down] <= 0) continue;
      ctx.strokeStyle = `rgba(71,177,205,${0.52 + strength * 0.34})`; ctx.lineWidth = 0.7 + strength * 2.4;
      ctx.beginPath(); ctx.moveTo(this.px[cell], this.py[cell]); ctx.lineTo(this.px[down], this.py[down]); ctx.stroke();
    }
  }

  dispose() { /* no persistent GPU resources */ }
}

function dotCell(positions, a, b) {
  const ai = a * 3; const bi = b * 3;
  return positions[ai] * positions[bi] + positions[ai + 1] * positions[bi + 1] + positions[ai + 2] * positions[bi + 2];
}

function adaptationStyle(category, strength) {
  const alpha = Math.max(0, Math.min(0.46, strength * 0.46));
  if (category === 2) return { fill: `rgba(229,142,74,${alpha})`, scale: 0.58 };
  if (category === 3) return { fill: `rgba(172,205,163,${alpha * 0.35})`, stroke: `rgba(202,231,190,${alpha})`, scale: 0.76 };
  if (category === 4) return { fill: `rgba(159,197,148,${alpha})`, scale: 0.70 };
  if (category === 5) return { fill: `rgba(116,190,104,${alpha})`, scale: 0.82 };
  if (category === 6) return { fill: `rgba(190,209,191,${alpha * 0.72})`, scale: 0.48 };
  return { fill: `rgba(205,214,119,${alpha})`, scale: 1 };
}

function lifeStyles(state, fade) {
  if (state === LIFE_STATE.FRONTIER) return { fill: `rgba(181,187,103,${0.30 * fade})`, inset: `rgba(229,224,157,${0.34 * fade})`, scale: 0.58 };
  if (state === LIFE_STATE.STRESSED) return { fill: `rgba(154,94,59,${0.38 * fade})`, inset: 'rgba(0,0,0,0)', stroke: `rgba(225,190,137,${0.55 * fade})`, width: 0.8, scale: 0.70 };
  if (state === LIFE_STATE.CRITICAL) return { fill: `rgba(179,53,35,${0.50 * fade})`, inset: `rgba(59,28,25,${0.26 * fade})`, stroke: `rgba(247,214,174,${0.66 * fade})`, width: 1.1, scale: 0.60 };
  if (state === LIFE_STATE.DEAD_REMAINS) return { fill: `rgba(103,96,87,${0.24 * fade})` };
  return { fill: `rgba(154,165,86,${0.29 * fade})` };
}
