/**
 * Original GLSL ES 3.00 shaders for the organism: instanced vein ribbons
 * (one camera-aligned quad per active edge, width from conductance, pulse
 * from flow) and instanced frontier-tip sprites. Separated from shaders.js
 * to keep each module under the line budget. See shaders.js for the world
 * surface programs and the shared compile/uniform-caching contract.
 */

export const VS_VEINS = `#version 300 es
uniform mat4 uViewProj;
uniform vec3 uEye;
in vec3 aPosA;
in vec3 aPosB;
in vec3 aParams; // x: width, y: stress, z: |flux|
in vec2 aCorner;
out float vEdge;
out float vAlong;
out float vStress;
out float vFlux;
void main() {
  vec3 pos = mix(aPosA, aPosB, aCorner.x);
  vec3 n = normalize(pos);
  vec3 viewDir = normalize(uEye - pos);
  vec3 tangent = normalize(cross(n, viewDir));
  vec3 world = pos + tangent * (aCorner.y - 0.5) * aParams.x + n * 0.007;
  vEdge = aCorner.y;
  vAlong = aCorner.x;
  vStress = aParams.y;
  vFlux = aParams.z;
  gl_Position = uViewProj * vec4(world, 1.0);
}`;

export const FS_VEINS = `#version 300 es
precision mediump float;
in float vEdge;
in float vAlong;
in float vStress;
in float vFlux;
out vec4 outColor;
uniform float uTime;
uniform float uPulse;
uniform float uFade;
void main() {
  float edge = smoothstep(0.0, 0.2, vEdge) * (1.0 - smoothstep(0.8, 1.0, vEdge));
  vec3 healthy = vec3(0.43, 0.95, 0.84);
  vec3 stressed = vec3(1.0, 0.56, 0.48);
  vec3 col = mix(healthy, stressed, clamp(vStress, 0.0, 1.0));
  float pulse = uPulse > 0.5 ? 0.72 + 0.5 * sin(uTime * 6.0 - vAlong * 12.0) * vFlux : 1.0;
  float flow = clamp(vFlux * 2.0, 0.0, 1.0);
  float alpha = edge * (0.5 + 0.5 * flow) * uFade;
  col *= pulse * (0.75 + 0.65 * flow);
  outColor = vec4(col * alpha, alpha);
}`;

export const VS_TIPS = `#version 300 es
uniform mat4 uViewProj;
uniform vec3 uRight;
uniform vec3 uUp;
in vec3 aPos;
in vec2 aParams; // x: size, y: stress
in vec2 aCorner;
out vec2 vCorner;
out float vStress;
void main() {
  vec3 world = aPos * 1.01
    + (uRight * (aCorner.x - 0.5) + uUp * (aCorner.y - 0.5)) * aParams.x;
  vCorner = aCorner;
  vStress = aParams.y;
  gl_Position = uViewProj * vec4(world, 1.0);
}`;

export const FS_TIPS = `#version 300 es
precision mediump float;
in vec2 vCorner;
in float vStress;
out vec4 outColor;
uniform float uFade;
void main() {
  float d = length(vCorner - 0.5) * 2.0;
  float alpha = smoothstep(1.0, 0.4, d) * 0.85 * uFade;
  vec3 col = mix(vec3(0.62, 1.0, 0.9), vec3(1.0, 0.7, 0.55), clamp(vStress, 0.0, 1.0));
  outColor = vec4(col * alpha, alpha);
}`;
