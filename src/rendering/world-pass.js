/** Dual-cell planet surface, etched boundaries, and atmosphere draw pass. */
import { createProgram, uniformMap, createBuffer } from './gl-utils.js';
import { createCellGeometry } from './cell-geometry.js';
import * as SH from './shaders.js';
import * as SHELL from './shaders-shell.js';
import * as BOUNDARY from './shaders-boundary.js';
import { sameWorldIdentity } from '../core/world-session.js';

export class WorldPass {
  constructor(gl, topo, fields) {
    this.gl = gl;
    this.topo = topo;
    this.geometry = createCellGeometry(topo, fields);
    this.programs = {
      globe: this.make(SH.VS_GLOBE, SH.FS_GLOBE),
      boundary: this.make(BOUNDARY.VS_BOUNDARY, BOUNDARY.FS_BOUNDARY),
      atmosphere: this.make(SHELL.VS_ATMOSPHERE, SHELL.FS_ATMOSPHERE),
    };
    this.lifeData = new Float32Array(this.geometry.vertexCount * 3);
    this.ecologyData = new Uint8Array(this.geometry.vertexCount * 4);
    this.lastSnapshot = null; this.boundIdentity = null; this.disposed = false;
    this.lastTick = -1;
    this.zero3 = new Float32Array(3);
    this.historyCenters = new Float32Array(24);
    this.buffers = [];
    this.vaos = [];
    this.initialize();
  }
  make(vertex, fragment) {
    const program = createProgram(this.gl, vertex, fragment);
    return { program, u: uniformMap(this.gl, program) };
  }
  buffer(target, data, usage) {
    const value = createBuffer(this.gl, target, data, usage);
    this.buffers.push(value);
    return value;
  }
  initialize() {
    const gl = this.gl; const g = this.geometry;
    this.lifeBuffer = this.buffer(gl.ARRAY_BUFFER, this.lifeData, gl.DYNAMIC_DRAW);
    this.globeVao = this.vao();
    this.attribute(this.programs.globe, 'aPos', this.buffer(gl.ARRAY_BUFFER, g.positions), 3);
    this.attribute(this.programs.globe, 'aCenter', this.buffer(gl.ARRAY_BUFFER, g.centers), 3);
    this.attribute(this.programs.globe, 'aMaterial', this.buffer(gl.ARRAY_BUFFER, g.material), 4);
    this.attribute(this.programs.globe, 'aTerrain', this.buffer(gl.ARRAY_BUFFER, g.terrain), 4);
    this.attribute(this.programs.globe, 'aLife', this.lifeBuffer, 3);
    this.ecologyBuffer = this.buffer(gl.ARRAY_BUFFER, this.ecologyData, gl.DYNAMIC_DRAW);
    this.attribute(this.programs.globe, 'aEcology', this.ecologyBuffer, 4, gl.UNSIGNED_BYTE);
    this.globeIndex = this.buffer(gl.ELEMENT_ARRAY_BUFFER, g.indices);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.globeIndex);

