/** WebGL2 composition: quiet field, dual-cell world, atmosphere, and life. */
import { createProgram, uniformMap } from './gl-utils.js';
import * as SHELL from './shaders-shell.js';
import { viewProjection, cameraEye } from './camera.js';
import { WorldPass } from './world-pass.js';

export class GLRenderer {
  constructor(canvas, topo, fields, opts = {}) {
    this.canvas = canvas;
    this.topo = topo;
    const gl = canvas.getContext('webgl2', { antialias: true, alpha: false });
    if (!gl) throw new Error('WebGL2 unavailable');
    this.gl = gl;
    this.backend = 'webgl2';
    this.drawCalls = 4;
    this.background = this.make(SHELL.VS_BACKGROUND, SHELL.FS_BACKGROUND);
    this.world = new WorldPass(gl, topo, fields);
    this.onContextLoss = opts.onContextLoss ?? (() => {});
    canvas.addEventListener('webglcontextlost', (event) => {
      event.preventDefault(); this.onContextLoss();
    });
  }

  make(vertex, fragment) {
    const program = createProgram(this.gl, vertex, fragment);
    return { program, u: uniformMap(this.gl, program) };
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
    const aspect = this.canvas.width / Math.max(1, this.canvas.height);
    const vp = viewProjection(scene.camera, aspect);
    const eye = cameraEye(scene.camera);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0.012, 0.016, 0.022, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); gl.disable(gl.BLEND);

    gl.depthMask(false);
    gl.useProgram(this.background.program);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.depthMask(true);

    this.world.draw(vp, eye, scene.snapshot, scene.selectedNode, scene.adaptation, scene.highlightedCells ?? []);
    gl.bindVertexArray(null);
  }

  dispose() {
    const gl = this.gl;
    this.world.dispose();
    gl.deleteProgram(this.background.program);
  }
}
