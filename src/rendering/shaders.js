/** Dual-cell world, life, History, and Evolution GLSL. */

export const VS_GLOBE = `#version 300 es
uniform mat4 uViewProj;
in vec3 aPos;
in vec3 aCenter;
in vec4 aMaterial;
in vec4 aTerrain;
in vec3 aLife;
in vec4 aEcology;
out vec3 vPos;
out vec3 vCenter;
out vec4 vMaterial;
out vec4 vTerrain;
out vec3 vLife;
out vec4 vEcology;
void main() {
  // Every duplicated dual-cell corner must take the same position path.
  // Relief belongs to fragment material so the spherical shell stays closed.
  vPos = aPos;
  vCenter = aCenter;
  vMaterial = aMaterial;
  vTerrain = aTerrain;
  vLife = aLife;
  vEcology = aEcology;
  gl_Position = uViewProj * vec4(vPos, 1.0);
}`;

export const FS_GLOBE = `#version 300 es
precision highp float;
in vec3 vPos;
in vec3 vCenter;
in vec4 vMaterial;
in vec4 vTerrain;
in vec3 vLife;
in vec4 vEcology;
out vec4 outColor;
uniform vec3 uEye;
uniform float uEntropy;
uniform float uMemory;
uniform float uTime;
uniform float uPulse;
uniform float uElectricityDevelopment;
uniform vec3 uSelectedCenter;
uniform float uHasSelection;
uniform vec3 uHistoryCenter[8];
uniform int uHistoryCount;
uniform float uFixture;
uniform vec3 uFixtureColor;
void main() {
  if (uFixture > 0.5) { outColor = vec4(uFixtureColor, 1.0); return; }
  float nutrient = vMaterial.x;
  float moisture = vMaterial.y;
  float biome = vTerrain.x;
  float forest = vTerrain.y;
  float waterMaterial = vTerrain.z;
  float ridge = vTerrain.w;
  vec3 base = vec3(0.19, 0.31, 0.18);
  if (biome < 0.5) base = vec3(0.020, 0.075, 0.275);
  else if (biome < 1.5) base = vec3(0.035, 0.220, 0.405);
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
  float lakeCell = step(12.5, biome); float oceanCell = 1.0 - step(1.5, biome);
  float lakeDepth = lakeCell * clamp(waterMaterial * 12.0, 0.0, 1.0);
  float lakeShore = (1.0 - lakeCell) * step(1.5, waterMaterial);
  base = mix(base, vec3(0.025, 0.15, 0.24), lakeDepth * 0.42);
  base = mix(base, vec3(0.20, 0.39, 0.29), lakeShore * 0.30);
  base = mix(base, vec3(0.52, 0.50, 0.43), ridge * 0.20 * (1.0 - lakeCell));
  base *= 0.86 + nutrient * 0.20 + moisture * 0.05;
  float localRichness = clamp(vEcology.x / 255.0, 0.0, 1.0);
  float resourceState = floor(vEcology.y + 0.5);
  float transformState = floor(vEcology.z + 0.5);
  float powered = clamp(vEcology.w / 255.0, 0.0, 1.0);
  float waterCell = max(lakeCell, oceanCell);
  if (transformState > 2.5 && transformState < 3.5) { base = vec3(0.09, 0.34, 0.48); lakeCell = 1.0; waterCell = 1.0; }
  else if (transformState > 3.5 && transformState < 4.5) { base = vec3(0.15, 0.43, 0.31); waterCell = 0.0; }
  else if (transformState > 4.5) { base = vec3(0.06, 0.29, 0.18); waterCell = 0.0; }
  vec3 abundantTint = waterCell > 0.5 ? vec3(0.030, 0.290, 0.470) : vec3(0.37, 0.48, 0.20);
  vec3 poorTint = waterCell > 0.5 ? vec3(0.065, 0.145, 0.300) : vec3(0.37, 0.31, 0.22);
  vec3 depletedTint = waterCell > 0.5 ? vec3(0.040, 0.100, 0.230) : vec3(0.34, 0.27, 0.17);
  vec3 exhaustedTint = waterCell > 0.5 ? vec3(0.022, 0.055, 0.150) : vec3(0.19, 0.19, 0.18);
  float abundant = 1.0 - step(0.5, abs(resourceState - 1.0));
  float strainedResource = 1.0 - step(0.5, abs(resourceState - 3.0));
  float poorResource = 1.0 - step(0.5, abs(resourceState - 4.0));
  float depletedResource = 1.0 - step(0.5, abs(resourceState - 5.0));
  float exhaustedResource = 1.0 - step(0.5, abs(resourceState - 6.0));
  float recoveringResource = 1.0 - step(0.5, abs(resourceState - 7.0));
  base = mix(base, abundantTint, abundant * (0.20 + localRichness * 0.10));
  base = mix(base, vec3(dot(base, vec3(0.299,0.587,0.114))) * vec3(0.83,0.90,0.96), strainedResource * 0.30);
  base = mix(base, poorTint, poorResource * 0.55);
  base = mix(base, depletedTint, depletedResource * 0.72);
  base = mix(base, exhaustedTint, exhaustedResource * 0.82);
  base = mix(base, waterCell > 0.5 ? vec3(0.035,0.220,0.390) : vec3(0.25,0.35,0.23), recoveringResource * 0.52);
  // Evolution shares the World's cellular material scale. Its immutable fields
  // modulate a quiet substrate instead of flattening cells into owner regions.
  vec3 memorySubstrate = vec3(0.135 + nutrient * 0.13 + ridge * 0.08,
    0.145 + moisture * 0.12 + forest * 0.11,
    0.125 + (1.0 - moisture) * 0.08 + ridge * 0.04);
  base = mix(base, memorySubstrate, uMemory * 0.72);
  float stress = clamp(vLife.y, 0.0, 1.0);
  float state = floor(vLife.z + 0.5);
  float ordinary = 1.0 - uMemory;
  float stressed = (1.0 - step(0.5, abs(state - 3.0))) * ordinary;
  float critical = (1.0 - step(0.5, abs(state - 4.0))) * ordinary;
  float deadRemains = (1.0 - step(0.5, abs(state - 5.0))) * ordinary;
  float centerDot = dot(normalize(vPos), normalize(vCenter));
  float inset = smoothstep(0.9982, 0.99972, centerDot);
  float striation = 0.5 + 0.5 * sin(dot(vPos, vec3(97.0, 151.0, 73.0)) * 17.0);
  // Severe stress and remains retain restrained interior support. Ordinary
  // living/frontier state is owned by the shared edge projection instead.
  base = mix(base, vec3(0.58, 0.34, 0.22), stressed * (0.06 + stress * 0.04 + striation * 0.03));
  base = mix(base, vec3(0.66, 0.20, 0.13), critical * (0.12 + stress * 0.05 + striation * 0.05));
  base = mix(base, vec3(0.31, 0.30, 0.28), deadRemains * (0.08 + inset * 0.04));
  float atlasStatus = floor(vLife.x + 0.5);
  float atlasBranch = floor(vLife.y + 0.01);
  float atlasKind = floor(fract(vLife.y) * 10.0 + 0.5);
  float s1 = 1.0 - step(0.5, abs(atlasStatus - 1.0));
  float s2 = 1.0 - step(0.5, abs(atlasStatus - 2.0));
  float s3 = 1.0 - step(0.5, abs(atlasStatus - 3.0));
  float s4 = 1.0 - step(0.5, abs(atlasStatus - 4.0));
  float s5 = 1.0 - step(0.5, abs(atlasStatus - 5.0));
  float s6 = 1.0 - step(0.5, abs(atlasStatus - 6.0));
  float s7 = 1.0 - step(0.5, abs(atlasStatus - 7.0));
  float s8 = 1.0 - step(0.5, abs(atlasStatus - 8.0));
  float s9 = 1.0 - step(0.5, abs(atlasStatus - 9.0));
  float s10 = 1.0 - step(0.5, abs(atlasStatus - 10.0));
  float selectedStatus = clamp(s5 + s6 + s7 + s9 + s10, 0.0, 1.0);
  float lockedCell = s1 + s5;
  float unaffordableCell = s2 + s6;
  float affordableCell = s3 + s7;
  float ownedCell = s4 + s8 + s9 + s10;
  float ownedReadyCell = s8 + s10;
  float selectedReadyCell = s7 + s10;
  vec3 branchColor = vec3(0.48, 0.58, 0.47); // Foundation
  if (atlasBranch < 1.5) branchColor = vec3(0.412, 0.678, 0.408); // Fertility
  else if (atlasBranch < 2.5) branchColor = vec3(0.333, 0.749, 0.820); // Freshwater
  else if (atlasBranch < 3.5) branchColor = vec3(0.761, 0.545, 0.259); // Scarcity
  else if (atlasBranch < 4.5) branchColor = vec3(0.843, 0.929, 0.961); // Cryogenic
  else if (atlasBranch < 5.5) branchColor = vec3(0.192, 0.365, 0.659); // Marine
  else branchColor = vec3(0.847, 0.678, 0.298); // Luminous
  float fossil = fract(vLife.z); float emphasis = step(31.0, vLife.z);
  float broadGlyph = smoothstep(0.38, 0.60, abs(sin(dot(vPos, vec3(11.0, 7.0, 5.0)) * (1.0 + atlasKind * 0.12))));
  vec3 atlasBase = mix(memorySubstrate, vec3(0.30, 0.27, 0.22), fossil * 0.38);
  atlasBase = mix(atlasBase, branchColor * (0.34 + inset * 0.13), lockedCell * (0.22 + inset * 0.12));
  atlasBase = mix(atlasBase, branchColor * 0.54, unaffordableCell * (0.26 + (1.0 - inset) * 0.10));
  atlasBase = mix(atlasBase, branchColor * 0.92, affordableCell * (0.36 + inset * 0.12));
  atlasBase = mix(atlasBase, branchColor * (0.68 + broadGlyph * 0.13), ownedCell * (0.34 + inset * 0.18));
  atlasBase = mix(atlasBase, branchColor * (1.02 + inset * 0.10), ownedReadyCell * (0.17 + inset * 0.12));
  atlasBase += selectedStatus * vec3(0.19, 0.24, 0.20) * (0.24 + inset * 0.22);
  float readyCore = smoothstep(0.9970, 0.99976, centerDot);
  float readyRing = smoothstep(0.9925, 0.9972, centerDot) * (1.0 - readyCore);
  float readyPattern = step(0.58, broadGlyph) * (1.0 - readyCore);
  float readyBreath = mix(1.0, 0.84 + 0.16 * sin(uTime * 2.2), uPulse);
  atlasBase += selectedReadyCell * readyBreath * (readyCore * vec3(0.50, 0.56, 0.34)
    + readyRing * vec3(0.32, 0.38, 0.23) + readyPattern * vec3(0.08, 0.11, 0.06));
  atlasBase += emphasis * vec3(0.18, 0.22, 0.15) * inset;
  base = mix(base, atlasBase, uMemory);
  vec3 n = normalize(vPos);
  vec3 light = normalize(vec3(-0.52, 0.72, 0.44) + normalize(uEye) * 0.58);
  float diffuse = max(dot(n, light), 0.0);
  float daylight = smoothstep(-0.16, 0.14, dot(n, light));
  float darkness = 1.0 - daylight;
  vec3 viewDir = normalize(uEye - vPos);
  float rim = pow(1.0 - max(dot(n, viewDir), 0.0), 2.7);
  float plate = smoothstep(0.996, 0.9998, dot(n, normalize(vCenter)));
  vec3 col = base * (0.22 + 0.90 * diffuse) + base * plate * 0.07;
  float chargeLight = pow(powered, 0.62) * ordinary;
  vec3 chargeColor = mix(vec3(0.62, 0.43, 0.12), vec3(0.72, 0.68, 0.28), uElectricityDevelopment);
  // Powered cells retain a little day-side emission and become materially brighter in darkness.
  col += chargeLight * chargeColor * (0.22 + darkness * 0.54
    + plate * (0.22 + uElectricityDevelopment * 0.20));
  col += chargeLight * readyCore * vec3(0.28, 0.24, 0.08) * (0.18 + uElectricityDevelopment * 0.24);
  col += rim * vec3(0.08, 0.13, 0.14) * (1.0 - uEntropy * 0.5);
  for (int i = 0; i < 8; i++) {
    if (i < uHistoryCount) {
      float marked = step(0.99994, dot(normalize(vCenter), uHistoryCenter[i]));
      col = mix(col, vec3(0.96, 0.73, 0.31), marked * (0.48 + plate * 0.30));
    }
  }
  float selected = uHasSelection * step(0.99994, dot(normalize(vCenter), uSelectedCenter));
  col = mix(col, vec3(0.78, 0.92, 0.84), selected * (0.34 + plate * 0.28));
  outColor = vec4(col, 1.0);
}`;
