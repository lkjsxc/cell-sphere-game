/** Quiet background field and atmosphere shell GLSL. */
import { STAR_STRATA } from './star-field.js';

const star = STAR_STRATA.map((value) => Object.freeze({ grid: glslPair(value.grid), size: glslPair(value.size),
  intensity: glslPair(value.intensity), opacity: glslNumber(value.opacity), halo: glslNumber(value.halo) }));
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
uniform sampler2D uDeepSpaceField;
uniform float uDeepSpaceEnabled;
uniform vec3 uStarCounts;
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
vec3 starTemperature(float value) {
  vec3 warm = vec3(0.97, 0.78, 0.61);
  vec3 neutral = vec3(0.84, 0.89, 0.91);
  vec3 cool = vec3(0.67, 0.82, 0.96);
  return value < 0.5 ? mix(warm, neutral, value * 2.0) : mix(neutral, cool, (value - 0.5) * 2.0);
}
vec3 starLayer(vec2 uv, vec2 grid, float count, float stream, vec2 sizeRange, vec2 intensityRange,
    float fieldInfluence, float haloWeight) {
  vec2 starCell = floor(uv * grid); vec2 starLocal = fract(uv * grid);
  float density = mix(0.94, 1.06, fieldInfluence);
  float chance = clamp(count / (grid.x * grid.y) * density, 0.0, 0.92);
  float present = 1.0 - step(chance, skyHash(starCell, stream));
  vec2 starPoint = vec2(skyHash(starCell, stream + 1.0), skyHash(starCell, stream + 2.0)) * 0.92 + 0.04;
  float sizePx = mix(sizeRange.x, sizeRange.y, skyHash(starCell, stream + 3.0));
  float distancePx = length((starLocal - starPoint) * (uResolution / grid));
  float core = 1.0 - smoothstep(sizePx * 0.18, sizePx, distancePx);
  float halo = (1.0 - smoothstep(sizePx, sizePx * 2.8, distancePx)) * haloWeight;
  float intensity = mix(intensityRange.x, intensityRange.y, skyHash(starCell, stream + 4.0));
  return starTemperature(skyHash(starCell, stream + 5.0)) * (core + halo) * intensity * present;
}
void main() {
  if (uFixture > 0.5) { outColor = vec4(uFixtureColor, 1.0); return; }
  float targetAspect = uResolution.x / max(1.0, uResolution.y); const float fieldAspect = 2.0;
  vec2 cropScale = targetAspect > fieldAspect ? vec2(1.0, fieldAspect / targetAspect) : vec2(targetAspect / fieldAspect, 1.0);
  vec2 fieldUv = (vUv - 0.5) * cropScale + 0.5;
  vec3 neutral = mix(vec3(0.008, 0.011, 0.016), vec3(0.002, 0.004, 0.008), smoothstep(0.05, 0.95, vUv.y));
  vec3 col = mix(neutral, texture(uDeepSpaceField, fieldUv).rgb, uDeepSpaceEnabled);
  float fieldInfluence = smoothstep(0.002, 0.025, dot(col, vec3(0.2126, 0.7152, 0.0722)));
  col += starLayer(vUv, vec2(${star[0].grid}), uStarCounts.x, 11.0, vec2(${star[0].size}),
    vec2(${star[0].intensity}), fieldInfluence, ${star[0].halo}) * ${star[0].opacity};
  col += starLayer(vUv, vec2(${star[1].grid}), uStarCounts.y, 31.0, vec2(${star[1].size}),
    vec2(${star[1].intensity}), fieldInfluence, ${star[1].halo}) * ${star[1].opacity};
  col += starLayer(vUv, vec2(${star[2].grid}), uStarCounts.z, 59.0, vec2(${star[2].size}),
    vec2(${star[2].intensity}), fieldInfluence, ${star[2].halo}) * ${star[2].opacity};
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

function glslPair(values) { return values.map(glslNumber).join(', '); }
function glslNumber(value) { return Number(value).toFixed(4); }
