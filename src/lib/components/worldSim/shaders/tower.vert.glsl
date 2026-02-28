/**
 * Vertex shader for tower world cylinder segments and orbiting pillars.
 * Applies noise-based surface displacement for ancient carved stone texture.
 * noise3d.glsl is prepended at build time by TowerWorldRenderer.
 */

uniform float uTime;
uniform float uNoiseScale;
uniform float uDisplacementScale;

varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vElevation;
varying float vHeight;

void main() {
  vec3 pos = position;

  /* Normalised height along the cylinder (-0.5 to 0.5 mapped to 0..1) */
  vHeight = clamp(pos.y * 0.5 + 0.5, 0.0, 1.0);

  /* Multi-octave noise for carved stone surface */
  vec3 noiseCoord = pos * uNoiseScale + vec3(uTime * 0.003);

  /* Vertical striations — stretch noise along Y for column-like ridges */
  vec3 striated = vec3(noiseCoord.x * 2.0, noiseCoord.y * 0.3, noiseCoord.z * 2.0);
  float n1 = snoise(striated) * 0.5;
  float n2 = snoise(striated * 3.1 + vec3(2.4, 7.1, 4.3)) * 0.3;
  float n3 = snoise(noiseCoord * 6.0 + vec3(1.1, 3.8, 9.5)) * 0.2;
  float elevation = n1 + n2 + n3;

  vElevation = elevation;

  pos += normal * elevation * uDisplacementScale;

  vNormal = normalize(mat3(modelMatrix) * normal);
  vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
