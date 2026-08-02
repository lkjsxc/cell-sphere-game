/** WebGL2 composition: quiet field, dual-cell world, atmosphere, and life. */
import { createProgram, uniformMap, createBuffer } from './gl-utils.js';
import * as SH from './shaders.js';
import * as SHN from './shaders-network.js';
import { viewProjection, cameraEye } from './camera.js';
import { NetworkPass } from './network-pass.js';
import { WorldPass } from './world-pass.js';

export class GLRenderer {
  constructor(canvas, topo, fields, opts = {}) {
    this.canvas = canvas;
    this.topo = topo;
    const gl = canvas.getContext('webgl2', { antialias: true, alpha: false });
    if (!gl) throw new Error('WebGL2 unavailable');
    this.gl = gl;
    this.backend = 'webgl2';
    this.background = this.make(SH.VS_BACKGROUND, SH.FS_BACKGROUND);
    this.world = new WorldPass(gl, topo, fields);
    const veins = this.make(SHN.VS_VEINS, SHN.FS_VEINS);
    const tips = this.make(SHN.VS_TIPS, SHN.FS_TIPS);
    this.network = new NetworkPass(gl, veins, tips, topo, this.world.geometry.dual);
    this.networkResources = [];
    this.initializeNetwork();
    this.onContextLoss = opts.onContextLoss ?? (() => {});
    canvas.addEventListener('webglcontextlost', (event) => {
      event.preventDefault(); this.onContextLoss();
    });
  }

  make(vertex, fragment) {
    const program = createProgram(this.gl, vertex, fragment);
    return { program, u: uniformMap(this.gl, program) };
  }

  resource(target, data, usage) {
    const buffer = createBuffer(this.gl, target, data, usage);
    this.networkResources.push(buffer);
    return buffer;
  }

  initializeNetwork() {
    const gl = this.gl;
    const corners = new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]);
    const quad = this.resource(gl.ARRAY_BUFFER, corners);
    const index = this.resource(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]));
    const vein = this.resource(gl.ARRAY_BUFFER, this.network.veinData, gl.DYNAMIC_DRAW);
    const veinVao = gl.createVertexArray();
    gl.bindVertexArray(veinVao);
    this.attribute(this.network.pv, 'aCorner', quad, 2);
    this.attribute(this.network.pv, 'aPosA', vein, 3, 36, 0, 1);
    this.attribute(this.network.pv, 'aPosB', vein, 3, 36, 12, 1);
    this.attribute(this.network.pv, 'aParams', vein, 3, 36, 24, 1);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index);

    const tip = this.resource(gl.ARRAY_BUFFER, this.network.tipData, gl.DYNAMIC_DRAW);
    const tipVao = gl.createVertexArray();
    gl.bindVertexArray(tipVao);
    this.attribute(this.network.pt, 'aCorner', quad, 2);
    this.attribute(this.network.pt, 'aPos', tip, 3, 20, 0, 1);
    this.attribute(this.network.pt, 'aParams', tip, 2, 20, 12, 1);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index);
    gl.bindVertexArray(null);
    this.networkVaos = [veinVao, tipVao];
    this.network.bind({ veinBuf: vein, tipBuf: tip, veinsVao: veinVao, tipsVao: tipVao, quadIdx: index });
  }

  attribute(program, name, buffer, size, stride = 0, offset = 0, divisor = 0) {
    const gl = this.gl; const location = gl.getAttribLocation(program.program, name);
    if (location < 0) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, stride, offset);
    if (divisor) gl.vertexAttribDivisor(location, divisor);
  }

  resize(cssWidth, cssHeight, dpr) {
    const width = Math.max(1, Math.round(cssWidth * dpr));
    const height = Math.max(1, Math.round(cssHeight * dpr));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width; this.canvas.height = height;
    }
  }

  render(scene) {
    const gl = this.gl;
    const fade = scene.fade ?? 1;
    const aspect = this.canvas.width / Math.max(1, this.canvas.height);
    const vp = viewProjection(scene.camera, aspect);
    const eye = cameraEye(scene.camera);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0.012, 0.016, 0.022, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); gl.disable(gl.BLEND);

    gl.depthMask(false);
    gl.useProgram(this.background.program);
    gl.uniform1f(this.background.u.get('uTime'), scene.time);
    gl.uniform1f(this.background.u.get('uTwinkle'), scene.pulse ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.depthMask(true);

    this.world.draw(vp, eye, scene.time, scene.pulse, scene.snapshot,
      (program, snapshot) => this.network.setOverlays(program, snapshot));
    this.network.draw(vp, eye, scene.time, scene.pulse, fade, scene.snapshot);
    gl.bindVertexArray(null);
  }

  dispose() {
    const gl = this.gl;
    this.world.dispose();
    gl.deleteProgram(this.background.program);
    gl.deleteProgram(this.network.pv.program);
    gl.deleteProgram(this.network.pt.program);
    for (const vao of this.networkVaos) gl.deleteVertexArray(vao);
    for (const buffer of this.networkResources) gl.deleteBuffer(buffer);
  }
}
