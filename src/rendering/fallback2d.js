/** Canvas 2D cellular world fallback with geography-equivalent cell polygons. */
import { LIFE_STATE } from '../core/life-state.js';
import { createDualMesh } from '../world/dual-mesh.js';
import { cameraBasis } from './camera.js';
import { sameWorldIdentity } from '../core/world-session.js';
import { continuityFixture } from './continuity-fixture.js';

const WORLD_LIGHT = Object.freeze((() => { const value=[-.52,.72,.44]; const length=Math.hypot(...value); return value.map((axis)=>axis/length); })());
const BIOME_COLOR = Object.freeze([
  [7, 29, 84], [13, 75, 126], [145, 126, 76], [35, 91, 45], [22, 73, 42],
  [83, 119, 50], [137, 116, 52], [164, 116, 53], [37, 110, 82], [96, 94, 72],
  [112, 110, 104], [113, 128, 104], [205, 218, 218], [13, 66, 88],
]);
const BASE_SHELL = Object.freeze([8 / 255, 28 / 255, 62 / 255]);

export class Canvas2DRenderer {
  constructor(canvas, topo, fields, opts = {}) {
    this.canvas = canvas; this.topo = topo; this.fields = fields; this.developerMode = opts.developerMode === true;
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
    const basis = this.basis(camera); const entropy = snapshot?.entropy ?? 0; const fixture = continuityFixture(scene, this.developerMode);
    if (fixture) {
      ctx.fillStyle = cssColor(fixture.background); ctx.fillRect(0, 0, w, h);
    } else {
      const bg = ctx.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#070b14'); bg.addColorStop(1, '#0d1421');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
      const glow = ctx.createRadialGradient(cx, cy, radius * 0.9, cx, cy, radius * 1.25);
      glow.addColorStop(0, `rgba(64,140,158,${0.28 - entropy * 0.12})`); glow.addColorStop(1, 'rgba(64,140,158,0)');
      ctx.fillStyle = glow; ctx.fillRect(cx - radius * 1.3, cy - radius * 1.3, radius * 2.6, radius * 2.6);
    }
    this.project(topo.positions, this.px, this.py, this.facing, basis, cx, cy, radius);
    this.project(this.dual.corners, this.cornerX, this.cornerY, this.cornerFacing, basis, cx, cy, radius);
    drawBaseShell(ctx, cx, cy, radius, fixture?.surface ?? BASE_SHELL);
    if (fixture) { ctx.save(); clipDisk(ctx, cx, cy, radius); }

    for (let cell = 0; cell < topo.nodeCount; cell++) {
      if (fixture) { this.cellPath(cell); ctx.fillStyle = cssColor(fixture.surface); ctx.fill(); continue; }
      if (this.facing[cell] <= .02) continue;
      let color = BIOME_COLOR[fields.biomeId?.[cell] ?? 5]; const forest = fields.forestDensity?.[cell] ?? 0;
      const transform = snapshot?.transformationState?.[cell] ?? 0;
      if (transform === 3) color = [24, 91, 125]; else if (transform === 4) color = [38, 112, 78]; else if (transform === 5) color = [18, 83, 48];
      const shore = fields.lakeShore?.[cell] ? .28 : 0; const canopy = forest * .38;
      const base = [Math.round((color[0] * (1 - canopy) + 9 * canopy) * (1 - shore) + 45 * shore),
        Math.round((color[1] * (1 - canopy) + 54 * canopy) * (1 - shore) + 100 * shore),
        Math.round((color[2] * (1 - canopy) + 30 * canopy) * (1 - shore) + 76 * shore)];
      const isWater = fields.biomeId?.[cell] <= 1 || fields.biomeId?.[cell] === 13 || transform === 3;
      const local = resourceColor(base, snapshot?.resourceState?.[cell] ?? 0,
        (snapshot?.resourceRichnessQ?.[cell] ?? 128) / 255, isWater);
      this.cellPath(cell); ctx.fillStyle = `rgba(${local[0]},${local[1]},${local[2]},${.58 + this.facing[cell] * .34})`; ctx.fill();
    }
    if (!fixture) {
      if (snapshot) this.drawCellOverlays(snapshot, scene.fade ?? 1, scene.time ?? 0, scene.pulse === true);
      this.drawBoundaries(false); this.drawBoundaries(true);
      for (const cell of (scene.highlightedCells ?? []).slice(0, 8)) {
        if (this.facing[cell] <= 0) continue; this.cellPath(cell, 0.82);
        ctx.strokeStyle = 'rgba(246,186,79,.96)'; ctx.lineWidth = 2.4; ctx.stroke();
      }
      if (Number.isInteger(scene.selectedNode) && this.facing[scene.selectedNode] > 0) {
        this.cellPath(scene.selectedNode, 0.84); ctx.strokeStyle = 'rgba(202,238,219,.95)'; ctx.lineWidth = 2.2; ctx.stroke();
      }
    }
    if (fixture) ctx.restore();
    this.acceptedFrames++; this.lastFrameAudit = Object.freeze({ worldSessionId: snapshot?.worldSessionId ?? null,
      presentationGeneration: snapshot?.presentationGeneration ?? null, lifeCells: count(snapshot?.alive),
      highlights: scene.highlightedCells?.length ?? 0,
      clearCount: this.clearCount }); return true;
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

  drawCellOverlays(snapshot, fade, time = 0, pulse = false) {
    const { ctx, topo } = this;
    for (let cell = 0; cell < topo.nodeCount; cell++) {
      if (this.facing[cell] <= 0.02) continue;
      if (snapshot.status === 'memory' || snapshot.status === 'trophies') {
        const styles = memoryStyles(snapshot.memoryStatus[cell], snapshot.memoryKind[cell],
          snapshot.memoryImprintWeight[cell], fade, snapshot.memoryBranch[cell], time, pulse);
        if (!styles) continue; this.cellPath(cell); ctx.fillStyle = styles.fill; ctx.fill();
        if (styles.outerStroke) { ctx.strokeStyle = styles.outerStroke; ctx.lineWidth = styles.outerWidth;
          ctx.setLineDash(styles.dash ?? []); ctx.stroke(); ctx.setLineDash([]); }
        if (styles.inset) { this.cellPath(cell, styles.scale); ctx.fillStyle = styles.inset; ctx.fill();
          if (styles.stroke) { ctx.strokeStyle = styles.stroke; ctx.lineWidth = styles.width; ctx.stroke(); } }
        continue;
      }
      const state = snapshot.lifeState?.[cell]
        ?? (snapshot.alive[cell] ? LIFE_STATE.LIVING : snapshot.biomass[cell] > 0 ? LIFE_STATE.DEAD_REMAINS : 0);
      if (state !== LIFE_STATE.UNOCCUPIED) {
        const styles = lifeStyles(state, fade); this.cellPath(cell); ctx.fillStyle = styles.fill; ctx.fill();
        if (styles.inset) { this.cellPath(cell, styles.scale); ctx.fillStyle = styles.inset; ctx.fill();
          if (styles.stroke) { ctx.strokeStyle = styles.stroke; ctx.lineWidth = styles.width; ctx.stroke(); } }
      }
      const powered = (snapshot.electricityQ?.[cell] ?? 0) / 255;
      if (powered > 0) {
        const at=cell*3; const lightDot=topo.positions[at]*WORLD_LIGHT[0]+topo.positions[at+1]*WORLD_LIGHT[1]+topo.positions[at+2]*WORLD_LIGHT[2];
        const day=Math.max(0,Math.min(1,(lightDot+.16)/.30)); const night=1-day;
        const development=Math.max(0,Math.min(1,snapshot.electricityDevelopment??0));
        const glow=Math.pow(powered,.62)*( .24+night*.38+development*.14)*fade;
        this.cellPath(cell); ctx.fillStyle=`rgba(238,194,72,${Math.min(.72,glow)})`; ctx.fill();
        this.cellPath(cell,.52-development*.08); ctx.fillStyle=`rgba(255,231,126,${Math.min(.78,glow*(.72+development*.28))})`; ctx.fill();
        ctx.strokeStyle=`rgba(255,239,161,${Math.min(.86,glow+.16)})`;ctx.lineWidth=1+development*.8;ctx.stroke();
      }
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

function memoryStyles(status, kind, fossil, fade, branch, time, pulse) {
  if (!status && !fossil) return null;
  const selected = [5,6,7,9,10].includes(status); const unlockReady = [3,7].includes(status);
  const owned = [4,8,9,10].includes(status); const ownedReady = [8,10].includes(status);
  const selectedReady = [7,10].includes(status); const locked = [1,5].includes(status);
  const unaffordable = [2,6].includes(status); const special = kind >= 4;
  const tint = ['55,58,59', '49,93,168', '85,191,209', '194,139,66', '105,173,104', '215,237,245', '216,173,76'][branch] ?? '55,58,59';
  const outline = selected ? 'rgba(235,248,238,.98)' : unaffordable ? 'rgba(171,185,168,.65)' : null;
  if (locked) return { fill: `rgba(${tint},${0.76 * fade})`, outerStroke:outline, outerWidth:1.2 };
  if (unaffordable) return { fill:`rgba(104,119,105,${0.52 * fade})`, inset:'rgba(38,43,41,.62)', scale:.62,
    outerStroke:outline, outerWidth:1 };
  const breath = selectedReady && pulse ? .86 + .14 * Math.sin(time * 2.2) : 1;
  if (unlockReady) return { fill:`rgba(${tint},${Math.min(.98, .84 * breath) * fade})`, inset:'rgba(239,244,194,.90)', scale:selectedReady ? .42 : .54,
    stroke:'rgba(31,48,38,.95)', width:1.2, outerStroke:outline ?? 'rgba(221,238,205,.88)', outerWidth:selectedReady?2.5:1.5,
    dash:selectedReady?[4,2]:[] };
  if(owned)return{fill:`rgba(${tint},${(ownedReady ? .94 : .78)*breath*fade})`,
    inset:ownedReady?`rgba(244,226,153,${(.82+.10*breath).toFixed(3)})`:special?'rgba(224,218,163,.78)':'rgba(197,220,185,.62)',
    scale:selectedReady ? .40 : special ? .45 : .62, stroke:ownedReady?'rgba(54,48,24,.94)':null, width:1.2,
    outerStroke:outline ?? (ownedReady?'rgba(236,220,158,.82)':null), outerWidth:selectedReady?2.5:1.5,
    dash:selectedReady?[4,2]:[] };
  return { fill:`rgba(111,91,66,${fossil * .48 * fade})` };
}

function drawBaseShell(ctx, cx, cy, radius, color) {
  ctx.beginPath(); ctx.arc(cx, cy, radius + 0.5, 0, Math.PI * 2); ctx.fillStyle = cssColor(color); ctx.fill();
}
function clipDisk(ctx, cx, cy, radius) { ctx.beginPath(); ctx.arc(cx, cy, radius + 0.5, 0, Math.PI * 2); ctx.clip(); }
function cssColor([red, green, blue]) { return `rgb(${Math.round(red * 255)},${Math.round(green * 255)},${Math.round(blue * 255)})`; }

function resourceColor(base, state, richness, water) {
  const target = state === 1 ? (water ? [10, 84, 138] : [92, 126, 45])
    : state === 3 ? [Math.round(mean(base) * .82), Math.round(mean(base) * .88), Math.round(mean(base) * .94)]
      : state === 4 ? (water ? [21, 39, 79] : [94, 79, 56])
        : state === 5 ? (water ? [16, 29, 63] : [88, 68, 43])
          : state === 6 ? (water ? [10, 19, 45] : [49, 48, 45])
            : state === 7 ? (water ? [14, 64, 109] : [65, 91, 58]) : base;
  const amount = state === 1 ? .28 + richness * .10 : state === 3 ? .30 : state === 4 ? .55
    : state === 5 ? .72 : state === 6 ? .82 : state === 7 ? .52 : 0;
  return base.map((value, index) => Math.round(value * (1 - amount) + target[index] * amount));
}
function mean(values) { return values.reduce((sum, value) => sum + value, 0) / values.length; }
function count(values) { let result = 0; if (values) for (const value of values) if (value) result++; return result; }
function lifeStyles(state, fade) {
  if (state === LIFE_STATE.FRONTIER) return { fill: `rgba(181,187,103,${0.30 * fade})`, inset: `rgba(229,224,157,${0.34 * fade})`, scale: 0.58 };
  if (state === LIFE_STATE.STRESSED) return { fill: `rgba(154,94,59,${0.38 * fade})`, inset: 'rgba(0,0,0,0)', stroke: `rgba(225,190,137,${0.55 * fade})`, width: 0.8, scale: 0.70 };
  if (state === LIFE_STATE.CRITICAL) return { fill: `rgba(179,53,35,${0.50 * fade})`, inset: `rgba(59,28,25,${0.26 * fade})`, stroke: `rgba(247,214,174,${0.66 * fade})`, width: 1.1, scale: 0.60 };
  if (state === LIFE_STATE.DEAD_REMAINS) return { fill: `rgba(103,96,87,${0.24 * fade})` };
  return { fill: `rgba(154,165,86,${0.29 * fade})` };
}
