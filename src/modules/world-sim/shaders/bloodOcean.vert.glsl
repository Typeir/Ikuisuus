/**
 * Vertex shader for Urmela's blood ocean surface — multi-octave simplex
 * noise displacement along surface normals to simulate a churning, boiling
 * ocean of blood. noise3d.glsl is prepended at runtime by BloodOceanRenderer.
 */

uniform float uTime;
uniform float uDisplacementScale;
uniform float uNoiseScale;
uniform float uNoiseSeed;
uniform float uTimeScale;

varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vNoise;

void main() {
  vec3 pos = position;

  /* Body-unique seed offset so Urmela looks different from other bodies */
  vec3 seedOffset = vec3(uNoiseSeed * 0.0100, uNoiseSeed * 0.0137, uNoiseSeed * 0.0073);

  /* Three-octave noise: coarse boil + mid churn + fine surface tension */
  vec3 coord = pos * uNoiseScale + seedOffset;
  float n1 = snoise(coord + vec3(uTime * uTimeScale * 0.40, 0.0, 0.0));
  float n2 = snoise(coord * 2.30 + vec3(0.0, uTime * uTimeScale * 0.70, 0.0)) * 0.45;
  float n3 = snoise(coord * 5.10 + vec3(0.0, 0.0, uTime * uTimeScale * 1.20)) * 0.20;
  float disp = n1 + n2 + n3;

  vNoise = disp;

  /* Displace along surface normal — boiling ocean heave */
  pos += normal * disp * uDisplacementScale;

  vNormal = normalize(normalMatrix * normal);
  vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
