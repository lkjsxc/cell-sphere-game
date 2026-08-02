/** Quiet etched cell boundaries; pentagonal World Knots carry a warm accent. */
export const VS_BOUNDARY = `#version 300 es
uniform mat4 uViewProj;
in vec3 aPos;
in float aKnot;
out vec3 vPos;
out float vKnot;
void main() {
  vPos = aPos;
  vKnot = aKnot;
  gl_Position = uViewProj * vec4(aPos, 1.0);
}`;

export const FS_BOUNDARY = `#version 300 es
precision mediump float;
in vec3 vPos;
in float vKnot;
out vec4 outColor;
uniform vec3 uEye;
uniform float uEntropy;
void main() {
  vec3 n = normalize(vPos);
  vec3 viewDir = normalize(uEye - vPos);
  float facing = smoothstep(0.02, 0.72, dot(n, viewDir));
  vec3 quiet = vec3(0.55, 0.61, 0.55);
  vec3 knot = vec3(0.92, 0.58, 0.25);
  float alpha = facing * mix(0.14, 0.52, vKnot) * (1.0 - uEntropy * 0.35);
  outColor = vec4(mix(quiet, knot, vKnot), alpha);
}`;
