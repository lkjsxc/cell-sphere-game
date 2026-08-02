/** Original GLSL for the surrounding field, dual-cell planet, and atmosphere. */

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
uniform float uTime;
uniform float uTwinkle;
void main() {
  vec2 p = vUv - 0.5;
  float dawn = exp(-4.8 * length(p - vec2(-0.42, -0.34)));
  float deep = smoothstep(-0.45, 0.65, p.y);
  vec3 col = mix(vec3(0.035, 0.041, 0.052), vec3(0.009, 0.014, 0.023), deep);
  col += vec3(0.16, 0.095, 0.052) * dawn * 0.18;
  float orbit = abs(length((p - vec2(0.18, 0.03)) * vec2(0.72, 1.0)) - 0.52);
  float breathe = uTwinkle > 0.5 ? 0.88 + 0.12 * sin(uTime * 0.28) : 1.0;
  col += vec3(0.28, 0.31, 0.31) * smoothstep(0.003, 0.0, orbit) * 0.055 * breathe;
  outColor = vec4(col, 1.0);
}`;

export const VS_GLOBE = `#version 300 es
uniform mat4 uViewProj;
in vec3 aPos;
in vec3 aCenter;
in vec4 aMaterial;
in vec2 aLife;
in float aKnot;
out vec3 vPos;
out vec3 vCenter;
out vec4 vMaterial;
out vec2 vLife;
out float vKnot;
void main() {
  vPos = aPos;
  vCenter = aCenter;
  vMaterial = aMaterial;
  vLife = aLife;
  vKnot = aKnot;
  gl_Position = uViewProj * vec4(aPos, 1.0);
}`;

export const FS_GLOBE = `#version 300 es
precision highp float;
in vec3 vPos;
in vec3 vCenter;
in vec4 vMaterial;
in vec2 vLife;
in float vKnot;
out vec4 outColor;
uniform vec3 uEye;
uniform float uEntropy;
uniform float uTime;
uniform float uPulse;
uniform float uMemory;
uniform vec3 uEventCenter[4];
uniform float uEventRadius[4];
uniform vec3 uEventTint[4];
uniform float uEventStrength[4];
uniform vec3 uSignalCenter[4];
uniform float uSignalRadius[4];
uniform float uSignalStrength[4];
void main() {
  float nutrient = vMaterial.x;
  float moisture = vMaterial.y;
  float temp = vMaterial.z;
  float altitude = vMaterial.w;
  float land = smoothstep(0.405, 0.455, altitude);
  vec3 ocean = mix(vec3(0.035, 0.105, 0.135), vec3(0.10, 0.29, 0.30), moisture);
  vec3 dry = mix(vec3(0.39, 0.29, 0.17), vec3(0.57, 0.47, 0.27), nutrient);
  vec3 wet = mix(vec3(0.13, 0.25, 0.17), vec3(0.27, 0.42, 0.22), nutrient);
  vec3 terrain = mix(dry, wet, smoothstep(0.42, 0.72, moisture));
  terrain = mix(terrain, vec3(0.72, 0.75, 0.69), smoothstep(0.0, 0.30, 0.32 - temp));
  vec3 base = mix(ocean, terrain, land);
  base = mix(base, vec3(0.17, 0.18, 0.17) + nutrient * 0.035, uMemory * 0.88);
  float life = clamp(vLife.x, 0.0, 1.0);
  float stress = clamp(vLife.y, 0.0, 1.0);
  base = mix(base, vec3(0.66, 0.66, 0.38), life * 0.25);
  base = mix(base, vec3(0.67, 0.22, 0.15), life * stress * 0.42);
  base += vec3(0.13, 0.08, 0.025) * vKnot;
  float grey = dot(base, vec3(0.299, 0.587, 0.114));
  base = mix(base, vec3(grey) * 0.56, uEntropy * 0.70);
  vec3 n = normalize(vPos);
  vec3 light = normalize(vec3(-0.52, 0.72, 0.44));
  float diffuse = max(dot(n, light), 0.0);
  float night = smoothstep(-0.16, 0.14, dot(n, light));
  vec3 viewDir = normalize(uEye - vPos);
  float rim = pow(1.0 - max(dot(n, viewDir), 0.0), 2.7);
  float plate = smoothstep(0.996, 0.9998, dot(n, normalize(vCenter)));
  vec3 col = base * (0.22 + 0.90 * diffuse) + base * plate * 0.07;
  col += vec3(0.72, 0.65, 0.36) * life * (0.12 + 0.14 * plate) * night;
  col += rim * vec3(0.08, 0.13, 0.14) * (1.0 - uEntropy * 0.5);
  for (int i = 0; i < 4; i++) {
    if (uEventStrength[i] > 0.001) {
      float d = dot(n, uEventCenter[i]);
      float w = smoothstep(uEventRadius[i], min(1.0, uEventRadius[i] + 0.18), d);
      col = mix(col, uEventTint[i], w * uEventStrength[i] * 0.48);
    }
    if (uSignalStrength[i] > 0.001) {
      float d = dot(n, uSignalCenter[i]);
      float ring = smoothstep(uSignalRadius[i], uSignalRadius[i] + 0.035, d)
        * (1.0 - smoothstep(uSignalRadius[i] + 0.035, uSignalRadius[i] + 0.14, d));
      float pulse = uPulse > 0.5 ? 0.82 + 0.18 * sin(uTime * 3.4) : 1.0;
      col += vec3(0.98, 0.67, 0.30) * ring * uSignalStrength[i] * pulse;
    }
  }
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
