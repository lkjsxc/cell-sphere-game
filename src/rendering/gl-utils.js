/**
 * WebGL2 boilerplate: shader compilation, program linking, buffer helpers.
 * All failures throw with the GL info log so diagnostics can surface them.
 */

/**
 * @param {WebGL2RenderingContext} gl
 * @param {number} type gl.VERTEX_SHADER | gl.FRAGMENT_SHADER
 * @param {string} source
 */
export function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`shader compile failed: ${log}`);
  }
  return shader;
}

/**
 * @param {WebGL2RenderingContext} gl
 * @param {string} vsSource
 * @param {string} fsSource
 * @returns {WebGLProgram}
 */
export function createProgram(gl, vsSource, fsSource) {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`program link failed: ${log}`);
  }
  return program;
}

/** Cache all active uniform locations for a program. @returns {Map<string, WebGLLocation>} */
export function uniformMap(gl, program) {
  const map = new Map();
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    const name = info.name.replace('[0]', '');
    map.set(name, gl.getUniformLocation(program, info.name));
  }
  return map;
}

/** Create a buffer and upload data. @returns {WebGLBuffer} */
export function createBuffer(gl, target, data, usage = gl.STATIC_DRAW) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(target, buffer);
  gl.bufferData(target, data, usage);
  return buffer;
}

/**
 * Static-only helper: extract declared uniform base names from a GLSL source
 * string (array uniforms like `uX[4]` collapse to `uX`, matching getActiveUniform).
 * Used by tests and tooling to cross-check that every declared uniform is
 * uploaded; the runtime itself uses getActiveUniform, not this parser.
 * @param {string} source
 * @returns {Set<string>}
 */
export function parseUniformNames(source) {
  const out = new Set();
  const re = /\buniform\s+[A-Za-z0-9_]+\s+([A-Za-z0-9_]+)\s*(\[\d+\])?\s*;/g;
  let m;
  while ((m = re.exec(source)) !== null) out.add(m[1]);
  return out;
}
