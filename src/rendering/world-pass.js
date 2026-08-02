/** Dual-cell planet surface, etched boundaries, and atmosphere draw pass. */
import { createProgram, uniformMap, createBuffer } from './gl-utils.js';
import { createCellGeometry } from './cell-geometry.js';
import * as SH from './shaders.js';
import * as BOUNDARY from './shaders-boundary.js';

export class WorldPass {
  constructor(gl, topo, fields) {
    this.gl = gl;
    this.topo = topo;
    this.geometry = createCellGeometry(topo, fields);
    this.programs = {
      globe: this.make(SH.VS_GLOBE, SH.FS_GLOBE),
      boundary: this.make(BOUNDARY.VS_BOUNDARY, BOUNDARY.FS_BOUNDARY),
      atmosphere: this.make(SH.VS_ATMOSPHERE, SH.FS_ATMOSPHERE),
    };
    this.lifeData = new Float32Array(this.geometry.vertexCount * 2);
    this.lastSnapshot = null;
    this.lastTick = -1;
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
    const knot = new Float32Array(g.vertexCount);
    for (let vertex = 0; vertex < g.vertexCount; vertex++) {
      knot[vertex] = this.topo.degree[g.vertexCell[vertex]] === 5 ? 1 : 0;
    }
    this.globeVao = this.vao();
    this.attribute(this.programs.globe, 'aPos', this.buffer(gl.ARRAY_BUFFER, g.positions), 3);
    this.attribute(this.programs.globe, 'aCenter', this.buffer(gl.ARRAY_BUFFER, g.centers), 3);
    this.attribute(this.programs.globe, 'aMaterial', this.buffer(gl.ARRAY_BUFFER, g.material), 4);
    this.attribute(this.programs.globe, 'aLife', this.lifeBuffer, 2);
    this.attribute(this.programs.globe, 'aKnot', this.buffer(gl.ARRAY_BUFFER, knot), 1);
    this.globeIndex = this.buffer(gl.ELEMENT_ARRAY_BUFFER, g.indices);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.globeIndex);

    this.boundaryVao = this.vao();
    this.attribute(this.programs.boundary, 'aPos', this.buffer(gl.ARRAY_BUFFER, g.boundaryPositions), 3);
    this.attribute(this.programs.boundary, 'aKnot', this.buffer(gl.ARRAY_BUFFER, g.boundaryKind), 1);
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

  attribute(program, name, buffer, size) {
    const gl = this.gl; const location = gl.getAttribLocation(program.program, name);
    if (location < 0) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
  }

  uploadLife(snapshot) {
    if (snapshot === this.lastSnapshot && (snapshot?.tick ?? -1) === this.lastTick) return;
    this.lastSnapshot = snapshot;
    this.lastTick = snapshot?.tick ?? -1;
    const cells = this.geometry.vertexCell;
    if (!snapshot) this.lifeData.fill(0);
    else {
      for (let vertex = 0; vertex < cells.length; vertex++) {
        const cell = cells[vertex];
        this.lifeData[vertex * 2] = snapshot.alive[cell] ? Math.min(1, 0.25 + snapshot.biomass[cell] * 0.55) : 0;
        this.lifeData[vertex * 2 + 1] = snapshot.stress[cell];
      }
    }
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.lifeBuffer);
    this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.lifeData);
  }

  draw(vp, eye, time, pulse, snapshot, setOverlays) {
    const gl = this.gl; this.uploadLife(snapshot);
    const globe = this.programs.globe;
    gl.useProgram(globe.program);
    gl.uniformMatrix4fv(globe.u.get('uViewProj'), false, vp);
    gl.uniform3fv(globe.u.get('uEye'), eye);
    gl.uniform1f(globe.u.get('uEntropy'), snapshot?.entropy ?? 0);
    gl.uniform1f(globe.u.get('uTime'), time);
    gl.uniform1f(globe.u.get('uPulse'), pulse ? 1 : 0);
    gl.uniform1f(globe.u.get('uMemory'), snapshot?.status === 'memory' ? 1 : 0);
    setOverlays(globe, snapshot);
    gl.bindVertexArray(this.globeVao);
    gl.drawElements(gl.TRIANGLES, this.geometry.indices.length, gl.UNSIGNED_SHORT, 0);

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
    gl.disable(gl.CULL_FACE);
  }

  dispose() {
    for (const vao of this.vaos) this.gl.deleteVertexArray(vao);
    for (const buffer of this.buffers) this.gl.deleteBuffer(buffer);
    for (const value of Object.values(this.programs)) this.gl.deleteProgram(value.program);
  }
}
