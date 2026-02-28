/**
 * Vertex shader for ring world torus rings.
 * Applies noise-based surface displacement for rocky, crystalline texture.
 * noise3d.glsl is prepended at build time by RingWorldRenderer.
 */

uniform float uTime;
uniform float uNoiseScale;
uniform float uDisplacementScale;

varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vElevation;

void main() {
  vec3 pos = position;

  /* Multi-octave noise for craggy ring surface */
  vec3 noiseCoord = pos * uNoiseScale + vec3(uTime * 0.01);
  float n1 = snoise(noiseCoord) * 0.5;
  float n2 = snoise(noiseCoord * 2.4 + vec3(3.7, 1.2, 5.8)) * 0.3;
  float n3 = snoise(noiseCoord * 5.1 + vec3(7.3, 2.9, 0.4)) * 0.2;
  float elevation = n1 + n2 + n3;

  vElevation = elevation;

  /* Displace along surface normal for rough rocky texture */
  pos += normal * elevation * uDisplacementScale;

  vNormal = normalize(mat3(modelMatrix) * normal);
  vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
