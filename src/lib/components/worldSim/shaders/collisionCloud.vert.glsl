/**
 * Vertex shader for the Länsihenki × Itähenki collision cloud effect —
 * multi-octave simplex noise displacement along surface normals to produce
 * an organic, billowing cloud shape. noise3d.glsl is prepended at runtime
 * by CollisionCloudEffect.
 */

uniform float uTime;
uniform float uDisplacementScale;
uniform float uNoiseScale;
uniform float uNoiseOffset;

varying vec3 vNormal;
varying float vNoise;

void main() {
  vec3 pos = position;

  /* Three-octave noise: coarse billow + mid churn + fine wisp.
     uNoiseOffset decorrelates russian-doll shells so they don't share
     silhouettes. */
  vec3 coord = pos * uNoiseScale + vec3(uNoiseOffset);
  float n1 = snoise(coord + vec3(uTime * 0.18, 0.0, 0.0));
  float n2 = snoise(coord * 2.10 + vec3(0.0, uTime * 0.32, 0.0)) * 0.50;
  float n3 = snoise(coord * 4.70 + vec3(0.0, 0.0, uTime * 0.55)) * 0.25;
  float disp = n1 + n2 + n3;

  vNoise = disp;

  /* Displace outward along surface normal for a lumpy, uneven cloud surface */
  pos += normal * disp * uDisplacementScale;

  vNormal = normalize(normalMatrix * normal);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
