/** WebGL2 four-draw composition with explicit world-session binding. */
import { createProgram, uniformMap } from './gl-utils.js';
import * as SHELL from './shaders-shell.js';
import { viewProjection, cameraEye } from './camera.js';
import { sameWorldIdentity } from '../core/world-session.js';
import { WorldPass } from './world-pass.js';
import { continuityFixture } from './continuity-fixture.js';
import { normalizeCelestialProjection } from './celestial-projection.js';
import { validDeepSpaceField } from './deep-space-field.js';

const EMPTY_DEEP_SPACE = new Uint8Array([2, 4, 8]);

export class GLRenderer {
  constructor(canvas, topo, fields, opts = {}) {
    this.canvas = canvas; this.topo = topo; this.disposed = false; this.boundIdentity = null;
    this.developerMode = opts.developerMode === true;
    this.acceptedFrames = 0; this.rejectedFrames = 0; this.lastFrameAudit = null;
    const gl = canvas.getContext('webgl2', { antialias: true, alpha: false });
    if (!gl) throw new Error('WebGL2 unavailable');
    this.gl = gl; this.backend = 'webgl2'; this.drawCalls = 4;
    this.background = this.make(SHELL.VS_BACKGROUND, SHELL.FS_BACKGROUND);
    this.deepSpaceTexture = null; this.deepSpaceField = null; this.deepSpaceTextureUploads = 0;
    this.deepSpaceFieldUploads = 0; this.deepSpaceError = null;
    this.initializeDeepSpaceTexture(opts.celestial?.deepSpace);
    this.world = new WorldPass(gl, topo, fields, { cloudField: opts.celestial?.cloud }); this.onContextLoss = opts.onContextLoss ?? (() => {});
    this.contextLossListener = (event) => { event.preventDefault(); if (!this.disposed) this.onContextLoss(); };
    canvas.addEventListener('webglcontextlost', this.contextLossListener);
  }
  make(vertex, fragment) {
    const program = createProgram(this.gl, vertex, fragment);
    return { program, u: uniformMap(this.gl, program) };
  }
  initializeDeepSpaceTexture(field) {
    const gl = this.gl; this.deepSpaceTexture = gl.createTexture();
    if (!this.deepSpaceTexture) { this.deepSpaceError = 'deep-space texture unavailable'; return false; }
    gl.bindTexture(gl.TEXTURE_2D, this.deepSpaceTexture); gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return this.uploadDeepSpaceTexture(validDeepSpaceField(field) ? field : null);
  }
  uploadDeepSpaceTexture(field) {
    if (!this.deepSpaceTexture) return false; const gl = this.gl; const valid = validDeepSpaceField(field);
    gl.bindTexture(gl.TEXTURE_2D, this.deepSpaceTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB8, valid ? field.width : 1, valid ? field.height : 1,
      0, gl.RGB, gl.UNSIGNED_BYTE, valid ? field.bytes : EMPTY_DEEP_SPACE);
    this.deepSpaceTextureUploads++; this.deepSpaceField = valid ? field : null;
    if (valid) this.deepSpaceFieldUploads++; return valid;
  }
  setDeepSpaceField(field) {
    if (!validDeepSpaceField(field) || field === this.deepSpaceField) return field === this.deepSpaceField;
    return this.uploadDeepSpaceTexture(field);
  }
  backgroundState() { return Object.freeze({ deepSpaceSignature: this.deepSpaceField?.signature ?? null,
    deepSpaceBytes: this.deepSpaceField?.byteLength ?? 0, deepSpaceTextureUploads: this.deepSpaceTextureUploads,
    deepSpaceFieldUploads: this.deepSpaceFieldUploads, deepSpaceError: this.deepSpaceError }); }
  bindWorldSession(identity) { if (this.disposed) return false; this.boundIdentity = identity ?? null;
    this.world.bindWorldSession(this.boundIdentity); return true; }
  resetDynamicState() {
    if (this.disposed) return false; this.world.resetDynamicState(); const gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height); gl.clearColor(0.012, 0.016, 0.022, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); this.lastFrameAudit = null; return true;
  }
  resize(cssWidth, cssHeight, dpr) {
    if (this.disposed) return; const width = Math.max(1, Math.round(cssWidth * dpr));
    const height = Math.max(1, Math.round(cssHeight * dpr));
    if (this.canvas.width !== width || this.canvas.height !== height) { this.canvas.width = width; this.canvas.height = height; }
  }
  accepts(scene) { return !this.boundIdentity || (sameWorldIdentity(scene.worldIdentity, this.boundIdentity)
    && sameWorldIdentity(scene.snapshot, this.boundIdentity)); }
  render(scene) {
    if (this.disposed || !this.accepts(scene)) { this.rejectedFrames++; return false; }
    const gl = this.gl; const aspect = this.canvas.width / Math.max(1, this.canvas.height);
    const vp = viewProjection(scene.camera, aspect); const eye = cameraEye(scene.camera); const fixture = continuityFixture(scene, this.developerMode);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height); gl.clearColor(0.012, 0.016, 0.022, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST); gl.disable(gl.BLEND);
    const celestial = normalizeCelestialProjection(scene.celestial);
    gl.depthMask(false); gl.useProgram(this.background.program);
    gl.uniform1f(this.background.u.get('uFixture'), fixture ? 1 : 0);
    gl.uniform3fv(this.background.u.get('uFixtureColor'), fixture?.background ?? [0, 0, 0]);
    gl.uniform2f(this.background.u.get('uResolution'), this.canvas.width, this.canvas.height);
    gl.uniform1f(this.background.u.get('uSkySeed'), (celestial.skySeed % 65_521) / 65_521);
    this.setDeepSpaceField(celestial.deepSpace); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.deepSpaceTexture);
    gl.uniform1i(this.background.u.get('uDeepSpaceField'), 0);
    gl.uniform1f(this.background.u.get('uDeepSpaceEnabled'), !fixture && celestial.deepSpaceEnabled
      && celestial.deepSpace === this.deepSpaceField ? 1 : 0);
    gl.uniform3f(this.background.u.get('uStarCounts'), celestial.starCounts[0], celestial.starCounts[1], celestial.starCounts[2]);
    const event = celestial.shootingStar;
    gl.uniform1f(this.background.u.get('uShootingActive'), event ? 1 : 0);
    gl.uniform4f(this.background.u.get('uShootingPath'), event?.startX ?? 0, event?.startY ?? 0, event?.endX ?? 0, event?.endY ?? 0);
    gl.uniform4f(this.background.u.get('uShootingState'), event?.progress ?? 0, event?.width ?? 1,
      event ? event.intensity * event.visibility : 0, event?.tailLength ?? 0.2);
    gl.drawArrays(gl.TRIANGLES, 0, 3); gl.depthMask(true);
    if (!this.world.draw(vp, eye, scene.snapshot, scene.selectedNode, scene.highlightedCells ?? [], scene.time, scene.pulse, fixture, celestial)) {
      this.rejectedFrames++; return false;
    }
    gl.bindVertexArray(null); this.acceptedFrames++;
    this.lastFrameAudit = frameAudit(scene, this.world.dynamicState(), celestial, this.backgroundState()); return true;
  }
  dispose() {
    if (this.disposed) return; this.disposed = true;
    this.canvas.removeEventListener('webglcontextlost', this.contextLossListener);
    this.world.dispose(); if (this.deepSpaceTexture) this.gl.deleteTexture(this.deepSpaceTexture);
    this.gl.deleteProgram(this.background.program); this.deepSpaceTexture = null; this.deepSpaceField = null; this.boundIdentity = null;
  }
}
function frameAudit(scene, dynamic, celestial, background) {
  const snapshot = scene.snapshot; return Object.freeze({ worldSessionId: snapshot?.worldSessionId ?? null,
    presentationGeneration: snapshot?.presentationGeneration ?? null, lifeCells: count(snapshot?.alive),
    highlights: scene.highlightedCells?.length ?? 0, celestial: Object.freeze({ starCount: celestial.starCount,
      starCounts: celestial.starCounts, deepSpaceSignature: celestial.deepSpace?.signature ?? null,
      deepSpaceBytes: celestial.deepSpace?.byteLength ?? 0,
      shootingStarId: celestial.shootingStar?.id ?? null, cloudSignature: celestial.cloud?.signature ?? null,
      cloudPhase: celestial.cloudPhase, skySeed: celestial.skySeed, starCatalogBytes: celestial.stars.byteLength,
      background }), dynamic });
}
function count(values) { let result = 0; if (values) for (const value of values) if (value) result++; return result; }
