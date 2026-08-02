/** Dual-cell planet surface, etched boundaries, and atmosphere draw pass. */
import { createProgram, uniformMap, createBuffer } from './gl-utils.js';
import { createCellGeometry } from './cell-geometry.js';
import * as SH from './shaders.js';
import * as BOUNDARY from './shaders-boundary.js';
import { EVENT_TINTS } from './event-tints.js';

export class WorldPass {
  constructor(gl, topo, fields) {
    this.gl = gl;
    this.topo = topo;
    this.geometry = createCellGeometry(topo, fields);
    this.programs = {
      globe: this.make(SH.VS_GLOBE, SH.FS_GLOBE),
      boundary: this.make(BOUNDARY.VS_BOUNDARY, BOUNDARY.FS_BOUNDARY),
      river: this.make(BOUNDARY.VS_BOUNDARY, BOUNDARY.FS_BOUNDARY),
      atmosphere: this.make(SH.VS_ATMOSPHERE, SH.FS_ATMOSPHERE),
    };
    this.lifeData = new Float32Array(this.geometry.vertexCount * 3);
    this.adaptationData = new Uint8Array(this.geometry.vertexCount * 2); this.adaptationToken = -1;
    this.overlay = {
      centers: new Float32Array(12), radii: new Float32Array(4),
      tints: new Float32Array(12), strengths: new Float32Array(4),
    };
    this.lastSnapshot = null;
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
    this.adaptationBuffer = this.buffer(gl.ARRAY_BUFFER, this.adaptationData, gl.DYNAMIC_DRAW);
    this.attribute(this.programs.globe, 'aAdaptation', this.adaptationBuffer, 2, gl.UNSIGNED_BYTE);
    this.globeIndex = this.buffer(gl.ELEMENT_ARRAY_BUFFER, g.indices);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.globeIndex);

