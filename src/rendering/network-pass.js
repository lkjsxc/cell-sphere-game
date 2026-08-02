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
   * @param {import('../world/dual-mesh.js').DualMesh} dual
   */
  constructor(gl, progVeins, progTips, topo, dual) {
    this.gl = gl;
    this.pv = progVeins;
    this.pt = progTips;
    this.topo = topo;
    this.dual = dual;
    // Preallocated instance payloads; filled each snapshot, never reallocated.
    this.veinData = new Float32Array(topo.edgeCount * 9);
    this.tipData = new Float32Array(topo.nodeCount * 5);
    this.overlay = {
      eventCenters: new Float32Array(12), eventRadii: new Float32Array(4),
      eventTints: new Float32Array(12), eventStrengths: new Float32Array(4),
      signalCenters: new Float32Array(12), signalRadii: new Float32Array(4),
      signalStrengths: new Float32Array(4),
    };
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
    const gl = this.gl; const data = this.overlay;
    data.eventCenters.fill(0); data.eventRadii.fill(0); data.eventTints.fill(0); data.eventStrengths.fill(0);
    data.signalCenters.fill(0); data.signalRadii.fill(0); data.signalStrengths.fill(0);
    if (snapshot) {
      const pos = this.topo.positions;
      for (let i = 0; i < Math.min(4, snapshot.events.length); i++) {
        const ev = snapshot.events[i]; const color = EVENT_TINTS[ev.family] ?? [0.7, 0.7, 0.7];
        const source = ev.center * 3; const target = i * 3;
        data.eventCenters[target] = pos[source]; data.eventCenters[target + 1] = pos[source + 1];
        data.eventCenters[target + 2] = pos[source + 2];
        data.eventRadii[i] = ev.radiusDot; data.eventTints.set(color, target);
        data.eventStrengths[i] = Math.min(1, ev.intensity);
      }
      for (let i = 0; i < Math.min(4, snapshot.signals.length); i++) {
        const signal = snapshot.signals[i]; const source = signal.node * 3; const target = i * 3;
        data.signalCenters[target] = pos[source]; data.signalCenters[target + 1] = pos[source + 1];
        data.signalCenters[target + 2] = pos[source + 2]; data.signalRadii[i] = B.SIGNAL_RADIUS_DOT;
        data.signalStrengths[i] = Math.min(1, (signal.untilTick - snapshot.tick) / 40);
      }
    }
    gl.uniform3fv(progGlobe.u.get('uEventCenter'), data.eventCenters);
    gl.uniform1fv(progGlobe.u.get('uEventRadius'), data.eventRadii);
    gl.uniform3fv(progGlobe.u.get('uEventTint'), data.eventTints);
    gl.uniform1fv(progGlobe.u.get('uEventStrength'), data.eventStrengths);
    gl.uniform3fv(progGlobe.u.get('uSignalCenter'), data.signalCenters);
    gl.uniform1fv(progGlobe.u.get('uSignalRadius'), data.signalRadii);
    gl.uniform1fv(progGlobe.u.get('uSignalStrength'), data.signalStrengths);
  }

  /**
   * Draw veins then tips. Assumes depth test on and additive-ish blend set
   * by the caller; restores no global state beyond binding its own VAOs.
   */
  draw(vp, eye, time, pulse, fade, snapshot) {
    const gl = this.gl;
    if (!snapshot || fade <= 0.01) return;

    const veins = buildVeinInstances(this.topo, snapshot, this.veinData, this.dual);
    const pv = this.pv;
    gl.useProgram(pv.program);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); // premultiplied alpha
    gl.uniformMatrix4fv(pv.u.get('uViewProj'), false, vp);
    gl.uniform3fv(pv.u.get('uEye'), eye);
    gl.uniform1f(pv.u.get('uTime'), time);
    gl.uniform1f(pv.u.get('uPulse'), pulse ? 1 : 0);
    gl.uniform1f(pv.u.get('uFade'), fade);
    gl.uniform1f(pv.u.get('uMemory'), snapshot.status === 'memory' ? 1 : 0);
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
