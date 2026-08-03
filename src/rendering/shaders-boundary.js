/** Closed cell-edge etching with facing, light, and zoom-aware attenuation. */
export const VS_BOUNDARY = `#version 300 es
uniform mat4 uViewProj;
in vec3 aPos;
in vec2 aFeature;
out vec3 vPos;
out vec2 vFeature;
void main() {
  vPos = aPos;
  vFeature = aFeature;
  gl_Position = uViewProj * vec4(aPos, 1.0);
}`;

export const FS_BOUNDARY = `#version 300 es
precision mediump float;
in vec3 vPos;
in vec2 vFeature;
out vec4 outColor;
uniform vec3 uEye;
uniform float uEntropy;
void main() {
  vec3 n = normalize(vPos);
  vec3 viewDir = normalize(uEye - vPos);
  float facing = smoothstep(0.12, 0.72, dot(n, viewDir));
  float detail = vFeature.y;
  float closeView = 1.0 - smoothstep(3.25, 6.1, length(uEye));
  float lightSide = smoothstep(-0.28, 0.30, dot(n, normalize(vec3(-0.52, 0.72, 0.44))));
  vec3 color = mix(vec3(0.45, 0.51, 0.47), vec3(0.25, 0.45, 0.49), detail);
  float alpha = mix(0.055, 0.22, detail) * mix(0.42, 1.0, closeView);
  alpha *= mix(0.28, 1.0, lightSide) * (1.0 - uEntropy * 0.30);
  outColor = vec4(color, facing * alpha);
}`;