    this.boundaryVao = this.vao();
    this.attribute(this.programs.boundary, 'aPos', this.buffer(gl.ARRAY_BUFFER, g.boundaryPositions), 3);
    this.attribute(this.programs.boundary, 'aFeature', this.buffer(gl.ARRAY_BUFFER, g.boundaryFeature), 2);
    this.boundaryIndex = this.buffer(gl.ELEMENT_ARRAY_BUFFER, g.boundaryIndices);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.boundaryIndex);

    this.riverVao = this.vao();
    this.attribute(this.programs.river, 'aPos', this.buffer(gl.ARRAY_BUFFER, g.riverPositions), 3);
    this.attribute(this.programs.river, 'aFeature', this.buffer(gl.ARRAY_BUFFER, g.riverFeature), 2);
    this.riverIndex = this.buffer(gl.ELEMENT_ARRAY_BUFFER, g.riverIndices);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.riverIndex);

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

  uploadLife(snapshot) {
    if (snapshot === this.lastSnapshot && (snapshot?.tick ?? -1) === this.lastTick) return;
    this.lastSnapshot = snapshot;
    this.lastTick = snapshot?.tick ?? -1;
    const cells = this.geometry.vertexCell;
    if (!snapshot) this.lifeData.fill(0);
    else {
      for (let vertex = 0; vertex < cells.length; vertex++) {
        const cell = cells[vertex];
        this.lifeData[vertex * 3] = snapshot.alive[cell] ? Math.min(1, 0.25 + snapshot.biomass[cell] * 0.55) : 0;
        this.lifeData[vertex * 3 + 1] = snapshot.stress[cell];
        this.lifeData[vertex * 3 + 2] = snapshot.lifeState?.[cell]
          ?? (snapshot.alive[cell] ? 1 : snapshot.biomass[cell] > 0 ? 5 : 0);
      }
    }
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.lifeBuffer);
    this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.lifeData);
  }

  uploadAdaptation(event) {
    const token = event?.token ?? 0; if (token === this.adaptationToken) return;
    this.adaptationToken = token; const cells = this.geometry.vertexCell;
    for (let vertex = 0; vertex < cells.length; vertex++) {
      this.adaptationData[vertex * 2] = event?.distances[cells[vertex]] ?? 255;
      this.adaptationData[vertex * 2 + 1] = event?.category ?? 0;
    }
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.adaptationBuffer);
    this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.adaptationData);
  }

  draw(vp, eye, snapshot, selectedNode, adaptation, highlightedCells = []) {
    const gl = this.gl; this.uploadLife(snapshot); this.uploadAdaptation(adaptation);
    const globe = this.programs.globe;
    gl.useProgram(globe.program);
    gl.uniformMatrix4fv(globe.u.get('uViewProj'), false, vp);
    gl.uniform3fv(globe.u.get('uEye'), eye);
    gl.uniform1f(globe.u.get('uEntropy'), snapshot?.entropy ?? 0);
    gl.uniform1f(globe.u.get('uMemory'), snapshot?.status === 'memory' ? 1 : 0);
    const selected = Number.isInteger(selectedNode) ? selectedNode : -1;
    gl.uniform1f(globe.u.get('uHasSelection'), selected >= 0 ? 1 : 0);
    gl.uniform3fv(globe.u.get('uSelectedCenter'), selected >= 0
      ? this.topo.positions.subarray(selected * 3, selected * 3 + 3) : this.zero3);
    gl.uniform1f(globe.u.get('uAdaptationTime'), adaptation?.progress ?? 0);
    gl.uniform1f(globe.u.get('uAdaptationMaxDistance'), adaptation?.maxDistance ?? 0);
    gl.uniform1f(globe.u.get('uAdaptationReduced'), adaptation?.reduced ? 1 : 0);
    gl.uniform1f(globe.u.get('uAdaptationActive'), adaptation ? 1 : 0);
    this.historyCenters.fill(0); const count = Math.min(8, highlightedCells.length);
    for (let i = 0; i < count; i++) this.historyCenters.set(this.topo.positions.subarray(highlightedCells[i] * 3, highlightedCells[i] * 3 + 3), i * 3);
    gl.uniform1i(globe.u.get('uHistoryCount'), count); gl.uniform3fv(globe.u.get('uHistoryCenter'), this.historyCenters);
    this.setEventOverlays(globe, snapshot);
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

    const river = this.programs.river;
    gl.useProgram(river.program);
    gl.uniformMatrix4fv(river.u.get('uViewProj'), false, vp);
    gl.uniform3fv(river.u.get('uEye'), eye);
    gl.uniform1f(river.u.get('uEntropy'), snapshot?.entropy ?? 0);
    gl.depthMask(false); gl.bindVertexArray(this.riverVao);
    gl.drawElements(gl.TRIANGLES, this.geometry.riverIndices.length, gl.UNSIGNED_SHORT, 0);
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

  setEventOverlays(program, snapshot) {
    const gl = this.gl; const data = this.overlay;
    data.centers.fill(0); data.radii.fill(0); data.tints.fill(0); data.strengths.fill(0);
    const events = snapshot?.events ?? [];
    for (let i = 0; i < Math.min(4, events.length); i++) {
      const event = events[i]; const source = event.center * 3; const target = i * 3;
      data.centers.set(this.topo.positions.subarray(source, source + 3), target);
      data.radii[i] = event.radiusDot;
      data.tints.set(EVENT_TINTS[event.family] ?? [0.7, 0.7, 0.7], target);
      data.strengths[i] = Math.min(1, event.intensity);
    }
    gl.uniform3fv(program.u.get('uEventCenter'), data.centers);
    gl.uniform1fv(program.u.get('uEventRadius'), data.radii);
    gl.uniform3fv(program.u.get('uEventTint'), data.tints);
    gl.uniform1fv(program.u.get('uEventStrength'), data.strengths);
  }

  dispose() {
    for (const vao of this.vaos) this.gl.deleteVertexArray(vao);
    for (const buffer of this.buffers) this.gl.deleteBuffer(buffer);
    for (const value of Object.values(this.programs)) this.gl.deleteProgram(value.program);
  }
}
