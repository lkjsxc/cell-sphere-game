/** Dual-cell planet surface, etched boundaries, and atmosphere draw pass. */
import { createProgram, uniformMap, createBuffer } from './gl-utils.js';
import { createCellGeometry } from './cell-geometry.js';
import * as SH from './shaders.js';
import * as SHELL from './shaders-shell.js';
import * as BOUNDARY from './shaders-boundary.js';
import { sameWorldIdentity } from '../core/world-session.js';
import { BOUNDARY_VERTICES_PER_EDGE, LIFE_EDGE_STRIDE, writeBoundaryLifeVertices,
  writeLifeEdges } from './life-edges.js';
import { ATMOSPHERE_GEOMETRY } from './atmosphere-geometry.js';
import { RENDER_SCENE, renderSceneMode } from './scene-mode.js';
import { cloudFaceBytes, CLOUD_FACE_COUNT, CLOUD_PRIMARY_AXIS, CLOUD_SECONDARY_AXIS,
  validCloudField } from './cloud-field.js';

const EMPTY_CLOUD = new Uint8Array(1);

export class WorldPass {
  constructor(gl, topo, fields, options = {}) {
    this.gl = gl;
    this.topo = topo;
    this.geometry = createCellGeometry(topo, fields);
    this.atmosphereGeometry = ATMOSPHERE_GEOMETRY;
    this.programs = {
      globe: this.make(SH.VS_GLOBE, SH.FS_GLOBE),
      boundary: this.make(BOUNDARY.VS_BOUNDARY, BOUNDARY.FS_BOUNDARY),
      atmosphere: this.make(SHELL.VS_ATMOSPHERE, SHELL.FS_ATMOSPHERE),
    };
    this.lifeData = new Float32Array(this.geometry.vertexCount * 3);
    this.ecologyData = new Uint8Array(this.geometry.vertexCount * 4);
    this.lifeEdgeData = new Uint8Array(topo.edgeCount * LIFE_EDGE_STRIDE);
    this.boundaryLifeData = new Uint8Array(topo.edgeCount * BOUNDARY_VERTICES_PER_EDGE * LIFE_EDGE_STRIDE);
    this.edgeUpdateCount = 0;
    this.lastSnapshot = null; this.boundIdentity = null; this.disposed = false;
    this.lastTick = -1;
    this.zero3 = new Float32Array(3);
    this.historyCenters = new Float32Array(24);
    this.initialCloudField = options.cloudField ?? null; this.cloudField = null; this.cloudTexture = null;
    this.cloudTextureUploads = 0; this.cloudFaceUploads = 0; this.cloudFieldUploads = 0; this.cloudError = null;
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
    this.attribute(this.programs.boundary, 'aFeature', this.buffer(gl.ARRAY_BUFFER, g.boundaryFeature), 3);
    this.boundaryLifeBuffer = this.buffer(gl.ARRAY_BUFFER, this.boundaryLifeData, gl.DYNAMIC_DRAW);
    this.attribute(this.programs.boundary, 'aLifeEdge', this.boundaryLifeBuffer, LIFE_EDGE_STRIDE, gl.UNSIGNED_BYTE);
    this.boundaryIndex = this.buffer(gl.ELEMENT_ARRAY_BUFFER, g.boundaryIndices);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.boundaryIndex);

