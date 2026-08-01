/**
 * WebGL2 renderer: globe, atmosphere, and the network pass (vein ribbons +
 * tips, in network-pass.js). Reads immutable snapshots; never touches
 * simulation state. Throws on init failure so callers fall back to Canvas 2D.
 *
 * Steady-state draw calls: background, globe, atmosphere, veins, tips (5).
 * One compact dynamic buffer upload per snapshot for veins and tips each.
 */
import { createProgram, uniformMap, createBuffer } from './gl-utils.js';
import * as SH from './shaders.js';
import * as SHN from './shaders-network.js';
import { viewProjection, cameraEye } from './camera.js';
import { NetworkPass } from './network-pass.js';

export class GLRenderer {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {import('../world/icosphere.js').Topology} topo
   * @param {import('../world/fields.js').Fields} fields
   * @param {{onContextLoss?: () => void}} [opts]
   */
  constructor(canvas, topo, fields, opts = {}) {
    this.canvas = canvas;
    this.topo = topo;
    this.fields = fields;
    const gl = canvas.getContext('webgl2', { antialias: true, alpha: false });
    if (!gl) throw new Error('WebGL2 unavailable');
    this.gl = gl;
    this.backend = 'webgl2';
    this.onContextLoss = opts.onContextLoss ?? (() => {});
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.onContextLoss();
    });

    this.prog = {
      bg: this.mk(SH.VS_BACKGROUND, SH.FS_BACKGROUND),
      globe: this.mk(SH.VS_GLOBE, SH.FS_GLOBE),
      atmo: this.mk(SH.VS_ATMOSPHERE, SH.FS_ATMOSPHERE),
    };
    // Network pass owns its programs + instance payloads.
    const progVeins = this.mk(SHN.VS_VEINS, SHN.FS_VEINS);
    const progTips = this.mk(SHN.VS_TIPS, SHN.FS_TIPS);
    this.network = new NetworkPass(gl, progVeins, progTips, topo);
    this.initGeometry();
  }

  mk(vs, fs) {
    const gl = this.gl;
    const program = createProgram(gl, vs, fs);
    return { program, u: uniformMap(gl, program) };
  }

  initGeometry() {
    const gl = this.gl;
    const topo = this.topo;

    // Globe + atmosphere share the static position buffer.
    this.posBuf = createBuffer(gl, gl.ARRAY_BUFFER, topo.positions);
    this.indexBuf = createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, topo.triangles);
    this.globeVao = gl.createVertexArray();
    gl.bindVertexArray(this.globeVao);
    this.attrib(this.prog.globe, 'aPos', this.posBuf, 3);
    this.attrib(this.prog.globe, 'aNutrient', this.fieldBuf(this.fields.baseNutrient), 1);
    this.attrib(this.prog.globe, 'aMoisture', this.fieldBuf(this.fields.baseMoisture), 1);
    this.attrib(this.prog.globe, 'aTemp', this.fieldBuf(this.fields.baseTemp), 1);
    this.attrib(this.prog.globe, 'aAltitude', this.fieldBuf(this.fields.altitude), 1);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuf);
    this.atmoVao = gl.createVertexArray();
    gl.bindVertexArray(this.atmoVao);
    this.attrib(this.prog.atmo, 'aPos', this.posBuf, 3);

    // Instanced network geometry (corner quad + dynamic instance buffers).
    const corners = new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]);
    const quadBuf = createBuffer(gl, gl.ARRAY_BUFFER, corners);
    const quadIdx = createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]));
    const veinBuf = createBuffer(gl, gl.ARRAY_BUFFER, this.network.veinData, gl.DYNAMIC_DRAW);
    const veinsVao = gl.createVertexArray();
    gl.bindVertexArray(veinsVao);
    this.attrib(this.network.pv, 'aCorner', quadBuf, 2);
    this.attrib(this.network.pv, 'aPosA', veinBuf, 3, 36, 0, 1);
    this.attrib(this.network.pv, 'aPosB', veinBuf, 3, 36, 12, 1);
    this.attrib(this.network.pv, 'aParams', veinBuf, 3, 36, 24, 1);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quadIdx);

    const tipBuf = createBuffer(gl, gl.ARRAY_BUFFER, this.network.tipData, gl.DYNAMIC_DRAW);
    const tipsVao = gl.createVertexArray();
    gl.bindVertexArray(tipsVao);
    this.attrib(this.network.pt, 'aCorner', quadBuf, 2);
    this.attrib(this.network.pt, 'aPos', tipBuf, 3, 20, 0, 1);
    this.attrib(this.network.pt, 'aParams', tipBuf, 2, 20, 12, 1);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quadIdx);
    gl.bindVertexArray(null);

    this.network.bind({ veinBuf, tipBuf, veinsVao, tipsVao, quadIdx });
  }

  fieldBuf(arr) { return createBuffer(this.gl, this.gl.ARRAY_BUFFER, arr); }

  attrib(prog, name, buffer, size, stride = 0, offset = 0, divisor = 0) {
    const gl = this.gl;
    const loc = gl.getAttribLocation(prog.program, name);
    if (loc < 0) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride, offset);
    if (divisor) gl.vertexAttribDivisor(loc, divisor);
  }

  /** @param {number} cssW @param {number} cssH @param {number} dpr */
  resize(cssW, cssH, dpr) {
    const w = Math.max(1, Math.round(cssW * dpr));
    const h = Math.max(1, Math.round(cssH * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
  }

  /**
   * Render one frame.
   * @param {{snapshot: object|null, camera: object, time: number,
   *          pulse: boolean, fade?: number}} scene
   */
  render(scene) {
    const gl = this.gl;
    const { snapshot, camera, time } = scene;
    const fade = scene.fade ?? 1;
    const aspect = this.canvas.width / Math.max(1, this.canvas.height);
    const vp = viewProjection(camera, aspect);
    const eye = cameraEye(camera);

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0.01, 0.015, 0.03, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);

    // Background (no depth write).
    gl.depthMask(false);
    gl.useProgram(this.prog.bg.program);
    gl.uniform1f(this.prog.bg.u.get('uTime'), time);
    gl.uniform1f(this.prog.bg.u.get('uTwinkle'), scene.pulse ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.depthMask(true);

    // Globe surface with event/signal overlays folded into its shader.
    const pg = this.prog.globe;
    gl.useProgram(pg.program);
    gl.uniformMatrix4fv(pg.u.get('uViewProj'), false, vp);
    gl.uniform3fv(pg.u.get('uEye'), eye);
    gl.uniform1f(pg.u.get('uEntropy'), snapshot ? snapshot.entropy : 0);
    gl.uniform1f(pg.u.get('uTime'), time);
    gl.uniform1f(pg.u.get('uPulse'), scene.pulse ? 1 : 0);
    this.network.setOverlays(pg, snapshot);
    gl.bindVertexArray(this.globeVao);
    gl.drawElements(gl.TRIANGLES, this.topo.triCount * 3, gl.UNSIGNED_SHORT, 0);

    // Atmosphere rim (additive, back faces only).
    const pa = this.prog.atmo;
    gl.useProgram(pa.program);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.uniformMatrix4fv(pa.u.get('uViewProj'), false, vp);
    gl.uniform3fv(pa.u.get('uEye'), eye);
    gl.uniform1f(pa.u.get('uEntropy'), snapshot ? snapshot.entropy : 0);
    gl.cullFace(gl.FRONT);
    gl.enable(gl.CULL_FACE);
    gl.bindVertexArray(this.atmoVao);
    gl.drawArrays(gl.TRIANGLES, 0, this.topo.nodeCount);
    gl.disable(gl.CULL_FACE);

    this.network.draw(vp, eye, time, scene.pulse, fade, snapshot);
    gl.bindVertexArray(null);
  }

  dispose() {
    const gl = this.gl;
    for (const p of Object.values(this.prog)) gl.deleteProgram(p.program);
    gl.deleteProgram(this.network.pv.program);
    gl.deleteProgram(this.network.pt.program);
  }
}
