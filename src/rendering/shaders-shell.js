/** Quiet background field and atmosphere shell GLSL. */
export const VS_BACKGROUND = `#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.999, 1.0);
}`;

export const FS_BACKGROUND = `#version 300 es
precision mediump float;
in vec2 vUv;
out vec4 outColor;
uniform float uFixture;
uniform vec3 uFixtureColor;
void main() {
  if (uFixture > 0.5) { outColor = vec4(uFixtureColor, 1.0); return; }
  vec2 p = vUv - 0.5;
  float dawn = exp(-4.8 * length(p - vec2(-0.42, -0.34)));
  float deep = smoothstep(-0.45, 0.65, p.y);
  vec3 col = mix(vec3(0.035, 0.041, 0.052), vec3(0.009, 0.014, 0.023), deep);
  col += vec3(0.16, 0.095, 0.052) * dawn * 0.18;
  outColor = vec4(col, 1.0);
}`;

export const VS_ATMOSPHERE = `#version 300 es
uniform mat4 uViewProj;
in vec3 aPos;
out vec3 vPos;
void main() {
  vPos = aPos * 1.095;
  gl_Position = uViewProj * vec4(vPos, 1.0);
}`;

export const FS_ATMOSPHERE = `#version 300 es
precision mediump float;
in vec3 vPos;
out vec4 outColor;
uniform vec3 uEye;
uniform float uEntropy;
void main() {
  vec3 n = normalize(vPos);
  vec3 v = normalize(uEye - vPos);
  float rim = pow(clamp(1.0 - abs(dot(v, n)), 0.0, 1.0), 2.5);
  vec3 tint = mix(vec3(0.20, 0.43, 0.46), vec3(0.34, 0.24, 0.21), uEntropy);
  outColor = vec4(tint * rim * (0.58 - uEntropy * 0.24), 1.0);
}`;