    this.atmosphereVao = this.vao();
    this.attribute(this.programs.atmosphere, 'aPos', this.buffer(gl.ARRAY_BUFFER, this.atmosphereGeometry.positions), 3);
    this.atmosphereIndex = this.buffer(gl.ELEMENT_ARRAY_BUFFER, this.atmosphereGeometry.indices);
    this.atmosphereCount = this.atmosphereGeometry.indexCount;
    this.atmosphereIndexType = gl.UNSIGNED_SHORT;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.atmosphereIndex);
    this.initializeCloudTexture(this.initialCloudField); this.initialCloudField = null;
    gl.bindVertexArray(null);
  }
  initializeCloudTexture(field) {
    const gl = this.gl; this.cloudTexture = gl.createTexture();
    if (!this.cloudTexture) { this.cloudError = 'cloud texture unavailable'; return false; }
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.cloudTexture); gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    return this.uploadCloudTexture(validCloudField(field) ? field : null);
  }
  uploadCloudTexture(field) {
    if (!this.cloudTexture) return false; const gl = this.gl; const valid = validCloudField(field);
    const size = valid ? field.faceSize : 1; gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.cloudTexture);
    for (let face = 0; face < CLOUD_FACE_COUNT; face++) {
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + face, 0, gl.R8, size, size, 0, gl.RED,
        gl.UNSIGNED_BYTE, valid ? cloudFaceBytes(field, face) : EMPTY_CLOUD);
      this.cloudFaceUploads++;
    }
    this.cloudTextureUploads++; this.cloudField = valid ? field : null; if (valid) this.cloudFieldUploads++; return valid;
  }
  setCloudField(field) {
    if (!validCloudField(field) || field === this.cloudField) return field === this.cloudField;
    return this.uploadCloudTexture(field);
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
    this.lifeData.fill(0); this.ecologyData.fill(0); this.lifeEdgeData.fill(0); this.boundaryLifeData.fill(0);
    this.edgeUpdateCount = 0;
    this.lastSnapshot = null; this.lastTick = -1; this.historyCenters.fill(0);
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.lifeBuffer); gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.lifeData);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.ecologyBuffer); gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.ecologyData);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.boundaryLifeBuffer); gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.boundaryLifeData);
    return true;
  }
  dynamicState() { return Object.freeze({ life: nonZero(this.lifeData),
    ecology: nonZero(this.ecologyData), lifeEdges: nonZero(this.lifeEdgeData), edgeBytes: this.boundaryLifeData.byteLength,
    edgeUpdates: this.edgeUpdateCount, tick: this.lastTick, cloudSignature: this.cloudField?.signature ?? null,
    cloudBytes: this.cloudField?.byteLength ?? 0, cloudTextureUploads: this.cloudTextureUploads,
    cloudFaceUploads: this.cloudFaceUploads,
    cloudFieldUploads: this.cloudFieldUploads, cloudError: this.cloudError }); }
  uploadLife(snapshot) {
    if (snapshot === this.lastSnapshot && (snapshot?.tick ?? -1) === this.lastTick) return;
    this.lastSnapshot = snapshot;
    this.lastTick = snapshot?.tick ?? -1;
    const cells = this.geometry.vertexCell;
    if (!snapshot) { this.lifeData.fill(0); this.ecologyData.fill(0); this.lifeEdgeData.fill(0); }
    else {
      const sceneMode = renderSceneMode(snapshot);
      for (let vertex = 0; vertex < cells.length; vertex++) {
        const cell = cells[vertex]; this.ecologyData[vertex * 4] = snapshot.resourceRichnessQ?.[cell] ?? 0;
        this.ecologyData[vertex * 4 + 1] = snapshot.resourceState?.[cell] ?? 0;
        this.ecologyData[vertex * 4 + 2] = snapshot.transformationState?.[cell] ?? 0;
        this.ecologyData[vertex * 4 + 3] = snapshot.electricityQ?.[cell] ?? 0;
        if (sceneMode !== RENDER_SCENE.WORLD) {
          const evolution = sceneMode === RENDER_SCENE.EVOLUTION;
          this.lifeData[vertex * 3] = evolution ? snapshot.evolutionStatus[cell] : snapshot.memoryStatus[cell];
          this.lifeData[vertex * 3 + 1] = (evolution ? snapshot.evolutionDomain[cell] : snapshot.memoryBranch[cell])
            + (evolution ? snapshot.evolutionKind[cell] : snapshot.memoryKind[cell]) * 0.1;
          this.lifeData[vertex * 3 + 2] = (evolution ? snapshot.evolutionImprintWeight[cell] : snapshot.memoryImprintWeight[cell])
            + (evolution ? snapshot.evolutionTier[cell] : snapshot.memoryTier[cell]) * 2
            + (evolution ? snapshot.evolutionRecent[cell] : snapshot.memoryEmphasis[cell]) * 32;
        } else {
          this.lifeData[vertex * 3] = snapshot.alive[cell] ? Math.min(1, 0.25 + snapshot.biomass[cell] * 0.55) : 0;
          this.lifeData[vertex * 3 + 1] = snapshot.stress[cell];
          this.lifeData[vertex * 3 + 2] = snapshot.lifeState?.[cell]
            ?? (snapshot.alive[cell] ? 1 : snapshot.biomass[cell] > 0 ? 5 : 0);
        }
      }
      if (sceneMode === RENDER_SCENE.EVOLUTION) {
        if (!(snapshot.evolutionEdge instanceof Uint8Array)
          || snapshot.evolutionEdge.length !== this.topo.edgeCount) throw new Error('invalid Evolution cell edges');
        this.lifeEdgeData.set(snapshot.evolutionEdge);
      } else if (sceneMode === RENDER_SCENE.TROPHY) this.lifeEdgeData.fill(0);
      else writeLifeEdges(this.topo, snapshot.lifeState, this.lifeEdgeData);
    }
    writeBoundaryLifeVertices(this.lifeEdgeData, this.boundaryLifeData); this.edgeUpdateCount++;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.lifeBuffer); this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.lifeData);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.ecologyBuffer); this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.ecologyData);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.boundaryLifeBuffer); this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.boundaryLifeData);
  }
  draw(vp, eye, snapshot, selectedNode, highlightedCells = [], time = 0, pulse = false, fixture = null, celestial = null) {
    if (this.disposed || !this.accepts(snapshot)) return false;
    const gl = this.gl; const sceneMode = renderSceneMode(snapshot); this.uploadLife(snapshot);
    const globe = this.programs.globe;
    gl.useProgram(globe.program);
    gl.uniformMatrix4fv(globe.u.get('uViewProj'), false, vp);
    gl.uniform3fv(globe.u.get('uEye'), eye);
    gl.uniform1f(globe.u.get('uEntropy'), snapshot?.entropy ?? 0);
    gl.uniform1f(globe.u.get('uSceneMode'), sceneMode);
    gl.uniform1f(globe.u.get('uTime'), Number.isFinite(time) ? time : 0);
    gl.uniform1f(globe.u.get('uPulse'), pulse ? 1 : 0);
    gl.uniform1f(globe.u.get('uElectricityDevelopment'), Math.max(0, Math.min(1, snapshot?.luminousDevelopment ?? 0)));
    const selected = snapshot?.status !== 'evolution' && Number.isInteger(selectedNode) ? selectedNode : -1;
    gl.uniform1f(globe.u.get('uHasSelection'), selected >= 0 ? 1 : 0);
    gl.uniform3fv(globe.u.get('uSelectedCenter'), selected >= 0
      ? this.topo.positions.subarray(selected * 3, selected * 3 + 3) : this.zero3);
    this.historyCenters.fill(0); const count = Math.min(8, highlightedCells.length);
    for (let i = 0; i < count; i++) this.historyCenters.set(this.topo.positions.subarray(highlightedCells[i] * 3, highlightedCells[i] * 3 + 3), i * 3);
    gl.uniform1i(globe.u.get('uHistoryCount'), count); gl.uniform3fv(globe.u.get('uHistoryCenter'), this.historyCenters);
    gl.uniform1f(globe.u.get('uFixture'), fixture ? 1 : 0);
    gl.uniform3fv(globe.u.get('uFixtureColor'), fixture?.surface ?? this.zero3);
    this.setCloudField(celestial?.cloud);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.cloudTexture);
    gl.uniform1i(globe.u.get('uCloudField'), 0);
    gl.uniform1f(globe.u.get('uCloudEnabled'), !fixture && celestial?.cloudEnabled && this.cloudField ? 1 : 0);
    gl.uniform3fv(globe.u.get('uCloudPrimaryAxis'), CLOUD_PRIMARY_AXIS);
    gl.uniform3fv(globe.u.get('uCloudSecondaryAxis'), CLOUD_SECONDARY_AXIS);
    gl.uniform1f(globe.u.get('uCloudPrimaryAngle'), celestial?.cloudPrimaryAngle ?? 0);
    gl.uniform1f(globe.u.get('uCloudSecondaryAngle'), celestial?.cloudSecondaryAngle ?? 0);
    gl.bindVertexArray(this.globeVao);
    gl.drawElements(gl.TRIANGLES, this.geometry.indices.length, gl.UNSIGNED_SHORT, 0);

    if (fixture) return true;
    const boundary = this.programs.boundary;
    gl.useProgram(boundary.program);
    gl.uniformMatrix4fv(boundary.u.get('uViewProj'), false, vp);
    gl.uniform3fv(boundary.u.get('uEye'), eye);
    gl.uniform1f(boundary.u.get('uEntropy'), snapshot?.entropy ?? 0);
    gl.uniform1f(boundary.u.get('uSceneMode'), sceneMode);
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
    gl.drawElements(gl.TRIANGLES, this.atmosphereCount, this.atmosphereIndexType, 0);
    gl.disable(gl.CULL_FACE); return true;
  }
  dispose() {
    if (this.disposed) return; this.disposed = true;
    for (const vao of this.vaos) this.gl.deleteVertexArray(vao);
    for (const buffer of this.buffers) this.gl.deleteBuffer(buffer);
    if (this.cloudTexture) this.gl.deleteTexture(this.cloudTexture);
    for (const value of Object.values(this.programs)) this.gl.deleteProgram(value.program);
    this.cloudTexture = null; this.cloudField = null; this.vaos.length = 0; this.buffers.length = 0;
  }
}
function nonZero(values) { let count = 0; for (const value of values) if (value !== 0) count++; return count; }
