/**
 * Vertex shader for the star surface — turbulent simplex noise
 * displacement for a roiling, convective solar surface look.
 * noise3d.glsl is prepended at build time by StarRenderer.
 */

uniform float uTime;
uniform float uDisplacementScale;

varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vDisplacement;

void main() {
  vec3 pos = position;

  /* Multi-octave noise for turbulent solar surface */
  vec3 noiseCoord = pos * 0.06 + vec3(uTime * 0.08);
  float n1 = snoise(noiseCoord) * 0.5;
  float n2 = snoise(noiseCoord * 2.1 + vec3(5.3, 1.7, 8.1)) * 0.3;
  float n3 = snoise(noiseCoord * 4.7 + vec3(2.1, 7.3, 3.9)) * 0.2;
  float disp = n1 + n2 + n3;

  vDisplacement = disp;

  /* Displace along surface normal */
  pos += normal * disp * uDisplacementScale;

  vNormal = normalize(normalMatrix * normal);
  vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
