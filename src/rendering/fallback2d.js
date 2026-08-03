/** Canvas 2D cellular world fallback with geography-equivalent cell polygons. */
import { LIFE_STATE } from '../core/life-state.js';
import { createDualMesh } from '../world/dual-mesh.js';
import { cameraBasis } from './camera.js';
import { EVENT_TINT_LIST } from './event-tints.js';
import { sameWorldIdentity } from '../core/world-session.js';

const BIOME_COLOR = Object.freeze([
  [8, 42, 62], [14, 76, 88], [145, 126, 76], [35, 91, 45], [22, 73, 42],
  [83, 119, 50], [137, 116, 52], [164, 116, 53], [37, 110, 82], [96, 94, 72],
  [112, 110, 104], [113, 128, 104], [205, 218, 218], [13, 66, 88],
]);

export class Canvas2DRenderer {
  constructor(canvas, topo, fields) {
    this.canvas = canvas; this.topo = topo; this.fields = fields;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) throw new Error('Canvas 2D unavailable');
    this.backend = 'canvas2d'; this.boundIdentity = null; this.disposed = false;
    this.acceptedFrames = 0; this.rejectedFrames = 0; this.clearCount = 0; this.lastFrameAudit = null;
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
  bindWorldSession(identity) { if (this.disposed) return false; this.boundIdentity = identity ?? null; this.resetDynamicState(); return true; }
  resetDynamicState() { if (this.disposed) return false; this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#070b14'; this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.clearCount++; this.lastFrameAudit = null; return true; }
  accepts(scene) { return !this.boundIdentity || (sameWorldIdentity(scene.worldIdentity, this.boundIdentity)
    && sameWorldIdentity(scene.snapshot, this.boundIdentity)); }

  render(scene) {
    if (this.disposed || !this.accepts(scene)) { this.rejectedFrames++; return false; }
    const { ctx, canvas, topo, fields } = this; const { snapshot, camera } = scene;
    const w = canvas.width; const h = canvas.height;
    const cx = w * (0.5 + camera.offsetX * 0.5); const cy = h * (0.5 - camera.offsetY * 0.5);
    const sizeScale = canvas.clientWidth < 600 ? 0.76 : 0.52;
    const radius = Math.min(w, h) * sizeScale * (3.1 / camera.dist);
    const basis = this.basis(camera); const entropy = snapshot?.entropy ?? 0; const dim = 1 - entropy * 0.55;
    const bg = ctx.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#070b14'); bg.addColorStop(1, '#0d1421');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    const glow = ctx.createRadialGradient(cx, cy, radius * 0.9, cx, cy, radius * 1.25);
    glow.addColorStop(0, `rgba(64,140,158,${0.28 - entropy * 0.12})`); glow.addColorStop(1, 'rgba(64,140,158,0)');
    ctx.fillStyle = glow; ctx.fillRect(cx - radius * 1.3, cy - radius * 1.3, radius * 2.6, radius * 2.6);
    this.project(topo.positions, this.px, this.py, this.facing, basis, cx, cy, radius);
    this.project(this.dual.corners, this.cornerX, this.cornerY, this.cornerFacing, basis, cx, cy, radius);

    for (let cell = 0; cell < topo.nodeCount; cell++) {
      if (this.facing[cell] <= .02) continue;
      const color = BIOME_COLOR[fields.biomeId?.[cell] ?? 5]; const forest = fields.forestDensity?.[cell] ?? 0;
      const shore = fields.lakeShore?.[cell] ? .28 : 0; const canopy = forest * .38;
      const red = Math.round((color[0] * (1 - canopy) + 9 * canopy) * (1 - shore) + 45 * shore);
      const green = Math.round((color[1] * (1 - canopy) + 54 * canopy) * (1 - shore) + 100 * shore);
      const blue = Math.round((color[2] * (1 - canopy) + 30 * canopy) * (1 - shore) + 76 * shore);
      this.cellPath(cell); ctx.fillStyle = `rgba(${red},${green},${blue},${(.58 + this.facing[cell] * .34) * dim})`; ctx.fill();
    }
    if (snapshot) this.drawCellOverlays(snapshot, scene.fade ?? 1);
    if (scene.adaptation) this.drawAdaptation(scene.adaptation);
    this.drawBoundaries(false); this.drawBoundaries(true);
    for (const cell of (scene.highlightedCells ?? []).slice(0, 8)) {
      if (this.facing[cell] <= 0) continue; this.cellPath(cell, 0.82);
      ctx.strokeStyle = 'rgba(246,186,79,.96)'; ctx.lineWidth = 2.4; ctx.stroke();
    }
    if (Number.isInteger(scene.selectedNode) && this.facing[scene.selectedNode] > 0) {
      this.cellPath(scene.selectedNode, 0.84); ctx.strokeStyle = 'rgba(202,238,219,.95)'; ctx.lineWidth = 2.2; ctx.stroke();
    }
    this.acceptedFrames++; this.lastFrameAudit = Object.freeze({ worldSessionId: snapshot?.worldSessionId ?? null,
      presentationGeneration: snapshot?.presentationGeneration ?? null, lifeCells: count(snapshot?.alive),
      eventCells: count(snapshot?.eventStrength), highlights: scene.highlightedCells?.length ?? 0,
      adaptation: Boolean(scene.adaptation), clearCount: this.clearCount }); return true;
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
    const { ctx, topo } = this;
    for (let cell = 0; cell < topo.nodeCount; cell++) {
      if (this.facing[cell] <= 0.02) continue;
      if (snapshot.status === 'memory' || snapshot.status === 'trophies') {
        const styles = memoryStyles(snapshot.memoryStatus[cell], snapshot.memoryKind[cell], snapshot.memoryImprintWeight[cell], fade, snapshot.memoryBranch[cell]);
        if (!styles) continue; this.cellPath(cell); ctx.fillStyle = styles.fill; ctx.fill();
        if (styles.inset) { this.cellPath(cell, styles.scale); ctx.fillStyle = styles.inset; ctx.fill(); }
        if (styles.stroke) { ctx.strokeStyle = styles.stroke; ctx.lineWidth = styles.width; ctx.stroke(); }
        continue;
      }
      const state = snapshot.lifeState?.[cell]
        ?? (snapshot.alive[cell] ? LIFE_STATE.LIVING : snapshot.biomass[cell] > 0 ? LIFE_STATE.DEAD_REMAINS : 0);
      if (state !== LIFE_STATE.UNOCCUPIED) {
        const styles = lifeStyles(state, fade); this.cellPath(cell); ctx.fillStyle = styles.fill; ctx.fill();
        if (styles.inset) { this.cellPath(cell, styles.scale); ctx.fillStyle = styles.inset; ctx.fill();
          if (styles.stroke) { ctx.strokeStyle = styles.stroke; ctx.lineWidth = styles.width; ctx.stroke(); } }
      }
      const eventAmount = (snapshot.eventStrength?.[cell] ?? 0) / 255; const tint = EVENT_TINT_LIST[(snapshot.eventFamily?.[cell] ?? 0) - 1];
      if (eventAmount > 0 && tint) { this.cellPath(cell); ctx.fillStyle = `rgba(${tint[0] * 255 | 0},${tint[1] * 255 | 0},${tint[2] * 255 | 0},${eventAmount * .20 * fade})`; ctx.fill(); }
    }
  }

  drawAdaptation(event) {
    for (let cell = 0; cell < this.topo.nodeCount; cell++) {
      const arrival = event.arrivals[cell]; if (arrival === 0xffff || this.facing[cell] <= 0.02) continue;
      const age = event.timeMs - arrival;
      const front = Math.max(0, 1 - Math.abs(age) / 175);
      const trail = age < 0 ? 0 : Math.max(0, 1 - age / event.trailMs) * 0.48;
      let strength = event.reduced ? (arrival <= event.reducedThreshold ? (arrival ? 0.5 : 1) : 0)
        : Math.max(front, trail);
      if (event.category === 4) strength *= 0.65 + 0.35 * Math.sin(arrival * .031 - event.timeMs * .018);
      if (event.category === 5) strength *= 0.55 + (this.fields.forestDensity?.[cell] ?? 0) * 0.45;
      if (strength <= 0) continue;
      const style = adaptationStyle(event.category, strength); this.cellPath(cell, style.scale);
      this.ctx.fillStyle = style.fill; this.ctx.fill();
      if (style.stroke) { this.ctx.strokeStyle = style.stroke; this.ctx.lineWidth = 1; this.ctx.stroke(); }
    }
  }

  drawBoundaries(emphasis) {
    const { ctx, topo, dual } = this; ctx.beginPath();
    for (let edge = 0; edge < topo.edgeCount; edge++) {
      const cellA = topo.edgeA[edge]; const cellB = topo.edgeB[edge];
      const coast = this.fields.landMask?.[cellA] !== this.fields.landMask?.[cellB];
      const lakeA = this.fields.lakeId?.[cellA] ?? -1; const lakeB = this.fields.lakeId?.[cellB] ?? -1;
      const lakeEdge = lakeA !== lakeB && (lakeA >= 0 || lakeB >= 0);
      if ((coast || lakeEdge) !== emphasis) continue;
      const a = dual.boundaryCornerA[edge]; const b = dual.boundaryCornerB[edge];
      if (this.cornerFacing[a] <= 0 || this.cornerFacing[b] <= 0) continue;
      ctx.moveTo(this.cornerX[a], this.cornerY[a]); ctx.lineTo(this.cornerX[b], this.cornerY[b]);
    }
    ctx.strokeStyle = emphasis ? 'rgba(64,139,151,.58)' : 'rgba(142,154,144,.13)';
    ctx.lineWidth = emphasis ? .9 : .45; ctx.stroke();
  }

  dispose() { if (this.disposed) return; this.disposed = true; this.boundIdentity = null; this.lastFrameAudit = null; }
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

function memoryStyles(status, kind, fossil, fade, branch) {
  if (!status && !fossil) return null;
  const selected = status >= 5; const plain = selected ? status - 4 : status;
  const special = kind >= 4; const stroke = selected ? 'rgba(225,244,232,.98)' : plain === 2 ? 'rgba(171,185,168,.65)' : null;
  const tint = ['55,58,59', '82,106,72', '61,99,112', '111,88,53', '62,99,66', '91,75,108', '105,77,69'][branch] ?? '55,58,59';
  if (plain === 1) return { fill: `rgba(${tint},${0.76 * fade})`, stroke, width: 1.2 };
  if (plain === 2) return { fill: `rgba(104,119,105,${0.52 * fade})`, inset: 'rgba(38,43,41,.62)', scale: 0.62, stroke, width: 1.0 };
  if (plain === 3) return { fill: `rgba(177,202,137,${0.90 * fade})`, inset: 'rgba(230,235,184,.75)', scale: 0.54, stroke, width: 1.5 };
  if (plain === 4) return { fill: `rgba(117,158,128,${0.82 * fade})`, inset: special ? 'rgba(224,218,163,.78)' : 'rgba(197,220,185,.62)', scale: special ? 0.45 : 0.62, stroke, width: 1.5 };
  return { fill: `rgba(111,91,66,${fossil * 0.48 * fade})` };
}

function count(values) { let result = 0; if (values) for (const value of values) if (value) result++; return result; }
function lifeStyles(state, fade) {
  if (state === LIFE_STATE.FRONTIER) return { fill: `rgba(181,187,103,${0.30 * fade})`, inset: `rgba(229,224,157,${0.34 * fade})`, scale: 0.58 };
  if (state === LIFE_STATE.STRESSED) return { fill: `rgba(154,94,59,${0.38 * fade})`, inset: 'rgba(0,0,0,0)', stroke: `rgba(225,190,137,${0.55 * fade})`, width: 0.8, scale: 0.70 };
  if (state === LIFE_STATE.CRITICAL) return { fill: `rgba(179,53,35,${0.50 * fade})`, inset: `rgba(59,28,25,${0.26 * fade})`, stroke: `rgba(247,214,174,${0.66 * fade})`, width: 1.1, scale: 0.60 };
  if (state === LIFE_STATE.DEAD_REMAINS) return { fill: `rgba(103,96,87,${0.24 * fade})` };
  return { fill: `rgba(154,165,86,${0.29 * fade})` };
}
