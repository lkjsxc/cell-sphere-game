/** Dual-cell world, life, History, Adaptation, and Memory GLSL. */

export const VS_GLOBE = `#version 300 es
uniform mat4 uViewProj;
in vec3 aPos;
in vec3 aCenter;
in vec4 aMaterial;
in vec4 aTerrain;
in vec3 aLife;
in vec2 aEvent;
in vec2 aAdaptation;
out vec3 vPos;
out vec3 vCenter;
out vec4 vMaterial;
out vec4 vTerrain;
out vec3 vLife;
out vec2 vEvent;
out vec2 vAdaptation;
void main() {
  float atlasRelief = step(0.5, aLife.x) * (0.002 + step(2.5, aLife.x) * 0.006)
    + step(3.5, fract(aLife.y) * 10.0) * 0.003;
  float lakeCell = step(12.5, aTerrain.x);
  float relief = (max(0.0, aMaterial.w - 0.43) * 0.022 + aTerrain.w * 0.004)
    * (1.0 - lakeCell) + atlasRelief;
  vPos = aPos * (1.0 + relief);
  vCenter = aCenter;
  vMaterial = aMaterial;
  vTerrain = aTerrain;
  vLife = aLife;
  vEvent = aEvent;
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
in vec2 vEvent;
in vec2 vAdaptation;
out vec4 outColor;
uniform vec3 uEye;
uniform float uEntropy;
uniform float uMemory;
uniform vec3 uSelectedCenter;
uniform float uHasSelection;
uniform float uAdaptationTimeMs;
uniform float uAdaptationTrailMs;
uniform float uAdaptationReducedThreshold;
uniform float uAdaptationReduced;
uniform float uAdaptationActive;
uniform vec3 uHistoryCenter[8];
uniform int uHistoryCount;
void main() {
  float nutrient = vMaterial.x;
  float moisture = vMaterial.y;
  float biome = vTerrain.x;
  float forest = vTerrain.y;
  float waterMaterial = vTerrain.z;
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
  else if (biome < 12.5) base = vec3(0.72, 0.78, 0.78);
  else base = vec3(0.055, 0.25, 0.34);
  float canopy = forest * (0.82 + 0.18 * sin(dot(vCenter, vec3(71.3, 43.7, 97.1))));
  base = mix(base, vec3(0.035, 0.16, 0.09), canopy * 0.44);
  float lakeCell = step(12.5, biome); float lakeDepth = lakeCell * clamp(waterMaterial * 12.0, 0.0, 1.0);
  float lakeShore = (1.0 - lakeCell) * step(1.5, waterMaterial);
  base = mix(base, vec3(0.025, 0.15, 0.24), lakeDepth * 0.42);
  base = mix(base, vec3(0.20, 0.39, 0.29), lakeShore * 0.30);
  base = mix(base, vec3(0.52, 0.50, 0.43), ridge * 0.20 * (1.0 - lakeCell));
  base *= 0.86 + nutrient * 0.20 + moisture * 0.05;
  base = mix(base, vec3(0.22, 0.23, 0.21) + nutrient * 0.05, uMemory * 0.82);
  float life = clamp(vLife.x, 0.0, 1.0);
  float stress = clamp(vLife.y, 0.0, 1.0);
  float state = floor(vLife.z + 0.5);
  float ordinary = 1.0 - uMemory;
  float living = (1.0 - step(0.5, abs(state - 1.0))) * ordinary;
  float frontier = (1.0 - step(0.5, abs(state - 2.0))) * ordinary;
  float stressed = (1.0 - step(0.5, abs(state - 3.0))) * ordinary;
  float critical = (1.0 - step(0.5, abs(state - 4.0))) * ordinary;
  float deadRemains = (1.0 - step(0.5, abs(state - 5.0))) * ordinary;
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
  float atlasStatus = floor(vLife.x + 0.5);
  float atlasBranch = floor(vLife.y + 0.01);
  float atlasKind = floor(fract(vLife.y) * 10.0 + 0.5);
  float selectedStatus = step(4.5, atlasStatus);
  float plainStatus = atlasStatus - selectedStatus * 4.0;
  float lockedCell = step(0.5, plainStatus) * (1.0 - step(1.5, plainStatus));
  float unaffordableCell = step(1.5, plainStatus) * (1.0 - step(2.5, plainStatus));
  float affordableCell = step(2.5, plainStatus) * (1.0 - step(3.5, plainStatus));
  float ownedCell = step(3.5, plainStatus);
  vec3 branchColor = vec3(0.48, 0.58, 0.47);
  if (atlasBranch < 1.5) branchColor = vec3(0.56, 0.72, 0.48);
  else if (atlasBranch < 2.5) branchColor = vec3(0.40, 0.68, 0.76);
  else if (atlasBranch < 3.5) branchColor = vec3(0.76, 0.62, 0.36);
  else if (atlasBranch < 4.5) branchColor = vec3(0.42, 0.68, 0.45);
  else if (atlasBranch < 5.5) branchColor = vec3(0.62, 0.52, 0.73);
  else branchColor = vec3(0.72, 0.54, 0.48);
  float fossil = fract(vLife.z); float emphasis = step(31.0, vLife.z);
  float broadGlyph = smoothstep(0.38, 0.60, abs(sin(dot(vPos, vec3(11.0, 7.0, 5.0)) * (1.0 + atlasKind * 0.12))));
  vec3 atlasBase = mix(vec3(0.13, 0.14, 0.145), vec3(0.30, 0.27, 0.22), fossil * 0.48);
  atlasBase = mix(atlasBase, branchColor * (0.38 + inset * 0.22), lockedCell * (0.58 + inset * 0.28));
  atlasBase = mix(atlasBase, branchColor * 0.58, unaffordableCell * (0.40 + (1.0 - inset) * 0.26));
  atlasBase = mix(atlasBase, branchColor * 1.22, affordableCell * (0.64 + inset * 0.30));
  atlasBase = mix(atlasBase, branchColor * (0.82 + broadGlyph * 0.24), ownedCell * (0.58 + inset * 0.34));
  atlasBase += selectedStatus * vec3(0.24, 0.30, 0.26) * (0.45 + inset * 0.35);
  atlasBase += emphasis * vec3(0.18, 0.22, 0.15) * inset;
  base = mix(base, atlasBase, uMemory);
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
  float eventFamily = floor(vEvent.x + 0.5); float eventAmount = clamp(vEvent.y / 255.0, 0.0, 1.0);
  vec3 eventTint = vec3(0.70); if (eventFamily < 1.5) eventTint = vec3(0.85, 0.62, 0.30);
  else if (eventFamily < 2.5) eventTint = vec3(1.0, 0.42, 0.28);
  else if (eventFamily < 3.5) eventTint = vec3(0.55, 0.75, 1.0);
  else if (eventFamily < 4.5) eventTint = vec3(0.62, 0.85, 0.35);
  else if (eventFamily < 5.5) eventTint = vec3(1.0, 0.92, 0.60);
  else if (eventFamily < 6.5) eventTint = vec3(0.55, 0.50, 0.48);
  else if (eventFamily < 7.5) eventTint = vec3(0.45, 1.0, 0.60);
  else eventTint = vec3(0.85, 0.45, 0.75);
  col = mix(col, eventTint, eventAmount * 0.20 * (0.55 + inset * 0.45));
  for (int i = 0; i < 8; i++) {
    if (i < uHistoryCount) {
      float marked = step(0.99994, dot(normalize(vCenter), uHistoryCenter[i]));
      col = mix(col, vec3(0.96, 0.73, 0.31), marked * (0.48 + plate * 0.30));
    }
  }
  float arrival = vAdaptation.x;
  float category = vAdaptation.y;
  float reachable = uAdaptationActive * (1.0 - step(65534.5, arrival));
  float age = uAdaptationTimeMs - arrival;
  float front = 1.0 - smoothstep(85.0, 175.0, abs(age));
  float trail = step(0.0, age) * (1.0 - smoothstep(0.0, uAdaptationTrailMs, age));
  float origin = 1.0 - step(0.5, arrival);
  float charge = origin * smoothstep(-140.0, -20.0, uAdaptationTimeMs)
    * (1.0 - smoothstep(0.0, 260.0, uAdaptationTimeMs));
  float staticSubset = (1.0 - step(uAdaptationReducedThreshold + 0.5, arrival)) * (0.46 + origin * 0.54);
  float wake = mix(max(max(front, trail * 0.48), charge), staticSubset, uAdaptationReduced);
  float form = 0.72 + inset * 0.28;
  vec3 adaptationTint = vec3(0.72, 0.76, 0.46);
  if (category > 1.5 && category < 2.5) { form = inset * (0.72 + striation * 0.28); adaptationTint = vec3(0.82, 0.55, 0.30); }
  else if (category < 3.5 && category > 2.5) { form = 0.25 + (1.0 - inset) * 0.75; adaptationTint = vec3(0.70, 0.80, 0.66); }
  else if (category < 4.5 && category > 3.5) { form = 0.58 + 0.42 * sin(arrival * 0.031 - uAdaptationTimeMs * 0.018); adaptationTint = vec3(0.63, 0.76, 0.58); }
  else if (category < 5.5 && category > 4.5) { form = 0.48 + moisture * 0.28 + forest * 0.30; adaptationTint = vec3(0.48, 0.74, 0.42); }
  else if (category > 5.5) { form = 0.62 + 0.18 * sin(dot(vCenter, vec3(191.0, 127.0, 83.0)) + arrival * 0.04); adaptationTint = vec3(0.72, 0.78, 0.73); }
  float adaptationEmphasis = reachable * wake * clamp(form, 0.15, 1.0);
  col = mix(col, adaptationTint, adaptationEmphasis * 0.30);
  col += adaptationEmphasis * (0.035 + inset * 0.045);
  float selected = uHasSelection * step(0.99994, dot(normalize(vCenter), uSelectedCenter));
  col = mix(col, vec3(0.78, 0.92, 0.84), selected * (0.34 + plate * 0.28));
  outColor = vec4(col, 1.0);
}`;
