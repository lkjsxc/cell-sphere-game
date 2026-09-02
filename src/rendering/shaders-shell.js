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
uniform vec2 uResolution;
uniform float uSkySeed;
uniform float uStarCount;
uniform float uShootingActive;
uniform vec4 uShootingPath;
uniform vec4 uShootingState;
float segmentDistance(vec2 point, vec2 start, vec2 end, out float along) {
  vec2 delta = end - start;
  along = clamp(dot(point - start, delta) / max(dot(delta, delta), 0.0001), 0.0, 1.0);
  return length(point - mix(start, end, along));
}
float skyHash(vec2 cell, float stream) {
  return fract(sin(dot(cell + vec2(stream * 17.13, uSkySeed * 31.71), vec2(127.1, 311.7))) * 43758.5453);
}
void main() {
  if (uFixture > 0.5) { outColor = vec4(uFixtureColor, 1.0); return; }
  vec2 p = vUv - 0.5;
  float dawn = exp(-4.8 * length(p - vec2(-0.42, -0.34)));
  float deep = smoothstep(-0.45, 0.65, p.y);
  vec3 col = mix(vec3(0.035, 0.041, 0.052), vec3(0.009, 0.014, 0.023), deep);
  col += vec3(0.16, 0.095, 0.052) * dawn * 0.18;
  float starLight = 0.0;
  if (uStarCount > 0.5) {
    vec2 starGrid = vec2(20.0, 12.0); vec2 starCell = floor(vUv * starGrid); vec2 starLocal = fract(vUv * starGrid);
    float starIdentity = skyHash(starCell, 1.0); float starChance = clamp(uStarCount / (starGrid.x * starGrid.y), 0.0, 1.0);
    vec2 starPoint = vec2(skyHash(starCell, 2.0), skyHash(starCell, 3.0)) * 0.74 + 0.13;
    float starSize = 0.55 + skyHash(starCell, 4.0) * 1.05;
    float starDistancePx = length((starLocal - starPoint) * (uResolution / starGrid));
    starLight = (1.0 - smoothstep(starSize * 0.22, starSize, starDistancePx))
      * (0.36 + skyHash(starCell, 5.0) * 0.62) * (1.0 - step(starChance, starIdentity));
  }
  col += vec3(0.61, 0.72, 0.78) * starLight * 0.72;
  if (uShootingActive > 0.5) {
    float progress = uShootingState.x;
    vec2 head = mix(uShootingPath.xy, uShootingPath.zw, progress) * uResolution;
    vec2 tail = mix(uShootingPath.xy, uShootingPath.zw, max(0.0, progress - uShootingState.w)) * uResolution;
    float along = 0.0; float distancePx = segmentDistance(vUv * uResolution, tail, head, along);
    float streak = (1.0 - smoothstep(uShootingState.y * 0.35, uShootingState.y * 2.2, distancePx))
      * smoothstep(0.0, 0.24, along) * uShootingState.z;
    col += vec3(0.70, 0.82, 0.88) * streak;
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