    this.boundaryVao = this.vao();
    this.attribute(this.programs.boundary, 'aPos', this.buffer(gl.ARRAY_BUFFER, g.boundaryPositions), 3);
    this.attribute(this.programs.boundary, 'aFeature', this.buffer(gl.ARRAY_BUFFER, g.boundaryFeature), 2);
    this.boundaryIndex = this.buffer(gl.ELEMENT_ARRAY_BUFFER, g.boundaryIndices);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.boundaryIndex);

    this.atmosphereVao = this.vao();
    this.attribute(this.programs.atmosphere, 'aPos', this.buffer(gl.ARRAY_BUFFER, this.topo.positions), 3);
    this.atmosphereIndex = this.buffer(gl.ELEMENT_ARRAY_BUFFER, this.topo.triangles);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.atmosphereIndex);
    gl.bindVertexArray(null);
  }
  vao() {
    const vao = this.gl.createVertexArray();
    this.gl.bindVertexArray(vao); this.vaos.push(vao);
    return vao;
  }
  attribute(program, name, buffer, size, type = this.gl.FLOAT) {
    const gl = this.gl; const location = gl.getAttribLocation(program.program, name);
    if (location < 0) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, size, type, false, 0, 0);
  }
  bindWorldSession(identity) { this.boundIdentity = identity ?? null; this.resetDynamicState(); }
  accepts(snapshot) { return !this.boundIdentity || sameWorldIdentity(snapshot, this.boundIdentity); }
  resetDynamicState() {
    if (this.disposed) return false;
    this.lifeData.fill(0); this.ecologyData.fill(0);
    this.lastSnapshot = null; this.lastTick = -1; this.historyCenters.fill(0);
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.lifeBuffer); gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.lifeData);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.ecologyBuffer); gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.ecologyData);
    return true;
  }
  dynamicState() { return Object.freeze({ life: nonZero(this.lifeData),
    ecology: nonZero(this.ecologyData), tick: this.lastTick }); }
  uploadLife(snapshot) {
    if (snapshot === this.lastSnapshot && (snapshot?.tick ?? -1) === this.lastTick) return;
    this.lastSnapshot = snapshot;
    this.lastTick = snapshot?.tick ?? -1;
    const cells = this.geometry.vertexCell;
    if (!snapshot) { this.lifeData.fill(0); this.ecologyData.fill(0); }
    else {
      const memory = snapshot.status === 'memory' || snapshot.status === 'trophies';
      for (let vertex = 0; vertex < cells.length; vertex++) {
        const cell = cells[vertex]; this.ecologyData[vertex * 4] = snapshot.resourceRichnessQ?.[cell] ?? 0;
        this.ecologyData[vertex * 4 + 1] = snapshot.resourceState?.[cell] ?? 0;
        this.ecologyData[vertex * 4 + 2] = snapshot.transformationState?.[cell] ?? 0;
        this.ecologyData[vertex * 4 + 3] = snapshot.electricityQ?.[cell] ?? 0;
        if (memory) {
          this.lifeData[vertex * 3] = snapshot.memoryStatus[cell];
          this.lifeData[vertex * 3 + 1] = snapshot.memoryBranch[cell] + snapshot.memoryKind[cell] * 0.1;
          this.lifeData[vertex * 3 + 2] = snapshot.memoryImprintWeight[cell]
            + snapshot.memoryTier[cell] * 2 + snapshot.memoryEmphasis[cell] * 32;
        } else {
          this.lifeData[vertex * 3] = snapshot.alive[cell] ? Math.min(1, 0.25 + snapshot.biomass[cell] * 0.55) : 0;
          this.lifeData[vertex * 3 + 1] = snapshot.stress[cell];
          this.lifeData[vertex * 3 + 2] = snapshot.lifeState?.[cell]
            ?? (snapshot.alive[cell] ? 1 : snapshot.biomass[cell] > 0 ? 5 : 0);
        }
      }
    }
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.lifeBuffer); this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.lifeData);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.ecologyBuffer); this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.ecologyData);
  }
  draw(vp, eye, snapshot, selectedNode, highlightedCells = [], time = 0, pulse = false, fixture = null) {
    if (this.disposed || !this.accepts(snapshot)) return false;
    const gl = this.gl; this.uploadLife(snapshot);
    const globe = this.programs.globe;
    gl.useProgram(globe.program);
    gl.uniformMatrix4fv(globe.u.get('uViewProj'), false, vp);
    gl.uniform3fv(globe.u.get('uEye'), eye);
    gl.uniform1f(globe.u.get('uEntropy'), snapshot?.entropy ?? 0);
    gl.uniform1f(globe.u.get('uMemory'), ['memory', 'trophies'].includes(snapshot?.status) ? 1 : 0);
    gl.uniform1f(globe.u.get('uTime'), Number.isFinite(time) ? time : 0);
    gl.uniform1f(globe.u.get('uPulse'), pulse ? 1 : 0);
    gl.uniform1f(globe.u.get('uElectricityDevelopment'), Math.max(0, Math.min(1, snapshot?.luminousDevelopment ?? 0)));
    const selected = Number.isInteger(selectedNode) ? selectedNode : -1;
    gl.uniform1f(globe.u.get('uHasSelection'), selected >= 0 ? 1 : 0);
    gl.uniform3fv(globe.u.get('uSelectedCenter'), selected >= 0
      ? this.topo.positions.subarray(selected * 3, selected * 3 + 3) : this.zero3);
    this.historyCenters.fill(0); const count = Math.min(8, highlightedCells.length);
    for (let i = 0; i < count; i++) this.historyCenters.set(this.topo.positions.subarray(highlightedCells[i] * 3, highlightedCells[i] * 3 + 3), i * 3);
    gl.uniform1i(globe.u.get('uHistoryCount'), count); gl.uniform3fv(globe.u.get('uHistoryCenter'), this.historyCenters);
    gl.uniform1f(globe.u.get('uFixture'), fixture ? 1 : 0);
    gl.uniform3fv(globe.u.get('uFixtureColor'), fixture?.surface ?? this.zero3);
    gl.bindVertexArray(this.globeVao);
    gl.drawElements(gl.TRIANGLES, this.geometry.indices.length, gl.UNSIGNED_SHORT, 0);

    if (fixture) return true;
    const boundary = this.programs.boundary;
    gl.useProgram(boundary.program);
    gl.uniformMatrix4fv(boundary.u.get('uViewProj'), false, vp);
    gl.uniform3fv(boundary.u.get('uEye'), eye);
    gl.uniform1f(boundary.u.get('uEntropy'), snapshot?.entropy ?? 0);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false); gl.bindVertexArray(this.boundaryVao);
    gl.drawElements(gl.TRIANGLES, this.geometry.boundaryIndices.length, gl.UNSIGNED_SHORT, 0);
    gl.depthMask(true);

    const atmosphere = this.programs.atmosphere;
    gl.useProgram(atmosphere.program);
    gl.uniformMatrix4fv(atmosphere.u.get('uViewProj'), false, vp);
    gl.uniform3fv(atmosphere.u.get('uEye'), eye);
    gl.uniform1f(atmosphere.u.get('uEntropy'), snapshot?.entropy ?? 0);
    gl.blendFunc(gl.ONE, gl.ONE); gl.cullFace(gl.FRONT); gl.enable(gl.CULL_FACE);
    gl.bindVertexArray(this.atmosphereVao);
    gl.drawElements(gl.TRIANGLES, this.topo.triangles.length, gl.UNSIGNED_SHORT, 0);
    gl.disable(gl.CULL_FACE); return true;
  }
  dispose() {
    if (this.disposed) return; this.disposed = true;
    for (const vao of this.vaos) this.gl.deleteVertexArray(vao);
    for (const buffer of this.buffers) this.gl.deleteBuffer(buffer);
    for (const value of Object.values(this.programs)) this.gl.deleteProgram(value.program);
    this.vaos.length = 0; this.buffers.length = 0;
  }
}
function nonZero(values) { let count = 0; for (const value of values) if (value !== 0) count++; return count; }
