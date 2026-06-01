/**
 * Vertex shader for icy celestial cores (Mana).
 * Applies multi-octave noise for craggy ice fracture displacement.
 * noise3d.glsl is prepended at build time by RingWorldRenderer.
 */

uniform float uTime;
uniform float uDisplacementScale;

varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vElevation;

void main() {
  vec3 pos = position;

  /* Icy fracture noise — sharp ridges via abs() trick */
  vec3 noiseCoord = pos * 0.15 + vec3(uTime * 0.005);
  float n1 = abs(snoise(noiseCoord)) * 0.5;
  float n2 = abs(snoise(noiseCoord * 2.8 + vec3(3.1, 7.2, 1.4))) * 0.3;
  float n3 = snoise(noiseCoord * 6.0 + vec3(1.5, 4.8, 9.2)) * 0.2;
  float elevation = n1 + n2 + n3;

  vElevation = elevation;

  pos += normal * elevation * uDisplacementScale;

  vNormal = normalize(normalMatrix * normal);
  vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
