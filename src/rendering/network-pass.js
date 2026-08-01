/**
 * Network draw pass: owns the per-snapshot instance buffers for vein ribbons
 * and frontier tips, uploads the globe's event/signal overlay uniforms, and
 * issues the two instanced draws. Extracted from the renderer so each module
 * stays under the line budget and the network math is unit-testable in Node.
 *
 * The pass reads immutable snapshots only; it never touches simulation state.
 */
import { buildVeinInstances, buildTipInstances, EVENT_TINTS } from './instances.js';
import { BALANCE as B } from '../game/balance.js';

export class NetworkPass {
  /**
   * @param {WebGL2RenderingContext} gl
   * @param {{program: WebGLProgram, u: Map<string, WebGLUniformLocation>}} progVeins
   * @param {{program: WebGLProgram, u: Map<string, WebGLUniformLocation>}} progTips
   * @param {import('../world/icosphere.js').Topology} topo
   */
  constructor(gl, progVeins, progTips, topo) {
    this.gl = gl;
    this.pv = progVeins;
    this.pt = progTips;
    this.topo = topo;
    // Preallocated instance payloads; filled each snapshot, never reallocated.
    this.veinData = new Float32Array(topo.edgeCount * 9);
    this.tipData = new Float32Array(topo.nodeCount * 5);
    /** @type {WebGLBuffer|null} */ this.veinBuf = null;
    /** @type {WebGLBuffer|null} */ this.tipBuf = null;
    /** @type {WebGLVertexArrayObject|null} */ this.veinsVao = null;
    /** @type {WebGLVertexArrayObject|null} */ this.tipsVao = null;
    /** @type {WebGLBuffer|null} */ this.quadIdx = null;
  }

  /** Attach GPU buffers/VAOs created by the renderer after construction. */
  bind(geom) {
    this.veinBuf = geom.veinBuf;
    this.tipBuf = geom.tipBuf;
    this.veinsVao = geom.veinsVao;
    this.tipsVao = geom.tipsVao;
    this.quadIdx = geom.quadIdx;
  }

  /**
   * Upload event + signal overlay uniforms into the globe program. Must be
   * called while the globe program is active, before its draw call.
   * @param {{u: Map<string, WebGLUniformLocation>}} progGlobe
   * @param {object|null} snapshot
   */
  setOverlays(progGlobe, snapshot) {
    const gl = this.gl;
    const centers = new Float32Array(12);
    const radii = new Float32Array(4);
    const tints = new Float32Array(12);
    const strengths = new Float32Array(4);
    if (snapshot) {
      const pos = this.topo.positions;
      snapshot.events.slice(0, 4).forEach((ev, i) => {
        centers.set([pos[ev.center * 3], pos[ev.center * 3 + 1], pos[ev.center * 3 + 2]], i * 3);
        radii[i] = ev.radiusDot;
        tints.set(EVENT_TINTS[ev.family] ?? [0.7, 0.7, 0.7], i * 3);
        strengths[i] = Math.min(1, ev.intensity);
      });
    }
    gl.uniform3fv(progGlobe.u.get('uEventCenter'), centers);
    gl.uniform1fv(progGlobe.u.get('uEventRadius'), radii);
    gl.uniform3fv(progGlobe.u.get('uEventTint'), tints);
    gl.uniform1fv(progGlobe.u.get('uEventStrength'), strengths);

    const sCenters = new Float32Array(12);
    const sRadii = new Float32Array(4);
    const sStrengths = new Float32Array(4);
    if (snapshot) {
      const pos = this.topo.positions;
      snapshot.signals.slice(0, 4).forEach((sig, i) => {
        sCenters.set([pos[sig.node * 3], pos[sig.node * 3 + 1], pos[sig.node * 3 + 2]], i * 3);
        sRadii[i] = B.SIGNAL_RADIUS_DOT;
        sStrengths[i] = Math.min(1, (sig.untilTick - snapshot.tick) / 40);
      });
    }
    gl.uniform3fv(progGlobe.u.get('uSignalCenter'), sCenters);
    gl.uniform1fv(progGlobe.u.get('uSignalRadius'), sRadii);
    gl.uniform1fv(progGlobe.u.get('uSignalStrength'), sStrengths);
  }

  /**
   * Draw veins then tips. Assumes depth test on and additive-ish blend set
   * by the caller; restores no global state beyond binding its own VAOs.
   */
  draw(vp, eye, time, pulse, fade, snapshot) {
    const gl = this.gl;
    if (!snapshot || fade <= 0.01) return;

    const veins = buildVeinInstances(this.topo, snapshot, this.veinData);
    const pv = this.pv;
    gl.useProgram(pv.program);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); // premultiplied alpha
    gl.uniformMatrix4fv(pv.u.get('uViewProj'), false, vp);
    gl.uniform3fv(pv.u.get('uEye'), eye);
    gl.uniform1f(pv.u.get('uTime'), time);
    gl.uniform1f(pv.u.get('uPulse'), pulse ? 1 : 0);
    gl.uniform1f(pv.u.get('uFade'), fade);
    gl.bindVertexArray(this.veinsVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.veinBuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.veinData, 0, veins * 9);
    gl.drawElementsInstanced(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0, veins);

    const tips = buildTipInstances(this.topo, snapshot, this.tipData);
    const pt = this.pt;
    gl.useProgram(pt.program);
    gl.uniformMatrix4fv(pt.u.get('uViewProj'), false, vp);
    // Billboard basis derived from the view direction (camera looks at origin).
    const len = Math.hypot(eye[0], eye[1], eye[2]) || 1;
    const f = [eye[0] / len, eye[1] / len, eye[2] / len];
    const rl = Math.hypot(f[2], f[0]) || 1;
    gl.uniform3f(pt.u.get('uRight'), f[2] / rl, 0, -f[0] / rl);
    gl.uniform3fv(pt.u.get('uUp'), [0, 1, 0]);
    gl.uniform1f(pt.u.get('uFade'), fade);
    gl.bindVertexArray(this.tipsVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.tipBuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.tipData, 0, tips * 5);
    gl.drawElementsInstanced(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0, tips);
  }
}
