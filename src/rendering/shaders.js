/**
 * Original GLSL ES 3.00 shaders for the world surface: procedural star
 * background, biome-shaded globe with entropy decay and event/signal
 * overlays, and the additive atmosphere rim. Network (vein/tip) shaders
 * live in shaders-network.js to keep each module under the line budget.
 *
 * Compiled once at renderer init; uniform locations are cached. Pulse terms
 * are gated by a uPulse uniform so reduced-motion mode flattens them without
 * recompiling. No per-frame string work.
 */

export const VS_BACKGROUND = `#version 300 es
out vec2 vUv;
void main() {
  // Fullscreen triangle.
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.999, 1.0);
}`;

export const FS_BACKGROUND = `#version 300 es
precision mediump float;
in vec2 vUv;
out vec4 outColor;
uniform float uTime;
uniform float uTwinkle; // 0 in reduced motion
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
void main() {
  vec3 col = mix(vec3(0.028, 0.042, 0.068), vec3(0.010, 0.018, 0.040), vUv.y);
  vec2 g = floor(vUv * 140.0);
  float h = hash21(g);
  if (h > 0.991) {
    vec2 f = fract(vUv * 140.0) - 0.5;
    float d = length(f);
    float tw = uTwinkle > 0.5 ? 0.7 + 0.3 * sin(uTime * 2.0 + h * 40.0) : 1.0;
    col += vec3(0.62, 0.72, 0.85) * smoothstep(0.22, 0.0, d) * (h - 0.991) * 90.0 * tw;
  }
  outColor = vec4(col, 1.0);
}`;

export const VS_GLOBE = `#version 300 es
uniform mat4 uViewProj;
in vec3 aPos;
in float aNutrient;
in float aMoisture;
in float aTemp;
in float aAltitude;
out vec3 vPos;
out float vNutrient;
out float vMoisture;
out float vTemp;
out float vAltitude;
void main() {
  vPos = aPos;
  vNutrient = aNutrient;
  vMoisture = aMoisture;
  vTemp = aTemp;
  vAltitude = aAltitude;
  gl_Position = uViewProj * vec4(aPos, 1.0);
}`;

export const FS_GLOBE = `#version 300 es
precision highp float;
in vec3 vPos;
in float vNutrient;
in float vMoisture;
in float vTemp;
in float vAltitude;
out vec4 outColor;
uniform vec3 uEye;
uniform float uEntropy;
uniform float uTime;
uniform float uPulse;
uniform vec3 uEventCenter[4];
uniform float uEventRadius[4];
uniform vec3 uEventTint[4];
uniform float uEventStrength[4];
uniform vec3 uSignalCenter[4];
uniform float uSignalRadius[4];
uniform float uSignalStrength[4];
void main() {
  vec3 lush = vec3(0.11, 0.40, 0.29);
  vec3 dry = vec3(0.44, 0.37, 0.22);
  vec3 rock = vec3(0.29, 0.29, 0.33);
  vec3 base = mix(dry, lush, clamp(vMoisture * 1.25 - 0.18, 0.0, 1.0));
  base = mix(base, rock, vAltitude * 0.5);
  base += vec3(0.04, 0.15, 0.09) * vNutrient * vNutrient;
  base = mix(base, base * vec3(1.18, 0.94, 0.78), clamp((vTemp - 0.62) * 2.2, 0.0, 1.0) * 0.45);
  base = mix(base, base * vec3(0.82, 0.94, 1.22), clamp((0.42 - vTemp) * 2.2, 0.0, 1.0) * 0.45);
  float lum = dot(base, vec3(0.299, 0.587, 0.114));
  base = mix(base, vec3(lum) * 0.5, uEntropy * 0.72);
  vec3 n = normalize(vPos);
  vec3 light = normalize(vec3(0.55, 0.75, 0.42));
  float diff = max(dot(n, light), 0.0);
  vec3 viewDir = normalize(uEye - vPos);
  float rim = pow(1.0 - max(dot(n, viewDir), 0.0), 2.5);
  vec3 col = base * (0.28 + 0.82 * diff) + rim * vec3(0.09, 0.15, 0.19) * (1.0 - uEntropy * 0.6);
  for (int i = 0; i < 4; i++) {
    if (uEventStrength[i] > 0.001) {
      float d = dot(n, uEventCenter[i]);
      if (d > uEventRadius[i]) {
        float w = smoothstep(uEventRadius[i], 1.0, d) * uEventStrength[i];
        col = mix(col, uEventTint[i], clamp(w * 0.6, 0.0, 0.75));
      }
    }
  }
  for (int i = 0; i < 4; i++) {
    if (uSignalStrength[i] > 0.001) {
      float d = dot(n, uSignalCenter[i]);
      float r = uSignalRadius[i];
      if (d > r) {
        float ring = smoothstep(r, r + 0.05, d) * (1.0 - smoothstep(r + 0.05, r + 0.2, d));
        float pulse = uPulse > 0.5 ? 0.75 + 0.25 * sin(uTime * 4.0) : 1.0;
        col += vec3(1.0, 0.83, 0.47) * ring * uSignalStrength[i] * pulse * 0.85;
      }
    }
  }
  outColor = vec4(col, 1.0);
}`;

export const VS_ATMOSPHERE = `#version 300 es
uniform mat4 uViewProj;
in vec3 aPos;
out vec3 vPos;
void main() {
  vPos = aPos * 1.16;
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
  float rim = pow(clamp(1.0 - abs(dot(v, n)), 0.0, 1.0), 2.2);
  vec3 tint = mix(vec3(0.25, 0.55, 0.62), vec3(0.35, 0.33, 0.36), uEntropy);
  outColor = vec4(tint * rim * (0.55 - uEntropy * 0.25), 1.0);
}`;
