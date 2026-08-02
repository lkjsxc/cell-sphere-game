/** Quiet cell etching plus distinct coast and static drainage ribbons. */
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
  float facing = smoothstep(0.01, 0.66, dot(n, viewDir));
  float river = vFeature.x;
  float detail = vFeature.y;
  vec3 quiet = vec3(0.50, 0.56, 0.51);
  vec3 coast = vec3(0.27, 0.48, 0.52);
  vec3 water = mix(vec3(0.16, 0.55, 0.68), vec3(0.36, 0.75, 0.82), detail);
  vec3 color = mix(quiet, coast, detail * (1.0 - river));
  color = mix(color, water, river);
  float alpha = mix(0.10, 0.34, detail * (1.0 - river));
  alpha = mix(alpha, 0.74 + detail * 0.20, river);
  outColor = vec4(color, facing * alpha * (1.0 - uEntropy * 0.28));
}`;
