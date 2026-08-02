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
void main() {
  vec2 p = vUv - 0.5;
  float dawn = exp(-4.8 * length(p - vec2(-0.42, -0.34)));
  float deep = smoothstep(-0.45, 0.65, p.y);
  vec3 col = mix(vec3(0.035, 0.041, 0.052), vec3(0.009, 0.014, 0.023), deep);
  col += vec3(0.16, 0.095, 0.052) * dawn * 0.18;
  outColor = vec4(col, 1.0);
}`;

export const VS_GLOBE = `#version 300 es
uniform mat4 uViewProj;
in vec3 aPos;
in vec3 aCenter;
in vec4 aMaterial;
in vec4 aTerrain;
in vec3 aLife;
in vec2 aAdaptation;
out vec3 vPos;
out vec3 vCenter;
out vec4 vMaterial;
out vec4 vTerrain;
out vec3 vLife;
out vec2 vAdaptation;
void main() {
  float relief = max(0.0, aMaterial.w - 0.43) * 0.022 + aTerrain.w * 0.004;
  vPos = aPos * (1.0 + relief);
  vCenter = aCenter;
  vMaterial = aMaterial;
  vTerrain = aTerrain;
  vLife = aLife;
  vAdaptation = aAdaptation;
  gl_Position = uViewProj * vec4(vPos, 1.0);
}`;

export const FS_GLOBE = `#version 300 es
precision highp float;
in vec3 vPos;
in vec3 vCenter;
in vec4 vMaterial;
in vec4 vTerrain;
in vec3 vLife;
in vec2 vAdaptation;
out vec4 outColor;
uniform vec3 uEye;
uniform float uEntropy;
uniform float uMemory;
uniform vec3 uSelectedCenter;
uniform float uHasSelection;
uniform float uAdaptationTime;
uniform float uAdaptationMaxDistance;
uniform float uAdaptationReduced;
uniform float uAdaptationActive;
uniform vec3 uHistoryCenter[8];
uniform int uHistoryCount;
uniform vec3 uEventCenter[4];
uniform float uEventRadius[4];
uniform vec3 uEventTint[4];
uniform float uEventStrength[4];
void main() {
  float nutrient = vMaterial.x;
  float moisture = vMaterial.y;
  float biome = vTerrain.x;
  float forest = vTerrain.y;
  float river = vTerrain.z;
  float ridge = vTerrain.w;
  vec3 base = vec3(0.19, 0.31, 0.18);
  if (biome < 0.5) base = vec3(0.025, 0.13, 0.19);
  else if (biome < 1.5) base = vec3(0.05, 0.27, 0.33);
  else if (biome < 2.5) base = vec3(0.52, 0.47, 0.30);
  else if (biome < 3.5) base = vec3(0.09, 0.27, 0.14);
  else if (biome < 4.5) base = vec3(0.055, 0.22, 0.13);
  else if (biome < 5.5) base = vec3(0.27, 0.42, 0.20);
  else if (biome < 6.5) base = vec3(0.48, 0.42, 0.22);
  else if (biome < 7.5) base = vec3(0.61, 0.44, 0.22);
  else if (biome < 8.5) base = vec3(0.13, 0.37, 0.28);
  else if (biome < 9.5) base = vec3(0.36, 0.36, 0.27);
  else if (biome < 10.5) base = vec3(0.39, 0.39, 0.37);
  else if (biome < 11.5) base = vec3(0.43, 0.49, 0.39);
  else base = vec3(0.72, 0.78, 0.78);
  float canopy = forest * (0.82 + 0.18 * sin(dot(vCenter, vec3(71.3, 43.7, 97.1))));
  base = mix(base, vec3(0.035, 0.16, 0.09), canopy * 0.44);
  base = mix(base, vec3(0.18, 0.42, 0.46), river * 0.16);
  base = mix(base, vec3(0.52, 0.50, 0.43), ridge * 0.20);
  base *= 0.86 + nutrient * 0.20 + moisture * 0.05;
  base = mix(base, vec3(0.22, 0.23, 0.21) + nutrient * 0.05, uMemory * 0.82);
  float life = clamp(vLife.x, 0.0, 1.0);
  float stress = clamp(vLife.y, 0.0, 1.0);
  float state = floor(vLife.z + 0.5);
  float living = 1.0 - step(0.5, abs(state - 1.0));
  float frontier = 1.0 - step(0.5, abs(state - 2.0));
  float stressed = 1.0 - step(0.5, abs(state - 3.0));
  float critical = 1.0 - step(0.5, abs(state - 4.0));
  float deadRemains = 1.0 - step(0.5, abs(state - 5.0));
  float alive = living + frontier + stressed + critical;
  float centerDot = dot(normalize(vPos), normalize(vCenter));
  float inset = smoothstep(0.9982, 0.99972, centerDot);
  float striation = 0.5 + 0.5 * sin(dot(vPos, vec3(97.0, 151.0, 73.0)) * 17.0);
  base = mix(base, vec3(0.56, 0.60, 0.34), alive * (0.18 + life * 0.10));
  base = mix(base, vec3(0.70, 0.73, 0.48), frontier * inset * 0.34);
  base *= 1.0 - frontier * (1.0 - inset) * 0.10;
  base = mix(base, vec3(0.58, 0.34, 0.22), stressed * (0.20 + stress * 0.12 + striation * 0.08));
  base = mix(base, vec3(0.66, 0.20, 0.13), critical * (0.34 + stress * 0.08 + striation * 0.13));
  base = mix(base, vec3(0.31, 0.30, 0.28), deadRemains * (0.20 + inset * 0.09));
  float grey = dot(base, vec3(0.299, 0.587, 0.114));
  base = mix(base, vec3(grey) * 0.56, uEntropy * 0.70);
  vec3 n = normalize(vPos);
  vec3 light = normalize(vec3(-0.52, 0.72, 0.44) + normalize(uEye) * 0.58);
  float diffuse = max(dot(n, light), 0.0);
  float night = smoothstep(-0.16, 0.14, dot(n, light));
  vec3 viewDir = normalize(uEye - vPos);
  float rim = pow(1.0 - max(dot(n, viewDir), 0.0), 2.7);
  float plate = smoothstep(0.996, 0.9998, dot(n, normalize(vCenter)));
  vec3 col = base * (0.22 + 0.90 * diffuse) + base * plate * 0.07;
  col += vec3(0.38, 0.39, 0.20) * alive * life * (0.08 + 0.12 * plate) * night;
  col += rim * vec3(0.08, 0.13, 0.14) * (1.0 - uEntropy * 0.5);
  for (int i = 0; i < 4; i++) {
    if (uEventStrength[i] > 0.001) {
      float d = dot(normalize(vCenter), uEventCenter[i]);
      float w = smoothstep(uEventRadius[i], min(1.0, uEventRadius[i] + 0.18), d);
      col = mix(col, uEventTint[i], w * uEventStrength[i] * 0.48);
    }
  }
  for (int i = 0; i < 8; i++) {
    if (i < uHistoryCount) {
      float marked = step(0.99994, dot(normalize(vCenter), uHistoryCenter[i]));
      col = mix(col, vec3(0.96, 0.73, 0.31), marked * (0.48 + plate * 0.30));
    }
  }
  float distance = vAdaptation.x;
  float category = vAdaptation.y;
  float reachable = uAdaptationActive * (1.0 - step(254.5, distance));
  float normalizedDistance = distance / max(1.0, uAdaptationMaxDistance);
  float width = category < 1.5 ? 0.18 : category < 4.5 ? 0.105 : 0.075;
  float wake = 1.0 - smoothstep(width, width + 0.035, abs(normalizedDistance - uAdaptationTime));
  float origin = 1.0 - step(0.5, distance);
  wake = mix(max(wake, origin * (1.0 - uAdaptationTime) * 0.45), origin, uAdaptationReduced);
  float form = 0.72 + inset * 0.28;
  vec3 adaptationTint = vec3(0.72, 0.76, 0.46);
  if (category > 1.5 && category < 2.5) { form = inset * (0.72 + striation * 0.28); adaptationTint = vec3(0.82, 0.55, 0.30); }
  else if (category < 3.5 && category > 2.5) { form = 0.25 + (1.0 - inset) * 0.75; adaptationTint = vec3(0.70, 0.80, 0.66); }
  else if (category < 4.5 && category > 3.5) { form = 0.58 + 0.42 * sin(distance * 1.73 - uAdaptationTime * 28.0); adaptationTint = vec3(0.63, 0.76, 0.58); }
  else if (category < 5.5 && category > 4.5) { form = 0.48 + moisture * 0.28 + forest * 0.30; adaptationTint = vec3(0.48, 0.74, 0.42); }
  else if (category > 5.5) { form = 0.62 + 0.18 * sin(dot(vCenter, vec3(191.0, 127.0, 83.0)) + distance); adaptationTint = vec3(0.72, 0.78, 0.73); }
  float emphasis = reachable * wake * clamp(form, 0.15, 1.0);
  col = mix(col, adaptationTint, emphasis * 0.42);
  col += emphasis * (0.035 + inset * 0.045);
  float selected = uHasSelection * step(0.99994, dot(normalize(vCenter), uSelectedCenter));
  col = mix(col, vec3(0.78, 0.92, 0.84), selected * (0.34 + plate * 0.28));
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
