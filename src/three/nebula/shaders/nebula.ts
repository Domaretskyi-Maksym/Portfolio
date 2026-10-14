import { simplexNoise3D } from './simplexNoise'

export const nebulaVertexShader = /* glsl */ `
uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;
uniform float uRadius;
uniform vec3 uMouse;
uniform float uMouseRadius;
uniform float uMouseStrength;
uniform float uBurst;
uniform vec3 uColorDeep;
uniform vec3 uColorMid;
uniform vec3 uColorHot;

attribute float aScale;
attribute float aRandom;

varying vec3 vColor;
varying float vAlpha;

${simplexNoise3D}

void main() {
  vec3 pos = position;
  vec3 radial = normalize(position + 1e-5);
  float t = uTime * 0.12;

  float breath = snoise(position * 0.18 + vec3(t));
  pos += radial * breath * 0.8;

  vec3 drift = vec3(
    snoise(pos * 0.35 + vec3(t, 0.0, 0.0)),
    snoise(pos * 0.35 + vec3(0.0, t + 17.0, 0.0)),
    snoise(pos * 0.35 + vec3(0.0, 0.0, t + 31.0))
  );
  pos += drift * (0.35 + aRandom * 0.35);

  pos += radial * uBurst * (2.0 + aRandom * 6.0);

  vec4 worldPosition = modelMatrix * vec4(pos, 1.0);

  vec3 away = worldPosition.xyz - uMouse;
  float influence = 1.0 - smoothstep(0.0, uMouseRadius, length(away));
  influence *= influence;
  worldPosition.xyz += normalize(away + 1e-5) * influence * uMouseStrength;

  vec4 viewPosition = viewMatrix * worldPosition;
  gl_Position = projectionMatrix * viewPosition;

  float depth = max(-viewPosition.z, 0.001);
  gl_PointSize = min(uSize * aScale * uPixelRatio / depth, 48.0 * uPixelRatio);

  float r = clamp(length(position) / uRadius, 0.0, 1.0);
  vec3 color = mix(uColorHot, uColorMid, smoothstep(0.0, 0.45, r));
  color = mix(color, uColorDeep, smoothstep(0.4, 1.0, r));
  color += vec3(0.12, 0.02, 0.2) * clamp(pos.y / uRadius, -1.0, 1.0);
  color = mix(color, uColorHot, influence * 0.6);
  vColor = color;

  // Particles brushing the lens would become giant blobs during the dive.
  vAlpha = smoothstep(0.15, 1.2, depth) * (0.25 + aRandom * 0.35);
}
`

export const nebulaFragmentShader = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;

void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;

  float strength = pow(1.0 - d * 2.0, 2.2);
  gl_FragColor = vec4(vColor, strength * vAlpha);

  #include <colorspace_fragment>
}
`
