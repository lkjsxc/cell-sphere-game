/** Closed cell-edge etching with facing, light, and zoom-aware attenuation. */
import { LIFE_EDGE_RELATION, LIFE_EDGE_STATE } from './life-edges.js';
import { EVOLUTION_TERRITORY_EDGE } from '../game/skills/territories.js';

export const VS_BOUNDARY = `#version 300 es
uniform mat4 uViewProj;
in vec3 aPos;
in vec2 aFeature;
in float aLifeEdge;
out vec3 vPos;
out vec2 vFeature;
flat out vec2 vLifeEdge;
void main() {
  vPos = aPos;
  vFeature = aFeature;
  float code = floor(aLifeEdge + 0.5);
  vLifeEdge = vec2(mod(code, 8.0), floor(code / 8.0));
  gl_Position = uViewProj * vec4(aPos, 1.0);
}`;

export const FS_BOUNDARY = `#version 300 es
precision mediump float;
in vec3 vPos;
in vec2 vFeature;
flat in vec2 vLifeEdge;
out vec4 outColor;
uniform vec3 uEye;
uniform float uEntropy;
uniform float uMemory;
void main() {
  vec3 n = normalize(vPos);
  vec3 viewDir = normalize(uEye - vPos);
  float facing = smoothstep(0.12, 0.72, dot(n, viewDir));
  float lakeEdge = vFeature.x; float oceanEdge = vFeature.y;
  float detail = max(lakeEdge, oceanEdge);
  float closeView = 1.0 - smoothstep(3.25, 6.1, length(uEye));
  float lightSide = smoothstep(-0.28, 0.30, dot(n, normalize(vec3(-0.52, 0.72, 0.44))));
  vec3 geographyColor = mix(vec3(0.45, 0.51, 0.47), vec3(0.16, 0.37, 0.43), lakeEdge);
  geographyColor = mix(geographyColor, vec3(0.25, 0.45, 0.49), oceanEdge);
  float geographyAlpha = mix(0.055, 0.22, detail) * mix(0.42, 1.0, closeView);
  geographyAlpha *= mix(0.28, 1.0, lightSide) * (1.0 - uEntropy * 0.30);

  float state = vLifeEdge.x; float relation = vLifeEdge.y;
  if (uMemory > 0.5) {
    vec3 territoryColor = vec3(0.64, 0.68, 0.62); float territoryAlpha = 0.0;
    if (state > ${EVOLUTION_TERRITORY_EDGE.INTERNAL}.5 && state < ${EVOLUTION_TERRITORY_EDGE.EMPHASIZED}.5) {
      territoryColor = vec3(0.72, 0.75, 0.67); territoryAlpha = 0.48;
    } else if (state > ${EVOLUTION_TERRITORY_EDGE.BOUNDARY}.5 && state < ${EVOLUTION_TERRITORY_EDGE.SELECTED}.5) {
      territoryColor = vec3(0.91, 0.79, 0.43); territoryAlpha = 0.72;
    } else if (state > ${EVOLUTION_TERRITORY_EDGE.EMPHASIZED}.5) {
      territoryColor = vec3(0.89, 0.97, 0.91); territoryAlpha = 0.96;
    }
    territoryAlpha *= mix(0.68, 1.0, closeView) * mix(0.72, 1.0, lightSide);
    vec3 territoryComposite = territoryAlpha > 0.0 ? territoryColor : geographyColor;
    float territoryCompositeAlpha = max(geographyAlpha, territoryAlpha);
    outColor = vec4(territoryComposite, facing * territoryCompositeAlpha); return;
  }
  vec3 lifeColor = geographyColor; float lifeAlpha = 0.0;
  bool exposed = relation > ${LIFE_EDGE_RELATION.INTERNAL}.5;
  if (state > ${LIFE_EDGE_STATE.NONE}.5 && state < ${LIFE_EDGE_STATE.LIVING}.5) {
    lifeColor = exposed ? vec3(0.78, 0.66, 0.30) : vec3(0.50, 0.57, 0.29);
    lifeAlpha = exposed ? 0.48 : 0.15;
  } else if (state < ${LIFE_EDGE_STATE.STRESSED}.5 && state > ${LIFE_EDGE_STATE.LIVING}.5) {
    lifeColor = vec3(0.82, 0.45, 0.20); lifeAlpha = exposed ? 0.68 : 0.43;
  } else if (state < ${LIFE_EDGE_STATE.CRITICAL}.5 && state > ${LIFE_EDGE_STATE.STRESSED}.5) {
    lifeColor = vec3(0.98, 0.57, 0.25); lifeAlpha = exposed ? 0.88 : 0.67;
  } else if (state > ${LIFE_EDGE_STATE.CRITICAL}.5) {
    lifeColor = vec3(0.34, 0.30, 0.27); lifeAlpha = 0.34;
  }
  lifeAlpha *= mix(0.58, 1.0, closeView) * mix(0.62, 1.0, lightSide) * (1.0 - uEntropy * 0.18);

  // Geography keeps a fixed share on coincident dynamic edges; neither
  // semantic silently overwrites the other in this single existing pass.
  vec3 color = lifeAlpha > 0.0 ? lifeColor : geographyColor;
  if (lifeAlpha > 0.0 && detail > 0.0) color = mix(color, geographyColor, 0.38);
  float alpha = max(geographyAlpha, lifeAlpha);
  outColor = vec4(color, facing * alpha);
}`;
